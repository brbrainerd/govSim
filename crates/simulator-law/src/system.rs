//! `LawDispatcher` — the single ECS System that runs every active law.
//!
//! Per blueprint §3.5 / §6.5 we expose ONE Bevy System rather than adding
//! and removing systems per law. Active laws are pulled from the registry
//! each tick and dispatched by cadence.

use std::collections::HashMap;

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Income, Wealth},
    GovernmentLedger, Phase, Sim, SimClock, Treasury,
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
    mut ledger: ResMut<GovernmentLedger>,
    mut q: Query<(&Income, &mut Wealth)>,
) {
    let active = registry.snapshot_active(clock.tick);
    if active.is_empty() { return; }

    for h in &active {
        if !h.cadence.fires_at(clock.tick) { continue; }
        match h.effect {
            LawEffect::PerCitizenIncomeTax { scope, owed_def } => {
                let collected = run_income_tax_law(h, scope, owed_def, &mut treasury, &mut q);
                ledger.revenue += collected;
            }
            LawEffect::PerCitizenBenefit { scope, amount_def } => {
                let disbursed = run_benefit_law(h, scope, amount_def, &mut treasury, &mut q);
                ledger.expenditure += disbursed;
            }
            LawEffect::RegistrationMarker => {
                // No DSL evaluation; flag-setting would use a separate query
                // on LegalStatuses. Stubbed until Phase 5 adds the voter-reg system.
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
) -> Money {
    // Find scope + the named definition body once per dispatch.
    let scope = match h.program.scopes.iter().find(|s| s.name == scope_name) {
        Some(s) => s, None => return Money::from_num(0),
    };
    let body = scope.items.iter().find_map(|it| {
        let Item::Definition { name, body, .. } = it;
        (name == owed_name).then_some(body)
    });
    let body = match body { Some(b) => b, None => return Money::from_num(0) };

    let mut ctx = EvalCtx {
        bindings: HashMap::new(),
        field_bindings: HashMap::new(),
    };

    let mut collected = Money::from_num(0);
    for (income, mut wealth) in q.iter_mut() {
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
    collected
}

fn run_benefit_law(
    h: &LawHandle,
    scope_name: &str,
    amount_name: &str,
    treasury: &mut Treasury,
    q: &mut Query<(&Income, &mut Wealth)>,
) -> Money {
    let scope = match h.program.scopes.iter().find(|s| s.name == scope_name) {
        Some(s) => s, None => return Money::from_num(0),
    };
    let body = scope.items.iter().find_map(|it| {
        let Item::Definition { name, body, .. } = it;
        (name == amount_name).then_some(body)
    });
    let body = match body { Some(b) => b, None => return Money::from_num(0) };

    let mut ctx = EvalCtx {
        bindings: HashMap::new(),
        field_bindings: HashMap::new(),
    };

    let mut disbursed = Money::from_num(0);
    for (income, mut wealth) in q.iter_mut() {
        let annual = income.0 * Money::from_num(360);
        ctx.field_bindings.insert(
            ("citizen".into(), "income".into()),
            Value::Money(annual),
        );
        let paid = match eval_default(body, &ctx) {
            Value::Money(m) => m,
            _ => continue,
        };
        wealth.0 += paid;
        disbursed += paid;
    }
    treasury.balance -= disbursed;
    disbursed
}

pub fn register_law_dispatcher(sim: &mut Sim) {
    sim.world.insert_resource(LawRegistry::default());
    sim.schedule_mut()
        .add_systems(law_dispatcher_system.in_set(Phase::Mutate));
}
