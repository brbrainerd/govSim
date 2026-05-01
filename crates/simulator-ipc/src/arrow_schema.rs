//! Canonical Arrow schema for `MacroIndicators` exchanged over Flight.
//!
//! Column layout (all non-nullable):
//!   tick        : UInt64
//!   population  : UInt64
//!   gdp         : Float64   (I64F64 serialised as f64 for interop)
//!   gini        : Float32
//!   unemployment: Float32
//!   inflation   : Float32
//!   approval    : Float32
//!
//! Python sidecars read this schema with `pyarrow.ipc.read_schema(buf)`.

use arrow::datatypes::{DataType, Field, Schema};
use std::sync::Arc;

/// Return the canonical schema. Cached via `Arc` — cheap to clone.
pub fn macro_indicators_schema() -> Arc<Schema> {
    Arc::new(Schema::new(vec![
        Field::new("tick",         DataType::UInt64,  false),
        Field::new("population",   DataType::UInt64,  false),
        Field::new("gdp",          DataType::Float64, false),
        Field::new("gini",         DataType::Float32, false),
        Field::new("unemployment", DataType::Float32, false),
        Field::new("inflation",    DataType::Float32, false),
        Field::new("approval",     DataType::Float32, false),
    ]))
}

/// Serialize the schema to Arrow IPC stream format so Python sidecars can
/// read it with `pyarrow.ipc.open_stream(buf).schema_arrow`.
pub fn schema_bytes() -> Vec<u8> {
    use arrow::ipc::writer::StreamWriter;
    let schema = macro_indicators_schema();
    let mut buf: Vec<u8> = Vec::new();
    // Write an empty stream — schema is encoded in the stream header.
    let mut writer = StreamWriter::try_new(&mut buf, &schema)
        .expect("schema serialization is infallible");
    writer.finish().expect("finish is infallible");
    buf
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn schema_has_expected_columns() {
        let s = macro_indicators_schema();
        let names: Vec<&str> = s.fields().iter().map(|f| f.name().as_str()).collect();
        assert_eq!(names, ["tick","population","gdp","gini","unemployment","inflation","approval"]);
    }

    #[test]
    fn schema_bytes_non_empty() {
        assert!(!schema_bytes().is_empty());
    }
}
