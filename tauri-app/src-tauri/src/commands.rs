use std::sync::Arc;

use simulator_core::{CrisisState, Judiciary, LegitimacyDebt, MacroIndicators, Polity,
                     PollutionStock, PriceLevel, RightsLedger, SimClock, StateCapacity, Treasury};
use simulator_core::components::{ApprovalRating, EmploymentStatus, Health, Income, Location, Productivity, Wealth};
use simulator_counterfactual::{
    estimate::CausalEstimate,
    monte_carlo::{MonteCarloRunner, MonteCarloSummary},
    pair::CounterfactualPair,
};
use simulator_law::{
    dsl::{parser::parse_program, typecheck::typecheck_program},
    register_crisis_link_system, register_law_dispatcher, register_legitimacy_system,
    registry::{LawEffect, LawHandle},
    Cadence, LawId, LawRegistry,
};
use simulator_metrics::{register_metrics_system, MetricStore, TickRow, WindowDiff, WindowSummary};
use simulator_snapshot::save_snapshot;
use simulator_systems::{register_phase1_systems, ELECTION_PERIOD};
use simulator_telemetry::register_telemetry_system;

use crate::state::{AppState, IpcError, IpcResult, crisis_kind_u8};

// ---- Institutional resource helpers ----------------------------------------

fn regime_kind_str(p: Option<&Polity>) -> String {
    use simulator_core::RegimeKind;
    match p.map(|p| &p.regime) {
        None | Some(RegimeKind::PresidentialRepublic)         => "PresidentialRepublic".into(),
        Some(RegimeKind::AbsoluteMonarchy)                    => "AbsoluteMonarchy".into(),
        Some(RegimeKind::ConstitutionalMonarchy { .. })       => "ConstitutionalMonarchy".into(),
        Some(RegimeKind::ParliamentaryRepublic)               => "ParliamentaryRepublic".into(),
        Some(RegimeKind::SinglePartyState { .. })             => "SinglePartyState".into(),
        Some(RegimeKind::MilitaryJunta)                       => "MilitaryJunta".into(),
        Some(RegimeKind::Theocracy { .. })                    => "Theocracy".into(),
        Some(RegimeKind::DirectDemocracy)                     => "DirectDemocracy".into(),
        Some(RegimeKind::TribalCouncil)                       => "TribalCouncil".into(),
        Some(RegimeKind::Oligarchy)                           => "Oligarchy".into(),
        Some(RegimeKind::Custom { label })                    => label.clone(),
    }
}

fn electoral_system_str(p: Option<&Polity>) -> String {
    use simulator_core::ElectoralSystem;
    match p.map(|p| &p.electoral_system) {
        None | Some(ElectoralSystem::FirstPastThePost)                       => "FirstPastThePost".into(),
        Some(ElectoralSystem::ProportionalRepresentation { threshold })      => format!("PR(≥{:.0}%)", threshold * 100.0),
        Some(ElectoralSystem::RankedChoice)                                  => "RankedChoice".into(),
        Some(ElectoralSystem::Appointment)                                   => "Appointment".into(),
        Some(ElectoralSystem::Hereditary)                                    => "Hereditary".into(),
        Some(ElectoralSystem::None)                                          => "None".into(),
    }
}

/// Build the institutional portion of `CurrentStateDto` from optional resources.
fn institutional_fields(w: &simulator_core::bevy_ecs::world::World) -> (String, String, f32, String, bool, Option<u32>, f32, bool, f32, f32, f32, f32, f32) {
    let polity   = w.get_resource::<Polity>();
    let judiciary = w.get_resource::<Judiciary>();
    let capacity  = w.get_resource::<StateCapacity>();
    let default_cap = StateCapacity::default();
    let cap = capacity.unwrap_or(&default_cap);

    (
        regime_kind_str(polity),
        polity.map(|p| p.name.clone()).unwrap_or_else(|| "—".into()),
        polity.map(|p| p.franchise_fraction).unwrap_or(1.0),
        electoral_system_str(polity),
        polity.map(|p| p.fused_executive).unwrap_or(true),
        polity.and_then(|p| p.executive_term_limit),
        judiciary.map(|j| j.independence).unwrap_or(0.0),
        judiciary.map(|j| j.review_power).unwrap_or(false),
        cap.composite_score(),
        cap.tax_collection_efficiency,
        cap.enforcement_reach,
        cap.legal_predictability,
        cap.bureaucratic_effectiveness,
    )
}

// ---- Scenario / sim lifecycle ----------------------------------------------

#[tauri::command]
pub async fn load_scenario(
    state: tauri::State<'_, AppState>,
    name: String,
) -> IpcResult<String> {
    use std::path::PathBuf;
    use crate::state::build_sim_from_scenario;
    use simulator_scenario::Scenario;

    let path = {
        let p = PathBuf::from(&name);
        if p.is_absolute() && p.exists() { p }
        else { state.scenarios_dir.join(format!("{name}.yaml")) }
    };

    let scenario = Scenario::load(&path)
        .map_err(|e| IpcError(format!("load_scenario: {e}")))?;
    let bundle = build_sim_from_scenario(&scenario);
    let out = bundle.scenario_name.clone();
    *state.sim.lock().await = Some(bundle);
    Ok(out)
}

#[tauri::command]
pub async fn step_sim(
    state: tauri::State<'_, AppState>,
    ticks: u32,
) -> IpcResult<u64> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    for _ in 0..ticks { bundle.sim.step(); }
    Ok(bundle.sim.tick())
}

#[tauri::command]
pub async fn get_tick(state: tauri::State<'_, AppState>) -> IpcResult<u64> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;
    Ok(bundle.sim.tick())
}

// ---- Metrics ---------------------------------------------------------------

#[tauri::command]
pub async fn get_metrics_rows(
    state: tauri::State<'_, AppState>,
    n: u32,
) -> IpcResult<Vec<TickRow>> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;
    let store = bundle.sim.world.resource::<MetricStore>();
    let all: Vec<TickRow> = store.rows().cloned().collect();
    let start = all.len().saturating_sub(n as usize);
    Ok(all[start..].to_vec())
}

// ---- Current state ---------------------------------------------------------

#[derive(serde::Serialize)]
pub struct CurrentStateDto {
    pub tick:                   u64,
    pub approval:               f32,
    pub population:             u64,
    pub gdp:                    f64,
    pub gini:                   f32,
    pub wealth_gini:            f32,
    pub unemployment:           f32,
    pub inflation:              f32,
    pub gov_revenue:            f64,
    pub gov_expenditure:        f64,
    pub treasury_balance:       f64,
    pub price_level:            f64,
    pub pollution_stock:        f64,
    pub legitimacy_debt:        f32,
    pub rights_granted_bits:    u32,
    pub rights_granted_count:   u32,
    pub rights_breadth:         f32,
    pub crisis_kind:            u8,
    pub crisis_remaining_ticks: u64,
    pub incumbent_party:        u8,
    pub election_margin:        f32,
    pub consecutive_terms:      u32,
    pub last_election_tick:     u64,
    /// Fixed election cycle length in ticks (currently always 360 = 1 simulated year).
    pub election_cycle:         u64,

    // ── Polity (absent = default PresidentialRepublic, FPTP, universal suffrage) ──
    /// Short label for the regime type (e.g. "PresidentialRepublic", "MilitaryJunta").
    pub regime_kind:            String,
    /// Display name of the polity (e.g. "United States").
    pub polity_name:            String,
    /// Fraction of adult population eligible to vote [0, 1]. 1.0 = universal suffrage.
    pub franchise_fraction:     f32,
    /// Short label for the electoral system (e.g. "FirstPastThePost", "PR").
    pub electoral_system:       String,
    /// Whether the head of state and government are fused (presidential vs parliamentary).
    pub fused_executive:        bool,
    /// Maximum consecutive terms for the executive, or null if unlimited.
    pub executive_term_limit:   Option<u32>,

    // ── Judiciary ──────────────────────────────────────────────────────────────
    /// How independent the judiciary is from executive pressure [0, 1].
    pub judicial_independence:  f32,
    /// Whether courts can strike down legislation.
    pub judicial_review_power:  bool,

