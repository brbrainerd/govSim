# Plan 16-03 Summary: Dedicated Trade & Tariffs Screen UI with Accessible Fallbacks (TRADE-01, TRADE-02, TRADE-03)

## Accomplished
1. **Registered Navigation & Screen Routes**:
   - Added `globe` icon to `src/design/icons.ts`.
   - Registered `trade` screen in `src/app/screens.ts` with unlocking at Turn 2 (`unlockTurn: 2`).
   - Mounted `Trade` component in `src/screens/Game.svelte` screen routing.
   - Updated screen registry test expectations in `src/app/screens.test.ts`.

2. **Session Draft Actions & Derived Metrics**:
   - Extended `Draft` in `src/app/session.svelte.ts` with `sectorTariffs` and `tradeAgreements`.
   - Implemented `toggleSectorTariff(id)` and `toggleTradeAgreement(id)`.
   - Derived `tradeCost`, `effectiveTrade`, and `tradeBalance` dynamically recomputing exports, imports, net deficit, consumer pass-through, and retaliatory foreign rates.
   - Wired draft trade selections into `decisions.trade` on `nextTurn()`.

3. **Dedicated Trade & Tariffs Screen Component (`src/screens/Trade.svelte`)**:
   - Built metrics strip with US Exports, Imports, Trade Deficit, Consumer Price Pass-Through (+% CPI), and Foreign Retaliatory Rate (%).
   - Created Strategic Sector Tariffs section for semiconductors, critical minerals, and clean energy with statutory basis citations (Section 301, Section 232) and interactive toggle affordances.
   - Created Bilateral Trade Agreements section for EU, Indo-Pacific, and Americas with clout costs, retaliatory mitigations, and ratification toggles.
   - Added State Export Exposure Matrix with accessible `<table>` fallback (`TRADE-03`) detailing regional vulnerabilities and counter-tariff drag.
   - Styled strictly using design tokens without color literals.

4. **Testing & Verification**:
   - Created `src/screens/Trade.test.ts` testing screen rendering, statutory citations, toggle interactions, clout spend, and accessible tables.
   - Verified with `npm test`, `npm run guard`, and `npm run check` (all 59 test suites passing).
