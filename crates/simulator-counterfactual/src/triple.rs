//! Three-arm counterfactual: two treatments compared against a shared control.
//!
//! Where [`crate::pair::CounterfactualPair`] answers "did this law work?",
//! `CounterfactualTriple` answers "which of these two laws works better?".
//!
//! All three arms fork from the same snapshot blob and run independently;
//! treatment_a and treatment_b each enact a different law, while control
//! runs unchanged. Pairwise DiD is computed against the shared control,
//! which makes the two treatment estimates directly comparable (they share
//! the same counterfactual baseline).

use serde::{Deserialize, Serialize};
use simulator_core::Sim;
use simulator_law::{LawHandle, LawId, LawRegistry};
use simulator_metrics::MetricStore;
use simulator_snapshot::{load_snapshot, SnapshotError};

use crate::estimate::CausalEstimate;
use crate::pair::compute_did_from_stores;

/// Three forked sims sharing a fork tick: two treatments + one shared control.
pub struct CounterfactualTriple {
    pub treatment_a: Sim,
    pub treatment_b: Sim,
    pub control:     Sim,
    pub fork_tick:   u64,
    pub law_a_id:    Option<LawId>,
    pub law_b_id:    Option<LawId>,
}

impl CounterfactualTriple {
    /// Fork three sims from the same snapshot blob.
    pub fn from_blob(
        blob: &[u8],
        register_fn: impl Fn(&mut Sim),
    ) -> Result<Self, SnapshotError> {
        let seed = [0u8; 32]; // overwritten by snapshot's RNG state

        let mut treatment_a = Sim::new(seed);
        register_fn(&mut treatment_a);
        let (fork_tick, _) = load_snapshot(&mut treatment_a.world, blob)?;

        let mut treatment_b = Sim::new(seed);
        register_fn(&mut treatment_b);
        load_snapshot(&mut treatment_b.world, blob)?;

        let mut control = Sim::new(seed);
        register_fn(&mut control);
        load_snapshot(&mut control.world, blob)?;

        Ok(Self {
            treatment_a, treatment_b, control,
            fork_tick,
            law_a_id: None,
            law_b_id: None,
        })
    }

    /// Enact `handle` in treatment_a only.
    pub fn apply_treatment_a(&mut self, handle: LawHandle) -> LawId {
        let registry = self.treatment_a.world.resource::<LawRegistry>().clone();
        let id = registry.enact(handle);
        self.law_a_id = Some(id);
        id
    }

    /// Enact `handle` in treatment_b only.
    pub fn apply_treatment_b(&mut self, handle: LawHandle) -> LawId {
        let registry = self.treatment_b.world.resource::<LawRegistry>().clone();
        let id = registry.enact(handle);
        self.law_b_id = Some(id);
        id
    }

    /// Advance all three arms by `n` ticks.
    pub fn step_all(&mut self, n: u32) {
        for _ in 0..n {
            self.treatment_a.step();
            self.treatment_b.step();
            self.control.step();
        }
    }

    /// Compute both DiD estimates against the shared control.
    pub fn compute_comparative(
        &self,
        enacted_tick: u64,
        window_ticks: u64,
    ) -> ComparativeEstimate {
        let c_store  = self.control.world.resource::<MetricStore>();
        let a_store  = self.treatment_a.world.resource::<MetricStore>();
        let b_store  = self.treatment_b.world.resource::<MetricStore>();

        let did_a = compute_did_from_stores(a_store, c_store, enacted_tick, window_ticks);
        let did_b = compute_did_from_stores(b_store, c_store, enacted_tick, window_ticks);

        ComparativeEstimate { law_a: did_a, law_b: did_b }
    }
}

/// Pair of `CausalEstimate`s sharing the same control window.
///
/// `law_a` and `law_b` are independent DiD estimates, each computed against
/// the shared control arm. Their pairwise difference is the causal contrast
/// "law A vs law B" — positive `law_a.did_approval − law_b.did_approval`
/// means law A lifted approval more than law B did, controlling for the
/// counterfactual no-law trajectory.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComparativeEstimate {
    pub law_a: CausalEstimate,
    pub law_b: CausalEstimate,
}

impl ComparativeEstimate {
    /// Net approval contrast (A − B). `None` if either side missing.
    pub fn net_approval(&self) -> Option<f32> {
        Some(self.law_a.did_approval? - self.law_b.did_approval?)
    }

    /// Net GDP contrast (A − B).
    pub fn net_gdp(&self) -> Option<f64> {
        Some(self.law_a.did_gdp? - self.law_b.did_gdp?)
    }

    /// Net pollution contrast (A − B). Negative = A reduced pollution more.
    pub fn net_pollution(&self) -> Option<f64> {
        Some(self.law_a.did_pollution? - self.law_b.did_pollution?)
    }
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

    fn stub_prog() -> simulator_law::dsl::ast::Program {
        simulator_law::dsl::parser::parse_program("scope Env() { }").unwrap()
    }

