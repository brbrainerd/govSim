//! HealthSystem — Phase::Mutate, yearly (360 ticks).
//!
//! Health is a Score (U0F32) in [0, 1]. It evolves based on:
//!   - Age: citizens over 40 lose health each year (accelerates after 60).
//!   - Employment: employed gain a small health bonus, unemployed lose health.
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
    components::{Age, Citizen, EmploymentStatus, Health},
    Phase, Sim, SimClock, SimRng,
};
use simulator_types::Score;
use rand::Rng;

const HEALTH_PERIOD: u64 = 360;

pub fn health_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    mut q: Query<(&Citizen, &Age, &EmploymentStatus, &mut Health)>,
) {
    if !clock.tick.is_multiple_of(HEALTH_PERIOD) || clock.tick == 0 { return; }

    for (citizen, age, emp, mut health) in q.iter_mut() {
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

        let mut rng = rng_res.derive_citizen("health", clock.tick, citizen.0.0);
        let noise: f32 = (rng.random::<f32>() - 0.5) * 0.004;

        let new_h = (h + age_delta + emp_delta + noise).clamp(0.01, 0.999);
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
        world.spawn((
            Citizen(CitizenId(id)),
            Age(age), Sex::Female, Location(RegionId(0)),
            Health(Score::from_num(health)),
            Income(Money::from_num(3000_i32)),
            Wealth(Money::from_num(10000_i32)),
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
