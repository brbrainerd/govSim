---
phase: 36-surfacing-decision-trade-offs-visual-meters-across-act-scree
plan: 01
subsystem: ui
tags: [budget, powers, trade, congress, modals, tradeoff-pill, progressive-disclosure]
requires:
  - phase: 35-de-jargonizing-content-catalogs-with-witty-plain-talk-trade
    provides: [tradeoffs.ts, enriched orders.ts, enriched trade.ts]
provides:
  - Budget.svelte live TradeoffPill card and lever emojis (UI-CLARITY-01)
  - Powers.svelte and Trade.svelte emojis, Why-click notes, and TradeoffPill badges (UI-CLARITY-02)
  - Congress.svelte, FilibusterModal.svelte, JudicialReformModal.svelte, and AmendmentModal.svelte trade-off pills and bloc explainers (UI-CLARITY-03)
affects: [phase-37, phase-38]
tech-stack:
  added: []
  patterns: [Interactive lever trade-off focus card, dual-layer plain/wonk UI labels]
key-files:
  created:
    - src/screens/ActClarity.test.ts
  modified:
    - src/screens/Budget.svelte
    - src/screens/Powers.svelte
    - src/screens/Trade.svelte
    - src/screens/Congress.svelte
    - src/ui/FilibusterModal.svelte
    - src/ui/JudicialReformModal.svelte
    - src/ui/AmendmentModal.svelte
key-decisions:
  - "Moved onmouseenter to range inputs in Budget.svelte so keyboard and pointer users get instant TradeoffPill updates with zero a11y warnings"
  - "Preserved existing E2E selector labels (.preview-title, .legal-basis, .metric-card Price Pass-Through) while layering Plain Talk subtitles and TradeoffPills"
patterns-established:
  - "Every Act screen decision card surfaces emoji + 💡 Why click + 👍 Upside / ⚠️ Catch TradeoffPill"
requirements-completed: [UI-CLARITY-01, UI-CLARITY-02, UI-CLARITY-03]
duration: 10min
completed: 2026-10-16
---

# Phase 36 Plan 01: Surfacing Decision Trade-Offs & Visual Meters Across Act Screens Summary

**Wired `<TradeoffPill>`, `session.vocabMode`, and the unified trade-off catalog into `Budget.svelte`, `Powers.svelte`, `Trade.svelte`, `Congress.svelte`, `FilibusterModal.svelte`, `JudicialReformModal.svelte`, and `AmendmentModal.svelte`.**

## Accomplishments
- **Budget (`UI-CLARITY-01`):** Added emoji icons to all 11 tax/spending levers and foreign aid, added package trade-off tooltips, and replaced the static Route card with a live `budget-tradeoff-card` `<TradeoffPill variant="card" ... />` that updates on slider focus/hover/input or package selection.
- **Executive Powers & Trade (`UI-CLARITY-02`):** Upgraded `Powers.svelte` order cards, `.preview-card`, electoral reform items, defense posture buttons, and targeted sanctions with emojis, `"💡 Why click"` notes, and `<TradeoffPill>` badges. Upgraded `Trade.svelte` top metrics, sector tariffs, and bilateral agreements with Plain Talk vs Policy Wonk labels and `<TradeoffPill>` badges.
- **Congress & Structural Reform Modals (`UI-CLARITY-03`):** Wired `BLOC_EXPLAINERS` and `DEAL_TRADEOFFS` into `Congress.svelte`, and wired `FILIBUSTER_TRADEOFFS`, `REFORM_TRADEOFFS`, and `AMENDMENT_TRADEOFFS` into `FilibusterModal.svelte`, `JudicialReformModal.svelte`, and `AmendmentModal.svelte`.
