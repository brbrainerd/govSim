//! Arrow Flight client stub for consuming `MacroIndicators` from a Python
//! sidecar (AgentTorch / PsychSim). In Phase 2 this returns deterministic
//! fake data; Phase 3 wires the real gRPC call.

use arrow::array::{Float32Array, Float64Array, UInt32Array, UInt64Array};
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
            Arc::new(UInt64Array::from(vec![tick])),   // tick
            Arc::new(UInt64Array::from(vec![0u64])),   // population
            Arc::new(Float64Array::from(vec![0.0f64])), // gdp
            Arc::new(Float32Array::from(vec![0.0f32])), // gini
            Arc::new(Float32Array::from(vec![0.0f32])), // unemployment
            Arc::new(Float32Array::from(vec![0.0f32])), // inflation
            Arc::new(Float32Array::from(vec![0.0f32])), // approval
            Arc::new(Float64Array::from(vec![0.0f64])), // pollution_stock
            Arc::new(UInt32Array::from(vec![0u32])),    // rights_granted_count
            Arc::new(Float32Array::from(vec![0.0f32])), // rights_breadth
            Arc::new(Float64Array::from(vec![0.0f64])), // mean_income
            Arc::new(Float64Array::from(vec![0.0f64])), // mean_wealth
            Arc::new(Float32Array::from(vec![1.0f32])), // state_capacity_score
            Arc::new(Float32Array::from(vec![0.5f32])), // approval_q1
            Arc::new(Float32Array::from(vec![0.5f32])), // approval_q2
            Arc::new(Float32Array::from(vec![0.5f32])), // approval_q3
            Arc::new(Float32Array::from(vec![0.5f32])), // approval_q4
            Arc::new(Float32Array::from(vec![0.5f32])), // approval_q5
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
    macro_rules! col_u32 {
        ($name:expr) => {
            batch
                .column_by_name($name)
                .and_then(|c| c.as_any().downcast_ref::<UInt32Array>())
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
        pollution_stock:        col_f64!("pollution_stock"),
        rights_granted_count:   col_u32!("rights_granted_count"),
        rights_breadth:         col_f32!("rights_breadth"),
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
        assert_eq!(batch.num_columns(), 18); // 11 base + mean_income + mean_wealth + approval_q1..q5
    }
}
