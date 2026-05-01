//! YAML scenario format + runner.

use std::path::Path;

use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use serde::{Deserialize, Serialize};

use simulator_core::{
    components::{
        Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus, Health, IdeologyVector,
        Income, LegalStatuses, Location, Productivity, Sex, Wealth,
    },
    Sim,
};
use simulator_types::{CitizenId, Money, RegionId, Score};

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
    /// Number of regions; citizens are sprinkled uniformly.
    #[serde(default = "default_regions")]
    pub regions: u32,
}

fn default_regions() -> u32 { 16 }

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

    /// Spawn the scenario's population into the Sim. Deterministic given
    /// the scenario seed.
    pub fn spawn_population(&self, sim: &mut Sim) {
        let mut rng = ChaCha20Rng::from_seed(self.seed);
        let world = &mut sim.world;
        for i in 0..self.population.citizens {
            let age = rng.random_range(0u8..=95);
            let sex = match rng.random_range(0u8..3) {
                0 => Sex::Female,
                1 => Sex::Male,
                _ => Sex::Other,
            };
            let region = RegionId(rng.random_range(0..self.population.regions.max(1)));
            // log-normal-ish income with a wide spread.
            let raw_income: f64 = (rng.random::<f64>() * 11.0 + 7.0).exp();
            let income = Money::from_num(raw_income.min(1.0e9));
            let wealth = Money::from_num((raw_income * rng.random::<f64>() * 5.0).min(1.0e10));
            let employment = match rng.random_range(0u8..10) {
                0..=6 => EmploymentStatus::Employed,
                7 => EmploymentStatus::Unemployed,
                8 => EmploymentStatus::Student,
                _ => EmploymentStatus::Retired,
            };
            let ideology = IdeologyVector(std::array::from_fn(|_| rng.random::<f32>() * 2.0 - 1.0));

            world.spawn((
                Citizen(CitizenId(i)),
                Age(age),
                sex,
                Location(region),
                Health(Score::from_num(rng.random::<f32>().clamp(0.0, 0.999))),
                Income(income),
                Wealth(wealth),
                employment,
                Productivity(Score::from_num(rng.random::<f32>().clamp(0.0, 0.999))),
                ideology,
                ApprovalRating(Score::from_num(0.5_f32)),
                LegalStatuses::default(),
                AuditFlags::default(),
            ));
        }
    }
}
