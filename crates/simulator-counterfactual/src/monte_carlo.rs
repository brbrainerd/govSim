use simulator_core::{Sim, SimRng};
use simulator_law::LawHandle;

use crate::{estimate::CausalEstimate, pair::CounterfactualPair};

/// Runs `n_runs` counterfactual experiments from the same fork point,
/// each with a slightly different post-enactment RNG seed, to produce
/// a distribution of DiD outcomes.
///
/// # Usage
/// ```no_run
/// // 1. Run base sim to fork tick.
/// // 2. Save snapshot.
/// // 3. Run Monte Carlo.
/// // 4. Inspect the distribution of DiD estimates.
/// ```
pub struct MonteCarloRunner {
    /// Number of parallel simulations to run.
    pub n_runs: u32,
    /// How many ticks to step each arm forward.
    pub window_ticks: u64,
}

impl Default for MonteCarloRunner {
    fn default() -> Self {
        Self { n_runs: 20, window_ticks: 30 }
    }
}

impl MonteCarloRunner {
    pub fn new(n_runs: u32, window_ticks: u64) -> Self {
        Self { n_runs, window_ticks }
    }

    /// Run the Monte Carlo experiment.
    ///
    /// Parameters:
    /// - `blob`: snapshot at the fork tick (produced by `save_snapshot`).
    /// - `enacted_tick`: the tick at which the law is enacted (= fork tick).
    /// - `law_template`: a `LawHandle` template; the `id` field is ignored.
    /// - `register_fn`: closure that registers all necessary systems onto a fresh `Sim`.
    ///
    /// Returns a vector of `CausalEstimate`s, one per run.
    pub fn run(
        &self,
        blob: &[u8],
        enacted_tick: u64,
        law_template: LawHandle,
        register_fn: impl Fn(&mut Sim) + Clone,
    ) -> Vec<CausalEstimate> {
        let mut estimates = Vec::with_capacity(self.n_runs as usize);

        for run_idx in 0..self.n_runs {
            // Vary the post-enactment RNG seed for each run.
            let mut pair = match CounterfactualPair::from_blob(blob, register_fn.clone()) {
                Ok(p) => p,
                Err(e) => {
                    tracing::warn!("monte_carlo run {run_idx}: fork failed: {e}");
                    continue;
                }
            };

            // Perturb the RNG state with the run index so each run diverges.
            perturb_rng(&mut pair.treatment, run_idx);
            perturb_rng(&mut pair.control,   run_idx);

            // Enact the law in the treatment arm.
            let handle = law_template.clone();
            pair.apply_treatment(handle);

            // Step both forward.
            pair.step_both(self.window_ticks as u32);

            // Compute the DiD estimate.
            let est = pair.compute_did(enacted_tick, self.window_ticks);
            estimates.push(est);
        }

        estimates
    }
}

/// Shuffle entropy into the sim's RNG so each Monte Carlo run diverges from
/// the same fork point. XOR the run index (spread across all 32 bytes via a
/// Fibonacci-scrambled u64) into the root seed and reinstall the resource.
fn perturb_rng(sim: &mut Sim, idx: u32) {
    let mut seed = sim.world.resource::<SimRng>().root_seed();
    // Spread idx across 8 bytes with a simple multiplicative mix.
    let mix: u64 = (idx as u64).wrapping_mul(0x9e3779b97f4a7c15);
    let mix_bytes = mix.to_le_bytes();
    for (i, b) in mix_bytes.iter().enumerate() {
        seed[i]      ^= b;
        seed[i + 8]  ^= b.rotate_left(3);
        seed[i + 16] ^= b.rotate_left(5);
        seed[i + 24] ^= b.rotate_left(7);
    }
    *sim.world.resource_mut::<SimRng>() = SimRng::new(seed);
}

/// Summary statistics over a collection of DiD estimates.
#[derive(Debug, Clone)]
pub struct MonteCarloSummary {
    pub n_runs: usize,

