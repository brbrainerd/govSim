//! IncomeUpdateSystem — Phase::Mutate, quarterly (90 ticks).
//!
//! Income (base wage) evolves over time driven by:
//!   1. Productivity drift: random walk proportional to productivity score.
//!   2. Natural-wage mean reversion: income gravitates toward the productivity-
//!      implied natural wage (prod_score × NATURAL_WAGE_SCALE), enabling
//!      upward mobility for high-skill workers and downward pressure for low-skill.
//!   3. On-the-job learning: employed citizens accumulate productivity slowly,
//!      raising their long-run wage ceiling (bounded at PROD_CAP).
//!   4. Wage scarring: income erodes each quarter while unemployed.
//!   5. Global floor: income never falls below MINIMUM_WAGE.
//!
//! This runs quarterly to avoid unrealistic income volatility.
//!
//! Income is stored in Money (I64F64) per month; annual = income × 12.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Citizen, EmploymentStatus, Income, Productivity},
    Phase, Sim, SimClock, SimRng,
};
use simulator_types::{Money, Score};
use rand::Rng;

/// Minimum monthly income floor (~$18k/year).
const MINIMUM_WAGE_MONTHLY: f64 = 1_500.0;
const INCOME_UPDATE_PERIOD: u64 = 90;

/// Random drift magnitude: ±2% per quarter.
const PRODUCTIVITY_DRIFT: f64 = 0.02;

/// Wage-scarring factor: -0.5% per quarter while unemployed.
const SCARRING_RATE: f64 = 0.005;

/// Natural-wage scale: a citizen with prod_score=1.0 has a natural wage of
/// NATURAL_WAGE_SCALE per month; income is pulled 3% per quarter toward this.
const NATURAL_WAGE_SCALE: f64 = 8_000.0; // ~$96k/year for top-skill worker
const MEAN_REVERSION_RATE: f64 = 0.03;

/// On-the-job learning rate: +0.1% productivity per quarter while employed.
const OJT_RATE: f64 = 0.001;
/// Productivity accumulation cap (Score is U0F32 — must stay below 1.0).
const PROD_CAP: f64 = 0.98;

#[allow(clippy::type_complexity)]
pub fn income_update_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    mut q: Query<(&Citizen, &EmploymentStatus, &mut Productivity, &mut Income)>,
) {
    if !clock.tick.is_multiple_of(INCOME_UPDATE_PERIOD) || clock.tick == 0 { return; }

    let floor = Money::from_num(MINIMUM_WAGE_MONTHLY);

    for (citizen, emp, mut productivity, mut income) in q.iter_mut() {
        let current = income.0.to_num::<f64>();
        let prod_score = productivity.0.to_num::<f64>();

        let new_income = match emp {
            EmploymentStatus::Employed => {
                let mut rng = rng_res.derive_citizen("income_update", clock.tick, citizen.0.0);
                let bias = (prod_score - 0.5) * PRODUCTIVITY_DRIFT;
                let noise: f64 = (rng.random::<f64>() - 0.5) * PRODUCTIVITY_DRIFT;

                // Mean reversion toward productivity-implied natural wage.
                let natural_wage = MINIMUM_WAGE_MONTHLY + prod_score * NATURAL_WAGE_SCALE;
                let reversion = (natural_wage - current) * MEAN_REVERSION_RATE;

                // On-the-job learning: accumulate productivity, capped below 1.0.
                let new_prod = (prod_score + OJT_RATE).min(PROD_CAP);
                productivity.0 = Score::from_num(new_prod as f32);

                current * (1.0 + bias + noise) + reversion
            }
            EmploymentStatus::Unemployed => {
                current * (1.0 - SCARRING_RATE)
            }
            EmploymentStatus::Student => {
                let mut rng = rng_res.derive_citizen("income_update", clock.tick, citizen.0.0);
                let growth: f64 = rng.random::<f64>() * 0.005;
                current * (1.0 + growth)
            }
            EmploymentStatus::Retired | EmploymentStatus::OutOfLaborForce => current,
        };

        income.0 = Money::from_num(new_income.max(MINIMUM_WAGE_MONTHLY)).max(floor);
    }
}

