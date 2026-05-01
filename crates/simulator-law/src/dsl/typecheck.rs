//! Hindley-Milner-lite typechecker. Concrete only — no inference variables.
//!
//! The runtime evaluator stays untyped (variant matching) so the
//! typechecker is the sole guardian of category errors. Every public
//! call to `eval::run` must have passed through `typecheck_program`.

use std::collections::HashMap;

use super::ast::*;

#[derive(Debug, thiserror::Error)]
pub enum TypeError {
    #[error("undefined identifier: {0}")]
    Undefined(String),
    #[error("undefined field: {obj}.{field}")]
    UndefinedField { obj: String, field: String },
    #[error("type mismatch in {ctx}: expected {expected:?}, got {got:?}")]
    Mismatch { ctx: &'static str, expected: Type, got: Type },
    #[error("operator {op:?} not defined for ({lhs:?}, {rhs:?})")]
    BadOp { op: BinOp, lhs: Type, rhs: Type },
}

/// Schema of an actor parameter — fields the DSL can reach via `actor.field`.
/// Phase 4 vertical slice hardcodes a single `citizen` schema; later this
/// will be derived from the ECS Component registry.
pub fn citizen_schema() -> HashMap<&'static str, Type> {
    let mut m = HashMap::new();
    m.insert("income", Type::Money);
    m.insert("wealth", Type::Money);
    m
}

pub fn typecheck_program(prog: &Program) -> Result<(), TypeError> {
    for s in &prog.scopes { typecheck_scope(s)?; }
    Ok(())
}

fn typecheck_scope(s: &Scope) -> Result<(), TypeError> {
    let mut env: HashMap<String, Type> = HashMap::new();
    for p in &s.params { env.insert(p.name.clone(), p.ty); }
    for item in &s.items {
        match item {
            Item::Definition { name, ty, body } => {
                let t = check_default(body, &env)?;
                if t != *ty {
                    return Err(TypeError::Mismatch { ctx: "definition", expected: *ty, got: t });
                }
                env.insert(name.clone(), *ty);
            }
        }
    }
    Ok(())
}

fn check_default(d: &DefaultExpr, env: &HashMap<String, Type>) -> Result<Type, TypeError> {
    let base_ty = check_expr(&d.base, env)?;
    for (guard, value) in &d.exceptions {
        let g = check_expr(guard, env)?;
        if g != Type::Bool {
            return Err(TypeError::Mismatch { ctx: "exception guard", expected: Type::Bool, got: g });
        }
        let v = check_expr(value, env)?;
        if v != base_ty {
            return Err(TypeError::Mismatch { ctx: "exception value", expected: base_ty, got: v });
        }
    }
    Ok(base_ty)
}

fn check_expr(e: &Expr, env: &HashMap<String, Type>) -> Result<Type, TypeError> {
    match e {
        Expr::LitMoney(_) => Ok(Type::Money),
        Expr::LitInt(_) => Ok(Type::Int),
        Expr::LitBool(_) => Ok(Type::Bool),
        Expr::LitRate(_) => Ok(Type::Rate),
        Expr::Ident(name) => env.get(name).copied().ok_or_else(|| TypeError::Undefined(name.clone())),
        Expr::Field { obj, field } => {
            let ot = env.get(obj).copied().ok_or_else(|| TypeError::Undefined(obj.clone()))?;
            // Only "actor"-shaped params have fields; we recognize money-typed actors as citizens.
            // (Phase 4 simplification — later this becomes a real schema lookup keyed by actor class.)
            let _ = ot;
            citizen_schema()
                .get(field.as_str())
                .copied()
                .ok_or_else(|| TypeError::UndefinedField { obj: obj.clone(), field: field.clone() })
        }
        Expr::BinOp { op, lhs, rhs } => {
            let l = check_expr(lhs, env)?;
            let r = check_expr(rhs, env)?;
            check_binop(*op, l, r)
        }
        Expr::UnaryOp { op, expr } => {
            let t = check_expr(expr, env)?;
            match (op, t) {
                (UnaryOp::Neg, Type::Money | Type::Int | Type::Rate) => Ok(t),
                (UnaryOp::Not, Type::Bool) => Ok(Type::Bool),
                _ => Err(TypeError::Mismatch { ctx: "unary", expected: Type::Bool, got: t }),
            }
        }
        Expr::If { cond, then_, else_ } => {
            let c = check_expr(cond, env)?;
            if c != Type::Bool {
                return Err(TypeError::Mismatch { ctx: "if cond", expected: Type::Bool, got: c });
            }
            let t = check_expr(then_, env)?;
            let f = check_expr(else_, env)?;
            if t != f {
                return Err(TypeError::Mismatch { ctx: "if branches", expected: t, got: f });
            }
            Ok(t)
        }
        Expr::Min(a, b) | Expr::Max(a, b) => {
            let ta = check_expr(a, env)?;
            let tb = check_expr(b, env)?;
            if ta != tb {
                return Err(TypeError::Mismatch { ctx: "min/max", expected: ta, got: tb });
            }
            Ok(ta)
        }
    }
}

fn check_binop(op: BinOp, l: Type, r: Type) -> Result<Type, TypeError> {
    use BinOp::*;
    use Type::*;
    match op {
        // arithmetic
        Add | Sub => match (l, r) {
            (Money, Money) | (Int, Int) | (Rate, Rate) => Ok(l),
            _ => Err(TypeError::BadOp { op, lhs: l, rhs: r }),
        },
        Mul => match (l, r) {
            (Money, Money) => Ok(Money),         // tax brackets need this (rate * money via Money literal)
            (Int, Int) => Ok(Int),
            (Money, Int) | (Int, Money) => Ok(Money),
            (Rate, Money) | (Money, Rate) => Ok(Money),
            (Rate, Rate) => Ok(Rate),
            _ => Err(TypeError::BadOp { op, lhs: l, rhs: r }),
        },
        Div => match (l, r) {
            (Money, Money) => Ok(Rate),
            (Int, Int) => Ok(Int),
            (Money, Int) => Ok(Money),
            (Money, Rate) => Ok(Money),
            _ => Err(TypeError::BadOp { op, lhs: l, rhs: r }),
        },
        // comparison
        Gt | Ge | Lt | Le | Eq | Ne => {
            if l == r { Ok(Bool) } else { Err(TypeError::BadOp { op, lhs: l, rhs: r }) }
        }
        // logical
        And | Or => match (l, r) {
            (Bool, Bool) => Ok(Bool),
            _ => Err(TypeError::BadOp { op, lhs: l, rhs: r }),
        },
    }
}
