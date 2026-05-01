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
