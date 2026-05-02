//! EmploymentSystem — Phase::Mutate.
//!
//! Each month (30 ticks) applies a Markov transition over employment states.
//! Rates are calibrated to produce ~10% steady-state unemployment.
//!
//! Transition matrix per month (approximate):
//!   Employed     → Unemployed:      0.5%
//!   Unemployed   → Employed:        5.0%
//!   Student      → Employed (on graduation): 1.0%
//!   Retired      → (absorbing state)
//!   OutOfLabor   → (quasi-absorbing, 0.1% re-entry)
//!
//! RNG is derived from `SimRng` so the transitions are deterministic.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Age, Citizen, EmploymentStatus},
    Phase, Sim, SimClock, SimRng,
};
use rand::Rng;

const EMPLOYMENT_PERIOD: u64 = 30;

pub fn employment_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    mut q: Query<(&Citizen, &Age, &mut EmploymentStatus)>,
) {
    if !clock.tick.is_multiple_of(EMPLOYMENT_PERIOD) || clock.tick == 0 { return; }

    for (citizen, age, mut status) in q.iter_mut() {
        let mut rng = rng_res.derive_citizen("employment", clock.tick, citizen.0.0);
        let r: f32 = rng.random();
        *status = match *status {
            EmploymentStatus::Employed => {
                if r < 0.005 { EmploymentStatus::Unemployed } else { EmploymentStatus::Employed }
            }
            EmploymentStatus::Unemployed => {
                if r < 0.050 { EmploymentStatus::Employed } else { EmploymentStatus::Unemployed }
            }
            EmploymentStatus::Student => {
                // Minors (under working age) cannot enter the labour market —
                // age_advance_system handles the Student → Unemployed transition at 18.
                if age.0 >= crate::education::WORKING_AGE && r < 0.010 {
                    EmploymentStatus::Employed
                } else {
                    EmploymentStatus::Student
                }
            }
            EmploymentStatus::OutOfLaborForce => {
                if r < 0.001 { EmploymentStatus::Unemployed } else { EmploymentStatus::OutOfLaborForce }
            }
            EmploymentStatus::Retired => EmploymentStatus::Retired,
        };
    }
}

pub fn register_employment_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(employment_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::components::{
        AuditFlags, ApprovalRating, EmploymentStatus, Health, IdeologyVector,
        Income, LegalStatuses, Location, Productivity, Sex, Wealth,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn_citizen(world: &mut bevy_ecs::world::World, id: u64, age: u8, status: EmploymentStatus) {
        world.spawn((
            Citizen(CitizenId(id)),
            Age(age),
            Sex::Male,
            Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(1000_i32)),
            Wealth(Money::from_num(5000_i32)),
            status,
            Productivity(Score::from_num(0.6_f32)),
            IdeologyVector([0.0f32; 5]),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses::default(),
            AuditFlags::default(),
        ));
    }

    #[test]
    fn retired_status_is_absorbing() {
        // Retired is a match arm that always returns Retired — no RNG needed.
        let mut sim = Sim::new([1u8; 32]);
        register_employment_system(&mut sim);

        spawn_citizen(&mut sim.world, 0, 70, EmploymentStatus::Retired);

        // Run 3 years worth of monthly steps.
        for _ in 0..=1080 { sim.step(); }

        let status: EmploymentStatus = *sim.world
            .query::<&EmploymentStatus>()
            .single(&sim.world)
            .unwrap();
        assert_eq!(status, EmploymentStatus::Retired, "Retired must be absorbing");
    }

    #[test]
    fn student_under_working_age_cannot_graduate() {
        // Students under 18 must stay Student regardless of RNG.
        let mut sim = Sim::new([2u8; 32]);
        register_employment_system(&mut sim);

        // Age 10 — well below WORKING_AGE (18).
        spawn_citizen(&mut sim.world, 0, 10, EmploymentStatus::Student);

        // Run for 12 months.
        for _ in 0..=360 { sim.step(); }

        let status: EmploymentStatus = *sim.world
            .query::<&EmploymentStatus>()
            .single(&sim.world)
            .unwrap();
        assert_eq!(status, EmploymentStatus::Student,
            "Students under 18 must stay Student");
    }

    #[test]
    fn system_does_not_fire_at_tick_zero() {
        // After a single step (tick goes 0→1), the guard skips tick=0 so
        // an Unemployed citizen should remain Unemployed after exactly 1 step.
        // The employment system fires at tick=30, not tick=1, so after 1 step
        // (tick=0 just ran, advancing to tick=1) no transition should have occurred.
        let mut sim = Sim::new([3u8; 32]);
        register_employment_system(&mut sim);

        spawn_citizen(&mut sim.world, 0, 30, EmploymentStatus::Unemployed);

        // Just 1 step. tick=0 runs → guard (is_multiple_of(30) && tick != 0) fails → no transition.
        sim.step();

        let status: EmploymentStatus = *sim.world
            .query::<&EmploymentStatus>()
            .single(&sim.world)
            .unwrap();
        // We only ran 1 step (processing tick=0); system didn't fire.
        assert_eq!(status, EmploymentStatus::Unemployed,
            "Employment system must not fire at tick=0");
    }

    #[test]
    fn employed_population_is_mostly_stable_over_one_month() {
        // With 200 Employed citizens and a 0.5%/month separation rate, we expect
        // 99% to remain employed. Check that at least 190/200 are still Employed.
        let mut sim = Sim::new([4u8; 32]);
        register_employment_system(&mut sim);

        for i in 0..200 {
            spawn_citizen(&mut sim.world, i, 35, EmploymentStatus::Employed);
        }

        // 31 steps: employment system fires at tick=30 (step 31).
        for _ in 0..31 { sim.step(); }

        let still_employed = sim.world
            .query::<&EmploymentStatus>()
            .iter(&sim.world)
            .filter(|s| **s == EmploymentStatus::Employed)
            .count();

        assert!(still_employed >= 190,
            "expected ≥190/200 employed after 1 month (0.5% separation rate), got {still_employed}");
    }

    #[test]
    fn unemployed_population_finds_work_over_three_months() {
        // With a 5%/month re-employment rate, after 3 months the probability of
        // remaining unemployed is (0.95)^3 ≈ 0.857. With 200 unemployed citizens,
        // we expect at least 20 to have found work.
        let mut sim = Sim::new([5u8; 32]);
        register_employment_system(&mut sim);

        for i in 0..200 {
            spawn_citizen(&mut sim.world, i, 28, EmploymentStatus::Unemployed);
        }

        // 91 steps: employment system fires at ticks 30, 60, 90.
        for _ in 0..91 { sim.step(); }

        let still_unemployed = sim.world
            .query::<&EmploymentStatus>()
            .iter(&sim.world)
            .filter(|s| **s == EmploymentStatus::Unemployed)
            .count();

        assert!(still_unemployed < 190,
            "expected <190/200 still unemployed after 3 months (5%/mo re-hire rate), got {still_unemployed}");
    }
}
