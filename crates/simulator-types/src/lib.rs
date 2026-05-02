//! Shared primitives. No ECS, no async — just data types used everywhere.
//!
//! Fixed-point arithmetic is used for money and probability so simulations
//! are bit-exact across CPUs (see blueprint §3.4).

use serde::{Deserialize, Serialize};

/// Stable per-citizen identifier (independent of ECS Entity).
#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug, Serialize, Deserialize)]
pub struct CitizenId(pub u64);

#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug, Serialize, Deserialize)]
pub struct CorporationId(pub u64);

#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug, Serialize, Deserialize)]
pub struct LawId(pub u64);

#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug, Serialize, Deserialize)]
pub struct LegislatureId(pub u64);

#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug, Serialize, Deserialize)]
pub struct RegionId(pub u32);

/// Signed fixed-point money. Sufficient for individual-scale economics.
/// Aggregate sums should use a wider scalar (see blueprint §13 risk #9).
pub type Money = fixed::types::I64F64;

/// Probability in [0, 1].
pub type Probability = fixed::types::U0F32;

/// Generic 0..1 score (preferences, satisfaction, anger, etc.).
pub type Score = fixed::types::U0F32;

/// Simulation date. One tick = one simulated day by default.
#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug, Default, Serialize, Deserialize)]
pub struct SimDate {
    pub tick: u64,
    pub year: u16,
    pub quarter: u8,
    pub day: u16,
}

impl SimDate {
    pub const fn from_tick(tick: u64) -> Self {
        let day_of_year = (tick % 360) as u16;
        let year = 2026 + (tick / 360) as u16;
        let quarter = (day_of_year / 90) as u8;
        Self { tick, year, quarter, day: day_of_year }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn date_from_tick_zero() {
        let d = SimDate::from_tick(0);
        assert_eq!(d.year, 2026);
        assert_eq!(d.quarter, 0);
        assert_eq!(d.day, 0);
        assert_eq!(d.tick, 0);
    }

    /// Year increments at tick 360 (one simulated year).
    #[test]
    fn date_year_advances_at_tick_360() {
        let d = SimDate::from_tick(360);
        assert_eq!(d.year, 2027, "year should be 2027 at tick 360");
        assert_eq!(d.quarter, 0);
        assert_eq!(d.day, 0);
    }

    /// Quarter advances correctly every 90 days.
    #[test]
    fn date_quarter_calculation() {
        // Q0: days 0-89, Q1: days 90-179, Q2: days 180-269, Q3: days 270-359
        assert_eq!(SimDate::from_tick(0).quarter,   0);
        assert_eq!(SimDate::from_tick(89).quarter,  0);
        assert_eq!(SimDate::from_tick(90).quarter,  1);
        assert_eq!(SimDate::from_tick(179).quarter, 1);
        assert_eq!(SimDate::from_tick(180).quarter, 2);
        assert_eq!(SimDate::from_tick(269).quarter, 2);
        assert_eq!(SimDate::from_tick(270).quarter, 3);
        assert_eq!(SimDate::from_tick(359).quarter, 3);
    }

    /// Day-within-year wraps correctly at year boundaries.
    #[test]
    fn date_day_within_year_wraps() {
        let d = SimDate::from_tick(359);
        assert_eq!(d.year, 2026);
        assert_eq!(d.day, 359, "last day of year 1 should be 359");

        let d2 = SimDate::from_tick(360);
        assert_eq!(d2.year, 2027);
        assert_eq!(d2.day, 0, "first day of year 2 should be 0");
    }

    /// Large tick values produce correct years.
    #[test]
    fn date_large_tick() {
        // 10 simulated years = 3600 ticks.
        let d = SimDate::from_tick(3600);
        assert_eq!(d.year, 2036);
        assert_eq!(d.quarter, 0);
        assert_eq!(d.day, 0);
    }
}
