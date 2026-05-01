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
    /// Means-tested transfer payment. Citizens whose `basis` is below
    /// `income_ceiling` receive a flat `amount` each cadence period.
    /// The payment is reduced linearly from `amount` to zero between
    /// `taper_floor` and `income_ceiling` when `taper_floor` is Some.
    MeansTestedBenefit {
        basis: AmountBasis,
        /// Citizens above this income receive nothing.
        income_ceiling: f64,
        /// Full-benefit ceiling: if Some, benefit tapers between this and
        /// `income_ceiling`. If None, full `amount` is paid below ceiling.
        taper_floor: Option<f64>,
        /// Gross benefit amount per period.
        amount: f64,
        cadence: LowerCadence,
    },
    /// Non-monetary obligation: marks citizens who satisfy `condition_basis`
    /// below/above `threshold` as requiring registration (sets a flag).
    /// Lowering emits a no-op DSL scope; the effect is modeled through
    /// `LegalStatuses` directly in the dispatcher.
    RegistrationRequirement {
        basis: AmountBasis,
        /// Threshold below which registration is required.
        threshold: f64,
        cadence: LowerCadence,
    },
    /// One-time or recurring conditional transfer (stimulus / UBI slice).
    /// Citizens whose `basis` is strictly below `wealth_ceiling` receive
    /// `amount` from the Treasury. No taper — cliff at `wealth_ceiling`.
    /// Optionally conditional on `income_floor` ≤ income (e.g. working-poor
    /// supplement) when `income_floor` is Some.
    ConditionalTransfer {
        /// Which basis determines eligibility.
        eligibility_basis: AmountBasis,
        /// Citizens with basis below this receive the payment.
        ceiling: f64,
        /// Optional lower bound on the same basis for eligibility.
        floor: Option<f64>,
        /// Transfer amount per period.
        amount: f64,
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
