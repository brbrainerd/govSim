//! AgeAdvanceSystem — Phase::Mutate, yearly.
//!
//! Each simulated year (360 ticks):
//!   1. Increment every citizen's age by 1, capped at AGE_CAP.
//!   2. Enforce age-threshold employment transitions:
//!      - Reaching WORKING_AGE (18): Student → Unemployed (enters labour force).
//!      - Reaching RETIREMENT_AGE (65): Employed/Unemployed/OOL → Retired.
//!
//! Runs AFTER birth_death_system so death-rate uses the age from the start
//! of the year; newborns spawned this tick age on the next yearly cycle.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Age, EmploymentStatus, LegalStatusFlags, LegalStatuses},
    Phase, Sim, SimClock,
};

const AGE_ADVANCE_PERIOD: u64 = 360;
/// Citizens below this age are treated as minors (Student status).
pub const WORKING_AGE: u8 = 18;
/// Citizens reaching this age are forced into retirement.
pub const RETIREMENT_AGE: u8 = 65;
/// Hard cap — avoids u8 wrap-around from saturating_add.
const AGE_CAP: u8 = 99;

pub fn age_advance_system(
    clock: Res<SimClock>,
    mut q: Query<(&mut Age, &mut EmploymentStatus, &mut LegalStatuses)>,
) {
    if !clock.tick.is_multiple_of(AGE_ADVANCE_PERIOD) || clock.tick == 0 { return; }

    for (mut age, mut emp, mut legal) in q.iter_mut() {
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
}
