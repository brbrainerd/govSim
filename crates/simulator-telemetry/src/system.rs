//! `tick_telemetry_system` — Phase::Telemetry.
//!
//! Emits a single structured JSON-encoded tracing event per tick containing
//! the macro indicators. Downstream tools can parse these via `jq` or the
//! Tauri IPC bridge.
//!
//! Fires every `EMIT_PERIOD` ticks to avoid log spam on long runs.
//! Override by setting `UGS_TELEMETRY_PERIOD=1` in the environment.

use simulator_core::{
    bevy_ecs::prelude::*,
    MacroIndicators, Phase, Sim, SimClock, Treasury,
};

/// Emit a telemetry line every N ticks (default 30 — once per sim-month).
const DEFAULT_PERIOD: u64 = 30;

fn emit_period() -> u64 {
    std::env::var("UGS_TELEMETRY_PERIOD")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(DEFAULT_PERIOD)
}

pub fn tick_telemetry_system(
    clock: Res<SimClock>,
    indicators: Res<MacroIndicators>,
    treasury: Res<Treasury>,
) {
    let period = emit_period();
    if clock.tick % period != 0 || clock.tick == 0 { return; }

    // Emit as structured tracing fields so downstream JSON formatters
    // (tracing-subscriber's json layer, or jq on the default fmt layer) can
    // parse them without a dedicated serialization crate here.
    tracing::info!(
        tick               = clock.tick,
        year               = clock.date.year,
        quarter            = clock.date.quarter,
        population         = indicators.population,
        gdp_cents          = indicators.gdp.to_num::<i64>(),
        gini               = indicators.gini,
        unemployment       = indicators.unemployment,
        approval           = indicators.approval,
        treasury_cents     = treasury.balance.to_num::<i64>(),
        revenue_cents      = indicators.government_revenue.to_num::<i64>(),
        expenditure_cents  = indicators.government_expenditure.to_num::<i64>(),
        incumbent_party    = indicators.incumbent_party,
        last_election_tick = indicators.last_election_tick,
        election_margin    = indicators.election_margin,
        "tick_telemetry"
    );
}

pub fn register_telemetry_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(tick_telemetry_system.in_set(Phase::Telemetry));
}
