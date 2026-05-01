//! Tick phases. SystemSet ordering is enforced by the schedule (see §1.2).

use bevy_ecs::prelude::*;

#[derive(SystemSet, Hash, Eq, PartialEq, Clone, Debug)]
pub enum Phase {
    Sense,
    MacroTensor,
    Cognitive,
    Validate,
    Mutate,
    Commit,
    Telemetry,
}