    // Approval DiD — full distribution
    pub mean_did_approval:        Option<f32>,
    pub std_did_approval:         Option<f32>,
    pub p5_did_approval:          Option<f32>,
    pub p95_did_approval:         Option<f32>,

    // GDP DiD — mean / std / exact percentiles
    pub mean_did_gdp:             Option<f64>,
    pub std_did_gdp:              Option<f64>,
    pub p5_did_gdp:               Option<f64>,
    pub p95_did_gdp:              Option<f64>,

    // Pollution DiD — full distribution
    pub mean_did_pollution:       Option<f64>,
    pub std_did_pollution:        Option<f64>,
    pub p5_did_pollution:         Option<f64>,
    pub p95_did_pollution:        Option<f64>,

    // Unemployment DiD — full distribution
    pub mean_did_unemployment:    Option<f32>,
    pub std_did_unemployment:     Option<f32>,
    pub p5_did_unemployment:      Option<f32>,
    pub p95_did_unemployment:     Option<f32>,

    // Legitimacy debt DiD — full distribution (negative = debt reduced = good)
    pub mean_did_legitimacy:      Option<f32>,
    pub std_did_legitimacy:       Option<f32>,
    pub p5_did_legitimacy:        Option<f32>,
    pub p95_did_legitimacy:       Option<f32>,

    // Treasury DiD — full distribution (positive = balance grew = good)
    pub mean_did_treasury:        Option<f64>,
    pub std_did_treasury:         Option<f64>,
    pub p5_did_treasury:          Option<f64>,
    pub p95_did_treasury:         Option<f64>,
}

impl MonteCarloSummary {
    pub fn from_estimates(estimates: &[CausalEstimate]) -> Self {
        let n_runs = estimates.len();

        let mean_did_approval     = mean_f32(estimates.iter().filter_map(|e| e.did_approval));
        let std_did_approval      = std_f32(estimates.iter().filter_map(|e| e.did_approval));
        let p5_did_approval       = percentile_f32(estimates.iter().filter_map(|e| e.did_approval), 5);
        let p95_did_approval      = percentile_f32(estimates.iter().filter_map(|e| e.did_approval), 95);

        let mean_did_gdp          = mean_f64(estimates.iter().filter_map(|e| e.did_gdp));
        let std_did_gdp           = std_f64(estimates.iter().filter_map(|e| e.did_gdp));
        let p5_did_gdp            = percentile_f64(estimates.iter().filter_map(|e| e.did_gdp), 5);
        let p95_did_gdp           = percentile_f64(estimates.iter().filter_map(|e| e.did_gdp), 95);

        let mean_did_pollution    = mean_f64(estimates.iter().filter_map(|e| e.did_pollution));
        let std_did_pollution     = std_f64(estimates.iter().filter_map(|e| e.did_pollution));
        let p5_did_pollution      = percentile_f64(estimates.iter().filter_map(|e| e.did_pollution), 5);
        let p95_did_pollution     = percentile_f64(estimates.iter().filter_map(|e| e.did_pollution), 95);

        let mean_did_unemployment = mean_f32(estimates.iter().filter_map(|e| e.did_unemployment));
        let std_did_unemployment  = std_f32(estimates.iter().filter_map(|e| e.did_unemployment));
        let p5_did_unemployment   = percentile_f32(estimates.iter().filter_map(|e| e.did_unemployment), 5);
        let p95_did_unemployment  = percentile_f32(estimates.iter().filter_map(|e| e.did_unemployment), 95);

        let mean_did_legitimacy   = mean_f32(estimates.iter().filter_map(|e| e.did_legitimacy));
        let std_did_legitimacy    = std_f32(estimates.iter().filter_map(|e| e.did_legitimacy));
        let p5_did_legitimacy     = percentile_f32(estimates.iter().filter_map(|e| e.did_legitimacy), 5);
        let p95_did_legitimacy    = percentile_f32(estimates.iter().filter_map(|e| e.did_legitimacy), 95);

        let mean_did_treasury     = mean_f64(estimates.iter().filter_map(|e| e.did_treasury));
        let std_did_treasury      = std_f64(estimates.iter().filter_map(|e| e.did_treasury));
        let p5_did_treasury       = percentile_f64(estimates.iter().filter_map(|e| e.did_treasury), 5);
        let p95_did_treasury      = percentile_f64(estimates.iter().filter_map(|e| e.did_treasury), 95);

        Self {
            n_runs,
            mean_did_approval, std_did_approval, p5_did_approval, p95_did_approval,
            mean_did_gdp, std_did_gdp, p5_did_gdp, p95_did_gdp,
            mean_did_pollution, std_did_pollution, p5_did_pollution, p95_did_pollution,
            mean_did_unemployment, std_did_unemployment, p5_did_unemployment, p95_did_unemployment,
            mean_did_legitimacy, std_did_legitimacy, p5_did_legitimacy, p95_did_legitimacy,
            mean_did_treasury, std_did_treasury, p5_did_treasury, p95_did_treasury,
        }
    }
}

