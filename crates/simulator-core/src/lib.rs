//! UGS ECS core. Owns the `World`, the `Schedule`, the deterministic RNG,
//! and the tick clock. See blueprint §3 for design.

pub mod components;
pub mod phase;
pub mod resources;
pub mod rng;
pub mod tick;
pub mod world;

pub use phase::Phase;
pub use resources::{
    CivicRights, GovernmentLedger, LegitimacyDebt, MacroIndicators, PriceLevel,
    RightsLedger, Treasury,
};
pub use rng::SimRng;
pub use tick::SimClock;
pub use world::Sim;

// Re-export bevy_ecs for downstream crates so they don't need to depend on
// it directly when implementing Systems.
pub use bevy_ecs;
