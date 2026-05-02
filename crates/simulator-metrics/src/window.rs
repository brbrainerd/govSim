use crate::{row::TickRow, store::MetricStore};

/// Aggregate statistics over a window of ticks.
#[derive(Debug, Clone)]
pub struct WindowSummary {
    pub from_tick: u64,
    pub to_tick:   u64,
    pub n_rows:    usize,

    pub mean_approval:     f32,
    pub mean_unemployment: f32,
    pub mean_gdp:          f64,
    pub mean_pollution:    f64,
    pub mean_legitimacy:   f32,
    pub mean_treasury:     f64,

    // Distributional & institutional means (TickRow schema v2)
    pub mean_gini:                f32,
    pub mean_wealth_gini:         f32,
    pub mean_state_capacity:      f32,
    pub mean_health:              f32,
    pub mean_income:              f64,
    pub mean_rights_breadth:      f32,

    pub min_approval:      f32,
    pub max_approval:      f32,
    pub min_gdp:           f64,
    pub max_gdp:           f64,
}

impl WindowSummary {
    /// Compute from a slice of rows.
    pub fn from_rows(rows: &[&TickRow]) -> Option<Self> {
        if rows.is_empty() { return None; }

        let n = rows.len() as f64;
        let from_tick = rows.first().unwrap().tick;
        let to_tick   = rows.last().unwrap().tick;

        let mean_approval     = rows.iter().map(|r| r.approval as f64).sum::<f64>() / n;
        let mean_unemployment = rows.iter().map(|r| r.unemployment as f64).sum::<f64>() / n;
        let mean_gdp          = rows.iter().map(|r| r.gdp).sum::<f64>() / n;
        let mean_pollution    = rows.iter().map(|r| r.pollution_stock).sum::<f64>() / n;
        let mean_legitimacy   = rows.iter().map(|r| r.legitimacy_debt as f64).sum::<f64>() / n;
        let mean_treasury     = rows.iter().map(|r| r.treasury_balance).sum::<f64>() / n;

        let mean_gini           = rows.iter().map(|r| r.gini as f64).sum::<f64>() / n;
        let mean_wealth_gini    = rows.iter().map(|r| r.wealth_gini as f64).sum::<f64>() / n;
        let mean_state_capacity = rows.iter().map(|r| r.state_capacity_score as f64).sum::<f64>() / n;
        let mean_health         = rows.iter().map(|r| r.mean_health as f64).sum::<f64>() / n;
        let mean_income         = rows.iter().map(|r| r.mean_income).sum::<f64>() / n;
        let mean_rights_breadth = rows.iter().map(|r| r.rights_breadth as f64).sum::<f64>() / n;

        let min_approval = rows.iter().map(|r| r.approval).fold(f32::INFINITY, f32::min);
        let max_approval = rows.iter().map(|r| r.approval).fold(f32::NEG_INFINITY, f32::max);
        let min_gdp      = rows.iter().map(|r| r.gdp).fold(f64::INFINITY, f64::min);
        let max_gdp      = rows.iter().map(|r| r.gdp).fold(f64::NEG_INFINITY, f64::max);

        Some(Self {
            from_tick, to_tick,
            n_rows: rows.len(),
            mean_approval: mean_approval as f32,
            mean_unemployment: mean_unemployment as f32,
            mean_gdp,
            mean_pollution,
            mean_legitimacy: mean_legitimacy as f32,
            mean_treasury,
            mean_gini:                mean_gini as f32,
            mean_wealth_gini:         mean_wealth_gini as f32,
            mean_state_capacity:      mean_state_capacity as f32,
            mean_health:              mean_health as f32,
            mean_income,
            mean_rights_breadth:      mean_rights_breadth as f32,
            min_approval,
            max_approval,
            min_gdp,
            max_gdp,
        })
    }

    /// Convenience: compute directly from the store over [from, to].
    pub fn from_store(store: &MetricStore, from: u64, to: u64) -> Option<Self> {
        let rows = store.query_range(from, to);
        Self::from_rows(&rows)
    }
}

