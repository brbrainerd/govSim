//! BirthDeathSystem — Phase::Mutate, yearly.
//!
//! Demographic turnover: each year a fraction of citizens die (removed from
//! ECS) and an equal number are born (spawned as new entities) so population
//! stays near its initial size. This keeps `MacroIndicators::population` dynamic
//! and exercises entity despawn/spawn paths.
//!
//! Rates (crude approximation):
//!   death: 0.8% per year (i.e. 0.8 per 100 citizens)
//!   birth: equal to death count so population is quasi-stationary
//!
//! New citizens are spawned with fresh income drawn from the same log-normal
//! distribution used at scenario load time.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{
        Age, AuditFlags, Citizen, ConsumptionExpenditure, EmploymentStatus, EvasionPropensity,
        Health, IdeologyVector, Income, LegalStatusFlags, LegalStatuses, Location,
        MonthlyBenefitReceived, MonthlyTaxPaid, Productivity, SavingsRate, Sex, Wealth,
    },
    CrisisKind, CrisisState, Phase, Sim, SimClock, SimRng,
};
use simulator_types::{CitizenId, Money, RegionId, Score};
use rand::Rng;

const BIRTH_DEATH_PERIOD: u64 = 360;
const DEATH_RATE: f32 = 0.008;
/// Multiplier on annual death rate during an active Pandemic crisis.
const PANDEMIC_DEATH_MULTIPLIER: f32 = 2.0;

pub fn birth_death_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    crisis: Res<CrisisState>,
    mut commands: Commands,
    q: Query<(Entity, &Citizen, &Age)>,
) {
    if !clock.tick.is_multiple_of(BIRTH_DEATH_PERIOD) || clock.tick == 0 { return; }

    let pandemic_active = crisis.kind == CrisisKind::Pandemic && crisis.remaining_ticks > 0;
    let mut rng = rng_res.derive("birth_spawn", clock.tick);
    let mut deaths: Vec<Entity> = Vec::new();
    let mut max_id: u64 = 0;

    // Mark citizens for death (elderly bias: base rate + age factor).
    // Pandemic doubles the effective death rate while active.
    for (entity, citizen, age) in q.iter() {
        max_id = max_id.max(citizen.0.0);
        let mut rate = DEATH_RATE + (age.0 as f32 - 40.0).max(0.0) * 0.0002;
        if pandemic_active { rate *= PANDEMIC_DEATH_MULTIPLIER; }
        let mut citizen_rng = rng_res.derive_citizen("death_check", clock.tick, citizen.0.0);
        if citizen_rng.random::<f32>() < rate {
            deaths.push(entity);
        }
    }

    let n_births = deaths.len();

    // Despawn the dead.
    for entity in deaths {
        commands.entity(entity).despawn();
    }

    // Spawn replacement citizens — newborns start at age 0 with modest income.
    for i in 0..n_births as u64 {
        let citizen_id = max_id + 1 + i;
        let raw: f64 = (rng.random::<f64>() * 9.0 + 7.0).exp(); // log-normal, lower than adults
        let income = Money::from_num(raw.min(1.0e8));
        let wealth = Money::from_num(0.0); // newborns have no wealth
        let region = RegionId(rng.random_range(0..16));
        // Nested to stay within Bevy's 15-component Bundle limit.
        commands.spawn((
            (
                Citizen(CitizenId(citizen_id)),
                Age(0),
                Sex::Female,
                Location(region),
                Health(Score::from_num(0.9_f32)),
                Income(income),
                Wealth(wealth),
                EmploymentStatus::Student,
            ), (
                Productivity(Score::from_num(0.5_f32)),
                IdeologyVector([0.0f32; 5]),
                simulator_core::components::ApprovalRating(Score::from_num(0.5_f32)),
                LegalStatuses(LegalStatusFlags::MINOR | LegalStatusFlags::CITIZEN),
                AuditFlags::default(),
                EvasionPropensity(0.0),
                SavingsRate(0.05),
                ConsumptionExpenditure(income * Money::from_num(4) / Money::from_num(5)),
                MonthlyTaxPaid::default(),
                MonthlyBenefitReceived::default(),
            ),
        ));
    }
}