    // ── StateCapacity ─────────────────────────────────────────────────────────
    /// Unweighted composite score of state effectiveness [0, 1].
    pub state_capacity_score:   f32,
    /// Fraction of owed tax actually collected [0, 1].
    pub tax_collection_efficiency: f32,
    /// Fraction of citizens subject to effective law enforcement [0, 1].
    pub enforcement_reach:      f32,
    /// Consistency of judicial/administrative rulings [0, 1].
    pub legal_predictability:   f32,
    /// Government service delivery multiplier [0, 1].
    pub bureaucratic_effectiveness: f32,
}

#[tauri::command]
pub async fn get_current_state(
    state: tauri::State<'_, AppState>,
) -> IpcResult<CurrentStateDto> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;
    let w = &bundle.sim.world;

    let clock     = w.resource::<SimClock>();
    let ind       = w.resource::<MacroIndicators>();
    let treasury  = w.resource::<Treasury>();
    let price     = w.resource::<PriceLevel>();
    let pollution = w.resource::<PollutionStock>();
    let debt      = w.resource::<LegitimacyDebt>();
    let rights    = w.resource::<RightsLedger>();
    let crisis    = w.resource::<CrisisState>();

    let (regime_kind, polity_name, franchise_fraction, electoral_system, fused_executive,
         executive_term_limit, judicial_independence, judicial_review_power, state_capacity_score,
         tax_collection_efficiency, enforcement_reach, legal_predictability,
         bureaucratic_effectiveness) = institutional_fields(w);

    Ok(CurrentStateDto {
        tick:                   clock.tick,
        approval:               ind.approval,
        population:             ind.population,
        gdp:                    ind.gdp.to_num::<f64>(),
        gini:                   ind.gini,
        wealth_gini:            ind.wealth_gini,
        unemployment:           ind.unemployment,
        inflation:              ind.inflation,
        gov_revenue:            ind.government_revenue.to_num::<f64>(),
        gov_expenditure:        ind.government_expenditure.to_num::<f64>(),
        treasury_balance:       treasury.balance.to_num::<f64>(),
        price_level:            price.level,
        pollution_stock:        pollution.stock,
        legitimacy_debt:        debt.stock,
        rights_granted_bits:    rights.granted.bits(),
        rights_granted_count:   ind.rights_granted_count,
        rights_breadth:         ind.rights_breadth,
        crisis_kind:            crisis_kind_u8(crisis.kind),
        crisis_remaining_ticks: crisis.remaining_ticks,
        incumbent_party:        ind.incumbent_party,
        election_margin:        ind.election_margin,
        consecutive_terms:      ind.consecutive_terms,
        last_election_tick:     ind.last_election_tick,
        election_cycle:         ELECTION_PERIOD,
        regime_kind, polity_name, franchise_fraction, electoral_system, fused_executive,
        executive_term_limit, judicial_independence, judicial_review_power, state_capacity_score,
        tax_collection_efficiency, enforcement_reach, legal_predictability,
        bureaucratic_effectiveness,
    })
}

// ---- Law commands ----------------------------------------------------------

#[derive(serde::Serialize)]
pub struct LawInfoDto {
    pub id:           u64,
    pub effect_kind:  String,
    pub label:        String,
    pub magnitude:    Option<String>,
    pub cadence:      String,
    pub enacted_tick: u64,
    pub repealed:     bool,
}

fn effect_kind_str(e: &LawEffect) -> String {
    match e {
        LawEffect::PerCitizenIncomeTax { .. } => "income_tax".into(),
        LawEffect::PerCitizenBenefit   { .. } => "benefit".into(),
        LawEffect::RegistrationMarker  { .. } => "registration".into(),
        LawEffect::Audit               { .. } => "audit".into(),
        LawEffect::Abatement           { .. } => "abatement".into(),
        LawEffect::RightGrant          { .. } => "right_grant".into(),
        LawEffect::RightRevoke         { .. } => "right_revoke".into(),
        LawEffect::StateCapacityModify { .. } => "state_capacity".into(),
    }
}

fn effect_label_str(e: &LawEffect) -> String {
    match e {
        LawEffect::PerCitizenIncomeTax { .. } => "Income Tax".into(),
        LawEffect::PerCitizenBenefit   { .. } => "Citizen Benefit".into(),
        LawEffect::RegistrationMarker  { .. } => "Registration".into(),
        LawEffect::Audit               { .. } => "Audit".into(),
        LawEffect::Abatement           { .. } => "Abatement".into(),
        LawEffect::RightGrant  { right_id } => format!("Grant: {right_id}"),
        LawEffect::RightRevoke { right_id } => format!("Revoke: {right_id}"),
        LawEffect::StateCapacityModify { field, .. } => format!("Capacity: {field}"),
    }
}

fn effect_magnitude(e: &LawEffect, src: Option<&str>) -> Option<String> {
    match e {
        LawEffect::PerCitizenIncomeTax { .. } => {
            let s = src?;
            // DSL: "scope taxpayer { define owed = income * 0.250000 }"
            let rate: f64 = s.rsplit('*').next()?.split_whitespace().next()?.parse().ok()?;
            Some(format!("{:.1}%", rate * 100.0))
        }
        LawEffect::PerCitizenBenefit { .. } => {
            let s = src?;
            // DSL: "scope citizen { define amount = 500.000000 }"
            let amount: f64 = s.rsplit('=').next()?.split_whitespace().next()?.parse().ok()?;
            Some(format!("${:.0}/mo", amount))
        }
        LawEffect::Abatement { pollution_reduction_pu, cost_per_pu } => {
            Some(format!("{:.2} PU · ${:.0}/PU", pollution_reduction_pu, cost_per_pu))
        }
        LawEffect::RightGrant  { right_id } => Some(format!("Grant {right_id}")),
        LawEffect::RightRevoke { right_id } => Some(format!("Revoke {right_id}")),
        LawEffect::StateCapacityModify { field, delta } => {
            Some(format!("{field} {delta:+.3}"))
        }
        LawEffect::RegistrationMarker { .. } | LawEffect::Audit { .. } => None,
    }
}

#[tauri::command]
pub async fn list_laws(state: tauri::State<'_, AppState>) -> IpcResult<Vec<LawInfoDto>> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;
    let registry = bundle.sim.world.resource::<LawRegistry>();
    let tick = bundle.sim.tick();

    let infos = registry.snapshot_active(tick).iter().map(|h| LawInfoDto {
        id:           h.id.0,
        effect_kind:  effect_kind_str(&h.effect),
        label:        effect_label_str(&h.effect),
        magnitude:    effect_magnitude(&h.effect, h.source.as_ref().map(|s| s.as_str())),
        cadence:      format!("{:?}", h.cadence),
        enacted_tick: h.effective_from_tick,
        repealed:     h.effective_until_tick.is_some(),
    }).collect();
    Ok(infos)
}

#[derive(serde::Deserialize)]
pub struct FlatTaxParams { pub rate: f64 }

#[tauri::command]
pub async fn enact_flat_tax(
    state: tauri::State<'_, AppState>,
    params: FlatTaxParams,
) -> IpcResult<u64> {
    let rate = params.rate.clamp(0.0, 1.0);
    let src  = format!("scope taxpayer {{ define owed = income * {rate:.6} }}");
    let dsl_src = Arc::new(src.clone());
    let prog = parse_program(&src).map_err(|e| IpcError(format!("dsl: {e:?}")))?;
    typecheck_program(&prog).map_err(|e| IpcError(format!("typecheck: {e:?}")))?;

    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    // Auto-snapshot before enactment so Monte Carlo can fork from this point.
    if let Ok(blob) = save_snapshot(&mut bundle.sim.world) {
        bundle.snapshot = Some((tick, blob));
    }
    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let id = registry.enact(LawHandle {
        source:               Some(dsl_src),
        id:                   LawId(0),
        version:              1,
        program:              Arc::new(prog),
        cadence:              Cadence::Monthly,
        effective_from_tick:  tick,
        effective_until_tick: None,
        effect: LawEffect::PerCitizenIncomeTax { scope: "taxpayer", owed_def: "owed" },
    });
    Ok(id.0)
}

#[derive(serde::Deserialize)]
pub struct UbiParams { pub monthly_amount: f64 }

