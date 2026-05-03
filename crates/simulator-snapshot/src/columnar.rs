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
    CrisisKind, CrisisState, Judiciary, LegitimacyDebt, MacroIndicators, Polity, PollutionStock,
    PriceLevel, RightsCatalog, RightsLedger, SimClock, SimRng, StateCapacity, Treasury,
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

const SNAPSHOT_VERSION: u32 = 12;

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
    rights_granted_count: u32,
    rights_breadth: f32,
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

/// Serialized form of `Polity`. Uses primitive types only to stay compatible
/// with bincode (no internally-tagged enums). `RegimeKind` and `ElectoralSystem`
/// are flattened into discriminants + optional string/float payloads.
#[derive(Serialize, Deserialize)]
struct PolityBlock {
    name: String,
    /// RegimeKind discriminant (0=AbsoluteMonarchy, 1=ConstitutionalMonarchy,
    /// 2=ParliamentaryRepublic, 3=PresidentialRepublic, 4=SinglePartyState,
    /// 5=MilitaryJunta, 6=Theocracy, 7=DirectDemocracy, 8=TribalCouncil,
    /// 9=Oligarchy, 10=Custom).
    regime_kind: u8,
    /// Payload string: ConstitutionalMonarchy→charter_year as string,
    /// SinglePartyState→ruling_party, Theocracy→dominant_faith, Custom→label.
    regime_payload: String,
    founding_year: i32,
    chamber_count: u8,
    franchise_fraction: f32,
    fused_executive: bool,
    executive_term_limit: Option<u32>,
    /// ElectoralSystem discriminant (0=FirstPastThePost, 1=PR, 2=RankedChoice,
    /// 3=Appointment, 4=Hereditary, 5=None).
    electoral_system_kind: u8,
    /// PR threshold when electoral_system_kind == 1.
    electoral_system_threshold: f32,
}

impl PolityBlock {
    fn from_polity(p: &Polity) -> Self {
        use simulator_core::{ElectoralSystem, RegimeKind};
        let (regime_kind, regime_payload) = match &p.regime {
            RegimeKind::AbsoluteMonarchy                   => (0, String::new()),
            RegimeKind::ConstitutionalMonarchy { charter_year } => (1, charter_year.to_string()),
            RegimeKind::ParliamentaryRepublic              => (2, String::new()),
            RegimeKind::PresidentialRepublic               => (3, String::new()),
            RegimeKind::SinglePartyState { ruling_party }  => (4, ruling_party.clone()),
            RegimeKind::MilitaryJunta                      => (5, String::new()),
            RegimeKind::Theocracy { dominant_faith }       => (6, dominant_faith.clone()),
            RegimeKind::DirectDemocracy                    => (7, String::new()),
            RegimeKind::TribalCouncil                      => (8, String::new()),
            RegimeKind::Oligarchy                          => (9, String::new()),
            RegimeKind::Custom { label }                   => (10, label.clone()),
        };
        let (electoral_system_kind, electoral_system_threshold) = match p.electoral_system {
            ElectoralSystem::FirstPastThePost                           => (0, 0.0),
            ElectoralSystem::ProportionalRepresentation { threshold }   => (1, threshold),
            ElectoralSystem::RankedChoice                               => (2, 0.0),
            ElectoralSystem::Appointment                                => (3, 0.0),
            ElectoralSystem::Hereditary                                 => (4, 0.0),
            ElectoralSystem::None                                       => (5, 0.0),
        };
        Self {
            name: p.name.clone(),
            regime_kind,
            regime_payload,
            founding_year: p.founding_year,
            chamber_count: p.chamber_count,
            franchise_fraction: p.franchise_fraction,
            fused_executive: p.fused_executive,
            executive_term_limit: p.executive_term_limit,
            electoral_system_kind,
            electoral_system_threshold,
        }
    }

    fn into_polity(self) -> Polity {
        use simulator_core::{ElectoralSystem, RegimeKind};
        let regime = match self.regime_kind {
            1  => RegimeKind::ConstitutionalMonarchy {
                charter_year: self.regime_payload.parse().unwrap_or(0),
            },
            2  => RegimeKind::ParliamentaryRepublic,
            3  => RegimeKind::PresidentialRepublic,
            4  => RegimeKind::SinglePartyState { ruling_party: self.regime_payload.clone() },
            5  => RegimeKind::MilitaryJunta,
            6  => RegimeKind::Theocracy { dominant_faith: self.regime_payload.clone() },
            7  => RegimeKind::DirectDemocracy,
            8  => RegimeKind::TribalCouncil,
            9  => RegimeKind::Oligarchy,
            10 => RegimeKind::Custom { label: self.regime_payload.clone() },
            _  => RegimeKind::AbsoluteMonarchy,
        };
        let electoral_system = match self.electoral_system_kind {
            1 => ElectoralSystem::ProportionalRepresentation { threshold: self.electoral_system_threshold },
            2 => ElectoralSystem::RankedChoice,
            3 => ElectoralSystem::Appointment,
            4 => ElectoralSystem::Hereditary,
            5 => ElectoralSystem::None,
            _ => ElectoralSystem::FirstPastThePost,
        };
        Polity {
            name: self.name,
            regime,
            founding_year: self.founding_year,
            chamber_count: self.chamber_count,
            franchise_fraction: self.franchise_fraction,
            fused_executive: self.fused_executive,
            executive_term_limit: self.executive_term_limit,
            electoral_system,
        }
    }
}

