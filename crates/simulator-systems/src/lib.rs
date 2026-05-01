//! Built-in ECS Systems. Phase 1 implements `taxation` as a working example;
//! the other modules are stubs until later phases.
//!
//! Downstream code wires these in via `register_phase1_systems(&mut sim)`.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Income, Wealth},
    GovernmentLedger, Phase, Sim, SimClock, Treasury,
};
use simulator_telemetry::register_telemetry_system;
use simulator_types::Money;

pub mod approval;
pub mod birth_death;
pub mod crisis;
pub mod election;
pub mod employment;
pub mod education;
pub mod health;
pub mod income_update;
pub mod inflation;
pub mod macro_indicators;
pub mod migration;
pub mod opinion;
pub mod pollution;
pub mod wealth_update;
pub mod judicial {}
pub mod enforcement {}
pub mod media {}

pub use approval::register_approval_system;
pub use crisis::register_crisis_system;
pub use education::register_age_advance_system;
pub use birth_death::register_birth_death_system;
pub use election::{register_election_system, ElectionOutcome};
pub use employment::register_employment_system;
pub use health::register_health_system;
pub use income_update::register_income_update_system;
pub use inflation::register_inflation_system;
pub use macro_indicators::register_macro_indicators_system;
pub use migration::register_migration_system;
pub use opinion::{build_influence_graph, register_opinion_system};
pub use pollution::{apply_abatement, register_pollution_system};
pub use wealth_update::register_wealth_update_system;

/// Flat 20% income tax remitted on the first day of every month
/// (we cheat with a 30-day month for now). Demonstrates the
/// Mutate-phase pattern: ECS query → mutate Wealth → write to Treasury.
pub fn taxation_system(
    clock: Res<SimClock>,
    mut treasury: ResMut<Treasury>,
    mut ledger: ResMut<GovernmentLedger>,
    mut q: Query<(&Income, &mut Wealth)>,
) {
    if !clock.tick.is_multiple_of(30) || clock.tick == 0 { return; }
    let rate = Money::from_num(0.20_f64);
    let mut collected = Money::from_num(0);
    for (income, mut wealth) in &mut q {
        let owed = income.0 * rate;
        wealth.0 -= owed;
        collected += owed;
    }
    treasury.balance += collected;
    ledger.revenue += collected;
}

/// Convenience: register every Phase-1 System on the schedule.
/// Caller must subsequently call `build_influence_graph` and insert the
/// resource before ticking (scenario spawn determines n_citizens).
pub fn register_phase1_systems(sim: &mut Sim) {
    // Mutate phase (in order): income → wealth → tax → employment → health → approval → migration → birth/death
    register_income_update_system(sim);
    register_wealth_update_system(sim);
    register_inflation_system(sim);
    sim.schedule_mut()
        .add_systems(taxation_system.in_set(Phase::Mutate));
    register_employment_system(sim);
    register_health_system(sim);
    register_crisis_system(sim);
    register_pollution_system(sim);
    register_approval_system(sim);
    register_migration_system(sim);
    register_birth_death_system(sim);
    register_age_advance_system(sim);
    // Cognitive phase
    register_opinion_system(sim);
    // Commit phase: macro aggregation + election
    register_macro_indicators_system(sim);
    register_election_system(sim);
    // Telemetry
    register_telemetry_system(sim);
}
