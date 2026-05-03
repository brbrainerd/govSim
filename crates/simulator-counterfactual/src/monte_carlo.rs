use simulator_core::{Sim, SimRng};
use simulator_law::LawHandle;

use crate::{
    estimate::CausalEstimate,
    pair::CounterfactualPair,
    triple::{ComparativeEstimate, CounterfactualTriple},
};

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

    /// Three-arm Monte Carlo: two laws compared against a shared no-law
    /// control, repeated `n_runs` times with varied post-fork RNG seeds.
    /// Each run produces a `ComparativeEstimate` (`{ law_a, law_b }`); the
    /// caller aggregates via `ComparativeSummary::from_estimates`.
    pub fn run_comparative(
        &self,
        blob:           &[u8],
        enacted_tick:   u64,
        law_a_template: LawHandle,
        law_b_template: LawHandle,
        register_fn:    impl Fn(&mut Sim) + Clone,
    ) -> Vec<ComparativeEstimate> {
        let mut estimates = Vec::with_capacity(self.n_runs as usize);

        for run_idx in 0..self.n_runs {
            let mut triple = match CounterfactualTriple::from_blob(blob, register_fn.clone()) {
                Ok(t) => t,
                Err(e) => {
                    tracing::warn!("monte_carlo run_comparative {run_idx}: fork failed: {e}");
                    continue;
                }
            };

            perturb_rng(&mut triple.treatment_a, run_idx);
            perturb_rng(&mut triple.treatment_b, run_idx);
            perturb_rng(&mut triple.control,     run_idx);

            triple.apply_treatment_a(law_a_template.clone());
            triple.apply_treatment_b(law_b_template.clone());
            triple.step_all(self.window_ticks as u32);

            estimates.push(triple.compute_comparative(enacted_tick, self.window_ticks));
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
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
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

    // Mean income DiD — citizen wellbeing (positive = income grew = good)
    pub mean_did_income:          Option<f64>,
    pub std_did_income:           Option<f64>,
    pub p5_did_income:            Option<f64>,
    pub p95_did_income:           Option<f64>,

    // Mean wealth DiD — citizen balance sheet (positive = wealth grew = good)
    pub mean_did_wealth:          Option<f64>,
    pub std_did_wealth:           Option<f64>,
    pub p5_did_wealth:            Option<f64>,
    pub p95_did_wealth:           Option<f64>,

    // Mean health DiD — citizen health [0, 1 pp] (positive = healthier = good)
    pub mean_did_health:          Option<f32>,
    pub std_did_health:           Option<f32>,
    pub p5_did_health:            Option<f32>,
    pub p95_did_health:           Option<f32>,

    /// Approval DiD per income quintile [Q1=poorest, …, Q5=wealthiest].
    /// Mean / P5 / P95 across MC runs. Reveals heterogeneous law effects.
    pub mean_did_approval_by_quintile: [Option<f32>; 5],
    pub p5_did_approval_by_quintile:   [Option<f32>; 5],
    pub p95_did_approval_by_quintile:  [Option<f32>; 5],
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

        let mean_did_income       = mean_f64(estimates.iter().filter_map(|e| e.did_income));
        let std_did_income        = std_f64(estimates.iter().filter_map(|e| e.did_income));
        let p5_did_income         = percentile_f64(estimates.iter().filter_map(|e| e.did_income), 5);
        let p95_did_income        = percentile_f64(estimates.iter().filter_map(|e| e.did_income), 95);

        let mean_did_wealth       = mean_f64(estimates.iter().filter_map(|e| e.did_wealth));
        let std_did_wealth        = std_f64(estimates.iter().filter_map(|e| e.did_wealth));
        let p5_did_wealth         = percentile_f64(estimates.iter().filter_map(|e| e.did_wealth), 5);
        let p95_did_wealth        = percentile_f64(estimates.iter().filter_map(|e| e.did_wealth), 95);

        let mean_did_health       = mean_f32(estimates.iter().filter_map(|e| e.did_health));
        let std_did_health        = std_f32(estimates.iter().filter_map(|e| e.did_health));
        let p5_did_health         = percentile_f32(estimates.iter().filter_map(|e| e.did_health), 5);
        let p95_did_health        = percentile_f32(estimates.iter().filter_map(|e| e.did_health), 95);

        let mut mean_did_approval_by_quintile: [Option<f32>; 5] = [None; 5];
        let mut p5_did_approval_by_quintile:   [Option<f32>; 5] = [None; 5];
        let mut p95_did_approval_by_quintile:  [Option<f32>; 5] = [None; 5];
        for (q, ((mean_slot, p5_slot), p95_slot)) in mean_did_approval_by_quintile.iter_mut()
            .zip(p5_did_approval_by_quintile.iter_mut())
            .zip(p95_did_approval_by_quintile.iter_mut())
            .enumerate()
        {
            *mean_slot = mean_f32(estimates.iter().filter_map(|e| e.did_approval_by_quintile[q]));
            *p5_slot   = percentile_f32(estimates.iter().filter_map(|e| e.did_approval_by_quintile[q]), 5);
            *p95_slot  = percentile_f32(estimates.iter().filter_map(|e| e.did_approval_by_quintile[q]), 95);
        }

        Self {
            n_runs,
            mean_did_approval, std_did_approval, p5_did_approval, p95_did_approval,
            mean_did_gdp, std_did_gdp, p5_did_gdp, p95_did_gdp,
            mean_did_pollution, std_did_pollution, p5_did_pollution, p95_did_pollution,
            mean_did_unemployment, std_did_unemployment, p5_did_unemployment, p95_did_unemployment,
            mean_did_legitimacy, std_did_legitimacy, p5_did_legitimacy, p95_did_legitimacy,
            mean_did_treasury, std_did_treasury, p5_did_treasury, p95_did_treasury,
            mean_did_income,  std_did_income,  p5_did_income,  p95_did_income,
            mean_did_wealth,  std_did_wealth,  p5_did_wealth,  p95_did_wealth,
            mean_did_health,  std_did_health,  p5_did_health,  p95_did_health,
            mean_did_approval_by_quintile,
            p5_did_approval_by_quintile,
            p95_did_approval_by_quintile,
        }
    }
}

