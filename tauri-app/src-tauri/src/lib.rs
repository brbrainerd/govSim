//! UGS Tauri IPC layer.
//!
//! `commands` module: all `#[tauri::command]` functions.
//! `state` module:    AppState, SimBundle, IpcError.

pub mod commands;
pub mod state;

use std::path::PathBuf;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let scenarios_dir = {
        let exe = std::env::current_exe().unwrap_or_default();
        let candidates = [
            PathBuf::from("scenarios"),
            exe.parent()
               .unwrap_or(std::path::Path::new("."))
               .join("scenarios"),
        ];
        candidates.into_iter().find(|p| p.exists())
            .unwrap_or_else(|| PathBuf::from("scenarios"))
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new(scenarios_dir))
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::load_scenario,
            commands::step_sim,
            commands::get_tick,
            commands::get_metrics_rows,
            commands::get_current_state,
            commands::list_laws,
            commands::enact_flat_tax,
            commands::enact_ubi,
            commands::enact_abatement,
            commands::list_rights,
            commands::enact_right_grant,
            commands::enact_right_revoke,
            commands::enact_state_capacity_modify,
            commands::repeal_law,
            commands::grant_civic_right,
            commands::revoke_civic_right,
            commands::get_law_effect,
            commands::export_metrics_parquet,
            commands::save_sim_snapshot,
            commands::get_counterfactual_diff,
            commands::run_monte_carlo,
            commands::get_citizen_distribution,
            commands::get_law_dsl_source,
            commands::step_and_get_state,
            commands::get_citizen_scatter,
            commands::get_region_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
