use std::{collections::VecDeque, path::Path};

use anyhow::Context;
use bevy_ecs::prelude::Resource;
use polars::prelude::*;

use crate::row::TickRow;

/// Default ring-buffer capacity: ~27 simulated years at tick resolution.
pub const DEFAULT_CAPACITY: usize = 10_000;

/// In-memory ring buffer of [`TickRow`] records. Registered as a Bevy
/// [`Resource`] so the `collect_metrics_system` can push to it.
///
/// Older rows are evicted when the buffer exceeds `capacity`. Use
/// [`save_parquet`](MetricStore::save_parquet) to flush to disk before eviction
/// if you need the full history.
#[derive(Resource)]
pub struct MetricStore {
    rows: VecDeque<TickRow>,
    capacity: usize,
}

impl Default for MetricStore {
    fn default() -> Self {
        Self::new(DEFAULT_CAPACITY)
    }
}

impl MetricStore {
    pub fn new(capacity: usize) -> Self {
        Self { rows: VecDeque::with_capacity(capacity), capacity }
    }

    /// Append a row, evicting the oldest if over capacity.
    pub fn push(&mut self, row: TickRow) {
        if self.rows.len() == self.capacity {
            self.rows.pop_front();
        }
        self.rows.push_back(row);
    }

    pub fn len(&self) -> usize { self.rows.len() }
    pub fn is_empty(&self) -> bool { self.rows.is_empty() }

    /// Iterate all rows in chronological order.
    pub fn rows(&self) -> impl Iterator<Item = &TickRow> {
        self.rows.iter()
    }

    /// Return rows where `from <= tick <= to`.
    pub fn query_range(&self, from: u64, to: u64) -> Vec<&TickRow> {
        self.rows.iter().filter(|r| r.tick >= from && r.tick <= to).collect()
    }

    /// Latest stored row, if any.
    pub fn latest(&self) -> Option<&TickRow> {
        self.rows.back()
    }

    /// Return the row at `tick`, if present.
    pub fn at_tick(&self, tick: u64) -> Option<&TickRow> {
        self.rows.iter().find(|r| r.tick == tick)
    }

    // ---- Parquet I/O -------------------------------------------------------

    /// Serialise the entire ring buffer to a Parquet file at `path`.
    pub fn save_parquet(&self, path: &Path) -> anyhow::Result<()> {
        let rows: Vec<&TickRow> = self.rows.iter().collect();
        let mut df = rows_to_df(&rows)?;
        let file = std::fs::File::create(path)
            .with_context(|| format!("creating parquet file {}", path.display()))?;
        ParquetWriter::new(file)
            .finish(&mut df)
            .context("writing parquet")?;
        Ok(())
    }

    /// Load a Parquet file produced by [`save_parquet`] into a new store.
    pub fn load_parquet(path: &Path, capacity: usize) -> anyhow::Result<Self> {
        let file = std::fs::File::open(path)
            .with_context(|| format!("opening parquet file {}", path.display()))?;
        let df = ParquetReader::new(file).finish().context("reading parquet")?;
        let rows = df_to_rows(&df)?;
        let mut store = Self::new(capacity);
        for row in rows {
            store.push(row);
        }
        Ok(store)
    }
}

// ---- DataFrame conversion helpers -----------------------------------------

fn rows_to_df(rows: &[&TickRow]) -> anyhow::Result<DataFrame> {
    macro_rules! col_u64 {
        ($field:ident) => {
            Column::new(
                stringify!($field).into(),
                rows.iter().map(|r| r.$field).collect::<Vec<u64>>(),
            )
        };
    }
    macro_rules! col_f64 {
        ($field:ident) => {
            Column::new(
                stringify!($field).into(),
                rows.iter().map(|r| r.$field).collect::<Vec<f64>>(),
            )
        };
    }
    macro_rules! col_f32 {
        ($field:ident) => {
            Column::new(
                stringify!($field).into(),
                rows.iter().map(|r| r.$field).collect::<Vec<f32>>(),
            )
        };
    }
    macro_rules! col_u32 {
        ($field:ident) => {
            Column::new(
                stringify!($field).into(),
                rows.iter().map(|r| r.$field).collect::<Vec<u32>>(),
            )
        };
    }
    macro_rules! col_u8 {
        ($field:ident) => {
            Column::new(
                stringify!($field).into(),
                rows.iter().map(|r| r.$field).collect::<Vec<u8>>(),
            )
        };
    }

    DataFrame::new(rows.len(), vec![
        col_u64!(tick),
        col_u64!(population),
        col_f64!(gdp),
        col_f32!(gini),
        col_f32!(wealth_gini),
        col_f32!(unemployment),
        col_f32!(inflation),
        col_f32!(approval),
        col_f64!(gov_revenue),
        col_f64!(gov_expenditure),
        col_u8!(incumbent_party),
        col_f32!(election_margin),
        col_u32!(consecutive_terms),
        col_f64!(pollution_stock),
        col_f32!(legitimacy_debt),
        col_u32!(rights_granted_bits),
        col_f64!(treasury_balance),
        col_f64!(price_level),
        col_u8!(crisis_kind),
        col_u64!(crisis_remaining_ticks),
        col_f32!(mean_health),
        col_f32!(mean_productivity),
        col_f64!(mean_income),
    ])
    .context("building DataFrame")
}

