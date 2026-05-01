//! IG 2.0 AST — Institutional Grammar 2.0 (Frantz & Siddiki).
//!
//! Faithful to the Codebook v5 component set, simplified for Phase 4:
//! we only carry the components actually consumed by the DSL lowering pass.
//! The full IG2 includes nested scopes, mixed deontics, polyADICOs, etc.,
//! which we'll add as the LLM extractor (Phase 3) starts producing them.

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum IgStatement {
    Regulative(RegulativeStmt),
    Constitutive(ConstitutiveStmt),
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct RegulativeStmt {
    /// Attribute (A): the actor.
    pub attribute: ActorRef,
    #[serde(default)]
    pub attribute_property: Option<Predicate>,
    /// Deontic (D).
    #[serde(default)]
    pub deontic: Option<Deontic>,
    /// Aim (I): the verb.
    pub aim: String,
    #[serde(default)]
    pub direct_object: Option<ObjectRef>,
    #[serde(default)]
    pub direct_object_property: Option<Predicate>,
    #[serde(default)]
    pub indirect_object: Option<ObjectRef>,
    #[serde(default)]
    pub indirect_object_property: Option<Predicate>,
    /// Activation conditions (Cac).
    #[serde(default)]
    pub activation_conditions: Vec<Condition>,
    /// Execution constraints (Cex).
    #[serde(default)]
    pub execution_constraints: Vec<Condition>,
    /// Consequence (O): or-else clause.
    #[serde(default)]
    pub or_else: Option<Box<IgStatement>>,
    /// Structured computation. Filled in by the LLM extractor (Phase 3) or
    /// by hand authors. The free-text properties above remain authoritative
    /// for human review; the lowering pass requires this structured form.
    #[serde(default)]
    pub computation: Option<Computation>,
}

/// Structured computation payloads. The LLM extractor will emit one of
/// these inside an XGrammar-constrained JSON envelope; for now hand-authors
/// can write them directly. Adding a variant here means: (a) the parser
/// accepts it, (b) the lowering pass must learn to compile it.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Computation {
    /// Piecewise-linear bracketed rate applied to a basis (e.g. annual
    /// income). Brackets must be sorted by ascending `floor`.
    BracketedTax {
        basis: AmountBasis,
        threshold: f64,
        brackets: Vec<TaxBracket>,
        cadence: LowerCadence,
    },
    /// Single rate applied to the basis when above threshold.
    FlatRate {
        basis: AmountBasis,
        threshold: f64,
        rate: f64,
        cadence: LowerCadence,
    },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
pub struct TaxBracket {
    pub floor: f64,
    pub ceil: Option<f64>, // None = unbounded top bracket
    pub rate: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum AmountBasis {
    /// Citizen's daily Income × 360 → annualized.
    AnnualIncome,
    /// Citizen's Wealth (point-in-time).
    Wealth,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum LowerCadence { Monthly, Quarterly, Yearly }

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct ConstitutiveStmt {
    pub constituted_entity: String,
    #[serde(default)]
    pub modal: Option<Modal>,
    pub constitutive_function: String,
    #[serde(default)]
    pub constituting_properties: Option<Predicate>,
    #[serde(default)]
    pub context: Vec<Condition>,
    #[serde(default)]
    pub or_else: Option<Box<IgStatement>>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Deontic { Must, MustNot, May, Should }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Modal { Must, MustNot, May, Should }

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct ActorRef {
    /// Class name (e.g. "individual", "treasury", "legislator").
    pub class: String,
    #[serde(default)]
    pub qualifier: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct ObjectRef {
    pub class: String,
    #[serde(default)]
    pub qualifier: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Predicate {
    /// Free-text predicate body (e.g. "annual income exceeds 12000 USD").
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Condition {
    /// Open-text state predicate, lowered to a DSL boolean expression.
    State { text: String },
    /// Procedural — a nested statement that must hold.
    Procedural(Box<IgStatement>),
}
