//! Hand-rolled lexer + recursive-descent parser for UGS-Catala.
//!
//! Single-pass; produces source-level errors with byte offsets.

use super::ast::*;

#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("at byte {pos}: {msg}")]
    At { pos: usize, msg: String },
    #[error("unexpected end of input")]
    Eof,
}

#[derive(Debug, Clone, PartialEq)]
enum Tok<'a> {
    Ident(&'a str),
    Number(f64),
    Int(i64),
    LParen, RParen, LBrace, RBrace,
    Comma, Colon, Eq, Dot,
    Plus, Minus, Star, Slash,
    Gt, Ge, Lt, Le, EqEq, Neq,
    AndAnd, OrOr, Bang,
    KwScope, KwDef, KwException, KwIf, KwThen, KwElse, KwTrue, KwFalse,
    KwMin, KwMax, KwLet, KwIn,
    KwMoney, KwBool, KwInt, KwRate,
}

struct Lexer<'a> { src: &'a str, pos: usize }

impl<'a> Lexer<'a> {
    fn new(src: &'a str) -> Self { Self { src, pos: 0 } }

    fn skip_ws(&mut self) {
        while let Some(c) = self.src[self.pos..].chars().next() {
            if c.is_whitespace() { self.pos += c.len_utf8(); continue; }
            // line comment: `# ...` to end of line
            if c == '#' {
                while self.pos < self.src.len() && self.src.as_bytes()[self.pos] != b'\n' {
                    self.pos += 1;
                }
                continue;
            }
            break;
        }
    }

    fn next(&mut self) -> Result<Option<(usize, Tok<'a>)>, ParseError> {
        self.skip_ws();
        if self.pos >= self.src.len() { return Ok(None); }
        let start = self.pos;
        let bytes = self.src.as_bytes();
        let two = || -> &str { &self.src[start..(start + 2).min(self.src.len())] };
        let advance = |s: &mut Self, n: usize| s.pos += n;

        // Multi-char punctuation first.
        let tok = match two() {
            ">=" => { advance(self, 2); Tok::Ge },
            "<=" => { advance(self, 2); Tok::Le },
            "==" => { advance(self, 2); Tok::EqEq },
            "!=" => { advance(self, 2); Tok::Neq },
            "&&" => { advance(self, 2); Tok::AndAnd },
            "||" => { advance(self, 2); Tok::OrOr },
            _ => {
                let c = bytes[self.pos] as char;
                match c {
                    '(' => { advance(self, 1); Tok::LParen },
                    ')' => { advance(self, 1); Tok::RParen },
                    '{' => { advance(self, 1); Tok::LBrace },
                    '}' => { advance(self, 1); Tok::RBrace },
                    ',' => { advance(self, 1); Tok::Comma },
                    ':' => { advance(self, 1); Tok::Colon },
                    '=' => { advance(self, 1); Tok::Eq },
                    '.' => { advance(self, 1); Tok::Dot },
                    '+' => { advance(self, 1); Tok::Plus },
                    '-' => { advance(self, 1); Tok::Minus },
                    '*' => { advance(self, 1); Tok::Star },
                    '/' => { advance(self, 1); Tok::Slash },
                    '>' => { advance(self, 1); Tok::Gt },
                    '<' => { advance(self, 1); Tok::Lt },
                    '!' => { advance(self, 1); Tok::Bang },
                    c if c.is_ascii_digit() => self.lex_number(start)?,
                    c if c == '_' || c.is_ascii_alphabetic() => self.lex_ident_or_kw(start),
                    _ => return Err(ParseError::At {
                        pos: start, msg: format!("unexpected char {:?}", c),
                    }),
                }
            }
        };
        Ok(Some((start, tok)))
    }

    fn lex_number(&mut self, start: usize) -> Result<Tok<'a>, ParseError> {
        let bytes = self.src.as_bytes();
        let mut end = start;
        let mut saw_dot = false;
        while end < bytes.len() {
            let c = bytes[end];
            if c.is_ascii_digit() { end += 1; }
            else if c == b'.' && !saw_dot { saw_dot = true; end += 1; }
            else if c == b'_' { end += 1; }
            else { break; }
        }
        let raw = self.src[start..end].replace('_', "");
        self.pos = end;
        if saw_dot {
            raw.parse::<f64>()
                .map(Tok::Number)
                .map_err(|e| ParseError::At { pos: start, msg: e.to_string() })
        } else {
            raw.parse::<i64>()
                .map(Tok::Int)
                .map_err(|e| ParseError::At { pos: start, msg: e.to_string() })
        }
    }

