//! `LawDispatcher` — the single ECS System that runs every active law.
//!
//! Per blueprint §3.5 / §6.5 we expose ONE Bevy System rather than adding
//! and removing systems per law. Active laws are pulled from the registry
//! each tick and dispatched by cadence.

use std::collections::HashMap;

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Income, LegalStatusFlags, LegalStatuses, Wealth},
    GovernmentLedger, Phase, Sim, SimClock, Treasury,
};
use simulator_types::Money;

use crate::ig2::AmountBasis;

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
            Cadence::Monthly => tick.is_multiple_of(30),
            Cadence::Quarterly => tick.is_multiple_of(90),
            Cadence::Yearly => tick.is_multiple_of(360),
            Cadence::EventDriven => false,
        }
    }
}

pub fn law_dispatcher_system(
    clock: Res<SimClock>,
    registry: Res<LawRegistry>,
    mut treasury: ResMut<Treasury>,
    mut ledger: ResMut<GovernmentLedger>,
    mut q: Query<(&Income, &mut Wealth, &mut LegalStatuses)>,
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
            LawEffect::RegistrationMarker { basis, threshold } => {
                run_registration_law(basis, threshold, &mut q);
            }
        }
    }
}

fn run_income_tax_law(
    h: &LawHandle,
    scope_name: &str,
    owed_name: &str,
    treasury: &mut Treasury,
    q: &mut Query<(&Income, &mut Wealth, &mut LegalStatuses)>,
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
    for (income, mut wealth, _) in q.iter_mut() {
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
    q: &mut Query<(&Income, &mut Wealth, &mut LegalStatuses)>,
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
    for (income, mut wealth, _) in q.iter_mut() {
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

fn run_registration_law(
    basis: AmountBasis,
    threshold: f64,
    q: &mut Query<(&Income, &mut Wealth, &mut LegalStatuses)>,
) {
    for (income, wealth, mut legal) in q.iter_mut() {
        let value: f64 = match basis {
            AmountBasis::AnnualIncome => income.0.to_num::<f64>() * 360.0,
            AmountBasis::Wealth => wealth.0.to_num::<f64>(),
        };
        if value < threshold {
            legal.0.insert(LegalStatusFlags::REGISTERED_VOTER);
        } else {
            legal.0.remove(LegalStatusFlags::REGISTERED_VOTER);
        }
    }
}

pub fn register_law_dispatcher(sim: &mut Sim) {
    sim.world.insert_resource(LawRegistry::default());
    sim.schedule_mut()
        .add_systems(law_dispatcher_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ig2::{
        ActorRef, AmountBasis, Computation, LowerCadence, RegulativeStmt,
    };
    use crate::ig2::IgStatement;
    use crate::lower::lower_statement;
    use simulator_core::components::{Income, LegalStatuses, Wealth};
    use simulator_core::Sim;
    use simulator_types::Money;
    use std::sync::Arc;
    use crate::registry::{LawHandle, LawId};

    fn spawn_citizen(world: &mut bevy_ecs::world::World, monthly_income: i64) {
        world.spawn((
            Income(Money::from_num(monthly_income)),
            Wealth(Money::from_num(0i64)),
            LegalStatuses::default(),
        ));
    }

    fn make_means_tested_benefit() -> LawHandle {
        let stmt = IgStatement::Regulative(RegulativeStmt {
            attribute: ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: None,
            aim: "receive".into(),
            direct_object: None,
            direct_object_property: None,
            indirect_object: None,
            indirect_object_property: None,
            activation_conditions: vec![],
            execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::MeansTestedBenefit {
                basis: AmountBasis::AnnualIncome,
                // Citizens earning < $20 000/year (= < $55.56/month) are eligible.
                income_ceiling: 20_000.0,
                taper_floor: None,
                amount: 5_000.0,
                cadence: LowerCadence::Yearly,
            }),
        });
        let lowered = lower_statement(&stmt).expect("lowering failed");
        LawHandle {
            id: LawId(0),
            version: 1,
            program: Arc::new(lowered.program),
            cadence: lowered.cadence,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: lowered.effect,
        }
    }

    /// Enacting a means-tested benefit should disburse payments to eligible
    /// (low-income) citizens and leave ineligible (high-income) citizens alone.
    #[test]
    fn benefit_law_disburses_to_eligible_citizens() {
        let mut sim = Sim::new([20u8; 32]);
        register_law_dispatcher(&mut sim);

        // 5 poor citizens: $50/month → $18 000/year < $20 000 ceiling → eligible.
        for _ in 0..5 { spawn_citizen(&mut sim.world, 50); }
        // 5 rich citizens: $1 000/month → $360 000/year > $20 000 ceiling → ineligible.
        for _ in 0..5 { spawn_citizen(&mut sim.world, 1_000); }

        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(make_means_tested_benefit());

        // One full year: Yearly cadence fires at tick 360.
        for _ in 0..=360 { sim.step(); }

        let ledger = sim.world.resource::<GovernmentLedger>();
        let exp: f64 = ledger.expenditure.to_num();
        // 5 eligible citizens × $5 000 = $25 000.
        assert!(
            (exp - 25_000.0).abs() < 1.0,
            "expected ~$25 000 disbursed, got ${exp:.2}"
        );

        let treasury = sim.world.resource::<Treasury>();
        let bal: f64 = treasury.balance.to_num();
        assert!(bal < 0.0, "treasury should be negative after paying benefits, got {bal}");
    }

    /// Income-tax law should credit Treasury and accumulate in GovernmentLedger.revenue.
    #[test]
    fn income_tax_law_credits_treasury() {
        use crate::ig2::{Deontic, TaxBracket};

        let mut sim = Sim::new([21u8; 32]);
        register_law_dispatcher(&mut sim);

        // 10 citizens with $500/month → $180 000/year (above the tax threshold).
        for _ in 0..10 { spawn_citizen(&mut sim.world, 500); }

        let stmt = IgStatement::Regulative(RegulativeStmt {
            attribute: ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: Some(Deontic::Must),
            aim: "pay".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::BracketedTax {
                basis: AmountBasis::AnnualIncome,
                threshold: 0.0,
                brackets: vec![
                    TaxBracket { floor: 0.0, ceil: None, rate: 0.20 },
                ],
                cadence: LowerCadence::Yearly,
            }),
        });
        let lowered = lower_statement(&stmt).expect("lowering");
        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(LawHandle {
            id: LawId(0), version: 1,
            program: Arc::new(lowered.program),
            cadence: lowered.cadence,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: lowered.effect,
        });

        for _ in 0..=360 { sim.step(); }

        let ledger = sim.world.resource::<GovernmentLedger>();
        let rev: f64 = ledger.revenue.to_num();
        // 10 citizens × $180 000/year × 20% = $360 000 expected.
        assert!(
            (rev - 360_000.0).abs() < 1.0,
            "expected ~$360 000 in revenue, got ${rev:.2}"
        );

        let treasury = sim.world.resource::<Treasury>();
        let bal: f64 = treasury.balance.to_num();
        assert!(bal > 0.0, "treasury should be positive after collecting tax, got {bal}");
    }

    /// RegistrationMarker law: citizens with annual income < threshold gain
    /// REGISTERED_VOTER; those above lose it.
    #[test]
    fn registration_law_sets_voter_flag() {
        use simulator_core::components::LegalStatusFlags;
        use crate::ig2::{Deontic, LowerCadence};

        let mut sim = Sim::new([22u8; 32]);
        register_law_dispatcher(&mut sim);

        // income $40/month → $14 400/year < $20 000 threshold → eligible
        spawn_citizen(&mut sim.world, 40);
        // income $200/month → $72 000/year > $20 000 threshold → ineligible
        spawn_citizen(&mut sim.world, 200);

        let stmt = crate::ig2::IgStatement::Regulative(crate::ig2::RegulativeStmt {
            attribute: crate::ig2::ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: Some(Deontic::Must),
            aim: "register".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(crate::ig2::Computation::RegistrationRequirement {
                basis: crate::ig2::AmountBasis::AnnualIncome,
                threshold: 20_000.0,
                cadence: LowerCadence::Yearly,
            }),
        });
        let lowered = crate::lower::lower_statement(&stmt).expect("lowering");
        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(LawHandle {
            id: LawId(0), version: 1,
            program: Arc::new(lowered.program),
            cadence: lowered.cadence,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: lowered.effect,
        });

        // Run one full year so the Yearly law fires at tick 360.
        for _ in 0..=360 { sim.step(); }

        let mut registered = 0u32;
        let mut unregistered = 0u32;
        sim.world
            .query::<(&Income, &LegalStatuses)>()
            .iter(&sim.world)
            .for_each(|(inc, legal)| {
                let annual: f64 = inc.0.to_num::<f64>() * 360.0;
                if annual < 20_000.0 {
                    assert!(
                        legal.0.contains(LegalStatusFlags::REGISTERED_VOTER),
                        "low-income citizen should be registered voter"
                    );
                    registered += 1;
                } else {
                    assert!(
                        !legal.0.contains(LegalStatusFlags::REGISTERED_VOTER),
                        "high-income citizen should not be registered voter"
                    );
                    unregistered += 1;
                }
            });
        assert_eq!(registered, 1);
        assert_eq!(unregistered, 1);
    }
}