#[tauri::command]
pub async fn enact_ubi(
    state: tauri::State<'_, AppState>,
    params: UbiParams,
) -> IpcResult<u64> {
    let amount = params.monthly_amount.max(0.0);
    let src    = format!("scope citizen {{ define amount = {amount:.6} }}");
    let dsl_src = Arc::new(src.clone());
    let prog   = parse_program(&src).map_err(|e| IpcError(format!("dsl: {e:?}")))?;
    typecheck_program(&prog).map_err(|e| IpcError(format!("typecheck: {e:?}")))?;

    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    if let Ok(blob) = save_snapshot(&mut bundle.sim.world) {
        bundle.snapshot = Some((tick, blob));
    }
    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let id = registry.enact(LawHandle {
        source:               Some(dsl_src),
        id:                   LawId(0),
        version:              1,
        program:              Arc::new(prog),
        cadence:              Cadence::Monthly,
        effective_from_tick:  tick,
        effective_until_tick: None,
        effect: LawEffect::PerCitizenBenefit { scope: "citizen", amount_def: "amount" },
    });
    Ok(id.0)
}

#[derive(serde::Deserialize)]
pub struct AbatementParams {
    pub pollution_reduction_pu: f64,
    pub cost_per_pu:            f64,
}

#[tauri::command]
pub async fn enact_abatement(
    state: tauri::State<'_, AppState>,
    params: AbatementParams,
) -> IpcResult<u64> {
    let src  = "scope Env() { }";
    let dsl_src = Arc::new(src.to_string());
    let prog = parse_program(src).map_err(|e| IpcError(format!("dsl: {e:?}")))?;
    typecheck_program(&prog).map_err(|e| IpcError(format!("typecheck: {e:?}")))?;

    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    if let Ok(blob) = save_snapshot(&mut bundle.sim.world) {
        bundle.snapshot = Some((tick, blob));
    }
    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let id = registry.enact(LawHandle {
        source:               Some(dsl_src),
        id:                   LawId(0),
        version:              1,
        program:              Arc::new(prog),
        cadence:              Cadence::Monthly,
        effective_from_tick:  tick,
        effective_until_tick: None,
        effect: LawEffect::Abatement {
            pollution_reduction_pu: params.pollution_reduction_pu,
            cost_per_pu:            params.cost_per_pu,
        },
    });
    Ok(id.0)
}

// ─── Right & state-capacity laws ────────────────────────────────────────────
//
// These enact a *Law* (entered into LawRegistry, repealable, DiD-analyzable),
// distinct from the immediate-mutation `grant_civic_right` / `revoke_civic_right`
// commands above. They Box::leak the right_id / field name to obtain the
// `&'static str` payload `LawEffect` requires; this leaks ~30 bytes per unique
// id, which is bounded by the ~9 known rights and 6 capacity fields.

#[derive(serde::Serialize, Clone)]
pub struct RightInfoDto {
    pub id:                    String,
    pub label:                 String,
    pub granted:               bool,
    pub prerequisites:         Vec<String>,
    pub prerequisites_met:     bool,
    pub revocation_debt:       f32,
    pub grant_boost:           f32,
    pub beneficiary_fraction:  f32,
}

/// List every right defined in the live RightsCatalog with its grant state
/// and prerequisite status. Drives the Right Grant / Right Revoke dropdowns
/// on the Propose page.
#[tauri::command]
pub async fn list_rights(
    state: tauri::State<'_, AppState>,
) -> IpcResult<Vec<RightInfoDto>> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;
    let cat = bundle.sim.world.get_resource::<simulator_core::RightsCatalog>()
        .ok_or_else(|| IpcError("no RightsCatalog in this scenario".into()))?;
    let mut out: Vec<RightInfoDto> = cat.defined.values().map(|d| RightInfoDto {
        id:                   d.id.0.clone(),
        label:                d.label.clone(),
        granted:              cat.granted.contains(&d.id),
        prerequisites:        d.prerequisites.iter().map(|p| p.0.clone()).collect(),
        prerequisites_met:    d.prerequisites.iter().all(|p| cat.granted.contains(p)),
        revocation_debt:      d.revocation_debt,
        grant_boost:          d.grant_boost,
        beneficiary_fraction: d.beneficiary_fraction,
    }).collect();
    out.sort_by(|a, b| a.label.cmp(&b.label));
    Ok(out)
}

#[derive(serde::Deserialize)]
pub struct RightLawParams { pub right_id: String }

fn enact_law_with_effect(
    bundle: &mut crate::state::SimBundle,
    src: String,
    effect: LawEffect,
    cadence: Cadence,
) -> IpcResult<u64> {
    let dsl_src = Arc::new(src.clone());
    let prog = parse_program(&src).map_err(|e| IpcError(format!("dsl: {e:?}")))?;
    typecheck_program(&prog).map_err(|e| IpcError(format!("typecheck: {e:?}")))?;
    let tick = bundle.sim.tick();
    if let Ok(blob) = save_snapshot(&mut bundle.sim.world) {
        bundle.snapshot = Some((tick, blob));
    }
    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let id = registry.enact(LawHandle {
        source:               Some(dsl_src),
        id:                   LawId(0),
        version:              1,
        program:              Arc::new(prog),
        cadence,
        effective_from_tick:  tick,
        effective_until_tick: None,
        effect,
    });
    Ok(id.0)
}

#[tauri::command]
pub async fn enact_right_grant(
    state: tauri::State<'_, AppState>,
    params: RightLawParams,
) -> IpcResult<u64> {
    let id = params.right_id.trim();
    if id.is_empty() {
        return Err(IpcError("right_id must be non-empty".into()));
    }
    let leaked: &'static str = Box::leak(id.to_string().into_boxed_str());
    let src = format!("// right_grant {id}\nscope citizen {{ }}");
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    enact_law_with_effect(
        bundle, src, LawEffect::RightGrant { right_id: leaked }, Cadence::Monthly,
    )
}

#[tauri::command]
pub async fn enact_right_revoke(
    state: tauri::State<'_, AppState>,
    params: RightLawParams,
) -> IpcResult<u64> {
    let id = params.right_id.trim();
    if id.is_empty() {
        return Err(IpcError("right_id must be non-empty".into()));
    }
    let leaked: &'static str = Box::leak(id.to_string().into_boxed_str());
    let src = format!("// right_revoke {id}\nscope citizen {{ }}");
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    enact_law_with_effect(
        bundle, src, LawEffect::RightRevoke { right_id: leaked }, Cadence::Monthly,
    )
}

/// Allowed StateCapacity field names — anything else returns an error so the
/// engine never sees an unknown identifier through this path.
const CAPACITY_FIELDS: &[&str] = &[
    "tax_collection_efficiency",
    "enforcement_reach",
    "enforcement_noise",
    "corruption_drift",
    "legal_predictability",
    "bureaucratic_effectiveness",
];

#[derive(serde::Deserialize)]
pub struct CapacityLawParams { pub field: String, pub delta: f32 }

#[tauri::command]
pub async fn enact_state_capacity_modify(
    state: tauri::State<'_, AppState>,
    params: CapacityLawParams,
) -> IpcResult<u64> {
    let f = params.field.trim();
    let known = CAPACITY_FIELDS.iter().find(|k| **k == f)
        .ok_or_else(|| IpcError(format!("unknown capacity field: {f}")))?;
    if !params.delta.is_finite() || params.delta.abs() > 0.5 {
        return Err(IpcError("delta must be finite and within ±0.5".into()));
    }
    let src = format!("// capacity {} {:+.4}\nscope citizen {{ }}", known, params.delta);
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    enact_law_with_effect(
        bundle, src,
        LawEffect::StateCapacityModify { field: known, delta: params.delta },
        Cadence::Monthly,
    )
}

#[tauri::command]
pub async fn repeal_law(
    state: tauri::State<'_, AppState>,
    law_id: u64,
) -> IpcResult<()> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    registry.repeal(LawId(law_id), tick);
    Ok(())
}

// ---- Civic rights -----------------------------------------------------------

