//! YAML scenario format + runner.

use std::path::Path;

use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use serde::{Deserialize, Serialize};

use simulator_core::{
    components::{
        Age, ApprovalRating, AuditFlagBits, AuditFlags, Citizen, EmploymentStatus, EvasionPropensity,
        Health, IdeologyVector, Income, LegalStatusFlags, LegalStatuses, Location, Productivity,
        Sex, Wealth,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PopulationSpec {
    #[serde(default)]
    pub citizens: u64,
    #[serde(default)]
    pub corporations: u64,
    /// Number of regions; citizens are sprinkled uniformly.
    #[serde(default = "default_regions")]
    pub regions: u32,
    /// Mean monthly income override (e.g. from `ugs calibrate`). If None,
    /// uses a log-normal distribution with mean ~$3,000.
    #[serde(default)]
    pub income_mean_monthly: Option<f64>,
    /// Fraction starting unemployed [0, 1]. Overrides the default ~10% split.
    #[serde(default)]
    pub unemployment_rate: Option<f32>,
    /// Corruption level [0, 1]: sets AuditFlagBits::FLAGGED_INCOME for that
    /// fraction of citizens at spawn time.
    #[serde(default)]
    pub corruption_level: Option<f32>,
}

impl Default for PopulationSpec {
    fn default() -> Self {
        Self {
            citizens: 0,
            corporations: 0,
            regions: default_regions(),
            income_mean_monthly: None,
            unemployment_rate: None,
            corruption_level: None,
        }
    }
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
    /// the scenario seed. Respects optional calibration overrides in
    /// `population.income_mean_monthly`, `.unemployment_rate`, `.corruption_level`.
    pub fn spawn_population(&self, sim: &mut Sim) {
        let mut rng = ChaCha20Rng::from_seed(self.seed);
        let world = &mut sim.world;

        // Pre-compute calibration-adjusted parameters.
        let income_mean = self.population.income_mean_monthly.unwrap_or(3_000.0);
        // Log-normal: E[X] = exp(μ + σ²/2). For σ=1.5, choose μ = ln(mean) - σ²/2.
        let sigma: f64 = 1.5;
        let mu: f64 = income_mean.max(200.0).ln() - sigma * sigma / 2.0;

        // Employment distribution: [employed, unemployed, student, retired] cumulative thresholds
        let unemp = self.population.unemployment_rate.unwrap_or(0.10) as f64;
        let emp_thresh = (1.0 - unemp - 0.10 - 0.10).max(0.0); // employed share
        let unemp_thresh = emp_thresh + unemp;
        let student_thresh = unemp_thresh + 0.10;
        // retired = remainder

        let corruption = self.population.corruption_level.unwrap_or(0.0);

        for i in 0..self.population.citizens {
            let age = rng.random_range(0u8..=95);
            let sex = match rng.random_range(0u8..3) {
                0 => Sex::Female,
                1 => Sex::Male,
                _ => Sex::Other,
            };
            let region = RegionId(rng.random_range(0..self.population.regions.max(1)));

            // Log-normal income centred on calibrated mean.
            let z: f64 = rng.random::<f64>();
            let raw_income: f64 = (mu + sigma * normal_quantile(z)).exp();
            let income = Money::from_num(raw_income.clamp(200.0, 1.0e9));
            let wealth = Money::from_num((raw_income * rng.random::<f64>() * 5.0).min(1.0e10));

            let r: f64 = rng.random::<f64>();
            // Age-consistent employment: minors are always Students; seniors
            // are always Retired. Adults use the calibrated distribution.
            let employment = if age < 18 {
                EmploymentStatus::Student
            } else if age >= 65 {
                EmploymentStatus::Retired
            } else if r < emp_thresh {
                EmploymentStatus::Employed
            } else if r < unemp_thresh {
                EmploymentStatus::Unemployed
            } else if r < student_thresh {
                EmploymentStatus::Student
            } else {
                EmploymentStatus::Retired
            };

            let ideology = IdeologyVector(std::array::from_fn(|_| rng.random::<f32>() * 2.0 - 1.0));

            // Corruption: flag a fraction of citizens for audit at spawn;
            // flagged citizens also carry a non-zero evasion propensity.
            let flagged = corruption > 0.0 && rng.random::<f32>() < corruption;
            let audit = if flagged {
                AuditFlags(AuditFlagBits::FLAGGED_INCOME)
            } else {
                AuditFlags::default()
            };
            let evasion = if flagged {
                EvasionPropensity(rng.random::<f32>()) // uniform [0,1] of income hidden
            } else {
                EvasionPropensity(0.0)
            };

            // Legal status: minors cannot vote; adults are registered citizens.
            let legal = if age < 18 {
                LegalStatuses(LegalStatusFlags::MINOR | LegalStatusFlags::CITIZEN)
            } else {
                LegalStatuses(LegalStatusFlags::REGISTERED_VOTER | LegalStatusFlags::CITIZEN)
            };

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
                legal,
                audit,
                evasion,
            ));
        }
    }
}

/// Rational approximation of the standard normal quantile (Beasley-Springer-Moro).
/// Maps u ∈ (0,1) → z ∈ ℝ. Used for log-normal income generation.
fn normal_quantile(u: f64) -> f64 {
    // Clamp to avoid infinity at edges.
    let u = u.clamp(1e-9, 1.0 - 1e-9);
    // Rational approximation coefficients (Abramowitz & Stegun 26.2.17).
    let t = (-2.0 * u.min(1.0 - u).ln()).sqrt();
    let c = [2.515517, 0.802853, 0.010328];
    let d = [1.432788, 0.189269, 0.001308];
    let num = c[0] + c[1] * t + c[2] * t * t;
    let den = 1.0 + d[0] * t + d[1] * t * t + d[2] * t * t * t;
    let z = t - num / den;
    if u < 0.5 { -z } else { z }
}
