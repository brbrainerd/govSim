//! V-Dem v16 CSV loader.
//!
//! Reads `data/calibration/vdem_v16.csv` (downloaded via `cargo xtask vdem ingest`)
//! and extracts a `CountryProfile` for a given country code and year.
//!
//! V-Dem columns used (all in the v16 CSV schema):
//!   country_text_id — ISO 3-letter code (e.g. "AUS")
//!   year            — calendar year
//!   v2x_polyarchy   — electoral democracy index [0,1]
//!   v2x_libdem      — liberal democracy index [0,1]
//!   v2x_egaldem     — egalitarian democracy index [0,1]
//!   v2x_corr        — political corruption index [0,1] (higher = more corrupt)
//!   v2x_rule        — rule of law index [0,1]
//!   e_gdppc         — GDP per capita (real, 2011 USD) — from V-Dem Economic data
//!   e_migdpgro      — GDP growth rate (%)
//!
//! The loader uses Polars lazy scanning so it only materialises the relevant
//! rows (one country, one year) — safe to call on the full 500 MB CSV.

use polars::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountryProfile {
    pub country_id: String,
    pub year: i32,
    /// Electoral democracy [0, 1]
    pub polyarchy: f64,
    /// Liberal democracy [0, 1]
    pub lib_dem: f64,
    /// Egalitarian democracy [0, 1]
    pub egal_dem: f64,
    /// Political corruption [0, 1] (higher = more corrupt)
    pub corruption: f64,
    /// Rule of law [0, 1]
    pub rule_of_law: f64,
    /// GDP per capita (real 2011 USD)
    pub gdp_per_capita: f64,
    /// GDP growth rate (%)
    pub gdp_growth: f64,
}

impl CountryProfile {
    /// Starting unemployment rate inferred from egalitarian democracy index.
    /// Low egal_dem → higher unemployment baseline (very rough proxy).
    pub fn baseline_unemployment(&self) -> f32 {
        (0.20 - self.egal_dem * 0.15).clamp(0.03, 0.30) as f32
    }

