# Phase 11: Structural Government Reform & Amendments — Research & Technical Specification

**Phase:** 11  
**Milestone:** v0.3 (Social Policy & Domestic Reform)  
**Requirements:** REF-01, REF-02, REF-03, REF-04  
**Status:** Research Complete — Ready for Planning

---

## 1. Executive Summary

Phase 9 established the domestic social policy levers (healthcare, immigration, energy/climate, education), and Phase 10 connected those choices to 51 state economies, 6 national demographic cohorts, and competitive congressional delegation shifts. However, in the real United States, presidential policy ambitions routinely collide with foundational constitutional architecture:
1. **The Senate Filibuster**: Senate Rule XXII requires a 60-vote supermajority (cloture) to end debate on ordinary legislation. While budget reconciliation permits simple-majority passage (51 votes) for fiscal bills under the Byrd Rule, substantive regulatory, social, and structural reforms are routinely blocked by the minority party unless the filibuster is reformed or abolished.
2. **The Federal Judiciary & Supreme Court**: Under Article III, Supreme Court justices serve during "good behaviour" (effectively lifetime tenure), currently maintaining a 6–3 conservative majority. Key executive orders, agency regulations, and statutory programs face high risk of being struck down under the Major Questions Doctrine and administrative law doctrines.
3. **Electoral & Democratic Rules**: Partisan gerrymandering erodes competitive House districts, plurality voting entrenches two-party duopoly and polarization, and private campaign finance fuels public cynicism and collapses institutional trust.
4. **Constitutional Amendments**: The ultimate democratic lever under Article V requires passing two staggering hurdles: a 2/3 supermajority in both the House (290 votes) and the Senate (67 votes), followed by ratification by 3/4 of the state legislatures (38 of 50 states).

**Phase 11 (Structural Government Reform & Amendments)** delivers the pure engine mechanics, domain catalogs, procedural rules, and civics UI to simulate these profound institutional choices:
- **REF-01**: 4 Senate Filibuster options (60-vote rule, talking filibuster, 55-vote threshold, simple-majority nuclear option).
- **REF-02**: 3 Supreme Court & Judicial reform levers (18-year staggered term limits, statutory ethics code of conduct, bench expansion by +2 or +4 seats).
- **REF-03**: 3 Electoral reform policies (ranked-choice voting grant incentives, nonpartisan redistricting commission incentives, small-dollar donor public matching funds).
- **REF-04**: Constitutional amendment mechanism with the authentic Article V hurdles (2/3 House = 290, 2/3 Senate = 67, 3/4 States = 38/50) across 4 high-stakes amendment candidates (Judicial Term Limits, Campaign Finance, Equal Rights, Balanced Budget).

---

## 2. Codebase Architecture & Integration Analysis

### 2.1 Congress Engine (`src/engine/congress.ts`)
- **Current State**:
  - Constants: `HOUSE_SEATS = 435`, `TO_PASS = 218`, `SENATE_SEATS = 100`, `SENATE_CONFIRMATION_THRESHOLD = 51`.
  - House whip logic: `tally()` evaluates votes across 5 ideological blocs (`pro`, `mod`, `cen`, `con`, `fre`), shifting votes based on budget deals and social policy (`socialWhipShift`).
  - Senate model: `calculateMidtermShift` calculates `senateShift` (`rawSenate = Math.round(approvalDelta * 0.2 - 2 + battlegroundMarginShift * 0.3)` bounded in `[-6, +4]`).
  - Confirmation logic: `SENATE_CONFIRMATION` models Fed chair nominations (`centrist: 68`, `hawk: 54`, `dove: 47`).
- **Gaps for Phase 11**:
  - `GameState` currently tracks `houseSeatDelta` but **does not track `senateSeatDelta`**.
  - Current legislative passage in `resolveBill` only tests House votes (`whip.total >= 218`). The Senate is never checked!
  - No representation of Senate cloture, filibuster rules, or procedural hurdles for non-reconciliation legislation.
  - UI placeholder on `Congress.svelte:99`: `<button class="link" disabled title="Coming soon">Senate: 60 votes, or 51 for budget bills</button>`.

