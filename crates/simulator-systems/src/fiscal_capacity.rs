//! FiscalCapacitySystem — Phase::Commit, monthly.
//!
//! Closes the missing feedback loop between fiscal policy and state capacity.
//! Sister system to `state_fragility_system` — composes additively. Where
//! state_fragility is *legitimacy-driven* (low approval erodes capacity),
//! this system is *fiscally-driven* (sustained surplus or deficit).
//!
//! ## Why
//!
//! Without a fiscal feedback loop, `StateCapacity` was effectively cosmetic:
//! the player could enact a Capacity Modify law to push a field up or down,
//! but nothing endogenous moved capacity in response to actual fiscal stance.
//! In real polities, sustained fiscal investment funds expanded administrative
//! capacity (more inspectors, better courts, modernised systems) and sustained
//! deficits force austerity — payroll arrears, hiring freezes, infrastructure
//! decay — that erode it.
//!
//! ## Model
//!
//! Each monthly tick, compute the treasury-to-GDP ratio:
//!   `r = treasury_balance / max(gdp, 1)`
//!
//! - **Surplus** (r > +SURPLUS_THRESHOLD, treasury healthy):
//!   `tax_collection_efficiency`, `enforcement_reach`,
//!   `legal_predictability`, `bureaucratic_effectiveness` rise by INVEST_RATE;
//!   `enforcement_noise` falls by INVEST_RATE.
//! - **Austerity** (r < -DEFICIT_THRESHOLD, treasury bleeding):
//!   the same four "good" fields fall by AUSTERITY_RATE (which is 2× INVEST_RATE
//!   to capture the empirical regularity that capacity erodes faster than it
//!   builds — see `state_fragility.rs` calibration notes); noise rises.
//! - **Stable zone** (r ∈ [-DEFICIT_THRESHOLD, +SURPLUS_THRESHOLD]): no drift.
//!
//! All fields clamped to [0.0, 1.0] after each step. The system is a no-op
//! when `StateCapacity` is absent (Option guard).
//!
//! ## Calibration
//!
//! Thresholds are symmetric at ±0.5% of GDP — a small persistent imbalance is
//! enough to trigger the loop. This figure was set empirically by running all
//! three calibrated scenarios (modern_democracy, australia_2022, pre_rights_era)
//! at default settings: their natural treasury equilibrium sits at 0.4–0.8% of
//! GDP, so the threshold lets healthy polities slowly grow capacity while
//! treating any meaningful deficit as fiscal stress. The empirical rate
//! asymmetry (austerity 2× faster than investment) is preserved.
//!
//! INVEST_RATE = 0.005/month → +6% capacity per year of sustained surplus.
//! AUSTERITY_RATE = 0.010/month → −12% capacity per year of sustained deficit.

use simulator_core::{MacroIndicators, Phase, Sim, SimClock, StateCapacity, Treasury};
use simulator_core::bevy_ecs::prelude::*;

const FISCAL_PERIOD:       u64 = 30;
const SURPLUS_THRESHOLD:   f64 = 0.005;  // treasury > +0.5% of monthly GDP
const DEFICIT_THRESHOLD:   f64 = 0.005;  // treasury < −0.5% of monthly GDP
const INVEST_RATE:         f32 = 0.005;
const AUSTERITY_RATE:      f32 = 0.010;

pub fn fiscal_capacity_system(
    clock:    Res<SimClock>,
    macro_:   Res<MacroIndicators>,
    treasury: Res<Treasury>,
    mut capacity: Option<ResMut<StateCapacity>>,
) {
    if !clock.tick.is_multiple_of(FISCAL_PERIOD) || clock.tick == 0 { return; }

    let Some(ref mut cap) = capacity else { return; };

    let gdp = macro_.gdp.to_num::<f64>().max(1.0);
    let treasury_balance = treasury.balance.to_num::<f64>();
    let r = treasury_balance / gdp;

    if r > SURPLUS_THRESHOLD {
        cap.tax_collection_efficiency  = (cap.tax_collection_efficiency  + INVEST_RATE).min(1.0);
        cap.enforcement_reach          = (cap.enforcement_reach          + INVEST_RATE).min(1.0);
        cap.legal_predictability       = (cap.legal_predictability       + INVEST_RATE).min(1.0);
        cap.bureaucratic_effectiveness = (cap.bureaucratic_effectiveness + INVEST_RATE).min(1.0);
        cap.enforcement_noise          = (cap.enforcement_noise          - INVEST_RATE).max(0.0);
    } else if r < -DEFICIT_THRESHOLD {
        cap.tax_collection_efficiency  = (cap.tax_collection_efficiency  - AUSTERITY_RATE).max(0.0);
        cap.enforcement_reach          = (cap.enforcement_reach          - AUSTERITY_RATE).max(0.0);
        cap.legal_predictability       = (cap.legal_predictability       - AUSTERITY_RATE).max(0.0);
        cap.bureaucratic_effectiveness = (cap.bureaucratic_effectiveness - AUSTERITY_RATE).max(0.0);
        cap.enforcement_noise          = (cap.enforcement_noise          + AUSTERITY_RATE).min(1.0);
    }
    // Stable zone: no change.
}