    /// Monthly income estimate from GDP per capita.
    /// GDP per capita is annual; divide by 12 to get monthly.
    pub fn monthly_income_mean(&self) -> f64 {
        (self.gdp_per_capita / 12.0).max(200.0)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum CalibrationError {
    #[error("V-Dem CSV not found at {0} — run `cargo xtask vdem ingest`")]
    CsvNotFound(PathBuf),
    #[error("Polars error: {0}")]
    Polars(#[from] PolarsError),
    #[error("country '{0}' not found in V-Dem for year {1}")]
    CountryNotFound(String, i32),
    #[error("missing column '{0}' in V-Dem CSV")]
    MissingColumn(String),
}

const DEFAULT_CSV_PATH: &str = "data/calibration/vdem_v16.csv";

pub struct VdemLoader {
    csv_path: PathBuf,
}

impl VdemLoader {
    pub fn new() -> Self {
        Self { csv_path: PathBuf::from(DEFAULT_CSV_PATH) }
    }

    pub fn with_path(path: impl Into<PathBuf>) -> Self {
        Self { csv_path: path.into() }
    }

    /// Load a `CountryProfile` for the given country code and year.
    /// Returns the most recent available year if the exact year is absent.
    pub fn load(&self, country_id: &str, year: i32) -> Result<CountryProfile, CalibrationError> {
        if !self.csv_path.exists() {
            return Err(CalibrationError::CsvNotFound(self.csv_path.clone()));
        }

        // Columns we need — request only these to avoid scanning 100+ columns.
        // `e_migdpgro` was deprecated in V-Dem v16; `gdp_growth` falls back to
        // 0.0 below. Don't add it back unless your CSV variant actually has it.
        let needed = [
            "country_text_id",
            "year",
            "v2x_polyarchy",
            "v2x_libdem",
            "v2x_egaldem",
            "v2x_corr",
            "v2x_rule",
            "e_gdppc",
        ];

        let df = CsvReadOptions::default()
            .with_has_header(true)
            .with_columns(Some(
                Arc::from(
                    needed.iter().map(|s| PlSmallStr::from(*s)).collect::<Vec<_>>()
                )
            ))
            .try_into_reader_with_file_path(Some(self.csv_path.clone()))?
            .finish()?;

        // Filter to this country, sort by year descending, pick ≤ requested year.
        let filtered = df
            .lazy()
            .filter(col("country_text_id").eq(lit(country_id)))
            .filter(col("year").lt_eq(lit(year)))
            .sort(["year"], SortMultipleOptions::default().with_order_descending(true))
            .limit(1)
            .collect()?;

        if filtered.height() == 0 {
            return Err(CalibrationError::CountryNotFound(
                country_id.to_string(), year,
            ));
        }

        let row = &filtered;
        let get_f64 = |col_name: &str| -> Result<f64, CalibrationError> {
            let series = row.column(col_name)
                .map_err(|_| CalibrationError::MissingColumn(col_name.to_string()))?;
            Ok(series.get(0)
                .map(|v| match v {
                    AnyValue::Float64(f) => f,
                    AnyValue::Float32(f) => f as f64,
                    AnyValue::Int32(i)   => i as f64,
                    AnyValue::Int64(i)   => i as f64,
                    AnyValue::Null       => f64::NAN,
                    // V-Dem encodes some numeric columns as strings (to carry
                    // "NA" markers). Parse leniently; treat unparseable as NaN.
                    AnyValue::String(s) => s.parse::<f64>().unwrap_or(f64::NAN),
                    AnyValue::StringOwned(ref s) => s.parse::<f64>().unwrap_or(f64::NAN),
                    _ => f64::NAN,
                })
                .unwrap_or(f64::NAN))
        };

        let actual_year = row.column("year")
            .and_then(|s| s.get(0))
            .map(|v| match v {
                AnyValue::Int32(i) => i,
                AnyValue::Int64(i) => i as i32,
                _ => year,
            })
            .unwrap_or(year);

        Ok(CountryProfile {
            country_id: country_id.to_string(),
            year: actual_year,
            polyarchy:    get_f64("v2x_polyarchy")?.clamp(0.0, 1.0),
            lib_dem:      get_f64("v2x_libdem")?.clamp(0.0, 1.0),
            egal_dem:     get_f64("v2x_egaldem")?.clamp(0.0, 1.0),
            corruption:   get_f64("v2x_corr")?.clamp(0.0, 1.0),
            rule_of_law:  get_f64("v2x_rule")?.clamp(0.0, 1.0),
            gdp_per_capita: get_f64("e_gdppc")?.max(0.0),
            gdp_growth:   get_f64("e_migdpgro").unwrap_or(0.0),
        })
    }
}

impl Default for VdemLoader {
    fn default() -> Self { Self::new() }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn profile(egal_dem: f64, gdp_per_capita: f64) -> CountryProfile {
        CountryProfile {
            country_id: "TST".into(),
            year: 2022,
            polyarchy: 0.5,
            lib_dem: 0.5,
            egal_dem,
            corruption: 0.3,
            rule_of_law: 0.5,
            gdp_per_capita,
            gdp_growth: 2.0,
        }
    }

    // ── baseline_unemployment ─────────────────────────────────────────────────

    #[test]
    fn baseline_unemployment_clamps_to_minimum_at_high_egal_dem() {
        // egal_dem=1.0: 0.20 - 1.0*0.15 = 0.05, above floor 0.03 → 0.05
        let u = profile(1.0, 40_000.0).baseline_unemployment();
        assert!((u - 0.05_f32).abs() < 1e-4, "expected 0.05, got {u}");
    }

    #[test]
    fn baseline_unemployment_floor_at_low_egal_dem() {
        // egal_dem=0.0: 0.20 - 0*0.15 = 0.20, within [0.03, 0.30] → 0.20
        let u = profile(0.0, 40_000.0).baseline_unemployment();
        assert!((u - 0.20_f32).abs() < 1e-4, "expected 0.20, got {u}");
    }

    #[test]
    fn baseline_unemployment_clamps_to_ceiling() {
        // egal_dem=-1.0 (hypothetical out-of-range): 0.20 - (-1)*0.15 = 0.35 → clamped to 0.30
        let u = profile(-1.0, 40_000.0).baseline_unemployment();
        assert!((u - 0.30_f32).abs() < 1e-4, "expected 0.30 (ceiling), got {u}");
    }

    #[test]
    fn baseline_unemployment_result_always_in_valid_range() {
        for &egal in &[0.0, 0.25, 0.5, 0.75, 1.0] {
            let u = profile(egal, 30_000.0).baseline_unemployment();
            assert!((0.03..=0.30).contains(&u), "egal_dem={egal}: u={u} out of [0.03, 0.30]");
        }
    }

    // ── monthly_income_mean ───────────────────────────────────────────────────

    #[test]
    fn monthly_income_mean_divides_annual_gdp_by_12() {
        let m = profile(0.5, 12_000.0).monthly_income_mean();
        assert!((m - 1_000.0).abs() < 0.01, "expected 1000, got {m}");
    }

    #[test]
    fn monthly_income_mean_floors_at_200_for_very_low_gdp() {
        // gdp_per_capita = 600 → monthly = 50, clamped to 200
        let m = profile(0.5, 600.0).monthly_income_mean();
        assert!((m - 200.0).abs() < 0.01, "expected 200 (floor), got {m}");
    }

    #[test]
    fn monthly_income_mean_passes_through_high_gdp_correctly() {
        let m = profile(0.5, 60_000.0).monthly_income_mean();
        assert!((m - 5_000.0).abs() < 0.01, "expected 5000, got {m}");
    }
}
