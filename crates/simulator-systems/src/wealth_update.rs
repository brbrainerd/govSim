//! WealthUpdateSystem — Phase::Mutate, monthly.
//!
//! Income flow → Wealth accumulation. Each month citizens earn their income
//! (minus taxes which are deducted separately by `taxation_system`). Unemployed
//! citizens earn nothing; students earn a reduced stipend (20% of base income).
//! Retired citizens earn a pension (30% of base income). Out-of-labor earn 0.
//!
//! The system runs *before* taxation in Phase::Mutate ordering to keep the
//! sequence: earn → tax → net. Bevy ECS doesn't guarantee intra-set ordering
//! unless explicitly chained; both systems are in Phase::Mutate and the order
//! is deterministic (added in sequence, bevy uses insertion order within a set).

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{ConsumptionExpenditure, EmploymentStatus, Income, SavingsRate, Wealth},
    Phase, Sim, SimClock,
};
use simulator_types::Money;

const WEALTH_UPDATE_PERIOD: u64 = 30;

/// Effective monthly income before savings split.
fn effective_income(income: Money, emp: &EmploymentStatus) -> Money {
    match emp {
        EmploymentStatus::Employed        => income,
        EmploymentStatus::Unemployed      => Money::from_num(0),
        EmploymentStatus::Student         => income * Money::from_num(0.20_f64),
        EmploymentStatus::Retired         => income * Money::from_num(0.30_f64),
        EmploymentStatus::OutOfLaborForce => Money::from_num(0),
    }
}

#[allow(clippy::type_complexity)]
pub fn wealth_update_system(
    clock: Res<SimClock>,
    mut q: Query<(&Income, &EmploymentStatus, Option<&SavingsRate>, &mut Wealth, Option<&mut ConsumptionExpenditure>)>,
) {
    if !clock.tick.is_multiple_of(WEALTH_UPDATE_PERIOD) || clock.tick == 0 { return; }

    for (income, emp, savings_opt, mut wealth, consumption_opt) in q.iter_mut() {
        let monthly = effective_income(income.0, emp);
        let rate = savings_opt.map_or(0.20_f64, |s| s.0 as f64).clamp(0.0, 1.0);
        let saved = monthly * Money::from_num(rate);
        let consumed = monthly * Money::from_num(1.0 - rate);
        wealth.0 += saved;
        if let Some(mut ce) = consumption_opt {
            ce.0 = consumed;
        }
    }
}

