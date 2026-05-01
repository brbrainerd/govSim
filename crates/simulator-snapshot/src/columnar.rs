//! Columnar snapshot: serialize/deserialize the full ECS state to/from a
//! compressed bincode blob. Used by `ugs replay` and CI regression tests.
//!
//! Layout (bincode little-endian):
//!   SnapshotHeader  — version, tick, seed, citizen count, initial_population
//!   CitizenRow[]    — one row per citizen, sorted by CitizenId
//!   ResourceBlock   — Treasury + MacroIndicators
//!   GraphBlock      — InfluenceGraph CSR (row_ptr[], col_ind[], weights[])
//!
//! The blob is zstd-compressed at level 3 (fast, ~5:1 ratio on typical data).

use bevy_ecs::world::World;
use serde::{Deserialize, Serialize};
use simulator_core::{
    MacroIndicators, SimClock, SimRng, Treasury,
    components::{
        Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus, EvasionPropensity, Health,
        IdeologyVector, Income, LegalStatuses, Location, Productivity, Sex, Wealth,
    },
};
use simulator_net::graph::InfluenceGraph;
use simulator_net::csr::CsrMatrix;
use simulator_types::{CitizenId, Money, RegionId, Score};

use crate::SnapshotError;

const SNAPSHOT_VERSION: u32 = 5;

#[derive(Serialize, Deserialize)]
struct SnapshotHeader {
    version: u32,
    tick: u64,
    seed: [u8; 32],
    n_citizens: u64,
    /// Original spawn population — used to rebuild influence graph on load
    /// even if births/deaths have changed n_citizens since spawn.
    initial_population: u64,
}

#[derive(Serialize, Deserialize)]
struct CitizenRow {
    id: u64,
    age: u8,
    sex: u8,        // 0=Female, 1=Male, 2=Other
    region: u32,
    health: u32,    // Score bits
    income: i128,   // Money bits (I64F64)
    wealth: i128,
    employment: u8, // 0=Employed,1=Unemployed,2=OOL,3=Student,4=Retired
    productivity: u32,
    ideology: [f32; 5],
    legal_flags: u32,
    audit_flags: u32,
    approval: u32,  // Score bits
    evasion_propensity: f32,
}

#[derive(Serialize, Deserialize)]
struct ResourceBlock {
    treasury: i128,
    population: u64,
    gdp: i128,
    gini: f32,
    unemployment: f32,
    inflation: f32,
    approval: f32,
    government_revenue: i128,
    government_expenditure: i128,
    incumbent_party: u8,
    last_election_tick: u64,
    election_margin: f32,
    consecutive_terms: u32,
}

#[derive(Serialize, Deserialize)]
struct GraphBlock {
    n: u64,
    row_ptr: Vec<u32>,
    col_ind: Vec<u32>,
    weights: Vec<f32>,
}