/// Difference-in-differences summary between two windows.
/// Both windows should be the same length. Typically:
///   - `pre` = the N ticks before law enactment
///   - `post` = the N ticks after law enactment
#[derive(Debug, Clone)]
pub struct WindowDiff {
    pub pre:  WindowSummary,
    pub post: WindowSummary,

    /// post.mean - pre.mean for each metric.
    pub delta_approval:     f32,
    pub delta_unemployment: f32,
    pub delta_gdp:          f64,
    pub delta_pollution:    f64,
    pub delta_legitimacy:   f32,
    pub delta_treasury:     f64,

    pub delta_gini:                f32,
    pub delta_wealth_gini:         f32,
    pub delta_state_capacity:      f32,
    pub delta_health:              f32,
    pub delta_income:              f64,
    pub delta_rights_breadth:      f32,
}

impl WindowDiff {
    pub fn new(pre: WindowSummary, post: WindowSummary) -> Self {
        let delta_approval     = post.mean_approval     - pre.mean_approval;
        let delta_unemployment = post.mean_unemployment - pre.mean_unemployment;
        let delta_gdp          = post.mean_gdp          - pre.mean_gdp;
        let delta_pollution    = post.mean_pollution    - pre.mean_pollution;
        let delta_legitimacy   = post.mean_legitimacy   - pre.mean_legitimacy;
        let delta_treasury     = post.mean_treasury     - pre.mean_treasury;
        let delta_gini             = post.mean_gini             - pre.mean_gini;
        let delta_wealth_gini      = post.mean_wealth_gini      - pre.mean_wealth_gini;
        let delta_state_capacity   = post.mean_state_capacity   - pre.mean_state_capacity;
        let delta_health           = post.mean_health           - pre.mean_health;
        let delta_income           = post.mean_income           - pre.mean_income;
        let delta_rights_breadth   = post.mean_rights_breadth   - pre.mean_rights_breadth;
        Self { pre, post, delta_approval, delta_unemployment, delta_gdp,
               delta_pollution, delta_legitimacy, delta_treasury,
               delta_gini, delta_wealth_gini, delta_state_capacity,
               delta_health, delta_income, delta_rights_breadth }
    }

    /// Build from the store, centering the split at `enacted_tick`.
    /// Uses `window_size` ticks on each side (pre: [-window, -1], post: [0, +window-1]).
    pub fn from_store(store: &MetricStore, enacted_tick: u64, window_size: u64) -> Option<Self> {
        if enacted_tick < window_size { return None; }
        let pre_from  = enacted_tick - window_size;
        let pre_to    = enacted_tick - 1;
        let post_from = enacted_tick;
        let post_to   = enacted_tick + window_size - 1;

        let pre  = WindowSummary::from_store(store, pre_from, pre_to)?;
        let post = WindowSummary::from_store(store, post_from, post_to)?;
        Some(Self::new(pre, post))
    }
}

/// Pairs a treatment window (law active) against a control window (same
/// duration, same pre-period, no law). Used for DiD estimation by the
/// `simulator-counterfactual` crate.
#[derive(Debug, Clone)]
pub struct LawEffectWindow {
    pub enacted_tick:  u64,
    pub window_size:   u64,
    pub treatment_pre:  WindowSummary,
    pub treatment_post: WindowSummary,
    /// If present: control arm data (from a counterfactual run).
    pub control_pre:    Option<WindowSummary>,
    pub control_post:   Option<WindowSummary>,
}

impl LawEffectWindow {
    /// Construct from treatment-arm store only (no counterfactual yet).
    pub fn from_treatment(
        store: &MetricStore,
        enacted_tick: u64,
        window_size: u64,
    ) -> Option<Self> {
        if enacted_tick < window_size { return None; }
        let pre_from  = enacted_tick - window_size;
        let pre_to    = enacted_tick - 1;
        let post_from = enacted_tick;
        let post_to   = enacted_tick + window_size - 1;
        Some(Self {
            enacted_tick,
            window_size,
            treatment_pre:  WindowSummary::from_store(store, pre_from, pre_to)?,
            treatment_post: WindowSummary::from_store(store, post_from, post_to)?,
            control_pre:    None,
            control_post:   None,
        })
    }

