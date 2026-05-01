//! Tree-walking evaluator for typechecked UGS-Catala programs.
//!
//! The Cranelift JIT (feature `jit`) will replace this in the stretch
//! milestone. For now this is the canonical interpreter; a tree walk over
//! a 6-bracket tax program is well under 1 µs per citizen — fine for
//! Phase-4 acceptance.

use std::collections::HashMap;

use simulator_types::Money;

use crate::dsl::ast::*;

#[derive(Debug, Clone, Copy)]
pub enum Value {
    Money(Money),
    Int(i64),
    Bool(bool),
    Rate(f64),
}

impl Value {
    #[allow(dead_code)] // used by tests; production path goes through eval_default → match
    pub fn as_money(self) -> Money {
        match self {
            Value::Money(m) => m,
            Value::Rate(r) => Money::from_num(r),
            Value::Int(i) => Money::from_num(i),
            Value::Bool(_) => panic!("expected money, got bool"),
        }
    }
    fn as_bool(self) -> bool {
        match self { Value::Bool(b) => b, _ => panic!("expected bool") }
    }
}

/// Runtime binding environment passed to `eval_*`. Caller sets up actor
/// fields under `field_bindings` and scope params under `bindings`.
pub struct EvalCtx {
    pub bindings: HashMap<String, Value>,
    pub field_bindings: HashMap<(String, String), Value>,
}

pub fn eval_default(d: &DefaultExpr, ctx: &EvalCtx) -> Value {
    let mut chosen = eval_expr(&d.base, ctx);
    // Last fired exception wins.
    for (guard, value) in &d.exceptions {
        if eval_expr(guard, ctx).as_bool() {
            chosen = eval_expr(value, ctx);
        }
    }
    chosen
}

pub fn eval_expr(e: &Expr, ctx: &EvalCtx) -> Value {
    match e {
        Expr::LitMoney(x) => Value::Money(Money::from_num(*x)),
        Expr::LitInt(i) => Value::Int(*i),
        Expr::LitBool(b) => Value::Bool(*b),
        Expr::LitRate(r) => Value::Rate(*r),
        Expr::Ident(n) => *ctx.bindings.get(n)
            .unwrap_or_else(|| panic!("undefined ident at runtime: {n}")),
        Expr::Field { obj, field } => *ctx.field_bindings.get(&(obj.clone(), field.clone()))
            .unwrap_or_else(|| panic!("undefined field at runtime: {obj}.{field}")),
        Expr::BinOp { op, lhs, rhs } => {
            let l = eval_expr(lhs, ctx);
            let r = eval_expr(rhs, ctx);
            eval_binop(*op, l, r)
        }
        Expr::UnaryOp { op, expr } => {
            let v = eval_expr(expr, ctx);
            match (op, v) {
                (UnaryOp::Neg, Value::Money(m)) => Value::Money(-m),
                (UnaryOp::Neg, Value::Int(i)) => Value::Int(-i),
                (UnaryOp::Neg, Value::Rate(r)) => Value::Rate(-r),
                (UnaryOp::Not, Value::Bool(b)) => Value::Bool(!b),
                _ => panic!("unary type error"),
            }
        }
        Expr::If { cond, then_, else_ } => {
            if eval_expr(cond, ctx).as_bool() { eval_expr(then_, ctx) }
            else { eval_expr(else_, ctx) }
        }
        Expr::Min(a, b) => {
            let av = eval_expr(a, ctx); let bv = eval_expr(b, ctx);
            min_value(av, bv)
        }
        Expr::Max(a, b) => {
            let av = eval_expr(a, ctx); let bv = eval_expr(b, ctx);
            max_value(av, bv)
        }
    }
}

fn eval_binop(op: BinOp, l: Value, r: Value) -> Value {
    use BinOp::*;
    match op {
        Add => add(l, r),
        Sub => sub(l, r),
        Mul => mul(l, r),
        Div => div(l, r),
        Gt | Ge | Lt | Le | Eq | Ne => Value::Bool(cmp(op, l, r)),
        And => Value::Bool(l.as_bool() && r.as_bool()),
        Or => Value::Bool(l.as_bool() || r.as_bool()),
    }
}

