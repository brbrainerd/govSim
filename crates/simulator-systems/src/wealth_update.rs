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
    components::{ConsumptionExpenditure, EmploymentStatus, Income, SavingsRate, Wealth},
    Phase, Sim, SimClock,
};
use simulator_types::Money;

const WEALTH_UPDATE_PERIOD: u64 = 30;

/// Effective monthly income before savings split.
fn effective_income(income: Money, emp: &EmploymentStatus) -> Money {
    match emp {
        EmploymentStatus::Employed        => income,
        EmploymentStatus::Unemployed      => Money::from_num(0),
        EmploymentStatus::Student         => income * Money::from_num(0.20_f64),
        EmploymentStatus::Retired         => income * Money::from_num(0.30_f64),
        EmploymentStatus::OutOfLaborForce => Money::from_num(0),
    }
}

#[allow(clippy::type_complexity)]
pub fn wealth_update_system(
    clock: Res<SimClock>,
    mut q: Query<(&Income, &EmploymentStatus, Option<&SavingsRate>, &mut Wealth, Option<&mut ConsumptionExpenditure>)>,
) {
    if !clock.tick.is_multiple_of(WEALTH_UPDATE_PERIOD) || clock.tick == 0 { return; }

    for (income, emp, savings_opt, mut wealth, consumption_opt) in q.iter_mut() {
        let monthly = effective_income(income.0, emp);
        let rate = savings_opt.map_or(0.20_f64, |s| s.0 as f64).clamp(0.0, 1.0);
        let saved = monthly * Money::from_num(rate);
        let consumed = monthly * Money::from_num(1.0 - rate);
        wealth.0 += saved;
        if let Some(mut ce) = consumption_opt {
            ce.0 = consumed;
        }
    }
}

pub fn register_wealth_update_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(wealth_update_system.in_set(Phase::Mutate));
}
