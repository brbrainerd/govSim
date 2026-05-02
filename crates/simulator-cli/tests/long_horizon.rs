//! Long-horizon calibration regression tests.
//!
//! These tests run baseline scenarios for ~720 ticks (~2 simulated years) and
//! assert that the key equilibrium properties established during manual
//! calibration are preserved:
//!
//! - `modern_democracy` and `australia_2022`: approval never collapses to zero
//!   (regression guard for the Michaelis-Menten pollution-approval fix).
//! - `pre_rights_era`: approval IS allowed to collapse (legitimacy_debt=0.40
//!   deliberately overwhelms all positive forces — this is the scenario intent).
//!   We only assert the value stays in [0.0, 1.0] and treasury is finite.
//! - All scenarios: StateCapacity fields clamped to [0.0, 1.0] when present.
//! - All scenarios: treasury balance is a finite number (no NaN/overflow).
//!
//! These tests run release-quality logic in debug-build test binaries; they're
//! intentionally slow (a few seconds each) and tagged `#[ignore]` by default so
//! `cargo test` stays fast. Run them with:
//!   cargo test --test long_horizon -- --ignored
//! or in CI with `cargo test --test long_horizon -- --ignored --nocapture`.

use std::path::{Path, PathBuf};

use simulator_core::{MacroIndicators, StateCapacity, Treasury};
use simulator_scenario::Scenario;

/// Locate the workspace root by walking up from the crate root.
fn workspace_root() -> PathBuf {
    let mut dir = std::env::current_dir().unwrap();
    // In `cargo test`, cwd is the crate root. Walk up until we find `scenarios/`.
    loop {
        if dir.join("scenarios").is_dir() {
            return dir;
        }
        dir = dir.parent().expect("reached filesystem root without finding scenarios/").to_path_buf();
    }
}

fn scenario_path(name: &str) -> PathBuf {
    workspace_root().join("scenarios").join(format!("{name}.yaml"))
}

struct RunResult {
    approval:   f32,
    treasury_finite: bool,
    capacity_in_range: bool,
}

fn run_scenario_ticks(path: &Path, ticks: u64) -> RunResult {
    let scenario = Scenario::load(path).expect("scenario load");

    let mut sim = simulator_core::Sim::new(scenario.seed);
    simulator_systems::register_phase1_systems(&mut sim);
    simulator_systems::build_influence_graph(
        &mut sim,
        scenario.population.citizens as usize,
        0.0001,
    );
    scenario.spawn_population(&mut sim);
    scenario.configure_world(&mut sim);

    for _ in 0..ticks {
        sim.step();
    }

    let approval = sim.world.resource::<MacroIndicators>().approval;
    let treasury  = sim.world.resource::<Treasury>().balance.to_num::<f64>();
    let treasury_finite = treasury.is_finite();

    let capacity_in_range = sim.world
        .get_resource::<StateCapacity>()
        .map(|sc| {
            let fields = [
                sc.tax_collection_efficiency as f64,
                sc.enforcement_reach as f64,
                sc.legal_predictability as f64,
                sc.bureaucratic_effectiveness as f64,
                sc.enforcement_noise as f64,
            ];
            fields.iter().all(|&f| (0.0..=1.0).contains(&f))
        })
        .unwrap_or(true); // absent resource is vacuously in-range

    RunResult { approval, treasury_finite, capacity_in_range }
}

// ---------------------------------------------------------------------------
// modern_democracy — approval must not collapse to zero
// ---------------------------------------------------------------------------

#[test]
#[ignore]
fn modern_democracy_720_ticks_approval_stable() {
    let r = run_scenario_ticks(&scenario_path("modern_democracy"), 720);
    assert!(r.treasury_finite,
        "modern_democracy: treasury overflowed or went NaN");
    assert!(r.capacity_in_range,
        "modern_democracy: StateCapacity field out of [0,1]");
    assert!(r.approval > 0.10,
        "modern_democracy: approval collapsed to {:.4} (should stay above 0.10)",
        r.approval);
}

// ---------------------------------------------------------------------------
// australia_2022 — approval must not collapse to zero
// ---------------------------------------------------------------------------

#[test]
#[ignore]
fn australia_2022_720_ticks_approval_stable() {
    let r = run_scenario_ticks(&scenario_path("australia_2022"), 720);
    assert!(r.treasury_finite,
        "australia_2022: treasury overflowed or went NaN");
    assert!(r.capacity_in_range,
        "australia_2022: StateCapacity field out of [0,1]");
    assert!(r.approval > 0.10,
        "australia_2022: approval collapsed to {:.4} (should stay above 0.10)",
        r.approval);
}

// ---------------------------------------------------------------------------
// pre_rights_era — approval allowed to collapse (by design), just no NaN
// ---------------------------------------------------------------------------

#[test]
#[ignore]
fn pre_rights_era_720_ticks_no_nan() {
    let r = run_scenario_ticks(&scenario_path("pre_rights_era"), 720);
    assert!(r.treasury_finite,
        "pre_rights_era: treasury overflowed or went NaN");
    assert!(r.capacity_in_range,
        "pre_rights_era: StateCapacity field out of [0,1]");
    // Approval can be very low (legitimacy_debt=0.40 is intentionally overwhelming),
    // but must remain in [0.0, 1.0].
    assert!((0.0..=1.0).contains(&r.approval),
        "pre_rights_era: approval={:.4} out of [0,1]", r.approval);
}
