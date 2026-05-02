//! InflationSystem — Phase::Mutate, monthly.
//!
//! Computes the current inflation rate from fiscal-deficit pressure and
//! adjusts each citizen's nominal `ConsumptionExpenditure` upward so that
//! the same real basket costs more over time.
//!
//! Model:
//!   annual_rate = clamp(BASE + deficit_ratio * DEFICIT_MULTIPLIER, 0, MAX)
//!   deficit_ratio = max(0, expenditure - revenue) / max(1, GDP)
//!   monthly_rate  = annual_rate / 12
//!   ConsumptionExpenditure *= (1 + monthly_rate)
//!   PriceLevel.level       *= (1 + monthly_rate)
//!   MacroIndicators.inflation = annual_rate

use simulator_core::{
    bevy_ecs::prelude::*,
    components::ConsumptionExpenditure,
    MacroIndicators, Phase, PriceLevel, Sim, SimClock,
};
use simulator_types::Money;

const BASE_INFLATION:     f64 = 0.02; // 2% annual target
const DEFICIT_MULTIPLIER: f64 = 2.0;  // each 1pp of deficit/GDP adds 2pp inflation
const MAX_INFLATION:      f64 = 0.50; // cap at 50% annual

pub fn inflation_system(
    clock: Res<SimClock>,
    mut indicators: ResMut<MacroIndicators>,
    mut price_level: ResMut<PriceLevel>,
    mut q: Query<&mut ConsumptionExpenditure>,
) {
    if !clock.tick.is_multiple_of(30) || clock.tick == 0 { return; }

    // Fiscal deficit pressure from last year's government accounts.
    let revenue = indicators.government_revenue.to_num::<f64>();
    let expenditure = indicators.government_expenditure.to_num::<f64>();
    let deficit = (expenditure - revenue).max(0.0);
    let gdp = indicators.gdp.to_num::<f64>().max(1.0);
    let deficit_ratio = deficit / gdp;

    let annual_rate = (BASE_INFLATION + deficit_ratio * DEFICIT_MULTIPLIER)
        .clamp(0.0, MAX_INFLATION);
    let monthly_rate = annual_rate / 12.0;

    indicators.inflation = annual_rate as f32;
    price_level.level *= 1.0 + monthly_rate;

    // Inflate every citizen's nominal consumption spending.
    let multiplier = Money::from_num(1.0 + monthly_rate);
    for mut ce in q.iter_mut() {
        ce.0 *= multiplier;
    }
}

pub fn register_inflation_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(inflation_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_core::components::ConsumptionExpenditure;
    use simulator_types::Money;

    #[test]
    fn inflation_raises_consumption_over_time() {
        let mut sim = Sim::new([80u8; 32]);
        register_inflation_system(&mut sim);

        // One citizen with $400/month nominal consumption.
        let initial = Money::from_num(400i64);
        sim.world.spawn(ConsumptionExpenditure(initial));

        // At low fiscal deficit, annual_rate ≈ 2%, monthly ≈ 0.167%.
        // After 12 months (~360 ticks) price level should be ≈ 1.0202.
        for _ in 0..=360 { sim.step(); }

        let final_ce: Money = sim.world
            .query::<&ConsumptionExpenditure>()
            .iter(&sim.world)
            .next()
            .unwrap()
            .0;
        let ratio: f64 = final_ce.to_num::<f64>() / initial.to_num::<f64>();
        // Approximately 2% annual: ratio ∈ [1.015, 1.030].
        assert!(
            ratio > 1.015 && ratio < 1.030,
            "expected ~2% annual inflation on consumption, ratio = {ratio:.4}"
        );

        // PriceLevel should also have risen.
        let pl = sim.world.resource::<PriceLevel>().level;
        assert!(pl > 1.015 && pl < 1.030,
            "price level out of range: {pl:.4}");

        // MacroIndicators::inflation ≈ 2%.
        let inf = sim.world.resource::<MacroIndicators>().inflation;
        assert!((inf - 0.02).abs() < 0.01,
            "inflation indicator should be ~2%, got {inf:.4}");
    }

    #[test]
    fn high_deficit_raises_inflation_above_base() {
        // deficit_ratio = 0.20 (20% of GDP) → annual_rate = 0.02 + 0.20 × 2.0 = 0.42.
        let mut sim = Sim::new([81u8; 32]);
        register_inflation_system(&mut sim);

        {
            let mut m = sim.world.resource_mut::<MacroIndicators>();
            m.gdp               = Money::from_num(1_000_000_i64);
            m.government_expenditure = Money::from_num(300_000_i64);
            m.government_revenue     = Money::from_num(100_000_i64);
            // deficit = 200_000, ratio = 0.20
        }

        // One citizen to keep the expenditure query non-empty.
        sim.world.spawn(ConsumptionExpenditure(Money::from_num(400i64)));

        // Trigger the monthly system (31 steps).
        for _ in 0..31 { sim.step(); }

        let inf = sim.world.resource::<MacroIndicators>().inflation;
        assert!(
            inf > 0.02,
            "high-deficit inflation should exceed 2% baseline, got {inf:.4}"
        );
        assert!(
            (inf - 0.42).abs() < 0.01,
            "expected ~42% annual inflation (deficit 20% GDP), got {inf:.4}"
        );
    }

    #[test]
    fn inflation_rate_capped_at_max() {
        // Extreme deficit: expenditure = 10 × GDP → deficit_ratio > 4.5
        // annual_rate = 0.02 + 4.5 × 2.0 = 9.02 — but capped at MAX_INFLATION (0.50).
        let mut sim = Sim::new([82u8; 32]);
        register_inflation_system(&mut sim);

        {
            let mut m = sim.world.resource_mut::<MacroIndicators>();
            m.gdp               = Money::from_num(100_000_i64);
            m.government_expenditure = Money::from_num(1_000_000_i64);
            m.government_revenue     = Money::from_num(0_i64);
        }

        sim.world.spawn(ConsumptionExpenditure(Money::from_num(400i64)));

        for _ in 0..31 { sim.step(); }

        let inf = sim.world.resource::<MacroIndicators>().inflation;
        assert!(
            (inf - MAX_INFLATION as f32).abs() < 0.001,
            "inflation should be capped at {MAX_INFLATION:.2}, got {inf:.4}"
        );
    }
}
