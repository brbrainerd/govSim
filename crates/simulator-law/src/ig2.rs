//! IG 2.0 AST — Institutional Grammar 2.0 (Frantz & Siddiki).
//!
//! Faithful to the Codebook v5 component set, simplified for Phase 4:
//! we only carry the components actually consumed by the DSL lowering pass.
//! The full IG2 includes nested scopes, mixed deontics, polyADICOs, etc.,
//! which we'll add as the LLM extractor (Phase 3) starts producing them.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum IgStatement {
    Regulative(RegulativeStmt),
    Constitutive(ConstitutiveStmt),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Deontic { Must, MustNot, May, Should }

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Modal { Must, MustNot, May, Should }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActorRef {
    /// Class name (e.g. "individual", "treasury", "legislator").
    pub class: String,
    #[serde(default)]
    pub qualifier: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectRef {
    pub class: String,
    #[serde(default)]
    pub qualifier: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Predicate {
    /// Free-text predicate body (e.g. "annual income exceeds 12000 USD").
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Condition {
    /// Open-text state predicate, lowered to a DSL boolean expression.
    State { text: String },
    /// Procedural — a nested statement that must hold.
    Procedural(Box<IgStatement>),
}
