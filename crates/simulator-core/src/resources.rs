//! Aggregate ECS Resources written by the Mutate phase and read by the
//! UI / telemetry / cognition layers.

use bevy_ecs::prelude::Resource;
use simulator_types::Money;

/// Macro indicators recomputed each tick (or each commit phase).
#[derive(Resource, Default, Debug, Clone)]
pub struct MacroIndicators {
    pub population: u64,
    pub gdp: Money,
    pub gini: f32,
    pub unemployment: f32,
    pub inflation: f32,
    pub approval: f32,
    /// Total government revenue collected in the current year (resets each year).
    pub government_revenue: Money,
    /// Total government expenditure disbursed in the current year (resets each year).
    pub government_expenditure: Money,
    /// Incumbent party from the last election: 0=none, 1=Progressive, 2=Conservative.
    pub incumbent_party: u8,
    /// Tick at which the last election was held.
    pub last_election_tick: u64,
    /// Margin of last election victory in [0, 1].
    pub election_margin: f32,
    /// Consecutive terms the incumbent has held (resets on party flip).
    pub consecutive_terms: u32,
}

/// Government balance sheet. Phase 1 just tracks revenue.
#[derive(Resource, Default, Debug, Clone)]
pub struct Treasury {
    pub balance: Money,
}

/// Accumulator reset at the start of each year and flushed to MacroIndicators
/// at Phase::Commit. Written by taxation_system and law_dispatcher.
#[derive(Resource, Default, Debug, Clone)]
pub struct GovernmentLedger {
    pub revenue: Money,
    pub expenditure: Money,
}
