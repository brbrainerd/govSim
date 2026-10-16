# Phase 35: De-Jargonizing Content Catalogs with Witty Plain Talk & `👍 / ⚠️` Trade-Offs - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Enrich and de-jargonize content catalogs across Executive Orders (`src/content/orders.ts`), Social Policies (`src/content/social.ts`), Trade & Tariffs (`src/data/trade.ts`), Causal Trace copy (`src/content/text/why.ts`), and create a comprehensive, typed Plain-Talk & Trade-Off Metadata Catalog (`src/content/tradeoffs.ts`) covering Budget Levers, Budget Packages, Sanctions, Congress Deals, Filibuster Rules, Judicial/Electoral Reforms, Constitutional Amendments, and Crisis Options (`COPY-01`, `COPY-02`, `COPY-03`).

All Plain-Talk copy must pass the Flesch-Kincaid reading grade ≤ 9.0 and sentence length ≤ 20 words gate (`src/testing/content-gates.test.ts`), while preserving 100% engine purity and golden replay hash determinism (`src/engine/determinism.test.ts`).

</domain>

<decisions>
## Implementation Decisions

### Dual-Layer Content & Engine Purity (`COPY-01`, `COPY-02`, `COPY-03`)
- **Direct Enrichment of Content/Data Catalogs:**
  - `src/content/orders.ts`: Add `emoji`, `upside`, `catchText`, `whyClick`, and `wonkName` to every `ExecutiveOrder` in `ORDERS_CATALOG`.
  - `src/content/social.ts`: Rewrite `SOCIAL_CATALOG` titles, descriptions, `tradeoffPro`, and `tradeoffCon` into crisp Kitchen-Table Plain Talk (grade ≤ 9.0) and add `emoji`, `whyClick`, `wonkLabel`, and `statutoryBasis` fields. Add `../content/social` to `src/testing/content-gates.test.ts`.
  - `src/data/trade.ts`: Rewrite `SECTOR_TARIFFS_CATALOG` and `TRADE_AGREEMENTS_CATALOG` descriptions, benefits, and impacts into relatable plain language with `emoji`, `whyClick`, `upside`, `catchText`, and `wonkLabel`, and add `../data/trade` to `src/testing/content-gates.test.ts`.
  - `src/content/text/why.ts`: Enrich `WHY_COPY` with friendly Plain-Talk labels and add a `whyTextForMode(sourceId, mode)` helper that surfaces either Kitchen-Table Plain Talk or Policy Wonk terminology.
- **Unified Trade-Off Lookup Catalog (`src/content/tradeoffs.ts`):**
  - Create `src/content/tradeoffs.ts` providing typed Plain-Talk + Policy Wonk trade-off metadata (`emoji`, `plainLabel`, `wonkLabel`, `whyClick`, `upside`, `catchText`, `statutoryBasis`, `impactScore`) for:
    - All 11 Budget Levers (`inc`, `bus`, `inv`, `pay`, `tar`, `def`, `ssm`, `mcd`, `rds`, `rnd`, `oth`) and 4 Budget Packages (`Keep as is`, `Tax cut`, `Infrastructure push`, `Balance the budget`)
    - All 3 Sanctions (`asset_freeze`, `export_controls`, `energy_embargo`) and Defense Postures (`peacetime`, `standard`, `surge`)
    - All 3 Congress Deals (`mod`, `cen`, `spc`), 5 Congress Blocs (`pro`, `mod`, `cen`, `con`, `fre`), and 4 Filibuster Rules (`sixty_vote`, `talking_filibuster`, `fifty_five_vote`, `simple_majority`)
    - All 6 Judicial & Electoral Reforms and 4 Constitutional Amendments
    - Crisis Option trade-off summaries (`getCrisisOptionTradeoff(crisisId, optionId)` and dynamic effect-based fallback `describeEffectsTradeoff(effects, cloutCost)`) so every crisis option in `CrisisModal.svelte` shows clear `👍 Helps:` and `⚠️ Costs:` badges without mutating `GameState` hashes.

</decisions>
