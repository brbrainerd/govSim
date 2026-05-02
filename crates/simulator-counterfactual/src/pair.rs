use simulator_core::Sim;
use simulator_law::{LawHandle, LawId, LawRegistry};
use simulator_metrics::{MetricStore, WindowSummary, LawEffectWindow};
use simulator_snapshot::{load_snapshot, SnapshotError};

use crate::estimate::CausalEstimate;

/// A treatment arm (law enacted) and a control arm (no law) forked from the
/// same snapshot.
///
/// Both arms have identical state at `fork_tick` and diverge only because the
/// treatment arm has the law in its `LawRegistry`.
pub struct CounterfactualPair {
    /// The sim with the law enacted (treatment).
    pub treatment: Sim,
    /// The sim without the law (control / counterfactual).
    pub control:   Sim,
    /// Tick at which the two arms diverged.
    pub fork_tick: u64,
    /// ID of the law in the treatment arm.
    pub law_id:    Option<LawId>,
}

impl CounterfactualPair {
    /// Create a pair from a saved snapshot blob.
    ///
    /// `register_fn` is called on each newly created `Sim` to add all
    /// necessary systems (phase-1, law dispatcher, metrics, etc.).
    /// This separates the crate from depending on `simulator-systems` directly.
    pub fn from_blob(
        blob: &[u8],
        register_fn: impl Fn(&mut Sim),
    ) -> Result<Self, SnapshotError> {
        let seed = [0u8; 32]; // seed is overwritten by the snapshot's RNG state

        let mut treatment = Sim::new(seed);
        register_fn(&mut treatment);
        let (fork_tick, _) = load_snapshot(&mut treatment.world, blob)?;

        let mut control = Sim::new(seed);
        register_fn(&mut control);
        load_snapshot(&mut control.world, blob)?;

        Ok(Self { treatment, control, fork_tick, law_id: None })
    }

    /// Enact a law in the treatment arm only. Must be called before `step_both`.
    pub fn apply_treatment(&mut self, handle: LawHandle) -> LawId {
        let registry = self.treatment.world.resource::<LawRegistry>().clone();
        let id = registry.enact(handle);
        self.law_id = Some(id);
        id
    }

    /// Advance both arms by `n` ticks.
    pub fn step_both(&mut self, n: u32) {
        for _ in 0..n {
            self.treatment.step();
            self.control.step();
        }
    }

