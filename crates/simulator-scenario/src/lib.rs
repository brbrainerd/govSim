//! YAML scenario format + runner.

use std::path::Path;

use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use serde::{Deserialize, Serialize};

use simulator_core::{
    components::{
        Age, ApprovalRating, AuditFlagBits, AuditFlags, Citizen, ConsumptionExpenditure,
        EmploymentStatus, EvasionPropensity, Health, IdeologyVector, Income, LegalStatusFlags,
        LegalStatuses, Location, MonthlyBenefitReceived, MonthlyTaxPaid, Productivity,
        SavingsRate, Sex, Wealth,
    },
    CivicRights, LegitimacyDebt, PollutionStock, RightsLedger, Sim,
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
    /// Civic rights granted at tick 0 as a bitmask over CivicRights flags.
    /// If absent, no rights are pre-granted (historical start state).
    /// Example: 0x1FF grants all nine defined rights.
    #[serde(default)]
    pub initial_rights: Option<u32>,
    /// Starting pollution stock (PU). Defaults to 0.0 (pre-industrial).
    #[serde(default)]
    pub initial_pollution: Option<f64>,
    /// Override the monthly crisis probability (percent, 0–100).
    /// If absent, uses the value of `UGS_CRISIS_PROB_PCT` env var (default 2).
    #[serde(default)]
    pub crisis_prob_pct: Option<u32>,
    /// Starting legitimacy debt stock. Defaults to 0.0.
    #[serde(default)]
    pub initial_legitimacy_debt: Option<f32>,
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

            // Nested to stay within Bevy's 15-component Bundle limit.
            world.spawn((
                (
                    Citizen(CitizenId(i)),
                    Age(age),
                    sex,
                    Location(region),
                    Health(Score::from_num(rng.random::<f32>().clamp(0.0, 0.999))),
                    Income(income),
                    Wealth(wealth),
                    employment,
                ), (
                    Productivity(Score::from_num(rng.random::<f32>().clamp(0.0, 0.999))),
                    ideology,
                    ApprovalRating(Score::from_num(0.5_f32)),
                    legal,
                    audit,
                    evasion,
                    SavingsRate(savings_rate_for_age(age)),
                    ConsumptionExpenditure(income * Money::from_num(4) / Money::from_num(5)),
                    MonthlyTaxPaid::default(),
                    MonthlyBenefitReceived::default(),
                ),
            ));
        }
    }

    /// Apply scenario-level world configuration (rights, pollution, debt).
    /// Call this after `spawn_population` and after all systems are registered,
    /// before the first `sim.step()`.
    pub fn configure_world(&self, sim: &mut Sim) {
        let world = &mut sim.world;

        if let Some(rights_bits) = self.initial_rights {
            let mut ledger = world.resource_mut::<RightsLedger>();
            let rights = CivicRights::from_bits_truncate(rights_bits);
            ledger.granted       = rights;
            ledger.historical_max = rights;
            // Tick 0 — no honeymoon at game start.
            ledger.last_expansion_tick = 0;
        }

        if let Some(stock) = self.initial_pollution {
            world.resource_mut::<PollutionStock>().stock = stock.max(0.0);
        }

        if let Some(debt) = self.initial_legitimacy_debt {
            world.resource_mut::<LegitimacyDebt>().stock = debt.max(0.0);
        }

        if let Some(pct) = self.crisis_prob_pct {
            // Write to the env var that crisis_system reads for its probability override.
            // SAFETY: single-threaded scenario setup; no concurrent threads at this point.
            unsafe { std::env::set_var("UGS_CRISIS_PROB_PCT", pct.min(100).to_string()); }
        }
    }
}

