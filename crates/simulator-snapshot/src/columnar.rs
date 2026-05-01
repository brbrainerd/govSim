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
    CrisisKind, CrisisState, LegitimacyDebt, MacroIndicators, PollutionStock, PriceLevel,
    RightsLedger, SimClock, SimRng, Treasury,
    components::{
        Age, ApprovalRating, AuditFlags, Citizen, ConsumptionExpenditure, EmploymentStatus,
        EvasionPropensity, Health, IdeologyVector, Income, LegalStatuses, Location,
        Productivity, SavingsRate, Sex, Wealth,
    },
};
use simulator_net::graph::InfluenceGraph;
use simulator_net::csr::CsrMatrix;
use simulator_types::{CitizenId, Money, RegionId, Score};

use crate::SnapshotError;

const SNAPSHOT_VERSION: u32 = 10;

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
    consumption: i128,  // Money bits (monthly ConsumptionExpenditure)
    savings_rate: f32,
}

#[derive(Serialize, Deserialize)]
struct ResourceBlock {
    treasury: i128,
    population: u64,
    gdp: i128,
    gini: f32,
    wealth_gini: f32,
    unemployment: f32,
    inflation: f32,
    approval: f32,
    government_revenue: i128,
    government_expenditure: i128,
    incumbent_party: u8,
    last_election_tick: u64,
    election_margin: f32,
    consecutive_terms: u32,
    price_level: f64,
    // v10 additions
    legitimacy_debt_stock: f32,
    legitimacy_debt_decay: f32,
    rights_granted: u32,
    rights_historical_max: u32,
    rights_last_expansion_tick: u64,
    crisis_kind: u8,
    crisis_remaining_ticks: u64,
    crisis_cost_multiplier: f32,
    pollution_stock: f64,
    pollution_decay: f64,
    pollution_emission_rate: f64,
}

#[derive(Serialize, Deserialize)]
struct GraphBlock {
    n: u64,
    row_ptr: Vec<u32>,
    col_ind: Vec<u32>,
    weights: Vec<f32>,
}

fn crisis_kind_to_u8(k: CrisisKind) -> u8 {
    match k {
        CrisisKind::None            => 0,
        CrisisKind::War             => 1,
        CrisisKind::Pandemic        => 2,
        CrisisKind::Recession       => 3,
        CrisisKind::NaturalDisaster => 4,
    }
}

fn crisis_kind_from_u8(v: u8) -> CrisisKind {
    match v {
        1 => CrisisKind::War,
        2 => CrisisKind::Pandemic,
        3 => CrisisKind::Recession,
        4 => CrisisKind::NaturalDisaster,
        _ => CrisisKind::None,
    }
}