// ── Internal statistics helpers ──────────────────────────────────────────────

fn mean_f32(it: impl Iterator<Item = f32>) -> Option<f32> {
    let v: Vec<f32> = it.collect();
    if v.is_empty() { return None; }
    Some(v.iter().sum::<f32>() / v.len() as f32)
}

fn std_f32(it: impl Iterator<Item = f32>) -> Option<f32> {
    let v: Vec<f32> = it.collect();
    if v.len() < 2 { return None; }
    let mean = v.iter().sum::<f32>() / v.len() as f32;
    let var  = v.iter().map(|x| (x - mean).powi(2)).sum::<f32>() / (v.len() - 1) as f32;
    Some(var.sqrt())
}

fn percentile_f32(it: impl Iterator<Item = f32>, pct: usize) -> Option<f32> {
    let mut v: Vec<f32> = it.collect();
    if v.is_empty() { return None; }
    v.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let idx = ((pct as f32 / 100.0) * (v.len() - 1) as f32).round() as usize;
    Some(v[idx.min(v.len() - 1)])
}

fn percentile_f64(it: impl Iterator<Item = f64>, pct: usize) -> Option<f64> {
    let mut v: Vec<f64> = it.collect();
    if v.is_empty() { return None; }
    v.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let idx = ((pct as f64 / 100.0) * (v.len() - 1) as f64).round() as usize;
    Some(v[idx.min(v.len() - 1)])
}

fn mean_f64(it: impl Iterator<Item = f64>) -> Option<f64> {
    let v: Vec<f64> = it.collect();
    if v.is_empty() { return None; }
    Some(v.iter().sum::<f64>() / v.len() as f64)
}