/// Grant a civic right by its bitflag value.
/// Syncs both `RightsLedger` (legacy bits) and `RightsCatalog` (when present).
/// Returns the new `rights_granted_bits` after the grant.
#[tauri::command]
pub async fn grant_civic_right(
    state: tauri::State<'_, AppState>,
    bit:   u32,
) -> IpcResult<u32> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    let right = simulator_core::CivicRights::from_bits_truncate(bit);
    bundle.sim.world.resource_mut::<simulator_core::RightsLedger>().grant(right, tick);

    // Mirror into RightsCatalog when present: look up the catalog ID via LEGACY_BIT_TO_ID.
    if bundle.sim.world.get_resource::<simulator_core::RightsCatalog>().is_some() {
        use simulator_core::{RightId, RightsCatalog, LEGACY_BIT_TO_ID};
        if let Some(&(id_str, _)) = LEGACY_BIT_TO_ID.iter().find(|(_, mask)| *mask == bit) {
            let rid = RightId::new(id_str);
            bundle.sim.world.resource_mut::<RightsCatalog>().grant(&rid, tick);
        }
    }

    Ok(bundle.sim.world.resource::<simulator_core::RightsLedger>().granted.bits())
}

/// Revoke a civic right by its bitflag value.
/// Syncs both `RightsLedger` (legacy bits) and `RightsCatalog` (when present).
/// Returns (new `rights_granted_bits`, legitimacy_debt_incurred).
#[tauri::command]
pub async fn revoke_civic_right(
    state: tauri::State<'_, AppState>,
    bit:   u32,
) -> IpcResult<(u32, f32)> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let right = simulator_core::CivicRights::from_bits_truncate(bit);
    let debt_from_ledger = bundle.sim.world.resource_mut::<simulator_core::RightsLedger>().revoke(right);

    // Mirror into RightsCatalog when present; use catalog's revocation_debt if available.
    let debt_delta = if bundle.sim.world.get_resource::<simulator_core::RightsCatalog>().is_some() {
        use simulator_core::{RightId, RightsCatalog, LEGACY_BIT_TO_ID};
        if let Some(&(id_str, _)) = LEGACY_BIT_TO_ID.iter().find(|(_, mask)| *mask == bit) {
            let rid = RightId::new(id_str);
            bundle.sim.world.resource_mut::<RightsCatalog>().revoke(&rid)
        } else {
            debt_from_ledger
        }
    } else {
        debt_from_ledger
    };

    // Apply the debt to the global legitimacy-debt stock.
    bundle.sim.world.resource_mut::<simulator_core::LegitimacyDebt>().stock =
        (bundle.sim.world.resource::<simulator_core::LegitimacyDebt>().stock + debt_delta).min(1.0);
    let new_bits = bundle.sim.world.resource::<simulator_core::RightsLedger>().granted.bits();
    Ok((new_bits, debt_delta))
}

// ---- Law effect / DiD window -----------------------------------------------

#[derive(serde::Serialize)]
pub struct WindowSummaryDto {
    pub from_tick:          u64,
    pub to_tick:            u64,
    pub n_rows:             usize,
    pub mean_approval:      f32,
    pub mean_unemployment:  f32,
    pub mean_gdp:           f64,
    pub mean_pollution:     f64,
    pub mean_legitimacy:    f32,
    pub mean_treasury:      f64,
    pub mean_gini:               f32,
    pub mean_wealth_gini:        f32,
    pub mean_state_capacity:     f32,
    pub mean_health:             f32,
    pub mean_income:             f64,
    pub mean_wealth:             f64,
    pub mean_rights_breadth:     f32,
    pub min_approval:       f32,
    pub max_approval:       f32,
    pub min_gdp:            f64,
    pub max_gdp:            f64,
    /// Mean approval per quintile [Q1=bottom .. Q5=top] over this window.
    pub approval_q1: f32,
    pub approval_q2: f32,
    pub approval_q3: f32,
    pub approval_q4: f32,
    pub approval_q5: f32,
}

impl From<&WindowSummary> for WindowSummaryDto {
    fn from(s: &WindowSummary) -> Self {
        Self {
            from_tick: s.from_tick, to_tick: s.to_tick, n_rows: s.n_rows,
            mean_approval: s.mean_approval, mean_unemployment: s.mean_unemployment,
            mean_gdp: s.mean_gdp, mean_pollution: s.mean_pollution,
            mean_legitimacy: s.mean_legitimacy, mean_treasury: s.mean_treasury,
            mean_gini: s.mean_gini, mean_wealth_gini: s.mean_wealth_gini,
            mean_state_capacity: s.mean_state_capacity, mean_health: s.mean_health,
            mean_income: s.mean_income, mean_wealth: s.mean_wealth, mean_rights_breadth: s.mean_rights_breadth,
            min_approval: s.min_approval, max_approval: s.max_approval,
            min_gdp: s.min_gdp, max_gdp: s.max_gdp,
            approval_q1: s.mean_approval_by_quintile[0],
            approval_q2: s.mean_approval_by_quintile[1],
            approval_q3: s.mean_approval_by_quintile[2],
            approval_q4: s.mean_approval_by_quintile[3],
            approval_q5: s.mean_approval_by_quintile[4],
        }
    }
}

#[derive(serde::Serialize)]
pub struct LawEffectDto {
    pub pre:                WindowSummaryDto,
    pub post:               WindowSummaryDto,
    pub delta_approval:     f32,
    pub delta_unemployment: f32,
    pub delta_gdp:          f64,
    pub delta_pollution:    f64,
    pub delta_legitimacy:   f32,
    pub delta_treasury:     f64,
    pub delta_gini:               f32,
    pub delta_wealth_gini:        f32,
    pub delta_state_capacity:     f32,
    pub delta_health:             f32,
    pub delta_income:             f64,
    pub delta_wealth:             f64,
    pub delta_rights_breadth:     f32,
    /// Δ mean approval per income quintile [Q1=bottom 20% .. Q5=top 20%].
    pub delta_approval_by_quintile: [f32; 5],
}

impl From<&WindowDiff> for LawEffectDto {
    fn from(d: &WindowDiff) -> Self {
        Self {
            pre: (&d.pre).into(), post: (&d.post).into(),
            delta_approval: d.delta_approval, delta_unemployment: d.delta_unemployment,
            delta_gdp: d.delta_gdp, delta_pollution: d.delta_pollution,
            delta_legitimacy: d.delta_legitimacy, delta_treasury: d.delta_treasury,
            delta_gini: d.delta_gini, delta_wealth_gini: d.delta_wealth_gini,
            delta_state_capacity: d.delta_state_capacity, delta_health: d.delta_health,
            delta_income: d.delta_income, delta_wealth: d.delta_wealth, delta_rights_breadth: d.delta_rights_breadth,
            delta_approval_by_quintile: d.delta_approval_by_quintile,
        }
    }
}

#[tauri::command]
pub async fn get_law_effect(
    state: tauri::State<'_, AppState>,
    enacted_tick: u64,
    window_ticks: u64,
) -> IpcResult<LawEffectDto> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;
    let store = bundle.sim.world.resource::<MetricStore>();
    let diff = WindowDiff::from_store(store, enacted_tick, window_ticks)
        .ok_or_else(|| IpcError("insufficient data for the requested window".into()))?;
    Ok(LawEffectDto::from(&diff))
}

#[tauri::command]
pub async fn export_metrics_parquet(
    state: tauri::State<'_, AppState>,
    path: String,
) -> IpcResult<()> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;
    let store = bundle.sim.world.resource::<MetricStore>();
    store.save_parquet(std::path::Path::new(&path))
        .map_err(|e| IpcError(e.to_string()))
}

// ---- Snapshot / counterfactual ─────────────────────────────────────────────

/// Save the current simulation state as a reusable fork point.
/// Returns the tick at which the snapshot was taken.
#[tauri::command]
pub async fn save_sim_snapshot(state: tauri::State<'_, AppState>) -> IpcResult<u64> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    let blob = save_snapshot(&mut bundle.sim.world)
        .map_err(|e| IpcError(format!("snapshot: {e}")))?;
    bundle.snapshot = Some((tick, blob));
    Ok(tick)
}

