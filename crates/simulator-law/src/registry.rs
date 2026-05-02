//! `LawRegistry` resource. Owns compiled laws + supersession metadata.
//!
//! In the JIT-backed future this will store function pointers; in the
//! tree-walking-interpreter present it holds a parsed+typechecked `Program`
//! and a small dispatch closure spec.

use std::collections::HashMap;
use std::sync::Arc;

use bevy_ecs::prelude::Resource;
use parking_lot::RwLock;

use crate::dsl::Program;
use crate::ig2::AmountBasis;
use crate::system::Cadence;

#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug)]
pub struct LawId(pub u64);

#[derive(Clone)]
pub struct LawHandle {
    pub id: LawId,
    pub version: u32,
    pub program: Arc<Program>,
    /// Original DSL source text (for display, audit, advanced editing).
    /// Optional because programmatic-only laws may skip it.
    pub source: Option<Arc<String>>,
    pub cadence: Cadence,
    pub effective_from_tick: u64,
    pub effective_until_tick: Option<u64>,
    /// What the law actually does to ECS state. Phase 4 vertical slice
    /// only models "remit per-citizen tax to Treasury"; later we'll
    /// generate this from the regulative aim/object pair.
    pub effect: LawEffect,
}

#[derive(Clone, Copy, Debug)]
pub enum LawEffect {
    /// Use the named scope's named definition as the per-citizen amount
    /// owed; deduct from `Wealth`, credit `Treasury`.
    PerCitizenIncomeTax {
        scope: &'static str,
        owed_def: &'static str,
    },
    /// Per-citizen transfer payment: pay `amount_def` from Treasury to
    /// each eligible citizen (added to `Wealth`).
    PerCitizenBenefit {
        scope: &'static str,
        amount_def: &'static str,
    },
    /// Non-monetary registration marker: sets or clears `LegalStatuses::REGISTERED_VOTER`
    /// for every citizen based on whether their `basis` is below `threshold`.
    /// The DSL scope is a no-op placeholder kept for audit / round-trip.
    RegistrationMarker {
        basis: AmountBasis,
        threshold: f64,
    },
    /// Tax-enforcement audit: selects citizens by probability, penalizes evaders.
    /// Evaders are identified by `AuditFlagBits::FLAGGED_INCOME` combined with
    /// non-zero `EvasionPropensity`. Penalty = annual_income × evasion × penalty_rate.
    Audit {
        /// Fraction of citizens audited per firing period.
        selection_prob: f64,
        /// Penalty coefficient on detected evaded income.
        penalty_rate: f64,
    },
    /// Environmental abatement spending: removes `pollution_reduction_pu` pollution
    /// units per monthly firing at a cost of `cost_per_pu` cents debited from
    /// Treasury. If Treasury cannot cover the full amount, partial abatement
    /// proportional to available funds is applied.
    Abatement {
        /// Pollution units removed per firing (unconstrained by Treasury).
        pollution_reduction_pu: f64,
        /// Treasury cost in cents per pollution unit removed.
        cost_per_pu: f64,
    },
}

#[derive(Resource, Default, Clone)]
pub struct LawRegistry {
    inner: Arc<RwLock<RegistryInner>>,
}

#[derive(Default)]
struct RegistryInner {
    by_id: HashMap<LawId, LawHandle>,
    next_id: u64,
    /// Pending legitimacy-debt events from repeals: drained by the
    /// legitimacy_update_system each monthly tick.
    repeal_debt: f32,
    /// Multiplier applied to all new repeal-debt charges this tick.
    /// Set each tick by crisis_link_system from CrisisState.cost_multiplier.
    /// < 1.0 during active crises (emergency measures face less resistance).
    crisis_cost_multiplier: f32,
}

impl RegistryInner {
    fn scaled_debt(&self, base: f32) -> f32 {
        let m = if self.crisis_cost_multiplier > 0.0 { self.crisis_cost_multiplier } else { 1.0 };
        base * m
    }
}

impl LawRegistry {
    pub fn enact(&self, mut h: LawHandle) -> LawId {
        let mut g = self.inner.write();
        if h.id.0 == 0 {
            g.next_id += 1;
            h.id = LawId(g.next_id);
        }
        let id = h.id;
        g.by_id.insert(id, h);
        id
    }

