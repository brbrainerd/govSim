//! StateFragilitySystem — Phase::Commit, monthly.
//!
//! When `StateCapacity` is present, drifts capacity fields toward failure
//! when aggregate approval is low, and toward recovery when approval is high.
//!
//! ## Model
//!
//! Each monthly tick:
//!   - Low stress  (approval < 0.3): capacity fields × (1 - corruption_drift)
//!   - High stress (approval < 0.2): doubled corruption_drift applied
//!   - Recovery    (approval > 0.7): capacity fields × (1 + recovery_rate)
//!   - Neutral zone [0.2, 0.7]: no drift
//!
//! Fields that drift down: tax_collection_efficiency, enforcement_reach,
//! legal_predictability, bureaucratic_effectiveness.
//! Fields that drift up:   enforcement_noise (deteriorates when state is stressed).
//!
//! All fields clamped to [0.0, 1.0] after each drift step.
//! `corruption_drift` itself never drifts — it is a scenario parameter.
//!
//! ## Calibration
//!
//! At `corruption_drift = 0.02` and monthly firing, a polity stuck at
//! approval 0.25 loses ~2%/month of each capacity field — halving them in
//! roughly 3 simulated years. That matches historical trajectories for
//! weakly-institutionalised states (see e.g. Venezuela 1999–2010).
//!
//! Recovery rate is set to `corruption_drift * 0.5` — rebuilding state
//! capacity is slower than eroding it (historical regularity).

use simulator_core::{MacroIndicators, Phase, Sim, SimClock, StateCapacity};
use simulator_core::bevy_ecs::prelude::*;

/// Monthly period — same cadence as approval updates so the drift reacts
/// to the freshest approval mean.
const FRAGILITY_PERIOD: u64 = 30;

/// Approval floor below which accelerated drift applies.
const HIGH_STRESS_THRESHOLD: f32 = 0.20;
/// Approval floor below which standard drift applies.
const STRESS_THRESHOLD: f32 = 0.30;
/// Approval ceiling above which recovery applies.
const RECOVERY_THRESHOLD: f32 = 0.70;

pub fn state_fragility_system(
    clock: Res<SimClock>,
    macro_: Res<MacroIndicators>,
    mut capacity: Option<ResMut<StateCapacity>>,
) {
    if !clock.tick.is_multiple_of(FRAGILITY_PERIOD) || clock.tick == 0 { return; }

    let Some(ref mut cap) = capacity else { return; };
    if cap.corruption_drift <= 0.0 { return; }

    let approval = macro_.approval;

    if approval < STRESS_THRESHOLD {
        // Stress: capacity fields erode by corruption_drift per tick.
        let multiplier = if approval < HIGH_STRESS_THRESHOLD {
            // Accelerated: double drift when deeply unpopular.
            cap.corruption_drift * 2.0
        } else {
            cap.corruption_drift
        };

        cap.tax_collection_efficiency    = (cap.tax_collection_efficiency    - multiplier).max(0.0);
        cap.enforcement_reach            = (cap.enforcement_reach            - multiplier).max(0.0);
        cap.legal_predictability         = (cap.legal_predictability         - multiplier).max(0.0);
        cap.bureaucratic_effectiveness   = (cap.bureaucratic_effectiveness   - multiplier).max(0.0);
        // Noise deteriorates (increases) under stress — cap at 1.0.
        cap.enforcement_noise            = (cap.enforcement_noise            + multiplier).min(1.0);

    } else if approval > RECOVERY_THRESHOLD {
        // Recovery: capacity fields rebuild at half the drift rate.
        let recovery = cap.corruption_drift * 0.5;

        cap.tax_collection_efficiency    = (cap.tax_collection_efficiency    + recovery).min(1.0);
        cap.enforcement_reach            = (cap.enforcement_reach            + recovery).min(1.0);
        cap.legal_predictability         = (cap.legal_predictability         + recovery).min(1.0);
        cap.bureaucratic_effectiveness   = (cap.bureaucratic_effectiveness   + recovery).min(1.0);
        // Noise recovers (decreases) when the state is healthy.
        cap.enforcement_noise            = (cap.enforcement_noise            - recovery).max(0.0);
    }
    // Neutral zone [0.30, 0.70]: no change.
}