/// Distributional summary of `Vec<ComparativeEstimate>` from
/// `run_comparative`. Reports mean/std/p5/p95 of the pairwise net contrasts
/// (A − B) plus the per-arm `MonteCarloSummary` for each treatment.
///
/// `net_approval > 0` means law A produced a stronger approval lift than law B
/// (averaged across MC runs); the CI half-width signals whether the contrast
/// is reliable or noise.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ComparativeSummary {
    pub n_runs: usize,

    pub mean_net_approval:  Option<f32>,
    pub std_net_approval:   Option<f32>,
    pub p5_net_approval:    Option<f32>,
    pub p95_net_approval:   Option<f32>,

    pub mean_net_gdp:       Option<f64>,
    pub std_net_gdp:        Option<f64>,
    pub p5_net_gdp:         Option<f64>,
    pub p95_net_gdp:        Option<f64>,

    pub mean_net_pollution:    Option<f64>,
    pub std_net_pollution:     Option<f64>,
    pub p5_net_pollution:      Option<f64>,
    pub p95_net_pollution:     Option<f64>,

    pub mean_net_unemployment: Option<f32>,
    pub std_net_unemployment:  Option<f32>,
    pub p5_net_unemployment:   Option<f32>,
    pub p95_net_unemployment:  Option<f32>,

    pub mean_net_legitimacy:   Option<f32>,
    pub std_net_legitimacy:    Option<f32>,
    pub p5_net_legitimacy:     Option<f32>,
    pub p95_net_legitimacy:    Option<f32>,

    pub mean_net_treasury:     Option<f64>,
    pub std_net_treasury:      Option<f64>,
    pub p5_net_treasury:       Option<f64>,
    pub p95_net_treasury:      Option<f64>,

    pub mean_net_income:       Option<f64>,
    pub std_net_income:        Option<f64>,
    pub p5_net_income:         Option<f64>,
    pub p95_net_income:        Option<f64>,

    pub mean_net_wealth:       Option<f64>,
    pub std_net_wealth:        Option<f64>,
    pub p5_net_wealth:         Option<f64>,
    pub p95_net_wealth:        Option<f64>,

    pub mean_net_health:       Option<f32>,
    pub std_net_health:        Option<f32>,
    pub p5_net_health:         Option<f32>,
    pub p95_net_health:        Option<f32>,

    /// Per-quintile net approval contrast (A − B) across MC runs.
    /// Index 0 = bottom quintile. `None` entries when fewer than 2 runs had data.
    pub mean_net_approval_by_quintile: [Option<f32>; 5],
    pub p5_net_approval_by_quintile:   [Option<f32>; 5],
    pub p95_net_approval_by_quintile:  [Option<f32>; 5],

    /// Full per-arm summary for law A (DiD vs control across MC runs).
    pub law_a: MonteCarloSummary,
    /// Full per-arm summary for law B (DiD vs control across MC runs).
    pub law_b: MonteCarloSummary,
}

