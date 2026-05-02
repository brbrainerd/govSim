//! JudicialReviewSystem — Phase::Commit, monthly.
//!
//! When a `Judiciary` resource is present and `Judiciary::is_active_check()`
//! returns true, this system samples active laws from the `LawRegistry` and
//! probabilistically strikes them down using `challenge_success_prob()`.
//!
//! ## Design
//!
//! Real judicial review is triggered by challengers (not automatic), has a
//! multi-year timeline, and applies constitutional reasoning. This system
//! approximates that with a monthly stochastic check:
//!
//!   P(review) = judiciary.challenge_success_prob() × REVIEW_RATE
//!
//! where REVIEW_RATE = 0.02 (roughly one challenge per 50 law-months in a
//! high-independence judiciary). Only laws of certain types are reviewable:
//! `PerCitizenIncomeTax`, `PerCitizenBenefit`, `RightRevoke` (highest scrutiny),
//! `Abatement` (low). `RightGrant` is never struck down (expanding rights is
//! constitutionally favoured).
//!
//! Struck-down laws are repealed via `LawRegistry::repeal(id, tick)`. Each
//! strike-down adds `0.3` to `LegitimacyDebt.stock` (constitutional crisis
//! signal that cascades into approval and election dynamics).
//!
//! ## Backward compatibility
//!
//! System is a no-op when `Judiciary` resource is absent or when
//! `is_active_check()` returns false (independence < 0.3 or review_power=false).
//! All pre-Phase-D scenarios are completely unaffected.

use simulator_core::{
    bevy_ecs::prelude::*,
    Judiciary, LegitimacyDebt, Phase, Sim, SimClock, SimRng,
};
use simulator_law::registry::{LawEffect, LawRegistry};
use rand::Rng;

/// Fraction of active laws reviewed per month by an active judiciary.
/// At independence=1.0 and REVIEW_RATE=0.02, a court with 10 active laws
/// is expected to review ~0.2 laws/month → ~1 strike-down every 5 months.
const REVIEW_RATE: f32 = 0.02;

/// Legitimacy cost per law struck down (constitutional crisis signal).
const STRIKE_DOWN_DEBT: f32 = 0.3;

/// Types of law effects subject to judicial scrutiny (ascending scrut. order).
fn is_reviewable(effect: &LawEffect) -> bool {
    matches!(
        effect,
        LawEffect::PerCitizenIncomeTax { .. }   // tax laws — constitutional limits
        | LawEffect::Audit { .. }               // enforcement — due process
        | LawEffect::PerCitizenBenefit { .. }   // spending — equality clause
        | LawEffect::RightRevoke { .. }         // highest scrutiny — rights removal
        | LawEffect::StateCapacityModify { .. } // administrative reorganisation
        | LawEffect::Abatement { .. }           // regulatory — environmental limits
    )
    // RightGrant and RegistrationMarker are NOT reviewable (expanding rights
    // and registering voters is constitutionally favoured).
}

pub fn judicial_review_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    registry: Option<Res<LawRegistry>>,
    judiciary: Option<Res<Judiciary>>,
    mut debt: ResMut<LegitimacyDebt>,
) {
    // Fire monthly.
    if !clock.tick.is_multiple_of(30) || clock.tick == 0 { return; }

    // No-op when LawRegistry is absent (law dispatcher not registered).
    let registry = match registry {
        Some(r) => r,
        None => return,
    };

    // No-op when Judiciary resource is absent or court is inactive.
    let jud = match judiciary {
        Some(ref j) if j.is_active_check() => j,
        _ => return,
    };

    let challenge_prob = jud.challenge_success_prob(); // 0..1, scales with independence
    let review_prob_per_law = (challenge_prob * REVIEW_RATE).clamp(0.0, 1.0);
    if review_prob_per_law <= 0.0 { return; }

    let tick = clock.tick;
    let active = registry.snapshot_active(tick);

    for handle in &active {
        if !is_reviewable(&handle.effect) { continue; }

        let mut rng = rng_res.derive_citizen("judicial_review", tick, handle.id.0);
        if rng.random::<f32>() < review_prob_per_law {
            // Law struck down — repeal it at this tick.
            registry.repeal(handle.id, tick);
            debt.stock += STRIKE_DOWN_DEBT;
            tracing::info!(
                tick,
                law_id = handle.id.0,
                independence = jud.independence,
                debt_added = STRIKE_DOWN_DEBT,
                "judicial review: law struck down"
            );
        }
    }
}