/// Serialized form of `RightsCatalog`. Stored as `Option<CatalogBlock>` so
/// snapshots without a catalog (legacy or empty worlds) decode cleanly.
/// Definitions are stored as the full `RightDefinition` structs (already
/// `Serialize + Deserialize`) to preserve custom rights and any mutations.
#[derive(Serialize, Deserialize)]
struct CatalogBlock {
    /// Vec of definition structs (replaces `defined` HashMap on restore).
    definitions: Vec<simulator_core::rights_catalog::RightDefinition>,
    /// IDs of rights currently in force.
    granted: Vec<String>,
    /// IDs of rights ever granted in this run.
    historical_max: Vec<String>,
    /// Tick of last catalog expansion.
    last_expansion_tick: u64,
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
    let catalog_opt  = world.get_resource::<RightsCatalog>().cloned();

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
        rights_granted_count:        macro_.rights_granted_count,
        rights_breadth:              macro_.rights_breadth,
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

    // Build optional catalog block.
    let catalog_block: Option<CatalogBlock> = catalog_opt.map(|cat| CatalogBlock {
        definitions:          cat.defined.values().cloned().collect(),
        granted:              cat.granted.iter().map(|id| id.0.clone()).collect(),
        historical_max:       cat.historical_max.iter().map(|id| id.0.clone()).collect(),
        last_expansion_tick:  cat.last_expansion_tick,
    });

    // Optional institutional resources (v12+).
    let polity_block:   Option<PolityBlock>   = world.get_resource::<Polity>().map(PolityBlock::from_polity);
    let judiciary_block: Option<Judiciary>    = world.get_resource::<Judiciary>().cloned();
    let capacity_block: Option<StateCapacity> = world.get_resource::<StateCapacity>().cloned();

    // Encode with bincode then compress.
    let mut raw: Vec<u8> = Vec::new();
    encode_into(&header, &mut raw)?;
    encode_into(&rows, &mut raw)?;
    encode_into(&resources, &mut raw)?;
    encode_into(&graph_block, &mut raw)?;
    encode_into(&catalog_block, &mut raw)?;
    encode_into(&polity_block, &mut raw)?;
    encode_into(&judiciary_block, &mut raw)?;
    encode_into(&capacity_block, &mut raw)?;

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
    let catalog_block: Option<CatalogBlock> = decode_from(&mut cursor)?;
    let polity_block:   Option<PolityBlock>   = decode_from(&mut cursor)?;
    let judiciary_block: Option<Judiciary>    = decode_from(&mut cursor)?;
    let capacity_block: Option<StateCapacity> = decode_from(&mut cursor)?;

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
        macro_.rights_granted_count   = resources.rights_granted_count;
        macro_.rights_breadth         = resources.rights_breadth;
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

    // Restore RightsCatalog if present in the snapshot.
    if let Some(cb) = catalog_block {
        use simulator_core::rights_catalog::RightId;
        let mut cat = RightsCatalog::default();
        for def in cb.definitions { cat.defined.insert(def.id.clone(), def); }
        cat.granted        = cb.granted.into_iter().map(RightId::new).collect();
        cat.historical_max = cb.historical_max.into_iter().map(RightId::new).collect();
        cat.last_expansion_tick = cb.last_expansion_tick;
        world.insert_resource(cat);
    }

