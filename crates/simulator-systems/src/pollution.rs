//! PollutionSystem — Phase::Mutate, monthly.
//!
//! Two concerns in one monthly system:
//!
//! ## 1. Accumulation (runs once per month)
//! Sums all citizens' `ConsumptionExpenditure`, converts to pollution units
//! (PU) using `PollutionStock.emission_rate`, adds to the stock, then applies
//! natural decay:
//!
//!   stock(t+1) = (stock(t) + emissions) * decay
//!
//! ## 2. Feedback (runs every tick)
//! Each citizen's `Health` and `Productivity` are reduced proportionally to
//! the current stock:
//!
//!   health_drag     = stock * HEALTH_COEFF       (subtracted monthly)
//!   productivity_drag = stock * PRODUCTIVITY_COEFF (subtracted monthly)
//!
//! Coefficients are calibrated (2026-05) so that a baseline economy (stock
//! ≈ 200 PU for a modern 25 000-citizen polity at equilibrium) sees ~2%/year
//! health decline; a heavily polluted one (stock > 1 000 PU) ~10%/year.
//!
//! ## Abatement
//! External code (e.g. the law dispatcher) can reduce `emission_rate` or
//! directly subtract from `stock` by calling helper methods on `PollutionStock`.
//! A dedicated `LawEffect::Abatement` wires into the law dispatcher.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{ConsumptionExpenditure, Health, Productivity},
    Phase, PollutionStock, Sim, SimClock,
};
use simulator_types::Score;

const POLLUTION_PERIOD: u64 = 30;

/// Per-stock-unit monthly drag on citizen health [0, 1] scale.
///
/// Recalibrated 2026-05 alongside emission_rate and decay defaults. At the
/// new equilibrium (~200 PU for a modern democracy), drag = 200 × 8e-6 =
/// 0.0016/month ≈ 2%/year — meaningful but not acutely fatal.
const HEALTH_COEFF: f32 = 0.000_008;
/// Per-stock-unit monthly drag on citizen productivity [0, 1] scale.
const PRODUCTIVITY_COEFF: f32 = 0.000_004;

pub fn pollution_system(
    clock: Res<SimClock>,
    mut pollution: ResMut<PollutionStock>,
    consumption_q: Query<&ConsumptionExpenditure>,
    mut citizens_q: Query<(&mut Health, &mut Productivity)>,
) {
    if !clock.tick.is_multiple_of(POLLUTION_PERIOD) || clock.tick == 0 { return; }

    // --- Accumulation ---
    let total_consumption: f64 = consumption_q
        .iter()
        .map(|c| c.0.to_num::<f64>())
        .sum();

    let emissions = total_consumption * pollution.emission_rate;
    pollution.stock = (pollution.stock + emissions) * pollution.decay;
    pollution.stock = pollution.stock.max(0.0);

    // --- Feedback ---
    let stock = pollution.stock as f32;
    let health_drag      = stock * HEALTH_COEFF;
    let productivity_drag = stock * PRODUCTIVITY_COEFF;

    for (mut health, mut productivity) in citizens_q.iter_mut() {
        let new_h = (health.0.to_num::<f32>() - health_drag).clamp(0.0, 1.0);
        let new_p = (productivity.0.to_num::<f32>() - productivity_drag).clamp(0.0, 1.0);
        health.0       = Score::from_num(new_h);
        productivity.0 = Score::from_num(new_p);
    }
}

/// Convenience: subtract `abatement_pu` from the stock (floored at 0).
/// Called by the law dispatcher when an Abatement law fires.
pub fn apply_abatement(pollution: &mut PollutionStock, abatement_pu: f64) {
    pollution.stock = (pollution.stock - abatement_pu).max(0.0);
}

pub fn register_pollution_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(pollution_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::{Sim, PollutionStock};
    use simulator_core::components::{
        Age, Citizen, ConsumptionExpenditure, EmploymentStatus, Health,
        IdeologyVector, Income, LegalStatuses, AuditFlags, Location,
        Productivity, Sex, Wealth, ApprovalRating,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn_citizen(world: &mut bevy_ecs::world::World, id: u64, consumption: f64) {
        let iv = [0.0f32; 5];
        world.spawn((
            Citizen(CitizenId(id)),
            Age(35),
            Sex::Male,
            Location(RegionId(0)),
            Health(Score::from_num(0.9_f32)),
            Income(Money::from_num(3000_i32)),
            Wealth(Money::from_num(10000_i32)),
            EmploymentStatus::Employed,
            Productivity(Score::from_num(0.8_f32)),
            IdeologyVector(iv),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
            ConsumptionExpenditure(Money::from_num(consumption)),
        ));
    }

    #[test]
    fn high_consumption_raises_stock() {
        let mut sim = Sim::new([1u8; 32]);
        register_pollution_system(&mut sim);

        // Set a high emission rate so the effect is clear.
        sim.world.resource_mut::<PollutionStock>().emission_rate = 0.001;

        // Large consumer.
        spawn_citizen(&mut sim.world, 0, 10_000.0);

        // 31 steps → system fires once at tick=30.
        for _ in 0..31 { sim.step(); }

        let stock = sim.world.resource::<PollutionStock>().stock;
        assert!(stock > 0.0, "pollution stock should rise with consumption, got {stock}");
    }

    #[test]
    fn high_pollution_drags_health_and_productivity() {
        let mut sim = Sim::new([2u8; 32]);
        register_pollution_system(&mut sim);

        // Inject a large pre-existing stock.
        sim.world.resource_mut::<PollutionStock>().stock = 10.0;

        spawn_citizen(&mut sim.world, 0, 0.0); // no consumption so we isolate feedback

        // Record baseline.
        let (h_before, p_before) = {
            let mut q = sim.world.query::<(&Health, &Productivity)>();
            let (h, p) = q.single(&sim.world).unwrap();
            (h.0.to_num::<f32>(), p.0.to_num::<f32>())
        };

        for _ in 0..31 { sim.step(); }

        let (h_after, p_after) = {
            let mut q = sim.world.query::<(&Health, &Productivity)>();
            let (h, p) = q.single(&sim.world).unwrap();
            (h.0.to_num::<f32>(), p.0.to_num::<f32>())
        };

        assert!(h_after < h_before, "high pollution should drag health: {h_after} < {h_before}");
        assert!(p_after < p_before, "high pollution should drag productivity: {p_after} < {p_before}");
    }

    #[test]
    fn no_consumption_stock_decays_to_zero() {
        let mut sim = Sim::new([3u8; 32]);
        register_pollution_system(&mut sim);

        sim.world.resource_mut::<PollutionStock>().stock = 1.0;
        // No citizens → no consumption → no emissions, only decay.

        // 12 months = 360 steps + 1 to fire the last one.
        for _ in 0..361 { sim.step(); }

        let stock = sim.world.resource::<PollutionStock>().stock;
        // After 12 monthly ticks with default decay=0.95: 1.0 × 0.95^12 ≈ 0.540.
        assert!(stock < 1.0, "stock should decay without emissions, got {stock}");
        assert!(stock > 0.0, "stock should not instantly vanish, got {stock}");
    }

    #[test]
    fn apply_abatement_clamps_at_zero() {
        let mut p = PollutionStock { stock: 2.0, ..Default::default() };
        apply_abatement(&mut p, 5.0); // over-abate
        assert_eq!(p.stock, 0.0);
    }
}
