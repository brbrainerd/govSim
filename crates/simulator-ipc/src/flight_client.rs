//! Arrow Flight client stub for consuming `MacroIndicators` from a Python
//! sidecar (AgentTorch / PsychSim). In Phase 2 this returns deterministic
//! fake data; Phase 3 wires the real gRPC call.

use arrow::array::{Float32Array, Float64Array, UInt64Array};
use arrow::record_batch::RecordBatch;
use simulator_core::MacroIndicators;
use simulator_types::Money;
use std::sync::Arc;

use crate::arrow_schema::macro_indicators_schema;

/// Thin wrapper. Phase 3 will hold a `FlightServiceClient<Channel>` inside.
pub struct MacroFlightClient {
    endpoint: String,
}

impl MacroFlightClient {
    pub fn new(endpoint: impl Into<String>) -> Self {
        MacroFlightClient { endpoint: endpoint.into() }
    }

    pub fn endpoint(&self) -> &str { &self.endpoint }

    /// Fetch the latest `MacroIndicators` snapshot from the sidecar.
    ///
    /// Phase 2 stub: always returns a synthesised zero-state record.
    /// Phase 3 will open the Flight channel and do a `do_get` call.
    pub async fn fetch(&self, tick: u64) -> Result<MacroIndicators, IpcError> {
        // Build a 1-row RecordBatch so we exercise the schema path.
        let batch = fake_batch(tick)?;
        indicators_from_batch(&batch)
    }
}

fn fake_batch(tick: u64) -> Result<RecordBatch, IpcError> {
    let schema = macro_indicators_schema();
    let batch = RecordBatch::try_new(
        schema,
        vec![
            Arc::new(UInt64Array::from(vec![tick])),
            Arc::new(UInt64Array::from(vec![0u64])),
            Arc::new(Float64Array::from(vec![0.0f64])),
            Arc::new(Float32Array::from(vec![0.0f32])),
            Arc::new(Float32Array::from(vec![0.0f32])),
            Arc::new(Float32Array::from(vec![0.0f32])),
            Arc::new(Float32Array::from(vec![0.0f32])),
        ],
    )
    .map_err(|e| IpcError::Arrow(e.to_string()))?;
    Ok(batch)
}

fn indicators_from_batch(batch: &RecordBatch) -> Result<MacroIndicators, IpcError> {
    macro_rules! col_f32 {
        ($name:expr) => {
            batch
                .column_by_name($name)
                .and_then(|c| c.as_any().downcast_ref::<Float32Array>())
                .map(|a| a.value(0))
                .ok_or_else(|| IpcError::MissingColumn($name))?
        };
    }
    macro_rules! col_u64 {
        ($name:expr) => {
            batch
                .column_by_name($name)
                .and_then(|c| c.as_any().downcast_ref::<UInt64Array>())
                .map(|a| a.value(0))
                .ok_or_else(|| IpcError::MissingColumn($name))?
        };
    }
    macro_rules! col_f64 {
        ($name:expr) => {
            batch
                .column_by_name($name)
                .and_then(|c| c.as_any().downcast_ref::<Float64Array>())
                .map(|a| a.value(0))
                .ok_or_else(|| IpcError::MissingColumn($name))?
        };
    }

    Ok(MacroIndicators {
        population:             col_u64!("population"),
        gdp:                    Money::from_num(col_f64!("gdp")),
        gini:                   col_f32!("gini"),
        wealth_gini:            0.0,
        unemployment:           col_f32!("unemployment"),
        inflation:              col_f32!("inflation"),
        approval:               col_f32!("approval"),
        government_revenue:     Money::from_num(0.0),
        government_expenditure: Money::from_num(0.0),
        incumbent_party:        0,
        last_election_tick:     0,
        election_margin:        0.0,
        consecutive_terms:      0,
    })
}

#[derive(Debug, thiserror::Error)]
pub enum IpcError {
    #[error("arrow error: {0}")]
    Arrow(String),
    #[error("missing column: {0}")]
    MissingColumn(&'static str),
    #[error("transport error: {0}")]
    Transport(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn stub_fetch_returns_zero_state() {
        let client = MacroFlightClient::new("grpc://localhost:50051");
        let m = client.fetch(42).await.unwrap();
        assert_eq!(m.population, 0);
        assert_eq!(m.gini, 0.0);
    }

    #[test]
    fn fake_batch_schema_matches() {
        let batch = fake_batch(1).unwrap();
        assert_eq!(batch.num_rows(), 1);
        assert_eq!(batch.num_columns(), 7);
    }
}
