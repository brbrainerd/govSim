---
phase: 38-presidential-trade-off-balance-audit-readability-gate-multi-
plan: 01
subsystem: verification
tags: [balance, readability, playwright, axe, determinism, bal-01, bal-02]
requires:
  - phase: 37-kitchen-table-clarity-on-hub-diagnostic-crisis-screens
    provides: [SeeClarity.test.ts, Economy.svelte, TurnReport.svelte, OvalOffice.svelte, Voters.svelte, CrisisModal.svelte]
provides:
  - Mechanical trade-off alignment audit across all policy levers (BAL-01)
  - Flesch-Kincaid reading grade <= 9.0, multi-viewport zero-scroll (1376x768, 1280x720), axe-core a11y, and 8/8 cross-browser determinism verification (BAL-02)
affects: [src/content/tradeoffs.test.ts, src/data/trade.ts, tests/plain-talk-clarity.spec.ts]
tech-stack:
  added: []
  patterns: [Playwright dual-viewport Plain Talk & Policy Wonk zero-scroll audit, mechanical-to-UI trade-off alignment assertions]
key-files:
  created:
    - tests/plain-talk-clarity.spec.ts
  modified:
    - src/content/tradeoffs.test.ts
    - src/data/trade.ts
key-decisions:
  - "Preserve canonical formal sector tariff and bilateral trade agreement names in wonkLabel so progressive disclosure tooltips and Policy Wonk drawers surface exact statutory/policy titles"
patterns-established:
  - "Every presidential policy lever is mechanically gated in unit tests to guarantee both a felt upside and a counterbalancing catch matching its UI TradeoffPill"
requirements-completed: [BAL-01, BAL-02]
duration: 15min
completed: 2026-10-16
---

# Phase 38 Plan 01: Presidential Trade-Off Balance Audit, Readability Gate & Multi-Viewport Verification Summary

**Verified mechanical trade-off alignment across all presidential levers (`BAL-01`) and passed Flesch-Kincaid reading grade (`<= 9.0`), multi-viewport zero-scroll (`1376×768` and `1280×720`), axe-core accessibility, and cross-browser determinism gates (`BAL-02`).**

## Performance

- **Duration:** 15 min
- **Completed:** 2026-10-16
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extended `src/content/tradeoffs.test.ts` with `BAL-01` mechanical alignment assertions verifying that every Budget lever, Social lever, Executive Order, Sector Tariff, Trade Agreement, Sanction, Deal, Filibuster rule, Judicial Reform, and Constitutional Amendment pairs its UI `upside` / `catchText` with genuine engine costs and benefits, while passing the 100-seed Monte Carlo balance harness (`src/engine/balance.test.ts`).
- Preserved canonical formal titles in `wonkLabel` on `SECTOR_TARIFFS_CATALOG` and `TRADE_AGREEMENTS_CATALOG` (`src/data/trade.ts`), bringing the full Vitest suite to 82/82 files passing (`503/503` tests), including `src/testing/content-gates.test.ts` (Flesch-Kincaid reading grade `<= 9.0`, sentences `<= 20` words, nonpartisan guardrails).
- Created `tests/plain-talk-clarity.spec.ts` and verified zero outer page scroll, `<TradeoffPill>` rendering, vocabulary mode switching (`🗣️ Plain Talk` vs. `📜 Policy Wonk`), and 0 serious/critical axe violations across all 7 screens at `1376×768` and `1280×720`.