/// Serialize the world to a zstd-compressed bincode snapshot.
pub fn save_snapshot(world: &mut World) -> Result<Vec<u8>, SnapshotError> {
    let clock = world.resource::<SimClock>().clone();
    let rng   = world.resource::<SimRng>().clone();
    let treasury = world.resource::<Treasury>().clone();
    let macro_ = world.resource::<MacroIndicators>().clone();

    // Split into nested tuples to stay within Bevy's 15-element tuple limit.
    let mut rows: Vec<CitizenRow> = world
        .query::<(
            (&Citizen, &Age, &Sex, &Location, &Health, &Income, &Wealth, &EmploymentStatus),
            (&Productivity, &IdeologyVector, &LegalStatuses, &AuditFlags, &ApprovalRating,
             &EvasionPropensity, &ConsumptionExpenditure, &SavingsRate),
        )>()
        .iter(world)
        .map(|((c, a, s, l, h, i, w, e), (p, iv, ls, af, ar, ep, ce, sr))| CitizenRow {
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
            consumption:        ce.0.to_bits(),
            savings_rate:       sr.0,
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

    let price_level  = world.resource::<PriceLevel>().level;
    let debt         = world.resource::<LegitimacyDebt>().clone();
    let rights       = world.resource::<RightsLedger>().clone();
    let crisis       = world.resource::<CrisisState>().clone();
    let pollution    = world.resource::<PollutionStock>().clone();

    let resources = ResourceBlock {
        treasury:               treasury.balance.to_bits(),
        population:             macro_.population,
        gdp:                    macro_.gdp.to_bits(),
        gini:                   macro_.gini,
        wealth_gini:            macro_.wealth_gini,
        unemployment:           macro_.unemployment,
        inflation:              macro_.inflation,
        approval:               macro_.approval,
        government_revenue:     macro_.government_revenue.to_bits(),
        government_expenditure: macro_.government_expenditure.to_bits(),
        incumbent_party:        macro_.incumbent_party,
        last_election_tick:     macro_.last_election_tick,
        election_margin:        macro_.election_margin,
        consecutive_terms:      macro_.consecutive_terms,
        price_level,
        legitimacy_debt_stock:       debt.stock,
        legitimacy_debt_decay:       debt.decay,
        rights_granted:              rights.granted.bits(),
        rights_historical_max:       rights.historical_max.bits(),
        rights_last_expansion_tick:  rights.last_expansion_tick,
        crisis_kind:                 crisis_kind_to_u8(crisis.kind),
        crisis_remaining_ticks:      crisis.remaining_ticks,
        crisis_cost_multiplier:      crisis.cost_multiplier,
        pollution_stock:             pollution.stock,
        pollution_decay:             pollution.decay,
        pollution_emission_rate:     pollution.emission_rate,
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
        macro_.wealth_gini            = resources.wealth_gini;
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
    {
        let mut pl = world.resource_mut::<PriceLevel>();
        pl.level = resources.price_level;
    }
    {
        let mut debt = world.resource_mut::<LegitimacyDebt>();
        debt.stock = resources.legitimacy_debt_stock;
        debt.decay = resources.legitimacy_debt_decay;
    }
    {
        use simulator_core::CivicRights;
        let mut rights = world.resource_mut::<RightsLedger>();
        rights.granted              = CivicRights::from_bits_truncate(resources.rights_granted);
        rights.historical_max       = CivicRights::from_bits_truncate(resources.rights_historical_max);
        rights.last_expansion_tick  = resources.rights_last_expansion_tick;
    }
    {
        let mut crisis = world.resource_mut::<CrisisState>();
        crisis.kind              = crisis_kind_from_u8(resources.crisis_kind);
        crisis.remaining_ticks   = resources.crisis_remaining_ticks;
        crisis.cost_multiplier   = resources.crisis_cost_multiplier;
    }
    {
        let mut pollution = world.resource_mut::<PollutionStock>();
        pollution.stock         = resources.pollution_stock;
        pollution.decay         = resources.pollution_decay;
        pollution.emission_rate = resources.pollution_emission_rate;
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

    // Spawn citizens. Nested tuples stay within Bevy's 15-element Bundle limit.
    use simulator_core::components::*;
    for r in &rows {
        world.spawn(((
            Citizen(CitizenId(r.id)),
            Age(r.age),
            sex_from_u8(r.sex),
            Location(RegionId(r.region)),
            Health(Score::from_bits(r.health)),
            Income(Money::from_bits(r.income)),
            Wealth(Money::from_bits(r.wealth)),
            employment_from_u8(r.employment),
        ), (
            Productivity(Score::from_bits(r.productivity)),
            IdeologyVector(r.ideology),
            ApprovalRating(Score::from_bits(r.approval)),
            LegalStatuses(LegalStatusFlags::from_bits_truncate(r.legal_flags)),
            AuditFlags(AuditFlagBits::from_bits_truncate(r.audit_flags)),
            EvasionPropensity(r.evasion_propensity),
            ConsumptionExpenditure(Money::from_bits(r.consumption)),
            SavingsRate(r.savings_rate),
        )));
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
        for _ in 0..5 { sim.step(); }
        let blob = save_snapshot(&mut sim.world).expect("save");
        assert!(!blob.is_empty());

        let mut sim2 = Sim::new([0u8; 32]);
        let (n, _init) = load_snapshot(&mut sim2.world, &blob).expect("load");
        assert_eq!(n, 0);
        assert_eq!(sim2.world.resource::<SimClock>().tick, 5);
        assert_eq!(
            sim2.world.resource::<Treasury>().balance,
            sim.world.resource::<Treasury>().balance
        );
    }

    #[test]
    fn save_load_preserves_new_resources() {
        use simulator_core::{CivicRights, CrisisKind, CrisisState, LegitimacyDebt,
                             PollutionStock, RightsLedger};

        let mut sim = Sim::new([7u8; 32]);

        // Mutate each new resource to non-default values.
        sim.world.resource_mut::<LegitimacyDebt>().stock = 0.42;
        {
            let mut r = sim.world.resource_mut::<RightsLedger>();
            r.grant(CivicRights::UNIVERSAL_SUFFRAGE | CivicRights::FREE_SPEECH, 3);
        }
        {
            let mut c = sim.world.resource_mut::<CrisisState>();
            c.kind = CrisisKind::Pandemic;
            c.remaining_ticks = 120;
            c.cost_multiplier = 0.4;
        }
        sim.world.resource_mut::<PollutionStock>().stock = 2.71;

        let blob = save_snapshot(&mut sim.world).expect("save");

        let mut sim2 = Sim::new([0u8; 32]);
        load_snapshot(&mut sim2.world, &blob).expect("load");

        assert!((sim2.world.resource::<LegitimacyDebt>().stock - 0.42).abs() < 1e-6);
        let r2 = sim2.world.resource::<RightsLedger>();
        assert!(r2.granted.contains(CivicRights::UNIVERSAL_SUFFRAGE));
        assert!(r2.granted.contains(CivicRights::FREE_SPEECH));
        assert_eq!(r2.last_expansion_tick, 3);
        let c2 = sim2.world.resource::<CrisisState>();
        assert_eq!(c2.kind, CrisisKind::Pandemic);
        assert_eq!(c2.remaining_ticks, 120);
        assert!((sim2.world.resource::<PollutionStock>().stock - 2.71).abs() < 1e-6);
    }
}
