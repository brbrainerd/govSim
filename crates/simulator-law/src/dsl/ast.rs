//! UGS-Catala AST.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Program {
    pub scopes: Vec<Scope>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scope {
    pub name: String,
    pub params: Vec<ParamDecl>,
    pub items: Vec<Item>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParamDecl {
    pub name: String,
    pub ty: Type,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Item {
    /// `def name : type = default_expr`
    Definition {
        name: String,
        ty: Type,
        body: DefaultExpr,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefaultExpr {
    pub base: Expr,
    /// `(guard, value)` pairs evaluated in source order; the LAST whose
    /// guard is true wins. If none fire, `base` is the result.
    pub exceptions: Vec<(Expr, Expr)>,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq, Serialize, Deserialize)]
pub enum Type { Money, Bool, Int, Rate }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Expr {
    LitMoney(f64),
    LitInt(i64),
    LitBool(bool),
    LitRate(f64),
    /// Bare identifier — either a scope param or a local `def`.
    Ident(String),
    /// Field access: `actor.income`.
    Field { obj: String, field: String },
    BinOp { op: BinOp, lhs: Box<Expr>, rhs: Box<Expr> },
    UnaryOp { op: UnaryOp, expr: Box<Expr> },
    If { cond: Box<Expr>, then_: Box<Expr>, else_: Box<Expr> },
    Min(Box<Expr>, Box<Expr>),
    Max(Box<Expr>, Box<Expr>),
}

#[derive(Debug, Clone, Copy, Eq, PartialEq, Serialize, Deserialize)]
pub enum BinOp {
    Add, Sub, Mul, Div,
    Gt, Ge, Lt, Le, Eq, Ne,
    And, Or,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq, Serialize, Deserialize)]
pub enum UnaryOp { Neg, Not }
