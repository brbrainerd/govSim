# Phase 07: Election & End of Term — Research & Technical Findings

## 1. Domain & Civics Context

### 1.1 Electoral College Resolution & Contingent Election (ELC-01, GR-15)
* **Reelection Timing**: Turn 16 (Year 4, Fall / November election).
* **Winning Condition**: Standard Electoral College rules require a strict majority of 270 electoral votes out of 538.
* **12th Amendment Contingent Election (GR-15)**:
  - If neither candidate reaches 270 EV (i.e. a 269–269 tie):
  - The election moves immediately to the House of Representatives.
  - Voting is by **state delegation**, where each of the 50 states receives exactly **one vote**.
  - A candidate needs an absolute majority of 26 states to win.
  - The District of Columbia has 3 electors under the 23rd Amendment, but **zero votes** in a contingent election under the 12th Amendment.
  - Sourced from `HOUSE_DELEGATIONS` in `src/data/electoral.ts` (119th Congress):
    - Each state's delegation vote is determined by whether Democrats or Republicans hold the majority of seats in that state delegation.
    - If seats are evenly split (e.g., NC or MN), the delegation is split/uncommitted.
  - Ties must be tested with an exact deterministic fixture (`GR-15`).

### 1.2 Forecast Calibration & Election Night Pacing (ELC-02, GR-37, Pitfall 23)
* **Calibration Standard (GR-37)**:
  - The presidential forecast shown prior to Turn 16 must be calibrated such that the election is neither a coin-flip nor a foregone conclusion.
  - Modeled using the pure electoral model (`src/engine/voters.ts`): state-by-state baseline margin + national environment swing + correlated error.
* **Election Night Experience (ELC-02)**:
  - Dramatic animated reveal sequence: States are called in order of certainty (safe states first, battlegrounds called one by one).
  - Live running EV tally bar moving towards the 270 mark.
  - **Reduced Motion (Pitfall 23)**: If `prefers-reduced-motion` is active or the player presses Space / clicks "Skip to Result", the reveal finishes in `< 100ms` without animations.

### 1.3 Why-You-Won / Lost Attribution & Turn 16 Retry (ELC-03)
* **Attribution**:
  - Derived from the engine trace: identifies the top 3 state-tipping issues (inflation, trade tariffs, energy prices) that determined key battleground margins.
  - Compares the player's outcome directly with autopilot's outcome on the same seed.
* **Turn 16 Retry**:
  - The player can retry from the start of Turn 16.
  - Must restore the exact turn 16 start state snapshot on the same seed, allowing the player to adjust year 4 decisions while preserving deterministic RNG.

### 1.4 Term Continuation vs End Screen (ELC-04)
* **Victory (>= 270 EV or 26 state delegations)**:
  - The player wins reelection and advances to Turn 17 ("Term 2 · Year 5 · Winter").
  - The simulation continues up to Turn 32 (Year 8, Fall).
* **Defeat (< 270 EV and opponent reaches 270 or 26 delegations)**:
  - Direct transition to the End Screen.
* **Turn 32 Full Term Completion**:
  - When Turn 32 finishes, the presidency concludes and transitions to the End Screen.

### 1.5 End Screen, 10-Year Legacy & Historian Verdicts (ELC-05, GR-04)
* **Score Consistency (GR-04)**:
  - Single exported function `projectScore` / `calculateFinalScore`: identical to the headline score in the top bar.
  - Displays `+X.X better than doing nothing`, partitioned into `Now` and `In 10 years`.
* **10-Year Legacy Simulation**:
  - Runs pure engine 40 steps (10 years) forward beyond exit term with automatic stabilizers active and policies held constant.
  - Charts comparative paths: Player vs Doing Nothing for GDP growth, debt/GDP, unemployment, and inflation.
  - Must include accessible `<table>` fallback.
* **Historian Verdict Tiers**:
  - 5 objective, nonpartisan tiers keyed purely on score bands:
    1. *Transformational* ($\ge +10.0$)
    2. *Steward of Stability* ($+3.0$ to $+9.9$)
    3. *Mixed Legacy* ($-2.9$ to $+2.9$)
    4. *Presidency of Unresolved Crises* ($-3.0$ to $-9.9$)
    5. *Institutional Breakdown* ($< -10.0$)

---

## 2. Technical Architecture & Component Slicing

### Plan Breakdown
1. **Plan 07-01: Pure Reelection & Contingent Engine**:
   - `src/engine/election.ts`: Reelection evaluation, 12th Amendment contingent election resolution, tie fixtures (`GR-15`), why-you-won/lost attribution extractors, 10-year legacy projection simulator (`ELC-01`, `ELC-03`, `ELC-05`, `GR-04`).
   - Unit tests: `src/engine/election.test.ts`.
2. **Plan 07-02: Election Night Modal & Contingent Election UI**:
   - `src/ui/ElectionNightModal.svelte`: Animated state roll-call, 270 bar race, skip button, reduced motion support (`ELC-02`, Pitfall 23).
   - `src/ui/ContingentElectionModal.svelte`: 12th Amendment roll call showing 50 state delegations.
   - `src/ui/ElectionResultCard.svelte`: Why-you-won/lost summary with "Retry Turn 16" button.
3. **Plan 07-03: Session Lifecycle & End Screen**:
   - `src/app/session.svelte.ts`: Turn 16 reelection interception, retry turn 16 restore, second-term continuation to Turn 32, End Screen trigger (`ELC-04`).
   - `src/screens/EndScreen.svelte`: 4-part layout grammar screen with 10-year legacy projection chart, table fallback, and 5 nonpartisan historian verdict tiers (`ELC-05`).
   - `src/screens/Game.svelte`: End screen route wiring.
4. **Plan 07-04: E2E Tests, Accessibility & Viewport Audits**:
   - `tests/election.spec.ts`: E2E test verifying election night reveal, contingent election tie resolution, retry turn 16, second term continuation, and end screen legacy chart (`ELC-01`..`ELC-05`).
   - `tests/a11y.spec.ts`: Axe-core audits for Election Night modal, Contingent Election modal, and End Screen.
   - `tests/visual.spec.ts`: Zero outer scroll check across 1376x768 and 1280x720 viewports.
