//! HealthSystem — Phase::Mutate, yearly (360 ticks).
//!
//! Health is a Score (U0F32) in [0, 1]. It evolves based on:
//!   - Age: citizens over 40 lose health each year (accelerates after 60).
//!   - Employment: employed gain a small health bonus, unemployed lose health.
//!   - Wealth (SES gradient): low-wealth citizens face a health penalty;
//!     wealthy citizens enjoy a modest bonus. Wealth buffer in months of income:
//!     < 1 month: -0.010/year (severe deprivation);
//!     1–3 months: -0.004/year (precarious);
//!     3–12 months: 0 (baseline);
//!     ≥ 12 months: +0.002/year (financial security bonus)
//!   - Floor: health never drops below 0.01 (catastrophic illness).
//!   - Ceiling: health never exceeds 0.999 (U0F32 max).
//!
//! Rates per year (approximate):
//!   Healthy decay baseline (age 0-40): +0.001 (slight recovery)
//!   Middle age (41-59):               -0.005
//!   Elderly (60+):                    -0.015  (3× faster)
//!   Unemployment penalty:             -0.003/year
//!   Employment bonus:                 +0.002/year

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Age, Citizen, EmploymentStatus, Health, Income, Wealth},
    Phase, Sim, SimClock, SimRng,
};
use simulator_types::Score;
use rand::Rng;

const HEALTH_PERIOD: u64 = 360;

#[allow(clippy::type_complexity)]
pub fn health_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    mut q: Query<(&Citizen, &Age, &EmploymentStatus, &Income, &Wealth, &mut Health)>,
) {
    if !clock.tick.is_multiple_of(HEALTH_PERIOD) || clock.tick == 0 { return; }

    for (citizen, age, emp, income, wealth, mut health) in q.iter_mut() {
        let h = health.0.to_num::<f32>();

        let age_delta = match age.0 {
            0..=40  =>  0.001_f32,
            41..=59 => -0.005_f32,
            _       => -0.015_f32,
        };

        let emp_delta = match emp {
            EmploymentStatus::Employed        =>  0.002_f32,
            EmploymentStatus::Unemployed      => -0.003_f32,
            EmploymentStatus::Student         =>  0.001_f32,
            EmploymentStatus::Retired         => -0.005_f32,
            EmploymentStatus::OutOfLaborForce => -0.002_f32,
        };

        // Socioeconomic health gradient: wealth buffer in months of income.
        let monthly_income = income.0.to_num::<f64>();
        let wealth_val = wealth.0.to_num::<f64>();
        let wealth_months = if monthly_income > 0.0 { wealth_val / monthly_income } else { 0.0 };
        let wealth_delta = match wealth_months {
            w if w < 1.0  => -0.010_f32,
            w if w < 3.0  => -0.004_f32,
            w if w < 12.0 =>  0.000_f32,
            _              =>  0.002_f32,
        };

        let mut rng = rng_res.derive_citizen("health", clock.tick, citizen.0.0);
        let noise: f32 = (rng.random::<f32>() - 0.5) * 0.004;

        let new_h = (h + age_delta + emp_delta + wealth_delta + noise).clamp(0.01, 0.999);
        health.0 = Score::from_num(new_h);
    }
}

pub fn register_health_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(health_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_core::components::{
        Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus, Health,
        IdeologyVector, Income, LegalStatuses, Location, Productivity, Sex, Wealth,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn(world: &mut World, id: u64, age: u8, emp: EmploymentStatus, health: f32) {
        spawn_with_wealth(world, id, age, emp, health, 10000);
    }

    fn spawn_with_wealth(world: &mut World, id: u64, age: u8, emp: EmploymentStatus, health: f32, wealth_dollars: i64) {
        world.spawn((
            Citizen(CitizenId(id)),
            Age(age), Sex::Female, Location(RegionId(0)),
            Health(Score::from_num(health)),
            Income(Money::from_num(3000_i32)),
            Wealth(Money::from_num(wealth_dollars)),
            emp,
            Productivity(Score::from_num(0.5_f32)),
            IdeologyVector([0.0; 5]),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
        ));
    }

    #[test]
    fn elderly_health_declines() {
        let mut sim = Sim::new([99u8; 32]);
        register_health_system(&mut sim);

        spawn(&mut sim.world, 0, 70, EmploymentStatus::Retired, 0.8);

        for _ in 0..=360 { sim.step(); } // process 1 health year

        let h: f32 = sim.world
            .query::<(&Citizen, &Health)>()
            .iter(&sim.world)
            .next()
            .map(|(_, h)| h.0.to_num::<f32>())
            .unwrap();

        assert!(h < 0.8, "elderly health should decline below 0.8, got {h}");
        assert!(h >= 0.01, "health must not drop below floor");
    }

    #[test]
    fn poor_citizen_health_declines_faster_than_wealthy() {
        // Two young employed citizens starting at same health; one has near-zero wealth.
        let mut sim_poor   = Sim::new([1u8; 32]);
        let mut sim_wealthy = Sim::new([1u8; 32]);
        register_health_system(&mut sim_poor);
        register_health_system(&mut sim_wealthy);

        // Poor: $3000/month income, $100 wealth (< 1 month buffer → -0.010/yr penalty)
        spawn_with_wealth(&mut sim_poor.world,   0, 30, EmploymentStatus::Employed, 0.7, 100);
        // Wealthy: $3000/month income, $100_000 wealth (>12 months → +0.002/yr bonus)
        spawn_with_wealth(&mut sim_wealthy.world, 0, 30, EmploymentStatus::Employed, 0.7, 100_000);

        for _ in 0..=360 { sim_poor.step(); }
        for _ in 0..=360 { sim_wealthy.step(); }

        let poor_h: f32 = sim_poor.world
            .query::<&Health>().single(&sim_poor.world).unwrap().0.to_num();
        let wealthy_h: f32 = sim_wealthy.world
            .query::<&Health>().single(&sim_wealthy.world).unwrap().0.to_num();

        assert!(
            wealthy_h > poor_h,
            "wealthy citizen ({wealthy_h:.4}) should have better health than poor ({poor_h:.4})"
        );
    }

    #[test]
    fn young_employed_health_is_stable_or_grows() {
        let mut sim = Sim::new([55u8; 32]);
        register_health_system(&mut sim);

        spawn(&mut sim.world, 0, 25, EmploymentStatus::Employed, 0.5);

        for _ in 0..=360 { sim.step(); }

        let h: f32 = sim.world
            .query::<(&Citizen, &Health)>()
            .iter(&sim.world)
            .next()
            .map(|(_, h)| h.0.to_num::<f32>())
            .unwrap();

        // Young employed: age_delta +0.001, emp_delta +0.002, noise ∈ [-0.002, 0.002]
        // Net: ≥ 0.5 + 0.003 - 0.002 = 0.501
        assert!(h >= 0.499, "young employed health should be ≥ 0.499, got {h}");
    }
}
