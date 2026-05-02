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
#[derive(Clone)]
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
        Expr::Let { name, value, body } => {
            let v = eval_expr(value, ctx);
            let mut child_ctx = ctx.clone();
            child_ctx.bindings.insert(name.clone(), v);
            eval_expr(body, &child_ctx)
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
    fn let_binding_evaluates() {
        let src = r#"
            scope TaxCalc(citizen: money) {
              def owed : money =
                let r = 0.25 in r * citizen.income
            }
        "#;
        let prog = parse_program(src).unwrap();
        typecheck_program(&prog).unwrap();
        let scope = &prog.scopes[0];
        let Item::Definition { body, .. } = &scope.items[0];
        let mut ctx = EvalCtx { bindings: HashMap::new(), field_bindings: HashMap::new() };
        ctx.field_bindings.insert(
            ("citizen".into(), "income".into()),
            Value::Money(Money::from_num(10_000.0_f64)),
        );
        let result = eval_default(body, &ctx).as_money();
        let expected = 2_500.0_f64;
        assert!((result.to_num::<f64>() - expected).abs() < 0.01,
            "expected {expected}, got {}", result.to_num::<f64>());
    }

    // ── Direct AST eval tests — no parser needed ──────────────────────────────

    fn empty_ctx() -> EvalCtx {
        EvalCtx { bindings: HashMap::new(), field_bindings: HashMap::new() }
    }
    fn money_ctx(income: f64) -> EvalCtx {
        let mut ctx = empty_ctx();
        ctx.field_bindings.insert(
            ("citizen".into(), "income".into()),
            Value::Money(Money::from_num(income)),
        );
        ctx
    }

    #[test]
    fn if_then_else_true_branch() {
        // `if true then 100.0 else 0.0` → 100.0
        let e = Expr::If {
            cond:  Box::new(Expr::LitBool(true)),
            then_: Box::new(Expr::LitMoney(100.0)),
            else_: Box::new(Expr::LitMoney(0.0)),
        };
        let ctx = empty_ctx();
        let v = eval_expr(&e, &ctx).as_money().to_num::<f64>();
        assert!((v - 100.0).abs() < 0.001, "true branch: expected 100, got {v}");
    }

    #[test]
    fn if_then_else_false_branch() {
        // `if false then 100.0 else 9.0` → 9.0
        let e = Expr::If {
            cond:  Box::new(Expr::LitBool(false)),
            then_: Box::new(Expr::LitMoney(100.0)),
            else_: Box::new(Expr::LitMoney(9.0)),
        };
        let v = eval_expr(&e, &empty_ctx()).as_money().to_num::<f64>();
        assert!((v - 9.0).abs() < 0.001, "false branch: expected 9, got {v}");
    }

    #[test]
    fn min_selects_smaller() {
        // min(300.0, 100.0) → 100.0
        let e = Expr::Min(
            Box::new(Expr::LitMoney(300.0)),
            Box::new(Expr::LitMoney(100.0)),
        );
        let v = eval_expr(&e, &empty_ctx()).as_money().to_num::<f64>();
        assert!((v - 100.0).abs() < 0.001, "expected 100, got {v}");
    }

    #[test]
    fn max_selects_larger() {
        // max(300.0, 100.0) → 300.0
        let e = Expr::Max(
            Box::new(Expr::LitMoney(300.0)),
            Box::new(Expr::LitMoney(100.0)),
        );
        let v = eval_expr(&e, &empty_ctx()).as_money().to_num::<f64>();
        assert!((v - 300.0).abs() < 0.001, "expected 300, got {v}");
    }

    #[test]
    fn unary_neg_money() {
        // -500.0 → Value::Money(-500)
        let e = Expr::UnaryOp {
            op: UnaryOp::Neg,
            expr: Box::new(Expr::LitMoney(500.0)),
        };
        let v = eval_expr(&e, &empty_ctx()).as_money().to_num::<f64>();
        assert!((v + 500.0).abs() < 0.001, "expected -500, got {v}");
    }

    #[test]
    fn unary_not_bool() {
        // !true → false, !false → true
        for (input, expected) in [(true, false), (false, true)] {
            let e = Expr::UnaryOp {
                op: UnaryOp::Not,
                expr: Box::new(Expr::LitBool(input)),
            };
            match eval_expr(&e, &empty_ctx()) {
                Value::Bool(b) => assert_eq!(b, expected, "!{input} should be {expected}"),
                other => panic!("expected Bool, got {other:?}"),
            }
        }
    }

    #[test]
    fn logical_and_or() {
        // true && false → false; false || true → true
        let and_e = Expr::BinOp {
            op: BinOp::And,
            lhs: Box::new(Expr::LitBool(true)),
            rhs: Box::new(Expr::LitBool(false)),
        };
        let or_e = Expr::BinOp {
            op: BinOp::Or,
            lhs: Box::new(Expr::LitBool(false)),
            rhs: Box::new(Expr::LitBool(true)),
        };
        match eval_expr(&and_e, &empty_ctx()) {
            Value::Bool(b) => assert!(!b, "true && false should be false"),
            _ => panic!("expected Bool"),
        }
        match eval_expr(&or_e, &empty_ctx()) {
            Value::Bool(b) => assert!(b, "false || true should be true"),
            _ => panic!("expected Bool"),
        }
    }

    #[test]
    fn comparison_operators() {
        // 5 > 3 → true; 5 < 3 → false; 5 >= 5 → true; 5 <= 4 → false; 5 == 5 → true; 5 != 3 → true
        let cases: &[(&str, BinOp, f64, f64, bool)] = &[
            ("5 > 3",  BinOp::Gt, 5.0, 3.0,  true),
            ("5 < 3",  BinOp::Lt, 5.0, 3.0,  false),
            ("5 >= 5", BinOp::Ge, 5.0, 5.0,  true),
            ("5 <= 4", BinOp::Le, 5.0, 4.0,  false),
            ("5 == 5", BinOp::Eq, 5.0, 5.0,  true),
            ("5 != 3", BinOp::Ne, 5.0, 3.0,  true),
        ];
        for &(label, op, lv, rv, expected) in cases {
            let e = Expr::BinOp {
                op,
                lhs: Box::new(Expr::LitMoney(lv)),
                rhs: Box::new(Expr::LitMoney(rv)),
            };
            match eval_expr(&e, &empty_ctx()) {
                Value::Bool(b) => assert_eq!(b, expected, "{label}: expected {expected}"),
                _ => panic!("{label}: expected Bool"),
            }
        }
    }

    #[test]
    fn int_arithmetic() {
        let ctx = empty_ctx();
        // 10 + 3 = 13
        let add = Expr::BinOp { op: BinOp::Add, lhs: Box::new(Expr::LitInt(10)), rhs: Box::new(Expr::LitInt(3)) };
        // 10 - 3 = 7
        let sub = Expr::BinOp { op: BinOp::Sub, lhs: Box::new(Expr::LitInt(10)), rhs: Box::new(Expr::LitInt(3)) };
        // 4 * 5 = 20
        let mul = Expr::BinOp { op: BinOp::Mul, lhs: Box::new(Expr::LitInt(4)),  rhs: Box::new(Expr::LitInt(5)) };
        // 9 / 3 = 3
        let div = Expr::BinOp { op: BinOp::Div, lhs: Box::new(Expr::LitInt(9)),  rhs: Box::new(Expr::LitInt(3)) };
        assert!(matches!(eval_expr(&add, &ctx), Value::Int(13)));
        assert!(matches!(eval_expr(&sub, &ctx), Value::Int(7)));
        assert!(matches!(eval_expr(&mul, &ctx), Value::Int(20)));
        assert!(matches!(eval_expr(&div, &ctx), Value::Int(3)));
    }

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
