//! Polity resource — describes the form of government.
//!
//! Fully additive: if `Polity` is not inserted into the world the election
//! and law systems behave exactly as before (two-party FPTP presidential
//! republic, default). When inserted it parametrises:
//!   - Which electoral system applies (`ElectoralSystem`).
//!   - How many legislative chambers exist.
//!   - Whether executive term limits are enforced.
//!   - The regime kind for scenario narrative and approval modifiers.
//!
//! Default produces the current US-style configuration so all existing
//! scenarios and tests are unaffected.

use bevy_ecs::prelude::Resource;
use serde::{Deserialize, Serialize};

/// High-level classification of the government's form.
///
/// Variants carry only the metadata needed to affect simulation behaviour.
/// Narrative labels (e.g. the name of a ruling party) are stored here for
/// UI / telemetry; they do not drive simulation logic directly — `ElectoralSystem`
/// and the `Polity` fields do.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum RegimeKind {
    AbsoluteMonarchy,
    ConstitutionalMonarchy {
        /// Year the founding charter / constitution was adopted.
        charter_year: u16,
    },
    ParliamentaryRepublic,
    /// The default: separate head of state + head of government.
    PresidentialRepublic,
    SinglePartyState {
        /// Name of the ruling party (narrative only).
        ruling_party: String,
    },
    MilitaryJunta,
    Theocracy {
        /// Dominant faith / legal source (narrative only).
        dominant_faith: String,
    },
    DirectDemocracy,
    TribalCouncil,
    Oligarchy,
    Custom {
        label: String,
    },
}

impl RegimeKind {
    /// True when the regime involves regular competitive elections by the
    /// general population (as opposed to hereditary succession, appointments,
    /// or single-party mandates).
    pub fn is_electoral(&self) -> bool {
        matches!(
            self,
            RegimeKind::ParliamentaryRepublic
                | RegimeKind::PresidentialRepublic
                | RegimeKind::ConstitutionalMonarchy { .. }
                | RegimeKind::DirectDemocracy
        )
    }
}

/// Mechanism by which the governing faction is selected or replaced.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "system")]
pub enum ElectoralSystem {
    /// Winner-take-all single-member districts; current default.
    FirstPastThePost,
    /// Party-list PR with an exclusion threshold.
    ProportionalRepresentation {
        /// Minimum vote fraction to receive seats (e.g. 0.05 = 5%).
        threshold: f32,
    },
    /// Instant-runoff / alternative vote.
    RankedChoice,
    /// Rulers appointed by existing leadership (no popular election).
    Appointment,
    /// Succession by birth / dynastic rule.
    Hereditary,
    /// No formal selection mechanism (revolution / ongoing coup state).
    None,
}

impl ElectoralSystem {
    /// True when citizens cast votes that can alter the outcome.
    pub fn is_competitive(&self) -> bool {
        matches!(
            self,
            Self::FirstPastThePost
                | Self::ProportionalRepresentation { .. }
                | Self::RankedChoice
        )
    }
}

/// Top-level government description inserted as a Bevy ECS `Resource`.
///
/// All fields have defaults matching the current hardcoded US scenario so
/// that worlds without an explicit `Polity` resource continue to behave
/// identically via the election system's `Option<Res<Polity>>` guard.
#[derive(Resource, Clone, Debug, Serialize, Deserialize)]
pub struct Polity {
    /// Display name (narrative / UI only).
    pub name: String,
    /// Form of government.
    pub regime: RegimeKind,
    /// In-simulation year the polity was founded.
    pub founding_year: i32,
    /// Number of legislative chambers (1 = unicameral, 2 = bicameral).
    pub chamber_count: u8,
    /// Fraction of the adult population legally entitled to vote [0, 1].
    /// 1.0 = universal suffrage. 0.0 = no franchise (e.g. absolute monarchy).
    pub franchise_fraction: f32,
    /// Whether the head of state is also head of government (presidential)
    /// vs. a separate elected prime minister (parliamentary).
    pub fused_executive: bool,
    /// Maximum consecutive terms allowed for the executive. `None` = no limit.
    pub executive_term_limit: Option<u32>,
    /// How the governing faction is selected.
    pub electoral_system: ElectoralSystem,
}

