//! Deterministic blake3 digest of the full simulation state.
//!
//! Citizens are sorted by CitizenId before hashing so archetype storage order
//! doesn't affect the digest. Resources (Treasury, MacroIndicators, clock) are
//! mixed in after the citizen block.

use bevy_ecs::world::World;
use blake3::Hasher;
use simulator_core::{MacroIndicators, SimClock, Treasury};
use simulator_core::components::{
    Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus, EvasionPropensity, Health,
    IdeologyVector, Income, LegalStatuses, Location, Productivity, Sex, Wealth,
};
use simulator_types::CitizenId;

/// A 32-byte deterministic hash of the world state.
pub type StateHash = [u8; 32];

type CitizenRow = (
    CitizenId, Age, Sex, Location, Health, Income, Wealth,
    EmploymentStatus, Productivity, IdeologyVector, LegalStatuses, AuditFlags, ApprovalRating,
    EvasionPropensity,
);

/// Compute a deterministic hash of every citizen component + global resources.
///
/// The result is stable across runs given the same seed and tick count,
/// regardless of ECS archetype ordering or OS.
pub fn state_hash(world: &mut World) -> StateHash {
    // Collect all citizens into a Vec so we can sort by id.
    let mut citizens: Vec<CitizenRow> = world
        .query::<(
            &Citizen,
            &Age,
            &Sex,
            &Location,
            &Health,
            &Income,
            &Wealth,
            &EmploymentStatus,
            &Productivity,
            &IdeologyVector,
            &LegalStatuses,
            &AuditFlags,
            &ApprovalRating,
            &EvasionPropensity,
        )>()
        .iter(world)
        .map(|(c, a, s, l, h, i, w, e, p, iv, ls, af, ar, ep)| {
            (c.0, *a, *s, *l, *h, *i, *w, *e, *p, *iv, *ls, *af, *ar, *ep)
        })
        .collect();

    citizens.sort_by_key(|(id, ..)| id.0);

    let mut hasher = Hasher::new();

    for (id, age, sex, loc, health, income, wealth, emp, prod, ideology, legal, audit, approval, evasion) in
        &citizens
    {
        hasher.update(&id.0.to_le_bytes());
        hasher.update(&[age.0]);
        hasher.update(&[*sex as u8]);
        hasher.update(&loc.0.0.to_le_bytes());
        // Score = U0F32 = u32 bits
        hasher.update(&health.0.to_bits().to_le_bytes());
        // Money = I64F64 = i128 bits
        hasher.update(&income.0.to_bits().to_le_bytes());
        hasher.update(&wealth.0.to_bits().to_le_bytes());
        hasher.update(&[*emp as u8]);
        hasher.update(&prod.0.to_bits().to_le_bytes());
        for f in &ideology.0 {
            hasher.update(&f.to_bits().to_le_bytes());
        }
        hasher.update(&legal.0.bits().to_le_bytes());
        hasher.update(&audit.0.bits().to_le_bytes());
        hasher.update(&approval.0.to_bits().to_le_bytes());
        hasher.update(&evasion.0.to_bits().to_le_bytes());
    }

    // Mix in global resources.
    let clock = world.resource::<SimClock>();
    hasher.update(&clock.tick.to_le_bytes());

    let treasury = world.resource::<Treasury>();
    hasher.update(&treasury.balance.to_bits().to_le_bytes());

    let macro_ = world.resource::<MacroIndicators>();
    hasher.update(&macro_.population.to_le_bytes());
    hasher.update(&macro_.gdp.to_bits().to_le_bytes());
    hasher.update(&macro_.gini.to_bits().to_le_bytes());
    hasher.update(&macro_.unemployment.to_bits().to_le_bytes());
    hasher.update(&macro_.approval.to_bits().to_le_bytes());
    hasher.update(&[macro_.incumbent_party]);
    hasher.update(&macro_.last_election_tick.to_le_bytes());
    hasher.update(&macro_.election_margin.to_bits().to_le_bytes());
    hasher.update(&macro_.consecutive_terms.to_le_bytes());

    *hasher.finalize().as_bytes()
}