    fn minimal_scenario() -> Scenario {
        Scenario {
            name: "triple_test".into(),
            description: String::new(),
            seed: [11u8; 32],
            ticks: 100,
            population: PopulationSpec { citizens: 15, regions: 2, ..Default::default() },
            initial_rights: None,
            initial_pollution: Some(2.0),
            initial_legitimacy_debt: None,
            crisis_prob_pct: Some(0),
            polity: None,
            state_capacity: None,
            judiciary: None,
            initial_rights_catalog: None,
        }
    }

    fn make_handle(reduction_pu: f64) -> LawHandle {
        LawHandle {
            source: None,
            id:                   LawId(0),
            version:              1,
            program:              Arc::new(stub_prog()),
            cadence:              Cadence::Monthly,
            effective_from_tick:  30,
            effective_until_tick: None,
            effect: LawEffect::Abatement {
                pollution_reduction_pu: reduction_pu,
                cost_per_pu: 50.0,
            },
        }
    }

    /// Three arms diverge: A reduces pollution faster than B, both faster
    /// than control. All three are at the same tick after `step_all`.
    #[test]
    fn triple_forks_three_arms_at_same_tick() {
        let scenario = minimal_scenario();
        let mut base = Sim::new(scenario.seed);
        register_all(&mut base);
        scenario.spawn_population(&mut base);
        base.world.resource_mut::<PollutionStock>().stock = 3.0;

        for _ in 0..30 { base.step(); }

        let blob = save_snapshot(&mut base.world).expect("save");
        let mut triple = CounterfactualTriple::from_blob(&blob, register_all)
            .expect("triple fork");

        triple.apply_treatment_a(make_handle(1.0));   // strong abatement
        triple.apply_treatment_b(make_handle(0.25));  // weak abatement
        triple.step_all(60);

        assert_eq!(triple.treatment_a.tick(), 90, "treatment_a tick");
        assert_eq!(triple.treatment_b.tick(), 90, "treatment_b tick");
        assert_eq!(triple.control.tick(),     90, "control tick");

        let a_poll = triple.treatment_a.world.resource::<PollutionStock>().stock;
        let b_poll = triple.treatment_b.world.resource::<PollutionStock>().stock;
        let c_poll = triple.control.world.resource::<PollutionStock>().stock;

        // Strong abatement (A) → less pollution than weak (B) → less than control.
        assert!(a_poll <= b_poll, "A pollution {a_poll:.3} should be ≤ B {b_poll:.3}");
        assert!(b_poll <= c_poll, "B pollution {b_poll:.3} should be ≤ control {c_poll:.3}");
    }

    /// Comparative DiD: stronger abatement should produce more-negative pollution
    /// DiD than weaker abatement; the net (A − B) on pollution should be ≤ 0.
    #[test]
    fn comparative_did_net_pollution_favours_stronger_abatement() {
        let scenario = minimal_scenario();
        let mut base = Sim::new(scenario.seed);
        register_all(&mut base);
        scenario.spawn_population(&mut base);
        base.world.resource_mut::<PollutionStock>().stock = 3.0;

        for _ in 0..30 { base.step(); }

        let blob = save_snapshot(&mut base.world).expect("save");
        let mut triple = CounterfactualTriple::from_blob(&blob, register_all)
            .expect("triple fork");

        triple.apply_treatment_a(make_handle(1.0));   // strong
        triple.apply_treatment_b(make_handle(0.25));  // weak
        triple.step_all(60);

        let cmp = triple.compute_comparative(30, 30);

        // Both should produce negative pollution DiD (both abatement laws).
        if let (Some(da), Some(db)) = (cmp.law_a.did_pollution, cmp.law_b.did_pollution) {
            assert!(da <= 0.0, "law A DiD pollution should be ≤ 0, got {da:.4}");
            assert!(db <= 0.0, "law B DiD pollution should be ≤ 0, got {db:.4}");
        }

        // Net (A − B): A is stronger, so A's pollution drop is greater (more negative)
        // → A − B should be ≤ 0.
        if let Some(net) = cmp.net_pollution() {
            assert!(net <= 0.0,
                "net pollution (A − B) should be ≤ 0 since A is stronger abatement, got {net:.4}");
        }
    }

    #[test]
    fn comparative_estimate_net_helpers_propagate_none() {
        let cmp = ComparativeEstimate {
            law_a: CausalEstimate {
                enacted_tick: 0, window_ticks: 30,
                did_approval: None, did_gdp: Some(100.0), did_pollution: None,
                did_unemployment: None, did_legitimacy: None, did_treasury: None,
                did_income: None, did_wealth: None, did_health: None,
                did_approval_by_quintile: [None; 5],
                treatment_post_approval: 0.0, treatment_post_gdp: 0.0,
            },
            law_b: CausalEstimate {
                enacted_tick: 0, window_ticks: 30,
                did_approval: Some(0.05), did_gdp: Some(50.0), did_pollution: None,
                did_unemployment: None, did_legitimacy: None, did_treasury: None,
                did_income: None, did_wealth: None, did_health: None,
                did_approval_by_quintile: [None; 5],
                treatment_post_approval: 0.0, treatment_post_gdp: 0.0,
            },
        };
        assert_eq!(cmp.net_approval(), None, "None on either side propagates");
        assert_eq!(cmp.net_gdp(),      Some(50.0), "Some-Some computes A-B");
        assert_eq!(cmp.net_pollution(), None);
    }
}
