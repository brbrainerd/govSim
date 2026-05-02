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
pub use election::{register_election_system, ElectionOutcome, ELECTION_PERIOD};
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
///
/// When a `StateCapacity` resource is present, the gross owed amount is
/// scaled by `tax_collection_efficiency`: citizens only lose what is
/// actually collected (the leakage / evasion gap stays in their wealth)
/// and only the collected fraction reaches Treasury. Absent the resource
/// the system behaves as before (full collection).
pub fn taxation_system(
    clock: Res<SimClock>,
    mut treasury: ResMut<Treasury>,
    mut ledger: ResMut<GovernmentLedger>,
    capacity: Option<Res<simulator_core::StateCapacity>>,
    mut q: Query<(&Income, &mut Wealth)>,
) {
    if !clock.tick.is_multiple_of(30) || clock.tick == 0 { return; }
    let rate = Money::from_num(0.20_f64);
    // Scale the rate by tax_collection_efficiency (1.0 = perfect; <1.0 leaks).
    let efficiency: f64 = capacity
        .as_ref()
        .map(|c| c.tax_collection_efficiency.clamp(0.0, 1.0) as f64)
        .unwrap_or(1.0);
    let effective_rate = rate * Money::from_num(efficiency);
    let mut collected = Money::from_num(0);
    for (income, mut wealth) in &mut q {
        let owed = income.0 * effective_rate;
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

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::{components::*, StateCapacity};
    use simulator_types::{CitizenId, RegionId, Score};

    fn spawn_taxpayer(world: &mut World, id: u64, monthly_income_dollars: i32) {
        world.spawn((
            Citizen(CitizenId(id)),
            Age(35), Sex::Male, Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(monthly_income_dollars)),
            Wealth(Money::from_num(10_000_i32)),
            EmploymentStatus::Employed,
            Productivity(Score::from_num(0.5_f32)),
            IdeologyVector([0.0_f32; 5]),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses::default(),
            AuditFlags::default(),
        ));
    }

    /// Without StateCapacity resource, taxation collects the full 20% — preserves
    /// pre-Phase-B behaviour exactly.
    #[test]
    fn taxation_without_capacity_collects_full_amount() {
        let mut sim = Sim::new([100u8; 32]);
        sim.schedule_mut().add_systems(taxation_system.in_set(Phase::Mutate));

        // 10 citizens × $3,000 income × 20% = $6,000 collected at tick 30.
        for i in 0..10 { spawn_taxpayer(&mut sim.world, i, 3_000); }

        for _ in 0..=30 { sim.step(); }

        let revenue = sim.world.resource::<GovernmentLedger>().revenue;
        let expected: f64 = 10.0 * 3_000.0 * 0.20;
        let actual: f64 = revenue.to_num();
        assert!((actual - expected).abs() < 1.0,
            "expected ~${expected:.0} revenue, got ${actual:.2}");
    }

    /// With tax_collection_efficiency = 0.5, only half the gross owed amount
    /// reaches the treasury (and only half is deducted from wealth).
    #[test]
    fn taxation_with_low_capacity_collects_proportionally_less() {
        let mut sim = Sim::new([101u8; 32]);
        sim.schedule_mut().add_systems(taxation_system.in_set(Phase::Mutate));
        sim.world.insert_resource(StateCapacity {
            tax_collection_efficiency: 0.5,
            ..StateCapacity::default()
        });

        for i in 0..10 { spawn_taxpayer(&mut sim.world, i, 3_000); }

        for _ in 0..=30 { sim.step(); }

        let revenue = sim.world.resource::<GovernmentLedger>().revenue;
        let expected: f64 = 10.0 * 3_000.0 * 0.20 * 0.5; // half collected
        let actual: f64 = revenue.to_num();
        assert!((actual - expected).abs() < 1.0,
            "expected ~${expected:.0} (half) revenue at 0.5 efficiency, got ${actual:.2}");
    }

    /// At zero efficiency, no revenue is collected and no wealth is deducted.
    #[test]
    fn taxation_with_zero_capacity_collects_nothing() {
        let mut sim = Sim::new([102u8; 32]);
        sim.schedule_mut().add_systems(taxation_system.in_set(Phase::Mutate));
        sim.world.insert_resource(StateCapacity {
            tax_collection_efficiency: 0.0,
            ..StateCapacity::default()
        });

        for i in 0..5 { spawn_taxpayer(&mut sim.world, i, 3_000); }

        for _ in 0..=30 { sim.step(); }

        let revenue = sim.world.resource::<GovernmentLedger>().revenue;
        assert_eq!(revenue, Money::from_num(0),
            "zero efficiency must collect zero revenue");

        // Wealth should be unchanged from initial $10,000 each.
        let wealths: Vec<f64> = sim.world
            .query::<&Wealth>()
            .iter(&sim.world)
            .map(|w| w.0.to_num::<f64>())
            .collect();
        for w in &wealths {
            assert!((w - 10_000.0).abs() < 1e-6,
                "zero-efficiency taxation must not deduct wealth, got ${w}");
        }
    }
}
