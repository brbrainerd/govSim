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
}
