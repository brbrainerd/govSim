//! V-Dem ingestion + scenario calibration parameters.

pub mod vdem;
pub mod irt {}
pub mod mapping {}

pub use vdem::{CalibrationError, CountryProfile, VdemLoader};