### 2.2 Executive Powers & Judiciary (`src/engine/powers.ts` & `src/screens/Powers.svelte`)
- **Current State**:
  - `CourtRiskBand` ('Low' | 'Moderate' | 'High') with uphold probabilities (`C.courtUpholdLow: 0.8`, `C.courtUpholdModerate: 0.5`, `C.courtUpholdHigh: 0.25`).
  - Keyed draw on `'court'` stream schedules delayed rulings (`due: state.turn + C.courtReviewDelayTurns`).
  - Unused `nominateScotus` stub in `PowerDecisions` interface (`powers.ts:20`).
  - `Powers.svelte` renders a 9-justice bench via `CourtBench.svelte` (6 conservative, 3 liberal).
- **Gaps for Phase 11**:
  - Supreme Court composition is static (6–3). Bench expansion (+2 or +4) and regularized appointments (18-year term limits) are not modeled.
  - Judicial ethics oversight does not exist.
  - Statutory judicial reforms are not subject to Article III constitutional review challenges.

### 2.3 Decisions & State Lifecycle (`src/engine/decisions.ts` & `src/engine/game.ts`)
- **Current State**:
  - Decisions batched per turn: `Decisions` currently contains `{ bill?, crisis?, powers?, social? }`.
  - Pure deterministic resolution: `resolveBill`, `resolveCrisisChoice`, `resolvePowerDecisions`.
  - Clout budget enforcement: all actions verified against `state.clout` before application.
  - Causal tracing: every indicator change is recorded in `trace.ts` via `Ledger`.
- **Gaps for Phase 11**:
  - Needs `reform?: ReformDecisions` added to `Decisions`.
  - Needs pure resolution functions: `resolveReformDecisions()` and updated `resolveBill()` evaluating Senate cloture.

### 2.4 State Data & Electoral Model (`src/data/electoral.ts`, `data/electoral-2024.json`, `src/engine/voters.ts`)
- **Current State**:
  - `HOUSE_DELEGATIONS` tracks 50 states (18 D, 30 R, 2 split).
  - `STATE_EXPOSURES` tracks 13 demographic and industry exposure metrics per state.
  - `calculateStateMargins` models popular support and victory margins across 56 voting units.
- **Gaps for Phase 11**:
  - No dataset of state legislative party control (essential for the 3/4 state legislature ratification requirement under Article V).
  - No model of competitive House districts shifting under independent redistricting commissions.

---

## 3. Domain Modeling for Phase 11 Requirements

### 3.1 REF-01: Senate Filibuster Reform Levers

The Senate legislative filibuster governs cloture under Senate Rule XXII. In `govSim`, domestic legislation consists of two types:
1. **Budget Reconciliation Bills**: Pure fiscal packages (taxes and mandatory spending) that comply with the Byrd Rule. These bypass the filibuster and require only a simple majority (**51 votes**).
2. **Substantive Domestic Legislation**: Bills containing social policy reforms, regulatory changes, or institutional structural reforms. These require invoking cloture according to the active **Senate Filibuster Rule**.

#### The 4 Filibuster Levers

| Lever ID | Name | Cloture Threshold | Clout Cost | Institutional / Political Tradeoffs |
|---|---|---|---|---|
| `sixty_vote` | 60-Vote Rule (Status Quo) | Static 60 votes | 0 clout | Traditional stability. 0 trust penalty. High legislative gridlock: substantive social and reform bills rarely pass without broad bipartisanship. |
| `talking_filibuster` | Talking Filibuster | Dynamic (52–60 votes) based on public approval | 15 clout | Minority must continuously hold the floor. Cloture threshold scales with national approval: `clamp(60 - round((approval - 50) * 0.4), 51, 60)`. High public support breaks filibuster. -1 trust pt from institutional traditionalists. |
| `fifty_five_vote` | 55-Vote Threshold | Static 55 votes | 20 clout | Bipartisan compromise lowering the hurdle by 5 votes. Moderate bills pass with small crossover support. -2 trust pts. |
| `simple_majority` | Nuclear Option (51 Votes) | Static 51 votes | 35 clout | Full simple-majority rule for all domestic bills. Maximum legislative velocity. Severe backlash: -5 trust pts (norm breach), -3% approval shock, and persistent minority obstruction modifier (`event:nuclear_backlash`). |

