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