impl ComparativeSummary {
    pub fn from_estimates(estimates: &[ComparativeEstimate]) -> Self {
        let n_runs = estimates.len();

        let nets_approval:      Vec<f32> = estimates.iter().filter_map(|e| e.net_approval()).collect();
        let nets_gdp:           Vec<f64> = estimates.iter().filter_map(|e| e.net_gdp()).collect();
        let nets_pollution:     Vec<f64> = estimates.iter().filter_map(|e| e.net_pollution()).collect();
        let nets_unemployment:  Vec<f32> = estimates.iter().filter_map(|e| e.net_unemployment()).collect();
        let nets_legitimacy:    Vec<f32> = estimates.iter().filter_map(|e| e.net_legitimacy()).collect();
        let nets_treasury:      Vec<f64> = estimates.iter().filter_map(|e| e.net_treasury()).collect();
        let nets_income:        Vec<f64> = estimates.iter().filter_map(|e| e.net_income()).collect();
        let nets_wealth:        Vec<f64> = estimates.iter().filter_map(|e| e.net_wealth()).collect();
        let nets_health:        Vec<f32> = estimates.iter().filter_map(|e| e.net_health()).collect();

        let mean_net_approval      = mean_f32(nets_approval.iter().copied());
        let std_net_approval       = std_f32(nets_approval.iter().copied());
        let p5_net_approval        = percentile_f32(nets_approval.iter().copied(), 5);
        let p95_net_approval       = percentile_f32(nets_approval.iter().copied(), 95);

        let mean_net_gdp           = mean_f64(nets_gdp.iter().copied());
        let std_net_gdp            = std_f64(nets_gdp.iter().copied());
        let p5_net_gdp             = percentile_f64(nets_gdp.iter().copied(), 5);
        let p95_net_gdp            = percentile_f64(nets_gdp.iter().copied(), 95);

        let mean_net_pollution     = mean_f64(nets_pollution.iter().copied());
        let std_net_pollution      = std_f64(nets_pollution.iter().copied());
        let p5_net_pollution       = percentile_f64(nets_pollution.iter().copied(), 5);
        let p95_net_pollution      = percentile_f64(nets_pollution.iter().copied(), 95);

        let mean_net_unemployment  = mean_f32(nets_unemployment.iter().copied());
        let std_net_unemployment   = std_f32(nets_unemployment.iter().copied());
        let p5_net_unemployment    = percentile_f32(nets_unemployment.iter().copied(), 5);
        let p95_net_unemployment   = percentile_f32(nets_unemployment.iter().copied(), 95);

        let mean_net_legitimacy    = mean_f32(nets_legitimacy.iter().copied());
        let std_net_legitimacy     = std_f32(nets_legitimacy.iter().copied());
        let p5_net_legitimacy      = percentile_f32(nets_legitimacy.iter().copied(), 5);
        let p95_net_legitimacy     = percentile_f32(nets_legitimacy.iter().copied(), 95);

        let mean_net_treasury      = mean_f64(nets_treasury.iter().copied());
        let std_net_treasury       = std_f64(nets_treasury.iter().copied());
        let p5_net_treasury        = percentile_f64(nets_treasury.iter().copied(), 5);
        let p95_net_treasury       = percentile_f64(nets_treasury.iter().copied(), 95);

        let mean_net_income        = mean_f64(nets_income.iter().copied());
        let std_net_income         = std_f64(nets_income.iter().copied());
        let p5_net_income          = percentile_f64(nets_income.iter().copied(), 5);
        let p95_net_income         = percentile_f64(nets_income.iter().copied(), 95);

        let mean_net_wealth        = mean_f64(nets_wealth.iter().copied());
        let std_net_wealth         = std_f64(nets_wealth.iter().copied());
        let p5_net_wealth          = percentile_f64(nets_wealth.iter().copied(), 5);
        let p95_net_wealth         = percentile_f64(nets_wealth.iter().copied(), 95);

        let mean_net_health        = mean_f32(nets_health.iter().copied());
        let std_net_health         = std_f32(nets_health.iter().copied());
        let p5_net_health          = percentile_f32(nets_health.iter().copied(), 5);
        let p95_net_health         = percentile_f32(nets_health.iter().copied(), 95);

        // Per-quintile net approval: for each quintile collect net values across runs.
        let mut mean_net_approval_by_quintile = [None; 5];
        let mut p5_net_approval_by_quintile   = [None; 5];
        let mut p95_net_approval_by_quintile  = [None; 5];
        for q in 0..5 {
            let nets_q: Vec<f32> = estimates
                .iter()
                .filter_map(|e| e.net_approval_by_quintile()[q])
                .collect();
            mean_net_approval_by_quintile[q] = mean_f32(nets_q.iter().copied());
            p5_net_approval_by_quintile[q]   = percentile_f32(nets_q.iter().copied(), 5);
            p95_net_approval_by_quintile[q]  = percentile_f32(nets_q.iter().copied(), 95);
        }

        let law_a_estimates: Vec<CausalEstimate> = estimates.iter().map(|e| e.law_a.clone()).collect();
        let law_b_estimates: Vec<CausalEstimate> = estimates.iter().map(|e| e.law_b.clone()).collect();

        Self {
            n_runs,
            mean_net_approval, std_net_approval, p5_net_approval, p95_net_approval,
            mean_net_gdp, std_net_gdp, p5_net_gdp, p95_net_gdp,
            mean_net_pollution, std_net_pollution, p5_net_pollution, p95_net_pollution,
            mean_net_unemployment, std_net_unemployment, p5_net_unemployment, p95_net_unemployment,
            mean_net_legitimacy, std_net_legitimacy, p5_net_legitimacy, p95_net_legitimacy,
            mean_net_treasury, std_net_treasury, p5_net_treasury, p95_net_treasury,
            mean_net_income, std_net_income, p5_net_income, p95_net_income,
            mean_net_wealth, std_net_wealth, p5_net_wealth, p95_net_wealth,
            mean_net_health, std_net_health, p5_net_health, p95_net_health,
            mean_net_approval_by_quintile,
            p5_net_approval_by_quintile,
            p95_net_approval_by_quintile,
            law_a: MonteCarloSummary::from_estimates(&law_a_estimates),
            law_b: MonteCarloSummary::from_estimates(&law_b_estimates),
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
            judiciary: None,
            initial_rights_catalog: None,
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
            did_income:              None,
            did_wealth:              None,
            did_health:              None,
            did_approval_by_quintile: [None; 5],
            treatment_post_approval: 0.5,
            treatment_post_gdp:      0.0,
        }).collect();

