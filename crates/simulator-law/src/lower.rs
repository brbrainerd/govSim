//! IG 2.0 → UGS-Catala lowering.
//!
//! The LLM-extracted IG 2.0 statement plus its structured `Computation`
//! payload are deterministically lowered into a `dsl::Program` plus a
//! `LawHandle`-ready `LawEffect`. We only require that the IG 2.0 carries
//! a `computation`; the free-text component bag is preserved for human
//! review and replay but is not consulted by the lowering.

use crate::dsl::ast::*;
use crate::ig2::*;
use crate::registry::LawEffect;
use crate::system::Cadence;

#[derive(Debug, thiserror::Error)]
pub enum LowerError {
    #[error("statement is not regulative; lowering only handles regulative now")]
    NotRegulative,
    #[error("regulative statement has no structured `computation`; cannot lower")]
    MissingComputation,
    #[error("brackets must be sorted by ascending floor")]
    UnsortedBrackets,
    #[error("brackets must be non-empty")]
    EmptyBrackets,
    #[error("means-tested benefit: income_ceiling must be > taper_floor")]
    InvalidTaperRange,
}

/// Result of lowering: the synthesized program, the dispatcher effect, and
/// the cadence to register with.
pub struct Lowered {
    pub program: Program,
    pub effect: LawEffect,
    pub cadence: Cadence,
}

pub fn lower_statement(stmt: &IgStatement) -> Result<Lowered, LowerError> {
    let reg = match stmt {
        IgStatement::Regulative(r) => r,
        _ => return Err(LowerError::NotRegulative),
    };
    let comp = reg.computation.as_ref().ok_or(LowerError::MissingComputation)?;
    match comp {
        Computation::BracketedTax { basis, threshold, brackets, cadence } => {
            lower_bracketed(*basis, *threshold, brackets, *cadence)
        }
        Computation::FlatRate { basis, threshold, rate, cadence } => {
            lower_flat_rate(*basis, *threshold, *rate, *cadence)
        }
        Computation::MeansTestedBenefit { basis, income_ceiling, taper_floor, amount, cadence } => {
            lower_means_tested(*basis, *income_ceiling, *taper_floor, *amount, *cadence)
        }
        Computation::RegistrationRequirement { basis, threshold, cadence } => {
            lower_registration(*basis, *threshold, *cadence)
        }
        Computation::ConditionalTransfer { eligibility_basis, ceiling, floor, amount, cadence } => {
            lower_conditional_transfer(*eligibility_basis, *ceiling, *floor, *amount, *cadence)
        }
        Computation::AuditEnforcement { selection_prob, penalty_rate, cadence } => {
            lower_audit(*selection_prob, *penalty_rate, *cadence)
        }
        Computation::ConsumptionTax { rate, cadence } => {
            lower_consumption_tax(*rate, *cadence)
        }
        Computation::WealthTax { exemption, rate, cadence } => {
            lower_wealth_tax(*exemption, *rate, *cadence)
        }
    }
}

fn cadence_to_runtime(c: LowerCadence) -> Cadence {
    match c {
        LowerCadence::Monthly => Cadence::Monthly,
        LowerCadence::Quarterly => Cadence::Quarterly,
        LowerCadence::Yearly => Cadence::Yearly,
    }
}

/// Build `min(citizen.income, ceil)` (or just `citizen.income` if open-top).
fn capped(field: &str, ceil: Option<f64>) -> Expr {
    let income = Expr::Field { obj: "citizen".into(), field: field.into() };
    match ceil {
        Some(c) => Expr::Min(Box::new(income), Box::new(Expr::LitMoney(c))),
        None => income,
    }
}

fn money(x: f64) -> Expr { Expr::LitMoney(x) }

fn mul(a: Expr, b: Expr) -> Expr { Expr::BinOp { op: BinOp::Mul, lhs: Box::new(a), rhs: Box::new(b) } }
fn sub(a: Expr, b: Expr) -> Expr { Expr::BinOp { op: BinOp::Sub, lhs: Box::new(a), rhs: Box::new(b) } }
fn add(a: Expr, b: Expr) -> Expr { Expr::BinOp { op: BinOp::Add, lhs: Box::new(a), rhs: Box::new(b) } }
fn gt(a: Expr, b: Expr) -> Expr { Expr::BinOp { op: BinOp::Gt, lhs: Box::new(a), rhs: Box::new(b) } }