pub fn register_wealth_update_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(wealth_update_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_core::components::{
        Age, ApprovalRating, AuditFlags, Citizen, ConsumptionExpenditure,
        EmploymentStatus, IdeologyVector, Income, LegalStatuses, Location,
        Productivity, SavingsRate, Sex, Wealth, Health,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    /// Spawn a minimal citizen entity with the components needed by wealth_update_system.
    fn spawn_citizen(
        world: &mut bevy_ecs::world::World,
        id: u64,
        emp: EmploymentStatus,
        income: f64,
        initial_wealth: f64,
        savings_rate: Option<f32>,
    ) {
        let mut bundle = world.spawn((
            Citizen(CitizenId(id)),
            Age(35),
            Sex::Male,
            Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(income)),
            Wealth(Money::from_num(initial_wealth)),
            emp,
            Productivity(Score::from_num(0.5_f32)),
            IdeologyVector([0.0f32; 5]),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
            ConsumptionExpenditure(Money::from_num(0.0)),
        ));
        if let Some(rate) = savings_rate {
            bundle.insert(SavingsRate(rate));
        }
    }

    fn wealth_of(world: &mut bevy_ecs::world::World, id: u64) -> f64 {
        world
            .query::<(&Citizen, &Wealth)>()
            .iter(world)
            .find(|(c, _)| c.0.0 == id)
            .map(|(_, w)| w.0.to_num::<f64>())
            .unwrap()
    }

    // ── effective_income ──────────────────────────────────────────────────────

    #[test]
    fn effective_income_employed_returns_full_income() {
        let income = Money::from_num(3000.0_f64);
        let result = effective_income(income, &EmploymentStatus::Employed);
        assert_eq!(result.to_num::<f64>(), 3000.0);
    }

    #[test]
    fn effective_income_unemployed_is_zero() {
        let income = Money::from_num(3000.0_f64);
        let result = effective_income(income, &EmploymentStatus::Unemployed);
        assert_eq!(result.to_num::<f64>(), 0.0);
    }

    #[test]
    fn effective_income_student_is_20_pct() {
        let income = Money::from_num(1000.0_f64);
        let result = effective_income(income, &EmploymentStatus::Student);
        let got = result.to_num::<f64>();
        assert!((got - 200.0).abs() < 1.0, "student income should be ~200, got {got}");
    }

    #[test]
    fn effective_income_retired_is_30_pct() {
        let income = Money::from_num(2000.0_f64);
        let result = effective_income(income, &EmploymentStatus::Retired);
        let got = result.to_num::<f64>();
        assert!((got - 600.0).abs() < 1.0, "retired income should be ~600, got {got}");
    }

    #[test]
    fn effective_income_out_of_labor_is_zero() {
        let income = Money::from_num(5000.0_f64);
        let result = effective_income(income, &EmploymentStatus::OutOfLaborForce);
        assert_eq!(result.to_num::<f64>(), 0.0);
    }

    // ── ECS integration ───────────────────────────────────────────────────────

    #[test]
    fn employed_citizen_wealth_grows_by_savings_fraction() {
        let mut sim = Sim::new([1u8; 32]);
        register_wealth_update_system(&mut sim);

        // income=$3000, 20% savings (default) → +$600/month
        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Employed, 3_000.0, 0.0, None);

        // Clock model: step() runs schedule at tick N then advances to N+1.
        // System fires when schedule sees tick=30 — that's step #31.
        for _ in 0..31 { sim.step(); }

        let wealth = wealth_of(&mut sim.world, 0);
        // Expect exactly one monthly savings deposit: 3000 * 0.20 = 600
        assert!(
            (wealth - 600.0).abs() < 2.0,
            "expected ~$600 wealth after one month, got {wealth:.2}"
        );
    }

    #[test]
    fn unemployed_citizen_wealth_unchanged() {
        let mut sim = Sim::new([2u8; 32]);
        register_wealth_update_system(&mut sim);

        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Unemployed, 3_000.0, 1_000.0, None);

        for _ in 0..31 { sim.step(); } // same timing; effective income=0 so no change

        let wealth = wealth_of(&mut sim.world, 0);
        // Effective income = 0, so savings = 0 → wealth stays at 1000
        assert!(
            (wealth - 1_000.0).abs() < 1.0,
            "unemployed wealth should be ~1000 (unchanged), got {wealth:.2}"
        );
    }

    #[test]
    fn custom_savings_rate_applied_correctly() {
        let mut sim = Sim::new([3u8; 32]);
        register_wealth_update_system(&mut sim);

        // 50% savings rate, $2000 income → +$1000/month
        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Employed, 2_000.0, 0.0, Some(0.5));

        for _ in 0..31 { sim.step(); }

        let wealth = wealth_of(&mut sim.world, 0);
        assert!(
            (wealth - 1_000.0).abs() < 2.0,
            "expected ~$1000 with 50% savings, got {wealth:.2}"
        );
    }

    #[test]
    fn retired_citizen_accumulates_30_pct_pension() {
        let mut sim = Sim::new([4u8; 32]);
        register_wealth_update_system(&mut sim);

        // income=$1000, retired → effective $300/month, default 20% savings → +$60/month
        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Retired, 1_000.0, 0.0, None);

        for _ in 0..31 { sim.step(); }

        let wealth = wealth_of(&mut sim.world, 0);
        let expected = 1_000.0 * 0.30 * 0.20; // 60
        assert!(
            (wealth - expected).abs() < 2.0,
            "expected ~${expected:.0} for retired citizen, got {wealth:.2}"
        );
    }

    #[test]
    fn wealth_accumulates_across_multiple_months() {
        let mut sim = Sim::new([5u8; 32]);
        register_wealth_update_system(&mut sim);

        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Employed, 3_000.0, 0.0, None);

        // System fires at tick=30, 60, 90 → steps #31, #61, #91 → need 91 steps total.
        for _ in 0..91 { sim.step(); }

        let wealth = wealth_of(&mut sim.world, 0);
        // 3 months × $600/month = $1800
        assert!(
            (wealth - 1_800.0).abs() < 5.0,
            "expected ~$1800 after 3 months, got {wealth:.2}"
        );
    }
}