/// Serialize the world to a zstd-compressed bincode snapshot.
pub fn save_snapshot(world: &mut World) -> Result<Vec<u8>, SnapshotError> {
    let clock = world.resource::<SimClock>().clone();
    let rng   = world.resource::<SimRng>().clone();
    let treasury = world.resource::<Treasury>().clone();
    let macro_ = world.resource::<MacroIndicators>().clone();

    let mut rows: Vec<CitizenRow> = world
        .query::<(
            &Citizen, &Age, &Sex, &Location, &Health,
            &Income, &Wealth, &EmploymentStatus, &Productivity,
            &IdeologyVector, &LegalStatuses, &AuditFlags, &ApprovalRating,
            &EvasionPropensity,
        )>()
        .iter(world)
        .map(|(c, a, s, l, h, i, w, e, p, iv, ls, af, ar, ep)| CitizenRow {
            id:                 c.0.0,
            age:                a.0,
            sex:                *s as u8,
            region:             l.0.0,
            health:             h.0.to_bits(),
            income:             i.0.to_bits(),
            wealth:             w.0.to_bits(),
            employment:         employment_to_u8(e),
            productivity:       p.0.to_bits(),
            ideology:           iv.0,
            legal_flags:        ls.0.bits(),
            audit_flags:        af.0.bits(),
            approval:           ar.0.to_bits(),
            evasion_propensity: ep.0,
        })
        .collect();

    rows.sort_by_key(|r| r.id);

    // Read InfluenceGraph if present (may be absent in bench/empty worlds).
    let graph_block = world.get_resource::<InfluenceGraph>().map(|g| GraphBlock {
        n:       g.csr.n_rows as u64,
        row_ptr: g.csr.row_ptr.clone(),
        col_ind: g.csr.col_ind.clone(),
        weights: g.csr.weights.clone(),
    });

    // initial_population: if graph is present, its row count is the spawn-time
    // population (graph is built once at spawn and never resized).
    let initial_population = graph_block.as_ref().map_or(rows.len() as u64, |g| g.n);

    let header = SnapshotHeader {
        version: SNAPSHOT_VERSION,
        tick: clock.tick,
        seed: rng.root_seed(),
        n_citizens: rows.len() as u64,
        initial_population,
    };

    let resources = ResourceBlock {
        treasury:               treasury.balance.to_bits(),
        population:             macro_.population,
        gdp:                    macro_.gdp.to_bits(),
        gini:                   macro_.gini,
        unemployment:           macro_.unemployment,
        inflation:              macro_.inflation,
        approval:               macro_.approval,
        government_revenue:     macro_.government_revenue.to_bits(),
        government_expenditure: macro_.government_expenditure.to_bits(),
        incumbent_party:        macro_.incumbent_party,
        last_election_tick:     macro_.last_election_tick,
        election_margin:        macro_.election_margin,
        consecutive_terms:      macro_.consecutive_terms,
    };

    // Encode with bincode then compress.
    let mut raw: Vec<u8> = Vec::new();
    encode_into(&header, &mut raw)?;
    encode_into(&rows, &mut raw)?;
    encode_into(&resources, &mut raw)?;
    encode_into(&graph_block, &mut raw)?;

    let compressed = zstd::encode_all(raw.as_slice(), 3)
        .map_err(|e| SnapshotError::Io(e.to_string()))?;
    Ok(compressed)
}

/// Deserialize a compressed snapshot and restore world resources + citizens.
///
/// Returns `(n_citizens, initial_population)`.
/// Caller should insert `InfluenceGraph` from the snapshot directly (it is
/// embedded) rather than calling `build_influence_graph` again.
pub fn load_snapshot(world: &mut World, blob: &[u8]) -> Result<(u64, u64), SnapshotError> {
    let raw = zstd::decode_all(blob)
        .map_err(|e| SnapshotError::Io(e.to_string()))?;
    let mut cursor = raw.as_slice();

    let header: SnapshotHeader = decode_from(&mut cursor)?;
    if header.version != SNAPSHOT_VERSION {
        return Err(SnapshotError::VersionMismatch {
            found: header.version,
            expected: SNAPSHOT_VERSION,
        });
    }

    let rows: Vec<CitizenRow> = decode_from(&mut cursor)?;
    let resources: ResourceBlock = decode_from(&mut cursor)?;
    let graph_block: Option<GraphBlock> = decode_from(&mut cursor)?;

    // Restore resources.
    {
        let mut clock = world.resource_mut::<SimClock>();
        clock.tick = header.tick;
        clock.date = simulator_types::SimDate::from_tick(header.tick);
    }
    {
        let mut treasury = world.resource_mut::<Treasury>();
        treasury.balance = Money::from_bits(resources.treasury);
    }
    {
        let mut macro_ = world.resource_mut::<MacroIndicators>();
        macro_.population             = resources.population;
        macro_.gdp                    = Money::from_bits(resources.gdp);
        macro_.gini                   = resources.gini;
        macro_.unemployment           = resources.unemployment;
        macro_.inflation              = resources.inflation;
        macro_.approval               = resources.approval;
        macro_.government_revenue     = Money::from_bits(resources.government_revenue);
        macro_.government_expenditure = Money::from_bits(resources.government_expenditure);
        macro_.incumbent_party        = resources.incumbent_party;
        macro_.last_election_tick     = resources.last_election_tick;
        macro_.election_margin        = resources.election_margin;
        macro_.consecutive_terms      = resources.consecutive_terms;
    }

    // Restore influence graph if present.
    if let Some(g) = graph_block {
        let n = g.n as usize;
        let graph = InfluenceGraph {
            csr: CsrMatrix {
                row_ptr: g.row_ptr,
                col_ind: g.col_ind,
                weights: g.weights,
                n_rows: n,
                n_cols: n,
            },
        };
        world.insert_resource(graph);
    }

    // Spawn citizens.
    use simulator_core::components::*;
    for r in &rows {
        world.spawn((
            Citizen(CitizenId(r.id)),
            Age(r.age),
            sex_from_u8(r.sex),
            Location(RegionId(r.region)),
            Health(Score::from_bits(r.health)),
            Income(Money::from_bits(r.income)),
            Wealth(Money::from_bits(r.wealth)),
            employment_from_u8(r.employment),
            Productivity(Score::from_bits(r.productivity)),
            IdeologyVector(r.ideology),
            ApprovalRating(Score::from_bits(r.approval)),
            LegalStatuses(LegalStatusFlags::from_bits_truncate(r.legal_flags)),
            AuditFlags(AuditFlagBits::from_bits_truncate(r.audit_flags)),
            EvasionPropensity(r.evasion_propensity),
        ));
    }

    Ok((header.n_citizens, header.initial_population))
}

