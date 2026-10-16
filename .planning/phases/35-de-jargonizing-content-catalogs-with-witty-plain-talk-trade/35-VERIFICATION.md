---
phase: 35-de-jargonizing-content-catalogs-with-witty-plain-talk-trade
status: passed
verified: 2026-10-16
requirements: [COPY-01, COPY-02, COPY-03]
---

# Phase 35 Verification Report

## Goal Verification
**Goal:** Overhaul every simulationist content catalog so every lever, order, sanction, tariff, deal, and crisis option has dual-layer (`plain` + `wonk`) copy, friendly emoji signposts, a clear `"Why click this?"` pitch, an explicit `👍 Upside`, and an honest `⚠️ The Catch`.

| Requirement | Status | Evidence |
|-------------|--------|----------|
| `COPY-01`: Executive Orders, Sanctions & Trade catalogs enriched | PASSED | `src/content/orders.ts`, `src/data/trade.ts`, `SANCTION_TRADEOFFS` in `src/content/tradeoffs.ts`. |
| `COPY-02`: Social Policies, Budget Levers/Packages, Congress Deals/Rules, Reforms & Amendments enriched | PASSED | `src/content/social.ts`, `src/content/tradeoffs.ts`, tested in `src/content/tradeoffs.test.ts`. |
| `COPY-03`: Crisis option trade-offs & causal trace dual-mode copy passing Flesch-Kincaid <= 9.0 | PASSED | `describeCrisisOptionTradeoff` in `src/content/tradeoffs.ts`, `whyTextForMode` in `src/content/text/why.ts`, verified by `src/testing/content-gates.test.ts`. |
