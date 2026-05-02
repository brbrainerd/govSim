use serde::{Deserialize, Serialize};
use simulator_core::{
    CrisisKind, CrisisState, LegitimacyDebt, MacroIndicators, PollutionStock, PriceLevel,
    RightsLedger, SimClock, StateCapacity, Treasury,
    components::{Health, Income, Productivity},
};

/// One record per simulation tick, using plain numeric types for portability.
/// All monetary values are stored as f64 (whole currency units, not cents)
/// to avoid overflow in Parquet columns while retaining sufficient precision.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TickRow {
    pub tick: u64,
    pub population: u64,
    /// GDP in whole currency units.
    pub gdp: f64,
    pub gini: f32,
    pub wealth_gini: f32,
    pub unemployment: f32,
    pub inflation: f32,
    /// Mean citizen approval [0, 1].
    pub approval: f32,
    pub gov_revenue: f64,
    pub gov_expenditure: f64,
    pub incumbent_party: u8,
    pub election_margin: f32,
    pub consecutive_terms: u32,
    pub pollution_stock: f64,
    pub legitimacy_debt: f32,
    /// Bitfield of currently granted civic rights (CivicRights::bits()).
    pub rights_granted_bits: u32,
    /// Count of rights currently granted (from MacroIndicators, updated monthly).
    pub rights_granted_count: u32,
    /// Fraction of defined rights granted [0, 1] (from MacroIndicators, updated monthly).
    pub rights_breadth: f32,
    pub treasury_balance: f64,
    pub price_level: f64,
    /// 0=None, 1=War, 2=Pandemic, 3=Recession, 4=NaturalDisaster.
    pub crisis_kind: u8,
    pub crisis_remaining_ticks: u64,
    /// Mean health across all citizens [0, 1].
    pub mean_health: f32,
    /// Mean productivity across all citizens [0, 1].
    pub mean_productivity: f32,
    /// Mean income in whole currency units.
    pub mean_income: f64,
    /// Composite state-capacity score [0, 1] (unweighted mean of 5 capacity fields).
    /// 1.0 when no StateCapacity resource is present (perfect / default capacity).
    pub state_capacity_score: f32,

    // --- Per-income-quintile mean approval (Q1 = bottom 20%, Q5 = top 20%) ---
    // Enables heterogeneous DiD: "did this law help the poor or the wealthy?"
    pub approval_q1: f32,
    pub approval_q2: f32,
    pub approval_q3: f32,
    pub approval_q4: f32,
    pub approval_q5: f32,
}

impl TickRow {
    #[allow(clippy::too_many_arguments)]
    pub(crate) fn from_resources(
        clock: &SimClock,
        indicators: &MacroIndicators,
        treasury: &Treasury,
        price: &PriceLevel,
        debt: &LegitimacyDebt,
        rights: &RightsLedger,
        crisis: &CrisisState,
        pollution: &PollutionStock,
        capacity: Option<&StateCapacity>,
        mean_health: f32,
        mean_productivity: f32,
        mean_income: f64,
        approval_by_quintile: [f32; 5],
    ) -> Self {
        let default_cap = StateCapacity::default();
        let cap = capacity.unwrap_or(&default_cap);
        Self {
            tick: clock.tick,
            population: indicators.population,
            gdp: indicators.gdp.to_num::<f64>(),
            gini: indicators.gini,
            wealth_gini: indicators.wealth_gini,
            unemployment: indicators.unemployment,
            inflation: indicators.inflation,
            approval: indicators.approval,
            gov_revenue: indicators.government_revenue.to_num::<f64>(),
            gov_expenditure: indicators.government_expenditure.to_num::<f64>(),
            incumbent_party: indicators.incumbent_party,
            election_margin: indicators.election_margin,
            consecutive_terms: indicators.consecutive_terms,
            pollution_stock: pollution.stock,
            legitimacy_debt: debt.stock,
            rights_granted_bits:  rights.granted.bits(),
            rights_granted_count: indicators.rights_granted_count,
            rights_breadth:       indicators.rights_breadth,
            treasury_balance: treasury.balance.to_num::<f64>(),
            price_level: price.level,
            crisis_kind: crisis_kind_u8(crisis.kind),
            crisis_remaining_ticks: crisis.remaining_ticks,
            mean_health,
            mean_productivity,
            mean_income,
            state_capacity_score: cap.composite_score(),
            approval_q1: approval_by_quintile[0],
            approval_q2: approval_by_quintile[1],
            approval_q3: approval_by_quintile[2],
            approval_q4: approval_by_quintile[3],
            approval_q5: approval_by_quintile[4],
        }
    }
}

