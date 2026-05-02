use serde::{Deserialize, Serialize};

/// DiD causal estimates produced by comparing treatment vs control arms.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CausalEstimate {
    /// Tick at which the law was enacted (the split point).
    pub enacted_tick:    u64,
    /// Number of ticks in each window side.
    pub window_ticks:    u64,

    // --- DiD deltas (treatment_post − treatment_pre) − (control_post − control_pre) ---

    /// Approval change attributable to the law [0, 1 pp].
    pub did_approval:     Option<f32>,
    /// GDP change attributable to the law (currency units).
    pub did_gdp:          Option<f64>,
    /// Pollution stock change attributable to the law (PU).
    pub did_pollution:    Option<f64>,
    /// Unemployment change attributable to the law [0, 1 pp].
    pub did_unemployment: Option<f32>,
    /// Legitimacy debt change attributable to the law.
    pub did_legitimacy:   Option<f32>,
    /// Treasury balance change attributable to the law.
    pub did_treasury:     Option<f64>,
    /// Mean income change attributable to the law (currency units/tick).
    pub did_income:       Option<f64>,
    /// Mean wealth change attributable to the law (currency units).
    pub did_wealth:       Option<f64>,
    /// Mean health change attributable to the law [0, 1 pp].
    pub did_health:       Option<f32>,

    // --- Raw treatment-arm means (post window) ---

    /// Post-enactment mean approval in the treatment arm.
    pub treatment_post_approval: f32,
    /// Post-enactment mean GDP in the treatment arm.
    pub treatment_post_gdp:      f64,
}

impl CausalEstimate {
    /// Returns true if all DiD estimates could be computed (sufficient data in both arms).
    pub fn is_complete(&self) -> bool {
        self.did_approval.is_some()
            && self.did_gdp.is_some()
            && self.did_pollution.is_some()
    }

    /// Summarise as a human-readable string.
    pub fn summary(&self) -> String {
        let approval = self.did_approval
            .map(|v| format!("{:+.2}pp", v * 100.0))
            .unwrap_or_else(|| "n/a".into());
        let gdp = self.did_gdp
            .map(|v| format!("{:+.0}", v))
            .unwrap_or_else(|| "n/a".into());
        let pollution = self.did_pollution
            .map(|v| format!("{:+.4} PU", v))
            .unwrap_or_else(|| "n/a".into());
        format!(
            "DiD(approval={approval}, gdp={gdp}, pollution={pollution}) @ tick {}±{}",
            self.enacted_tick, self.window_ticks
        )
    }
}