fn df_to_rows(df: &DataFrame) -> anyhow::Result<Vec<TickRow>> {
    macro_rules! get_u64 {
        ($col:expr) => {
            df.column($col)
                .context(concat!("missing column ", $col))?
                .u64()
                .context(concat!("column ", $col, " is not u64"))?
        };
    }
    macro_rules! get_f64 {
        ($col:expr) => {
            df.column($col)
                .context(concat!("missing column ", $col))?
                .f64()
                .context(concat!("column ", $col, " is not f64"))?
        };
    }
    macro_rules! get_f32 {
        ($col:expr) => {
            df.column($col)
                .context(concat!("missing column ", $col))?
                .f32()
                .context(concat!("column ", $col, " is not f32"))?
        };
    }
    macro_rules! get_u32 {
        ($col:expr) => {
            df.column($col)
                .context(concat!("missing column ", $col))?
                .u32()
                .context(concat!("column ", $col, " is not u32"))?
        };
    }
    macro_rules! get_u8 {
        ($col:expr) => {
            df.column($col)
                .context(concat!("missing column ", $col))?
                .u8()
                .context(concat!("column ", $col, " is not u8"))?
        };
    }

    let tick                  = get_u64!("tick");
    let population            = get_u64!("population");
    let gdp                   = get_f64!("gdp");
    let gini                  = get_f32!("gini");
    let wealth_gini           = get_f32!("wealth_gini");
    let unemployment          = get_f32!("unemployment");
    let inflation             = get_f32!("inflation");
    let approval              = get_f32!("approval");
    let gov_revenue           = get_f64!("gov_revenue");
    let gov_expenditure       = get_f64!("gov_expenditure");
    let incumbent_party       = get_u8!("incumbent_party");
    let election_margin       = get_f32!("election_margin");
    let consecutive_terms     = get_u32!("consecutive_terms");
    let pollution_stock       = get_f64!("pollution_stock");
    let legitimacy_debt       = get_f32!("legitimacy_debt");
    let rights_granted_bits   = get_u32!("rights_granted_bits");
    let treasury_balance      = get_f64!("treasury_balance");
    let price_level           = get_f64!("price_level");
    let crisis_kind           = get_u8!("crisis_kind");
    let crisis_remaining_ticks = get_u64!("crisis_remaining_ticks");
    let mean_health           = get_f32!("mean_health");
    let mean_productivity     = get_f32!("mean_productivity");
    let mean_income           = get_f64!("mean_income");

    let len = df.height();
    let mut rows = Vec::with_capacity(len);
    for i in 0..len {
        rows.push(TickRow {
            tick:                   tick.get(i).unwrap_or(0),
            population:             population.get(i).unwrap_or(0),
            gdp:                    gdp.get(i).unwrap_or(0.0),
            gini:                   gini.get(i).unwrap_or(0.0),
            wealth_gini:            wealth_gini.get(i).unwrap_or(0.0),
            unemployment:           unemployment.get(i).unwrap_or(0.0),
            inflation:              inflation.get(i).unwrap_or(0.0),
            approval:               approval.get(i).unwrap_or(0.0),
            gov_revenue:            gov_revenue.get(i).unwrap_or(0.0),
            gov_expenditure:        gov_expenditure.get(i).unwrap_or(0.0),
            incumbent_party:        incumbent_party.get(i).unwrap_or(0),
            election_margin:        election_margin.get(i).unwrap_or(0.0),
            consecutive_terms:      consecutive_terms.get(i).unwrap_or(0),
            pollution_stock:        pollution_stock.get(i).unwrap_or(0.0),
            legitimacy_debt:        legitimacy_debt.get(i).unwrap_or(0.0),
            rights_granted_bits:    rights_granted_bits.get(i).unwrap_or(0),
            treasury_balance:       treasury_balance.get(i).unwrap_or(0.0),
            price_level:            price_level.get(i).unwrap_or(1.0),
            crisis_kind:            crisis_kind.get(i).unwrap_or(0),
            crisis_remaining_ticks: crisis_remaining_ticks.get(i).unwrap_or(0),
            mean_health:            mean_health.get(i).unwrap_or(0.0),
            mean_productivity:      mean_productivity.get(i).unwrap_or(0.0),
            mean_income:            mean_income.get(i).unwrap_or(0.0),
        });
    }
    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_row(tick: u64, approval: f32) -> TickRow {
        TickRow { tick, approval, price_level: 1.0, ..Default::default() }
    }

    #[test]
    fn ring_buffer_evicts_oldest() {
        let mut store = MetricStore::new(3);
        store.push(make_row(1, 0.5));
        store.push(make_row(2, 0.6));
        store.push(make_row(3, 0.7));
        store.push(make_row(4, 0.8)); // should evict tick=1
        assert_eq!(store.len(), 3);
        assert!(store.at_tick(1).is_none());
        assert!(store.at_tick(4).is_some());
    }

    #[test]
    fn query_range_filters_correctly() {
        let mut store = MetricStore::new(10);
        for t in 0..10u64 {
            store.push(make_row(t, 0.5));
        }
        let results = store.query_range(3, 6);
        assert_eq!(results.len(), 4);
        assert_eq!(results[0].tick, 3);
        assert_eq!(results[3].tick, 6);
    }

    #[test]
    fn parquet_round_trip() {
        let tmp = std::env::temp_dir().join("ugs_metrics_test.parquet");
        let mut store = MetricStore::new(10);
        for t in 0..5u64 {
            store.push(make_row(t, t as f32 * 0.1));
        }
        store.save_parquet(&tmp).expect("save failed");
        let restored = MetricStore::load_parquet(&tmp, 10).expect("load failed");
        assert_eq!(restored.len(), 5);
        let r = restored.at_tick(3).unwrap();
        assert!((r.approval - 0.3).abs() < 1e-5);
        let _ = std::fs::remove_file(&tmp);
    }
}