impl Default for Polity {
    fn default() -> Self {
        Self {
            name: "United States".to_string(),
            regime: RegimeKind::PresidentialRepublic,
            founding_year: 1789,
            chamber_count: 2,
            franchise_fraction: 1.0,
            fused_executive: true,
            executive_term_limit: Some(2),
            electoral_system: ElectoralSystem::FirstPastThePost,
        }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_polity_is_presidential_republic() {
        let p = Polity::default();
        assert_eq!(p.regime, RegimeKind::PresidentialRepublic);
        assert!(p.electoral_system.is_competitive());
        assert_eq!(p.chamber_count, 2);
        assert_eq!(p.executive_term_limit, Some(2));
        assert!((p.franchise_fraction - 1.0).abs() < 1e-6);
    }

    #[test]
    fn electoral_system_competitive_variants() {
        assert!(ElectoralSystem::FirstPastThePost.is_competitive());
        assert!(ElectoralSystem::ProportionalRepresentation { threshold: 0.05 }.is_competitive());
        assert!(ElectoralSystem::RankedChoice.is_competitive());
    }

    #[test]
    fn electoral_system_non_competitive_variants() {
        assert!(!ElectoralSystem::Appointment.is_competitive());
        assert!(!ElectoralSystem::Hereditary.is_competitive());
        assert!(!ElectoralSystem::None.is_competitive());
    }

    #[test]
    fn regime_kind_is_electoral() {
        assert!(RegimeKind::PresidentialRepublic.is_electoral());
        assert!(RegimeKind::ParliamentaryRepublic.is_electoral());
        assert!(RegimeKind::DirectDemocracy.is_electoral());
        assert!(RegimeKind::ConstitutionalMonarchy { charter_year: 1215 }.is_electoral());
    }

    #[test]
    fn regime_kind_not_electoral() {
        assert!(!RegimeKind::AbsoluteMonarchy.is_electoral());
        assert!(!RegimeKind::MilitaryJunta.is_electoral());
        assert!(!RegimeKind::SinglePartyState { ruling_party: "Vanguard".to_string() }.is_electoral());
        assert!(!RegimeKind::Theocracy { dominant_faith: "Sunni".to_string() }.is_electoral());
        assert!(!RegimeKind::Oligarchy.is_electoral());
        assert!(!RegimeKind::TribalCouncil.is_electoral());
    }

    #[test]
    fn single_party_state_polity_has_non_competitive_system() {
        let p = Polity {
            name: "People's Republic".to_string(),
            regime: RegimeKind::SinglePartyState { ruling_party: "Vanguard Party".to_string() },
            founding_year: 1949,
            chamber_count: 1,
            franchise_fraction: 0.0,
            fused_executive: true,
            executive_term_limit: None,
            electoral_system: ElectoralSystem::Appointment,
        };
        assert!(!p.electoral_system.is_competitive());
        assert!(!p.regime.is_electoral());
        assert!(p.executive_term_limit.is_none());
    }

    #[test]
    fn constitutional_monarchy_is_electoral() {
        let p = Polity {
            name: "United Kingdom".to_string(),
            regime: RegimeKind::ConstitutionalMonarchy { charter_year: 1689 },
            founding_year: 1707,
            chamber_count: 2,
            franchise_fraction: 1.0,
            fused_executive: false,
            executive_term_limit: None,
            electoral_system: ElectoralSystem::FirstPastThePost,
        };
        assert!(p.regime.is_electoral());
        assert!(p.electoral_system.is_competitive());
        assert!(!p.fused_executive);
        assert!(p.executive_term_limit.is_none());
    }

    #[test]
    fn pr_threshold_stored_correctly() {
        let es = ElectoralSystem::ProportionalRepresentation { threshold: 0.05 };
        if let ElectoralSystem::ProportionalRepresentation { threshold } = es {
            assert!((threshold - 0.05).abs() < 1e-6);
        } else {
            panic!("expected PR variant");
        }
    }
}
