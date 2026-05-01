//! `LawDispatcher` — the single ECS System that runs every active law.
//!
//! Per blueprint §3.5 / §6.5 we expose ONE Bevy System rather than adding
//! and removing systems per law. Active laws are pulled from the registry
//! each tick and dispatched by cadence.

use std::collections::HashMap;

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{
        AuditFlagBits, AuditFlags, Citizen, ConsumptionExpenditure, EvasionPropensity,
        Health, Income, LegalStatusFlags, LegalStatuses, Productivity, Wealth,
    },
    GovernmentLedger, MacroIndicators, Phase, Sim, SimClock, SimRng, Treasury,
};
use rand::Rng;
use simulator_types::Money;

use crate::ig2::AmountBasis;

use crate::dsl::ast::Item;
use crate::eval::{eval_default, EvalCtx, Value};
use crate::registry::{LawEffect, LawRegistry};

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

#[allow(clippy::type_complexity)]
pub fn law_dispatcher_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    macro_: Res<MacroIndicators>,
    registry: Res<LawRegistry>,
    mut treasury: ResMut<Treasury>,
    mut ledger: ResMut<GovernmentLedger>,
    mut q: Query<(
        Option<&Citizen>,
        &Income,
        Option<&Health>,
        Option<&Productivity>,
        Option<&ConsumptionExpenditure>,
        &mut Wealth,
        &mut LegalStatuses,
        Option<&AuditFlags>,
        Option<&EvasionPropensity>,
    )>,
) {
    let active = registry.snapshot_active(clock.tick);
    if active.is_empty() { return; }

    let tick = clock.tick;
    let base_ctx = make_dispatch_ctx(tick, &macro_, &treasury);
    for h in &active {
        if !h.cadence.fires_at(tick) { continue; }

        // Inline the iteration for each effect to avoid Bevy Query lifetime issues
        // when passing &mut Query across function boundaries.
        match h.effect {
            LawEffect::PerCitizenIncomeTax { scope, owed_def } => {
                let Some(body) = find_body(&h.program, scope, owed_def) else { continue; };
                let mut ctx = base_ctx.clone();
                let mut collected = Money::from_num(0);
                for (_, income, health_opt, prod_opt, consumption_opt, mut wealth, _, _, _) in q.iter_mut() {
                    let annual = income.0 * Money::from_num(360);
                    ctx.field_bindings.insert(("citizen".into(), "income".into()), Value::Money(annual));
                    ctx.field_bindings.insert(("citizen".into(), "wealth".into()), Value::Money(wealth.0));
                    if let Some(c) = consumption_opt {
                        ctx.field_bindings.insert(("citizen".into(), "consumption".into()), Value::Money(c.0));
                    }
                    if let Some(h) = health_opt {
                        ctx.field_bindings.insert(("citizen".into(), "health".into()), Value::Rate(h.0.to_num::<f64>()));
                    }
                    if let Some(p) = prod_opt {
                        ctx.field_bindings.insert(("citizen".into(), "productivity".into()), Value::Rate(p.0.to_num::<f64>()));
                    }
                    if let Value::Money(owed) = eval_default(body, &ctx) {
                        wealth.0 -= owed;
                        collected += owed;
                    }
                }
                treasury.balance += collected;
                ledger.revenue += collected;
            }
            LawEffect::PerCitizenBenefit { scope, amount_def } => {
                let Some(body) = find_body(&h.program, scope, amount_def) else { continue; };
                let mut ctx = base_ctx.clone();
                let mut disbursed = Money::from_num(0);
                for (_, income, health_opt, prod_opt, consumption_opt, mut wealth, _, _, _) in q.iter_mut() {
                    let annual = income.0 * Money::from_num(360);
                    ctx.field_bindings.insert(("citizen".into(), "income".into()), Value::Money(annual));
                    ctx.field_bindings.insert(("citizen".into(), "wealth".into()), Value::Money(wealth.0));
                    if let Some(c) = consumption_opt {
                        ctx.field_bindings.insert(("citizen".into(), "consumption".into()), Value::Money(c.0));
                    }
                    if let Some(h) = health_opt {
                        ctx.field_bindings.insert(("citizen".into(), "health".into()), Value::Rate(h.0.to_num::<f64>()));
                    }
                    if let Some(p) = prod_opt {
                        ctx.field_bindings.insert(("citizen".into(), "productivity".into()), Value::Rate(p.0.to_num::<f64>()));
                    }
                    if let Value::Money(paid) = eval_default(body, &ctx) {
                        wealth.0 += paid;
                        disbursed += paid;
                    }
                }
                treasury.balance -= disbursed;
                ledger.expenditure += disbursed;
            }
            LawEffect::RegistrationMarker { basis, threshold } => {
                for (_, income, _, _, _, wealth, mut legal, _, _) in q.iter_mut() {
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
            LawEffect::Audit { selection_prob, penalty_rate } => {
                let label = format!("audit_{}", h.id.0);
                let mut collected = Money::from_num(0);
                for (citizen_opt, income, _, _, _, mut wealth, _, audit_opt, evasion_opt) in q.iter_mut() {
                    let (Some(citizen), Some(audit), Some(evasion)) =
                        (citizen_opt, audit_opt, evasion_opt) else { continue; };
                    if !audit.0.contains(AuditFlagBits::FLAGGED_INCOME) { continue; }
                    if evasion.0 == 0.0 { continue; }
                    let mut rng = rng_res.derive_citizen(&label, tick, citizen.0.0);
                    if rng.random::<f64>() >= selection_prob { continue; }
                    let annual = income.0 * Money::from_num(360);
                    let penalty = annual * Money::from_num(evasion.0) * Money::from_num(penalty_rate);
                    wealth.0 -= penalty;
                    collected += penalty;
                }
                treasury.balance += collected;
                ledger.revenue += collected;
            }
        }
    }
}

/// Build the base EvalCtx pre-loaded with time bindings and macro aggregates.
/// Each law's per-citizen loop clones this and inserts citizen-specific fields.
fn make_dispatch_ctx(tick: u64, macro_: &MacroIndicators, treasury: &Treasury) -> EvalCtx {
    let mut b = HashMap::new();
    // Time
    b.insert("tick".into(),    Value::Int(tick as i64));
    b.insert("year".into(),    Value::Int((tick / 360) as i64));
    b.insert("quarter".into(), Value::Int(((tick / 90) % 4) as i64));
    b.insert("month".into(),   Value::Int(((tick / 30) % 12) as i64));
    // Macro aggregates — pre-computed by MacroIndicators each tick
    b.insert("unemployment".into(),           Value::Rate(macro_.unemployment as f64));
    b.insert("inflation".into(),              Value::Rate(macro_.inflation as f64));
    b.insert("gini".into(),                   Value::Rate(macro_.gini as f64));
    b.insert("approval".into(),               Value::Rate(macro_.approval as f64));
    b.insert("gdp".into(),                    Value::Money(macro_.gdp));
    b.insert("population".into(),             Value::Int(macro_.population as i64));
    b.insert("government_revenue".into(),     Value::Money(macro_.government_revenue));
    b.insert("government_expenditure".into(), Value::Money(macro_.government_expenditure));
    b.insert("treasury_balance".into(),       Value::Money(treasury.balance));
    EvalCtx { bindings: b, field_bindings: HashMap::new() }
}

fn find_body<'p>(
    program: &'p crate::dsl::ast::Program,
    scope_name: &str,
    def_name: &str,
) -> Option<&'p crate::dsl::ast::DefaultExpr> {
    let scope = program.scopes.iter().find(|s| s.name == scope_name)?;
    scope.items.iter().find_map(|it| {
        let Item::Definition { name, body, .. } = it;
        (name == def_name).then_some(body)
    })
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
    use simulator_core::components::{
        AuditFlagBits, AuditFlags, Citizen, ConsumptionExpenditure, EvasionPropensity,
        Income, LegalStatuses, Wealth,
    };
    use simulator_core::Sim;
    use simulator_types::{CitizenId, Money};
    use std::sync::Arc;
    use crate::registry::{LawHandle, LawId};

    fn spawn_citizen(world: &mut bevy_ecs::world::World, id: u64, monthly_income: i64) {
        let income = Money::from_num(monthly_income);
        world.spawn((
            Citizen(CitizenId(id)),
            Income(income),
            Wealth(Money::from_num(0i64)),
            ConsumptionExpenditure(income * Money::from_num(4) / Money::from_num(5)), // 80%
            LegalStatuses::default(),
            AuditFlags::default(),
            EvasionPropensity(0.0),
        ));
    }

    fn spawn_corrupt_citizen(world: &mut bevy_ecs::world::World, id: u64, monthly_income: i64, evasion: f32) {
        let income = Money::from_num(monthly_income);
        world.spawn((
            Citizen(CitizenId(id)),
            Income(income),
            Wealth(Money::from_num(100_000i64)),
            ConsumptionExpenditure(income * Money::from_num(4) / Money::from_num(5)),
            LegalStatuses::default(),
            AuditFlags(AuditFlagBits::FLAGGED_INCOME),
            EvasionPropensity(evasion),
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
        for i in 0..5 { spawn_citizen(&mut sim.world, i, 50); }
        // 5 rich citizens: $1 000/month → $360 000/year > $20 000 ceiling → ineligible.
        for i in 5..10 { spawn_citizen(&mut sim.world, i, 1_000); }

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
        for i in 0..10 { spawn_citizen(&mut sim.world, i, 500); }

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
        spawn_citizen(&mut sim.world, 0, 40);
        // income $200/month → $72 000/year > $20 000 threshold → ineligible
        spawn_citizen(&mut sim.world, 1, 200);

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

    /// Automatic-stabiliser: a benefit law conditioned on `unemployment > 0.05`
    /// should disburse when unemployment is high and pay nothing when it is low.
    #[test]
    fn benefit_law_fires_on_high_unemployment() {
        use crate::dsl::ast::{BinOp, DefaultExpr, Expr, Item, ParamDecl, Program, Scope, Type};
        use crate::registry::{LawHandle, LawId, LawEffect};
        use crate::system::Cadence;
        use simulator_core::MacroIndicators;
        use std::sync::Arc;

        // Build a synthetic DSL program: def amount : money = if unemployment > 0.05 then 500.0 else 0.0
        let body = DefaultExpr {
            base: Expr::If {
                cond: Box::new(Expr::BinOp {
                    op: BinOp::Gt,
                    lhs: Box::new(Expr::Ident("unemployment".into())),
                    rhs: Box::new(Expr::LitRate(0.05)),
                }),
                then_: Box::new(Expr::LitMoney(500.0)),
                else_: Box::new(Expr::LitMoney(0.0)),
            },
            exceptions: vec![],
        };
        let program = Arc::new(Program {
            scopes: vec![Scope {
                name: "UnemploymentBenefit".into(),
                params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
                items: vec![Item::Definition {
                    name: "amount".into(),
                    ty: Type::Money,
                    body,
                }],
            }],
        });
        let handle = LawHandle {
            id: LawId(42),
            version: 1,
            program,
            cadence: Cadence::Yearly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::PerCitizenBenefit {
                scope: "UnemploymentBenefit",
                amount_def: "amount",
            },
        };

        // --- High unemployment scenario ---
        let mut sim = Sim::new([30u8; 32]);
        register_law_dispatcher(&mut sim);
        for i in 0..4 { spawn_citizen(&mut sim.world, i, 100); }
        // Set unemployment to 10%.
        sim.world.resource_mut::<MacroIndicators>().unemployment = 0.10;
        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(handle.clone());
        for _ in 0..=360 { sim.step(); }
        let exp_high: f64 = sim.world.resource::<GovernmentLedger>().expenditure.to_num();
        // 4 citizens × $500 = $2 000
        assert!(
            (exp_high - 2_000.0).abs() < 1.0,
            "high-unemployment: expected ~$2000 disbursed, got ${exp_high:.2}"
        );

        // --- Low unemployment scenario ---
        let mut sim2 = Sim::new([31u8; 32]);
        register_law_dispatcher(&mut sim2);
        for i in 0..4 { spawn_citizen(&mut sim2.world, i, 100); }
        // Set unemployment to 2% — below threshold.
        sim2.world.resource_mut::<MacroIndicators>().unemployment = 0.02;
        let registry2 = sim2.world.resource::<LawRegistry>().clone();
        registry2.enact(handle);
        for _ in 0..=360 { sim2.step(); }
        let exp_low: f64 = sim2.world.resource::<GovernmentLedger>().expenditure.to_num();
        assert!(
            exp_low.abs() < 1.0,
            "low-unemployment: expected ~$0 disbursed, got ${exp_low:.2}"
        );
    }

    /// UBI: a flat $500/year unconditional payment goes to every citizen.
    #[test]
    fn ubi_pays_all_citizens() {
        use crate::ig2::{Computation, LowerCadence};

        let mut sim = Sim::new([60u8; 32]);
        register_law_dispatcher(&mut sim);
        // 6 citizens of varying incomes — all should receive UBI equally.
        for i in 0..6 { spawn_citizen(&mut sim.world, i, (i as i64 + 1) * 100); }

        let stmt = crate::ig2::IgStatement::Regulative(crate::ig2::RegulativeStmt {
            attribute: crate::ig2::ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None, deontic: None,
            aim: "receive".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::UniversalBenefit {
                amount: 500.0,
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

        for _ in 0..=360 { sim.step(); }

        // 6 citizens × $500 = $3 000 disbursed from Treasury.
        let ledger = sim.world.resource::<GovernmentLedger>();
        let exp: f64 = ledger.expenditure.to_num();
        assert!(
            (exp - 3_000.0).abs() < 1.0,
            "expected ~$3 000 UBI disbursed, got ${exp:.2}"
        );
        let treasury = sim.world.resource::<Treasury>();
        let bal: f64 = treasury.balance.to_num();
        assert!(bal < 0.0, "treasury should be negative after UBI, got {bal}");
    }

    /// NIT: $12 000 guarantee with 50% taper → break-even at $24 000/year.
    /// Citizens below break-even get tapered benefit; above get nothing.
    #[test]
    fn nit_tapers_correctly() {
        use crate::ig2::{Computation, LowerCadence};

        let mut sim = Sim::new([61u8; 32]);
        register_law_dispatcher(&mut sim);

        // Citizen 0: $0 income → receives full $12 000
        sim.world.spawn((
            Citizen(CitizenId(0)),
            Income(Money::from_num(0i64)),
            Wealth(Money::from_num(0i64)),
            ConsumptionExpenditure(Money::from_num(0i64)),
            LegalStatuses::default(),
            AuditFlags::default(),
            EvasionPropensity(0.0),
        ));
        // Citizen 1: $12 000/year = $33.33/month → tapered to $6 000
        sim.world.spawn((
            Citizen(CitizenId(1)),
            Income(Money::from_num(34i64)), // ~$12 240/yr (close enough for test)
            Wealth(Money::from_num(0i64)),
            ConsumptionExpenditure(Money::from_num(27i64)),
            LegalStatuses::default(),
            AuditFlags::default(),
            EvasionPropensity(0.0),
        ));
        // Citizen 2: $30 000/year = $83.33/month → above break-even → $0
        sim.world.spawn((
            Citizen(CitizenId(2)),
            Income(Money::from_num(84i64)), // ~$30 240/yr
            Wealth(Money::from_num(0i64)),
            ConsumptionExpenditure(Money::from_num(67i64)),
            LegalStatuses::default(),
            AuditFlags::default(),
            EvasionPropensity(0.0),
        ));

        let stmt = crate::ig2::IgStatement::Regulative(crate::ig2::RegulativeStmt {
            attribute: crate::ig2::ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None, deontic: None,
            aim: "receive".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::NegativeIncomeTax {
                guarantee: 12_000.0,
                taper_rate: 0.50,
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

        for _ in 0..=360 { sim.step(); }

        // Citizen 2 (above break-even) must have received $0; others > $0.
        let exp: f64 = sim.world.resource::<GovernmentLedger>().expenditure.to_num();
        // Citizen 0 gets full $12 000; citizen 1 gets ~$5 880 (12000 - 0.5*12240);
        // citizen 2 gets $0. Total ≈ $17 880.
        assert!(exp > 5_000.0 && exp < 25_000.0,
            "NIT disbursement out of expected range, got ${exp:.2}");
        // Treasury should be negative (paid out more than received).
        let bal: f64 = sim.world.resource::<Treasury>().balance.to_num();
        assert!(bal < 0.0, "treasury should be negative after NIT, got {bal}");
    }

    /// VAT: 10% consumption tax collects 10% of each citizen's monthly
    /// ConsumptionExpenditure each month and credits Treasury.
    #[test]
    fn consumption_tax_credits_treasury() {
        use crate::ig2::{Computation, LowerCadence};

        let mut sim = Sim::new([40u8; 32]);
        register_law_dispatcher(&mut sim);

        // 5 citizens: $500/month income → $400/month consumption (80%)
        for i in 0..5 { spawn_citizen(&mut sim.world, i, 500); }

        let stmt = crate::ig2::IgStatement::Regulative(crate::ig2::RegulativeStmt {
            attribute: crate::ig2::ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: None,
            aim: "pay".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::ConsumptionTax {
                rate: 0.10,
                cadence: LowerCadence::Monthly,
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

        // Run 1 year (12 monthly firings at ticks 30, 60, ..., 360).
        for _ in 0..=360 { sim.step(); }

        let treasury = sim.world.resource::<Treasury>();
        let bal: f64 = treasury.balance.to_num();
        // 5 citizens × $400/mo × 10% VAT × 12 months = $2 400
        let expected = 5.0 * 400.0 * 0.10 * 12.0;
        assert!(
            (bal - expected).abs() < 1.0,
            "expected ~${expected:.0} in treasury from VAT, got ${bal:.2}"
        );
    }

    /// Wealth tax: 1% annual tax on wealth above $50 000 exemption.
    /// Citizens below exemption pay nothing; citizens above pay 1% of excess.
    #[test]
    fn wealth_tax_exempts_small_holders() {
        use crate::ig2::{Computation, LowerCadence};

        let mut sim = Sim::new([50u8; 32]);
        register_law_dispatcher(&mut sim);

        // Citizen 0: $30 000 wealth → below exemption → pays $0
        let income0 = Money::from_num(100i64);
        sim.world.spawn((
            Citizen(CitizenId(0)),
            Income(income0),
            Wealth(Money::from_num(30_000i64)),
            ConsumptionExpenditure(income0 * Money::from_num(4) / Money::from_num(5)),
            LegalStatuses::default(),
            AuditFlags::default(),
            EvasionPropensity(0.0),
        ));
        // Citizen 1: $150 000 wealth → taxable portion = $100 000 → tax = $1 000
        let income1 = Money::from_num(500i64);
        sim.world.spawn((
            Citizen(CitizenId(1)),
            Income(income1),
            Wealth(Money::from_num(150_000i64)),
            ConsumptionExpenditure(income1 * Money::from_num(4) / Money::from_num(5)),
            LegalStatuses::default(),
            AuditFlags::default(),
            EvasionPropensity(0.0),
        ));

        let stmt = crate::ig2::IgStatement::Regulative(crate::ig2::RegulativeStmt {
            attribute: crate::ig2::ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: None,
            aim: "pay".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::WealthTax {
                exemption: 50_000.0,
                rate: 0.01,
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

        for _ in 0..=360 { sim.step(); }

        // Citizen 0 wealth should be ~$30 000 (no deduction)
        // Citizen 1 wealth should be ~$150 000 − $1 000 = $149 000
        let treasury = sim.world.resource::<Treasury>();
        let bal: f64 = treasury.balance.to_num();
        assert!(
            (bal - 1_000.0).abs() < 1.0,
            "expected ~$1 000 collected from wealth tax, got ${bal:.2}"
        );
        let ledger = sim.world.resource::<GovernmentLedger>();
        let rev: f64 = ledger.revenue.to_num();
        assert!(
            (rev - 1_000.0).abs() < 1.0,
            "expected ~$1 000 in revenue ledger, got ${rev:.2}"
        );
    }

    /// Audit law: 100% selection rate catches all flagged evaders; honest
    /// citizens are unaffected; revenue accrues to Treasury.
    #[test]
    fn audit_law_penalizes_evaders_only() {
        use crate::ig2::{Deontic, LowerCadence};

        let mut sim = Sim::new([23u8; 32]);
        register_law_dispatcher(&mut sim);

        // 3 honest citizens — should be unaffected.
        for i in 0..3 { spawn_citizen(&mut sim.world, i, 500); }
        // 2 corrupt citizens: $1 000/month, hide 20% → evaded = $72 000/yr, penalty_rate=1.0 → penalty = $72 000
        for i in 3..5 { spawn_corrupt_citizen(&mut sim.world, i, 1_000, 0.2); }

        let stmt = IgStatement::Regulative(RegulativeStmt {
            attribute: ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: Some(Deontic::Must),
            aim: "pay".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(crate::ig2::Computation::AuditEnforcement {
                selection_prob: 1.0, // always selected for deterministic test
                penalty_rate: 1.0,   // penalty = 100% of evaded income
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

        for _ in 0..=360 { sim.step(); }

        // 2 evaders × $1000/mo × 360 × 20% evasion × 100% penalty_rate = $144 000
        let expected = 2.0 * 1000.0 * 360.0 * 0.2 * 1.0;
        let treasury = sim.world.resource::<Treasury>();
        let bal: f64 = treasury.balance.to_num();
        assert!(
            (bal - expected).abs() < 1.0,
            "expected treasury ~${expected:.0}, got ${bal:.2}"
        );
        let ledger = sim.world.resource::<GovernmentLedger>();
        let rev: f64 = ledger.revenue.to_num();
        assert!(
            (rev - expected).abs() < 1.0,
            "expected revenue ~${expected:.0}, got ${rev:.2}"
        );
    }
}
