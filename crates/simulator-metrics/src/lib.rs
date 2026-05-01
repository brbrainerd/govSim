//! Per-tick metric ring-buffer for UGS.
//!
//! # Overview
//!
//! - [`TickRow`]: 23-field snapshot of all macro indicators at one tick.
//! - [`MetricStore`]: `VecDeque`-backed ring buffer registered as a Bevy
//!   [`Resource`]. Supports Parquet round-trip via Polars.
//! - [`collect_metrics_system`]: Phase::Telemetry system that pushes one row
//!   per tick. Register with [`register_metrics_system`].
//! - [`WindowSummary`], [`WindowDiff`], [`LawEffectWindow`]: aggregate and
//!   difference-in-differences helpers for the IPC / UI layers.

pub mod row;
pub mod store;
pub mod system;
pub mod window;

pub use row::TickRow;
pub use store::{MetricStore, DEFAULT_CAPACITY};
pub use system::{
    collect_metrics_system, register_metrics_system,
    register_metrics_system_with_capacity,
};
pub use window::{LawEffectWindow, WindowDiff, WindowSummary};
