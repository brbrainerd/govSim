//! ECS Component catalog. See blueprint §3.1.
//!
//! Components are grouped by layer: demographic, economic, psychological,
//! political, network, legal. We avoid runtime-added flag components in
//! favor of bitflag containers (`LegalStatuses`, `AuditFlags`) so archetype
//! membership stays stable in the hot loops.

use bevy_ecs::prelude::Component;
use bitflags::bitflags;
use simulator_types::{CitizenId, Money, RegionId, Score};

// --- Demographic --------------------------------------------------------

#[derive(Component, Copy, Clone, Debug)]
pub struct Citizen(pub CitizenId);

#[derive(Component, Copy, Clone, Debug)]
pub struct Age(pub u8);

#[derive(Component, Copy, Clone, Debug, Eq, PartialEq)]
pub enum Sex { Female, Male, Other }

#[derive(Component, Copy, Clone, Debug)]
pub struct Location(pub RegionId);

#[derive(Component, Copy, Clone, Debug)]
pub struct Health(pub Score);

// --- Economic -----------------------------------------------------------

#[derive(Component, Copy, Clone, Debug)]
pub struct Income(pub Money);

#[derive(Component, Copy, Clone, Debug)]
pub struct Wealth(pub Money);

#[derive(Component, Copy, Clone, Debug, Eq, PartialEq)]
pub enum EmploymentStatus { Employed, Unemployed, OutOfLaborForce, Student, Retired }

#[derive(Component, Copy, Clone, Debug)]
pub struct Productivity(pub Score);

// --- Political ----------------------------------------------------------

/// 5-axis ideology vector: (econ, social, auth, env, intl).
#[derive(Component, Copy, Clone, Debug)]
pub struct IdeologyVector(pub [f32; 5]);

#[derive(Component, Copy, Clone, Debug)]
pub struct ApprovalRating(pub Score);

// --- Legal --------------------------------------------------------------

bitflags! {
    #[derive(Copy, Clone, Debug, Default)]
    pub struct LegalStatusFlags: u32 {
        const CITIZEN          = 1 << 0;
        const RESIDENT         = 1 << 1;
        const REGISTERED_VOTER = 1 << 2;
        const FELON            = 1 << 3;
        const TAX_RESIDENT     = 1 << 4;
        const MINOR            = 1 << 5;
    }
}

#[derive(Component, Copy, Clone, Debug, Default)]
pub struct LegalStatuses(pub LegalStatusFlags);

bitflags! {
    #[derive(Copy, Clone, Debug, Default)]
    pub struct AuditFlagBits: u32 {
        const FLAGGED_INCOME    = 1 << 0;
        const FLAGGED_TRANSFER  = 1 << 1;
        const UNDER_INVESTIGATION = 1 << 2;
    }
}

#[derive(Component, Copy, Clone, Debug, Default)]
pub struct AuditFlags(pub AuditFlagBits);

/// Monthly household consumption spending (≈ 0.8 × monthly income by default).
/// Updated by the consumption system each tick once income changes.
#[derive(Component, Copy, Clone, Debug, Default)]
pub struct ConsumptionExpenditure(pub Money);

/// Fraction of (post-employment-type) income saved each month [0, 1].
/// The remainder (1 - savings_rate) is consumed.
/// Age-dependent by default: younger workers save less; near-retirement save more.
#[derive(Component, Copy, Clone, Debug)]
pub struct SavingsRate(pub f32);

impl Default for SavingsRate {
    fn default() -> Self { Self(0.20) }
}

// --- Behavioral ---------------------------------------------------------

/// Fraction of income a citizen attempts to hide from tax authorities [0, 1].
/// Drawn at spawn; zero for honest citizens. Persistent across ticks.
#[derive(Component, Copy, Clone, Debug, Default)]
pub struct EvasionPropensity(pub f32);