pub fn register_income_update_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(income_update_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_core::components::{
        Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus,
        IdeologyVector, Income, LegalStatuses, Location, Productivity,
        Sex, Wealth, Health,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn(world: &mut bevy_ecs::world::World, id: u64, emp: EmploymentStatus, income: f64, prod: f32) {
        world.spawn((
            Citizen(CitizenId(id)),
            Age(35), Sex::Male, Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(income)),
            Wealth(Money::from_num(10000_i32)),
            emp,
            Productivity(Score::from_num(prod)),
            IdeologyVector([0.0; 5]),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
        ));
    }

    #[test]
    fn unemployed_income_erodes() {
        let mut sim = Sim::new([7u8; 32]);
        register_income_update_system(&mut sim);

        spawn(&mut sim.world, 0, EmploymentStatus::Unemployed, 4000.0, 0.5);

        // Run 4 quarters.
        for _ in 0..360 { sim.step(); }

        let income: f64 = sim.world
            .query::<(&Citizen, &Income)>()
            .iter(&sim.world)
            .find(|(c, _)| c.0.0 == 0)
            .map(|(_, i)| i.0.to_num::<f64>())
            .unwrap();

        assert!(income < 4000.0, "unemployed income should erode below 4000, got {income:.2}");
        assert!(income >= MINIMUM_WAGE_MONTHLY, "income must not fall below minimum wage");
    }

    #[test]
    fn high_skill_employed_income_rises_toward_natural_wage() {
        // A citizen with prod=0.9 earning below natural wage should trend upward
        // over 8 quarters due to mean reversion.
        let mut sim = Sim::new([21u8; 32]);
        register_income_update_system(&mut sim);

        let initial_income = 2_000.0; // below natural wage for prod=0.9
        spawn(&mut sim.world, 0, EmploymentStatus::Employed, initial_income, 0.9);

        for _ in 0..720 { sim.step(); } // 8 quarters

        let income: f64 = sim.world
            .query::<(&Citizen, &Income)>()
            .iter(&sim.world)
            .find(|(c, _)| c.0.0 == 0)
            .map(|(_, i)| i.0.to_num::<f64>())
            .unwrap();

        assert!(
            income > initial_income,
            "high-skill employed citizen income should rise above {initial_income:.0}, got {income:.2}"
        );
    }

    #[test]
    fn employment_accumulates_productivity() {
        let mut sim = Sim::new([23u8; 32]);
        register_income_update_system(&mut sim);

        spawn(&mut sim.world, 0, EmploymentStatus::Employed, 4000.0, 0.5);

        for _ in 0..360 { sim.step(); } // 4 quarters

        let prod: f32 = sim.world
            .query::<(&Citizen, &Productivity)>()
            .iter(&sim.world)
            .find(|(c, _)| c.0.0 == 0)
            .map(|(_, p)| p.0.to_num::<f32>())
            .unwrap();

        assert!(prod > 0.5, "productivity should increase while employed, got {prod:.4}");
    }

    #[test]
    fn income_never_below_minimum() {
        let mut sim = Sim::new([13u8; 32]);
        register_income_update_system(&mut sim);

        // Start at minimum, stay unemployed.
        spawn(&mut sim.world, 0, EmploymentStatus::Unemployed, MINIMUM_WAGE_MONTHLY, 0.0);

        for _ in 0..1800 { sim.step(); } // 20 quarters

        let income: f64 = sim.world
            .query::<(&Citizen, &Income)>()
            .iter(&sim.world)
            .next()
            .map(|(_, i)| i.0.to_num::<f64>())
            .unwrap();

        assert!(income >= MINIMUM_WAGE_MONTHLY - 1.0,
            "income below minimum wage: {income:.2}");
    }

    #[test]
    fn retired_income_unchanged_across_quarters() {
        // Retired citizens fall through to `current` with no modification.
        let mut sim = Sim::new([30u8; 32]);
        register_income_update_system(&mut sim);

        let initial = 2_500.0;
        spawn(&mut sim.world, 0, EmploymentStatus::Retired, initial, 0.5);

        // Run 4 quarters (360 ticks → 4 firings).
        for _ in 0..360 { sim.step(); }

        let income: f64 = sim.world
            .query::<(&Citizen, &Income)>()
            .iter(&sim.world)
            .next()
            .map(|(_, i)| i.0.to_num::<f64>())
            .unwrap();

        assert!(
            (income - initial).abs() < 1.0,
            "retired income should be unchanged at {initial}, got {income:.2}"
        );
    }

    #[test]
    fn out_of_labor_force_income_unchanged() {
        // OutOfLaborForce falls through to `current` same as Retired.
        let mut sim = Sim::new([31u8; 32]);
        register_income_update_system(&mut sim);

        let initial = 1_800.0;
        spawn(&mut sim.world, 0, EmploymentStatus::OutOfLaborForce, initial, 0.3);

        for _ in 0..360 { sim.step(); }

        let income: f64 = sim.world
            .query::<(&Citizen, &Income)>()
            .iter(&sim.world)
            .next()
            .map(|(_, i)| i.0.to_num::<f64>())
            .unwrap();

        assert!(
            (income - initial).abs() < 1.0,
            "out-of-labor-force income should be unchanged at {initial}, got {income:.2}"
        );
    }

    #[test]
    fn student_income_grows_slightly() {
        // Students get a small random growth each quarter (0–0.5%).
        // Over 4 quarters, expected income ≥ initial.
        let mut sim = Sim::new([32u8; 32]);
        register_income_update_system(&mut sim);

        let initial = 2_000.0;
        spawn(&mut sim.world, 0, EmploymentStatus::Student, initial, 0.4);

        for _ in 0..360 { sim.step(); }

        let income: f64 = sim.world
            .query::<(&Citizen, &Income)>()
            .iter(&sim.world)
            .next()
            .map(|(_, i)| i.0.to_num::<f64>())
            .unwrap();

        assert!(
            income >= initial,
            "student income should not decrease, got {income:.2} (started {initial:.2})"
        );
    }
}