    /// Attach counterfactual (control) windows; called by `simulator-counterfactual`.
    pub fn with_control(
        mut self,
        control_pre:  WindowSummary,
        control_post: WindowSummary,
    ) -> Self {
        self.control_pre  = Some(control_pre);
        self.control_post = Some(control_post);
        self
    }

    /// DiD estimate for approval: (treatment_post - treatment_pre) - (control_post - control_pre).
    /// Returns None if no control arm is attached.
    pub fn did_approval(&self) -> Option<f32> {
        let ctrl_pre  = self.control_pre.as_ref()?;
        let ctrl_post = self.control_post.as_ref()?;
        let treat_delta = self.treatment_post.mean_approval - self.treatment_pre.mean_approval;
        let ctrl_delta  = ctrl_post.mean_approval - ctrl_pre.mean_approval;
        Some(treat_delta - ctrl_delta)
    }

    /// DiD estimate for GDP.
    pub fn did_gdp(&self) -> Option<f64> {
        let ctrl_pre  = self.control_pre.as_ref()?;
        let ctrl_post = self.control_post.as_ref()?;
        let treat_delta = self.treatment_post.mean_gdp - self.treatment_pre.mean_gdp;
        let ctrl_delta  = ctrl_post.mean_gdp - ctrl_pre.mean_gdp;
        Some(treat_delta - ctrl_delta)
    }

