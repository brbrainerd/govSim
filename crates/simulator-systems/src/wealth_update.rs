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
    components::{EmploymentStatus, Income, Wealth},
    Phase, Sim, SimClock,
};
use simulator_types::Money;

const WEALTH_UPDATE_PERIOD: u64 = 30;

pub fn wealth_update_system(
    clock: Res<SimClock>,
    mut q: Query<(&Income, &EmploymentStatus, &mut Wealth)>,
) {
    if clock.tick % WEALTH_UPDATE_PERIOD != 0 || clock.tick == 0 { return; }

    for (income, emp, mut wealth) in q.iter_mut() {
        let monthly_income = match emp {
            EmploymentStatus::Employed        => income.0,
            EmploymentStatus::Unemployed      => Money::from_num(0),
            EmploymentStatus::Student         => income.0 * Money::from_num(0.20_f64),
            EmploymentStatus::Retired         => income.0 * Money::from_num(0.30_f64),
            EmploymentStatus::OutOfLaborForce => Money::from_num(0),
        };
        wealth.0 += monthly_income;
    }
}

pub fn register_wealth_update_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(wealth_update_system.in_set(Phase::Mutate));
}
