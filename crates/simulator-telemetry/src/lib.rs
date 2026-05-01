//! Tracing/telemetry. Initialize once at process start.
//!
//! Phase 1 addition: `tick_telemetry_system` emits one structured JSON line
//! per tick (at info level) with the key macro indicators. Readable by the
//! Tauri frontend, CI assertions, and `jq` pipelines.

use tracing_subscriber::{fmt, prelude::*, EnvFilter};

pub mod system;
pub use system::register_telemetry_system;

pub fn init() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));
    let _ = tracing_subscriber::registry()
        .with(fmt::layer())
        .with(filter)
        .try_init();
}