/// Age-graded savings rate: young workers save less; older workers save more.
fn savings_rate_for_age(age: u8) -> f32 {
    match age {
        0..=22  => 0.05,  // students / early career
        23..=39 => 0.15,  // early working life
        40..=54 => 0.25,  // peak earnings + retirement planning
        55..=64 => 0.30,  // pre-retirement accumulation
        _       => 0.10,  // retired — drawing down, some precautionary saving
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::{CivicRights, LegitimacyDebt, PollutionStock, RightsLedger, SimClock};
    use simulator_snapshot::{load_snapshot, save_snapshot, state_hash};
    use simulator_systems::register_phase1_systems;

    fn minimal_scenario() -> Scenario {
        Scenario {
            name: "test".into(),
            description: String::new(),
            seed: [42u8; 32],
            ticks: 90,
            population: PopulationSpec {
                citizens: 50,
                corporations: 0,
                regions: 4,
                income_mean_monthly: Some(3_000.0),
                unemployment_rate: Some(0.10),
                corruption_level: None,
            },
            initial_rights: Some(CivicRights::UNIVERSAL_SUFFRAGE.bits()),
            initial_pollution: Some(1.5),
            initial_legitimacy_debt: Some(0.2),
            crisis_prob_pct: Some(0), // suppress random crises for determinism
        }
    }

    #[test]
    fn end_to_end_scenario_runs_and_configure_world_applies() {
        let scenario = minimal_scenario();
        let mut sim = Sim::new(scenario.seed);
        register_phase1_systems(&mut sim);

        scenario.spawn_population(&mut sim);
        scenario.configure_world(&mut sim);

        // Verify configure_world applied before stepping.
        {
            let r = sim.world.resource::<RightsLedger>();
            assert!(r.granted.contains(CivicRights::UNIVERSAL_SUFFRAGE),
                "rights should be pre-granted");
        }
        assert!((sim.world.resource::<PollutionStock>().stock - 1.5).abs() < 1e-9,
            "initial pollution not applied");
        assert!((sim.world.resource::<LegitimacyDebt>().stock - 0.2).abs() < 1e-6,
            "initial legitimacy debt not applied");

        // Step for 3 months — should not panic and tick should advance.
        for _ in 0..90 { sim.step(); }
        assert_eq!(sim.world.resource::<SimClock>().tick, 90);

        // Population should be non-zero and approval should be in range.
        let macro_ = sim.world.resource::<simulator_core::MacroIndicators>();
        assert!(macro_.population > 0, "population should be non-zero after run");
        assert!(macro_.approval >= 0.0 && macro_.approval <= 1.0,
            "approval out of range: {}", macro_.approval);
        // Pollution mirrored monthly (fires at tick 30 and 60).
        assert!(macro_.pollution_stock >= 0.0, "pollution_stock should be non-negative");
    }

    #[test]
    fn snapshot_replay_round_trip_deterministic() {
        // Run to tick 60, snapshot, continue both runs to tick 90.
        // The continuous run and the restored run must produce identical state hashes.
        let scenario = minimal_scenario(); // crisis_prob_pct=0 → deterministic

        let (blob, hash_continuous) = {
            let mut sim = Sim::new(scenario.seed);
            register_phase1_systems(&mut sim);
            scenario.spawn_population(&mut sim);
            scenario.configure_world(&mut sim);
            for _ in 0..60 { sim.step(); }
            let blob = save_snapshot(&mut sim.world).expect("save failed");
            for _ in 60..90 { sim.step(); }
            (blob, state_hash(&mut sim.world))
        };

        let hash_restored = {
            let mut sim = Sim::new(scenario.seed);
            register_phase1_systems(&mut sim);
            load_snapshot(&mut sim.world, &blob).expect("load failed");
            for _ in 60..90 { sim.step(); }
            state_hash(&mut sim.world)
        };

        assert_eq!(
            hash_continuous, hash_restored,
            "snapshot round-trip broke determinism at tick 90"
        );
    }

    #[test]
    fn scenario_determinism_same_seed() {
        let scenario = minimal_scenario();

        let hash_of = |scenario: &Scenario| -> [u8; 32] {
            let mut sim = Sim::new(scenario.seed);
            register_phase1_systems(&mut sim);
            scenario.spawn_population(&mut sim);
            scenario.configure_world(&mut sim);
            for _ in 0..90 { sim.step(); }
            simulator_snapshot::state_hash(&mut sim.world)
        };

        let h1 = hash_of(&scenario);
        let h2 = hash_of(&scenario);
        assert_eq!(h1, h2, "same seed should produce identical state hashes");
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