#### Senate Voting & Whip Mechanics
- **Senate Composition**:
  Starting baseline (119th Congress): 53 Republican, 47 Democrat (including 2 independents caucusing with D).
  Adjusted dynamically by `senateSeatDelta` calculated at midterms (Years 2 & 6).
- **Senate Vote Calculation**:
  ```typescript
  export function calculateSenateVotes(
    playerSenateSeats: number,
    billType: 'reconciliation' | 'substantive',
    approval: number,
    bipartisanAppeal: number // from deals or centrist policy balance
  ): number {
    const basePartyVotes = playerSenateSeats;
    const approvalBonus = Math.max(-3, Math.min(5, Math.round((approval - 50) * 0.15)));
    const crossoverVotes = Math.max(0, Math.min(10, Math.round(bipartisanAppeal * 0.5)));
    return Math.max(0, Math.min(100, basePartyVotes + approvalBonus + crossoverVotes));
  }
  ```
- **Passage Rule**:
  A bill becomes law if and only if:
  1. House passes: `whip.total >= 218`
  2. Senate passes: `senateVotes >= senateThreshold`
  If House passes but Senate falls short of cloture:
  `status: 'filibustered' | 'senate_failed'` with explicit feedback ("Passed House 228–207, but blocked in Senate with 54 of 60 votes needed"). Half the spent clout is refunded.

---

### 3.2 REF-02: Supreme Court & Judicial Reform

Article III gives Congress the power to establish federal courts and set the size and appellate jurisdiction of the Supreme Court, while the President nominates justices with the advice and consent of the Senate.

#### The 3 Judicial Reform Levers

| Lever ID | Reform Name | Clout Cost | Mechanism & Dynamics | Constitutional / Political Friction |
|---|---|---|---|---|
| `scotus_term_limits` | 18-Year Staggered Terms | 25 clout | Regularizes appointments every 2 years (Turn 5 & Turn 13). Senior justices rotate to circuit duty. | **Article III Challenge**: High risk (65%) of 6–3 Court ruling statutory term limits unconstitutional under the "good behaviour" clause. If struck down, -5 clout penalty unless passed via Constitutional Amendment (REF-04). If upheld, stabilizes vacancy schedule and eliminates appointment crises. |
| `statutory_ethics_code` | Statutory Code of Conduct | 20 clout | Enacts mandatory financial disclosures, enforceable recusal standards, and an independent Inspector General for federal judiciary. | **Credibility Gain**: Boosts institutional trust (+3 trust pts) and public faith in the legal system. Low constitutional friction; conservative justices register dissent but comply. |
| `court_expansion` | Bench Expansion (+2 or +4 Seats) | 40 clout | Enacts a new Judiciary Act expanding bench from 9 to 11 or 13 justices. Requires passing Congress through the Senate filibuster! | **Senate Confirmation Battle**: Filling newly created seats requires winning confirmation votes in the Senate (51-vote threshold).<br>**Direct Impact**: Flips conservative 6–3 majority to 6–5 or 7–6 progressive/moderate majority. Drastically lowers risk of executive orders and regulations being struck down.<br>**Severe Backlash**: -6 trust pts ("court packing" norm erosion), +10% opposition turnout in midterms. |

#### Court Leanings & Judicial Scrutiny Transmission
The Court's balance of justices (`conservative` vs `liberal` / `moderate`) directly scales the uphold probabilities for executive orders:
```typescript
export function computeCourtUpholdProbability(
  baseRisk: 'Low' | 'Moderate' | 'High',
  conservativeCount: number,
  liberalCount: number
): number {
  const margin = liberalCount - conservativeCount; // baseline: 3 - 6 = -3
  const adjustment = margin * 0.08; // each net justice shifts uphold probability by 8%
  const base = baseRisk === 'Low' ? 0.80 : baseRisk === 'Moderate' ? 0.50 : 0.25;
  return clamp(base + adjustment, 0.05, 0.95);
}
```

