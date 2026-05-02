//! Judiciary resource — describes the independent judicial branch.
//!
//! Fully additive: absent resource = no judicial constraint on laws (current
//! default behaviour). When present, law_dispatcher can gate LawEffect
//! application behind `Judiciary::review_power` and `independence`, and
//! precedent accumulates weight over time.
//!
//! ## Historical calibration guide
//!
//! | System                          | independence | review_power | precedent_weight |
//! |-------------------------------- |:------------:|:------------:|:----------------:|
//! | Marbury-era US federal courts   |     0.90     |    true      |       0.80       |
//! | Weimar Germany (Art. 48 era)    |     0.40     |    false     |       0.30       |
//! | UK (common law, no codified CR) |     0.85     |    false     |       0.95       |
//! | Magna Carta England 1215        |     0.10     |    false     |       0.05       |
//! | Stalin-era USSR show trials     |     0.02     |    false     |       0.00       |
//! | ICC / EU Court of Justice       |     0.75     |    true      |       0.60       |
//!
//! `international_deference` captures how much the domestic judiciary weighs
//! rulings from supranational bodies (WTO panels, ICJ, ECHR). 0 = ignored.

use bevy_ecs::prelude::Resource;
use serde::{Deserialize, Serialize};

/// Judicial branch description.
#[derive(Resource, Debug, Clone, Serialize, Deserialize)]
pub struct Judiciary {
    /// How insulated the judiciary is from executive/legislative pressure [0, 1].
    ///
    /// - 1.0: fully independent (security of tenure, constitutional protection)
    /// - 0.5: partially captured (appointments political, no structural independence)
    /// - 0.0: rubber stamp (judges appointed and removable by executive at will)
    pub independence: f32,

    /// Whether courts can invalidate legislation that violates a higher law
    /// (constitution, charter, treaty). False = parliamentary sovereignty model.
    pub review_power: bool,

    /// How strongly prior rulings constrain future decisions [0, 1].
    ///
    /// 1.0 = strict stare decisis (common law);
    /// 0.0 = each case decided fresh from the statute (civil law).
    pub precedent_weight: f32,

    /// Weight given to rulings from supranational bodies [0, 1].
    ///
    /// 0.0 = domestic law supreme; 1.0 = automatic compliance with international rulings.
    pub international_deference: f32,
}

impl Default for Judiciary {
    /// Absent judiciary resource — all fields produce no constraint on laws.
    /// Independence 0 + review_power false = no judicial check on legislation.
    fn default() -> Self {
        Self {
            independence: 0.0,
            review_power: false,
            precedent_weight: 0.0,
            international_deference: 0.0,
        }
    }
}

impl Judiciary {
    /// True when the judiciary is likely to actively constrain legislation.
    ///
    /// A useful heuristic for the law dispatcher: only invoke review logic
    /// when the judiciary is meaningfully independent AND has review power.
    pub fn is_active_check(&self) -> bool {
        self.review_power && self.independence >= 0.3
    }

    /// Probability that a court challenge to a given law succeeds.
    ///
    /// Combines independence (willingness to rule against government) with
    /// review_power (legal authority to do so). Returns 0.0 when either is absent.
    ///
    /// Used by `LawEffect::JudicialReview` (Phase D/I) to gate law application.
    pub fn challenge_success_prob(&self) -> f32 {
        if !self.review_power { return 0.0; }
        self.independence.clamp(0.0, 1.0)
    }

    /// Effective legal predictability contribution from the judiciary.
    ///
    /// Combined with StateCapacity::legal_predictability downstream.
    /// High precedent weight + high independence → consistently applied law.
    pub fn predictability_contribution(&self) -> f32 {
        self.independence * self.precedent_weight
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_judiciary_has_no_active_check() {
        let j = Judiciary::default();
        assert!(!j.is_active_check(),
            "default judiciary (independence=0, review_power=false) must not constrain laws");
        assert_eq!(j.challenge_success_prob(), 0.0,
            "default judiciary must have zero challenge probability");
    }

    #[test]
    fn fully_independent_judiciary_with_review_power() {
        let j = Judiciary {
            independence: 0.90,
            review_power: true,
            precedent_weight: 0.80,
            international_deference: 0.20,
        };
        assert!(j.is_active_check());
        assert!((j.challenge_success_prob() - 0.90).abs() < 1e-6);
        let pred = j.predictability_contribution();
        assert!((pred - 0.90 * 0.80).abs() < 1e-6,
            "predictability = independence × precedent_weight, got {pred}");
    }

    #[test]
    fn review_power_false_always_zero_challenge_prob() {
        let j = Judiciary {
            independence: 0.99,
            review_power: false, // no constitutional review authority
            precedent_weight: 0.90,
            international_deference: 0.50,
        };
        assert_eq!(j.challenge_success_prob(), 0.0,
            "no review_power → challenge_success_prob must be 0.0 regardless of independence");
        assert!(!j.is_active_check());
    }

    #[test]
    fn low_independence_is_not_active_check() {
        let j = Judiciary {
            independence: 0.20, // below 0.30 threshold
            review_power: true,
            precedent_weight: 0.70,
            international_deference: 0.10,
        };
        assert!(!j.is_active_check(),
            "independence 0.20 (< 0.30 threshold) should not qualify as active check");
        // But challenge_success_prob is still independence (= 0.20) when review_power is true.
        assert!((j.challenge_success_prob() - 0.20).abs() < 1e-6);
    }

    #[test]
    fn weimar_judiciary_calibration() {
        // Article 48 era: eroded independence, no formal judicial review.
        let j = Judiciary {
            independence: 0.40,
            review_power: false,
            precedent_weight: 0.30,
            international_deference: 0.05,
        };
        assert!(!j.is_active_check(), "Weimar courts could not check emergency decrees");
        assert_eq!(j.challenge_success_prob(), 0.0);
    }

    #[test]
    fn us_federal_judiciary_calibration() {
        // Post-Marbury v. Madison, 1803 onward.
        let j = Judiciary {
            independence: 0.90,
            review_power: true,
            precedent_weight: 0.80,
            international_deference: 0.05,
        };
        assert!(j.is_active_check());
        assert!((j.challenge_success_prob() - 0.90).abs() < 1e-6);
        let pred = j.predictability_contribution();
        assert!(pred > 0.70, "US courts should have high predictability, got {pred}");
    }

    #[test]
    fn common_law_uk_calibration() {
        // Parliamentary sovereignty: no formal judicial review, but high precedent.
        let j = Judiciary {
            independence: 0.85,
            review_power: false, // no constitutional review of primary legislation
            precedent_weight: 0.95,
            international_deference: 0.60, // EU/ECHR compliance pre-Brexit
        };
        assert!(!j.is_active_check(), "UK courts cannot strike primary legislation");
        assert_eq!(j.challenge_success_prob(), 0.0);
        // But legal predictability contribution is still high.
        let pred = j.predictability_contribution();
        assert!(pred > 0.80, "UK stare decisis should yield high predictability, got {pred}");
    }

    #[test]
    fn predictability_contribution_zero_when_independence_zero() {
        let j = Judiciary {
            independence: 0.0,
            review_power: true,
            precedent_weight: 0.90,
            international_deference: 0.50,
        };
        assert!((j.predictability_contribution() - 0.0).abs() < 1e-6,
            "zero independence → zero predictability contribution");
    }

    #[test]
    fn international_deference_stored_correctly() {
        let j = Judiciary {
            independence: 0.75,
            review_power: true,
            precedent_weight: 0.60,
            international_deference: 0.80,
        };
        assert!((j.international_deference - 0.80).abs() < 1e-6);
    }
}