/// Single counterfactual DiD estimate — one treatment vs one control run.
///
/// Uses the stored snapshot as the fork point and the specified law as the
/// treatment. Returns `None` for each field when the window lacks data.
#[derive(serde::Serialize)]
pub struct CausalEstimateDto {
    pub enacted_tick:            u64,
    pub window_ticks:            u64,
    pub did_approval:            Option<f32>,
    pub did_gdp:                 Option<f64>,
    pub did_pollution:           Option<f64>,
    pub did_unemployment:        Option<f32>,
    pub did_legitimacy:          Option<f32>,
    pub did_treasury:            Option<f64>,
    pub treatment_post_approval: f32,
    pub treatment_post_gdp:      f64,
}

impl From<CausalEstimate> for CausalEstimateDto {
    fn from(e: CausalEstimate) -> Self {
        Self {
            enacted_tick:            e.enacted_tick,
            window_ticks:            e.window_ticks,
            did_approval:            e.did_approval,
            did_gdp:                 e.did_gdp,
            did_pollution:           e.did_pollution,
            did_unemployment:        e.did_unemployment,
            did_legitimacy:          e.did_legitimacy,
            did_treasury:            e.did_treasury,
            treatment_post_approval: e.treatment_post_approval,
            treatment_post_gdp:      e.treatment_post_gdp,
        }
    }
}

fn register_all_for_cf(sim: &mut simulator_core::Sim) {
    register_phase1_systems(sim);
    register_law_dispatcher(sim);
    register_crisis_link_system(sim);
    register_legitimacy_system(sim);
    register_metrics_system(sim);
    register_telemetry_system(sim);
}

fn law_template_from_registry(
    registry: &LawRegistry,
    law_id: u64,
    fork_tick: u64,
) -> IpcResult<LawHandle> {
    registry
        .snapshot_active(fork_tick)
        .into_iter()
        .find(|h| h.id.0 == law_id)
        .ok_or_else(|| IpcError(format!("law {law_id} not found in registry at tick {fork_tick}")))
}

/// Single-run counterfactual DiD.
#[tauri::command]
pub async fn get_counterfactual_diff(
    state:        tauri::State<'_, AppState>,
    law_id:       u64,
    window_ticks: u64,
) -> IpcResult<CausalEstimateDto> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;

    let (fork_tick, blob) = bundle
        .snapshot
        .as_ref()
        .map(|(t, b)| (*t, b.clone()))
        .ok_or_else(|| IpcError("no snapshot saved — call save_sim_snapshot first".into()))?;

    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let template = law_template_from_registry(&registry, law_id, bundle.sim.tick())?;

    let mut pair = CounterfactualPair::from_blob(&blob, register_all_for_cf)
        .map_err(|e| IpcError(format!("fork: {e}")))?;
    pair.apply_treatment(LawHandle {
        effective_from_tick: fork_tick,
        ..template
    });
    pair.step_both(window_ticks as u32);

    Ok(pair.compute_did(fork_tick, window_ticks).into())
}

/// Monte Carlo summary DTO.
#[derive(serde::Serialize)]
pub struct MonteCarloSummaryDto {
    pub n_runs:                   usize,
    pub mean_did_approval:        Option<f32>,
    pub std_did_approval:         Option<f32>,
    pub p5_did_approval:          Option<f32>,
    pub p95_did_approval:         Option<f32>,
    pub mean_did_gdp:             Option<f64>,
    pub std_did_gdp:              Option<f64>,
    pub p5_did_gdp:               Option<f64>,
    pub p95_did_gdp:              Option<f64>,
    pub mean_did_pollution:       Option<f64>,
    pub std_did_pollution:        Option<f64>,
    pub p5_did_pollution:         Option<f64>,
    pub p95_did_pollution:        Option<f64>,
    pub mean_did_unemployment:    Option<f32>,
    pub std_did_unemployment:     Option<f32>,
    pub p5_did_unemployment:      Option<f32>,
    pub p95_did_unemployment:     Option<f32>,
    pub mean_did_legitimacy:      Option<f32>,
    pub std_did_legitimacy:       Option<f32>,
    pub p5_did_legitimacy:        Option<f32>,
    pub p95_did_legitimacy:       Option<f32>,
    pub mean_did_treasury:        Option<f64>,
    pub std_did_treasury:         Option<f64>,
    pub p5_did_treasury:          Option<f64>,
    pub p95_did_treasury:         Option<f64>,
    pub mean_did_income:          Option<f64>,
    pub std_did_income:           Option<f64>,
    pub p5_did_income:            Option<f64>,
    pub p95_did_income:           Option<f64>,
    pub mean_did_wealth:          Option<f64>,
    pub std_did_wealth:           Option<f64>,
    pub p5_did_wealth:            Option<f64>,
    pub p95_did_wealth:           Option<f64>,
    pub mean_did_health:          Option<f32>,
    pub std_did_health:           Option<f32>,
    pub p5_did_health:            Option<f32>,
    pub p95_did_health:           Option<f32>,
    pub mean_did_approval_by_quintile: [Option<f32>; 5],
    pub p5_did_approval_by_quintile:   [Option<f32>; 5],
    pub p95_did_approval_by_quintile:  [Option<f32>; 5],
}

impl From<MonteCarloSummary> for MonteCarloSummaryDto {
    fn from(s: MonteCarloSummary) -> Self {
        Self {
            n_runs:                s.n_runs,
            mean_did_approval:     s.mean_did_approval,
            std_did_approval:      s.std_did_approval,
            p5_did_approval:       s.p5_did_approval,
            p95_did_approval:      s.p95_did_approval,
            mean_did_gdp:          s.mean_did_gdp,
            std_did_gdp:           s.std_did_gdp,
            p5_did_gdp:            s.p5_did_gdp,
            p95_did_gdp:           s.p95_did_gdp,
            mean_did_pollution:    s.mean_did_pollution,
            std_did_pollution:     s.std_did_pollution,
            p5_did_pollution:      s.p5_did_pollution,
            p95_did_pollution:     s.p95_did_pollution,
            mean_did_unemployment: s.mean_did_unemployment,
            std_did_unemployment:  s.std_did_unemployment,
            p5_did_unemployment:   s.p5_did_unemployment,
            p95_did_unemployment:  s.p95_did_unemployment,
            mean_did_legitimacy:   s.mean_did_legitimacy,
            std_did_legitimacy:    s.std_did_legitimacy,
            p5_did_legitimacy:     s.p5_did_legitimacy,
            p95_did_legitimacy:    s.p95_did_legitimacy,
            mean_did_treasury:     s.mean_did_treasury,
            std_did_treasury:      s.std_did_treasury,
            p5_did_treasury:       s.p5_did_treasury,
            p95_did_treasury:      s.p95_did_treasury,
            mean_did_income:       s.mean_did_income,
            std_did_income:        s.std_did_income,
            p5_did_income:         s.p5_did_income,
            p95_did_income:        s.p95_did_income,
            mean_did_wealth:       s.mean_did_wealth,
            std_did_wealth:        s.std_did_wealth,
            p5_did_wealth:         s.p5_did_wealth,
            p95_did_wealth:        s.p95_did_wealth,
            mean_did_health:       s.mean_did_health,
            std_did_health:        s.std_did_health,
            p5_did_health:         s.p5_did_health,
            p95_did_health:        s.p95_did_health,
            mean_did_approval_by_quintile: s.mean_did_approval_by_quintile,
            p5_did_approval_by_quintile:   s.p5_did_approval_by_quintile,
            p95_did_approval_by_quintile:  s.p95_did_approval_by_quintile,
        }
    }
}

/// Run Monte Carlo counterfactual simulation and return summary statistics.
#[tauri::command]
pub async fn run_monte_carlo(
    state:        tauri::State<'_, AppState>,
    law_id:       u64,
    window_ticks: u64,
    n_runs:       u32,
) -> IpcResult<MonteCarloSummaryDto> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;

    let (fork_tick, blob) = bundle
        .snapshot
        .as_ref()
        .map(|(t, b)| (*t, b.clone()))
        .ok_or_else(|| IpcError("no snapshot saved — call save_sim_snapshot first".into()))?;

    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let template = law_template_from_registry(&registry, law_id, bundle.sim.tick())?;
    let template = LawHandle {
        effective_from_tick: fork_tick,
        ..template
    };

    let runner = MonteCarloRunner::new(n_runs, window_ticks);
    let estimates = runner.run(&blob, fork_tick, template, register_all_for_cf);

    Ok(MonteCarloSummary::from_estimates(&estimates).into())
}