    fn lex_ident_or_kw(&mut self, start: usize) -> Tok<'a> {
        let bytes = self.src.as_bytes();
        let mut end = start;
        while end < bytes.len() {
            let c = bytes[end];
            if c == b'_' || c.is_ascii_alphanumeric() { end += 1; } else { break; }
        }
        self.pos = end;
        let s = &self.src[start..end];
        match s {
            "scope" => Tok::KwScope,
            "def" => Tok::KwDef,
            "exception" => Tok::KwException,
            "if" => Tok::KwIf,
            "then" => Tok::KwThen,
            "else" => Tok::KwElse,
            "true" => Tok::KwTrue,
            "false" => Tok::KwFalse,
            "min" => Tok::KwMin,
            "max" => Tok::KwMax,
            "let" => Tok::KwLet,
            "in"  => Tok::KwIn,
            "money" => Tok::KwMoney,
            "bool" => Tok::KwBool,
            "int" => Tok::KwInt,
            "rate" => Tok::KwRate,
            _ => Tok::Ident(s),
        }
    }
}

struct Parser<'a> {
    toks: Vec<(usize, Tok<'a>)>,
    idx: usize,
}

impl<'a> Parser<'a> {
    fn peek(&self) -> Option<&Tok<'a>> { self.toks.get(self.idx).map(|(_, t)| t) }
    fn pos(&self) -> usize { self.toks.get(self.idx).map(|(p, _)| *p).unwrap_or(0) }
    fn bump(&mut self) -> Option<Tok<'a>> {
        let t = self.toks.get(self.idx).map(|(_, t)| t.clone());
        if t.is_some() { self.idx += 1; }
        t
    }
    fn expect(&mut self, want: &Tok<'a>) -> Result<(), ParseError> {
        let pos = self.pos();
        match self.bump() {
            Some(ref t) if t == want => Ok(()),
            Some(t) => Err(ParseError::At {
                pos, msg: format!("expected {:?}, found {:?}", want, t),
            }),
            None => Err(ParseError::Eof),
        }
    }

    fn parse_program(&mut self) -> Result<Program, ParseError> {
        let mut scopes = Vec::new();
        while self.peek().is_some() {
            scopes.push(self.parse_scope()?);
        }
        Ok(Program { scopes })
    }

    fn parse_scope(&mut self) -> Result<Scope, ParseError> {
        self.expect(&Tok::KwScope)?;
        let name = self.parse_ident()?;
        self.expect(&Tok::LParen)?;
        let mut params = Vec::new();
        if self.peek() != Some(&Tok::RParen) {
            loop {
                let pname = self.parse_ident()?;
                self.expect(&Tok::Colon)?;
                let ty = self.parse_type()?;
                params.push(ParamDecl { name: pname, ty });
                if self.peek() == Some(&Tok::Comma) { self.bump(); } else { break; }
            }
        }
        self.expect(&Tok::RParen)?;
        self.expect(&Tok::LBrace)?;
        let mut items = Vec::new();
        while self.peek() != Some(&Tok::RBrace) {
            items.push(self.parse_item()?);
        }
        self.expect(&Tok::RBrace)?;
        Ok(Scope { name, params, items })
    }

    fn parse_ident(&mut self) -> Result<String, ParseError> {
        let pos = self.pos();
        match self.bump() {
            Some(Tok::Ident(s)) => Ok(s.to_string()),
            other => Err(ParseError::At {
                pos, msg: format!("expected identifier, found {:?}", other),
            }),
        }
    }

    fn parse_type(&mut self) -> Result<Type, ParseError> {
        let pos = self.pos();
        match self.bump() {
            Some(Tok::KwMoney) => Ok(Type::Money),
            Some(Tok::KwBool) => Ok(Type::Bool),
            Some(Tok::KwInt) => Ok(Type::Int),
            Some(Tok::KwRate) => Ok(Type::Rate),
            other => Err(ParseError::At {
                pos, msg: format!("expected type, found {:?}", other),
            }),
        }
    }

    fn parse_item(&mut self) -> Result<Item, ParseError> {
        self.expect(&Tok::KwDef)?;
        let name = self.parse_ident()?;
        self.expect(&Tok::Colon)?;
        let ty = self.parse_type()?;
        self.expect(&Tok::Eq)?;
        let body = self.parse_default_expr()?;
        Ok(Item::Definition { name, ty, body })
    }

    fn parse_default_expr(&mut self) -> Result<DefaultExpr, ParseError> {
        let base = self.parse_expr()?;
        let mut exceptions = Vec::new();
        while self.peek() == Some(&Tok::KwException) {
            self.bump();
            let guard = self.parse_expr()?;
            self.expect(&Tok::Eq)?;
            let value = self.parse_expr()?;
            exceptions.push((guard, value));
        }
        Ok(DefaultExpr { base, exceptions })
    }

    fn parse_expr(&mut self) -> Result<Expr, ParseError> { self.parse_or() }

    fn parse_or(&mut self) -> Result<Expr, ParseError> {
        let mut lhs = self.parse_and()?;
        while self.peek() == Some(&Tok::OrOr) {
            self.bump();
            let rhs = self.parse_and()?;
            lhs = Expr::BinOp { op: BinOp::Or, lhs: Box::new(lhs), rhs: Box::new(rhs) };
        }
        Ok(lhs)
    }

    fn parse_and(&mut self) -> Result<Expr, ParseError> {
        let mut lhs = self.parse_cmp()?;
        while self.peek() == Some(&Tok::AndAnd) {
            self.bump();
            let rhs = self.parse_cmp()?;
            lhs = Expr::BinOp { op: BinOp::And, lhs: Box::new(lhs), rhs: Box::new(rhs) };
        }
        Ok(lhs)
    }

    fn parse_cmp(&mut self) -> Result<Expr, ParseError> {
        let lhs = self.parse_addsub()?;
        let op = match self.peek() {
            Some(Tok::Gt) => Some(BinOp::Gt),
            Some(Tok::Ge) => Some(BinOp::Ge),
            Some(Tok::Lt) => Some(BinOp::Lt),
            Some(Tok::Le) => Some(BinOp::Le),
            Some(Tok::EqEq) => Some(BinOp::Eq),
            Some(Tok::Neq) => Some(BinOp::Ne),
            _ => None,
        };
        if let Some(op) = op {
            self.bump();
            let rhs = self.parse_addsub()?;
            Ok(Expr::BinOp { op, lhs: Box::new(lhs), rhs: Box::new(rhs) })
        } else {
            Ok(lhs)
        }
    }

    fn parse_addsub(&mut self) -> Result<Expr, ParseError> {
        let mut lhs = self.parse_muldiv()?;
        loop {
            let op = match self.peek() {
                Some(Tok::Plus) => BinOp::Add,
                Some(Tok::Minus) => BinOp::Sub,
                _ => break,
            };
            self.bump();
            let rhs = self.parse_muldiv()?;
            lhs = Expr::BinOp { op, lhs: Box::new(lhs), rhs: Box::new(rhs) };
        }
        Ok(lhs)
    }

    fn parse_muldiv(&mut self) -> Result<Expr, ParseError> {
        let mut lhs = self.parse_unary()?;
        loop {
            let op = match self.peek() {
                Some(Tok::Star) => BinOp::Mul,
                Some(Tok::Slash) => BinOp::Div,
                _ => break,
            };
            self.bump();
            let rhs = self.parse_unary()?;
            lhs = Expr::BinOp { op, lhs: Box::new(lhs), rhs: Box::new(rhs) };
        }
        Ok(lhs)
    }

    fn parse_unary(&mut self) -> Result<Expr, ParseError> {
        match self.peek() {
            Some(Tok::Minus) => {
                self.bump();
                let e = self.parse_unary()?;
                Ok(Expr::UnaryOp { op: UnaryOp::Neg, expr: Box::new(e) })
            }
            Some(Tok::Bang) => {
                self.bump();
                let e = self.parse_unary()?;
                Ok(Expr::UnaryOp { op: UnaryOp::Not, expr: Box::new(e) })
            }
            _ => self.parse_atom(),
        }
    }

    fn parse_atom(&mut self) -> Result<Expr, ParseError> {
        let pos = self.pos();
        match self.bump() {
            Some(Tok::Number(n)) => Ok(Expr::LitMoney(n)),
            Some(Tok::Int(n)) => Ok(Expr::LitInt(n)),
            Some(Tok::KwTrue) => Ok(Expr::LitBool(true)),
            Some(Tok::KwFalse) => Ok(Expr::LitBool(false)),
            Some(Tok::LParen) => {
                let e = self.parse_expr()?;
                self.expect(&Tok::RParen)?;
                Ok(e)
            }
            Some(Tok::KwIf) => {
                let cond = self.parse_expr()?;
                self.expect(&Tok::KwThen)?;
                let then_ = self.parse_expr()?;
                self.expect(&Tok::KwElse)?;
                let else_ = self.parse_expr()?;
                Ok(Expr::If {
                    cond: Box::new(cond),
                    then_: Box::new(then_),
                    else_: Box::new(else_),
                })
            }
            Some(Tok::KwMin) => {
                self.expect(&Tok::LParen)?;
                let a = self.parse_expr()?;
                self.expect(&Tok::Comma)?;
                let b = self.parse_expr()?;
                self.expect(&Tok::RParen)?;
                Ok(Expr::Min(Box::new(a), Box::new(b)))
            }
            Some(Tok::KwMax) => {
                self.expect(&Tok::LParen)?;
                let a = self.parse_expr()?;
                self.expect(&Tok::Comma)?;
                let b = self.parse_expr()?;
                self.expect(&Tok::RParen)?;
                Ok(Expr::Max(Box::new(a), Box::new(b)))
            }
            Some(Tok::KwLet) => {
                let name = self.parse_ident()?;
                self.expect(&Tok::Eq)?;
                let value = self.parse_expr()?;
                self.expect(&Tok::KwIn)?;
                let body = self.parse_expr()?;
                Ok(Expr::Let {
                    name,
                    value: Box::new(value),
                    body: Box::new(body),
                })
            }
            Some(Tok::Ident(name)) => {
                if self.peek() == Some(&Tok::Dot) {
                    self.bump();
                    let field = self.parse_ident()?;
                    Ok(Expr::Field { obj: name.to_string(), field })
                } else {
                    Ok(Expr::Ident(name.to_string()))
                }
            }
            other => Err(ParseError::At {
                pos, msg: format!("expected expression, found {:?}", other),
            }),
        }
    }
}

