//! Snapshot / replay — Phase 1 slice.
//!
//! For now we expose only the `hash` module: a deterministic blake3 digest
//! of the full simulation state, sorted by CitizenId so that ECS archetype
//! ordering doesn't affect the result. The `columnar` and `action_log`
//! modules will grow in later phases.

pub mod columnar {}
pub mod action_log {}
pub mod hash;

pub use hash::state_hash;
