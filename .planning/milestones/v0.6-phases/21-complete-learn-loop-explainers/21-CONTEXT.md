# Phase 21: Complete the Learn Loop & Interactive Explainers — Context

**Defined:** 2026-10-13
**Requirements:** LEARN-01, LEARN-02, LEARN-03

## Decisions

1. **Civic Explainers Catalog (`src/content/explainers.ts`)**:
   - Create 4 cited, plain-language (`<= 9.0` Flesch-Kincaid grade, `<= 20` words/sentence, zero real politician/party names) civic explainers:
     - `oval_office`: *"How the Presidency Works"* (Constitutional powers, Clout capital, Prospering vs Autopilot)
     - `economy`: *"How the Macro Economy Works"* (GDP growth, jobs, inflation, and the independent Federal Reserve)
     - `budget`: *"How a Budget Becomes Law"* (Executive proposal, House 218 majority, Senate reconciliation/cloture, deficit effects)
     - `trade`: *"How Tariffs & Trade Work"* (Section 301/232 duties, import price pass-through, foreign retaliation, bilateral accords)
   - Viewing an explainer for the first time grants `+1 Clout` (`C.explainerRewardClout = 1`, stored in `viewedMyths` as `explainer:<id>`).

2. **Expanded Myth Cards (`src/content/myths.ts`)**:
   - Add 3 new myth cards to `MYTHS_CATALOG` (bringing total from 5 to 8 while preserving `|left - right| <= 1` spectrum balance):
     - `supply_side_taxes` (`challenges: 'right'`): *"Do tax cuts always pay for themselves"*
     - `debt_ceiling_default` (`challenges: 'left'`): *"Does the debt ceiling approve new spending"*
     - `trade_deficits` (`challenges: 'left'`): *"Do foreign countries pay US tariffs"*

3. **Zero Disabled "Coming Soon" Buttons (`src/screens/*.svelte`)**:
   - `OvalOffice.svelte`: Wire `"How it works"` to open `oval_office` explainer; wire Chief of Staff suggestion cards (`s.mythId`, `s.openCrisis`) to open MythModal or CrisisModal directly.
   - `Economy.svelte`: Wire `"How it works"` to `economy` explainer, `"Myth? Lower taxes boost growth?"` to `supply_side_taxes` myth modal, and `"Pressure the Fed (costs trust)"` to `FedModal`.
   - `Budget.svelte`: Wire `"How a budget becomes law"` to `budget` explainer.
   - `Trade.svelte`: Add `{#snippet learn()}` strip with `"How tariffs & trade work"` (`trade` explainer) and `"Myth? Foreign nations pay tariffs?"` (`trade_deficits` myth).