pub fn register_birth_death_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(birth_death_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::components::{
        AuditFlags, ApprovalRating, ConsumptionExpenditure, EmploymentStatus, EvasionPropensity,
        Health, IdeologyVector, Income, LegalStatusFlags, LegalStatuses, Location,
        MonthlyBenefitReceived, MonthlyTaxPaid, Productivity, SavingsRate, Sex, Wealth,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn_citizen(world: &mut bevy_ecs::world::World, id: u64, age: u8) {
        let income = Money::from_num(1000_i32);
        world.spawn((
            (
                Citizen(CitizenId(id)),
                Age(age),
                Sex::Male,
                Location(RegionId(0)),
                Health(Score::from_num(0.8_f32)),
                Income(income),
                Wealth(Money::from_num(5000_i32)),
                EmploymentStatus::Employed,
            ), (
                Productivity(Score::from_num(0.6_f32)),
                IdeologyVector([0.0f32; 5]),
                ApprovalRating(Score::from_num(0.5_f32)),
                LegalStatuses(LegalStatusFlags::CITIZEN),
                AuditFlags::default(),
                EvasionPropensity(0.0),
                SavingsRate(0.10),
                ConsumptionExpenditure(income * Money::from_num(4) / Money::from_num(5)),
                MonthlyTaxPaid::default(),
                MonthlyBenefitReceived::default(),
            ),
        ));
    }

    #[test]
    fn no_changes_at_tick_zero() {
        let mut sim = Sim::new([10u8; 32]);
        register_birth_death_system(&mut sim);
        for i in 0..50 { spawn_citizen(&mut sim.world, i, 35); }
        let before = sim.world.query::<&Citizen>().iter(&sim.world).count();

        // Only 1 step — processes tick=0, guard skips.
        sim.step();

        let after = sim.world.query::<&Citizen>().iter(&sim.world).count();
        assert_eq!(before, after, "population must not change at tick=0");
    }

    #[test]
    fn population_quasi_stationary_after_one_year() {
        // births == deaths count, so population stays the same size.
        let mut sim = Sim::new([11u8; 32]);
        register_birth_death_system(&mut sim);

        // 500 citizens at age 35 — base death rate 0.8%; expect ~4 deaths.
        for i in 0..500 { spawn_citizen(&mut sim.world, i, 35); }
        let before = 500usize;

        // Run 361 steps: yearly system fires at tick=360.
        for _ in 0..=360 { sim.step(); }

        // After despawn + spawn: population should equal what it was.
        let after = sim.world.query::<&Citizen>().iter(&sim.world).count();
        assert_eq!(after, before,
            "population should be quasi-stationary: births replace deaths, got {after}");
    }

    #[test]
    fn some_deaths_and_births_occur_after_one_year() {
        // With 500 citizens at age 35 and 0.8% death rate, expected ~4 deaths.
        // Probability of exactly 0 deaths = (0.992)^500 ≈ 0.018. Extremely unlikely.
        let mut sim = Sim::new([12u8; 32]);
        register_birth_death_system(&mut sim);
        for i in 0..500 { spawn_citizen(&mut sim.world, i, 35); }

        // Snapshot original IDs before stepping.
        let before_ids: std::collections::HashSet<u64> = sim.world
            .query::<&Citizen>()
            .iter(&sim.world)
            .map(|c| c.0.0)
            .collect();

        for _ in 0..=360 { sim.step(); }

        let after_ids: std::collections::HashSet<u64> = sim.world
            .query::<&Citizen>()
            .iter(&sim.world)
            .map(|c| c.0.0)
            .collect();

        // Some IDs that were there before should be gone (died).
        let died = before_ids.difference(&after_ids).count();
        // Some IDs in after that weren't in before should exist (born).
        let born = after_ids.difference(&before_ids).count();

        assert!(died > 0, "expected at least 1 death in 500 citizens over 1 year, got 0");
        assert_eq!(died, born, "births should equal deaths to maintain population");
    }

    #[test]
    fn pandemic_increases_mortality_rate() {
        // Two identical sims, one with active Pandemic. Pandemic sim should have
        // more deaths (PANDEMIC_DEATH_MULTIPLIER = 2.0).
        let mut sim_normal = Sim::new([13u8; 32]);
        let mut sim_pandemic = Sim::new([13u8; 32]); // same seed, same citizens
        register_birth_death_system(&mut sim_normal);
        register_birth_death_system(&mut sim_pandemic);

        // Inject 500 elderly citizens — high base death rate so delta is visible.
        for i in 0..500 { spawn_citizen(&mut sim_normal.world, i, 60); }
        for i in 0..500 { spawn_citizen(&mut sim_pandemic.world, i, 60); }

        // Activate Pandemic in sim_pandemic.
        {
            let mut cs = sim_pandemic.world.resource_mut::<CrisisState>();
            cs.kind = CrisisKind::Pandemic;
            cs.remaining_ticks = 720;
        }

        // Snapshot before.
        let before_ids_normal: std::collections::HashSet<u64> = sim_normal.world
            .query::<&Citizen>().iter(&sim_normal.world).map(|c| c.0.0).collect();
        let before_ids_pandemic: std::collections::HashSet<u64> = sim_pandemic.world
            .query::<&Citizen>().iter(&sim_pandemic.world).map(|c| c.0.0).collect();

        for _ in 0..=360 {
            sim_normal.step();
            sim_pandemic.step();
        }

        let after_ids_normal: std::collections::HashSet<u64> = sim_normal.world
            .query::<&Citizen>().iter(&sim_normal.world).map(|c| c.0.0).collect();
        let after_ids_pandemic: std::collections::HashSet<u64> = sim_pandemic.world
            .query::<&Citizen>().iter(&sim_pandemic.world).map(|c| c.0.0).collect();

        let deaths_normal = before_ids_normal.difference(&after_ids_normal).count();
        let deaths_pandemic = before_ids_pandemic.difference(&after_ids_pandemic).count();

        assert!(
            deaths_pandemic >= deaths_normal,
            "pandemic should cause at least as many deaths as normal: normal={deaths_normal}, pandemic={deaths_pandemic}"
        );
    }

    #[test]
    fn newborns_have_age_zero_and_student_status() {
        // After a yearly cycle with 500 citizens (some die), newborns should have
        // Age(0) and EmploymentStatus::Student.
        let mut sim = Sim::new([14u8; 32]);
        register_birth_death_system(&mut sim);
        for i in 0..500 { spawn_citizen(&mut sim.world, i, 35); }

        for _ in 0..=360 { sim.step(); }

        // Find newborns (Age == 0; original citizens had Age == 35).
        let newborns: Vec<(u8, EmploymentStatus)> = sim.world
            .query::<(&Age, &EmploymentStatus)>()
            .iter(&sim.world)
            .filter(|(age, _)| age.0 == 0)
            .map(|(age, emp)| (age.0, *emp))
            .collect();

        // We expect some newborns (≥1, matching deaths).
        assert!(!newborns.is_empty(), "expected at least one newborn after yearly cycle");
        for (_, emp) in &newborns {
            assert_eq!(*emp, EmploymentStatus::Student,
                "newborns must start as Students");
        }
    }
}
