//! Aggregate ECS Resources written by the Mutate phase and read by the
//! UI / telemetry / cognition layers.

use bevy_ecs::prelude::Resource;
use bitflags::bitflags;
use simulator_types::Money;

/// Macro indicators recomputed each tick (or each commit phase).
#[derive(Resource, Default, Debug, Clone)]
pub struct MacroIndicators {
    pub population: u64,
    pub gdp: Money,
    /// Income Gini coefficient [0, 1] — higher = more income inequality.
    pub gini: f32,
    /// Wealth Gini coefficient [0, 1] — higher = more wealth concentration.
    pub wealth_gini: f32,
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

/// Tracks the aggregate price level (base = 1.0 at tick 0).
/// Rises multiplicatively with inflation each month; used to deflate nominal
/// quantities into real terms and to adjust ConsumptionExpenditure.
#[derive(Resource, Debug, Clone)]
pub struct PriceLevel {
    /// Current price index (1.0 = base year).
    pub level: f64,
}

impl Default for PriceLevel {
    fn default() -> Self { Self { level: 1.0 } }
}

/// Accumulator reset at the start of each year and flushed to MacroIndicators
/// at Phase::Commit. Written by taxation_system and law_dispatcher.
#[derive(Resource, Default, Debug, Clone)]
pub struct GovernmentLedger {
    pub revenue: Money,
    pub expenditure: Money,
}

/// Cumulative legitimacy debt: rises when popular benefit laws are repealed,
/// decays slowly. Reduces approval until paid down. Captures the policy-ratchet
/// dynamic: removing entrenched programs has lasting political cost.
///
/// Magnitude is in approval-shock units (0.01 = 1pp approval drop applied per
/// monthly approval tick until decayed).
#[derive(Resource, Debug, Clone)]
pub struct LegitimacyDebt {
    pub stock: f32,
    /// Per-monthly-tick decay multiplier; 0.95 ≈ 5%/month.
    pub decay: f32,
}

impl Default for LegitimacyDebt {
    fn default() -> Self { Self { stock: 0.0, decay: 0.95 } }
}

/// Aggregate pollution stock. Rises with economic activity, falls with
/// natural decay and abatement spending. Feeds back into citizen health
/// and productivity through `pollution_feedback_system` (Phase 30).
///
/// Units are arbitrary "pollution units" (PU); the feedback coefficients
/// are calibrated so that `stock ≈ 1.0` at a baseline industrialised
/// economy and `stock > 3.0` triggers meaningful health drag.
#[derive(Resource, Debug, Clone)]
pub struct PollutionStock {
    /// Current accumulated pollution level (PU). Non-negative.
    pub stock: f64,
    /// Natural decay fraction per tick (1.0 = instant clear, ~0.9997 ≈ 1%/month).
    pub decay: f64,
    /// PU added per unit of aggregate consumption expenditure (monthly).
    pub emission_rate: f64,
}

impl Default for PollutionStock {
    fn default() -> Self {
        Self { stock: 0.0, decay: 0.999_7, emission_rate: 0.000_001 }
    }
}

/// Kind of exogenous crisis currently gripping the polity.
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq)]
pub enum CrisisKind {
    #[default]
    None,
    /// Armed conflict — rally-round-the-flag then sustained drag.
    War,
    /// Disease outbreak — welfare spending pressure, workforce shock.
    Pandemic,
    /// Economic contraction — unemployment spike, revenue collapse.
    Recession,
    /// Environmental or geological disaster — short sharp shock.
    NaturalDisaster,
}

/// Exogenous crisis state. While `kind != None` the polity is inside a
/// *policy window*: the legitimacy-debt cost of emergency legislation drops
/// and a per-citizen approval shock was applied at onset.
///
/// Cleared automatically when `remaining_ticks` reaches 0.
#[derive(Resource, Debug, Clone)]
pub struct CrisisState {
    pub kind: CrisisKind,
    /// Ticks until the crisis resolves. 0 ↔ no active crisis.
    pub remaining_ticks: u64,
    /// Approval shock broadcast at onset (negative = immediate hit).
    pub onset_shock: f32,
    /// Multiplier on legitimacy-debt incurred by law changes while active.
    /// < 1.0 means emergency measures face reduced political resistance.
    pub cost_multiplier: f32,
}

impl Default for CrisisState {
    fn default() -> Self {
        Self { kind: CrisisKind::None, remaining_ticks: 0, onset_shock: 0.0, cost_multiplier: 1.0 }
    }
}