pub fn register_fiscal_capacity_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(fiscal_capacity_system.in_set(Phase::Commit));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_types::Money;

    fn setup_sim(
        seed: [u8; 32],
        treasury_balance: f64,
        gdp: f64,
        capacity: StateCapacity,
    ) -> Sim {
        let mut sim = Sim::new(seed);
        register_fiscal_capacity_system(&mut sim);
        sim.world.resource_mut::<Treasury>().balance = Money::from_num(treasury_balance);
        sim.world.resource_mut::<MacroIndicators>().gdp = Money::from_num(gdp);
        sim.world.insert_resource(capacity);
        sim
    }

    /// Absent StateCapacity → system is a no-op (Option guard).
    #[test]
    fn absent_capacity_resource_is_noop() {
        let mut sim = Sim::new([1u8; 32]);
        register_fiscal_capacity_system(&mut sim);
        sim.world.resource_mut::<Treasury>().balance = Money::from_num(-1_000_000.0);
        sim.world.resource_mut::<MacroIndicators>().gdp = Money::from_num(1_000_000.0);
        for _ in 0..=30 { sim.step(); }
        assert!(sim.world.get_resource::<StateCapacity>().is_none());
    }

    /// Stable zone (treasury ≈ 0) → no drift.
    #[test]
    fn stable_zone_does_not_drift() {
        let cap = StateCapacity {
            tax_collection_efficiency: 0.7,
            enforcement_reach: 0.7,
            legal_predictability: 0.7,
            bureaucratic_effectiveness: 0.7,
            enforcement_noise: 0.2,
            corruption_drift: 0.0,
        };
        let mut sim = setup_sim([2u8; 32], 0.0, 10_000_000.0, cap); // r = 0
        for _ in 0..=30 { sim.step(); }
        let sc = sim.world.resource::<StateCapacity>();
        assert!((sc.tax_collection_efficiency - 0.7).abs() < 1e-6,
            "stable zone must not drift, got {}", sc.tax_collection_efficiency);
    }

    /// Surplus (treasury > +10% GDP) → fields drift upward, noise drifts down.
    #[test]
    fn surplus_grows_capacity() {
        let cap = StateCapacity {
            tax_collection_efficiency: 0.6,
            enforcement_reach: 0.6,
            legal_predictability: 0.6,
            bureaucratic_effectiveness: 0.6,
            enforcement_noise: 0.30,
            corruption_drift: 0.0,
        };
        // r = 0.5 = 50% surplus → growth
        let mut sim = setup_sim([3u8; 32], 5_000_000.0, 10_000_000.0, cap);
        for _ in 0..=30 { sim.step(); }
        let sc = sim.world.resource::<StateCapacity>();
        assert!(sc.tax_collection_efficiency > 0.6,
            "surplus should grow tax efficiency, got {}", sc.tax_collection_efficiency);
        assert!(sc.bureaucratic_effectiveness > 0.6,
            "surplus should grow bureaucracy, got {}", sc.bureaucratic_effectiveness);
        assert!(sc.enforcement_noise < 0.30,
            "surplus should shrink enforcement noise, got {}", sc.enforcement_noise);
    }

    /// Austerity (treasury < −10% GDP) → fields drift down, noise rises.
    #[test]
    fn austerity_erodes_capacity() {
        let cap = StateCapacity {
            tax_collection_efficiency: 0.8,
            enforcement_reach: 0.8,
            legal_predictability: 0.8,
            bureaucratic_effectiveness: 0.8,
            enforcement_noise: 0.10,
            corruption_drift: 0.0,
        };
        // r = -0.5 = severe deficit → austerity
        let mut sim = setup_sim([4u8; 32], -5_000_000.0, 10_000_000.0, cap);
        for _ in 0..=30 { sim.step(); }
        let sc = sim.world.resource::<StateCapacity>();
        assert!(sc.tax_collection_efficiency < 0.8,
            "austerity should erode tax efficiency, got {}", sc.tax_collection_efficiency);
        assert!(sc.enforcement_reach < 0.8,
            "austerity should erode enforcement, got {}", sc.enforcement_reach);
        assert!(sc.enforcement_noise > 0.10,
            "austerity should grow enforcement noise, got {}", sc.enforcement_noise);
    }

    /// Austerity erodes faster than surplus rebuilds (asymmetry calibration).
    #[test]
    fn austerity_erodes_faster_than_surplus_grows() {
        let cap = StateCapacity {
            tax_collection_efficiency: 0.6,
            corruption_drift: 0.0,
            ..StateCapacity::default()
        };
        // 6 months of surplus
        let mut up = setup_sim([5u8; 32], 5_000_000.0, 10_000_000.0, cap.clone());
        for _ in 0..(6 * 30 + 1) { up.step(); }
        let up_eff = up.world.resource::<StateCapacity>().tax_collection_efficiency;

        // 6 months of austerity
        let mut down = setup_sim([5u8; 32], -5_000_000.0, 10_000_000.0, cap);
        for _ in 0..(6 * 30 + 1) { down.step(); }
        let down_eff = down.world.resource::<StateCapacity>().tax_collection_efficiency;

        let up_delta   = (up_eff   - 0.6).abs();
        let down_delta = (0.6 - down_eff).abs();
        assert!(down_delta > up_delta,
            "austerity decay ({down_delta}) should exceed surplus growth ({up_delta})");
    }

    /// Capacity stays clamped to [0, 1] under sustained extremes.
    #[test]
    fn capacity_clamped_to_valid_range() {
        let cap = StateCapacity {
            tax_collection_efficiency: 0.99,
            enforcement_noise: 0.01,
            corruption_drift: 0.0,
            ..StateCapacity::default()
        };
        let mut sim = setup_sim([6u8; 32], 50_000_000.0, 10_000_000.0, cap);
        for _ in 0..(36 * 30 + 1) { sim.step(); } // 3 simulated years of surplus
        let sc = sim.world.resource::<StateCapacity>();
        assert!(sc.tax_collection_efficiency <= 1.0,
            "must not exceed 1.0, got {}", sc.tax_collection_efficiency);
        assert!(sc.enforcement_noise >= 0.0,
            "noise must not go negative, got {}", sc.enforcement_noise);
    }

    /// Calibration regression: a small surplus (~0.7% of GDP, the empirical
    /// equilibrium of the three baseline scenarios) IS in the active zone and
    /// drives capacity upward. This pins the threshold choice so a future
    /// recalibration can't silently drop the baseline polities back into the
    /// no-op stable zone.
    #[test]
    fn baseline_scenario_treasury_ratio_triggers_growth() {
        let cap = StateCapacity {
            tax_collection_efficiency: 0.5,
            corruption_drift: 0.0,
            ..StateCapacity::default()
        };
        // 0.7% of GDP — measured at tick 690 in modern_democracy / australia_2022.
        let mut sim = setup_sim([10u8; 32], 70_000.0, 10_000_000.0, cap);
        for _ in 0..(12 * 30 + 1) { sim.step(); } // 12 months
        let sc = sim.world.resource::<StateCapacity>();
        assert!(sc.tax_collection_efficiency > 0.5,
            "0.7%-of-GDP surplus must trigger growth at the 0.5% threshold, got {}",
            sc.tax_collection_efficiency);
    }

    /// Tick 0 is skipped (avoids drift before any policy has run).
    #[test]
    fn does_not_fire_at_tick_zero() {
        let cap = StateCapacity {
            tax_collection_efficiency: 0.5,
            corruption_drift: 0.0,
            ..StateCapacity::default()
        };
        let mut sim = setup_sim([7u8; 32], -50_000_000.0, 10_000_000.0, cap);
        sim.step(); // tick 0
        let sc = sim.world.resource::<StateCapacity>();
        assert!((sc.tax_collection_efficiency - 0.5).abs() < 1e-6,
            "tick 0 must be skipped, got {}", sc.tax_collection_efficiency);
    }
}
