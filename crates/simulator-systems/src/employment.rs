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
    components::{Citizen, EmploymentStatus},
    Phase, Sim, SimClock, SimRng,
};
use rand::Rng;

const EMPLOYMENT_PERIOD: u64 = 30;

pub fn employment_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    mut q: Query<(&Citizen, &mut EmploymentStatus)>,
) {
    if clock.tick % EMPLOYMENT_PERIOD != 0 || clock.tick == 0 { return; }

    // Derive a per-tick RNG so results are deterministic regardless of ECS
    // archetype ordering.
    let mut rng = rng_res.derive("employment", clock.tick);

    for (_citizen, mut status) in q.iter_mut() {
        let r: f32 = rng.random();
        *status = match *status {
            EmploymentStatus::Employed => {
                if r < 0.005 { EmploymentStatus::Unemployed } else { EmploymentStatus::Employed }
            }
            EmploymentStatus::Unemployed => {
                if r < 0.050 { EmploymentStatus::Employed } else { EmploymentStatus::Unemployed }
            }
            EmploymentStatus::Student => {
                if r < 0.010 { EmploymentStatus::Employed } else { EmploymentStatus::Student }
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
