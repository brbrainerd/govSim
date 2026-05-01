//! The top-level simulation aggregate: World + Schedule + clock.
//!
//! In Phase 0 the schedule is a single empty stage; Phase 1 wires in real
//! Systems. The struct lives behind a `tokio::sync::RwLock` in the Tauri
//! shell.

use bevy_ecs::prelude::*;

use crate::{rng::SimRng, tick::SimClock};

pub struct Sim {
    pub world: World,
    pub schedule: Schedule,
}

impl Sim {
    pub fn new(root_seed: [u8; 32]) -> Self {
        let mut world = World::new();
        world.insert_resource(SimClock::default());
        world.insert_resource(SimRng::new(root_seed));
        let schedule = Schedule::default();
        Self { world, schedule }
    }

    /// Advance the simulation by one tick. Phase 0: bumps the clock only.
    pub fn step(&mut self) {
        self.schedule.run(&mut self.world);
        let mut clock = self.world.resource_mut::<SimClock>();
        clock.advance();
    }

    pub fn tick(&self) -> u64 {
        self.world.resource::<SimClock>().tick
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ticks_advance() {
        let mut sim = Sim::new([0u8; 32]);
        for _ in 0..10 {
            sim.step();
        }
        assert_eq!(sim.tick(), 10);
    }
}