bitflags! {
    /// Categorical civic rights recognized by the polity. Each bit is a
    /// distinct right that historically expanded one-way (suffrage, racial
    /// equality, abolition, etc.). Modeled as bitflags so the ledger
    /// composes over time and so DSL laws can probe specific rights cheaply.
    #[derive(Copy, Clone, Debug, Default, Eq, PartialEq)]
    pub struct CivicRights: u32 {
        const UNIVERSAL_SUFFRAGE   = 1 << 0;
        const RACIAL_EQUALITY      = 1 << 1;
        const GENDER_EQUALITY      = 1 << 2;
        const LGBTQ_PROTECTIONS    = 1 << 3;
        const RELIGIOUS_FREEDOM    = 1 << 4;
        const LABOR_RIGHTS         = 1 << 5;
        const DUE_PROCESS          = 1 << 6;
        const FREE_SPEECH          = 1 << 7;
        const ABOLITION_OF_SLAVERY = 1 << 8;
    }
}

/// Categorical-rights ledger. Tracks currently recognized civic rights and
/// the historical high-water mark; revoking a right that was previously held
/// adds to LegitimacyDebt (one-way ratchet — expansions are sticky, contractions
/// expensive). Recent expansions trigger a temporary approval boost.
#[derive(Resource, Debug, Clone, Default)]
pub struct RightsLedger {
    pub granted: CivicRights,
    /// All rights ever granted in this run (never decreases).
    pub historical_max: CivicRights,
    /// Tick at which the most recent grant occurred (for honeymoon boost).
    pub last_expansion_tick: u64,
}

impl RightsLedger {
    /// Add a right. Returns true if it was newly granted.
    pub fn grant(&mut self, right: CivicRights, tick: u64) -> bool {
        let was_present = self.granted.contains(right);
        self.granted.insert(right);
        self.historical_max.insert(right);
        if !was_present {
            self.last_expansion_tick = tick;
            true
        } else {
            false
        }
    }

    /// Remove a right. Returns the legitimacy-debt magnitude to incur:
    /// 0.5 per right that was previously held and is now being taken away;
    /// 0.0 if the right was never granted.
    pub fn revoke(&mut self, right: CivicRights) -> f32 {
        let mut debt = 0.0_f32;
        for r in [
            CivicRights::UNIVERSAL_SUFFRAGE, CivicRights::RACIAL_EQUALITY,
            CivicRights::GENDER_EQUALITY, CivicRights::LGBTQ_PROTECTIONS,
            CivicRights::RELIGIOUS_FREEDOM, CivicRights::LABOR_RIGHTS,
            CivicRights::DUE_PROCESS, CivicRights::FREE_SPEECH,
            CivicRights::ABOLITION_OF_SLAVERY,
        ] {
            if right.contains(r)
                && self.granted.contains(r)
                && self.historical_max.contains(r)
            {
                self.granted.remove(r);
                debt += 0.5;
            }
        }
        debt
    }

    pub fn has(&self, right: CivicRights) -> bool {
        self.granted.contains(right)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rights_ledger_grants_and_records_high_water() {
        let mut l = RightsLedger::default();
        assert!(l.grant(CivicRights::UNIVERSAL_SUFFRAGE, 100));
        assert_eq!(l.last_expansion_tick, 100);
        // Re-granting an already-held right returns false and does not move the tick.
        assert!(!l.grant(CivicRights::UNIVERSAL_SUFFRAGE, 200));
        assert_eq!(l.last_expansion_tick, 100);
        assert!(l.has(CivicRights::UNIVERSAL_SUFFRAGE));
    }

    #[test]
    fn rights_ledger_revoke_charges_only_for_held_rights() {
        let mut l = RightsLedger::default();
        l.grant(CivicRights::ABOLITION_OF_SLAVERY, 1);
        l.grant(CivicRights::DUE_PROCESS, 2);
        // Revoking both held rights → 1.0 total debt (0.5 each).
        let debt = l.revoke(CivicRights::ABOLITION_OF_SLAVERY | CivicRights::DUE_PROCESS);
        assert!((debt - 1.0).abs() < 1e-6, "expected 1.0, got {debt}");
        // Revoking a never-held right → 0 debt.
        let debt2 = l.revoke(CivicRights::FREE_SPEECH);
        assert_eq!(debt2, 0.0);
        // historical_max retains both.
        assert!(l.historical_max.contains(CivicRights::ABOLITION_OF_SLAVERY));
        assert!(l.historical_max.contains(CivicRights::DUE_PROCESS));
        // currently granted does not.
        assert!(!l.granted.contains(CivicRights::ABOLITION_OF_SLAVERY));
    }
}
