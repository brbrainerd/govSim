//! UGS ECS core. Owns the `World`, the `Schedule`, the deterministic RNG,
//! and the tick clock. See blueprint §3 for design.

pub mod phase;
pub mod rng;
pub mod tick;
pub mod world;

pub use phase::Phase;
pub use rng::SimRng;
pub use tick::SimClock;
pub use world::Sim;