---

### 3.3 REF-03: Electoral Reform Policies

Congress holds broad authority under the Elections Clause (Article I, Section 4) to regulate federal elections, as well as spending power to offer conditional grant incentives to states.

#### The 3 Electoral Reform Levers

| Lever ID | Policy Name | Fiscal Outlay | Clout Cost | Electoral & Political Transmission |
|---|---|---|---|---|
| `rcv_incentives` | Ranked-Choice Voting Federal Grants | $2.5B / yr | 15 clout | Federal matching grants to states adopting instant-runoff / RCV for congressional elections.<br>• **Turnout**: +1.5% national turnout lift.<br>• **Depolarization**: Moderates primary extremism; boosts centrist / third-party vote share (+3 pp).<br>• **Trust**: +1.5 trust pts. |
| `independent_redistricting` | Nonpartisan Redistricting Commissions | $0.5B / yr | 25 clout | Conditioning federal election grants on states establishing independent nonpartisan citizen redistricting commissions (eroding partisan gerrymandering).<br>• **Competitive Seats**: Increases competitive battleground House seats from ~40 to ~75.<br>• **Midterm Responsiveness**: House control becomes much more sensitive to public approval and national performance, eliminating artificially safe partisan majorities. |
| `small_dollar_matching` | Small-Dollar Donor Public Match | $4.5B / yr | 20 clout | 6:1 public match for contributions under $200 for federal candidates accepting spending caps.<br>• **Civic Participation**: +2.0% voter turnout.<br>• **Trust**: +2.5 trust pts (weakening billionaire / PAC influence).<br>• **Approval**: +1% base approval lift. |

---

### 3.4 REF-04: Constitutional Amendment Mechanism

Article V establishes the highest procedural hurdle in American democracy:
1. **Proposal Supermajority**:
   - 2/3 House of Representatives: **290 of 435 votes** (66.7%).
   - 2/3 Senate: **67 of 100 votes** (66.7%).
   *(Note: Article V also allows a national convention called by 2/3 of states, but all 27 existing amendments originated in Congress).*
2. **State Ratification Supermajority**:
   - 3/4 of the State Legislatures: **38 of 50 states** (76.0%).
   *(Civics Note: Washington D.C. has no state legislature and cannot ratify constitutional amendments under Article V).*

#### The 4 Candidate Amendments

| Amendment ID | Name | Civics Intent & Core Mechanics | Ratification Dynamics & Benefits |
|---|---|---|---|
| `amendment_judicial_terms` | 18-Year Supreme Court Term Limits | Imposes 18-year staggered terms constitutionally, eliminating any Article III "good behaviour" judicial review challenge. | Supported by good-governance advocates across both parties. Once ratified, permanently immunizes term limits against court challenge; +4 trust pts. |
| `amendment_campaign_finance` | Overturn *Citizens United* & Campaign Limits | Explicitly empowers Congress and state legislatures to limit, regulate, and disclose all political spending and contributions. | Popular across public (75%+ in polls) but opposed by party establishments. Ratification permanently unlocks small-donor matching effectiveness; +6 trust pts; eliminates dark-money corruption penalties. |
| `amendment_equal_rights` | Equal Rights Amendment (ERA) | Guarantees that equality of rights under the law shall not be denied or abridged by the United States or any state on account of sex. | High appeal in progressive and moderate states; fierce resistance in socially conservative state legislatures. Ratification permanently lifts life expectancy and economic equity metrics (+0.2 potential growth, -0.01 Gini). |
| `amendment_balanced_budget` | Balanced Budget Amendment | Mandates that total federal outlays not exceed total receipts each fiscal year, except during declared war or upon a 3/5 vote in each chamber. | Strong conservative appeal; resisted by progressive and Keynesian economists. Ratification strictly caps deficit growth at 0% GDP; lowers bond yields by 25 bps, but restricts fiscal countercyclical stimulus during recessions. |