pub fn parse_program(src: &str) -> Result<Program, ParseError> {
    let mut lex = Lexer::new(src);
    let mut toks = Vec::new();
    while let Some(t) = lex.next()? { toks.push(t); }
    let mut p = Parser { toks, idx: 0 };
    p.parse_program()
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── existing tests ────────────────────────────────────────────────────────

    #[test]
    fn empty_scope() {
        let p = parse_program("scope Foo() { }").unwrap();
        assert_eq!(p.scopes.len(), 1);
        assert_eq!(p.scopes[0].name, "Foo");
    }

    #[test]
    fn definition_with_exceptions() {
        let src = r#"
            scope IncomeTax(citizen: money) {
              def owed : money =
                    0.0
                exception (citizen > 100.0) = 0.10 * citizen
                exception (citizen > 1000.0) = 0.20 * citizen
            }
        "#;
        let p = parse_program(src).unwrap();
        let scope = &p.scopes[0];
        let Item::Definition { body, .. } = &scope.items[0];
        assert_eq!(body.exceptions.len(), 2);
    }

    #[test]
    fn let_binding_parses() {
        let src = r#"
            scope Calc(x: money) {
              def result : money =
                let r = 0.15 in r * x
            }
        "#;
        let p = parse_program(src).unwrap();
        let scope = &p.scopes[0];
        let Item::Definition { body, .. } = &scope.items[0];
        // base should be a Let expression
        assert!(matches!(&body.base, Expr::Let { name, .. } if name == "r"));
    }

    #[test]
    fn nested_let_bindings_parse() {
        let src = r#"
            scope Tax(citizen: money) {
              def owed : money =
                let inc = citizen.income in
                let thresh = 50000.0 in
                if inc > thresh then 0.30 * inc else 0.20 * inc
            }
        "#;
        let p = parse_program(src).unwrap();
        assert_eq!(p.scopes[0].items.len(), 1);
    }

    // ── literals ─────────────────────────────────────────────────────────────

    #[test]
    fn integer_literal_parses_as_lit_int() {
        let p = parse_program("scope T() { def n : int = 42 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(body.base, Expr::LitInt(42)));
    }

    #[test]
    fn float_literal_parses_as_lit_money() {
        let p = parse_program("scope T() { def n : money = 3.14 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(body.base, Expr::LitMoney(v) if (v - 3.14).abs() < 1e-10));
    }

    #[test]
    fn true_literal_parses_as_lit_bool_true() {
        let p = parse_program("scope T() { def b : bool = true }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(body.base, Expr::LitBool(true)));
    }

    #[test]
    fn false_literal_parses_as_lit_bool_false() {
        let p = parse_program("scope T() { def b : bool = false }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(body.base, Expr::LitBool(false)));
    }

    #[test]
    fn underscore_separator_in_integer_parses() {
        let p = parse_program("scope T() { def n : int = 1_000_000 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(body.base, Expr::LitInt(1_000_000)));
    }

    #[test]
    fn underscore_separator_in_float_parses() {
        let p = parse_program("scope T() { def n : money = 1_000.50 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(body.base, Expr::LitMoney(v) if (v - 1000.50).abs() < 1e-9));
    }

    // ── field access ──────────────────────────────────────────────────────────

    #[test]
    fn field_access_parses() {
        let p = parse_program("scope T(c: money) { def x : money = c.income }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(
            matches!(&body.base, Expr::Field { obj, field } if obj == "c" && field == "income")
        );
    }

    // ── unary operators ───────────────────────────────────────────────────────

    #[test]
    fn unary_neg_parses() {
        let p = parse_program("scope T(x: money) { def n : money = -x }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(
            &body.base,
            Expr::UnaryOp { op: UnaryOp::Neg, .. }
        ));
    }

    #[test]
    fn unary_not_parses() {
        let p = parse_program("scope T() { def b : bool = !false }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(
            &body.base,
            Expr::UnaryOp { op: UnaryOp::Not, .. }
        ));
    }

    // ── min / max ─────────────────────────────────────────────────────────────

    #[test]
    fn min_parses() {
        let p = parse_program("scope T(x: money) { def n : money = min(x, 100.0) }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(&body.base, Expr::Min(_, _)));
    }

    #[test]
    fn max_parses() {
        let p = parse_program("scope T(x: money) { def n : money = max(x, 0.0) }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(&body.base, Expr::Max(_, _)));
    }

    // ── if-then-else ─────────────────────────────────────────────────────────

    #[test]
    fn if_then_else_parses() {
        let p = parse_program(
            "scope T(x: money) { def n : money = if x > 0.0 then 1.0 else 0.0 }",
        )
        .unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(&body.base, Expr::If { .. }));
    }

    // ── operator precedence ───────────────────────────────────────────────────

    #[test]
    fn mul_binds_tighter_than_add() {
        // `1 + 2 * 3` should parse as `1 + (2 * 3)`, i.e. top-level is Add.
        let p = parse_program("scope T() { def n : money = 1.0 + 2.0 * 3.0 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(
            matches!(&body.base, Expr::BinOp { op: BinOp::Add, .. }),
            "expected Add at top level"
        );
    }

    #[test]
    fn add_binds_tighter_than_comparison() {
        // `a + b > c` → top-level is Gt, not Add.
        let p = parse_program("scope T(a: money) { def b : bool = a + 1.0 > 2.0 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(
            matches!(&body.base, Expr::BinOp { op: BinOp::Gt, .. }),
            "expected Gt at top level"
        );
    }

    #[test]
    fn comparison_binds_tighter_than_logical_and() {
        // `a > 0 && b > 0` → top-level is And; both children are Gt.
        let p = parse_program(
            "scope T(a: money, b: money) { def ok : bool = a > 0.0 && b > 0.0 }",
        )
        .unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        let Expr::BinOp { op, lhs, rhs } = &body.base else {
            panic!("expected BinOp");
        };
        assert_eq!(*op, BinOp::And, "expected And at top level");
        assert!(matches!(lhs.as_ref(), Expr::BinOp { op: BinOp::Gt, .. }));
        assert!(matches!(rhs.as_ref(), Expr::BinOp { op: BinOp::Gt, .. }));
    }

    #[test]
    fn logical_and_binds_tighter_than_or() {
        // `a || b && c` → top-level is Or; rhs is And.
        let p = parse_program(
            "scope T() { def ok : bool = true || false && true }",
        )
        .unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(
            matches!(&body.base, Expr::BinOp { op: BinOp::Or, .. }),
            "expected Or at top level"
        );
    }

    #[test]
    fn parentheses_override_precedence() {
        // `(1 + 2) * 3` → top-level is Mul.
        let p =
            parse_program("scope T() { def n : money = (1.0 + 2.0) * 3.0 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(
            matches!(&body.base, Expr::BinOp { op: BinOp::Mul, .. }),
            "expected Mul at top level after parenthesized add"
        );
    }

    // ── multi-char comparison operators ──────────────────────────────────────

    #[test]
    fn ge_operator_parses() {
        let p = parse_program("scope T(x: money) { def b : bool = x >= 0.0 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(&body.base, Expr::BinOp { op: BinOp::Ge, .. }));
    }

    #[test]
    fn le_operator_parses() {
        let p = parse_program("scope T(x: money) { def b : bool = x <= 0.0 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(&body.base, Expr::BinOp { op: BinOp::Le, .. }));
    }

    #[test]
    fn eq_operator_parses() {
        let p = parse_program("scope T(x: money) { def b : bool = x == 0.0 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(&body.base, Expr::BinOp { op: BinOp::Eq, .. }));
    }

    #[test]
    fn ne_operator_parses() {
        let p = parse_program("scope T(x: money) { def b : bool = x != 0.0 }").unwrap();
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(&body.base, Expr::BinOp { op: BinOp::Ne, .. }));
    }

    // ── comments ─────────────────────────────────────────────────────────────

    #[test]
    fn hash_comment_is_skipped() {
        let src = r#"
            # This whole line is a comment
            scope T() {
              # another comment
              def n : int = 7 # inline comment
            }
        "#;
        let p = parse_program(src).unwrap();
        assert_eq!(p.scopes[0].name, "T");
        let Item::Definition { body, .. } = &p.scopes[0].items[0];
        assert!(matches!(body.base, Expr::LitInt(7)));
    }

    // ── multi-scope programs ──────────────────────────────────────────────────

    #[test]
    fn multi_scope_program_parses() {
        let src = r#"
            scope A(x: money) { def v : money = x }
            scope B(y: int)   { def w : int   = y }
        "#;
        let p = parse_program(src).unwrap();
        assert_eq!(p.scopes.len(), 2);
        assert_eq!(p.scopes[0].name, "A");
        assert_eq!(p.scopes[1].name, "B");
    }

    #[test]
    fn scope_with_multiple_definitions() {
        let src = r#"
            scope T(x: money) {
              def a : money = x
              def b : bool  = x > 0.0
            }
        "#;
        let p = parse_program(src).unwrap();
        assert_eq!(p.scopes[0].items.len(), 2);
    }

    #[test]
    fn scope_with_multiple_params() {
        let src = r#"
            scope T(a: money, b: int, c: rate, d: bool) { def x : bool = d }
        "#;
        let p = parse_program(src).unwrap();
        assert_eq!(p.scopes[0].params.len(), 4);
        assert_eq!(p.scopes[0].params[0].ty, Type::Money);
        assert_eq!(p.scopes[0].params[1].ty, Type::Int);
        assert_eq!(p.scopes[0].params[2].ty, Type::Rate);
        assert_eq!(p.scopes[0].params[3].ty, Type::Bool);
    }

    // ── error paths ───────────────────────────────────────────────────────────

    #[test]
    fn unexpected_char_is_error() {
        // `@` is not a valid token.
        assert!(parse_program("scope T() { def n : money = @0.0 }").is_err());
    }

    #[test]
    fn eof_inside_scope_is_error() {
        // Missing closing brace → hits EOF.
        assert!(parse_program("scope T() {").is_err());
    }

    #[test]
    fn missing_colon_in_def_is_error() {
        // `def n money = 0.0` — missing `:` before type.
        assert!(parse_program("scope T() { def n money = 0.0 }").is_err());
    }

    #[test]
    fn missing_eq_in_def_is_error() {
        // `def n : money 0.0` — missing `=`.
        assert!(parse_program("scope T() { def n : money 0.0 }").is_err());
    }

    #[test]
    fn invalid_type_keyword_is_error() {
        // `def n : string = 0.0` — `string` is not a type keyword.
        assert!(parse_program("scope T() { def n : string = 0.0 }").is_err());
    }

    #[test]
    fn empty_input_produces_empty_program() {
        let p = parse_program("").unwrap();
        assert!(p.scopes.is_empty());
    }

    #[test]
    fn whitespace_only_input_produces_empty_program() {
        let p = parse_program("   \n\t  ").unwrap();
        assert!(p.scopes.is_empty());
    }
}