// ---- Citizen distribution ──────────────────────────────────────────────────

/// A histogram of citizen-level values bucketed into `n_buckets` equal-width bins.
#[derive(serde::Serialize)]
pub struct HistogramDto {
    /// Left edge of each bucket.
    pub edges:  Vec<f64>,
    /// Count of citizens in each bucket.
    pub counts: Vec<u32>,
    pub min:    f64,
    pub max:    f64,
    pub mean:   f64,
    pub n:      u32,
}

impl HistogramDto {
    fn from_values(values: Vec<f64>, n_buckets: usize) -> Self {
        let n = values.len() as u32;
        if values.is_empty() {
            return Self { edges: vec![], counts: vec![], min: 0.0, max: 0.0, mean: 0.0, n: 0 };
        }
        let min  = values.iter().cloned().fold(f64::INFINITY, f64::min);
        let max  = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        let mean = values.iter().sum::<f64>() / values.len() as f64;
        let range = (max - min).max(1e-9);
        let bucket_w = range / n_buckets as f64;

        let mut counts = vec![0u32; n_buckets];
        let mut edges  = Vec::with_capacity(n_buckets);
        for i in 0..n_buckets { edges.push(min + i as f64 * bucket_w); }

        for v in &values {
            let idx = (((v - min) / bucket_w) as usize).min(n_buckets - 1);
            counts[idx] += 1;
        }
        Self { edges, counts, min, max, mean, n }
    }
}

#[derive(serde::Serialize)]
pub struct CitizenDistributionDto {
    pub income:       HistogramDto,
    pub wealth:       HistogramDto,
    pub health:       HistogramDto,
    pub productivity: HistogramDto,
    pub n_citizens:   u32,
}

/// Pure inner function — testable without Tauri state.
fn citizen_distribution_core(
    w:         &mut simulator_core::bevy_ecs::world::World,
    region_id: Option<u32>,
) -> CitizenDistributionDto {
    let mut income_vals = Vec::new();
    let mut wealth_vals = Vec::new();
    let mut health_vals = Vec::new();
    let mut prod_vals   = Vec::new();

    for (inc, wlt, hlt, prd, loc) in w
        .query::<(&Income, &Wealth, &Health, &Productivity, &Location)>()
        .iter(w)
    {
        if region_id.is_none_or(|id| loc.0.0 == id) {
            income_vals.push(inc.0.to_num::<f64>());
            wealth_vals.push(wlt.0.to_num::<f64>());
            health_vals.push(hlt.0.to_num::<f64>());
            prod_vals.push(prd.0.to_num::<f64>());
        }
    }

    let n_citizens = income_vals.len() as u32;
    CitizenDistributionDto {
        income:       HistogramDto::from_values(income_vals,  12),
        wealth:       HistogramDto::from_values(wealth_vals,  12),
        health:       HistogramDto::from_values(health_vals,  10),
        productivity: HistogramDto::from_values(prod_vals,    10),
        n_citizens,
    }
}

#[tauri::command]
pub async fn get_citizen_distribution(
    state:     tauri::State<'_, AppState>,
    region_id: Option<u32>,
) -> IpcResult<CitizenDistributionDto> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    Ok(citizen_distribution_core(&mut bundle.sim.world, region_id))
}

/// Correlated citizen sample for scatter-plot visualisation.
/// Each entry is [income, wealth, health, productivity].
/// Returns at most `max_points` citizens, sampled uniformly when the world
/// has more citizens than requested (deterministic stride-based sampling).
#[tauri::command]
pub async fn get_citizen_scatter(
    state:      tauri::State<'_, AppState>,
    max_points: u32,
    region_id:  Option<u32>,
) -> IpcResult<Vec<[f64; 4]>> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let w = &mut bundle.sim.world;

    // Single pass; filter by region when requested.
    let all: Vec<[f64; 4]> = w
        .query::<(&Income, &Wealth, &Health, &Productivity, &Location)>()
        .iter(w)
        .filter(|(_, _, _, _, loc)| region_id.is_none_or(|id| loc.0.0 == id))
        .map(|(inc, wlt, hlt, prd, _)| [
            inc.0.to_num::<f64>(),
            wlt.0.to_num::<f64>(),
            hlt.0.to_num::<f64>(),
            prd.0.to_num::<f64>(),
        ])
        .collect();

    // Stride-based subsample so scatter is representative.
    let out = if all.len() <= max_points as usize {
        all
    } else {
        let stride = all.len() as f64 / max_points as f64;
        (0..max_points as usize)
            .map(|i| all[(i as f64 * stride) as usize])
            .collect()
    };

    Ok(out)
}

// ---- Batched step + state ─────────────────────────────────────────────────

/// Result of `step_and_get_state`: all data the UI needs per tick, in one IPC call.
/// Replaces four separate round-trips (step_sim + get_current_state + get_metrics_rows
/// + list_laws), cutting autostep IPC overhead by ~75%.
#[derive(serde::Serialize)]
pub struct StepResultDto {
    pub tick:    u64,
    pub state:   CurrentStateDto,
    pub metrics: Vec<TickRow>,
    pub laws:    Vec<LawInfoDto>,
}

#[tauri::command]
pub async fn step_and_get_state(
    state:          tauri::State<'_, AppState>,
    ticks:          u32,
    metrics_window: u32,
) -> IpcResult<StepResultDto> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    for _ in 0..ticks { bundle.sim.step(); }
    let tick = bundle.sim.tick();
    let w = &bundle.sim.world;

    // Build CurrentStateDto directly (same logic as get_current_state)
    let clock     = w.resource::<SimClock>();
    let ind       = w.resource::<MacroIndicators>();
    let treasury  = w.resource::<Treasury>();
    let price     = w.resource::<PriceLevel>();
    let pollution = w.resource::<PollutionStock>();
    let debt      = w.resource::<LegitimacyDebt>();
    let rights    = w.resource::<RightsLedger>();
    let crisis    = w.resource::<CrisisState>();
    let _ = clock; // silence unused-variable warning (tick already captured above)
    let (regime_kind, polity_name, franchise_fraction, electoral_system, fused_executive,
         executive_term_limit, judicial_independence, judicial_review_power, state_capacity_score,
         tax_collection_efficiency, enforcement_reach, legal_predictability,
         bureaucratic_effectiveness) = institutional_fields(w);
    let cs = CurrentStateDto {
        tick,
        approval:               ind.approval,
        population:             ind.population,
        gdp:                    ind.gdp.to_num::<f64>(),
        gini:                   ind.gini,
        wealth_gini:            ind.wealth_gini,
        unemployment:           ind.unemployment,
        inflation:              ind.inflation,
        gov_revenue:            ind.government_revenue.to_num::<f64>(),
        gov_expenditure:        ind.government_expenditure.to_num::<f64>(),
        treasury_balance:       treasury.balance.to_num::<f64>(),
        price_level:            price.level,
        pollution_stock:        pollution.stock,
        legitimacy_debt:        debt.stock,
        rights_granted_bits:    rights.granted.bits(),
        rights_granted_count:   ind.rights_granted_count,
        rights_breadth:         ind.rights_breadth,
        crisis_kind:            crisis_kind_u8(crisis.kind),
        crisis_remaining_ticks: crisis.remaining_ticks,
        incumbent_party:        ind.incumbent_party,
        election_margin:        ind.election_margin,
        consecutive_terms:      ind.consecutive_terms,
        last_election_tick:     ind.last_election_tick,
        election_cycle:         ELECTION_PERIOD,
        regime_kind, polity_name, franchise_fraction, electoral_system, fused_executive,
        executive_term_limit, judicial_independence, judicial_review_power, state_capacity_score,
        tax_collection_efficiency, enforcement_reach, legal_predictability,
        bureaucratic_effectiveness,
    };

    // Last `metrics_window` metric rows
    let store = w.resource::<MetricStore>();
    let all: Vec<TickRow> = store.rows().cloned().collect();
    let start = all.len().saturating_sub(metrics_window as usize);
    let metrics = all[start..].to_vec();

    // Active laws
    let registry = w.resource::<LawRegistry>();
    let laws = registry.snapshot_active(tick).iter().map(|h| LawInfoDto {
        id:           h.id.0,
        effect_kind:  effect_kind_str(&h.effect),
        label:        effect_label_str(&h.effect),
        magnitude:    effect_magnitude(&h.effect, h.source.as_ref().map(|s| s.as_str())),
        cadence:      format!("{:?}", h.cadence),
        enacted_tick: h.effective_from_tick,
        repealed:     h.effective_until_tick.is_some(),
    }).collect();

    Ok(StepResultDto { tick, state: cs, metrics, laws })
}