#### State Legislature Ratification Model
In 2026, the 50 state legislatures break down according to authentic NCSL partisan data:
- **Republican Controlled**: 28 states (AL, AK, AR, FL, GA, ID, IN, IA, KS, KY, LA, MO, MS, MT, NC, ND, NE, OH, OK, SC, SD, TN, TX, UT, WV, WI, WY, etc.)
- **Democrat Controlled**: 20 states (CA, CO, CT, DE, HI, IL, ME, MD, MA, MI, MN, NV, NJ, NM, NY, OR, RI, VT, WA, etc.)
- **Divided / Split**: 2 states (e.g. PA, VA)

**Ratification Probability Dynamics**:
To reach **38 states**, no single party has enough states on its own (28 R or 20 D < 38)! An amendment **cannot be ratified without bipartisan state support**.
- Aligned state legislatures ratify within 1–2 quarters of congressional proposal.
- Divided state legislatures ratify if national approval > 55% or presidential clout is spent campaigning in state capitals.
- Opposition state legislatures ratify **only** if national approval > 65% and the amendment carries strong bipartisan consensus.
- Progress is tracked turn-by-turn until 38 states ratify or the 7-year (28-quarter) constitutional deadline expires!

---

## 4. Engine Purity & Guardrails

Phase 11 must strictly follow govSim's non-negotiable engine foundations:
1. **Mathematical Determinism & Zero Transcendentals**:
   - Zero `Math.*` in `src/engine/`. All rounding, clamping, and arithmetic use `detmath.ts` (`round`, `clamp`, `abs`, `sqrt`).
   - Bit-identical across browsers and engines (Node, Chromium, Firefox, WebKit).
2. **Exhaustive Constant Registration**:
   - Every single threshold, cost, and multiplier is registered in `coefficients.ts` (`C`, `RULES`, `LIMITS`) or `units.ts`.
   - Zero unregistered literals in engine code (enforced by `pnpm guard`).
3. **RNG Stream Isolation (FND-01)**:
   - Introduce a dedicated `'reform'` or `'amendment'` RNG stream: `draw(seed, 'reform', turn, key)`.
   - Never draw from `'macro'`, `'court'`, or `'crisis'` streams for reform resolutions, guaranteeing that unmade reform choices never alter baseline macroeconomic or crisis events.
4. **Conservation & Backward Compatibility**:
   - Fiscal grant outlays tracked in `Ledger` (`trace.ts`) without unallocated residual leakage.
   - When no reforms are enacted, baseline replay hashes match existing characterization benchmarks bit-for-bit.

---

## 5. UI Architecture & Explainability

### 5.1 Where Reforms Live in the UI
To respect the layout grammar (UX-4) and visual targets without adding unmanageable screen sprawl, reforms are integrated seamlessly into the existing 6-screen architecture:
1. **Congress Screen (`Congress.svelte`)**:
   - **Senate Status Strip & Filibuster Control**:
     - The placeholder link on line 99 (`Senate: 60 votes, or 51 for budget bills`) becomes an interactive modal launcher: **"Senate Rules & Filibuster"**, opening `FilibusterModal.svelte`.
     - The whip count displays both chambers: House (`218 needed`) and Senate (`60 / 55 / 51 needed`).
   - **Article V Amendments Section**:
     - Dedicated action card: **"Constitutional Amendments"**, opening `AmendmentModal.svelte`.
     - Displays the 3-stage funnel: House (290) → Senate (67) → States (38/50).
2. **Your Powers Screen (`Powers.svelte`)**:
   - **Judicial Reform Expansion**:
     - The Supreme Court card gains a secondary action button: **"Judicial Reform Options..."**, opening `JudicialReformModal.svelte` (18-year term limits, ethics code, bench expansion +2/+4).
   - **Electoral Reform Card**:
     - New institutional card beside the Fed and Court for Electoral Reforms (RCV grants, nonpartisan redistricting, small-dollar matching).
3. **Voters Screen (`Voters.svelte`)**:
   - State Inspector card displays **State Legislature Control** (e.g. `Legislature: Dem Trifecta` / `GOP Majority` / `Divided`) and **Amendment Ratification Status** when an amendment is active.
   - Competitive House districts metric displayed on the Coalitions view.