fn lower_bracketed(
    basis: AmountBasis,
    threshold: f64,
    brackets: &[TaxBracket],
    cadence: LowerCadence,
) -> Result<Lowered, LowerError> {
    if brackets.is_empty() { return Err(LowerError::EmptyBrackets); }
    for w in brackets.windows(2) {
        if w[0].floor > w[1].floor { return Err(LowerError::UnsortedBrackets); }
    }
    let field = match basis { AmountBasis::AnnualIncome => "income", AmountBasis::Wealth => "wealth" };

    // exception_k: cumulative sum of (rate_i * (min(income, ceil_i) - floor_i))
    // for i = 0..=k, fired when income > brackets[k].floor.
    let mut exceptions: Vec<(Expr, Expr)> = Vec::with_capacity(brackets.len());
    for k in 0..brackets.len() {
        let mut total: Option<Expr> = None;
        for (i, br) in brackets[..=k].iter().enumerate() {
            // For all but the top of the cumulative sum, use the closed-form
            // contribution `rate_i * (ceil_i - floor_i)`. The top contribution
            // uses `min(income, ceil_i) - floor_i`.
            let term = if i == k {
                let upper = capped(field, br.ceil);
                mul(money(br.rate), sub(upper, money(br.floor)))
            } else {
                // closed bracket: rate_i * (ceil_i - floor_i). Safe because
                // by sortedness all i<k brackets must have a ceil below
                // brackets[k].floor (else this isn't a piecewise function).
                let ceil = br.ceil.expect("non-top bracket missing ceil");
                mul(money(br.rate), money(ceil - br.floor))
            };
            total = Some(match total { Some(t) => add(t, term), None => term });
        }
        let amount = total.unwrap();
        let guard = gt(
            Expr::Field { obj: "citizen".into(), field: field.into() },
            money(brackets[k].floor),
        );
        exceptions.push((guard, amount));
    }

    // Threshold guard sits before bracket 0 (e.g. tax-free below 12 000).
    // We model it implicitly: the base case is `0.0` and the first bracket's
    // `floor` IS the threshold by convention.
    let _ = threshold;

    let body = DefaultExpr { base: Expr::LitMoney(0.0), exceptions };
    let scope = Scope {
        name: "IncomeTax".into(),
        params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
        items: vec![Item::Definition {
            name: "tax_owed".into(),
            ty: Type::Money,
            body,
        }],
    };
    Ok(Lowered {
        program: Program { scopes: vec![scope] },
        effect: LawEffect::PerCitizenIncomeTax { scope: "IncomeTax", owed_def: "tax_owed" },
        cadence: cadence_to_runtime(cadence),
    })
}

fn lower_flat_rate(
    basis: AmountBasis,
    threshold: f64,
    rate: f64,
    cadence: LowerCadence,
) -> Result<Lowered, LowerError> {
    let field = match basis { AmountBasis::AnnualIncome => "income", AmountBasis::Wealth => "wealth" };
    let income = Expr::Field { obj: "citizen".into(), field: field.into() };
    let body = DefaultExpr {
        base: Expr::LitMoney(0.0),
        exceptions: vec![(
            gt(income.clone(), money(threshold)),
            mul(money(rate), sub(income, money(threshold))),
        )],
    };
    let scope = Scope {
        name: "IncomeTax".into(),
        params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
        items: vec![Item::Definition { name: "tax_owed".into(), ty: Type::Money, body }],
    };
    Ok(Lowered {
        program: Program { scopes: vec![scope] },
        effect: LawEffect::PerCitizenIncomeTax { scope: "IncomeTax", owed_def: "tax_owed" },
        cadence: cadence_to_runtime(cadence),
    })
}

