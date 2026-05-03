# DSL Context Variables

Every `def ... = expr` and every `when expr` in a law's `scope` runs against an
`EvalCtx` populated each tick by `make_dispatch_ctx` in `src/system.rs`. This
document is the authoritative list of bindings available to law authors.

A binding's **freshness cadence** describes when its value is last updated:
the dispatcher reads from the most recently committed system state, so a value
written by a `Phase::Mutate` system in tick N is visible to laws on tick N+1.

## Type cheat-sheet

| DSL type | Underlying Rust   | Notes                                   |
|----------|-------------------|------------------------------------------|
| `Int`    | `i64`             | tick counts, bit fields, enum codes      |
| `Money`  | `Money` (fixed)   | currency in whole units; never negative for accounts |
| `Rate`   | `f64` in `[0,1]`  | proportions, scores, normalised metrics  |
| `Bool`   | `bool`            | `judiciary_review_power` is `Int 0/1`    |

`Value` is a tagged enum; `Money` and `Rate` cannot be mixed without `min/max`
helpers. See `dsl/typecheck.rs` for the coercion table.

## Time

| Key       | Type | Source                | Freshness | Semantics                         |
|-----------|------|-----------------------|-----------|------------------------------------|
| `tick`    | Int  | `SimClock.tick`       | each tick | absolute ticks since sim start     |
| `year`    | Int  | `tick / 360`          | each tick | calendar year (12 × 30-tick months)|
| `quarter` | Int  | `(tick / 90) % 4`     | each tick | 0-indexed quarter within year      |
| `month`   | Int  | `(tick / 30) % 12`    | each tick | 0-indexed month within year        |

## Macro aggregates

Updated by `macro_indicators_system` in `Phase::Commit`. The `gini`,
`mean_income`, `mean_wealth` keys are **monthly** (recomputed every 30 ticks);
the rest are updated **every tick**.

| Key                       | Type  | Cadence | Source field                          |
|---------------------------|-------|---------|----------------------------------------|
| `unemployment`            | Rate  | tick    | `MacroIndicators.unemployment`         |
| `inflation`               | Rate  | tick    | `MacroIndicators.inflation`            |
| `approval`                | Rate  | tick    | `MacroIndicators.approval` (mean)      |
| `gini`                    | Rate  | monthly | `MacroIndicators.gini` (income Gini)   |
| `gdp`                     | Money | monthly | `MacroIndicators.gdp` (sum × 360)      |
| `population`              | Int   | tick    | total citizens                         |
| `government_revenue`      | Money | yearly  | annual revenue accumulator (resets every 360 ticks) |
| `government_expenditure`  | Money | yearly  | annual expenditure accumulator (resets every 360 ticks) |
| `treasury_balance`        | Money | tick    | `Treasury.balance`                     |
| `mean_income`             | Money | monthly | mean monthly citizen income            |
| `mean_wealth`             | Money | monthly | mean citizen net wealth (can be negative pre-coercion to Money) |

> **Caveat:** `government_revenue` and `government_expenditure` reset to 0 at
> every multiple of 360 ticks. Reading them mid-year gives a year-to-date
> partial sum; reading them on tick 360, 720, … gives the full prior-year
> total. Plan tax/budget laws around the cadence.

## Externalities & political state

| Key                 | Type  | Cadence | Source                              |
|---------------------|-------|---------|--------------------------------------|
| `pollution_stock`   | Rate  | tick    | `PollutionStock.stock` (uncapped, may exceed 1.0) |
| `legitimacy_debt`   | Rate  | tick    | `LegitimacyDebt.stock` (uncapped) |
| `rights_granted`    | Int   | tick    | `RightsLedger.granted.bits()` — bitfield over `CivicRights` |
| `crisis_kind`       | Int   | tick    | `0`=None, `1`=War, `2`=Pandemic, `3`=Recession, `4`=NaturalDisaster |
| `crisis_remaining`  | Int   | tick    | ticks until current crisis ends (`0` if none) |

> **Caveat:** `pollution_stock` and `legitimacy_debt` are typed `Rate` for DSL
> ergonomics but are not bounded to `[0,1]`. Treat them as raw scalars and
> compose with `min(_, 1.0)` if you need a bounded threshold.

## Judiciary (Phase D)

Present only when a `Judiciary` resource is inserted (typically via scenario
YAML). Defaults below apply when absent.

| Key                                  | Type | Default | Source                            |
|--------------------------------------|------|---------|-----------------------------------|
| `judiciary_independence`             | Rate | 0.0     | `Judiciary.independence`          |
| `judiciary_review_power`             | Int  | 0       | `1` if `review_power`, else `0`   |
| `judiciary_precedent_weight`         | Rate | 0.0     | `Judiciary.precedent_weight`      |
| `judiciary_international_deference`  | Rate | 0.0     | `Judiciary.international_deference` |

## State capacity (Phase B)

Present only when a `StateCapacity` resource is inserted. Defaults below
correspond to "full capacity" so laws written before Phase B continue to work
on legacy scenarios without modification.

| Key                                | Type | Default | Source                                 |
|------------------------------------|------|---------|------------------------------------------|
| `state_tax_efficiency`             | Rate | 1.0     | `StateCapacity.tax_collection_efficiency` |
| `state_enforcement_reach`          | Rate | 1.0     | `StateCapacity.enforcement_reach`         |
| `state_enforcement_noise`          | Rate | 0.0     | `StateCapacity.enforcement_noise`         |
| `state_legal_predictability`       | Rate | 1.0     | `StateCapacity.legal_predictability`      |
| `state_bureaucratic_effectiveness` | Rate | 1.0     | `StateCapacity.bureaucratic_effectiveness`|

## Rights catalog (Phase C)

Present only when a `RightsCatalog` resource is inserted. Defaults are zero so
absence is indistinguishable from "no rights granted" — author laws against
`rights_granted` (legacy bitfield) when targeting older scenarios.

| Key                          | Type | Default | Source                          |
|------------------------------|------|---------|----------------------------------|
| `rights_catalog_count`       | Int  | 0       | `RightsCatalog.granted_count()`  |
| `rights_catalog_breadth`     | Rate | 0.0     | `RightsCatalog.breadth_score()`  |
| `rights_catalog_historical`  | Int  | 0       | `RightsCatalog.historical_count()` |

## Scope-bound field bindings

In addition to the global bindings above, scopes that iterate over an entity
type bind a struct-handle: `for c in Citizens { … }` makes fields of `Citizen`
accessible via `c.field_name`. Field bindings are written into
`EvalCtx.field_bindings: HashMap<(String, String), Value>` keyed by
`(handle, field_name)` and are produced per-iteration by the lower-er, not by
`make_dispatch_ctx`. See `eval.rs` (the `Expr::Field` arm) and `lower.rs` for
the schema.

## Stability guarantees

These keys are **load-bearing** for any law file written outside this repo.
Before removing or renaming a key:
1. Bump the law DSL version in `dsl::ast::Program::version`.
2. Add a backwards-compat shim in `make_dispatch_ctx` for the old name.
3. Update this document and the CHANGELOG.

Adding new keys is non-breaking and does not require a version bump.
