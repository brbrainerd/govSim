//! `crisis_link_system` — Phase::Sense.
//!
//! Reads the current `CrisisState` and propagates its `cost_multiplier` into
//! `LawRegistry`, so that `supersede()` and `repeal()` calls during Phase::Mutate
//! automatically scale their legitimacy-debt charges without needing direct
//! access to `CrisisState` at the call site.

use simulator_core::{bevy_ecs::prelude::*, CrisisState, Phase, Sim};
use crate::registry::LawRegistry;

pub fn crisis_link_system(
    crisis: Res<CrisisState>,
    registry: Res<LawRegistry>,
) {
    registry.set_crisis_cost_multiplier(crisis.cost_multiplier);
}

pub fn register_crisis_link_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(crisis_link_system.in_set(Phase::Sense));
}