/// Means-tested benefit: `amount` paid in full when income < taper_floor;
/// linearly tapered to zero between taper_floor and income_ceiling;
/// nothing above income_ceiling.
///
/// DSL:
/// ```text
/// def benefit_amount : money = 0.0
///   exception (citizen.income < income_ceiling) = amount
///   exception (citizen.income >= taper_floor) =
///     amount * (income_ceiling - citizen.income) / (income_ceiling - taper_floor)
/// ```
/// (last-wins, so the taper exception overrides the base when taper applies.)
fn lower_means_tested(
    basis: AmountBasis,
    income_ceiling: f64,
    taper_floor: Option<f64>,
    amount: f64,
    cadence: LowerCadence,
) -> Result<Lowered, LowerError> {
    let field = match basis { AmountBasis::AnnualIncome => "income", AmountBasis::Wealth => "wealth" };
    let income = || Expr::Field { obj: "citizen".into(), field: field.into() };
    // Guard: citizen.income < income_ceiling  ↔  NOT (income >= ceiling)
    // We model with `income < ceiling` via `!( income >= ceiling )`.
    // The DSL has Gt but not Lt; rewrite: income < ceiling ≡ ceiling > income.
    let below_ceiling = gt(money(income_ceiling), income());

    let mut exceptions = vec![(below_ceiling, money(amount))];

    if let Some(tf) = taper_floor {
        if tf >= income_ceiling { return Err(LowerError::InvalidTaperRange); }
        // taper: amount * (ceiling - income) / (ceiling - taper_floor)
        let range = income_ceiling - tf;
        let taper_amount = mul(
            money(amount),
            // (ceiling - income) / range  →  mul(1/range, sub(ceiling, income))
            mul(money(1.0 / range), sub(money(income_ceiling), income())),
        );
        // Guard: citizen.income >= taper_floor  ↔  NOT (taper_floor > income)
        // Rewrite: income >= taper_floor  ↔  income > taper_floor - epsilon, or simpler:
        // Use !(taper_floor > income): i.e. income >= tf means gt(income, tf-ε).
        // Pragmatic approximation: guard as `income > tf` (one cent below tf gets full benefit).
        let in_taper = gt(income(), money(tf));
        exceptions.push((in_taper, taper_amount));
    }

    let body = DefaultExpr { base: Expr::LitMoney(0.0), exceptions };
    let scope = Scope {
        name: "MeansTestedBenefit".into(),
        params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
        items: vec![Item::Definition { name: "benefit_amount".into(), ty: Type::Money, body }],
    };
    Ok(Lowered {
        program: Program { scopes: vec![scope] },
        effect: LawEffect::PerCitizenBenefit { scope: "MeansTestedBenefit", amount_def: "benefit_amount" },
        cadence: cadence_to_runtime(cadence),
    })
}

/// Registration requirement: emits a no-op DSL scope (the actual effect —
/// setting `LegalStatuses` flags — is handled directly by the dispatcher
/// via `LawEffect::RegistrationMarker`).
fn lower_registration(basis: AmountBasis, threshold: f64, cadence: LowerCadence) -> Result<Lowered, LowerError> {
    let body = DefaultExpr { base: Expr::LitMoney(0.0), exceptions: vec![] };
    let scope = Scope {
        name: "Registration".into(),
        params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
        items: vec![Item::Definition { name: "noop".into(), ty: Type::Money, body }],
    };
    Ok(Lowered {
        program: Program { scopes: vec![scope] },
        effect: LawEffect::RegistrationMarker { basis, threshold },
        cadence: cadence_to_runtime(cadence),
    })
}

/// Conditional transfer (stimulus): pay `amount` to citizens whose basis is
/// below `ceiling` (and, optionally, above `floor`).
///
/// DSL (no-taper, cliff eligibility):
/// ```text
/// def transfer_amount : money = 0.0
///   exception (ceiling > citizen.basis) = amount          -- below ceiling
///   exception (citizen.basis > floor)   = amount          -- above floor (overrides if both)
/// ```
/// For the two-sided case both guards must fire: last-wins means the floor
/// guard (second) applies only when income > floor. To get the AND we emit:
///   base = 0, exception₁ = below ceiling → amount,
///   exception₂ = NOT above floor → 0  (i.e. guard: income <= floor → 0)
///
/// Simpler correct encoding: a single exception with a compound guard is not
/// in the DSL yet. We model it conservatively: floor exception sets back to 0.
fn lower_conditional_transfer(
    basis: AmountBasis,
    ceiling: f64,
    floor: Option<f64>,
    amount: f64,
    cadence: LowerCadence,
) -> Result<Lowered, LowerError> {
    let field = match basis {
        AmountBasis::AnnualIncome => "income",
        AmountBasis::Wealth => "wealth",
    };
    let basis_expr = || Expr::Field { obj: "citizen".into(), field: field.into() };

    // exception₁: ceiling > citizen.basis  → amount (eligible below ceiling)
    let below_ceiling = gt(money(ceiling), basis_expr());
    let mut exceptions = vec![(below_ceiling, money(amount))];

    // exception₂: if floor is set, citizens with basis ≤ floor are ineligible
    // (we model "income > floor" as the eligibility guard, and negate it by
    // adding an override-to-zero exception for basis ≤ floor).
    // Re-encoding: basis ≤ floor  ↔  NOT (basis > floor)  →  no clean DSL.
    // Pragmatic: emit exception guard `floor > basis` (last-wins → 0.0).
    if let Some(f) = floor {
        let at_or_below_floor = gt(money(f), basis_expr());
        exceptions.push((at_or_below_floor, money(0.0)));
    }

    let body = DefaultExpr { base: Expr::LitMoney(0.0), exceptions };
    let scope = Scope {
        name: "ConditionalTransfer".into(),
        params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
        items: vec![Item::Definition {
            name: "transfer_amount".into(),
            ty: Type::Money,
            body,
        }],
    };
    Ok(Lowered {
        program: Program { scopes: vec![scope] },
        effect: LawEffect::PerCitizenBenefit {
            scope: "ConditionalTransfer",
            amount_def: "transfer_amount",
        },
        cadence: cadence_to_runtime(cadence),
    })
}

