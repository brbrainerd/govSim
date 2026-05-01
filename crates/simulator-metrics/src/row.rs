use serde::{Deserialize, Serialize};
use simulator_core::{
    CrisisKind, CrisisState, LegitimacyDebt, MacroIndicators, PollutionStock, PriceLevel,
    RightsLedger, SimClock, Treasury,
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
        mean_health: f32,
        mean_productivity: f32,
        mean_income: f64,
    ) -> Self {
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
            rights_granted_bits: rights.granted.bits(),
            treasury_balance: treasury.balance.to_num::<f64>(),
            price_level: price.level,
            crisis_kind: crisis_kind_u8(crisis.kind),
            crisis_remaining_ticks: crisis.remaining_ticks,
            mean_health,
            mean_productivity,
            mean_income,
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
