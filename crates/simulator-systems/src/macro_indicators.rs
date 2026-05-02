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
    GovernmentLedger, MacroIndicators, Phase, PollutionStock, Sim, SimClock,
};
use simulator_types::Money;

const GINI_PERIOD: u64 = 30;

pub fn macro_indicators_system(
    clock: Res<SimClock>,
    mut indicators: ResMut<MacroIndicators>,
    mut ledger: ResMut<GovernmentLedger>,
    pollution: Res<PollutionStock>,
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
        indicators.pollution_stock = pollution.stock;
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

    #[test]
    fn gini_zero_total_returns_zero() {
        // All-zero incomes → total = 0 → Gini = 0 (guard branch).
        let mut v = vec![0.0, 0.0, 0.0];
        let g = gini_sorted(&mut v);
        assert_eq!(g, 0.0, "all-zero incomes should give Gini=0");
    }

    #[test]
    fn gini_two_element_monotone() {
        // Two-element case: one person has all income.
        // Perfect inequality for n=2 → Gini = (n-1)/n = 0.5.
        let mut v = vec![0.0, 100.0];
        let g = gini_sorted(&mut v);
        assert!((g - 0.5).abs() < 1e-5, "two-person perfect inequality → 0.5, got {g}");
    }

    // ── ECS integration ──────────────────────────────────────────────────────

    use simulator_core::Sim;
    use simulator_core::components::{
        Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus,
        Health, IdeologyVector, Income, LegalStatuses, Location,
        Productivity, Sex, Wealth,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn_citizen(
        world: &mut bevy_ecs::world::World,
        id: u64,
        emp: EmploymentStatus,
        income: f64,
        approval: f32,
    ) {
        world.spawn((
            Citizen(CitizenId(id)),
            Age(35), Sex::Male, Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(income)),
            Wealth(Money::from_num(10_000_i32)),
            emp,
            Productivity(Score::from_num(0.5_f32)),
            IdeologyVector([0.0; 5]),
            ApprovalRating(Score::from_num(approval)),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
        ));
    }

    #[test]
    fn population_and_unemployment_tracked_per_tick() {
        // 2 employed + 1 unemployed → population=3, unemployment≈0.333.
        let mut sim = Sim::new([50u8; 32]);
        register_macro_indicators_system(&mut sim);

        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Employed,   3_000.0, 0.5);
        spawn_citizen(&mut sim.world, 1, EmploymentStatus::Employed,   3_000.0, 0.5);
        spawn_citizen(&mut sim.world, 2, EmploymentStatus::Unemployed, 1_500.0, 0.3);

        // 1 step: system runs at tick=0 (first step sees tick=0 and skips),
        // so run 2 steps to get tick=1 which is ≠ 0 and fires the fast path.
        sim.step(); // schedule runs at tick=0, skips
        sim.step(); // schedule runs at tick=1, updates population/unemployment

        let m = sim.world.resource::<MacroIndicators>();
        assert_eq!(m.population, 3, "population should be 3");
        assert!(
            (m.unemployment - 1.0 / 3.0).abs() < 0.01,
            "unemployment should be ~0.333, got {}",
            m.unemployment
        );
    }

    #[test]
    fn approval_mean_computed_correctly() {
        // Citizen 0: approval=0.8, Citizen 1: approval=0.2 → mean=0.5.
        let mut sim = Sim::new([51u8; 32]);
        register_macro_indicators_system(&mut sim);

        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Employed, 3_000.0, 0.8);
        spawn_citizen(&mut sim.world, 1, EmploymentStatus::Employed, 3_000.0, 0.2);

        sim.step(); // tick=0, skips
        sim.step(); // tick=1, fast path fires

        let m = sim.world.resource::<MacroIndicators>();
        assert!(
            (m.approval - 0.5).abs() < 0.01,
            "mean approval should be 0.5, got {}",
            m.approval
        );
    }

    #[test]
    fn monthly_gini_computed_on_multiples_of_30() {
        // Two citizens with equal incomes → Gini=0.
        // System only computes Gini on multiples of 30.
        let mut sim = Sim::new([52u8; 32]);
        register_macro_indicators_system(&mut sim);

        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Employed, 5_000.0, 0.5);
        spawn_citizen(&mut sim.world, 1, EmploymentStatus::Employed, 5_000.0, 0.5);

        // Run 31 steps: schedule fires at tick=30 → monthly path active.
        for _ in 0..31 { sim.step(); }

        let m = sim.world.resource::<MacroIndicators>();
        assert!(
            m.gini.abs() < 0.01,
            "equal incomes → Gini≈0, got {}",
            m.gini
        );
        // GDP = 2 × (5_000 × 360) = 3_600_000.
        let gdp: f64 = m.gdp.to_num();
        assert!(
            (gdp - 3_600_000.0).abs() < 10.0,
            "GDP should be 3_600_000, got {gdp:.2}"
        );
    }
}