    // Restore optional institutional resources (v12+).
    // Absent means the snapshot predates v12 or the scenario didn't set them.
    match polity_block {
        Some(pb) => { world.insert_resource(pb.into_polity()); }
        None     => { world.remove_resource::<Polity>(); }
    }
    match judiciary_block {
        Some(j) => { world.insert_resource(j); }
        None    => { world.remove_resource::<Judiciary>(); }
    }
    match capacity_block {
        Some(c) => { world.insert_resource(c); }
        None    => { world.remove_resource::<StateCapacity>(); }
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

    /// Save/load with citizens preserves all citizen fields.
    #[test]
    fn save_load_round_trip_with_citizen() {
        use simulator_core::components::{
            Age, ApprovalRating, AuditFlags, Citizen, ConsumptionExpenditure,
            EmploymentStatus, EvasionPropensity, Health, IdeologyVector, Income,
            LegalStatusFlags, LegalStatuses, Location, Productivity, SavingsRate, Sex, Wealth,
        };
        use simulator_types::{CitizenId, Money, RegionId, Score};

        let mut sim = Sim::new([2u8; 32]);
        let ideology = [0.1, -0.3, 0.5, 0.0, -0.7];
        sim.world.spawn(((
            Citizen(CitizenId(42)),
            Age(33),
            Sex::Female,
            Location(RegionId(5)),
            Health(Score::from_num(0.75_f32)),
            Income(Money::from_num(2500_i32)),
            Wealth(Money::from_num(15000_i32)),
            EmploymentStatus::Employed,
        ), (
            Productivity(Score::from_num(0.6_f32)),
            IdeologyVector(ideology),
            ApprovalRating(Score::from_num(0.4_f32)),
            LegalStatuses(LegalStatusFlags::CITIZEN | LegalStatusFlags::REGISTERED_VOTER),
            AuditFlags::default(),
            EvasionPropensity(0.05),
            ConsumptionExpenditure(Money::from_num(2000_i32)),
            SavingsRate(0.15),
        )));

        let blob = save_snapshot(&mut sim.world).expect("save");

        let mut sim2 = Sim::new([0u8; 32]);
        let (n, _) = load_snapshot(&mut sim2.world, &blob).expect("load");
        assert_eq!(n, 1, "should have loaded 1 citizen");

        let mut q = sim2.world.query::<(
            &Citizen, &Age, &EmploymentStatus, &IdeologyVector, &SavingsRate, &EvasionPropensity,
        )>();
        let (c, a, emp, iv, sr, ep) = q.single(&sim2.world).unwrap();
        assert_eq!(c.0.0, 42);
        assert_eq!(a.0, 33);
        assert!(matches!(*emp, EmploymentStatus::Employed));
        for (k, &expected) in ideology.iter().enumerate() {
            assert!((iv.0[k] - expected).abs() < 1e-6, "ideology[{k}] mismatch");
        }
        assert!((sr.0 - 0.15).abs() < 1e-6, "savings rate mismatch");
        assert!((ep.0 - 0.05).abs() < 1e-6, "evasion propensity mismatch");
    }

    /// Loading a blob with a mismatched version returns VersionMismatch error.
    #[test]
    fn load_wrong_version_returns_error() {
        use crate::SnapshotError;

        // Build a valid snapshot then corrupt version byte by tampering the raw bincode.
        let mut sim = Sim::new([3u8; 32]);
        let blob = save_snapshot(&mut sim.world).expect("save");

        // Decompress, flip first 4 bytes (version u32 in little-endian), re-compress.
        let mut raw = zstd::decode_all(blob.as_slice()).unwrap();
        // version 11 = 0x0B 0x00 0x00 0x00 → change to 99 = 0x63 0x00 0x00 0x00
        raw[0] = 99;
        let tampered = zstd::encode_all(raw.as_slice(), 3).unwrap();

        let mut sim2 = Sim::new([0u8; 32]);
        let result = load_snapshot(&mut sim2.world, &tampered);
        assert!(
            matches!(result, Err(SnapshotError::VersionMismatch { found: 99, expected: 12 })),
            "expected VersionMismatch error, got {result:?}"
        );
    }

    #[test]
    fn save_load_round_trip_rights_catalog() {
        use simulator_core::{catalog_from_bits, rights_catalog::RightId, RightsCatalog};

        let mut sim = Sim::new([8u8; 32]);

        // Seed catalog with 3 granted rights (bits 0, 2, 7 = suffrage, gender_equality, free_speech).
        let mut cat = catalog_from_bits(0b1000_0101); // bits 0, 2, 7
        // Revoke one to test historical_max preservation.
        cat.revoke(&RightId::new("gender_equality")); // now granted=2, historical=3
        cat.last_expansion_tick = 77;
        sim.world.insert_resource(cat);

        let blob = save_snapshot(&mut sim.world).expect("save");

        let mut sim2 = Sim::new([0u8; 32]);
        load_snapshot(&mut sim2.world, &blob).expect("load");

        let cat2 = sim2.world.get_resource::<RightsCatalog>()
            .expect("RightsCatalog should be present after load");

        assert!(cat2.has(&RightId::new("universal_suffrage")), "universal_suffrage should be granted");
        assert!(cat2.has(&RightId::new("free_speech")), "free_speech should be granted");
        assert!(!cat2.has(&RightId::new("gender_equality")), "gender_equality was revoked");
        assert!(cat2.historical_max.contains(&RightId::new("gender_equality")),
            "historical_max should retain revoked right");
        assert_eq!(cat2.granted_count(), 2, "2 rights in force after revocation");
        assert_eq!(cat2.historical_count(), 3, "3 rights in historical_max");
        assert_eq!(cat2.last_expansion_tick, 77);
        // Definitions should be restored (29 from default catalog).
        assert_eq!(cat2.defined.len(), 29, "definitions should be fully restored");
    }

    /// Round-trip: Polity, Judiciary, StateCapacity are preserved across save/load.
    #[test]
    fn save_load_round_trip_institutional_resources() {
        use simulator_core::{
            ElectoralSystem, Judiciary, Polity, RegimeKind, StateCapacity,
        };

        let mut sim = Sim::new([10u8; 32]);

        sim.world.insert_resource(Polity {
            name: "Test Republic".to_string(),
            regime: RegimeKind::ParliamentaryRepublic,
            founding_year: 1945,
            chamber_count: 1,
            franchise_fraction: 0.85,
            fused_executive: false,
            executive_term_limit: Some(3),
            electoral_system: ElectoralSystem::ProportionalRepresentation { threshold: 0.05 },
        });
        sim.world.insert_resource(Judiciary {
            independence: 0.75,
            review_power: true,
            precedent_weight: 0.60,
            international_deference: 0.40,
        });
        sim.world.insert_resource(StateCapacity {
            tax_collection_efficiency: 0.82,
            enforcement_reach: 0.78,
            enforcement_noise: 0.10,
            corruption_drift: 0.02,
            legal_predictability: 0.80,
            bureaucratic_effectiveness: 0.75,
        });

        let blob = save_snapshot(&mut sim.world).expect("save");

        let mut sim2 = Sim::new([0u8; 32]);
        load_snapshot(&mut sim2.world, &blob).expect("load");

        let p = sim2.world.resource::<Polity>();
        assert_eq!(p.name, "Test Republic");
        assert!(matches!(p.regime, RegimeKind::ParliamentaryRepublic));
        assert_eq!(p.chamber_count, 1);
        assert!((p.franchise_fraction - 0.85).abs() < 1e-6);
        assert_eq!(p.executive_term_limit, Some(3));
        assert!(!p.fused_executive);

        let j = sim2.world.resource::<Judiciary>();
        assert!((j.independence - 0.75).abs() < 1e-6);
        assert!(j.review_power);
        assert!((j.precedent_weight - 0.60).abs() < 1e-6);

        let sc = sim2.world.resource::<StateCapacity>();
        assert!((sc.tax_collection_efficiency - 0.82).abs() < 1e-6);
        assert!((sc.enforcement_reach - 0.78).abs() < 1e-6);
        assert!((sc.corruption_drift - 0.02).abs() < 1e-6);
    }

    /// When Polity/Judiciary/StateCapacity are absent, load removes them from target world.
    #[test]
    fn save_load_without_institutional_resources_removes_them_from_target() {
        use simulator_core::{Judiciary, Polity, StateCapacity};

        // Source sim has no institutional resources.
        let mut sim_src = Sim::new([11u8; 32]);
        assert!(sim_src.world.get_resource::<Polity>().is_none());
        let blob = save_snapshot(&mut sim_src.world).expect("save");

        // Target sim has existing Polity/Judiciary/StateCapacity that should be removed.
        let mut sim2 = Sim::new([0u8; 32]);
        sim2.world.insert_resource(Polity::default());
        sim2.world.insert_resource(Judiciary::default());
        sim2.world.insert_resource(StateCapacity::default());

        load_snapshot(&mut sim2.world, &blob).expect("load");

        assert!(sim2.world.get_resource::<Polity>().is_none(),
            "Polity should be removed when absent from snapshot");
        assert!(sim2.world.get_resource::<Judiciary>().is_none(),
            "Judiciary should be removed when absent from snapshot");
        assert!(sim2.world.get_resource::<StateCapacity>().is_none(),
            "StateCapacity should be removed when absent from snapshot");
    }

    #[test]
    fn save_load_without_catalog_does_not_insert_resource() {
        // A snapshot saved without RightsCatalog should not inject a catalog on load.
        let mut sim = Sim::new([9u8; 32]);
        // No catalog inserted — only default world resources.
        assert!(sim.world.get_resource::<simulator_core::RightsCatalog>().is_none(),
            "catalog should not exist before save");

        let blob = save_snapshot(&mut sim.world).expect("save");

        let mut sim2 = Sim::new([0u8; 32]);
        load_snapshot(&mut sim2.world, &blob).expect("load");

        assert!(sim2.world.get_resource::<simulator_core::RightsCatalog>().is_none(),
            "catalog should not be injected when absent from snapshot");
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
