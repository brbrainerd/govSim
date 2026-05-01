//! `LawDispatcher` — the single ECS System that runs every active law.
//!
//! Per blueprint §3.5 / §6.5 we expose ONE Bevy System rather than adding
//! and removing systems per law. Active laws are pulled from the registry
//! each tick and dispatched by cadence.

use std::collections::HashMap;

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Income, Wealth},
    Phase, Sim, SimClock, Treasury,
};
use simulator_types::Money;

use crate::dsl::ast::Item;
use crate::eval::{eval_default, EvalCtx, Value};
use crate::registry::{LawEffect, LawHandle, LawRegistry};

#[derive(Copy, Clone, Debug)]
pub enum Cadence {
    EveryTick,
    Monthly,   // every 30 ticks
    Quarterly, // every 90 ticks
    Yearly,    // every 360 ticks
    EventDriven, // dispatched only by explicit triggers (Phase 5+)
}

impl Cadence {
    fn fires_at(&self, tick: u64) -> bool {
        if tick == 0 { return false; }
        match self {
            Cadence::EveryTick => true,
            Cadence::Monthly => tick % 30 == 0,
            Cadence::Quarterly => tick % 90 == 0,
            Cadence::Yearly => tick % 360 == 0,
            Cadence::EventDriven => false,
        }
    }
}

pub fn law_dispatcher_system(
    clock: Res<SimClock>,
    registry: Res<LawRegistry>,
    mut treasury: ResMut<Treasury>,
    mut q: Query<(&Income, &mut Wealth)>,
) {
    let active = registry.snapshot_active(clock.tick);
    if active.is_empty() { return; }

    for h in &active {
        if !h.cadence.fires_at(clock.tick) { continue; }
        match h.effect {
            LawEffect::PerCitizenIncomeTax { scope, owed_def } => {
                run_income_tax_law(h, scope, owed_def, &mut treasury, &mut q);
            }
        }
    }
}

fn run_income_tax_law(
    h: &LawHandle,
    scope_name: &str,
    owed_name: &str,
    treasury: &mut Treasury,
    q: &mut Query<(&Income, &mut Wealth)>,
) {
    // Find scope + the named definition body once per dispatch.
    let scope = match h.program.scopes.iter().find(|s| s.name == scope_name) {
        Some(s) => s, None => return,
    };
    let body = scope.items.iter().find_map(|it| {
        let Item::Definition { name, body, .. } = it;
        (name == owed_name).then_some(body)
    });
    let body = match body { Some(b) => b, None => return };

    let mut ctx = EvalCtx {
        bindings: HashMap::new(),
        field_bindings: HashMap::new(),
    };

    let mut collected = Money::from_num(0);
    for (income, mut wealth) in q.iter_mut() {
        ctx.field_bindings.insert(
            ("citizen".into(), "income".into()),
            Value::Money(income.0),
        );
        // Scale daily income to annual for the bracketed law (matches §6.6).
        let annual = income.0 * Money::from_num(360);
        ctx.field_bindings.insert(
            ("citizen".into(), "income".into()),
            Value::Money(annual),
        );
        let owed = match eval_default(body, &ctx) {
            Value::Money(m) => m,
            _ => continue,
        };
        wealth.0 -= owed;
        collected += owed;
    }
    treasury.balance += collected;
}

pub fn register_law_dispatcher(sim: &mut Sim) {
    sim.world.insert_resource(LawRegistry::default());
    sim.schedule_mut()
        .add_systems(law_dispatcher_system.in_set(Phase::Mutate));
}
