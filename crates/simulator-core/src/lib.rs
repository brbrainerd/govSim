//! UGS ECS core. Owns the `World`, the `Schedule`, the deterministic RNG,
//! and the tick clock. See blueprint §3 for design.

pub mod components;
pub mod judiciary;
pub mod phase;
pub mod polity;
pub mod resources;
pub mod rights_catalog;
pub mod rng;
pub mod state_capacity;
pub mod tick;
pub mod world;

pub use judiciary::Judiciary;
pub use phase::Phase;
pub use polity::{ElectoralSystem, Polity, RegimeKind};
pub use rights_catalog::{
    catalog_from_bits, catalog_from_strings, default_catalog, RightDefinition, RightId,
    RightsCatalog, LEGACY_BIT_TO_ID,
};
pub use resources::{
    CivicRights, CrisisKind, CrisisState, GovernmentLedger, LegitimacyDebt,
    MacroIndicators, PollutionStock, PriceLevel, RightsLedger, Treasury,
};
pub use rng::SimRng;
pub use state_capacity::StateCapacity;
pub use tick::SimClock;
pub use world::Sim;

// Re-export bevy_ecs for downstream crates so they don't need to depend on
// it directly when implementing Systems.
pub use bevy_ecs;
