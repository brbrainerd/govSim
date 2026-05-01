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
}

#[derive(Resource, Default, Clone)]
pub struct LawRegistry {
    inner: Arc<RwLock<RegistryInner>>,
}

#[derive(Default)]
struct RegistryInner {
    by_id: HashMap<LawId, LawHandle>,
    next_id: u64,
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
    pub fn supersede(&self, old: LawId, new: LawHandle, effective_from_tick: u64) -> LawId {
        let mut g = self.inner.write();
        if let Some(prev) = g.by_id.get_mut(&old) {
            prev.effective_until_tick = Some(effective_from_tick);
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
}