/// Flat-rate consumption tax / VAT: `vat_owed = citizen.consumption * rate`.
/// Reuses `PerCitizenIncomeTax` effect so the dispatcher deducts from Wealth
/// and credits Treasury — the only difference is the DSL references
/// `citizen.consumption` rather than `citizen.income`.
fn lower_consumption_tax(rate: f64, cadence: LowerCadence) -> Result<Lowered, LowerError> {
    let consumption = Expr::Field { obj: "citizen".into(), field: "consumption".into() };
    let body = DefaultExpr {
        base: mul(money(rate), consumption),
        exceptions: vec![],
    };
    let scope = Scope {
        name: "ConsumptionTax".into(),
        params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
        items: vec![Item::Definition { name: "vat_owed".into(), ty: Type::Money, body }],
    };
    Ok(Lowered {
        program: Program { scopes: vec![scope] },
        effect: LawEffect::PerCitizenIncomeTax { scope: "ConsumptionTax", owed_def: "vat_owed" },
        cadence: cadence_to_runtime(cadence),
    })
}

/// Wealth tax: `tax_owed = rate * max(citizen.wealth - exemption, 0)`.
/// Uses `PerCitizenIncomeTax` effect (deduct from Wealth, credit Treasury).
/// DSL: base=0.0; exception (citizen.wealth > exemption) = rate*(wealth-exemption).
fn lower_wealth_tax(exemption: f64, rate: f64, cadence: LowerCadence) -> Result<Lowered, LowerError> {
    let wealth = || Expr::Field { obj: "citizen".into(), field: "wealth".into() };
    let body = DefaultExpr {
        base: Expr::LitMoney(0.0),
        exceptions: vec![(
            gt(wealth(), money(exemption)),
            mul(money(rate), sub(wealth(), money(exemption))),
        )],
    };
    let scope = Scope {
        name: "WealthTax".into(),
        params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
        items: vec![Item::Definition { name: "tax_owed".into(), ty: Type::Money, body }],
    };
    Ok(Lowered {
        program: Program { scopes: vec![scope] },
        effect: LawEffect::PerCitizenIncomeTax { scope: "WealthTax", owed_def: "tax_owed" },
        cadence: cadence_to_runtime(cadence),
    })
}

