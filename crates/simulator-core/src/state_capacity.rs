//! StateCapacity resource — models bureaucratic effectiveness and rule of law.
//!
//! Fully additive: all fields default to 1.0 (perfect capacity), so worlds
//! that do not insert a `StateCapacity` resource behave identically to the
//! pre-Phase-B simulator. Systems that consume capacity read it via
//! `Option<Res<StateCapacity>>` and fall back to the default when absent.
//!
//! ## Semantic guide
//!
//! | Field                     | 1.0 (full capacity)            | 0.0 (collapsed state)          |
//! |---------------------------|--------------------------------|--------------------------------|
//! | tax_collection_efficiency | All owed tax collected         | No tax revenue reaches treasury|
//! | enforcement_reach         | Every citizen subject to law   | Law has no physical reach      |
//! | enforcement_noise         | Perfectly consistent outcomes  | Completely random enforcement  |
//! | corruption_drift          | No self-reinforcing decay      | Capacity erodes autonomously   |
//! | legal_predictability      | Identical cases decided alike  | Outcomes are arbitrary         |
//! | bureaucratic_effectiveness| Full service-delivery output   | No services delivered          |
//!
//! Empirical anchors (World Governance Indicators, 2022):
//! - Nordic baseline:   `tax_collection_efficiency ≈ 0.97`, `legal_predictability ≈ 0.95`
//! - US baseline:       all fields ≈ 0.85–0.92
//! - Failed state (≈ Somalia 2010): `tax_collection_efficiency ≈ 0.18`, `enforcement_reach ≈ 0.12`

use bevy_ecs::prelude::Resource;
use serde::{Deserialize, Serialize};

/// Bureaucratic and institutional effectiveness parameters.
#[derive(Resource, Debug, Clone, Serialize, Deserialize)]
pub struct StateCapacity {
    /// Fraction of legally-owed tax that is actually collected [0, 1].
    /// Multiplies gross tax receipts in `taxation_system` before they reach
    /// the treasury.
    pub tax_collection_efficiency: f32,

    /// Fraction of citizens subject to effective law enforcement [0, 1].
    /// Below 1.0, a random fraction of enforcement actions simply do not
    /// materialise (modelled as a probability gate in `law_dispatcher`).
    pub enforcement_reach: f32,

    /// Standard deviation of noise added to per-citizen enforcement outcomes.
    /// 0.0 = perfectly consistent; 0.4 = chaotic/corrupt (N(0, noise)).
    pub enforcement_noise: f32,

    /// Per-tick fractional decay of capacity when polity is under stress
    /// (approval < 0.3). 0.0 = no self-reinforcing collapse; higher values
    /// mean capacity erodes faster once it starts to fall.
    pub corruption_drift: f32,

    /// Consistency of judicial and administrative rulings [0, 1].
    /// 1.0 = identical cases treated identically (rule of law).
    /// 0.0 = outcomes are arbitrary.
    pub legal_predictability: f32,

    /// Multiplier on the delivered magnitude of government service effects [0, 1].
    /// e.g. a subsidy effect of +$100/citizen is multiplied by this before
    /// being applied. Captures administrative leakage and delivery failure.
    pub bureaucratic_effectiveness: f32,
}

impl Default for StateCapacity {
    /// Perfect state capacity — preserves pre-Phase-B behaviour exactly.
    fn default() -> Self {
        Self {
            tax_collection_efficiency: 1.0,
            enforcement_reach: 1.0,
            enforcement_noise: 0.0,
            corruption_drift: 0.0,
            legal_predictability: 1.0,
            bureaucratic_effectiveness: 1.0,
        }
    }
}

impl StateCapacity {
    /// Composite index in [0, 1] — unweighted mean of the five positive-direction
    /// fields (excludes `corruption_drift` which is a hazard, not a capacity).
    /// Useful for telemetry and scenario comparison.
    pub fn composite_score(&self) -> f32 {
        let noise_score = 1.0 - self.enforcement_noise.clamp(0.0, 1.0);
        (self.tax_collection_efficiency
            + self.enforcement_reach
            + noise_score
            + self.legal_predictability
            + self.bureaucratic_effectiveness)
            / 5.0
    }

