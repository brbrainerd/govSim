//! AgeAdvanceSystem — Phase::Mutate, yearly.
//!
//! Each simulated year (360 ticks):
//!   1. Increment every citizen's age by 1, capped at AGE_CAP.
//!   2. Enforce age-threshold employment transitions:
//!      - Reaching WORKING_AGE (18): Student → Unemployed (enters labour force).
//!      - Reaching RETIREMENT_AGE (65): Employed/Unemployed/OOL → Retired.
//!   3. Recompute SavingsRate from the age bracket function so savings evolve
//!      over the life cycle (young save less; peak earners save more; retirees
//!      draw down).
//!
//! Runs AFTER birth_death_system so death-rate uses the age from the start
//! of the year; newborns spawned this tick age on the next yearly cycle.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Age, EmploymentStatus, LegalStatusFlags, LegalStatuses, SavingsRate},
    Phase, Sim, SimClock,
};

const AGE_ADVANCE_PERIOD: u64 = 360;
/// Citizens below this age are treated as minors (Student status).
pub const WORKING_AGE: u8 = 18;
/// Citizens reaching this age are forced into retirement.
pub const RETIREMENT_AGE: u8 = 65;
/// Hard cap — avoids u8 wrap-around from saturating_add.
const AGE_CAP: u8 = 99;

/// Age-graded savings rate mirroring the scenario spawn logic.
pub fn savings_rate_for_age(age: u8) -> f32 {
    match age {
        0..=22  => 0.05,
        23..=39 => 0.15,
        40..=54 => 0.25,
        55..=64 => 0.30,
        _       => 0.10,
    }
}

#[allow(clippy::type_complexity)]
pub fn age_advance_system(
    clock: Res<SimClock>,
    mut q: Query<(&mut Age, &mut EmploymentStatus, &mut LegalStatuses, Option<&mut SavingsRate>)>,
) {
    if !clock.tick.is_multiple_of(AGE_ADVANCE_PERIOD) || clock.tick == 0 { return; }

    for (mut age, mut emp, mut legal, savings_opt) in q.iter_mut() {
        let old = age.0;
        age.0 = old.saturating_add(1).min(AGE_CAP);

        // Cross working-age threshold → enter adult civic and labour life.
        if old < WORKING_AGE && age.0 >= WORKING_AGE {
            legal.0.remove(LegalStatusFlags::MINOR);
            legal.0.insert(LegalStatusFlags::REGISTERED_VOTER | LegalStatusFlags::CITIZEN);

            if matches!(*emp, EmploymentStatus::Student) {
                *emp = EmploymentStatus::Unemployed;
            }
        }

        // Cross retirement threshold → leave labour market.
        if old < RETIREMENT_AGE && age.0 >= RETIREMENT_AGE
            && matches!(*emp,
                EmploymentStatus::Employed
                | EmploymentStatus::Unemployed
                | EmploymentStatus::OutOfLaborForce)
        {
            *emp = EmploymentStatus::Retired;
        }

        // Recompute savings rate for the new age bracket.
        if let Some(mut sr) = savings_opt {
            sr.0 = savings_rate_for_age(age.0);
        }
    }
}

