---
phase: 35-de-jargonizing-content-catalogs-with-witty-plain-talk-trade
plan: 01
subsystem: content, data
tags: [plain-talk, tradeoffs, orders, social, trade]
provides:
  - Enriched ORDERS_CATALOG, SOCIAL_CATALOG, SECTOR_TARIFFS_CATALOG, TRADE_AGREEMENTS_CATALOG
  - Unified Trade-Off & Plain-Talk Catalog (src/content/tradeoffs.ts)
  - Dual-mode causal trace helper whyTextForMode
affects: [orders.ts, social.ts, trade.ts, why.ts, tradeoffs.ts]
key-files:
  created:
    - src/content/tradeoffs.ts
    - src/content/tradeoffs.test.ts
  modified:
    - src/content/orders.ts
    - src/content/social.ts
    - src/data/trade.ts
    - src/content/text/why.ts
    - src/testing/content-gates.test.ts
completed: 2026-10-16
---

# Phase 35 Plan 01 Summary: De-Jargonizing Content Catalogs with Witty Plain Talk & `👍 / ⚠️` Trade-Offs

## Accomplishments
- **Executive Orders & Trade Catalogs (`COPY-01`):** Enriched `ORDERS_CATALOG` (`src/content/orders.ts`), `SECTOR_TARIFFS_CATALOG`, and `TRADE_AGREEMENTS_CATALOG` (`src/data/trade.ts`) with friendly emojis, `wonkLabel`, `whyClick` advisor notes, and explicit `upside` / `catchText` pairs.
- **Social Policies, Budget, Congress & Reforms (`COPY-02`):** Rewrote `SOCIAL_CATALOG` (`src/content/social.ts`) into crisp Kitchen-Table Plain Talk (Flesch-Kincaid grade ≤ 9.0) and created `src/content/tradeoffs.ts` covering all 11 Budget Levers, 4 Budget Packages, 3 Sanctions, 3 Defense Postures, 3 Congress Deals, 5 Congress Blocs, 4 Filibuster Rules, 6 Reforms, and 4 Constitutional Amendments.
- **Crisis Options & Causal Traces (`COPY-03`):** Added `describeCrisisOptionTradeoff` in `src/content/tradeoffs.ts` and `whyTextForMode` in `src/content/text/why.ts`, and registered `social.ts`, `trade.ts`, and `tradeoffs.ts` in `src/testing/content-gates.test.ts`.