fn std_f64(it: impl Iterator<Item = f64>) -> Option<f64> {
    let v: Vec<f64> = it.collect();
    if v.len() < 2 { return None; }
    let mean = v.iter().sum::<f64>() / v.len() as f64;
    let var  = v.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (v.len() - 1) as f64;
    Some(var.sqrt())
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
            name: "mc_test".into(),
            description: "".into(),
            seed: [9u8; 32],
            ticks: 100,
            population: PopulationSpec { citizens: 15, regions: 2, ..Default::default() },
            initial_rights: None,
            initial_pollution: Some(2.0),
            initial_legitimacy_debt: None,
            crisis_prob_pct: Some(0),
            polity: None,
            state_capacity: None,
        }
    }

    #[test]
    fn monte_carlo_runs_and_produces_estimates() {
        let scenario = minimal_scenario();
        let mut base = Sim::new(scenario.seed);
        register_all(&mut base);
        scenario.spawn_population(&mut base);
        base.world.resource_mut::<PollutionStock>().stock = 2.0;

        for _ in 0..30 { base.step(); }

        let blob = save_snapshot(&mut base.world).expect("save");

        let law = LawHandle {
            source: None,
            id:                   LawId(0),
            version:              1,
            program:              Arc::new(stub_prog()),
            cadence:              Cadence::Monthly,
            effective_from_tick:  30,
            effective_until_tick: None,
            effect: LawEffect::Abatement { pollution_reduction_pu: 0.5, cost_per_pu: 10.0 },
        };

        let runner = MonteCarloRunner::new(5, 30);
        let estimates = runner.run(&blob, 30, law, register_all);

        assert!(!estimates.is_empty(), "should have at least one estimate");

        let summary = MonteCarloSummary::from_estimates(&estimates);
        assert_eq!(summary.n_runs, estimates.len());
        // Pollution DiD should be negative (abatement reduces pollution).
        if let Some(mean_poll) = summary.mean_did_pollution {
            assert!(mean_poll < 0.0, "expected negative mean pollution DiD, got {mean_poll:.4}");
        }
    }

    #[test]
    fn summary_percentiles_ordered() {
        let estimates: Vec<CausalEstimate> = (0..10).map(|i| CausalEstimate {
            enacted_tick:            0,
            window_ticks:            30,
            did_approval:            Some(i as f32 * 0.01),
            did_gdp:                 Some(i as f64 * 1000.0),
            did_pollution:           Some(-(i as f64) * 0.1),
            did_unemployment:        None,
            did_legitimacy:          None,
            did_treasury:            None,
            treatment_post_approval: 0.5,
            treatment_post_gdp:      0.0,
        }).collect();

        let summary = MonteCarloSummary::from_estimates(&estimates);
        let p5  = summary.p5_did_approval.unwrap();
        let p95 = summary.p95_did_approval.unwrap();
        assert!(p5 <= p95, "p5={p5:.4} should be ≤ p95={p95:.4}");
    }

    // ── Statistics helpers unit tests ─────────────────────────────────────────

    #[test]
    fn mean_f32_empty_is_none() {
        assert!(mean_f32(std::iter::empty()).is_none());
    }

    #[test]
    fn mean_f32_single_value() {
        let v = mean_f32(std::iter::once(7.0_f32)).unwrap();
        assert!((v - 7.0).abs() < 1e-6);
    }

    #[test]
    fn mean_f32_known_values() {
        let v = mean_f32([1.0_f32, 2.0, 3.0, 4.0].into_iter()).unwrap();
        assert!((v - 2.5).abs() < 1e-5, "mean of [1,2,3,4] should be 2.5, got {v}");
    }

    #[test]
    fn std_f32_single_element_is_none() {
        // Population std of a single value is undefined → None.
        assert!(std_f32(std::iter::once(5.0_f32)).is_none());
    }

    #[test]
    fn std_f32_constant_values_is_zero() {
        // All identical values → sample std = 0.
        let v = std_f32([5.0_f32, 5.0, 5.0, 5.0].into_iter()).unwrap();
        assert!(v.abs() < 1e-5, "std of constant series should be 0, got {v:.6}");
    }

    #[test]
    fn std_f32_nonzero_for_varying_values() {
        // [0, 10, 20]: mean=10, sample variance = (100+0+100)/2=100, std=10.
        let v = std_f32([0.0_f32, 10.0, 20.0].into_iter()).unwrap();
        assert!((v - 10.0).abs() < 0.01, "std of [0,10,20] should be 10.0, got {v:.4}");
    }

    #[test]
    fn percentile_f32_single_element() {
        let v = percentile_f32(std::iter::once(42.0_f32), 50).unwrap();
        assert!((v - 42.0).abs() < 1e-6);
    }

    #[test]
    fn percentile_f32_empty_is_none() {
        assert!(percentile_f32(std::iter::empty(), 50).is_none());
    }

    #[test]
    fn perturb_rng_changes_seed() {
        use simulator_core::Sim;
        let mut sim = Sim::new([42u8; 32]);
        let seed_before = sim.world.resource::<simulator_core::SimRng>().root_seed();
        perturb_rng(&mut sim, 1);
        let seed_after = sim.world.resource::<simulator_core::SimRng>().root_seed();
        assert_ne!(seed_before, seed_after, "perturb_rng should change the seed");
    }
}
