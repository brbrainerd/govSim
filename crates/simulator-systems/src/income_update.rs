//! IncomeUpdateSystem — Phase::Mutate, quarterly (90 ticks).
//!
//! Income (base wage) evolves over time driven by:
//!   1. Productivity drift: small random walk proportional to productivity score.
//!   2. Employment shock: income resets toward a lower mean when a citizen
//!      becomes unemployed for an extended period (wage scarring).
//!   3. Global floor: income never falls below MINIMUM_WAGE.
//!
//! This runs quarterly (not monthly) to avoid unrealistic income volatility
//! while still reflecting labour-market dynamics over the medium term.
//!
//! Income is stored in Money (I64F64) per month; the annual figure is
//! income × 12 (used for Gini and GDP in macro_indicators).

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Citizen, EmploymentStatus, Income, Productivity},
    Phase, Sim, SimClock, SimRng,
};
use simulator_types::Money;
use rand::Rng;

/// Minimum monthly income floor (equivalent to ~$18k/year after tax).
const MINIMUM_WAGE_MONTHLY: f64 = 1_500.0;
const INCOME_UPDATE_PERIOD: u64 = 90;

/// Maximum monthly income productivity drift (±2% per quarter).
const PRODUCTIVITY_DRIFT: f64 = 0.02;

/// Wage-scarring factor: each quarter unemployed, income shrinks by 0.5%.
const SCARRING_RATE: f64 = 0.005;

pub fn income_update_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    mut q: Query<(&Citizen, &EmploymentStatus, &Productivity, &mut Income)>,
) {
    if !clock.tick.is_multiple_of(INCOME_UPDATE_PERIOD) || clock.tick == 0 { return; }

    let floor = Money::from_num(MINIMUM_WAGE_MONTHLY);

    for (citizen, emp, productivity, mut income) in q.iter_mut() {
        let current = income.0.to_num::<f64>();

        // Productivity score in [0, 1]; higher productivity → larger upside.
        let prod_score = productivity.0.to_num::<f64>();

        let new_income = match emp {
            EmploymentStatus::Employed => {
                // Random walk: ±PRODUCTIVITY_DRIFT, skewed positive by productivity.
                let mut rng = rng_res.derive_citizen("income_update", clock.tick, citizen.0.0);
                let bias = (prod_score - 0.5) * PRODUCTIVITY_DRIFT;
                let noise: f64 = (rng.random::<f64>() - 0.5) * PRODUCTIVITY_DRIFT;
                current * (1.0 + bias + noise)
            }
            EmploymentStatus::Unemployed => {
                // Wage scarring: income erodes while out of work.
                current * (1.0 - SCARRING_RATE)
            }
            EmploymentStatus::Student => {
                // Students' future income grows with productivity investment.
                let mut rng = rng_res.derive_citizen("income_update", clock.tick, citizen.0.0);
                let growth: f64 = rng.random::<f64>() * 0.005;
                current * (1.0 + growth)
            }
            EmploymentStatus::Retired | EmploymentStatus::OutOfLaborForce => {
                // Fixed — no labour-market participation.
                current
            }
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
}