/// Return the original DSL source text for a law, if preserved at enactment.
#[tauri::command]
pub async fn get_law_dsl_source(
    state:  tauri::State<'_, AppState>,
    law_id: u64,
) -> IpcResult<Option<String>> {
    let guard = state.sim.lock().await;
    let bundle = guard.as_ref().ok_or_else(IpcError::no_sim)?;
    let registry = bundle.sim.world.resource::<LawRegistry>();
    let handle = registry.get_handle(LawId(law_id))
        .ok_or_else(|| IpcError(format!("law {law_id} not found")))?;
    Ok(handle.source.as_deref().cloned())
}

/// Per-region aggregate statistics, computed on demand from citizen components.
#[derive(serde::Serialize)]
pub struct RegionStatsDto {
    pub region_id:        u32,
    pub population:       u64,
    pub mean_approval:    f32,
    pub mean_income:      f64,
    pub unemployment_rate: f32,
    pub mean_health:      f32,
}

/// Aggregate citizen components by region and return one record per region.
/// Regions with zero citizens are omitted. Pure function for testability.
fn aggregate_region_stats(w: &mut simulator_core::bevy_ecs::world::World) -> Vec<RegionStatsDto> {
    // Accumulator: region_id → (n, sum_approval, sum_income, n_unemployed, sum_health)
    let mut acc: std::collections::HashMap<u32, (u64, f64, f64, u64, f64)> = Default::default();

    let mut q = w.query::<(&Location, &ApprovalRating, &Income, &EmploymentStatus, &Health)>();
    for (loc, approval, income, employment, health) in q.iter(w) {
        let e = acc.entry(loc.0.0).or_default();
        e.0 += 1;
        e.1 += approval.0.to_num::<f64>();
        e.2 += income.0.to_num::<f64>();
        if *employment == EmploymentStatus::Unemployed { e.3 += 1; }
        e.4 += health.0.to_num::<f64>();
    }

    let mut result: Vec<RegionStatsDto> = acc.into_iter().map(|(region_id, (n, sum_a, sum_i, n_unemp, sum_h))| {
        RegionStatsDto {
            region_id,
            population:        n,
            mean_approval:     (sum_a / n as f64) as f32,
            mean_income:       sum_i / n as f64,
            unemployment_rate: (n_unemp as f64 / n as f64) as f32,
            mean_health:       (sum_h / n as f64) as f32,
        }
    }).collect();
    result.sort_by_key(|r| r.region_id);
    result
}

/// IPC wrapper — delegates to `aggregate_region_stats`.
#[tauri::command]
pub async fn get_region_stats(
    state: tauri::State<'_, AppState>,
) -> IpcResult<Vec<RegionStatsDto>> {
    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    Ok(aggregate_region_stats(&mut bundle.sim.world))
}

#[cfg(test)]
mod region_stats_tests {
    use super::*;
    use simulator_core::{
        Sim,
        components::{
            Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus, Health,
            IdeologyVector, Income, LegalStatuses, Location, Productivity, Sex, Wealth,
        },
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn_citizen(
        world: &mut bevy_ecs::world::World,
        id:         u64,
        region:     u32,
        approval:   f32,
        income:     f64,
        employed:   bool,
        health:     f32,
    ) {
        world.spawn((
            Citizen(CitizenId(id)),
            Age(35),
            Sex::Male,
            Location(RegionId(region)),
            ApprovalRating(Score::from_num(approval)),
            Income(Money::from_num(income as i64)),
            if employed { EmploymentStatus::Employed } else { EmploymentStatus::Unemployed },
            Health(Score::from_num(health)),
            Wealth(Money::from_num(5000_i32)),
            Productivity(Score::from_num(0.7_f32)),
            IdeologyVector([0.0f32; 5]),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
        ));
    }

    #[test]
    fn empty_world_returns_no_regions() {
        let mut sim = Sim::new([0u8; 32]);
        let stats = aggregate_region_stats(&mut sim.world);
        assert!(stats.is_empty(), "no citizens → no region records");
    }

    #[test]
    fn single_region_aggregates_correctly() {
        let mut sim = Sim::new([1u8; 32]);
        // 2 citizens in region 0: one employed, one unemployed
        spawn_citizen(&mut sim.world, 0, 0, 0.8, 3000.0, true,  0.9);
        spawn_citizen(&mut sim.world, 1, 0, 0.4, 1000.0, false, 0.5);

        let stats = aggregate_region_stats(&mut sim.world);
        assert_eq!(stats.len(), 1);
        let r = &stats[0];
        assert_eq!(r.region_id, 0);
        assert_eq!(r.population, 2);
        assert!((r.mean_approval - 0.6).abs() < 0.01, "mean approval: {}", r.mean_approval);
        assert!((r.mean_income - 2000.0).abs() < 1.0,  "mean income: {}",   r.mean_income);
        assert!((r.unemployment_rate - 0.5).abs() < 0.01, "unemployment: {}", r.unemployment_rate);
        assert!((r.mean_health - 0.7).abs() < 0.01,    "mean health: {}",   r.mean_health);
    }

    #[test]
    fn multiple_regions_sorted_by_id() {
        let mut sim = Sim::new([2u8; 32]);
        spawn_citizen(&mut sim.world, 0, 2, 0.6, 3000.0, true, 0.7);
        spawn_citizen(&mut sim.world, 1, 0, 0.5, 2000.0, true, 0.8);
        spawn_citizen(&mut sim.world, 2, 1, 0.7, 4000.0, true, 0.6);

        let stats = aggregate_region_stats(&mut sim.world);
        assert_eq!(stats.len(), 3);
        assert_eq!(stats[0].region_id, 0);
        assert_eq!(stats[1].region_id, 1);
        assert_eq!(stats[2].region_id, 2);
    }

    #[test]
    fn fully_unemployed_region_shows_100pct() {
        let mut sim = Sim::new([3u8; 32]);
        spawn_citizen(&mut sim.world, 0, 5, 0.3, 500.0, false, 0.4);
        spawn_citizen(&mut sim.world, 1, 5, 0.3, 500.0, false, 0.4);

        let stats = aggregate_region_stats(&mut sim.world);
        assert_eq!(stats.len(), 1);
        assert!((stats[0].unemployment_rate - 1.0).abs() < 0.01);
    }

    // ── citizen_distribution_core tests ──────────────────────────────────────

    #[test]
    fn distribution_no_filter_returns_all_citizens() {
        let mut sim = Sim::new([10u8; 32]);
        spawn_citizen(&mut sim.world, 0, 0, 0.6, 2000.0, true,  0.7);
        spawn_citizen(&mut sim.world, 1, 1, 0.5, 3000.0, true,  0.8);
        spawn_citizen(&mut sim.world, 2, 2, 0.4, 1000.0, false, 0.5);

        let dto = citizen_distribution_core(&mut sim.world, None);
        assert_eq!(dto.n_citizens, 3, "all 3 citizens returned with no filter");
        assert!((dto.income.mean - 2000.0).abs() < 1.0, "mean income: {}", dto.income.mean);
    }

    #[test]
    fn distribution_region_filter_returns_only_matching_citizens() {
        let mut sim = Sim::new([11u8; 32]);
        spawn_citizen(&mut sim.world, 0, 0, 0.6, 5000.0, true,  0.9);
        spawn_citizen(&mut sim.world, 1, 0, 0.6, 3000.0, true,  0.9);
        spawn_citizen(&mut sim.world, 2, 1, 0.4, 1000.0, false, 0.5); // different region

        let dto = citizen_distribution_core(&mut sim.world, Some(0));
        assert_eq!(dto.n_citizens, 2, "only region-0 citizens");
        assert!((dto.income.mean - 4000.0).abs() < 1.0, "mean income for region 0: {}", dto.income.mean);
    }

    #[test]
    fn distribution_filter_nonexistent_region_returns_zero() {
        let mut sim = Sim::new([12u8; 32]);
        spawn_citizen(&mut sim.world, 0, 0, 0.6, 2000.0, true, 0.7);

        let dto = citizen_distribution_core(&mut sim.world, Some(99));
        assert_eq!(dto.n_citizens, 0, "region 99 has no citizens");
    }
}

#[cfg(test)]
mod effect_magnitude_tests {
    use super::effect_magnitude;
    use simulator_law::registry::LawEffect;

