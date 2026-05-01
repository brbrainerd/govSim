//! YAML scenario format + runner.

use std::path::Path;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scenario {
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default = "default_seed")]
    pub seed: [u8; 32],
    #[serde(default = "default_ticks")]
    pub ticks: u64,
    #[serde(default)]
    pub population: PopulationSpec,
}

fn default_seed() -> [u8; 32] { [0u8; 32] }
fn default_ticks() -> u64 { 100 }

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PopulationSpec {
    #[serde(default)]
    pub citizens: u64,
    #[serde(default)]
    pub corporations: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum ScenarioError {
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
    #[error("parse: {0}")]
    Parse(#[from] serde_yaml::Error),
}

impl Scenario {
    pub fn load(path: &Path) -> Result<Self, ScenarioError> {
        let text = std::fs::read_to_string(path)?;
        Ok(serde_yaml::from_str(&text)?)
    }
}
