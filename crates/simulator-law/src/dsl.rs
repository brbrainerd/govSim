//! UGS-Catala — a Catala-inspired subset.
//!
//! ## Surface grammar (vertical-slice subset)
//!
//! ```text
//! program     := scope+
//! scope       := "scope" Ident "(" param_decl ("," param_decl)* ")" "{" item* "}"
//! param_decl  := Ident ":" type
//! item        := "def" Ident ":" type "=" default_expr
//! default_expr:= base_expr ("exception" expr "=" base_expr)*
//! base_expr   := if_expr | bin_expr
//! if_expr     := "if" expr "then" expr "else" expr
//! bin_expr    := atom ((+|-|*|/|>|>=|<|<=|==|!=|&&|"||") atom)*
//! atom        := number | bool | ident | "(" expr ")" | "min" "(" expr "," expr ")"
//!              | "max" "(" expr "," expr ")" | ident "." ident
//! type        := "money" | "bool" | "int" | "rate"
//! ```
//!
//! Defaults: an exception fires when its guard is true. If multiple
//! exceptions fire, the LAST in source order wins (matches blueprint's
//! "more specific exception" idiom for income-tax brackets).

pub mod ast;
pub mod parser;
pub mod typecheck;

pub use ast::*;
pub use parser::parse_program;
pub use typecheck::{typecheck_program, TypeError};
