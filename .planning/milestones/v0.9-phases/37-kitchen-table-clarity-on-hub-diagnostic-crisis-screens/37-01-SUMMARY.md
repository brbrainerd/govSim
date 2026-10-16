---
phase: 37-kitchen-table-clarity-on-hub-diagnostic-crisis-screens
plan: 01
subsystem: ui
tags: [economy, turn-report, oval-office, voters, crisis-modal, plain-talk, see-01, see-02]
requires:
  - phase: 34-progressive-disclosure-foundation-vocabulary-toggle
    provides: [session.vocabMode, TradeoffPill.svelte, glossary.ts]
  - phase: 35-de-jargonizing-executive-orders-social-policy-trade-catalogs
    provides: [tradeoffs.ts, whyTextForMode]
provides:
  - Kitchen-table plain-English indicator headers, emoji badges, and household translations on Economy, TurnReport, and Voters (SEE-01)
  - Explicit 👍 Upside / ⚠️ The Catch trade-offs on CrisisModal response options and OvalOffice advisor play badges (SEE-02)
affects: [Economy.svelte, TurnReport.svelte, OvalOffice.svelte, Voters.svelte, CrisisModal.svelte]
tech-stack:
  added: []
  patterns: [kitchen-table summary banners, vocabulary-aware MiniChart headers, compact TradeoffPill inside CrisisModal]
key-files:
  created:
    - src/screens/SeeClarity.test.ts
  modified:
    - src/screens/Economy.svelte
    - src/ui/TurnReport.svelte
    - src/screens/OvalOffice.svelte
    - src/screens/Voters.svelte
    - src/ui/CrisisModal.svelte
key-decisions:
  - "Render compact TradeoffPill without nested glossary button inside CrisisModal option buttons to preserve valid HTML button semantics and accessibility"
  - "Preserve exact substring selectors ('Map View', 'Table View', 'Coalitions', 'Tipping Point:', 'LOCAL FAMILY IMPACT', 'Price parity index:') in Voters.svelte while adding emoji badges and Plain Talk explanations"
patterns-established:
  - "Diagnostic screens translate macro metrics into kitchen-table family impact summaries while exposing technical indices in Policy Wonk mode"
requirements-completed: [SEE-01, SEE-02]
duration: 15min
completed: 2026-10-16
---

# Phase 37 Plan 01: Kitchen-Table Clarity on Hub, Diagnostic & Crisis Screens Summary

**Translated macroeconomic and electoral telemetry on Economy, TurnReport, and Voters into kitchen-table plain English (`SEE-01`) and wired explicit `👍 Upside` / `⚠️ The Catch` trade-offs into Oval Office advisor plays and CrisisModal options (`SEE-02`).**

## Performance

- **Duration:** 15 min
- **Completed:** 2026-10-16
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Updated `Economy.svelte` and `TurnReport.svelte` with emoji indicator headers (`📈 Growth`, `👷 Jobs`, `🛒 Prices`, `💳 Debt`), `"🏠 For regular people"` kitchen-table summaries, and `whyTextForMode` causal traces that expand in `Policy Wonk` mode (`SEE-01`).
- Updated `Voters.svelte` with emoji view tabs (`🗺️ Map View`, `📋 Table View`, `👥 Coalitions`), Plain-Talk tipping-point explanation (`(270th deciding vote)`), and cost-of-living benchmark context (`(100 = average cost of living)`) (`SEE-01`).
- Updated `OvalOffice.svelte` advisor suggestion cards and `CrisisModal.svelte` response cards with explicit `👍 Upside` and `⚠️ The Catch` trade-off previews (`SEE-02`).
- Added unit tests in `src/screens/SeeClarity.test.ts` verifying both `Plain Talk` and `Policy Wonk` modes across all 5 components.