pub(crate) fn crisis_kind_u8(kind: CrisisKind) -> u8 {
    match kind {
        CrisisKind::None          => 0,
        CrisisKind::War           => 1,
        CrisisKind::Pandemic      => 2,
        CrisisKind::Recession     => 3,
        CrisisKind::NaturalDisaster => 4,
    }
}

/// Compute mean approval by income quintile.
/// Collects (income, approval) pairs, sorts by income, buckets into 5 equal groups,
/// returns `[q1_mean, q2_mean, q3_mean, q4_mean, q5_mean]` (Q1 = bottom 20%).
/// Returns `[0.5; 5]` if there are fewer than 5 citizens.
pub(crate) fn compute_quintile_approval(
    pairs: impl Iterator<Item = (f64, f32)>,
) -> [f32; 5] {
    let mut v: Vec<(f64, f32)> = pairs.collect();
    if v.len() < 5 { return [0.5; 5]; }
    // Sort ascending by income (NaN-safe: treat NaN as 0).
    v.sort_unstable_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));
    let n = v.len();
    let mut out = [0.0f32; 5];
    for (q, slot) in out.iter_mut().enumerate() {
        let start = q * n / 5;
        let end   = (q + 1) * n / 5;
        let slice = &v[start..end];
        let sum: f32 = slice.iter().map(|(_, a)| a).sum();
        *slot = if slice.is_empty() { 0.5 } else { sum / slice.len() as f32 };
    }
    out
}

/// Compute mean health, mean productivity, and mean income over component queries.
/// Returns (mean_health, mean_productivity, mean_income).
pub(crate) fn compute_citizen_means(
    health_iter: impl Iterator<Item = Health>,
    prod_iter: impl Iterator<Item = Productivity>,
    income_iter: impl Iterator<Item = Income>,
) -> (f32, f32, f64) {
    let mut h_sum = 0.0f64;
    let mut h_n   = 0u64;
    for h in health_iter {
        h_sum += h.0.to_num::<f64>();
        h_n += 1;
    }

    let mut p_sum = 0.0f64;
    let mut p_n   = 0u64;
    for p in prod_iter {
        p_sum += p.0.to_num::<f64>();
        p_n += 1;
    }

    let mut i_sum = 0.0f64;
    let mut i_n   = 0u64;
    for i in income_iter {
        i_sum += i.0.to_num::<f64>();
        i_n += 1;
    }

    let mean_h = if h_n > 0 { (h_sum / h_n as f64) as f32 } else { 0.0 };
    let mean_p = if p_n > 0 { (p_sum / p_n as f64) as f32 } else { 0.0 };
    let mean_i = if i_n > 0 { i_sum / i_n as f64 } else { 0.0 };
    (mean_h, mean_p, mean_i)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn quintile_splits_evenly() {
        // 10 citizens sorted by income: incomes 1..=10, approvals 0.1..=1.0
        let pairs = (1..=10u64).map(|i| (i as f64, i as f32 * 0.1));
        let q = compute_quintile_approval(pairs);
        // Q1 = incomes 1-2, approvals 0.1+0.2 / 2 = 0.15
        assert!((q[0] - 0.15).abs() < 1e-5, "Q1 expected 0.15, got {}", q[0]);
        // Q5 = incomes 9-10, approvals 0.9+1.0 / 2 = 0.95
        assert!((q[4] - 0.95).abs() < 1e-5, "Q5 expected 0.95, got {}", q[4]);
        // Q3 (middle) = incomes 5-6, approvals 0.5+0.6 / 2 = 0.55
        assert!((q[2] - 0.55).abs() < 1e-5, "Q3 expected 0.55, got {}", q[2]);
    }

    #[test]
    fn quintile_with_fewer_than_5_returns_default() {
        let pairs = vec![(1.0f64, 0.5f32), (2.0, 0.6)].into_iter();
        let q = compute_quintile_approval(pairs);
        assert_eq!(q, [0.5; 5], "fewer than 5 citizens should return default 0.5");
    }

    #[test]
    fn quintile_unsorted_input_sorts_by_income() {
        // High-income citizen has low approval; low-income has high.
        // Q1 (poor) should have high approval; Q5 (rich) should have low.
        let pairs = vec![
            (100.0f64, 0.1f32), // high income, low approval
            (100.0, 0.1),
            (10.0, 0.9),        // low income, high approval
            (10.0, 0.9),
            (50.0, 0.5),
        ].into_iter();
        let q = compute_quintile_approval(pairs);
        assert!(q[0] > q[4], "Q1 (poor, high approval) should exceed Q5 (rich, low approval)");
    }
}
