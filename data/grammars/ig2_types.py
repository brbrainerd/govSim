"""
UGS IG 2.0 type stubs for Python sidecars (AgentTorch extractor, Phase 3).

Generated from: crates/simulator-law/src/ig2.rs
Schema at:      data/grammars/ig2_schema.json

XGrammar usage:
    import xgrammar as xgr
    grammar = xgr.Grammar.from_json_schema(
        open("data/grammars/ig2_schema.json").read()
    )
    # Pass grammar to the GGUF model's constrained decoding backend.

These TypedDicts mirror the Rust enums/structs exactly (serde snake_case).
Optional fields default to None in Rust via #[serde(default)].
"""

from __future__ import annotations
from typing import Literal, Optional, TypedDict


# ---------------------------------------------------------------------------
# Leaf types
# ---------------------------------------------------------------------------

class ActorRef(TypedDict):
    class_: str          # JSON key: "class"
    qualifier: Optional[str]


class ObjectRef(TypedDict):
    class_: str          # JSON key: "class"
    qualifier: Optional[str]


class Predicate(TypedDict):
    text: str


Deontic = Literal["must", "must_not", "may", "should"]
Modal    = Literal["must", "must_not", "may", "should"]
AmountBasis   = Literal["annual_income", "wealth"]
LowerCadence  = Literal["monthly", "quarterly", "yearly"]


class TaxBracket(TypedDict):
    floor: float
    ceil:  Optional[float]   # None = open top bracket
    rate:  float


# ---------------------------------------------------------------------------
# Computation variants (structured payload on RegulativeStmt)
# ---------------------------------------------------------------------------

class BracketedTax(TypedDict):
    kind:      Literal["bracketed_tax"]
    basis:     AmountBasis
    threshold: float
    brackets:  list[TaxBracket]
    cadence:   LowerCadence


class FlatRate(TypedDict):
    kind:      Literal["flat_rate"]
    basis:     AmountBasis
    threshold: float
    rate:      float
    cadence:   LowerCadence


class MeansTestedBenefit(TypedDict):
    kind:           Literal["means_tested_benefit"]
    basis:          AmountBasis
    income_ceiling: float
    taper_floor:    Optional[float]
    amount:         float
    cadence:        LowerCadence


class ConditionalTransfer(TypedDict):
    kind:              Literal["conditional_transfer"]
    eligibility_basis: AmountBasis
    ceiling:           float
    floor:             Optional[float]
    amount:            float
    cadence:           LowerCadence


class RegistrationRequirement(TypedDict):
    kind:      Literal["registration_requirement"]
    basis:     AmountBasis
    threshold: float
    cadence:   LowerCadence


Computation = (
    BracketedTax
    | FlatRate
    | MeansTestedBenefit
    | ConditionalTransfer
    | RegistrationRequirement
)


# ---------------------------------------------------------------------------
# Conditions
# ---------------------------------------------------------------------------

class StateCondition(TypedDict):
    kind: Literal["state"]
    text: str


# Procedural conditions are recursive; use a forward ref.
Condition = StateCondition  # | ProceduralCondition


# ---------------------------------------------------------------------------
# Top-level statements
# ---------------------------------------------------------------------------

class RegulativeStmt(TypedDict, total=False):
    kind:                      Literal["regulative"]
    attribute:                 ActorRef          # required
    aim:                       str               # required
    attribute_property:        Optional[Predicate]
    deontic:                   Optional[Deontic]
    direct_object:             Optional[ObjectRef]
    direct_object_property:    Optional[Predicate]
    indirect_object:           Optional[ObjectRef]
    indirect_object_property:  Optional[Predicate]
    activation_conditions:     list[Condition]
    execution_constraints:     list[Condition]
    or_else:                   Optional[IgStatement]
    computation:               Optional[Computation]


class ConstitutiveStmt(TypedDict, total=False):
    kind:                    Literal["constitutive"]
    constituted_entity:      str                   # required
    constitutive_function:   str                   # required
    modal:                   Optional[Modal]
    constituting_properties: Optional[Predicate]
    context:                 list[Condition]
    or_else:                 Optional[IgStatement]


IgStatement = RegulativeStmt | ConstitutiveStmt


# ---------------------------------------------------------------------------
# Validation helper (import-time check against a JSON file)
# ---------------------------------------------------------------------------

def validate_fixture(path: str) -> IgStatement:
    """Load and type-check a fixture JSON file. Raises ValueError on failure."""
    import json, pathlib
    raw = pathlib.Path(path).read_text()
    data = json.loads(raw)
    # Minimal required-field check (full validation is done on the Rust side).
    kind = data.get("kind")
    if kind not in ("regulative", "constitutive"):
        raise ValueError(f"unknown kind {kind!r}")
    return data  # type: ignore[return-value]


if __name__ == "__main__":
    import sys
    for path in sys.argv[1:]:
        stmt = validate_fixture(path)
        print(f"ok: {path}  kind={stmt['kind']}")
