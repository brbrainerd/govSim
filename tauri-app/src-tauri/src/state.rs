use std::path::PathBuf;

use serde::Serialize;
use tokio::sync::Mutex;

use simulator_core::{CrisisKind, Sim};
use simulator_counterfactual::estimate::CausalEstimate;
use simulator_counterfactual::triple::ComparativeEstimate;
use simulator_law::{
    register_crisis_link_system, register_law_dispatcher, register_legitimacy_system,
};
use simulator_metrics::register_metrics_system;
use simulator_scenario::Scenario;
use simulator_systems::register_phase1_systems;
use simulator_telemetry::register_telemetry_system;

// ---- App state -------------------------------------------------------------

pub struct SimBundle {
    pub sim:           Sim,
    pub scenario_name: String,
    /// Snapshot blob saved at `snapshot_tick` for counterfactual analysis.
    pub snapshot:      Option<(u64, Vec<u8>)>,
}

pub struct AppState {
    pub sim:                  Mutex<Option<SimBundle>>,
    pub scenarios_dir:        PathBuf,
    /// Raw estimates from the most recent `run_monte_carlo` call.
    pub last_mc:              Mutex<Option<Vec<CausalEstimate>>>,
    /// Raw estimates from the most recent `run_comparative_monte_carlo` call.
    pub last_comparative_mc:  Mutex<Option<Vec<ComparativeEstimate>>>,
}

impl AppState {
    pub fn new(scenarios_dir: PathBuf) -> Self {
        Self {
            sim: Mutex::new(None),
            scenarios_dir,
            last_mc: Mutex::new(None),
            last_comparative_mc: Mutex::new(None),
        }
    }
}

// ---- Error type ------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct IpcError(pub String);

impl IpcError {
    pub fn no_sim() -> Self {
        Self("sim not loaded — call load_scenario first".into())
    }
}

impl From<String> for IpcError {
    fn from(s: String) -> Self { Self(s) }
}

impl From<&str> for IpcError {
    fn from(s: &str) -> Self { Self(s.to_owned()) }
}

pub type IpcResult<T> = Result<T, IpcError>;

// ---- Sim builder -----------------------------------------------------------

pub fn build_sim_from_scenario(scenario: &Scenario) -> SimBundle {
    let mut sim = Sim::new(scenario.seed);
    register_phase1_systems(&mut sim);
    register_law_dispatcher(&mut sim);
    register_crisis_link_system(&mut sim);
    register_legitimacy_system(&mut sim);
    register_metrics_system(&mut sim);
    register_telemetry_system(&mut sim);
    scenario.spawn_population(&mut sim);
    SimBundle { sim, scenario_name: scenario.name.clone(), snapshot: None }
}

// ---- Helpers ---------------------------------------------------------------

pub fn crisis_kind_u8(kind: CrisisKind) -> u8 {
    match kind {
        CrisisKind::None            => 0,
        CrisisKind::War             => 1,
        CrisisKind::Pandemic        => 2,
        CrisisKind::Recession       => 3,
        CrisisKind::NaturalDisaster => 4,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── crisis_kind_u8 ────────────────────────────────────────────────────────
    // The u8 values are the IPC contract with the TypeScript frontend.
    // Changing them silently breaks the crisis display in Dashboard / ElectionView.

    #[test]
    fn none_is_zero() {
        assert_eq!(crisis_kind_u8(CrisisKind::None), 0);
    }

    #[test]
    fn war_is_one() {
        assert_eq!(crisis_kind_u8(CrisisKind::War), 1);
    }

    #[test]
    fn pandemic_is_two() {
        assert_eq!(crisis_kind_u8(CrisisKind::Pandemic), 2);
    }

    #[test]
    fn recession_is_three() {
        assert_eq!(crisis_kind_u8(CrisisKind::Recession), 3);
    }

    #[test]
    fn natural_disaster_is_four() {
        assert_eq!(crisis_kind_u8(CrisisKind::NaturalDisaster), 4);
    }

    // ── IpcError ──────────────────────────────────────────────────────────────

    #[test]
    fn no_sim_error_message_is_user_readable() {
        let e = IpcError::no_sim();
        assert!(e.0.contains("load_scenario"), "should mention the fix: {}", e.0);
    }

    #[test]
    fn ipc_error_from_string() {
        let e: IpcError = "test error".into();
        assert_eq!(e.0, "test error");
    }
}