    /// Compute the DiD causal estimate for a window centred on `enacted_tick`.
    pub fn compute_did(&self, enacted_tick: u64, window_ticks: u64) -> CausalEstimate {
        let t_store = self.treatment.world.resource::<MetricStore>();
        let c_store = self.control.world.resource::<MetricStore>();

        let lew = LawEffectWindow::from_treatment(t_store, enacted_tick, window_ticks);

        let did_approval     = compute_did_f32(lew.as_ref(), c_store, enacted_tick, window_ticks,
            |s: &WindowSummary| s.mean_approval);
        let did_gdp          = compute_did_f64(lew.as_ref(), c_store, enacted_tick, window_ticks,
            |s: &WindowSummary| s.mean_gdp);
        let did_pollution    = compute_did_f64(lew.as_ref(), c_store, enacted_tick, window_ticks,
            |s: &WindowSummary| s.mean_pollution);
        let did_unemployment = compute_did_f32(lew.as_ref(), c_store, enacted_tick, window_ticks,
            |s: &WindowSummary| s.mean_unemployment);
        let did_legitimacy   = compute_did_f32(lew.as_ref(), c_store, enacted_tick, window_ticks,
            |s: &WindowSummary| s.mean_legitimacy);
        let did_treasury     = compute_did_f64(lew.as_ref(), c_store, enacted_tick, window_ticks,
            |s: &WindowSummary| s.mean_treasury);

        let treatment_post_approval = lew.as_ref()
            .map(|l| l.treatment_post.mean_approval).unwrap_or(0.0);
        let treatment_post_gdp = lew.as_ref()
            .map(|l| l.treatment_post.mean_gdp).unwrap_or(0.0);

        CausalEstimate {
            enacted_tick,
            window_ticks,
            did_approval,
            did_gdp,
            did_pollution,
            did_unemployment,
            did_legitimacy,
            did_treasury,
            treatment_post_approval,
            treatment_post_gdp,
        }
    }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

fn control_pre_post(
    c_store: &MetricStore,
    enacted_tick: u64,
    window_ticks: u64,
) -> Option<(WindowSummary, WindowSummary)> {
    let pre_from  = enacted_tick.checked_sub(window_ticks)?;
    let post_to   = enacted_tick + window_ticks - 1;
    let pre       = WindowSummary::from_store(c_store, pre_from, enacted_tick - 1)?;
    let post      = WindowSummary::from_store(c_store, enacted_tick, post_to)?;
    Some((pre, post))
}

fn compute_did_f32(
    lew:          Option<&LawEffectWindow>,
    c_store:      &MetricStore,
    enacted_tick: u64,
    window_ticks: u64,
    field:        impl Fn(&WindowSummary) -> f32,
) -> Option<f32> {
    let lew   = lew?;
    let (cp, cpost) = control_pre_post(c_store, enacted_tick, window_ticks)?;
    let t_delta = field(&lew.treatment_post) - field(&lew.treatment_pre);
    let c_delta = field(&cpost) - field(&cp);
    Some(t_delta - c_delta)
}

fn compute_did_f64(
    lew:          Option<&LawEffectWindow>,
    c_store:      &MetricStore,
    enacted_tick: u64,
    window_ticks: u64,
    field:        impl Fn(&WindowSummary) -> f64,
) -> Option<f64> {
    let lew   = lew?;
    let (cp, cpost) = control_pre_post(c_store, enacted_tick, window_ticks)?;
    let t_delta = field(&lew.treatment_post) - field(&lew.treatment_pre);
    let c_delta = field(&cpost) - field(&cp);
    Some(t_delta - c_delta)
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::{Sim, PollutionStock};
    use simulator_law::{
        register_law_dispatcher, register_crisis_link_system, register_legitimacy_system,
        registry::{LawEffect, LawHandle},
        Cadence, LawId,
    };
    use simulator_metrics::register_metrics_system;
    use simulator_scenario::{Scenario, PopulationSpec};
    use simulator_snapshot::save_snapshot;
    use simulator_systems::register_phase1_systems;
    use std::sync::Arc;

    fn register_all(sim: &mut Sim) {
        register_phase1_systems(sim);
        register_law_dispatcher(sim);
        register_crisis_link_system(sim);
        register_legitimacy_system(sim);
        register_metrics_system(sim);
    }

    /// Minimal scenario: 20 citizens, no corporations.
    fn minimal_scenario() -> Scenario {
        Scenario {
            name:                    "test".into(),
            description:             "".into(),
            seed:                    [7u8; 32],
            ticks:                   100,
            population:              PopulationSpec { citizens: 20, regions: 2, ..Default::default() },
            initial_rights:          None,
            initial_pollution:       Some(2.0),
            initial_legitimacy_debt: None,
            crisis_prob_pct:         Some(0),
            polity:                  None,
            state_capacity:          None,
            judiciary:               None,
            initial_rights_catalog:  None,
        }
    }

    /// Stub DSL program — compiles trivially.
    fn stub_prog() -> simulator_law::dsl::ast::Program {
        use simulator_law::dsl::parser::parse_program;
        parse_program("scope Env() { }").unwrap()
    }

    #[test]
    fn pair_forks_and_steps_both_arms() {
        let scenario = minimal_scenario();
        let mut base = Sim::new(scenario.seed);
        register_all(&mut base);
        scenario.spawn_population(&mut base);

        // Run to tick 30 to build pre-period metrics.
        for _ in 0..30 { base.step(); }

        let blob = save_snapshot(&mut base.world).expect("save failed");

        let mut pair = CounterfactualPair::from_blob(&blob, register_all)
            .expect("fork failed");

        pair.apply_treatment(LawHandle {
            source: None,
            id:                   LawId(0),
            version:              1,
            program:              Arc::new(stub_prog()),
            cadence:              Cadence::Monthly,
            effective_from_tick:  30,
            effective_until_tick: None,
            effect: LawEffect::Abatement { pollution_reduction_pu: 0.5, cost_per_pu: 100.0 },
        });

        // Step both 30 ticks forward.
        pair.step_both(30);

        // Both arms should be at tick 60.
        assert_eq!(pair.treatment.tick(), 60, "treatment tick");
        assert_eq!(pair.control.tick(),   60, "control tick");
    }

    #[test]
    fn abatement_treatment_reduces_pollution_vs_control() {
        let scenario = minimal_scenario();
        let mut base = Sim::new(scenario.seed);
        register_all(&mut base);
        scenario.spawn_population(&mut base);

        // Set non-trivial pollution stock.
        base.world.resource_mut::<PollutionStock>().stock = 3.0;

        for _ in 0..30 { base.step(); } // build pre-period

        let blob = save_snapshot(&mut base.world).expect("save");
        let mut pair = CounterfactualPair::from_blob(&blob, register_all).expect("fork");

        pair.apply_treatment(LawHandle {
            source: None,
            id:                   LawId(0),
            version:              1,
            program:              Arc::new(stub_prog()),
            cadence:              Cadence::Monthly,
            effective_from_tick:  30,
            effective_until_tick: None,
            effect: LawEffect::Abatement { pollution_reduction_pu: 1.0, cost_per_pu: 50.0 },
        });
        pair.step_both(60);

        let t_pollution = pair.treatment.world.resource::<PollutionStock>().stock;
        let c_pollution = pair.control.world.resource::<PollutionStock>().stock;

        assert!(
            t_pollution < c_pollution,
            "treatment pollution {t_pollution:.3} should be < control {c_pollution:.3}"
        );
    }

    #[test]
    fn compute_did_returns_negative_pollution_delta_for_abatement() {
        let scenario = minimal_scenario();
        let mut base = Sim::new(scenario.seed);
        register_all(&mut base);
        scenario.spawn_population(&mut base);
        base.world.resource_mut::<PollutionStock>().stock = 3.0;

        for _ in 0..30 { base.step(); }

        let blob = save_snapshot(&mut base.world).expect("save");
        let mut pair = CounterfactualPair::from_blob(&blob, register_all).expect("fork");

        pair.apply_treatment(LawHandle {
            source: None,
            id:                   LawId(0),
            version:              1,
            program:              Arc::new(stub_prog()),
            cadence:              Cadence::Monthly,
            effective_from_tick:  30,
            effective_until_tick: None,
            effect: LawEffect::Abatement { pollution_reduction_pu: 1.0, cost_per_pu: 50.0 },
        });
        pair.step_both(60);

        let est = pair.compute_did(30, 30);
        // The abatement law should produce a negative DiD for pollution.
        if let Some(did_poll) = est.did_pollution {
            assert!(did_poll < 0.0,
                "expected negative pollution DiD, got {did_poll:.4}");
        }
        // Summary should be non-empty string.
        assert!(!est.summary().is_empty());
    }
}
