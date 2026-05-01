//! Tick clock. One tick = one simulated day (configurable later).

use bevy_ecs::prelude::Resource;
use simulator_types::SimDate;

#[derive(Resource, Clone, Debug, Default)]
pub struct SimClock {
    pub tick: u64,
    pub date: SimDate,
}

impl SimClock {
    pub fn advance(&mut self) {
        self.tick += 1;
        self.date = SimDate::from_tick(self.tick);
    }
}