    // ── PerCitizenIncomeTax ───────────────────────────────────────────────────

    #[test]
    fn income_tax_parses_rate_from_dsl_source() {
        let e = LawEffect::PerCitizenIncomeTax { scope: "taxpayer", owed_def: "owed" };
        // DSL template: "scope taxpayer { define owed = income * 0.250000 }"
        let src = "scope taxpayer { define owed = income * 0.250000 }";
        assert_eq!(effect_magnitude(&e, Some(src)).as_deref(), Some("25.0%"));
    }

    #[test]
    fn income_tax_rounds_rate_to_one_decimal() {
        let e = LawEffect::PerCitizenIncomeTax { scope: "taxpayer", owed_def: "owed" };
        // 0.333333 × 100 = 33.3333… → "33.3%"
        let src = "scope taxpayer { define owed = income * 0.333333 }";
        assert_eq!(effect_magnitude(&e, Some(src)).as_deref(), Some("33.3%"));
    }

    #[test]
    fn income_tax_returns_none_when_no_source() {
        let e = LawEffect::PerCitizenIncomeTax { scope: "taxpayer", owed_def: "owed" };
        assert_eq!(effect_magnitude(&e, None), None);
    }

    #[test]
    fn income_tax_returns_none_for_malformed_source() {
        let e = LawEffect::PerCitizenIncomeTax { scope: "taxpayer", owed_def: "owed" };
        // No '*' separator — rsplit returns the whole string, which won't parse as f64
        let src = "this is not valid DSL";
        assert_eq!(effect_magnitude(&e, Some(src)), None);
    }

    // ── PerCitizenBenefit ─────────────────────────────────────────────────────

    #[test]
    fn benefit_parses_amount_from_dsl_source() {
        let e = LawEffect::PerCitizenBenefit { scope: "citizen", amount_def: "amount" };
        // DSL template: "scope citizen { define amount = 500.000000 }"
        let src = "scope citizen { define amount = 500.000000 }";
        assert_eq!(effect_magnitude(&e, Some(src)).as_deref(), Some("$500/mo"));
    }

    #[test]
    fn benefit_rounds_amount_to_whole_dollar() {
        let e = LawEffect::PerCitizenBenefit { scope: "citizen", amount_def: "amount" };
        let src = "scope citizen { define amount = 1234.567890 }";
        // toFixed(0) of 1234.56789 → "1235"
        assert_eq!(effect_magnitude(&e, Some(src)).as_deref(), Some("$1235/mo"));
    }

    #[test]
    fn benefit_returns_none_when_no_source() {
        let e = LawEffect::PerCitizenBenefit { scope: "citizen", amount_def: "amount" };
        assert_eq!(effect_magnitude(&e, None), None);
    }

    // ── Abatement ─────────────────────────────────────────────────────────────

    #[test]
    fn abatement_formats_pu_and_cost_directly() {
        let e = LawEffect::Abatement { pollution_reduction_pu: 0.5, cost_per_pu: 10_000.0 };
        // No source needed — values come directly from the variant fields
        assert_eq!(
            effect_magnitude(&e, None).as_deref(),
            Some("0.50 PU · $10000/PU"),
        );
    }

    #[test]
    fn abatement_ignores_source_string() {
        let e = LawEffect::Abatement { pollution_reduction_pu: 1.0, cost_per_pu: 5_000.0 };
        // Source is irrelevant for Abatement — result should be the same with or without it
        let with_src    = effect_magnitude(&e, Some("irrelevant source"));
        let without_src = effect_magnitude(&e, None);
        assert_eq!(with_src, without_src);
        assert_eq!(with_src.as_deref(), Some("1.00 PU · $5000/PU"));
    }

    // ── Edge cases: zero values ────────────────────────────────────────────────

    #[test]
    fn income_tax_zero_rate_formats_as_zero_pct() {
        let e = LawEffect::PerCitizenIncomeTax { scope: "taxpayer", owed_def: "owed" };
        let src = "scope taxpayer { define owed = income * 0.000000 }";
        assert_eq!(effect_magnitude(&e, Some(src)).as_deref(), Some("0.0%"));
    }

    #[test]
    fn benefit_zero_amount_formats_as_zero_dollars() {
        let e = LawEffect::PerCitizenBenefit { scope: "citizen", amount_def: "amount" };
        let src = "scope citizen { define amount = 0.000000 }";
        assert_eq!(effect_magnitude(&e, Some(src)).as_deref(), Some("$0/mo"));
    }

    // ── Other variants return None ────────────────────────────────────────────

    #[test]
    fn registration_marker_returns_none() {
        let e = LawEffect::RegistrationMarker {
            basis:     simulator_law::ig2::AmountBasis::AnnualIncome,
            threshold: 1000.0,
        };
        assert_eq!(effect_magnitude(&e, None), None);
    }

    #[test]
    fn audit_returns_none() {
        let e = LawEffect::Audit { selection_prob: 0.05, penalty_rate: 2.0 };
        assert_eq!(effect_magnitude(&e, None), None);
    }
}

#[tauri::command]
pub fn ping() -> &'static str { "pong" }

#[cfg(test)]
mod enum_string_tests {
    use super::{effect_kind_str, effect_label_str};
    use simulator_law::{ig2::AmountBasis, registry::LawEffect};

    // ── effect_kind_str ───────────────────────────────────────────────────────
    // These strings are the CSS badge class suffixes used by the frontend
    // (badge-income_tax, badge-benefit, etc.) — a mismatch silently breaks UI.

    #[test]
    fn kind_income_tax() {
        let e = LawEffect::PerCitizenIncomeTax { scope: "t", owed_def: "o" };
        assert_eq!(effect_kind_str(&e), "income_tax");
    }

    #[test]
    fn kind_benefit() {
        let e = LawEffect::PerCitizenBenefit { scope: "c", amount_def: "a" };
        assert_eq!(effect_kind_str(&e), "benefit");
    }

    #[test]
    fn kind_registration() {
        let e = LawEffect::RegistrationMarker { basis: AmountBasis::AnnualIncome, threshold: 0.0 };
        assert_eq!(effect_kind_str(&e), "registration");
    }

    #[test]
    fn kind_audit() {
        let e = LawEffect::Audit { selection_prob: 0.1, penalty_rate: 2.0 };
        assert_eq!(effect_kind_str(&e), "audit");
    }

    #[test]
    fn kind_abatement() {
        let e = LawEffect::Abatement { pollution_reduction_pu: 1.0, cost_per_pu: 5000.0 };
        assert_eq!(effect_kind_str(&e), "abatement");
    }

    // ── effect_label_str ──────────────────────────────────────────────────────
    // These are the human-readable badge labels rendered in the Laws table.

    #[test]
    fn label_income_tax() {
        let e = LawEffect::PerCitizenIncomeTax { scope: "t", owed_def: "o" };
        assert_eq!(effect_label_str(&e), "Income Tax");
    }

    #[test]
    fn label_benefit() {
        let e = LawEffect::PerCitizenBenefit { scope: "c", amount_def: "a" };
        assert_eq!(effect_label_str(&e), "Citizen Benefit");
    }

    #[test]
    fn label_registration() {
        let e = LawEffect::RegistrationMarker { basis: AmountBasis::AnnualIncome, threshold: 0.0 };
        assert_eq!(effect_label_str(&e), "Registration");
    }

    #[test]
    fn label_audit() {
        let e = LawEffect::Audit { selection_prob: 0.1, penalty_rate: 2.0 };
        assert_eq!(effect_label_str(&e), "Audit");
    }

    #[test]
    fn label_abatement() {
        let e = LawEffect::Abatement { pollution_reduction_pu: 1.0, cost_per_pu: 5000.0 };
        assert_eq!(effect_label_str(&e), "Abatement");
    }
}