fn add(l: Value, r: Value) -> Value {
    match (l, r) {
        (Value::Money(a), Value::Money(b)) => Value::Money(a + b),
        (Value::Int(a), Value::Int(b)) => Value::Int(a + b),
        (Value::Rate(a), Value::Rate(b)) => Value::Rate(a + b),
        _ => panic!("add type error"),
    }
}
fn sub(l: Value, r: Value) -> Value {
    match (l, r) {
        (Value::Money(a), Value::Money(b)) => Value::Money(a - b),
        (Value::Int(a), Value::Int(b)) => Value::Int(a - b),
        (Value::Rate(a), Value::Rate(b)) => Value::Rate(a - b),
        _ => panic!("sub type error"),
    }
}
fn mul(l: Value, r: Value) -> Value {
    match (l, r) {
        (Value::Money(a), Value::Money(b)) => Value::Money(a * b),
        (Value::Int(a), Value::Int(b)) => Value::Int(a * b),
        (Value::Money(a), Value::Int(b)) | (Value::Int(b), Value::Money(a)) =>
            Value::Money(a * Money::from_num(b)),
        (Value::Rate(r), Value::Money(m)) | (Value::Money(m), Value::Rate(r)) =>
            Value::Money(m * Money::from_num(r)),
        (Value::Rate(a), Value::Rate(b)) => Value::Rate(a * b),
        _ => panic!("mul type error"),
    }
}
fn div(l: Value, r: Value) -> Value {
    match (l, r) {
        (Value::Money(a), Value::Money(b)) => Value::Rate(a.to_num::<f64>() / b.to_num::<f64>()),
        (Value::Int(a), Value::Int(b)) => Value::Int(a / b),
        (Value::Money(a), Value::Int(b)) => Value::Money(a / Money::from_num(b)),
        (Value::Money(a), Value::Rate(b)) => Value::Money(a / Money::from_num(b)),
        _ => panic!("div type error"),
    }
}
fn cmp(op: BinOp, l: Value, r: Value) -> bool {
    let (la, ra) = match (l, r) {
        (Value::Money(a), Value::Money(b)) => (a.to_num::<f64>(), b.to_num::<f64>()),
        (Value::Int(a), Value::Int(b)) => (a as f64, b as f64),
        (Value::Rate(a), Value::Rate(b)) => (a, b),
        (Value::Bool(a), Value::Bool(b)) => (a as i32 as f64, b as i32 as f64),
        _ => panic!("cmp type error"),
    };
    use BinOp::*;
    match op {
        Gt => la > ra, Ge => la >= ra,
        Lt => la < ra, Le => la <= ra,
        Eq => la == ra, Ne => la != ra,
        _ => unreachable!(),
    }
}
fn min_value(a: Value, b: Value) -> Value {
    match (a, b) {
        (Value::Money(x), Value::Money(y)) => Value::Money(if x < y { x } else { y }),
        (Value::Int(x), Value::Int(y)) => Value::Int(x.min(y)),
        (Value::Rate(x), Value::Rate(y)) => Value::Rate(x.min(y)),
        _ => panic!("min type error"),
    }
}
fn max_value(a: Value, b: Value) -> Value {
    match (a, b) {
        (Value::Money(x), Value::Money(y)) => Value::Money(if x > y { x } else { y }),
        (Value::Int(x), Value::Int(y)) => Value::Int(x.max(y)),
        (Value::Rate(x), Value::Rate(y)) => Value::Rate(x.max(y)),
        _ => panic!("max type error"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dsl::{ast::Item, parse_program, typecheck_program};

    #[test]
    fn three_bracket_tax() {
        let src = r#"
            scope IncomeTax(citizen: money) {
              def tax_owed : money =
                    0.0
                exception (citizen.income > 12000.0) =
                    0.10 * (min(citizen.income, 50000.0) - 12000.0)
                exception (citizen.income > 50000.0) =
                    0.10 * (50000.0 - 12000.0) +
                    0.22 * (min(citizen.income, 200000.0) - 50000.0)
                exception (citizen.income > 200000.0) =
                    0.10 * (50000.0 - 12000.0) +
                    0.22 * (200000.0 - 50000.0) +
                    0.35 * (citizen.income - 200000.0)
            }
        "#;
        let prog = parse_program(src).unwrap();
        typecheck_program(&prog).unwrap();
        let scope = &prog.scopes[0];
        let Item::Definition { body, .. } = &scope.items[0];
        let mut ctx = EvalCtx { bindings: HashMap::new(), field_bindings: HashMap::new() };
        for income in [10_000.0, 30_000.0, 100_000.0, 500_000.0] {
            ctx.field_bindings.insert(
                ("citizen".into(), "income".into()),
                Value::Money(Money::from_num(income)),
            );
            let v = eval_default(body, &ctx).as_money();
            let expected: f64 = if income <= 12_000.0 { 0.0 }
                else if income <= 50_000.0 { 0.10 * (income - 12_000.0) }
                else if income <= 200_000.0 {
                    0.10 * (50_000.0 - 12_000.0) + 0.22 * (income - 50_000.0)
                } else {
                    0.10 * (50_000.0 - 12_000.0) + 0.22 * (200_000.0 - 50_000.0)
                        + 0.35 * (income - 200_000.0)
                };
            let got = v.to_num::<f64>();
            assert!((got - expected).abs() < 1.0, "income={income}: expected ~{expected}, got {got}");
        }
    }
}
