# Phase 3 Research: Turn Report & Economy

**Phase:** 03-turn-report-economy  
**Researched:** 2026-10-12  
**Target Requirements:** RPT-01, RPT-02, ECO-01, ECO-02  
**Guardrails:** GR-04, GR-05, GR-06, GR-07, GR-28, GR-36, D11  

---

## 1. Technical Contracts & Findings

### 1.1 Score Unification (RPT-02, D11, GR-04)
* **Problem:** In early prototypes, the top bar score represented current term-end `vsNothing`, while the final end-screen score used the combined formula `½ now + ½ legacy` vs autopilot. Players who engaged in high-deficit stimulus saw a high positive score mid-game only to receive a negative final score upon exit ("bait-and-switch").
* **Contract (GR-04):**
  - Both top bar score and end screen score MUST evaluate the exact same exported function:
    `scoreVsAutopilot(state: GameState, autopilotState: GameState): { total: number; now: number; later: number }`
  - Computed via:
    `finalScore(state)`: returns `{ now, later, total }` where `now = prosperity(state).index`, `later = prosperity(legacy(state)).index`, and `total = 0.5 * now + 0.5 * later`.
    `scoreVsAutopilot(playerState, autoState)`: evaluates `finalScore(playerState).total − finalScore(autoState).total`.
  - Top bar displays `total` with explicit breakdown `Now: {nowDiff} · In 10 years: {laterDiff}`.
  - Harness verification:
    - In at least 95% of runs at turn 16 across 40 seeds × 4 benchmark strategies, `sign(headline at turn 16) === sign(finalScore(player32) − finalScore(auto32))`.
    - Under `maxDeficit`, the headline score must become negative before turn 16 in at least 80% of seeds.

### 1.2 Trace Attribution & Plain Language Copy (RPT-01, GR-06, GR-07)
* **Causal Attribution:**
  - The engine `state.report.trace` contains exact delta terms for each channel:
    `gap, growth, unemployment, inflation, expected, fedRate, debtPct, income, empPop, lifeExp, gini, crime, trust, approval, clout`.
  - Each channel's delta is `sum(terms)`.
  - To explain an indicator's change:
    1. Filter out negligible residuals (< 1e-9).
    2. Identify the single largest absolute term.
    3. If the largest term represents ≥ 40% of the non-residual delta, attribute it to that cause.
    4. If no single term dominates or there is a tie, display `"Several small factors"`.
* **Copy Dictionary (`src/content/text/why.ts`):**
  - Maps every possible source key emitted by the engine to concise, plain-language text (grade ≤ 9, ≤ 6 words):
    - `budget`: `"Budget in force"`
    - `momentum`: `"Economic momentum"`
    - `debt:stress`: `"High national debt"`
    - `fed:drag`: `"Fed interest rate"`
    - `luck`: `"Unexpected shock"`
    - `tax:*`, `spend:*`: Lever-specific descriptors
    - `approval:*`: Direct voter sentiment drivers
    - `clout:*`: Political capital adjustments
  - **Drift Guard:** A unit test verifies every source id in the engine `KNOWN_SOURCES` and modifier tags has a valid mapping in `why.ts`.

### 1.3 Generic Modal Shell (`src/ui/Overlay.svelte`)
* **Requirements:**
  - Reusable container for Turn Report, Crisis modals, and End-of-Term debriefs.
  - Adheres to design §7d layout grammar: split presentation (Left = What Happened, Right = What You Can Do / Actions).
  - Traps keyboard focus (`Tab` navigation) inside the modal.
  - Closes on `Escape` key (WCAG 1.4.13, 2.1.2) or clicking backdrop.
  - `role="dialog"`, `aria-modal="true"`.

### 1.4 Economy Screen & Visualizations (ECO-01, ECO-02, OBS-07)
* **Charts vs Fallback:**
  - Displays 4 comparative charts in a 2×2 grid:
    1. Growth: Real GDP growth rate (%)
    2. Jobs: Employment-to-population ratio (%)
    3. Prices: Inflation rate (%)
    4. Debt: Debt as % of GDP
  - Trajectories: Solid line for "You", dashed navy line for "Doing nothing".
  - Clean SVG visualization responsive to container size, or lightweight component with zero bundle bloat.
  - **Accessible Table Fallbacks:** Each chart includes a toggleable or screen-reader accessible HTML `<table>` summarizing history per turn.
* **Fed Rate Explainer:**
  - Displays `e.fedRate%`.
  - Explains rate change using Taylor rule trace terms:
    - Inflation vs 2.0% target (`e.inflation − C.inflTarget`).
    - Output gap (`e.gap`).
* **"Why it's happening" Panel:**
  - Summary of the top 3 macroeconomic movers this quarter derived from engine trace terms.
* **Navigation:**
  - Navy button `"Fix it in Budget →"` routes to `screen = 'budget'`.

### 1.5 Parallel Work: VOT-06 Data Sourcing Preparation
* Identify and compile:
  - Maine and Nebraska congressional district baseline vote shares (ME-01, ME-02, NE-01, NE-02, NE-03).
  - 119th Congress House delegations by state (for contingent election tie resolution).
  - State economic exposures (agriculture, manufacturing, energy).
