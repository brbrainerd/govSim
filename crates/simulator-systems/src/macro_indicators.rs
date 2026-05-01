//! MacroIndicatorsSystem — Phase::Commit.
//!
//! Split into two cadences for performance:
//!
//! Every tick (O(n) cheap pass):
//!   population, unemployed count, approval sum — updated each tick so
//!   unemployment and approval are always fresh for the election system.
//!
//! Monthly (every 30 ticks, O(n log n)):
//!   GDP (sum of incomes × 360), Gini coefficient — these don't need
//!   sub-monthly resolution and the Gini sort dominates at large n.
//!
//! Yearly (every 360 ticks):
//!   Flush GovernmentLedger → MacroIndicators and reset for next year.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{ApprovalRating, Citizen, EmploymentStatus, Income, Wealth},
    GovernmentLedger, MacroIndicators, Phase, Sim, SimClock,
};
use simulator_types::Money;

const GINI_PERIOD: u64 = 30;

pub fn macro_indicators_system(
    clock: Res<SimClock>,
    mut indicators: ResMut<MacroIndicators>,
    mut ledger: ResMut<GovernmentLedger>,
    q: Query<(&Citizen, &Income, &Wealth, &EmploymentStatus, &ApprovalRating)>,
) {
    if clock.tick == 0 { return; }

    let compute_gini = clock.tick.is_multiple_of(GINI_PERIOD);

    let mut population: u64 = 0;
    let mut unemployed: u64 = 0;
    let mut approval_sum: f64 = 0.0;
    let cap = if compute_gini { indicators.population as usize + 128 } else { 0 };
    let mut incomes: Vec<f64> = Vec::with_capacity(cap);
    let mut wealths: Vec<f64> = Vec::with_capacity(cap);

    let mut gdp = Money::from_num(0);

    for (_c, income, wealth, emp, approval) in q.iter() {
        population += 1;
        if matches!(emp, EmploymentStatus::Unemployed) { unemployed += 1; }
        approval_sum += approval.0.to_num::<f64>();

        if compute_gini {
            let annual = income.0 * Money::from_num(360);
            gdp += annual;
            incomes.push(annual.to_num::<f64>().max(0.0));
            // Wealth can be negative (debt); shift to ≥0 for Gini via min+offset.
            wealths.push(wealth.0.to_num::<f64>());
        }
    }

    indicators.population = population;
    indicators.unemployment = if population == 0 { 0.0 } else {
        unemployed as f32 / population as f32
    };
    indicators.approval = if population == 0 { 0.0 } else {
        (approval_sum / population as f64) as f32
    };

    if compute_gini {
        indicators.gdp  = gdp;
        indicators.gini = if incomes.len() < 2 { 0.0 } else { gini_sorted(&mut incomes) };
        // Wealth Gini: shift so minimum is 0 before computing.
        if wealths.len() >= 2 {
            let min_w = wealths.iter().cloned().fold(f64::INFINITY, f64::min);
            if min_w < 0.0 {
                let offset = -min_w;
                for w in &mut wealths { *w += offset; }
            }
            indicators.wealth_gini = gini_sorted(&mut wealths);
        }
    }

    if clock.tick.is_multiple_of(360) {
        indicators.government_revenue     = ledger.revenue;
        indicators.government_expenditure = ledger.expenditure;
        ledger.revenue     = Money::from_num(0);
        ledger.expenditure = Money::from_num(0);
    }
}

/// Exact Gini via sorted O(n log n) formula.
fn gini_sorted(v: &mut [f64]) -> f32 {
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
        let mut v = vec![0.0, 0.0, 0.0, 100.0];
        let g = gini_sorted(&mut v);
        assert!((g - 0.75).abs() < 1e-5, "perfect inequality → Gini=0.75, got {g}");
    }
}
