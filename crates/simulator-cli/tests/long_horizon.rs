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
    /// Final tax_collection_efficiency (None if no StateCapacity resource).
    final_tax_efficiency: Option<f32>,
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

    let (capacity_in_range, final_tax_efficiency) = sim.world
        .get_resource::<StateCapacity>()
        .map(|sc| {
            let fields = [
                sc.tax_collection_efficiency as f64,
                sc.enforcement_reach as f64,
                sc.legal_predictability as f64,
                sc.bureaucratic_effectiveness as f64,
                sc.enforcement_noise as f64,
            ];
            (fields.iter().all(|&f| (0.0..=1.0).contains(&f)),
             Some(sc.tax_collection_efficiency))
        })
        .unwrap_or((true, None)); // absent resource is vacuously in-range

    RunResult { approval, treasury_finite, capacity_in_range, final_tax_efficiency }
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

// ---------------------------------------------------------------------------
// failed_state — state capacity degrades under sustained low approval
// ---------------------------------------------------------------------------

#[test]
#[ignore]
fn failed_state_720_ticks_capacity_degrades() {
    let r = run_scenario_ticks(&scenario_path("failed_state"), 720);
    assert!(r.treasury_finite,
        "failed_state: treasury overflowed or went NaN");
    assert!(r.capacity_in_range,
        "failed_state: StateCapacity field out of [0,1]");
    // Approval is allowed to be very low — failed state design intent.
    assert!((0.0..=1.0).contains(&r.approval),
        "failed_state: approval={:.4} out of [0,1]", r.approval);
    // Verify state capacity has actually degraded (the fragility system works).
    // Initial tax_collection_efficiency = 0.18 with corruption_drift=0.025.
    // After 2 years of <30% approval we expect it to have eroded further; the
    // failed_state scenario is intentionally designed to allow capacity to
    // collapse all the way to 0.0 (total state failure), so we only assert
    // strict degradation here. The [0.0, 1.0] clamp is verified separately
    // via `capacity_in_range`.
    let final_cap = r.final_tax_efficiency.unwrap_or(1.0);
    assert!(final_cap < 0.18,
        "failed_state: state capacity should degrade below initial 0.18, got {final_cap:.4}");
}

// ---------------------------------------------------------------------------
// weimar_1919 — proportional representation + high legitimacy debt produces
//               low approval but not complete financial collapse
// ---------------------------------------------------------------------------

#[test]
#[ignore]
fn weimar_1919_720_ticks_no_nan() {
    let r = run_scenario_ticks(&scenario_path("weimar_1919"), 720);
    assert!(r.treasury_finite,
        "weimar_1919: treasury overflowed or went NaN");
    assert!(r.capacity_in_range,
        "weimar_1919: StateCapacity field out of [0,1]");
    // Weimar had very low approval and constant crises, but approval stays in [0,1].
    assert!((0.0..=1.0).contains(&r.approval),
        "weimar_1919: approval={:.4} out of [0,1]", r.approval);
}

// ---------------------------------------------------------------------------
// new_deal_1933 — high unemployment + active judicial review + legitimacy debt
//                recover but don't collapse; treasury stays finite
// ---------------------------------------------------------------------------

#[test]
#[ignore]
fn new_deal_1933_1080_ticks_no_nan() {
    let r = run_scenario_ticks(&scenario_path("new_deal_1933"), 1080);
    assert!(r.treasury_finite,
        "new_deal_1933: treasury overflowed or went NaN");
    assert!(r.capacity_in_range,
        "new_deal_1933: StateCapacity field out of [0,1]");
    // Legitimacy debt=1.8 is high but not extreme; with FPTP elections and
    // review_power=true the system should eventually find equilibrium.
    assert!((0.0..=1.0).contains(&r.approval),
        "new_deal_1933: approval={:.4} out of [0,1]", r.approval);
}

// ---------------------------------------------------------------------------
// athens_507bce — restricted franchise (0.12) + no labor rights; approval
//                can be low but no NaN; 360-tick run is the scenario intent
// ---------------------------------------------------------------------------

#[test]
#[ignore]
fn athens_507bce_360_ticks_no_nan() {
    let r = run_scenario_ticks(&scenario_path("athens_507bce"), 360);
    assert!(r.treasury_finite,
        "athens_507bce: treasury overflowed or went NaN");
    assert!(r.capacity_in_range,
        "athens_507bce: StateCapacity field out of [0,1]");
    // Restricted franchise → many unenfranchised citizens; approval measured
    // only over the full population so it may be low. Must remain in [0,1].
    assert!((0.0..=1.0).contains(&r.approval),
        "athens_507bce: approval={:.4} out of [0,1]", r.approval);
}