    /// Replace an existing law atomically. New version's `version` must be
    /// strictly greater. The old law's `effective_until_tick` is set.
    /// If the old law is a `PerCitizenBenefit`, accumulates legitimacy debt:
    /// removing entrenched programs incurs a political cost regardless of
    /// what replaces them.
    pub fn supersede(&self, old: LawId, new: LawHandle, effective_from_tick: u64) -> LawId {
        let mut g = self.inner.write();
        if let Some(prev) = g.by_id.get_mut(&old) {
            prev.effective_until_tick = Some(effective_from_tick);
            if matches!(prev.effect, LawEffect::PerCitizenBenefit { .. }) {
                g.repeal_debt += g.scaled_debt(0.05);
            }
        }
        let mut new = new;
        if new.id.0 == 0 {
            g.next_id += 1;
            new.id = LawId(g.next_id);
        }
        new.effective_from_tick = effective_from_tick;
        let id = new.id;
        g.by_id.insert(id, new);
        id
    }

    /// Outright repeal (no replacement). Adds full debt for benefit laws.
    pub fn repeal(&self, id: LawId, tick: u64) {
        let mut g = self.inner.write();
        if let Some(prev) = g.by_id.get_mut(&id) {
            prev.effective_until_tick = Some(tick);
            if matches!(prev.effect, LawEffect::PerCitizenBenefit { .. }) {
                g.repeal_debt += g.scaled_debt(0.10);
            }
        }
    }

    /// Update the crisis cost multiplier (called each tick by crisis_link_system).
    pub fn set_crisis_cost_multiplier(&self, multiplier: f32) {
        self.inner.write().crisis_cost_multiplier = multiplier;
    }

    /// Drain accumulated legitimacy-debt magnitude (called by the update system).
    pub fn drain_repeal_debt(&self) -> f32 {
        let mut g = self.inner.write();
        let d = g.repeal_debt;
        g.repeal_debt = 0.0;
        d
    }

    pub fn snapshot_active(&self, tick: u64) -> Vec<LawHandle> {
        let g = self.inner.read();
        g.by_id
            .values()
            .filter(|h| {
                tick >= h.effective_from_tick
                    && h.effective_until_tick.is_none_or(|u| tick < u)
            })
            .cloned()
            .collect()
    }

    /// Returns a clone of the handle with the given id, regardless of whether
    /// it is currently active. Returns `None` if no such id exists.
    pub fn get_handle(&self, id: LawId) -> Option<LawHandle> {
        self.inner.read().by_id.get(&id).cloned()
    }

