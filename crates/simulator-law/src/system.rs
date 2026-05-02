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
        Health, Income, LegalStatusFlags, LegalStatuses, MonthlyBenefitReceived,
        MonthlyTaxPaid, Productivity, Wealth,
    },
    CivicRights, CrisisState, GovernmentLedger, Judiciary, LegitimacyDebt, MacroIndicators, Phase,
    PollutionStock, RightId, RightsLedger, RightsCatalog, Sim, SimClock, SimRng, StateCapacity,
    Treasury, LEGACY_BIT_TO_ID,
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

#[allow(clippy::type_complexity, clippy::too_many_arguments)]
pub fn law_dispatcher_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    macro_: Res<MacroIndicators>,
    registry: Res<LawRegistry>,
    mut treasury: ResMut<Treasury>,
    mut ledger: ResMut<GovernmentLedger>,
    mut pollution: ResMut<PollutionStock>,
    debt: Res<LegitimacyDebt>,
    mut rights: ResMut<RightsLedger>,
    crisis: Res<CrisisState>,
    mut capacity: Option<ResMut<StateCapacity>>,
    judiciary: Option<Res<Judiciary>>,
    mut rights_catalog: Option<ResMut<RightsCatalog>>,
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
        Option<&mut MonthlyTaxPaid>,
        Option<&mut MonthlyBenefitReceived>,
    )>,
) {
    let active = registry.snapshot_active(clock.tick);

    // State-capacity multipliers. Default = 1.0 (perfect) so legacy worlds
    // without StateCapacity resource see no behavioural change.
    let tax_eff: f64 = capacity
        .as_ref()
        .map(|c| c.tax_collection_efficiency.clamp(0.0, 1.0) as f64)
        .unwrap_or(1.0);
    let bureaucratic_eff: f64 = capacity
        .as_ref()
        .map(|c| c.bureaucratic_effectiveness.clamp(0.0, 1.0) as f64)
        .unwrap_or(1.0);
    let tax_eff_money = Money::from_num(tax_eff);
    let bureau_eff_money = Money::from_num(bureaucratic_eff);

    // Reset monthly accumulators at the start of each monthly period.
    if clock.tick.is_multiple_of(30) && clock.tick != 0 {
        for (.., tax_opt, benefit_opt) in q.iter_mut() {
            if let Some(mut t) = tax_opt { t.0 = Money::from_num(0); }
            if let Some(mut b) = benefit_opt { b.0 = Money::from_num(0); }
        }
    }

    if active.is_empty() { return; }

    let tick = clock.tick;
    let base_ctx = make_dispatch_ctx(tick, &macro_, &treasury, &debt, &rights, &crisis, &pollution,
        judiciary.as_deref(), capacity.as_deref(), rights_catalog.as_deref());
    for h in &active {
        if !h.cadence.fires_at(tick) { continue; }

        // Inline the iteration for each effect to avoid Bevy Query lifetime issues
        // when passing &mut Query across function boundaries.
        match h.effect {
            LawEffect::PerCitizenIncomeTax { scope, owed_def } => {
                let Some(body) = find_body(&h.program, scope, owed_def) else { continue; };
                let mut ctx = base_ctx.clone();
                let mut collected = Money::from_num(0);
                for (_, income, health_opt, prod_opt, consumption_opt, mut wealth, _, _, _, tax_opt, _) in q.iter_mut() {
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
                        // tax_collection_efficiency: only the collected fraction is
                        // actually deducted; the leakage stays in citizen wealth.
                        let actual = owed * tax_eff_money;
                        wealth.0 -= actual;
                        collected += actual;
                        if let Some(mut t) = tax_opt { t.0 += actual; }
                    }
                }
                treasury.balance += collected;
                ledger.revenue += collected;
            }
            LawEffect::PerCitizenBenefit { scope, amount_def } => {
                let Some(body) = find_body(&h.program, scope, amount_def) else { continue; };
                let mut ctx = base_ctx.clone();
                let mut disbursed = Money::from_num(0);
                for (_, income, health_opt, prod_opt, consumption_opt, mut wealth, _, _, _, _, benefit_opt) in q.iter_mut() {
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
                        // bureaucratic_effectiveness: leakage in delivery means
                        // citizens receive less; treasury still spends the full
                        // amount (the gap is administrative loss).
                        let delivered = paid * bureau_eff_money;
                        wealth.0 += delivered;
                        disbursed += paid;
                        if let Some(mut b) = benefit_opt { b.0 += delivered; }
                    }
                }
                treasury.balance -= disbursed;
                ledger.expenditure += disbursed;
            }
            LawEffect::RegistrationMarker { basis, threshold } => {
                for (_, income, _, _, _, wealth, mut legal, _, _, _, _) in q.iter_mut() {
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
                for (citizen_opt, income, _, _, _, mut wealth, _, audit_opt, evasion_opt, tax_opt, _) in q.iter_mut() {
                    let (Some(citizen), Some(audit), Some(evasion)) =
                        (citizen_opt, audit_opt, evasion_opt) else { continue; };
                    if !audit.0.contains(AuditFlagBits::FLAGGED_INCOME) { continue; }
                    if evasion.0 == 0.0 { continue; }
                    let mut rng = rng_res.derive_citizen(&label, tick, citizen.0.0);
                    if rng.random::<f64>() >= selection_prob { continue; }
                    let annual = income.0 * Money::from_num(360);
                    let penalty = annual * Money::from_num(evasion.0) * Money::from_num(penalty_rate);
                    // Audit recovery scaled by tax_collection_efficiency.
                    let actual = penalty * tax_eff_money;
                    wealth.0 -= actual;
                    collected += actual;
                    if let Some(mut t) = tax_opt { t.0 += actual; }
                }
                treasury.balance += collected;
                ledger.revenue += collected;
            }
            LawEffect::Abatement { pollution_reduction_pu, cost_per_pu } => {
                // Debit Treasury proportionally to what can be afforded.
                let full_cost_cents = pollution_reduction_pu * cost_per_pu;
                let affordable_fraction = if full_cost_cents <= 0.0 {
                    1.0
                } else {
                    let balance: f64 = treasury.balance.to_num();
                    (balance / full_cost_cents).clamp(0.0, 1.0)
                };
                // bureaucratic_effectiveness applies to pollution reduction
                // delivered (administrative leakage in implementation), but
                // treasury still spends the full affordable cost.
                let actual_pu   = pollution_reduction_pu * affordable_fraction * bureaucratic_eff;
                let actual_cost = Money::from_num(full_cost_cents * affordable_fraction);
                pollution.stock = (pollution.stock - actual_pu).max(0.0);
                treasury.balance -= actual_cost;
                ledger.expenditure += actual_cost;
            }
            LawEffect::RightGrant { right_id } => {
                // Phase C/I: grant a civil right by catalog ID.
                // Update RightsCatalog if present.
                let rid = RightId(right_id.to_string());
                if let Some(ref mut cat) = rights_catalog {
                    // Auto-populate definitions from the built-in catalog the
                    // first time a law grants a right into an un-seeded catalog.
                    // This ensures grant_boost / revocation_debt metadata is
                    // available even when configure_world was not called with
                    // initial_rights or initial_rights_catalog.
                    if cat.defined.is_empty() {
                        cat.define_all(simulator_core::default_catalog());
                    }
                    cat.grant(&rid, tick);
                }
                // Mirror into legacy RightsLedger bitflag if there's a mapping.
                for (id, bit) in LEGACY_BIT_TO_ID {
                    if *id == right_id {
                        let flag = CivicRights::from_bits_truncate(*bit);
                        rights.granted |= flag;
                        rights.historical_max |= flag;
                        break;
                    }
                }
            }
            LawEffect::RightRevoke { right_id } => {
                // Phase C/I: revoke a civil right by catalog ID.
                // Update RightsCatalog if present (historical_max preserved).
                let rid = RightId(right_id.to_string());
                if let Some(ref mut cat) = rights_catalog {
                    cat.revoke(&rid);
                }
                // Mirror revocation into legacy RightsLedger.
                for (id, bit) in LEGACY_BIT_TO_ID {
                    if *id == right_id {
                        let flag = CivicRights::from_bits_truncate(*bit);
                        rights.granted &= !flag;
                        break;
                    }
                }
            }
            LawEffect::StateCapacityModify { field, delta } => {
                // Phase I: adjust a StateCapacity field by a signed delta.
                // No-op if StateCapacity resource is absent.
                if let Some(ref mut cap) = capacity {
                    match field {
                        "tax_collection_efficiency" => {
                            cap.tax_collection_efficiency = (cap.tax_collection_efficiency + delta).clamp(0.0, 1.0);
                        }
                        "enforcement_reach" => {
                            cap.enforcement_reach = (cap.enforcement_reach + delta).clamp(0.0, 1.0);
                        }
                        "enforcement_noise" => {
                            cap.enforcement_noise = (cap.enforcement_noise + delta).clamp(0.0, 1.0);
                        }
                        "corruption_drift" => {
                            cap.corruption_drift = (cap.corruption_drift + delta).clamp(0.0, 1.0);
                        }
                        "legal_predictability" => {
                            cap.legal_predictability = (cap.legal_predictability + delta).clamp(0.0, 1.0);
                        }
                        "bureaucratic_effectiveness" => {
                            cap.bureaucratic_effectiveness = (cap.bureaucratic_effectiveness + delta).clamp(0.0, 1.0);
                        }
                        _ => {} // Unknown field — silently ignore to allow forward compatibility.
                    }
                }
            }
        }
    }
}


