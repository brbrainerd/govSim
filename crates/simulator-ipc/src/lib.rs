//! Sidecar bridges: Arrow Flight (Phase 2 AgentTorch + Phase 3 PsychSim).
//!
//! Phase 2 slice (this commit):
//! - `arrow_schema`: the canonical Arrow schema for `MacroIndicators`
//!   exchanged over Flight.
//! - `MacroFlightClient`: async stub that connects to a Flight endpoint and
//!   reads one `MacroIndicators` record batch per call. Returns a hardcoded
//!   fake in unit tests.
//! - `schema_bytes()`: serializes the schema to IPC format so Python sidecars
//!   can import it with `pyarrow.ipc.read_schema`.

pub mod arrow_schema;
pub mod flight_client;
pub mod shm {}
pub mod capnp {}
pub mod agenttorch {}
pub mod psychsim {}

pub use arrow_schema::macro_indicators_schema;
pub use flight_client::MacroFlightClient;