    /// Returns clones of every handle (active and repealed) in the registry.
    pub fn snapshot_all(&self) -> Vec<LawHandle> {
        self.inner.read().by_id.values().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dsl::ast::{Program, Scope};
    use crate::system::Cadence;
    use std::sync::Arc;

    fn stub_prog() -> Arc<Program> {
        Arc::new(Program { scopes: vec![Scope { name: "T".into(), params: vec![], items: vec![] }] })
    }

    fn income_tax(id: u64) -> LawHandle {
        LawHandle {
            source: None,
            id: LawId(id),
            version: 1,
            program: stub_prog(),
            cadence: Cadence::Yearly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::PerCitizenIncomeTax { scope: "T", owed_def: "t" },
        }
    }

    fn benefit(id: u64) -> LawHandle {
        LawHandle {
            source: None,
            id: LawId(id),
            version: 1,
            program: stub_prog(),
            cadence: Cadence::Monthly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::PerCitizenBenefit { scope: "T", amount_def: "a" },
        }
    }

    // ── enact ──────────────────────────────────────────────────────────────────

    #[test]
    fn enact_auto_assigns_id_when_zero() {
        let reg = LawRegistry::default();
        let id = reg.enact(income_tax(0)); // id.0 == 0 → auto-assign
        assert_ne!(id.0, 0, "enact should assign a non-zero id");
    }

    #[test]
    fn enact_preserves_nonzero_id() {
        let reg = LawRegistry::default();
        let id = reg.enact(income_tax(42));
        assert_eq!(id.0, 42, "enact should preserve the given non-zero id");
    }

    #[test]
    fn enact_increments_id_on_each_auto_call() {
        let reg = LawRegistry::default();
        let id1 = reg.enact(income_tax(0));
        let id2 = reg.enact(income_tax(0));
        assert_ne!(id1.0, id2.0, "consecutive enacts should give different ids");
        assert!(id2.0 > id1.0, "ids should be monotonically increasing");
    }

    // ── repeal ─────────────────────────────────────────────────────────────────

    #[test]
    fn repeal_benefit_law_adds_010_debt() {
        let reg = LawRegistry::default();
        let id = reg.enact(benefit(0));
        reg.repeal(id, 30);
        let debt = reg.drain_repeal_debt();
        assert!((debt - 0.10).abs() < 1e-6, "repeal of benefit should add 0.10 debt, got {debt}");
    }

    #[test]
    fn repeal_income_tax_adds_no_debt() {
        let reg = LawRegistry::default();
        let id = reg.enact(income_tax(0));
        reg.repeal(id, 30);
        let debt = reg.drain_repeal_debt();
        assert!(debt.abs() < 1e-6, "repeal of income tax should not add debt, got {debt}");
    }

    #[test]
    fn repeal_sets_effective_until_tick() {
        let reg = LawRegistry::default();
        let id = reg.enact(income_tax(0));
        reg.repeal(id, 120);
        let handle = reg.get_handle(id).unwrap();
        assert_eq!(handle.effective_until_tick, Some(120));
    }

    // ── drain_repeal_debt ──────────────────────────────────────────────────────

    #[test]
    fn drain_resets_debt_to_zero() {
        let reg = LawRegistry::default();
        let id = reg.enact(benefit(0));
        reg.repeal(id, 30);
        let first = reg.drain_repeal_debt();
        assert!(first > 0.0, "first drain should be positive");
        let second = reg.drain_repeal_debt();
        assert!(second.abs() < 1e-6, "second drain with no new repeals should be 0");
    }

    // ── supersede ─────────────────────────────────────────────────────────────

    #[test]
    fn supersede_benefit_adds_005_debt() {
        let reg = LawRegistry::default();
        let old_id = reg.enact(benefit(0));
        reg.supersede(old_id, benefit(0), 60);
        let debt = reg.drain_repeal_debt();
        assert!((debt - 0.05).abs() < 1e-6, "supersede of benefit should add 0.05 debt, got {debt}");
    }

    #[test]
    fn supersede_sets_old_effective_until() {
        let reg = LawRegistry::default();
        let old_id = reg.enact(income_tax(0));
        reg.supersede(old_id, income_tax(0), 90);
        let old_handle = reg.get_handle(old_id).unwrap();
        assert_eq!(old_handle.effective_until_tick, Some(90));
    }

    // ── snapshot_active ────────────────────────────────────────────────────────

    #[test]
    fn snapshot_active_excludes_repealed_laws() {
        let reg = LawRegistry::default();
        let id = reg.enact(income_tax(0));
        reg.repeal(id, 30); // law expires at tick 30
        // At tick 29 the law is still active.
        assert_eq!(reg.snapshot_active(29).len(), 1, "law still active before expiry tick");
        // At tick 30 the law has expired.
        assert_eq!(reg.snapshot_active(30).len(), 0, "law should be expired at its until tick");
    }

    #[test]
    fn snapshot_active_excludes_future_laws() {
        let reg = LawRegistry::default();
        let mut h = income_tax(0);
        h.effective_from_tick = 100;
        reg.enact(h);
        assert_eq!(reg.snapshot_active(50).len(), 0, "future law should not be active yet");
        assert_eq!(reg.snapshot_active(100).len(), 1, "law should be active at its from tick");
    }

    // ── crisis cost multiplier ─────────────────────────────────────────────────

    #[test]
    fn crisis_multiplier_reduces_debt() {
        let reg = LawRegistry::default();
        // Set multiplier to 0.3 (active crisis — emergency measures cost less).
        reg.set_crisis_cost_multiplier(0.3);
        let id = reg.enact(benefit(0));
        reg.repeal(id, 0);
        let debt = reg.drain_repeal_debt();
        // Expected: 0.10 × 0.3 = 0.03.
        assert!((debt - 0.03).abs() < 1e-6, "crisis should reduce repeal debt to 0.03, got {debt}");
    }

    #[test]
    fn zero_multiplier_falls_back_to_one() {
        // multiplier == 0.0 → treat as 1.0 (guard in scaled_debt).
        let reg = LawRegistry::default();
        reg.set_crisis_cost_multiplier(0.0);
        let id = reg.enact(benefit(0));
        reg.repeal(id, 0);
        let debt = reg.drain_repeal_debt();
        assert!((debt - 0.10).abs() < 1e-6, "zero multiplier should fall back to 1.0, got {debt}");
    }

    // ── get_handle / snapshot_all ──────────────────────────────────────────────

    #[test]
    fn get_handle_returns_none_for_unknown_id() {
        let reg = LawRegistry::default();
        assert!(reg.get_handle(LawId(999)).is_none());
    }

    #[test]
    fn snapshot_all_includes_repealed_laws() {
        let reg = LawRegistry::default();
        let id = reg.enact(income_tax(0));
        reg.repeal(id, 10);
        // snapshot_active excludes it, snapshot_all includes it.
        assert_eq!(reg.snapshot_active(10).len(), 0);
        assert_eq!(reg.snapshot_all().len(), 1, "snapshot_all should include repealed law");
    }
}