    /// Clamp all fields to their valid ranges.  Called after any direct mutation
    /// (e.g. scenario loading or the fragility-drift system) to prevent
    /// out-of-range values propagating.
    pub fn clamp_fields(&mut self) {
        self.tax_collection_efficiency = self.tax_collection_efficiency.clamp(0.0, 1.0);
        self.enforcement_reach         = self.enforcement_reach.clamp(0.0, 1.0);
        self.enforcement_noise         = self.enforcement_noise.clamp(0.0, 1.0);
        self.corruption_drift          = self.corruption_drift.clamp(0.0, 1.0);
        self.legal_predictability      = self.legal_predictability.clamp(0.0, 1.0);
        self.bureaucratic_effectiveness = self.bureaucratic_effectiveness.clamp(0.0, 1.0);
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_state_capacity_is_perfect() {
        let sc = StateCapacity::default();
        assert!((sc.tax_collection_efficiency - 1.0).abs() < 1e-6);
        assert!((sc.enforcement_reach - 1.0).abs() < 1e-6);
        assert!((sc.enforcement_noise - 0.0).abs() < 1e-6);
        assert!((sc.corruption_drift - 0.0).abs() < 1e-6);
        assert!((sc.legal_predictability - 1.0).abs() < 1e-6);
        assert!((sc.bureaucratic_effectiveness - 1.0).abs() < 1e-6);
    }

    #[test]
    fn composite_score_of_default_is_one() {
        let sc = StateCapacity::default();
        // noise_score = 1 - 0 = 1; all five = 1; mean = 1.0
        assert!((sc.composite_score() - 1.0).abs() < 1e-5, "got {}", sc.composite_score());
    }

    #[test]
    fn composite_score_of_failed_state() {
        let sc = StateCapacity {
            tax_collection_efficiency: 0.18,
            enforcement_reach: 0.12,
            enforcement_noise: 0.50,  // noise_score = 0.50
            corruption_drift: 0.05,
            legal_predictability: 0.10,
            bureaucratic_effectiveness: 0.15,
        };
        let expected = (0.18 + 0.12 + 0.50 + 0.10 + 0.15) / 5.0;
        assert!((sc.composite_score() - expected).abs() < 1e-5);
        assert!(sc.composite_score() < 0.25, "failed state score should be < 0.25");
    }

    #[test]
    fn clamp_fields_corrects_out_of_range() {
        let mut sc = StateCapacity {
            tax_collection_efficiency: 1.5,
            enforcement_reach: -0.3,
            enforcement_noise: 2.0,
            corruption_drift: -1.0,
            legal_predictability: 1.1,
            bureaucratic_effectiveness: -0.1,
        };
        sc.clamp_fields();
        assert!((sc.tax_collection_efficiency - 1.0).abs() < 1e-6);
        assert!((sc.enforcement_reach - 0.0).abs() < 1e-6);
        assert!((sc.enforcement_noise - 1.0).abs() < 1e-6);
        assert!((sc.corruption_drift - 0.0).abs() < 1e-6);
        assert!((sc.legal_predictability - 1.0).abs() < 1e-6);
        assert!((sc.bureaucratic_effectiveness - 0.0).abs() < 1e-6);
    }

    #[test]
    fn nordic_baseline_composite_score() {
        let sc = StateCapacity {
            tax_collection_efficiency: 0.97,
            enforcement_reach: 0.95,
            enforcement_noise: 0.02,   // noise_score = 0.98
            corruption_drift: 0.001,
            legal_predictability: 0.95,
            bureaucratic_effectiveness: 0.94,
        };
        let score = sc.composite_score();
        assert!(score > 0.90, "Nordic baseline composite should exceed 0.90, got {score:.3}");
    }

    #[test]
    fn composite_score_with_maximum_noise_reduces_score() {
        let clean = StateCapacity::default();
        let noisy = StateCapacity { enforcement_noise: 1.0, ..StateCapacity::default() };
        assert!(noisy.composite_score() < clean.composite_score(),
            "maximum noise should reduce composite score");
    }
}