        let summary = MonteCarloSummary::from_estimates(&estimates);
        let p5  = summary.p5_did_approval.unwrap();
        let p95 = summary.p95_did_approval.unwrap();
        assert!(p5 <= p95, "p5={p5:.4} should be ≤ p95={p95:.4}");
    }

    /// `ComparativeSummary::from_estimates` aggregates net contrasts across
    /// MC runs. Verify mean computation, P5 ≤ P95 ordering, and that the
    /// per-arm summaries are populated.
    #[test]
    fn comparative_summary_aggregates_net_contrasts() {
        use crate::triple::ComparativeEstimate;

        // Construct 5 estimates where law A is consistently better than B
        // on approval (net = +0.05 each run) and worse on pollution (net = +0.1).
        let estimates: Vec<ComparativeEstimate> = (0..5).map(|i| ComparativeEstimate {
            law_a: CausalEstimate {
                enacted_tick: 0, window_ticks: 30,
                did_approval: Some(0.10 + i as f32 * 0.001),
                did_gdp: Some(1000.0), did_pollution: Some(0.5),
                did_unemployment: None, did_legitimacy: None, did_treasury: None,
                did_income: None, did_wealth: None, did_health: None,
                did_approval_by_quintile: [None; 5],
                treatment_post_approval: 0.0, treatment_post_gdp: 0.0,
            },
            law_b: CausalEstimate {
                enacted_tick: 0, window_ticks: 30,
                did_approval: Some(0.05 + i as f32 * 0.001),
                did_gdp: Some(800.0), did_pollution: Some(0.4),
                did_unemployment: None, did_legitimacy: None, did_treasury: None,
                did_income: None, did_wealth: None, did_health: None,
                did_approval_by_quintile: [None; 5],
                treatment_post_approval: 0.0, treatment_post_gdp: 0.0,
            },
        }).collect();

        let s = ComparativeSummary::from_estimates(&estimates);
        assert_eq!(s.n_runs, 5);

        // Mean net approval should be ~0.05 (A consistently 0.05 ahead of B).
        let mean = s.mean_net_approval.expect("mean_net_approval");
        assert!((mean - 0.05).abs() < 1e-3,
            "mean_net_approval should be ≈0.05, got {mean:.4}");

        // P5 ≤ mean ≤ P95.
        let p5  = s.p5_net_approval.unwrap();
        let p95 = s.p95_net_approval.unwrap();
        assert!(p5 <= mean && mean <= p95, "p5={p5:.4} ≤ mean={mean:.4} ≤ p95={p95:.4}");

        // Mean net GDP should be 200.0 (A consistently 1000, B consistently 800).
        let mean_gdp = s.mean_net_gdp.unwrap();
        assert!((mean_gdp - 200.0).abs() < 1e-3,
            "mean_net_gdp should be ≈200, got {mean_gdp:.4}");

        // Per-arm summaries should be populated with all 5 runs each.
        assert_eq!(s.law_a.n_runs, 5, "law_a per-arm summary should have 5 runs");
        assert_eq!(s.law_b.n_runs, 5, "law_b per-arm summary should have 5 runs");
    }

    /// `ComparativeSummary` must aggregate `mean/p5/p95_net_approval_by_quintile`
    /// from `net_approval_by_quintile()` across runs. Verify the computed values
    /// are plausible and that P5 ≤ mean ≤ P95 holds per quintile.
    #[test]
    fn comparative_summary_aggregates_quintile_ci_bands() {
        use crate::triple::ComparativeEstimate;

        // 10 runs: quintile[q] net = (q+1) * 0.01 per run (constant, so mean=p5=p95)
        // Law A approval_by_quintile[q] = 0.10 + (q+1)*0.01
        // Law B approval_by_quintile[q] = 0.05
        // → net[q] = 0.05 + (q+1)*0.01  (≈ 0.06 … 0.10)
        let estimates: Vec<ComparativeEstimate> = (0..10).map(|_| {
            let a_q: [Option<f32>; 5] = std::array::from_fn(|q| Some(0.10 + (q + 1) as f32 * 0.01));
            let b_q: [Option<f32>; 5] = [Some(0.05); 5];
            ComparativeEstimate {
                law_a: CausalEstimate {
                    enacted_tick: 0, window_ticks: 30,
                    did_approval: Some(0.10), did_gdp: Some(1000.0),
                    did_pollution: None, did_unemployment: None, did_legitimacy: None,
                    did_treasury: None, did_income: None, did_wealth: None, did_health: None,
                    did_approval_by_quintile: a_q,
                    treatment_post_approval: 0.0, treatment_post_gdp: 0.0,
                },
                law_b: CausalEstimate {
                    enacted_tick: 0, window_ticks: 30,
                    did_approval: Some(0.05), did_gdp: Some(800.0),
                    did_pollution: None, did_unemployment: None, did_legitimacy: None,
                    did_treasury: None, did_income: None, did_wealth: None, did_health: None,
                    did_approval_by_quintile: b_q,
                    treatment_post_approval: 0.0, treatment_post_gdp: 0.0,
                },
            }
        }).collect();

        let s = ComparativeSummary::from_estimates(&estimates);

        for q in 0..5usize {
            let expected_net = 0.05 + (q + 1) as f32 * 0.01; // 0.06 … 0.10

            let mean = s.mean_net_approval_by_quintile[q]
                .unwrap_or_else(|| panic!("mean_net_approval_by_quintile[{q}] should be Some"));
            let p5   = s.p5_net_approval_by_quintile[q]
                .unwrap_or_else(|| panic!("p5_net_approval_by_quintile[{q}] should be Some"));
            let p95  = s.p95_net_approval_by_quintile[q]
                .unwrap_or_else(|| panic!("p95_net_approval_by_quintile[{q}] should be Some"));

            assert!((mean - expected_net).abs() < 1e-4,
                "q{q}: mean_net ≈ {expected_net:.4}, got {mean:.4}");
            // All 10 runs have the same net value, so P5 ≈ P95 ≈ mean.
            // Use a small tolerance to tolerate f32 sum/division rounding.
            let eps = 1e-5_f32;
            assert!(p5 <= mean + eps && mean <= p95 + eps,
                "q{q}: p5={p5:.6} ≤ mean={mean:.6} ≤ p95={p95:.6} violated (eps={eps})");
        }

        // Quintile ordering: bottom quintile net < top quintile net.
        let q0 = s.mean_net_approval_by_quintile[0].unwrap();
        let q4 = s.mean_net_approval_by_quintile[4].unwrap();
        assert!(q0 < q4,
            "bottom quintile net {q0:.4} should be < top quintile net {q4:.4}");
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