/// Build the base EvalCtx pre-loaded with time bindings and macro aggregates.
/// Each law's per-citizen loop clones this and inserts citizen-specific fields.
fn make_dispatch_ctx(
    tick: u64,
    macro_: &MacroIndicators,
    treasury: &Treasury,
    debt: &LegitimacyDebt,
    rights: &RightsLedger,
    crisis: &CrisisState,
    pollution: &PollutionStock,
    judiciary: Option<&Judiciary>,
    capacity: Option<&StateCapacity>,
    rights_catalog: Option<&RightsCatalog>,
) -> EvalCtx {
    let mut b = HashMap::new();
    // Time
    b.insert("tick".into(),    Value::Int(tick as i64));
    b.insert("year".into(),    Value::Int((tick / 360) as i64));
    b.insert("quarter".into(), Value::Int(((tick / 90) % 4) as i64));
    b.insert("month".into(),   Value::Int(((tick / 30) % 12) as i64));
    // Macro aggregates
    b.insert("unemployment".into(),           Value::Rate(macro_.unemployment as f64));
    b.insert("inflation".into(),              Value::Rate(macro_.inflation as f64));
    b.insert("gini".into(),                   Value::Rate(macro_.gini as f64));
    b.insert("approval".into(),               Value::Rate(macro_.approval as f64));
    b.insert("gdp".into(),                    Value::Money(macro_.gdp));
    b.insert("population".into(),             Value::Int(macro_.population as i64));
    b.insert("government_revenue".into(),     Value::Money(macro_.government_revenue));
    b.insert("government_expenditure".into(), Value::Money(macro_.government_expenditure));
    b.insert("treasury_balance".into(),       Value::Money(treasury.balance));
    // Externalities & political state (v10)
    b.insert("pollution_stock".into(),        Value::Rate(pollution.stock));
    b.insert("legitimacy_debt".into(),        Value::Rate(debt.stock as f64));
    b.insert("rights_granted".into(),         Value::Int(rights.granted.bits() as i64));
    b.insert("crisis_kind".into(),            Value::Int(crisis_kind_to_int(crisis)));
    b.insert("crisis_remaining".into(),       Value::Int(crisis.remaining_ticks as i64));
    // Judiciary (Phase D) — present only when a Judiciary resource is inserted.
    // DSL programs can condition on these to model rule-of-law constraints.
    // Default = 0 (no judicial constraint), so laws written without judiciary
    // awareness behave identically to pre-Phase-D scenarios.
    let (jud_ind, jud_review, jud_precedent, jud_intl) = match judiciary {
        Some(j) => (
            j.independence as f64,
            if j.review_power { 1i64 } else { 0i64 },
            j.precedent_weight as f64,
            j.international_deference as f64,
        ),
        None => (0.0, 0, 0.0, 0.0),
    };
    b.insert("judiciary_independence".into(),            Value::Rate(jud_ind));
    b.insert("judiciary_review_power".into(),            Value::Int(jud_review));
    b.insert("judiciary_precedent_weight".into(),        Value::Rate(jud_precedent));
    b.insert("judiciary_international_deference".into(), Value::Rate(jud_intl));
    // StateCapacity (Phase B) — present only when a StateCapacity resource is inserted.
    // DSL programs can condition on institutional effectiveness, e.g. to model
    // laws that are harder to enforce in weak states. Default = 1.0 (full capacity)
    // so laws without capacity awareness behave identically to pre-Phase-B scenarios.
    let (tax_eff, enf_reach, enf_noise, legal_pred, bureau_eff) = match capacity {
        Some(c) => (
            c.tax_collection_efficiency as f64,
            c.enforcement_reach as f64,
            c.enforcement_noise as f64,
            c.legal_predictability as f64,
            c.bureaucratic_effectiveness as f64,
        ),
        None => (1.0, 1.0, 0.0, 1.0, 1.0),
    };
    b.insert("state_tax_efficiency".into(),        Value::Rate(tax_eff));
    b.insert("state_enforcement_reach".into(),     Value::Rate(enf_reach));
    b.insert("state_enforcement_noise".into(),     Value::Rate(enf_noise));
    b.insert("state_legal_predictability".into(),  Value::Rate(legal_pred));
    b.insert("state_bureaucratic_effectiveness".into(), Value::Rate(bureau_eff));
    // RightsCatalog (Phase C) — present only when a RightsCatalog resource is inserted.
    // DSL programs can condition on the number and breadth of civil rights granted.
    // Default = 0 / 0.0 so laws without rights-catalog awareness behave identically
    // to pre-Phase-C scenarios.
    let (cat_count, cat_breadth, cat_historical) = match rights_catalog {
        Some(c) => (
            c.granted_count() as i64,
            c.breadth_score() as f64,
            c.historical_count() as i64,
        ),
        None => (0, 0.0, 0),
    };
    b.insert("rights_catalog_count".into(),     Value::Int(cat_count));
    b.insert("rights_catalog_breadth".into(),   Value::Rate(cat_breadth));
    b.insert("rights_catalog_historical".into(), Value::Int(cat_historical));
    EvalCtx { bindings: b, field_bindings: HashMap::new() }
}