/// Audit enforcement: the DSL scope is a no-op placeholder. The actual
/// selection + penalty logic lives in the dispatcher via `LawEffect::Audit`.
fn lower_audit(selection_prob: f64, penalty_rate: f64, cadence: LowerCadence) -> Result<Lowered, LowerError> {
    let body = DefaultExpr { base: Expr::LitMoney(0.0), exceptions: vec![] };
    let scope = Scope {
        name: "AuditEnforcement".into(),
        params: vec![ParamDecl { name: "citizen".into(), ty: Type::Money }],
        items: vec![Item::Definition { name: "noop".into(), ty: Type::Money, body }],
    };
    Ok(Lowered {
        program: Program { scopes: vec![scope] },
        effect: LawEffect::Audit { selection_prob, penalty_rate },
        cadence: cadence_to_runtime(cadence),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dsl::typecheck_program;
    use crate::eval::{eval_default, EvalCtx, Value};
    use simulator_types::Money;
    use std::collections::HashMap;

    fn sample_brackets() -> Vec<TaxBracket> {
        vec![
            TaxBracket { floor: 12_000.0, ceil: Some(50_000.0), rate: 0.10 },
            TaxBracket { floor: 50_000.0, ceil: Some(200_000.0), rate: 0.22 },
            TaxBracket { floor: 200_000.0, ceil: None, rate: 0.35 },
        ]
    }

    #[test]
    fn conditional_transfer_below_ceiling_eligible() {
        let stmt = IgStatement::Regulative(RegulativeStmt {
            attribute: ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: Some(Deontic::Must),
            aim: "receive".into(),
            direct_object: None,
            direct_object_property: None,
            indirect_object: None,
            indirect_object_property: None,
            activation_conditions: vec![],
            execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::ConditionalTransfer {
                eligibility_basis: AmountBasis::AnnualIncome,
                ceiling: 30_000.0,
                floor: None,
                amount: 1_200.0,
                cadence: LowerCadence::Yearly,
            }),
        });
        let lowered = lower_statement(&stmt).unwrap();
        typecheck_program(&lowered.program).unwrap();

        let scope = &lowered.program.scopes[0];
        let Item::Definition { body, .. } = &scope.items[0];

        for (income, expected) in [(20_000.0_f64, 1_200.0), (35_000.0, 0.0)] {
            let mut ctx = EvalCtx { bindings: HashMap::new(), field_bindings: HashMap::new() };
            ctx.field_bindings.insert(
                ("citizen".into(), "income".into()),
                Value::Money(Money::from_num(income)),
            );
            let v = eval_default(body, &ctx).as_money().to_num::<f64>();
            assert!((v - expected).abs() < 1.0, "income={income}: got {v}, want {expected}");
        }
    }

    #[test]
    fn means_tested_benefit_no_taper() {
        let stmt = IgStatement::Regulative(RegulativeStmt {
            attribute: ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: Some(Deontic::Must),
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
                income_ceiling: 20_000.0,
                taper_floor: None,
                amount: 5_000.0,
                cadence: LowerCadence::Yearly,
            }),
        });
        let lowered = lower_statement(&stmt).unwrap();
        typecheck_program(&lowered.program).unwrap();

        let scope = &lowered.program.scopes[0];
        let Item::Definition { body, .. } = &scope.items[0];

        for (income, expected) in [(10_000.0_f64, 5_000.0), (25_000.0, 0.0)] {
            let mut ctx = EvalCtx { bindings: HashMap::new(), field_bindings: HashMap::new() };
            ctx.field_bindings.insert(
                ("citizen".into(), "income".into()),
                Value::Money(Money::from_num(income)),
            );
            let v = eval_default(body, &ctx).as_money().to_num::<f64>();
            assert!((v - expected).abs() < 1.0, "income={income}: got {v}, want {expected}");
        }
    }

    #[test]
    fn lowered_brackets_match_hand_written() {
        let stmt = IgStatement::Regulative(RegulativeStmt {
            attribute: ActorRef { class: "individual".into(), qualifier: None },
            attribute_property: None,
            deontic: Some(Deontic::Must),
            aim: "pay".into(),
            direct_object: None,
            direct_object_property: None,
            indirect_object: None,
            indirect_object_property: None,
            activation_conditions: vec![],
            execution_constraints: vec![],
            or_else: None,
            computation: Some(Computation::BracketedTax {
                basis: AmountBasis::AnnualIncome,
                threshold: 12_000.0,
                brackets: sample_brackets(),
                cadence: LowerCadence::Yearly,
            }),
        });

        let lowered = lower_statement(&stmt).unwrap();
        typecheck_program(&lowered.program).unwrap();

        let scope = &lowered.program.scopes[0];
        let Item::Definition { body, .. } = &scope.items[0];

        for income in [10_000.0, 30_000.0, 100_000.0, 500_000.0] {
            let mut ctx = EvalCtx { bindings: HashMap::new(), field_bindings: HashMap::new() };
            ctx.field_bindings.insert(
                ("citizen".into(), "income".into()),
                Value::Money(Money::from_num(income)),
            );
            let v = eval_default(body, &ctx).as_money().to_num::<f64>();
            let expected: f64 = if income <= 12_000.0 { 0.0 }
                else if income <= 50_000.0 { 0.10 * (income - 12_000.0) }
                else if income <= 200_000.0 {
                    0.10 * (50_000.0 - 12_000.0) + 0.22 * (income - 50_000.0)
                } else {
                    0.10 * (50_000.0 - 12_000.0) + 0.22 * (200_000.0 - 50_000.0)
                        + 0.35 * (income - 200_000.0)
                };
            assert!((v - expected).abs() < 1.0, "income={income}: got {v}, want {expected}");
        }
    }
}