pub fn register_state_fragility_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(state_fragility_system.in_set(Phase::Commit));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::{MacroIndicators, Sim, StateCapacity};

    fn setup_sim(seed: [u8; 32], approval: f32, capacity: StateCapacity) -> Sim {
        let mut sim = Sim::new(seed);
        register_state_fragility_system(&mut sim);
        sim.world.resource_mut::<MacroIndicators>().approval = approval;
        sim.world.insert_resource(capacity);
        sim
    }

    /// No StateCapacity resource → system is a no-op (Option guard).
    #[test]
    fn absent_capacity_resource_is_noop() {
        let mut sim = Sim::new([1u8; 32]);
        register_state_fragility_system(&mut sim);
        sim.world.resource_mut::<MacroIndicators>().approval = 0.1;
        // No StateCapacity inserted.
        for _ in 0..=30 { sim.step(); }
        // Should not panic; no resource to read.
        assert!(sim.world.get_resource::<StateCapacity>().is_none());
    }

    /// Zero corruption_drift → no change regardless of approval.
    #[test]
    fn zero_drift_is_noop() {
        let cap = StateCapacity { corruption_drift: 0.0, ..StateCapacity::default() };
        let mut sim = setup_sim([2u8; 32], 0.1, cap);
        for _ in 0..=30 { sim.step(); }
        let sc = sim.world.resource::<StateCapacity>();
        assert!((sc.tax_collection_efficiency - 1.0).abs() < 1e-6,
            "zero drift must not change capacity");
    }

    /// Low approval (below STRESS_THRESHOLD) → fields drift downward.
    #[test]
    fn low_approval_degrades_capacity() {
        let cap = StateCapacity {
            corruption_drift: 0.02,
            tax_collection_efficiency: 0.8,
            enforcement_reach: 0.8,
            legal_predictability: 0.8,
            bureaucratic_effectiveness: 0.8,
            enforcement_noise: 0.1,
        };
        let mut sim = setup_sim([3u8; 32], 0.25, cap); // below 0.30 threshold

        for _ in 0..=30 { sim.step(); } // one monthly tick

        let sc = sim.world.resource::<StateCapacity>();
        assert!(sc.tax_collection_efficiency < 0.8,
            "tax efficiency should degrade under low approval, got {}", sc.tax_collection_efficiency);
        assert!(sc.enforcement_reach < 0.8,
            "enforcement reach should degrade, got {}", sc.enforcement_reach);
        assert!(sc.enforcement_noise > 0.1,
            "enforcement noise should increase under low approval, got {}", sc.enforcement_noise);
    }

    /// High approval (above RECOVERY_THRESHOLD) → fields drift upward.
    #[test]
    fn high_approval_recovers_capacity() {
        let cap = StateCapacity {
            corruption_drift: 0.04,
            tax_collection_efficiency: 0.7,
            enforcement_reach: 0.7,
            legal_predictability: 0.7,
            bureaucratic_effectiveness: 0.7,
            enforcement_noise: 0.3,
        };
        let mut sim = setup_sim([4u8; 32], 0.80, cap); // above 0.70 threshold

        for _ in 0..=30 { sim.step(); }

        let sc = sim.world.resource::<StateCapacity>();
        assert!(sc.tax_collection_efficiency > 0.7,
            "tax efficiency should recover under high approval, got {}", sc.tax_collection_efficiency);
        assert!(sc.enforcement_noise < 0.3,
            "enforcement noise should decrease under high approval, got {}", sc.enforcement_noise);
    }

    /// Neutral approval [0.30, 0.70] → no drift.
    #[test]
    fn neutral_approval_does_not_drift() {
        let cap = StateCapacity {
            corruption_drift: 0.05,
            tax_collection_efficiency: 0.75,
            enforcement_reach: 0.75,
            legal_predictability: 0.75,
            bureaucratic_effectiveness: 0.75,
            enforcement_noise: 0.2,
        };
        let mut sim = setup_sim([5u8; 32], 0.50, cap); // neutral zone

        for _ in 0..=30 { sim.step(); }

        let sc = sim.world.resource::<StateCapacity>();
        assert!((sc.tax_collection_efficiency - 0.75).abs() < 1e-6,
            "neutral approval must not drift tax efficiency, got {}", sc.tax_collection_efficiency);
        assert!((sc.enforcement_noise - 0.20).abs() < 1e-6,
            "neutral approval must not drift noise, got {}", sc.enforcement_noise);
    }

    /// High stress (approval < 0.20) → double drift applied.
    #[test]
    fn high_stress_applies_double_drift() {
        let drift = 0.02_f32;
        let start = 0.8_f32;

        let cap_single = StateCapacity { corruption_drift: drift,
            tax_collection_efficiency: start, ..StateCapacity::default() };
        let cap_double = StateCapacity { corruption_drift: drift,
            tax_collection_efficiency: start, ..StateCapacity::default() };

        let mut sim_low  = setup_sim([6u8; 32], 0.25, cap_single); // stress (0.25)
        let mut sim_high = setup_sim([7u8; 32], 0.15, cap_double); // high stress (0.15)

        for _ in 0..=30 { sim_low.step(); }
        for _ in 0..=30 { sim_high.step(); }

        let low_eff  = sim_low.world.resource::<StateCapacity>().tax_collection_efficiency;
        let high_eff = sim_high.world.resource::<StateCapacity>().tax_collection_efficiency;

        assert!(high_eff < low_eff,
            "high stress ({high_eff}) should degrade more than low stress ({low_eff})");
    }

    /// Capacity is clamped to [0.0, 1.0] — doesn't go negative or above 1.
    #[test]
    fn capacity_clamped_to_valid_range() {
        let cap = StateCapacity {
            corruption_drift: 1.0, // extreme drift
            tax_collection_efficiency: 0.01,
            enforcement_reach: 0.01,
            legal_predictability: 0.01,
            bureaucratic_effectiveness: 0.01,
            enforcement_noise: 0.99,
        };
        let mut sim = setup_sim([8u8; 32], 0.05, cap); // very low approval

        for _ in 0..=30 { sim.step(); }

        let sc = sim.world.resource::<StateCapacity>();
        assert!(sc.tax_collection_efficiency >= 0.0, "must not go negative");
        assert!(sc.enforcement_noise <= 1.0, "noise must not exceed 1.0");
    }

    /// System guard: does not fire at tick=0.
    #[test]
    fn does_not_fire_at_tick_zero() {
        let cap = StateCapacity {
            corruption_drift: 0.10,
            tax_collection_efficiency: 0.8,
            ..StateCapacity::default()
        };
        let mut sim = setup_sim([9u8; 32], 0.05, cap);
        sim.step(); // tick=0, guard should skip

        let sc = sim.world.resource::<StateCapacity>();
        assert!((sc.tax_collection_efficiency - 0.8).abs() < 1e-6,
            "tick=0 must be skipped, capacity unchanged");
    }

    /// Multiple monthly ticks compound — after 6 months of low approval,
    /// degradation should be proportionally larger than after 1 month.
    #[test]
    fn degradation_compounds_over_multiple_ticks() {
        let cap = StateCapacity {
            corruption_drift: 0.02,
            tax_collection_efficiency: 0.9,
            enforcement_reach: 0.9,
            legal_predictability: 0.9,
            bureaucratic_effectiveness: 0.9,
            enforcement_noise: 0.05,
        };
        let mut sim = setup_sim([10u8; 32], 0.25, cap);

        for _ in 0..(6 * 30 + 1) { sim.step(); } // 6 months

        let sc = sim.world.resource::<StateCapacity>();
        // After 6 months at 0.02 drift, should have lost at least 0.10 (> 0.80).
        assert!(sc.tax_collection_efficiency < 0.80,
            "6 months of degradation should reduce efficiency below 0.80, got {}",
            sc.tax_collection_efficiency);
    }
}
