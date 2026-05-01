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
    pub government_revenue: Money,
    pub government_expenditure: Money,
}

/// Government balance sheet. Phase 1 just tracks revenue.
#[derive(Resource, Default, Debug, Clone)]
pub struct Treasury {
    pub balance: Money,
}