// ---- helpers ---------------------------------------------------------------

fn encode_into<T: Serialize>(val: &T, buf: &mut Vec<u8>) -> Result<(), SnapshotError> {
    let bytes = bincode::serde::encode_to_vec(val, bincode::config::standard())
        .map_err(|e| SnapshotError::Encode(e.to_string()))?;
    buf.extend_from_slice(&bytes);
    Ok(())
}

fn decode_from<T: for<'de> Deserialize<'de>>(buf: &mut &[u8]) -> Result<T, SnapshotError> {
    let (val, consumed) = bincode::serde::decode_from_slice(buf, bincode::config::standard())
        .map_err(|e| SnapshotError::Decode(e.to_string()))?;
    *buf = &buf[consumed..];
    Ok(val)
}

fn employment_to_u8(e: &EmploymentStatus) -> u8 {
    match e {
        EmploymentStatus::Employed        => 0,
        EmploymentStatus::Unemployed      => 1,
        EmploymentStatus::OutOfLaborForce => 2,
        EmploymentStatus::Student         => 3,
        EmploymentStatus::Retired         => 4,
    }
}

fn employment_from_u8(v: u8) -> EmploymentStatus {
    match v {
        0 => EmploymentStatus::Employed,
        1 => EmploymentStatus::Unemployed,
        2 => EmploymentStatus::OutOfLaborForce,
        3 => EmploymentStatus::Student,
        _ => EmploymentStatus::Retired,
    }
}

fn sex_from_u8(v: u8) -> Sex {
    match v {
        0 => Sex::Female,
        1 => Sex::Male,
        _ => Sex::Other,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;

    #[test]
    fn save_load_round_trip_tick() {
        let mut sim = Sim::new([1u8; 32]);
        // Run a few ticks with an empty world (no citizens needed for the tick test).
        for _ in 0..5 { sim.step(); }
        let blob = save_snapshot(&mut sim.world).expect("save");
        assert!(!blob.is_empty());

        // Fresh sim — restore into it.
        let mut sim2 = Sim::new([0u8; 32]);
        let (n, _init) = load_snapshot(&mut sim2.world, &blob).expect("load");
        assert_eq!(n, 0);
        assert_eq!(sim2.world.resource::<SimClock>().tick, 5);
        assert_eq!(
            sim2.world.resource::<Treasury>().balance,
            sim.world.resource::<Treasury>().balance
        );
    }
}