pub fn register_age_advance_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(age_advance_system.in_set(Phase::Mutate));
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

    fn spawn(world: &mut World, id: u64, age: u8, emp: EmploymentStatus) {
        use simulator_core::components::SavingsRate;
        world.spawn((
            Citizen(CitizenId(id)),
            Age(age), Sex::Male, Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(3000_i32)),
            Wealth(Money::from_num(5000_i32)),
            emp,
            Productivity(Score::from_num(0.5_f32)),
            IdeologyVector([0.0; 5]),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses::default(),
            AuditFlags::default(),
            SavingsRate(savings_rate_for_age(age)),
        ));
    }

    fn get_state(world: &mut World, id: u64) -> (u8, EmploymentStatus) {
        world.query::<(&Citizen, &Age, &EmploymentStatus)>()
            .iter(world)
            .find(|(c, _, _)| c.0.0 == id)
            .map(|(_, a, e)| (a.0, *e))
            .unwrap()
    }

    #[test]
    fn student_becomes_unemployed_at_working_age() {
        let mut sim = Sim::new([0u8; 32]);
        register_age_advance_system(&mut sim);

        // Age 17 student — turns 18 after one year.
        spawn(&mut sim.world, 0, 17, EmploymentStatus::Student);

        for _ in 0..=360 { sim.step(); }

        let (age, emp) = get_state(&mut sim.world, 0);
        assert_eq!(age, 18, "should be 18 after one year");
        assert!(
            matches!(emp, EmploymentStatus::Unemployed),
            "should enter labour force as Unemployed, got {emp:?}"
        );
    }

    #[test]
    fn employed_retires_at_retirement_age() {
        let mut sim = Sim::new([1u8; 32]);
        register_age_advance_system(&mut sim);

        // Age 64 employed citizen — turns 65 after one year.
        spawn(&mut sim.world, 0, 64, EmploymentStatus::Employed);

        for _ in 0..=360 { sim.step(); }

        let (age, emp) = get_state(&mut sim.world, 0);
        assert_eq!(age, 65, "should be 65 after one year");
        assert!(
            matches!(emp, EmploymentStatus::Retired),
            "should be Retired at 65, got {emp:?}"
        );
    }

    #[test]
    fn minor_student_stays_student() {
        let mut sim = Sim::new([2u8; 32]);
        register_age_advance_system(&mut sim);

        // Age 10 — still a minor after one year (age 11).
        spawn(&mut sim.world, 0, 10, EmploymentStatus::Student);

        for _ in 0..=360 { sim.step(); }

        let (age, emp) = get_state(&mut sim.world, 0);
        assert_eq!(age, 11);
        assert!(matches!(emp, EmploymentStatus::Student), "minor should remain Student");
    }

    #[test]
    fn age_caps_at_max() {
        let mut sim = Sim::new([3u8; 32]);
        register_age_advance_system(&mut sim);

        spawn(&mut sim.world, 0, AGE_CAP, EmploymentStatus::Retired);

        for _ in 0..=360 { sim.step(); }

        let (age, _) = get_state(&mut sim.world, 0);
        assert_eq!(age, AGE_CAP, "age should not exceed AGE_CAP");
    }

    /// System guard: tick=0 is skipped, so nothing should change after 1 step.
    #[test]
    fn system_does_not_fire_at_tick_zero() {
        let mut sim = Sim::new([10u8; 32]);
        register_age_advance_system(&mut sim);

        spawn(&mut sim.world, 0, 17, EmploymentStatus::Student);
        sim.step(); // processes tick=0; guard skips

        let (age, emp) = get_state(&mut sim.world, 0);
        assert_eq!(age, 17, "age must not change at tick=0");
        assert!(matches!(emp, EmploymentStatus::Student), "status must not change at tick=0");
    }

    /// OutOfLaborForce citizen transitions to Retired at age 65.
    #[test]
    fn out_of_labor_force_retires_at_65() {
        let mut sim = Sim::new([11u8; 32]);
        register_age_advance_system(&mut sim);

        spawn(&mut sim.world, 0, 64, EmploymentStatus::OutOfLaborForce);

        for _ in 0..=360 { sim.step(); }

        let (age, emp) = get_state(&mut sim.world, 0);
        assert_eq!(age, 65, "should be 65 after one year");
        assert!(
            matches!(emp, EmploymentStatus::Retired),
            "OutOfLaborForce citizen should retire at 65, got {emp:?}"
        );
    }

    /// `savings_rate_for_age` covers all five age brackets correctly.
    #[test]
    fn savings_rate_for_age_function_all_brackets() {
        assert!((savings_rate_for_age(0)  - 0.05).abs() < 1e-6, "age 0 bracket");
        assert!((savings_rate_for_age(22) - 0.05).abs() < 1e-6, "age 22 bracket");
        assert!((savings_rate_for_age(23) - 0.15).abs() < 1e-6, "age 23 bracket");
        assert!((savings_rate_for_age(39) - 0.15).abs() < 1e-6, "age 39 bracket");
        assert!((savings_rate_for_age(40) - 0.25).abs() < 1e-6, "age 40 bracket");
        assert!((savings_rate_for_age(54) - 0.25).abs() < 1e-6, "age 54 bracket");
        assert!((savings_rate_for_age(55) - 0.30).abs() < 1e-6, "age 55 bracket");
        assert!((savings_rate_for_age(64) - 0.30).abs() < 1e-6, "age 64 bracket");
        assert!((savings_rate_for_age(65) - 0.10).abs() < 1e-6, "age 65+ bracket");
        assert!((savings_rate_for_age(99) - 0.10).abs() < 1e-6, "age 99 bracket");
    }

    /// Reaching working age removes MINOR flag and adds VOTER+CITIZEN flags.
    #[test]
    fn working_age_updates_legal_statuses() {
        use simulator_core::components::{LegalStatusFlags, LegalStatuses};

        let mut sim = Sim::new([12u8; 32]);
        register_age_advance_system(&mut sim);

        // Spawn with MINOR flag set (17-year-old student).
        {
            use simulator_core::components::SavingsRate;
            sim.world.spawn((
                simulator_core::components::Citizen(simulator_types::CitizenId(0)),
                Age(17), simulator_core::components::Sex::Female,
                simulator_core::components::Location(simulator_types::RegionId(0)),
                simulator_core::components::Health(simulator_types::Score::from_num(0.9_f32)),
                simulator_core::components::Income(simulator_types::Money::from_num(0_i32)),
                simulator_core::components::Wealth(simulator_types::Money::from_num(0_i32)),
                EmploymentStatus::Student,
                simulator_core::components::Productivity(simulator_types::Score::from_num(0.5_f32)),
                simulator_core::components::IdeologyVector([0.0f32; 5]),
                simulator_core::components::ApprovalRating(simulator_types::Score::from_num(0.5_f32)),
                LegalStatuses(LegalStatusFlags::MINOR | LegalStatusFlags::CITIZEN),
                simulator_core::components::AuditFlags::default(),
                SavingsRate(0.05),
            ));
        }

        for _ in 0..=360 { sim.step(); }

        let legal = sim.world
            .query::<&LegalStatuses>()
            .single(&sim.world)
            .unwrap()
            .0;

        assert!(!legal.contains(LegalStatusFlags::MINOR), "MINOR flag should be removed at 18");
        assert!(legal.contains(LegalStatusFlags::REGISTERED_VOTER), "VOTER flag should be set at 18");
    }

    #[test]
    fn savings_rate_updates_across_bracket() {
        use simulator_core::components::SavingsRate;
        // Citizen at 39 (bracket: 0.15) → after one year age 40 (bracket: 0.25).
        let mut sim = Sim::new([5u8; 32]);
        register_age_advance_system(&mut sim);

        spawn(&mut sim.world, 0, 39, EmploymentStatus::Employed);

        for _ in 0..=360 { sim.step(); }

        let (age, _) = get_state(&mut sim.world, 0);
        assert_eq!(age, 40);

        let sr: f32 = sim.world
            .query::<(&Citizen, &SavingsRate)>()
            .iter(&sim.world)
            .find(|(c, _)| c.0.0 == 0)
            .map(|(_, sr)| sr.0)
            .unwrap();
        assert!(
            (sr - 0.25).abs() < 1e-6,
            "savings rate should update to 0.25 bracket at age 40, got {sr}"
        );
    }
}
