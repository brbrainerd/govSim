//! Snapshot / replay — Phase 1 slice.
//!
//! - `hash`: deterministic blake3 state digest (sorted by CitizenId).
//! - `columnar`: zstd-compressed bincode columnar snapshot (save/load).
//! - `action_log`: stub for Phase 6 action replay.

pub mod columnar;
pub mod action_log {}
pub mod hash;

pub use hash::state_hash;
pub use columnar::{load_snapshot, save_snapshot};

#[derive(Debug, thiserror::Error)]
pub enum SnapshotError {
    #[error("io: {0}")]
    Io(String),
    #[error("encode: {0}")]
    Encode(String),
    #[error("decode: {0}")]
    Decode(String),
    #[error("version mismatch: found {found}, expected {expected}")]
    VersionMismatch { found: u32, expected: u32 },
}
