use std::sync::Arc;

use simulator_core::{CrisisState, LegitimacyDebt, MacroIndicators, PollutionStock,
                     PriceLevel, RightsLedger, SimClock, Treasury};
use simulator_law::{
    dsl::{parser::parse_program, typecheck::typecheck_program},
    registry::{LawEffect, LawHandle},
    Cadence, LawId, LawRegistry,
};
use simulator_metrics::{MetricStore, TickRow, WindowDiff, WindowSummary};

use crate::state::{AppState, IpcError, IpcResult, crisis_kind_u8};

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
    pub crisis_kind:            u8,
    pub crisis_remaining_ticks: u64,
    pub incumbent_party:        u8,
    pub election_margin:        f32,
    pub consecutive_terms:      u32,
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
        crisis_kind:            crisis_kind_u8(crisis.kind),
        crisis_remaining_ticks: crisis.remaining_ticks,
        incumbent_party:        ind.incumbent_party,
        election_margin:        ind.election_margin,
        consecutive_terms:      ind.consecutive_terms,
    })
}

// ---- Law commands ----------------------------------------------------------

#[derive(serde::Serialize)]
pub struct LawInfoDto {
    pub id:           u64,
    pub effect_kind:  String,
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
    let prog = parse_program(&src).map_err(|e| IpcError(format!("dsl: {e:?}")))?;
    typecheck_program(&prog).map_err(|e| IpcError(format!("typecheck: {e:?}")))?;

    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let id = registry.enact(LawHandle {
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
    let prog   = parse_program(&src).map_err(|e| IpcError(format!("dsl: {e:?}")))?;
    typecheck_program(&prog).map_err(|e| IpcError(format!("typecheck: {e:?}")))?;

    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let id = registry.enact(LawHandle {
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
    let src  = "scope env { define dummy = 0.0 }";
    let prog = parse_program(src).map_err(|e| IpcError(format!("dsl: {e:?}")))?;
    typecheck_program(&prog).map_err(|e| IpcError(format!("typecheck: {e:?}")))?;

    let mut guard = state.sim.lock().await;
    let bundle = guard.as_mut().ok_or_else(IpcError::no_sim)?;
    let tick = bundle.sim.tick();
    let registry = bundle.sim.world.resource::<LawRegistry>().clone();
    let id = registry.enact(LawHandle {
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
    pub min_approval:       f32,
    pub max_approval:       f32,
    pub min_gdp:            f64,
    pub max_gdp:            f64,
}

impl From<&WindowSummary> for WindowSummaryDto {
    fn from(s: &WindowSummary) -> Self {
        Self {
            from_tick: s.from_tick, to_tick: s.to_tick, n_rows: s.n_rows,
            mean_approval: s.mean_approval, mean_unemployment: s.mean_unemployment,
            mean_gdp: s.mean_gdp, mean_pollution: s.mean_pollution,
            mean_legitimacy: s.mean_legitimacy, mean_treasury: s.mean_treasury,
            min_approval: s.min_approval, max_approval: s.max_approval,
            min_gdp: s.min_gdp, max_gdp: s.max_gdp,
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
}

impl From<&WindowDiff> for LawEffectDto {
    fn from(d: &WindowDiff) -> Self {
        Self {
            pre: (&d.pre).into(), post: (&d.post).into(),
            delta_approval: d.delta_approval, delta_unemployment: d.delta_unemployment,
            delta_gdp: d.delta_gdp, delta_pollution: d.delta_pollution,
            delta_legitimacy: d.delta_legitimacy, delta_treasury: d.delta_treasury,
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

#[tauri::command]
pub fn ping() -> &'static str { "pong" }
