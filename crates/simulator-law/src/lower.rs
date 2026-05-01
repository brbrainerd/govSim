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