fn crisis_kind_to_int(crisis: &CrisisState) -> i64 {
    match crisis.kind {
        simulator_core::CrisisKind::None            => 0,
        simulator_core::CrisisKind::War             => 1,
        simulator_core::CrisisKind::Pandemic        => 2,
        simulator_core::CrisisKind::Recession       => 3,
        simulator_core::CrisisKind::NaturalDisaster => 4,
    }
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
    crate::legitimacy::register_legitimacy_system(sim);
    crate::crisis_link::register_crisis_link_system(sim);
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
        Income, LegalStatuses, MonthlyBenefitReceived, MonthlyTaxPaid, Wealth,
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
            MonthlyTaxPaid::default(),
            MonthlyBenefitReceived::default(),
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
            MonthlyTaxPaid::default(),
            MonthlyBenefitReceived::default(),
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
            source: None,
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
            source: None,
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
            source: None,
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
            source: None,
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

    /// Law supersession: a 20% income tax runs for year 1; at tick 360 it is
    /// replaced by a 10% tax. Year-2 revenue should be half of year-1 revenue.
    #[test]
    fn supersession_switches_rate_at_tick_boundary() {
        use crate::ig2::{AmountBasis, Computation, Deontic, LowerCadence, TaxBracket};

        let mut sim = Sim::new([70u8; 32]);
        register_law_dispatcher(&mut sim);

        // 4 citizens: $500/month → $180 000/year
        for i in 0..4 { spawn_citizen(&mut sim.world, i, 500); }

        let make_flat_tax = |rate: f64| {
            let stmt = crate::ig2::IgStatement::Regulative(crate::ig2::RegulativeStmt {
                attribute: crate::ig2::ActorRef { class: "individual".into(), qualifier: None },
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
                    brackets: vec![TaxBracket { floor: 0.0, ceil: None, rate }],
                    cadence: LowerCadence::Yearly,
                }),
            });
            crate::lower::lower_statement(&stmt).expect("lowering")
        };

        // Enact the 20% law starting at tick 0.
        let lowered_20 = make_flat_tax(0.20);
        let registry = sim.world.resource::<LawRegistry>().clone();
        let id_20 = registry.enact(LawHandle {
            source: None,
            id: LawId(0), version: 1,
            program: Arc::new(lowered_20.program),
            cadence: lowered_20.cadence,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: lowered_20.effect,
        });

        // Run year 1 (ticks 0..=360).
        for _ in 0..=360 { sim.step(); }

        let rev_year1: f64 = {
            let ledger = sim.world.resource::<GovernmentLedger>();
            ledger.revenue.to_num()
        };
        // 4 citizens × $180 000 × 20% = $144 000 year 1
        assert!(
            (rev_year1 - 144_000.0).abs() < 1.0,
            "year-1 revenue at 20%: expected ~$144 000, got ${rev_year1:.2}"
        );

        // Supersede with 10% tax, effective from tick 361.
        let lowered_10 = make_flat_tax(0.10);
        registry.supersede(id_20, LawHandle {
            source: None,
            id: LawId(0), version: 2,
            program: Arc::new(lowered_10.program),
            cadence: lowered_10.cadence,
            effective_from_tick: 361,
            effective_until_tick: None,
            effect: lowered_10.effect,
        }, 361);

        // Run year 2 (ticks 361..=720).
        for _ in 361..=720 { sim.step(); }

        let rev_total: f64 = sim.world.resource::<GovernmentLedger>().revenue.to_num();
        let rev_year2 = rev_total - rev_year1;
        // 4 citizens × $180 000 × 10% = $72 000 year 2
        assert!(
            (rev_year2 - 72_000.0).abs() < 1.0,
            "year-2 revenue at 10%: expected ~$72 000, got ${rev_year2:.2}"
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
            source: None,
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
            source: None,
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
            source: None,
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
            source: None,
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

    /// MonthlyTaxPaid accumulator: after a tax law fires, each citizen's
    /// MonthlyTaxPaid reflects their individual tax contribution.
    #[test]
    fn monthly_tax_paid_tracks_per_citizen_amount() {
        use crate::ig2::{Computation, Deontic, LowerCadence, TaxBracket};

        let mut sim = Sim::new([99u8; 32]);
        register_law_dispatcher(&mut sim);

        // Citizen 0: $500/month → $180k/year → 20% = $36 000/year
        // Citizen 1: $100/month → $36k/year → 20% = $7 200/year
        spawn_citizen(&mut sim.world, 0, 500);
        spawn_citizen(&mut sim.world, 1, 100);

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
                brackets: vec![TaxBracket { floor: 0.0, ceil: None, rate: 0.20 }],
                cadence: LowerCadence::Yearly,
            }),
        });
        let lowered = crate::lower::lower_statement(&stmt).expect("lowering");
        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(LawHandle {
            source: None,
            id: LawId(0), version: 1,
            program: Arc::new(lowered.program),
            cadence: lowered.cadence,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: lowered.effect,
        });

        for _ in 0..=360 { sim.step(); }

        let mut paid: Vec<(u64, f64)> = sim.world
            .query::<(&Citizen, &MonthlyTaxPaid)>()
            .iter(&sim.world)
            .map(|(c, t)| (c.0.0, t.0.to_num::<f64>()))
            .collect();
        paid.sort_by_key(|(id, _)| *id);

        // The annual tax fires once at tick 360; MonthlyTaxPaid is reset at that
        // same monthly boundary and then immediately written by the tax law.
        assert!(paid[0].1 > paid[1].1,
            "citizen 0 (higher income) should have paid more tax than citizen 1, got {:?}", paid);
        assert!(paid[0].1 > 0.0, "citizen 0 should have non-zero MonthlyTaxPaid");
        assert!(paid[1].1 > 0.0, "citizen 1 should have non-zero MonthlyTaxPaid");
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
            source: None,
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

    /// Abatement law: when the Treasury is well-funded, a monthly firing should
    /// reduce PollutionStock by the full `pollution_reduction_pu` and debit the
    /// Treasury by `pollution_reduction_pu * cost_per_pu`.
    #[test]
    fn abatement_law_reduces_pollution_stock() {
        use crate::ig2::{Computation, LowerCadence};

        let mut sim = Sim::new([55u8; 32]);
        register_law_dispatcher(&mut sim);

        // Set initial world state — no citizens needed; abatement is global.
        sim.world.resource_mut::<PollutionStock>().stock = 5.0;
        // Fund Treasury: 1 000 000 >> 5 000 full cost → fully affordable.
        sim.world.resource_mut::<Treasury>().balance = Money::from_num(1_000_000i64);

        let stmt = IgStatement::Regulative(RegulativeStmt {
            attribute: ActorRef { class: "government".into(), qualifier: None },
            attribute_property: None,
            deontic: None,
            aim: "abate".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::EnvironmentalAbatement {
                pollution_reduction_pu: 0.5,
                cost_per_pu: 10_000.0, // full cost = $5 000/month
                cadence: LowerCadence::Monthly,
            }),
        });
        let lowered = lower_statement(&stmt).expect("lowering failed");
        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(LawHandle {
            source: None,
            id: LawId(0), version: 1,
            program: Arc::new(lowered.program),
            cadence: lowered.cadence,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: lowered.effect,
        });

        // Step 31: schedule runs at tick=30, monthly law fires.
        for _ in 0..31 { sim.step(); }

        let stock = sim.world.resource::<PollutionStock>().stock;
        // Expect 5.0 - 0.5 = 4.5 (exact; no decay without consumption load).
        assert!(
            (stock - 4.5).abs() < 0.001,
            "abatement should reduce pollution from 5.0 to ~4.5, got {stock:.4}"
        );

        let bal: f64 = sim.world.resource::<Treasury>().balance.to_num();
        assert!(
            (bal - 995_000.0).abs() < 1.0,
            "treasury should drop by $5 000 (0.5 PU × $10 000), got bal={bal:.2}"
        );

        let exp: f64 = sim.world.resource::<GovernmentLedger>().expenditure.to_num();
        assert!(
            (exp - 5_000.0).abs() < 1.0,
            "expenditure ledger should record $5 000, got {exp:.2}"
        );
    }

    /// Abatement partial-afford: when Treasury can only cover half the full cost,
    /// exactly half the abatement is applied and the Treasury is drained to ~0.
    #[test]
    fn abatement_partial_proportional_to_treasury() {
        use crate::ig2::{Computation, LowerCadence};

        let mut sim = Sim::new([56u8; 32]);
        register_law_dispatcher(&mut sim);

        sim.world.resource_mut::<PollutionStock>().stock = 4.0;
        // Treasury can cover exactly half: full cost = 1.0 PU × 10 000 = 10 000;
        // treasury = 5 000 → affordable_fraction = 0.5.
        sim.world.resource_mut::<Treasury>().balance = Money::from_num(5_000i64);

        let stmt = IgStatement::Regulative(RegulativeStmt {
            attribute: ActorRef { class: "government".into(), qualifier: None },
            attribute_property: None,
            deontic: None,
            aim: "abate".into(),
            direct_object: None, direct_object_property: None,
            indirect_object: None, indirect_object_property: None,
            activation_conditions: vec![], execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::EnvironmentalAbatement {
                pollution_reduction_pu: 1.0,
                cost_per_pu: 10_000.0,
                cadence: LowerCadence::Monthly,
            }),
        });
        let lowered = lower_statement(&stmt).expect("lowering failed");
        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(LawHandle {
            source: None,
            id: LawId(0), version: 1,
            program: Arc::new(lowered.program),
            cadence: lowered.cadence,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: lowered.effect,
        });

        for _ in 0..31 { sim.step(); }

        let stock = sim.world.resource::<PollutionStock>().stock;
        // Expect 4.0 - 0.5 = 3.5 (half the 1.0 PU).
        assert!(
            (stock - 3.5).abs() < 0.001,
            "partial abatement should reduce pollution from 4.0 to ~3.5, got {stock:.4}"
        );

        let bal: f64 = sim.world.resource::<Treasury>().balance.to_num();
        assert!(
            bal.abs() < 1.0,
            "treasury should be ~0 after spending all $5 000, got {bal:.2}"
        );
    }

    /// Verifies that `pollution_stock` is injected into EvalCtx and is readable
    /// by DSL law expressions. A benefit law conditioned on `pollution_stock > 2.0`
    /// should disburse when pollution is high and pay nothing when pollution is low.
    #[test]
    fn dsl_reads_pollution_stock_from_evalctx() {
        use crate::dsl::ast::{BinOp, DefaultExpr, Expr, Item, ParamDecl, Program, Scope, Type};
        use crate::registry::{LawEffect, LawId};
        use crate::system::Cadence;
        use simulator_core::{MacroIndicators, PollutionStock};
        use std::sync::Arc;

        // Build: `def amount : money = if pollution_stock > 2.0 then 500.0 else 0.0`
        // `pollution_stock` is injected as Value::Rate by make_dispatch_ctx.
        let body = DefaultExpr {
            base: Expr::If {
                cond: Box::new(Expr::BinOp {
                    op: BinOp::Gt,
                    lhs: Box::new(Expr::Ident("pollution_stock".into())),
                    rhs: Box::new(Expr::LitRate(2.0)),
                }),
                then_: Box::new(Expr::LitMoney(500.0)),
                else_: Box::new(Expr::LitMoney(0.0)),
            },
            exceptions: vec![],
        };
        let program = Arc::new(Program {
            scopes: vec![Scope {
                name: "PollutionBenefit".into(),
                params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
                items: vec![Item::Definition {
                    name: "amount".into(),
                    ty: Type::Money,
                    body,
                }],
            }],
        });
        let handle = LawHandle {
            source: None,
            id: LawId(0), version: 1,
            program,
            cadence: Cadence::Yearly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::PerCitizenBenefit {
                scope: "PollutionBenefit",
                amount_def: "amount",
            },
        };

        // --- High-pollution sim: stock = 3.0 > 2.0 → should pay $500/citizen/year ---
        let mut sim_dirty = Sim::new([57u8; 32]);
        register_law_dispatcher(&mut sim_dirty);
        for i in 0..4 { spawn_citizen(&mut sim_dirty.world, i, 100); }
        sim_dirty.world.resource_mut::<PollutionStock>().stock = 3.0;
        // Mirror into MacroIndicators so make_dispatch_ctx sees it.
        sim_dirty.world.resource_mut::<MacroIndicators>().pollution_stock = 3.0;
        let r1 = sim_dirty.world.resource::<LawRegistry>().clone();
        r1.enact(handle.clone());
        for _ in 0..=360 { sim_dirty.step(); }
        let exp_dirty: f64 = sim_dirty.world.resource::<GovernmentLedger>().expenditure.to_num();
        // 4 citizens × $500 = $2 000.
        assert!(
            (exp_dirty - 2_000.0).abs() < 1.0,
            "high-pollution: expected ~$2 000 disbursed, got ${exp_dirty:.2}"
        );

        // --- Low-pollution sim: stock = 1.0 ≤ 2.0 → should pay $0 ---
        let mut sim_clean = Sim::new([58u8; 32]);
        register_law_dispatcher(&mut sim_clean);
        for i in 0..4 { spawn_citizen(&mut sim_clean.world, i, 100); }
        sim_clean.world.resource_mut::<PollutionStock>().stock = 1.0;
        sim_clean.world.resource_mut::<MacroIndicators>().pollution_stock = 1.0;
        let r2 = sim_clean.world.resource::<LawRegistry>().clone();
        r2.enact(handle);
        for _ in 0..=360 { sim_clean.step(); }
        let exp_clean: f64 = sim_clean.world.resource::<GovernmentLedger>().expenditure.to_num();
        assert!(
            exp_clean.abs() < 1.0,
            "low-pollution: expected ~$0 disbursed, got ${exp_clean:.2}"
        );
    }

    /// Verifies that `crisis_kind` is injected into EvalCtx as an integer and is
    /// readable by DSL law expressions. A benefit conditioned on `crisis_kind > 0`
    /// (any active crisis) should disburse during War and pay nothing in peacetime.
    #[test]
    fn dsl_reads_crisis_kind_from_evalctx() {
        use crate::dsl::ast::{BinOp, DefaultExpr, Expr, Item, ParamDecl, Program, Scope, Type};
        use crate::registry::{LawEffect, LawId};
        use crate::system::Cadence;
        use simulator_core::{CrisisKind, CrisisState};
        use std::sync::Arc;

        // `if crisis_kind > 0 then 600.0 else 0.0`
        // crisis_kind is Value::Int; 0 = None, 1 = War, etc.
        let body = DefaultExpr {
            base: Expr::If {
                cond: Box::new(Expr::BinOp {
                    op: BinOp::Gt,
                    lhs: Box::new(Expr::Ident("crisis_kind".into())),
                    rhs: Box::new(Expr::LitInt(0)),
                }),
                then_: Box::new(Expr::LitMoney(600.0)),
                else_: Box::new(Expr::LitMoney(0.0)),
            },
            exceptions: vec![],
        };
        let program = Arc::new(Program {
            scopes: vec![Scope {
                name: "CrisisBenefit".into(),
                params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
                items: vec![Item::Definition {
                    name: "amount".into(),
                    ty: Type::Money,
                    body,
                }],
            }],
        });
        let handle = LawHandle {
            source: None,
            id: LawId(0), version: 1,
            program,
            cadence: Cadence::Yearly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::PerCitizenBenefit {
                scope: "CrisisBenefit",
                amount_def: "amount",
            },
        };

        // --- Wartime: crisis_kind = 1 (War) → pay $600/citizen ---
        let mut sim_war = Sim::new([62u8; 32]);
        register_law_dispatcher(&mut sim_war);
        for i in 0..3 { spawn_citizen(&mut sim_war.world, i, 100); }
        {
            let mut cs = sim_war.world.resource_mut::<CrisisState>();
            cs.kind             = CrisisKind::War;
            cs.remaining_ticks  = 720;
            cs.cost_multiplier  = 0.5;
        }
        let r_war = sim_war.world.resource::<LawRegistry>().clone();
        r_war.enact(handle.clone());
        for _ in 0..=360 { sim_war.step(); }
        let exp_war: f64 = sim_war.world.resource::<GovernmentLedger>().expenditure.to_num();
        // 3 citizens × $600 = $1 800
        assert!(
            (exp_war - 1_800.0).abs() < 1.0,
            "wartime: expected ~$1 800 disbursed, got ${exp_war:.2}"
        );

        // --- Peacetime: crisis_kind = 0 (None) → pay $0 ---
        let mut sim_peace = Sim::new([63u8; 32]);
        register_law_dispatcher(&mut sim_peace);
        for i in 0..3 { spawn_citizen(&mut sim_peace.world, i, 100); }
        // CrisisState defaults to kind=None (0) — no modification needed.
        let r_peace = sim_peace.world.resource::<LawRegistry>().clone();
        r_peace.enact(handle);
        for _ in 0..=360 { sim_peace.step(); }
        let exp_peace: f64 = sim_peace.world.resource::<GovernmentLedger>().expenditure.to_num();
        assert!(
            exp_peace.abs() < 1.0,
            "peacetime: expected ~$0 disbursed, got ${exp_peace:.2}"
        );
    }

    /// Verifies that `crisis_link_system` propagates `CrisisState.cost_multiplier`
    /// into `LawRegistry` so that benefit-law repeals accumulate less legitimacy
    /// debt during an active crisis than in peacetime.
    #[test]
    fn crisis_link_reduces_repeal_debt_during_active_crisis() {
        use simulator_core::{CrisisKind, CrisisState};

        // Helper: enact a benefit law and return (registry clone, law id).
        let setup = |sim: &mut Sim| {
            let h = make_means_tested_benefit();
            let registry = sim.world.resource::<LawRegistry>().clone();
            let id = registry.enact(h);
            (registry, id)
        };

        // --- Peacetime repeal (cost_multiplier = 1.0) ---
        let mut sim_peace = Sim::new([59u8; 32]);
        register_law_dispatcher(&mut sim_peace);
        let (reg_peace, id_peace) = setup(&mut sim_peace);
        sim_peace.step(); // crisis_link fires: multiplier = 1.0 (no crisis)
        reg_peace.repeal(id_peace, 1);
        let debt_peace = reg_peace.drain_repeal_debt();

        // --- Crisis repeal (cost_multiplier = 0.5 — War cost multiplier) ---
        let mut sim_war = Sim::new([59u8; 32]);
        register_law_dispatcher(&mut sim_war);
        // Inject active crisis with cost_multiplier = 0.5 before the first step.
        {
            let mut cs = sim_war.world.resource_mut::<CrisisState>();
            cs.kind             = CrisisKind::War;
            cs.remaining_ticks  = 360;
            cs.cost_multiplier  = 0.50;
        }
        let (reg_war, id_war) = setup(&mut sim_war);
        sim_war.step(); // crisis_link fires: multiplier = 0.5 propagated to registry
        reg_war.repeal(id_war, 1);
        let debt_war = reg_war.drain_repeal_debt();

        assert!(
            (debt_peace - 0.10).abs() < 0.001,
            "peacetime repeal should incur 0.10 debt, got {debt_peace:.4}"
        );
        assert!(
            (debt_war - 0.05).abs() < 0.001,
            "crisis repeal should incur 0.05 debt (0.10 × 0.5), got {debt_war:.4}"
        );
        assert!(
            debt_war < debt_peace,
            "crisis should reduce repeal debt vs peacetime"
        );
    }

    // ------------------------------------------------------------------
    // Phase I: RightGrant / RightRevoke / StateCapacityModify
    // ------------------------------------------------------------------

    /// `RightGrant` enacts a law that grants a right; verifies both
    /// `RightsCatalog` and legacy `RightsLedger` are updated.
    #[test]
    fn right_grant_law_updates_catalog_and_ledger() {
        use crate::dsl::ast::{Program, Scope};
        use simulator_core::{
            catalog_from_bits, CivicRights, RightId, RightsCatalog, RightsLedger,
        };

        let mut sim = Sim::new([70u8; 32]);
        register_law_dispatcher(&mut sim);

        // Pre-seed catalog but grant NO rights.
        let mut cat = catalog_from_bits(0);
        sim.world.insert_resource(cat);

        let handle = LawHandle {
            source: None,
            id: LawId(200), version: 1,
            program: Arc::new(Program {
                scopes: vec![Scope { name: "G".into(), params: vec![], items: vec![] }],
            }),
            cadence: Cadence::Monthly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::RightGrant { right_id: "universal_suffrage" },
        };

        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(handle);

        // 31 steps: schedule fires at ticks 0-30; tick 30 is the first monthly
        // firing (step() runs schedule, then advances clock).
        for _ in 0..31 { sim.step(); }

        let catalog = sim.world.resource::<RightsCatalog>();
        assert!(catalog.has(&RightId::new("universal_suffrage")),
            "RightsCatalog should contain universal_suffrage after grant");
        assert_eq!(catalog.granted_count(), 1,
            "exactly one right should be granted");
        assert_eq!(catalog.historical_count(), 1,
            "historical_max should also contain the right");

        let ledger = sim.world.resource::<RightsLedger>();
        assert!(ledger.granted.contains(CivicRights::UNIVERSAL_SUFFRAGE),
            "legacy RightsLedger bitflag should be set");
    }

    /// `RightRevoke` removes a right from both storages; `historical_max` is preserved.
    #[test]
    fn right_revoke_law_clears_right_preserves_history() {
        use crate::dsl::ast::{Program, Scope};
        use simulator_core::{
            catalog_from_bits, CivicRights, RightId, RightsCatalog, RightsLedger,
        };

        let mut sim = Sim::new([71u8; 32]);
        register_law_dispatcher(&mut sim);

        // Pre-grant universal_suffrage (bit 0 = 1).
        let cat = catalog_from_bits(1);
        sim.world.insert_resource(cat);
        {
            let mut ledger = sim.world.resource_mut::<RightsLedger>();
            ledger.granted |= CivicRights::UNIVERSAL_SUFFRAGE;
            ledger.historical_max |= CivicRights::UNIVERSAL_SUFFRAGE;
        }

        let handle = LawHandle {
            source: None,
            id: LawId(201), version: 1,
            program: Arc::new(Program {
                scopes: vec![Scope { name: "R".into(), params: vec![], items: vec![] }],
            }),
            cadence: Cadence::Monthly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::RightRevoke { right_id: "universal_suffrage" },
        };

        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(handle);
        for _ in 0..31 { sim.step(); }

        let catalog = sim.world.resource::<RightsCatalog>();
        assert!(!catalog.has(&RightId::new("universal_suffrage")),
            "universal_suffrage should be revoked from catalog");
        assert!(catalog.historical_max.contains(&RightId::new("universal_suffrage")),
            "historical_max must still contain the revoked right");

        let ledger = sim.world.resource::<RightsLedger>();
        assert!(!ledger.granted.contains(CivicRights::UNIVERSAL_SUFFRAGE),
            "legacy RightsLedger bitflag should be cleared");
    }

    /// `StateCapacityModify` adjusts a StateCapacity field each monthly firing.
    #[test]
    fn state_capacity_modify_law_adjusts_field() {
        use crate::dsl::ast::{Program, Scope};
        use simulator_core::StateCapacity;

        let mut sim = Sim::new([72u8; 32]);
        register_law_dispatcher(&mut sim);

        sim.world.insert_resource(StateCapacity {
            tax_collection_efficiency: 0.50,
            enforcement_reach: 0.50,
            enforcement_noise: 0.10,
            corruption_drift: 0.0,
            legal_predictability: 0.50,
            bureaucratic_effectiveness: 0.50,
        });

        // Law: increase tax_collection_efficiency by +0.10 each month.
        let handle = LawHandle {
            source: None,
            id: LawId(202), version: 1,
            program: Arc::new(Program {
                scopes: vec![Scope { name: "Cap".into(), params: vec![], items: vec![] }],
            }),
            cadence: Cadence::Monthly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::StateCapacityModify {
                field: "tax_collection_efficiency",
                delta: 0.10,
            },
        };

        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(handle);

        // 31 steps to trigger the tick-30 monthly firing.
        for _ in 0..31 { sim.step(); }

        let sc = sim.world.resource::<StateCapacity>();
        assert!(
            (sc.tax_collection_efficiency - 0.60).abs() < 1e-5,
            "after one monthly firing, tax_collection_efficiency should be 0.60, got {}",
            sc.tax_collection_efficiency
        );
    }

    /// `StateCapacityModify` with absent resource is a no-op (no panic).
    #[test]
    fn state_capacity_modify_no_op_when_resource_absent() {
        use crate::dsl::ast::{Program, Scope};
        let mut sim = Sim::new([73u8; 32]);
        register_law_dispatcher(&mut sim);
        // No StateCapacity resource inserted.

        let handle = LawHandle {
            source: None,
            id: LawId(203), version: 1,
            program: Arc::new(Program {
                scopes: vec![Scope { name: "Cap".into(), params: vec![], items: vec![] }],
            }),
            cadence: Cadence::Monthly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::StateCapacityModify {
                field: "enforcement_reach",
                delta: -0.50,
            },
        };

        let registry = sim.world.resource::<LawRegistry>().clone();
        registry.enact(handle);
        // Should not panic.
        for _ in 0..31 { sim.step(); }
    }
}