    /// DiD estimate for pollution stock.
    pub fn did_pollution(&self) -> Option<f64> {
        let ctrl_pre  = self.control_pre.as_ref()?;
        let ctrl_post = self.control_post.as_ref()?;
        let treat_delta = self.treatment_post.mean_pollution - self.treatment_pre.mean_pollution;
        let ctrl_delta  = ctrl_post.mean_pollution - ctrl_pre.mean_pollution;
        Some(treat_delta - ctrl_delta)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{store::MetricStore, row::TickRow};

    fn push_row(store: &mut MetricStore, tick: u64, approval: f32, gdp: f64) {
        store.push(TickRow {
            tick, approval, gdp, price_level: 1.0,
            ..Default::default()
        });
    }

    #[test]
    fn window_summary_means() {
        let mut store = MetricStore::new(20);
        for t in 0..10u64 {
            push_row(&mut store, t, t as f32 * 0.1, t as f64 * 1000.0);
        }
        let summary = WindowSummary::from_store(&store, 0, 9).unwrap();
        // Mean approval of [0.0, 0.1, ..., 0.9] = 0.45
        assert!((summary.mean_approval - 0.45).abs() < 1e-4);
        // Mean GDP of [0, 1000, ..., 9000] = 4500
        assert!((summary.mean_gdp - 4500.0).abs() < 1e-3);
    }

    #[test]
    fn window_diff_delta() {
        let mut store = MetricStore::new(20);
        // Pre-period: ticks 0-4, approval=0.4
        for t in 0..5u64 {
            push_row(&mut store, t, 0.4, 5000.0);
        }
        // Post-period: ticks 5-9, approval=0.6
        for t in 5..10u64 {
            push_row(&mut store, t, 0.6, 6000.0);
        }
        let diff = WindowDiff::from_store(&store, 5, 5).unwrap();
        assert!((diff.delta_approval - 0.2).abs() < 1e-4);
        assert!((diff.delta_gdp - 1000.0).abs() < 1e-3);
    }

    #[test]
    fn did_without_control_returns_none() {
        let mut store = MetricStore::new(20);
        for t in 0..10u64 {
            push_row(&mut store, t, 0.5, 5000.0);
        }
        let lew = LawEffectWindow::from_treatment(&store, 5, 5).unwrap();
        assert!(lew.did_approval().is_none());
        assert!(lew.did_gdp().is_none());
    }

    #[test]
    fn did_with_control_computes_correctly() {
        let mut treat_store = MetricStore::new(20);
        let mut ctrl_store  = MetricStore::new(20);

        // Treatment: pre=0.4, post=0.7 → delta=+0.3
        for t in 0..5u64  { push_row(&mut treat_store, t, 0.4, 0.0); }
        for t in 5..10u64 { push_row(&mut treat_store, t, 0.7, 0.0); }

        // Control: pre=0.4, post=0.5 → delta=+0.1
        for t in 0..5u64  { push_row(&mut ctrl_store, t, 0.4, 0.0); }
        for t in 5..10u64 { push_row(&mut ctrl_store, t, 0.5, 0.0); }

        let lew = LawEffectWindow::from_treatment(&treat_store, 5, 5).unwrap();
        let ctrl_pre  = WindowSummary::from_store(&ctrl_store, 0, 4).unwrap();
        let ctrl_post = WindowSummary::from_store(&ctrl_store, 5, 9).unwrap();
        let lew = lew.with_control(ctrl_pre, ctrl_post);

        // DiD = (0.3) - (0.1) = 0.2
        let did = lew.did_approval().unwrap();
        assert!((did - 0.2).abs() < 1e-4, "expected 0.2, got {did}");
    }

    // ── WindowSummary edge cases ───────────────────────────────────────────────

    #[test]
    fn from_rows_empty_returns_none() {
        let result = WindowSummary::from_rows(&[]);
        assert!(result.is_none(), "empty rows should return None");
    }

    #[test]
    fn from_rows_single_row() {
        let row = TickRow { tick: 7, approval: 0.75, gdp: 12_000.0, price_level: 1.0, ..Default::default() };
        let summary = WindowSummary::from_rows(&[&row]).unwrap();
        assert_eq!(summary.n_rows, 1);
        assert_eq!(summary.from_tick, 7);
        assert_eq!(summary.to_tick,   7);
        assert!((summary.mean_approval - 0.75).abs() < 1e-5);
        assert!((summary.mean_gdp - 12_000.0).abs() < 1e-3);
    }

    #[test]
    fn window_summary_min_max_approval() {
        let mut store = MetricStore::new(20);
        for (t, a) in [(0, 0.1f32), (1, 0.5), (2, 0.9)] {
            store.push(TickRow { tick: t, approval: a, price_level: 1.0, ..Default::default() });
        }
        let s = WindowSummary::from_store(&store, 0, 2).unwrap();
        assert!((s.min_approval - 0.1).abs() < 1e-5, "min_approval should be 0.1");
        assert!((s.max_approval - 0.9).abs() < 1e-5, "max_approval should be 0.9");
    }

    #[test]
    fn window_summary_min_max_gdp() {
        let mut store = MetricStore::new(20);
        for (t, g) in [(0, 1000.0f64), (1, 5000.0), (2, 2000.0)] {
            store.push(TickRow { tick: t, gdp: g, price_level: 1.0, ..Default::default() });
        }
        let s = WindowSummary::from_store(&store, 0, 2).unwrap();
        assert!((s.min_gdp - 1000.0).abs() < 1e-3, "min_gdp should be 1000");
        assert!((s.max_gdp - 5000.0).abs() < 1e-3, "max_gdp should be 5000");
    }

    #[test]
    fn window_summary_n_rows_and_tick_range() {
        let mut store = MetricStore::new(20);
        for t in 10..15u64 {
            push_row(&mut store, t, 0.5, 1000.0);
        }
        let s = WindowSummary::from_store(&store, 10, 14).unwrap();
        assert_eq!(s.n_rows, 5);
        assert_eq!(s.from_tick, 10);
        assert_eq!(s.to_tick,   14);
    }

    #[test]
    fn window_diff_from_store_returns_none_when_enacted_tick_too_small() {
        let mut store = MetricStore::new(20);
        for t in 0..10u64 {
            push_row(&mut store, t, 0.5, 5000.0);
        }
        // enacted_tick=3, window_size=5 → 3 < 5 → None
        let result = WindowDiff::from_store(&store, 3, 5);
        assert!(result.is_none(), "should return None when enacted_tick < window_size");
    }

    #[test]
    fn law_effect_window_returns_none_when_insufficient_pre_data() {
        let mut store = MetricStore::new(20);
        for t in 0..10u64 {
            push_row(&mut store, t, 0.5, 5000.0);
        }
        // enacted_tick=3, window_size=5 → 3 < 5 → None
        let result = LawEffectWindow::from_treatment(&store, 3, 5);
        assert!(result.is_none(), "should return None when pre-window underruns data");
    }

    #[test]
    fn did_pollution_with_control_computes_correctly() {
        let mut treat_store = MetricStore::new(20);
        let mut ctrl_store  = MetricStore::new(20);

        // Treatment pollution: pre=2.0, post=1.0 → delta=-1.0
        for t in 0..5u64  {
            treat_store.push(TickRow { tick: t, pollution_stock: 2.0, price_level: 1.0, ..Default::default() });
        }
        for t in 5..10u64 {
            treat_store.push(TickRow { tick: t, pollution_stock: 1.0, price_level: 1.0, ..Default::default() });
        }
        // Control pollution: pre=2.0, post=2.0 → delta=0.0
        for t in 0..5u64  {
            ctrl_store.push(TickRow { tick: t, pollution_stock: 2.0, price_level: 1.0, ..Default::default() });
        }
        for t in 5..10u64 {
            ctrl_store.push(TickRow { tick: t, pollution_stock: 2.0, price_level: 1.0, ..Default::default() });
        }

        let lew = LawEffectWindow::from_treatment(&treat_store, 5, 5).unwrap();
        let ctrl_pre  = WindowSummary::from_store(&ctrl_store, 0, 4).unwrap();
        let ctrl_post = WindowSummary::from_store(&ctrl_store, 5, 9).unwrap();
        let lew = lew.with_control(ctrl_pre, ctrl_post);

        // DiD = (-1.0) - (0.0) = -1.0
        let did = lew.did_pollution().unwrap();
        assert!((did - (-1.0)).abs() < 1e-5, "expected -1.0, got {did}");
    }

    #[test]
    fn did_gdp_with_control_computes_correctly() {
        let mut treat_store = MetricStore::new(20);
        let mut ctrl_store  = MetricStore::new(20);

        // Treatment GDP: pre=5000, post=8000 → delta=+3000
        for t in 0..5u64  { push_row(&mut treat_store, t, 0.5, 5000.0); }
        for t in 5..10u64 { push_row(&mut treat_store, t, 0.5, 8000.0); }
        // Control GDP: pre=5000, post=6000 → delta=+1000
        for t in 0..5u64  { push_row(&mut ctrl_store, t, 0.5, 5000.0); }
        for t in 5..10u64 { push_row(&mut ctrl_store, t, 0.5, 6000.0); }

        let lew = LawEffectWindow::from_treatment(&treat_store, 5, 5).unwrap();
        let ctrl_pre  = WindowSummary::from_store(&ctrl_store, 0, 4).unwrap();
        let ctrl_post = WindowSummary::from_store(&ctrl_store, 5, 9).unwrap();
        let lew = lew.with_control(ctrl_pre, ctrl_post);

        // DiD = (3000) - (1000) = 2000
        let did = lew.did_gdp().unwrap();
        assert!((did - 2000.0).abs() < 1e-3, "expected 2000.0, got {did}");
    }

    #[test]
    fn window_diff_deltas_all_metrics() {
        let mut store = MetricStore::new(20);
        // Build rows with known values for all tracked metrics.
        for t in 0..5u64 {
            store.push(TickRow {
                tick: t, approval: 0.40, unemployment: 0.10, gdp: 5_000.0,
                pollution_stock: 3.0, legitimacy_debt: 0.20, treasury_balance: 10_000.0,
                price_level: 1.0, ..Default::default()
            });
        }
        for t in 5..10u64 {
            store.push(TickRow {
                tick: t, approval: 0.60, unemployment: 0.05, gdp: 7_000.0,
                pollution_stock: 2.0, legitimacy_debt: 0.10, treasury_balance: 15_000.0,
                price_level: 1.0, ..Default::default()
            });
        }
        let diff = WindowDiff::from_store(&store, 5, 5).unwrap();
        assert!((diff.delta_approval     -  0.20).abs() < 1e-4);
        assert!((diff.delta_unemployment - -0.05).abs() < 1e-4);
        assert!((diff.delta_gdp          - 2000.0).abs() < 1e-3);
        assert!((diff.delta_pollution    - -1.0).abs() < 1e-5);
        assert!((diff.delta_legitimacy   - -0.10).abs() < 1e-4);
        assert!((diff.delta_treasury     - 5000.0).abs() < 1e-3);
    }
}
