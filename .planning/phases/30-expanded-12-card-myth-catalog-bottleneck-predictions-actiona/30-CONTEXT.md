# Phase 30: Expanded 12-Card Myth Catalog, Bottleneck Predictions & Actionable Pivot Schema - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning
**Mode:** Smart Autonomous (grounded in `.planning/research/v0.8-PEDAGOGY-MYTHS.md`)

<domain>
## Phase Boundary

Expand the civics myth deck to cover every core policy screen with 12 spectrum-balanced cards, active prediction prompts, and actionable tactical pivot descriptors (`DECK-01`, `DECK-02`, `PIVOT-01`).

</domain>

<decisions>
## Implementation Decisions

### 1. 12-Card Spectrum Balance & Institutional Targets
- The existing catalog has 8 cards (3 left, 3 right, 2 both).
- Add 4 new cards to reach 12 cards (4 left, 4 right, 4 both) satisfying `|count(left) - count(right)| <= 1`:
  1. `veto_line_item` (`both`, `institution`): Line-item veto misconception. Citation: *Clinton v. City of New York*, 524 U.S. 417.
  2. `popular_vote_mandate` (`left`, `institution`): National popular vote guarantees legislative mandate misconception. Citation: U.S. Const. art. II, § 1 / Electoral Count Reform Act.
  3. `immigration_crime_budget` (`right`, `mechanism`): Border closure balancing entitlements misconception. Citation: CBO Demographic and Economic Outlook / Social Security Trustees Report.
  4. `scotus_instant_reversal` (`both`, `institution`): Single Supreme Court appointment immediately overturning past precedents misconception. Citation: U.S. Const. art. III, § 2.

### 2. Structured Prediction Prompts (`predictionPrompt`)
- Add `predictionPrompt` to `MythCard`:
  - `question`: Concise question (<= 15 words) challenging player's intuition.
  - `options`: Exactly 2 plausible options (one represents the myth assumption, one represents the institutional reality).
  - `correctIndex`: 0 or 1.
  - `refutation`: Plain-language explanation (reading grade <= 9.0, <= 20 words/sentence) shown after answer selection.

### 3. Tempting Mirage Label (`mirageLabel`)
- Add `mirageLabel` string (<= 6 words, plain language) to each `MythCard` describing the populist "Easy Button" (e.g., *"⚡ Order $2.50 Gas Cap"*, *"⚡ Command 2% Rate Cut"*, *"⚡ Zero Foreign Aid to Balance"*).

### 4. Typed Actionable Real Lever Pivots (`realLeverActions`)
- Keep existing `realLevers: readonly string[]` for backwards compatibility.
- Add `realLeverActions: readonly MythRealLeverAction[]` where each action specifies:
  - `label`: Button text (e.g. "Grant energy permits", "Nominate Fed Chair", "Adjust entitlement formulas").
  - `screen`: Target `ScreenId` (`oval`, `economy`, `voters`, `budget`, `congress`, `powers`, `trade`).
  - `hint`: Short tooltip/preview explaining what the lever does.
  - `action`: Specific descriptor (e.g. `{ kind: 'budget_package', pack: '...' }`, `{ kind: 'open_modal', modal: 'fed' }`, `{ kind: 'navigate_only' }`).

</decisions>

<code_context>
## Existing Code Insights

- `src/content/myths.ts`: Defines `MythCard` interface and `MYTHS_CATALOG`.
- `src/content/myths.test.ts`: Enforces card count, balance (`|left - right| <= 1`), citations, reading grade <= 9.0, sentence length <= 20 words, and banned politician deny-list.
- `src/testing/content-gates.test.ts`: Runs Flesch-Kincaid and banned word checks on `src/content/myths.ts`.

</code_context>

<specifics>
## Specific Requirements

- `DECK-01`: 12 cards total in `MYTHS_CATALOG`, 4 left, 4 right, 4 both.
- `DECK-02`: Structured `predictionPrompt` and `mirageLabel` on all 12 cards.
- `PIVOT-01`: Typed `realLeverActions` metadata on all 12 cards pointing to valid screens and actions.

</specifics>