pub fn register_judicial_review_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(judicial_review_system.in_set(Phase::Commit));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::{Judiciary, Sim};
    use simulator_law::{
        dsl::ast::{Program, Scope},
        registry::{LawHandle, LawId, LawRegistry},
        system::{register_law_dispatcher, Cadence},
    };
    use std::sync::Arc;

    fn make_law(id: u64, effect: LawEffect) -> LawHandle {
        LawHandle {
            source: None,
            id: LawId(id),
            version: 1,
            program: Arc::new(Program {
                scopes: vec![Scope { name: "J".into(), params: vec![], items: vec![] }],
            }),
            cadence: Cadence::Monthly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect,
        }
    }

    /// Without a Judiciary resource, no laws are struck down.
    #[test]
    fn no_judiciary_resource_no_strike_down() {
        let mut sim = Sim::new([80u8; 32]);
        register_law_dispatcher(&mut sim);
        register_judicial_review_system(&mut sim);
        // No Judiciary resource — system must be a no-op.

        let handle = make_law(300, LawEffect::PerCitizenIncomeTax { scope: "T", owed_def: "owed" });
        let law_id = sim.world.resource::<LawRegistry>().clone().enact(handle);

        for _ in 0..31 { sim.step(); }

        // Law should still be active.
        assert!(
            sim.world.resource::<LawRegistry>().get_handle(law_id).is_some(),
            "law should not be struck down without Judiciary resource"
        );
    }

    /// With review_power=false, is_active_check() is false → no review.
    #[test]
    fn judiciary_without_review_power_no_strike_down() {
        let mut sim = Sim::new([81u8; 32]);
        register_law_dispatcher(&mut sim);
        register_judicial_review_system(&mut sim);

        sim.world.insert_resource(Judiciary {
            independence: 0.95,
            review_power: false, // parliamentary sovereignty
            precedent_weight: 0.80,
            international_deference: 0.0,
        });

        let handle = make_law(301, LawEffect::RightRevoke { right_id: "free_speech" });
        let law_id = sim.world.resource::<LawRegistry>().clone().enact(handle);

        for _ in 0..31 { sim.step(); }

        let active = sim.world.resource::<LawRegistry>().snapshot_active(31);
        assert!(
            active.iter().any(|h| h.id == law_id),
            "law should not be struck down when review_power=false"
        );
    }

    /// With high independence + review_power=true and many ticks, at least
    /// one reviewable law is struck down over a 12-month period.
    #[test]
    fn high_independence_court_strikes_down_reviewable_law_over_year() {
        let mut sim = Sim::new([82u8; 32]);
        register_law_dispatcher(&mut sim);
        register_judicial_review_system(&mut sim);

        sim.world.insert_resource(Judiciary {
            independence: 1.0,  // maximum — all reviewable laws face P=REVIEW_RATE per month
            review_power: true,
            precedent_weight: 0.80,
            international_deference: 0.0,
        });

        // Enact 20 reviewable laws.
        let registry = sim.world.resource::<LawRegistry>().clone();
        for i in 0..20 {
            registry.enact(make_law(400 + i, LawEffect::Audit {
                selection_prob: 0.1,
                penalty_rate: 0.1,
            }));
        }

        let initial_debt = sim.world.resource::<LegitimacyDebt>().stock;

        // Run 12 months (360 ticks + 1 to trigger last monthly).
        for _ in 0..=360 { sim.step(); }

        let final_debt = sim.world.resource::<LegitimacyDebt>().stock;
        let active_count = sim.world.resource::<LawRegistry>().snapshot_active(361).len();

        // At P = 0.02 per law per month × 12 months × 20 laws → E[struck] ≈ 4.8.
        // We assert at least 1 strike-down occurred (debt increased) with very high probability.
        assert!(
            final_debt > initial_debt || active_count < 20,
            "high-independence court over 12 months should strike down at least one law; \
             initial_debt={initial_debt}, final_debt={final_debt}, active_count={active_count}"
        );
    }

    /// RightGrant laws are never struck down regardless of judiciary.
    #[test]
    fn right_grant_laws_are_not_reviewable() {
        let mut sim = Sim::new([83u8; 32]);
        register_law_dispatcher(&mut sim);
        register_judicial_review_system(&mut sim);

        sim.world.insert_resource(Judiciary {
            independence: 1.0,
            review_power: true,
            precedent_weight: 1.0,
            international_deference: 0.0,
        });

        let registry = sim.world.resource::<LawRegistry>().clone();
        // Enact 50 RightGrant laws — none should be reviewable.
        for i in 0..50 {
            registry.enact(make_law(500 + i, LawEffect::RightGrant { right_id: "free_speech" }));
        }

        let initial_count = registry.snapshot_active(0).len();
        for _ in 0..=360 { sim.step(); }
        let final_count = registry.snapshot_active(361).len();

        assert_eq!(
            initial_count, final_count,
            "RightGrant laws must not be struck down by judicial review"
        );
    }
}
