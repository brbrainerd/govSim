# Phase 36: Surfacing Decision Trade-Offs & Visual Meters Across Act Screens — Context

**Gathered:** 2026-10-16
**Status:** Ready for planning
**Mode:** Autonomous (`/gsd-autonomous`)

<domain>
## Phase Boundary

Wire `<TradeoffPill>` (`src/ui/TradeoffPill.svelte`), `session.vocabMode`, and the enriched trade-off catalogs (`src/content/tradeoffs.ts`, `src/content/orders.ts`, `src/data/trade.ts`) into all four **Act** screens (`Budget.svelte`, `Powers.svelte`, `Trade.svelte`, `Congress.svelte`) and the three structural reform modals (`FilibusterModal.svelte`, `JudicialReformModal.svelte`, `AmendmentModal.svelte`).

Requirements covered: `UI-CLARITY-01`, `UI-CLARITY-02`, `UI-CLARITY-03`.

</domain>

<decisions>
## Implementation Decisions

### Budget Trade-Off Clarity (`UI-CLARITY-01`, `src/screens/Budget.svelte`)
- Add emoji icons from `BUDGET_LEVER_TRADEOFFS[l.id]` to each tax and spending slider label, and in `Policy Wonk` mode expose `wonkLabel` in the label `title` attribute.
- Track the currently focused/hovered/modified budget lever (`focusedLeverId = $state<string>('inc')`) or last-clicked preset package (`focusedMode = $state<'lever' | 'package'>('package')`).
- Upgrade the right-hand `next()` column's static `Route` card into a live **Active Trade-Off Card** (`data-testid="budget-tradeoff-card"`) rendering `<TradeoffPill variant="card" ... vocabMode={session.vocabMode} />` for either the selected package (`BUDGET_PACKAGE_TRADEOFFS[session.draft.pack]`) or the focused slider (`getBudgetLeverTradeoff(...)`), while preserving the `"Budget bill: 218 House votes, 51 in the Senate."` note and zero-scroll layout at `1376×768` and `1280×720`.

### Executive Powers & Trade Clarity (`UI-CLARITY-02`, `src/screens/Powers.svelte`, `src/screens/Trade.svelte`)
- **`Powers.svelte`:**
  - Prefix each Executive Order card title with `order.emoji` (and in `wonk` mode show `order.wonkLabel` subtitle).
  - In the right-hand `.preview-card` (`"What it means"`), render `<TradeoffPill variant="card" ... />` with `selectedOrder.emoji`, `selectedOrder.whyClick`, `selectedOrder.upside`, `selectedOrder.catchText`, `realTerm={selectedOrder.wonkLabel}`, `legalBasis={selectedOrder.legalBasis}`, and `vocabMode={session.vocabMode}` so progressive disclosure hides raw statutory citations behind the Wonk drawer in Plain Talk mode and expands them in Policy Wonk mode.
  - Enrich Electoral Reforms (`REFORM_TRADEOFFS`), Defense Posture buttons (`DEFENSE_POSTURE_TRADEOFFS`), and Targeted Economic Sanctions (`SANCTION_TRADEOFFS`) with emojis and `<TradeoffPill variant="compact" ... />` badges.
- **`Trade.svelte`:**
  - Switch top-strip metric headers by `session.vocabMode` (`Price Pass-Through` → `🛒 Store Price Impact` in Plain Talk vs `Price Pass-Through (CPI)` in Policy Wonk; `Foreign Retaliation` → `🪃 Foreign Pushback` in Plain Talk).
  - Show `sector.emoji` and `<TradeoffPill variant="compact" upside={sector.upside} catchText={sector.catchText} whyClick={sector.whyClick} realTerm={sector.wonkLabel} legalBasis={sector.statutoryBasis} vocabMode={session.vocabMode} />` on every Sector Tariff card and Bilateral Trade Agreement card.
  - Track `selectedTradeItem` in the right sidebar (`stance-card`) to show the active `"💡 Why click this"` advisor note.

### Congress, Coalition Deals & Structural Reform Modals (`UI-CLARITY-03`)
- **`Congress.svelte`:**
  - Enrich the 5-bloc legend beneath the Hemicycle with `BLOC_EXPLAINERS[g.id].emoji` and mode-aware tooltips (`plainNote` vs `wonkNote`).
  - Enrich each deal card (`deals`) with `DEAL_TRADEOFFS[d.id]` (`emoji`, `upside`, `catchText`, and `whyClick` subtext).
- **`FilibusterModal.svelte`, `JudicialReformModal.svelte`, `AmendmentModal.svelte`:**
  - Render `<TradeoffPill variant="compact" ... vocabMode={session.vocabMode} />` and `"💡 Why click this:"` advisor callouts from `FILIBUSTER_TRADEOFFS`, `REFORM_TRADEOFFS`, and `AMENDMENT_TRADEOFFS` while preserving all existing test selectors and titles.

</decisions>
