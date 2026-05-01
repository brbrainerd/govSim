//! UGS Tauri shell — Phase 7. Skeleton only.
//!
//! Exposes Tauri commands listed in blueprint §10.3. The full Sim instance
//! lives behind a `tokio::sync::RwLock`.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn ping() -> &'static str { "pong" }
