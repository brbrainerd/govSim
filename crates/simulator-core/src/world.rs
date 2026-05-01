//! The top-level simulation aggregate: World + Schedule + clock.

use bevy_ecs::prelude::*;
use bevy_ecs::schedule::ScheduleLabel;

use crate::{
    phase::Phase,
    resources::{GovernmentLedger, MacroIndicators, Treasury},
    rng::SimRng,
    tick::SimClock,
};

#[derive(ScheduleLabel, Hash, Eq, PartialEq, Clone, Debug)]
pub struct UgsTick;

pub struct Sim {
    pub world: World,
    pub schedule: Schedule,
}

impl Sim {
    pub fn new(root_seed: [u8; 32]) -> Self {
        let mut world = World::new();
        world.insert_resource(SimClock::default());
        world.insert_resource(SimRng::new(root_seed));
        world.insert_resource(MacroIndicators::default());
        world.insert_resource(Treasury::default());
        world.insert_resource(GovernmentLedger::default());

        let mut schedule = Schedule::new(UgsTick);
        schedule.configure_sets(
            (
                Phase::Sense,
                Phase::MacroTensor,
                Phase::Cognitive,
                Phase::Validate,
                Phase::Mutate,
                Phase::Commit,
                Phase::Telemetry,
            )
                .chain(),
        );

        Self { world, schedule }
    }

    /// Direct schedule access. Downstream crates call
    /// `sim.schedule.add_systems(my_system.in_set(Phase::Mutate))`.
    pub fn schedule_mut(&mut self) -> &mut Schedule { &mut self.schedule }

    /// Advance the simulation by one tick.
    pub fn step(&mut self) {
        self.schedule.run(&mut self.world);
        let mut clock = self.world.resource_mut::<SimClock>();
        clock.advance();
    }

    pub fn tick(&self) -> u64 { self.world.resource::<SimClock>().tick }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ticks_advance() {
        let mut sim = Sim::new([0u8; 32]);
        for _ in 0..10 { sim.step(); }
        assert_eq!(sim.tick(), 10);
    }
}
