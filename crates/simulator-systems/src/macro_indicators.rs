//! MacroIndicatorsSystem — Phase::Commit.
//!
//! Recomputes the `MacroIndicators` resource from live ECS state each tick.
//! Uses a single pass over all citizens to compute population, GDP (sum of
//! incomes × 360), Gini coefficient (exact sorted formula), and unemployment
//! rate. Runs in Phase::Commit so it sees the fully-mutated state.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Citizen, EmploymentStatus, Income, Wealth},
    MacroIndicators, Phase, Sim, SimClock,
};
use simulator_types::Money;

pub fn macro_indicators_system(
    clock: Res<SimClock>,
    mut indicators: ResMut<MacroIndicators>,
    q: Query<(&Citizen, &Income, &Wealth, &EmploymentStatus)>,
) {
    // Recompute every tick but skip tick 0 (pre-spawn, world is empty).
    if clock.tick == 0 { return; }

    let mut population: u64 = 0;
    let mut gdp = Money::from_num(0);
    let mut unemployed: u64 = 0;
    // Collect annualised incomes for Gini (sorted).
    let mut incomes: Vec<f64> = Vec::new();

    for (_c, income, _wealth, emp) in q.iter() {
        population += 1;
        let annual = income.0 * Money::from_num(360);
        gdp += annual;
        let inc_f64 = annual.to_num::<f64>().max(0.0);
        incomes.push(inc_f64);
        if matches!(emp, EmploymentStatus::Unemployed) {
            unemployed += 1;
        }
    }

    let gini = if incomes.len() < 2 {
        0.0
    } else {
        gini_sorted(&mut incomes)
    };

    let unemployment = if population == 0 {
        0.0
    } else {
        unemployed as f32 / population as f32
    };

    indicators.population = population;
    indicators.gdp = gdp;
    indicators.gini = gini;
    indicators.unemployment = unemployment;
    // inflation and approval require additional model components — left at
    // their previous values (0.0 default) until Phase 3/5 fill them in.
}

/// Exact Gini via sorted O(n log n) formula.
/// G = (2 * Σ (rank_i * income_i)) / (n * total) - (n+1)/n
fn gini_sorted(v: &mut Vec<f64>) -> f32 {
    v.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap());
    let n = v.len() as f64;
    let total: f64 = v.iter().sum();
    if total == 0.0 { return 0.0; }
    let weighted: f64 = v.iter().enumerate().map(|(i, &x)| (i as f64 + 1.0) * x).sum();
    ((2.0 * weighted / (n * total)) - (n + 1.0) / n) as f32
}

pub fn register_macro_indicators_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(macro_indicators_system.in_set(Phase::Commit));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gini_equal_incomes_is_zero() {
        let mut v = vec![10.0, 10.0, 10.0, 10.0];
        let g = gini_sorted(&mut v);
        assert!(g.abs() < 1e-5, "equal incomes → Gini≈0, got {g}");
    }

    #[test]
    fn gini_perfect_inequality() {
        // One person has all the income.
        let mut v = vec![0.0, 0.0, 0.0, 100.0];
        let g = gini_sorted(&mut v);
        // Exact formula: G = (2*(1*0+2*0+3*0+4*100)/(4*100)) - 5/4 = 8/4 - 5/4 = 3/4 = 0.75
        assert!((g - 0.75).abs() < 1e-5, "perfect inequality → Gini=0.75, got {g}");
    }
}