### 5.2 Civics Plain Language Rules
- Labels ≤ 6 words, reading grade ≤ 9.
- Jargon converted to intuitive concepts:
  - "Senate Debate Rule" instead of "Senate Rule XXII Cloture".
  - "Talking Debate Requirement" instead of "Exhaustion Filibuster".
  - "Staggered 18-Year Terms" instead of "Senior Status Rotation".
  - "Independent District Maps" instead of "Statutory Nonpartisan Redistricting Commissions".
- Real constitutional citations displayed in tooltips and "How it works" modals.

---

## 6. Implementation Waves & Plan Breakdown

Phase 11 will be executed across **4 distinct, dependency-aware waves**:

```
Wave 1 (Plan 11-01): Pure Engine Dynamics, Senate Filibuster & Coefficients (REF-01)
         │
         ▼
Wave 2 (Plan 11-02): Judicial & Electoral Reform Engines (REF-02, REF-03)
         │
         ▼
Wave 3 (Plan 11-03): Constitutional Amendment System & State Ratification (REF-04)
         │
         ▼
Wave 4 (Plan 11-04): UI Implementation, Modals, Accessibility & E2E Validation (REF-01..04)
```

- **Plan 11-01 (Wave 1: Filibuster Reforms & Senate Dynamics — REF-01)**:
  - Register filibuster coefficients in `coefficients.ts`.
  - Add `senateSeatDelta` and `filibusterRule` to `GameState`.
  - Update `calculateSenateVotes()` and `resolveBill()` to evaluate both House (218) and Senate cloture thresholds.
  - Property tests for filibuster passage and backward-compatible replays.
- **Plan 11-02 (Wave 2: Judicial & Electoral Reform Engines — REF-02, REF-03)**:
  - Implement statutory 18-year term limits with Article III court review challenges.
  - Implement statutory judicial ethics code.
  - Implement bench expansion (+2 or +4 seats) with Senate confirmation battles and uphold probability shifting.
  - Implement electoral reform policies (RCV, independent redistricting commissions, small-dollar matching) modifying competitive House seats and turnout.
- **Plan 11-03 (Wave 3: Constitutional Amendment Engine — REF-04)**:
  - State legislature partisan control dataset (50 states).
  - Congressional proposal hurdle (290 House, 67 Senate).
  - 38-state ratification simulation engine across turns with approval and alignment dynamics.
  - Permanent constitutional lock-in modifiers.
- **Plan 11-04 (Wave 4: UI Modals, Visuals, Accessibility & Verification — REF-01..04)**:
  - `FilibusterModal.svelte` accessible from Congress screen.
  - `JudicialReformModal.svelte` and Electoral Reform card on Powers screen.
  - `AmendmentModal.svelte` with 3-stage progress tracking (House → Senate → 38 States).
  - Playwright E2E and visual/a11y audits across 1376×768 and 1280×720 viewports with zero outer scroll leakage.

---

## 7. Testing & Verification Strategy

1. **Unit Test Suite**:
   - `congress.test.ts`: Filibuster threshold calculations (60, talking filibuster approval discount, 55, 51). Verify failure in Senate triggers clout refund.
   - `powers.test.ts`: Judicial reforms, court expansion confirmation tallies, shift in uphold probabilities.
   - `reforms.test.ts`: Electoral reforms and competitive seat redistribution.
   - `amendments.test.ts`: 2/3 House (290), 2/3 Senate (67), and 38-state legislature ratification logic.
2. **Determinism & Invariants**:
   - Replay invariance: Baseline replays with no reforms produce identical hashes.
   - Property tests over 500 randomized runs verifying no NaN, bounds compliance, and finite clout.
3. **UI & Accessibility Gates**:
   - `@axe-core/playwright` 0 violations on all screens and reform modals.
   - Keyboard tab order and Escape key dismissal verified on all new overlays.
   - Responsive zero-scroll verification at 1376×768 and 1280×720.

---

## RESEARCH COMPLETE
