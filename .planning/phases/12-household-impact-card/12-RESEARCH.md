# Phase 12 Research: Household Impact Card & Balance

## Executive Summary

Phase 12 is the capstone phase of Milestone v0.3 (Social Policy & Domestic Reform). It satisfies requirements **HOU-01** (Household Impact Card on Oval Office and Economy screens) and **HOU-02** (Demographic Personas & Custom Configuration), while delivering the comprehensive **Milestone v0.3 Multi-System Game Balance Calibration** across all 11 requirements (SOC-01..05, REF-01..04, HOU-01..02).

Macroeconomic indicators (GDP, output gap, debt/GDP) are abstract. The "Your Household" system grounds presidential policymaking in kitchen-table reality: what does a 2% tariff increase, an ACA subsidy expansion, or universal pre-K actually do to a real family's monthly bank balance? 

By linking state demographic exposures, BEA Regional Price Parities (RPP), progressive tax schedules, and specific social program flows to authentic household personas, players receive immediate, explainable, and emotionally resonant feedback on both drafted and enacted policies.

---

## 1. Current Codebase Architecture & Integration Points

### 1.1 Oval Office Screen (`src/screens/OvalOffice.svelte`)
- **Current Architecture**:
  - `main` snippet: `.stage` (SVG illustration of Oval Office + dialogue bubble) + `.doing` ("How America is doing" with Rosette score and 4 headline tiles: inflation, unemployment, real income, etc.).
  - `learn` snippet: "How it works" link and "Myth? Can you lower gas prices" ticket.
  - `next` snippet: `.info` ("This turn" briefing) and `.option` cards (advisor suggestions).
- **Integration Point for HOU-01**:
  - To respect strict viewport bounds (zero document scroll overflow at 1376×768 and 1280×720), the Oval Office integrates a compact **Kitchen-Table Summary Card** in the `next` column (between "This turn" and advisor options) or directly below the headline tiles in `main`.
  - The card displays the active persona's badge, location, net monthly dollar impact (`+$128 / mo` or `-$84 / mo`), top monthly benefit, and top monthly drag.
  - An interactive button (`Inspect Household Impact`) opens the modal or routes directly to the Economy screen's deep-dive view.

### 1.2 Economy Screen (`src/screens/Economy.svelte`)
- **Current Architecture**:
  - `main` snippet: 2×2 grid of `MiniChart` components (Growth, Jobs, Prices, Debt) comparing player trajectory vs autopilot.
  - `next` snippet: "Why it's happening" panel (top 3 causal movers from `trace.ts`), "Federal Reserve" explainer, "See the 8 scores" overlay trigger, and primary action button (`Fix it in Budget →`).
- **Integration Point for HOU-01**:
  - Paralleling the Voters screen's successful `Map View | Table View | Coalitions` switcher (SOC-05), the Economy screen introduces a top-level view toggle: `Macro Indicators | Your Household`.
  - In `Your Household` view:
    - Main area: Persona selector strip (4 presets + Custom builder), Monthly Net Cashflow Banner, and an interactive 7-component ledger breakdown (Wages, Groceries, Energy, Health, Childcare, Student Debt, Taxes).
    - Right column (`next` snippet): "Household Context" explaining local cost-of-living adjustments (BEA Regional Price Parity), top financial drag, and direct link to adjust policies in Budget (`Fix in Budget →`).

### 1.3 State Cost of Living & Demographics (`src/engine/voters.ts`, `src/data/electoral.ts`)
- **Phase 10 Foundation**:
  - `calculateStateFamilyRelief(stateCode, draft)` calculates average family financial relief based on state industry exposures and BEA RPP.
  - `data/electoral-2024.json` contains full demographic exposures for all 50 states + DC:
    - `rpp`: BEA Regional Price Parity index (US base = 100.0; e.g. AL = 88.4, NY = 111.2, HI = 113.8).
    - `uninsuredRate`, `seniorShare`, `immigrantLaborShare`, `childPovertyRate`, `studentDebtShare`, `youngFamilyShare`, `cleanEnergyGrowth`, `carbonIntensity`.
- **Phase 12 Enhancement**:
  - The pure engine module `src/engine/household.ts` consumes `getStateExposure(stateCode)` and the persona parameters to calculate precise per-household monthly impacts.

### 1.4 Social Policy Levers & Budget Levers (`src/engine/social.ts`, `src/engine/budget.ts`)
- **Social Policies (`src/engine/social.ts`)**:
  - ACA subsidies (`aca`): `C.acaFamilyRelief` ($30/mo base relief).
  - Medicare drug negotiations (`drg`): `C.drugFamilySavings` ($15/mo base savings).
  - Public Option (`pub`): `C.publicOptionPremiumRelief` ($10/mo premium relief).
  - Clean energy tax credits (`cln`): `C.cleanEnergyFamilyRelief` ($10/mo utility savings).
  - Federal leasing & permitting (`fos`): `C.fossilPermittingFamilyRelief` ($8/mo utility/fuel savings).
  - Carbon emission standards (`crb`): `-C.carbonStandardCost` (-$8/mo utility rate passthrough).
  - Universal Pre-K (`prek`): `C.universalPreKFamilyRelief` ($45/mo childcare relief).
  - Title I K-12 grants (`k12`): `C.titleIFamilyRelief` ($5/mo educational relief).
  - Student debt relief (`sdr`): `C.studentDebtMonthlyRelief` ($25/mo repayment relief).
- **Budget Levers (`src/engine/budget.ts`)**:
  - Income tax (`inc`): `family: -40` ($/mo per 1 pt rate change).
  - Payroll tax (`pay`): `family: -25` ($/mo per 0.1 pt change).
  - Tariffs (`tar`): `family: -10` ($/mo per 1 pt tariff increase via consumer goods).

### 1.5 Balance Calibration Harness (`src/engine/balance.test.ts`, `scripts/balance-report.ts`)
- `balance-report.json` commits benchmark distributions over 100 seeds for: `autopilot`, `sensible`, `maxDeficit`, `maxAusterity`.
- Phase 12 must audit all domestic reforms and social policies to guarantee:
  - Sensible play maintains a positive headroom between +2.0 and +10.0 prosperity index points over autopilot.
  - Autopilot beats degenerate strategies (`maxDeficit`, `tariffEverything`, `hoardClout`, `speechSpam`).
  - No policy lever is a no-op (sensitivity threshold >= 0.3 for budget, >= 0.01 for social).

---

## 2. Domain Modeling for HOU-01 and HOU-02

### 2.1 Monthly Household Budget Equation

The Net Monthly Household Impact is defined as:

$$\Delta \text{Net Monthly} = \Delta \text{Wages} - \Delta \text{Groceries \& Goods} - \Delta \text{Energy Utilities} - \Delta \text{Healthcare Costs} + \Delta \text{Childcare Savings} + \Delta \text{Student Loan Savings} - \Delta \text{Taxes}$$

Where:
1. **$\Delta \text{Wages}$**:
   Accounts for personal income bracket and regional sector exposure (manufacturing, tech, service).
2. **$\Delta \text{Groceries \& Goods}$**:
   Lower income personas spend a higher percentage (up to 35%) of income on essentials; scaled by BEA Regional Price Parities and inflation/tariff passthroughs.
3. **$\Delta \text{Energy Utilities}$**:
   Combines carbon standards costs vs clean energy and fossil permitting relief, weighted by state carbon intensity.
4. **$\Delta \text{Healthcare Costs}$ (negative is savings)**:
   Accounts for ACA subsidy eligibility, Medicare drug price negotiation caps for seniors, and public option premium relief for exchange/uninsured participants.
5. **$\Delta \text{Childcare Savings}$**:
   Direct family cashflow savings from Universal Pre-K and Title I school funding scaled by children counts.
6. **$\Delta \text{Student Loan Savings}$**:
   Direct monthly payment savings from income-driven repayment and student debt relief.
7. **$\Delta \text{Taxes}$**:
   Net take-home pay changes from statutory income tax brackets and payroll taxes.

### 2.2 Preset Demographic Personas (HOU-02)

| Preset Name | State | Income | Household Size | Vulnerabilities & Sensitivities | Policy Receptors |
|---|---|---|---|---|---|
| **Rust Belt Manufacturing Family** | Ohio (OH) | $65,000 | Married Couple + 2 kids | High home heating / utility costs, manufacturing sector wage, tariff disruption risk | Fossil leasing (`fos`), carbon standard cost (`crb`), pre-K (`prek`), tariffs (`tar`) |
| **Sun Belt Retiree** | Florida (FL) | $35,000 | Senior Single (65+) | Fixed Social Security income, high prescription volume, zero childcare, zero payroll tax | Medicare drug caps (`drg`), grocery inflation (`cpi`), ACA/Medicare funding |
| **Suburban Educator & Tech Couple** | North Carolina (NC) | $105,000 | Married Couple + 1 toddler | High college debt repayment, private daycare costs, progressive tax bracket | Student debt relief (`sdr`), universal pre-K (`prek`), income tax (`inc`), clean energy (`cln`) |
| **Urban Service Worker Family** | Nevada (NV) | $42,000 | Single Parent + 1 kid | Hourly hospitality wage, exchange/uninsured health risk, high rent/food inflation | ACA subsidies (`aca`), public option (`pub`), Title I grants (`k12`), inflation |

### 2.3 Custom Configuration Model

Players can toggle from Presets to a **Custom Household Builder**:
1. **State Selector**: 50 States + DC (automatically loads state RPP, energy carbon intensity, and baseline demographic factors).
2. **Income Tier**:
   - `$35,000` (Low Income / Fixed)
   - `$65,000` (Median Working Family)
   - `$105,000` (Upper-Middle Dual Income)
   - `$160,000` (High Earner Professional)
3. **Household Composition**:
   - `Single Adult` (1 adult, 0 children)
   - `Working Couple` (2 adults, 0 children)
   - `Young Family` (2 adults, 2 children under 6)
   - `Senior Household` (1 or 2 adults age 65+)
4. **Special Attributes (Checkboxes)**:
   - `Carries Federal Student Debt`
   - `Buys ACA Marketplace Health Insurance`

### 2.4 Real-Time Dynamic Simulation
- The calculation runs reactively against both **current enacted state** and **active pending draft** (from `session.draft.budget` and `session.draft.social`).
- When a player tweaks an ACA subsidy slider in Congress/Social or income tax in Budget, the Household Impact Card immediately reflects the pending monthly net difference before the bill is enacted.

---

## 3. UI/UX Integration & Screen Grammar

### 3.1 Layout & Viewport Adherence
govSim requires strict zero-scroll viewports at **1376×768** and **1280×720**.
- **Oval Office (`OvalOffice.svelte`)**:
  - The Household Card is rendered in the `next` column or as a streamlined horizontal strip in `main`.
  - Displays: Persona avatar/name, Net Monthly Impact Pill (`+$142/mo` in sage / `-$68/mo` in alert), and a one-click CTA `Explore Household Impact →`.
  - Accessible dialog (`HouseholdModal.svelte`) provides the full breakdown without disrupting screen layout.
- **Economy Screen (`Economy.svelte`)**:
  - Header view switcher: `[ Macro Indicators ] [ Your Household ]`.
  - `Macro Indicators` maintains the 4 `MiniChart` graphs.
  - `Your Household` replaces the chart area with the comprehensive Household Impact Dashboard:
    - Persona carousel / tab strip.
    - Large Net Cashflow Hero banner.
    - 7-line visual ledger with color-coded positive/negative bars.
    - State price parity contextual note ("Dollars stretch 11.6% further in Ohio due to lower living costs").
    - Custom builder drawer/accordion.

### 3.2 Design System Tokens & Plain Language
- **Tokens**: Only semantic CSS variables (`var(--paper)`, `var(--card)`, `var(--ink)`, `var(--sage)`, `var(--alert)`, `var(--gold)`).
- **Typography**: `var(--font-display)` (Arvo slab), `var(--font-ui)` (Barlow Condensed), `var(--font-body)` (Atkinson Hyperlegible).
- **Plain Language Grammar**:
  - Labels $\le$ 6 words.
  - Numbers format with unit, arrow, and explicit word: `+$115 a month ▲` or `−$45 a month ▼`.
  - Real civics terms placed in tooltips ("Real term: Bureau of Economic Analysis Regional Price Parities").

---

## 4. Milestone v0.3 Game Balance & Calibration Strategy

Phase 12 is the final balance gate for Milestone v0.3. It audits the combined dynamics of:
- Milestone v0.2 macro foundations (Taylor rule, Okun's law, debt drift).
- Phase 9 Social policy levers (healthcare, immigration, energy, education).
- Phase 10 Demographic & regional coalitions (cohorts, RPP, House delegation shifts).
- Phase 11 Structural government reforms (filibuster rules, judicial reform, Article V amendments).

### 4.1 Calibration Gates
1. **Sensible Play Headroom (GR-28, GR-35, GR-36)**:
   - Over 100 seeds, `sensible` strategy must beat `autopilot` by between **+2.0 and +10.0 index points**.
2. **Degenerate Strategy Non-Domination**:
   - `sensible` must strictly beat:
     - `maxDeficit` (slashing taxes, maxing spending)
     - `maxAusterity` (crushing spending, maxing taxes)
     - `tariffEverything` (40% across-the-board tariffs)
     - `hoardClout` (spending zero clout on crises or reform)
     - `speechSpam` (exhausting clout on bully pulpit speeches)
3. **Electoral Competitiveness & Party Neutrality (D4, GR-16)**:
   - For identical presidential strategies, Democratic and Republican re-election win rates across 100 seeds must not diverge by more than **5 percentage points**.
4. **Prosperity Score Bounds**:
   - Unemployment bounded in `[2.5%, 15.0%]`.
   - Inflation bounded in `[-2.0%, 12.0%]`.
   - Debt/GDP bounded in `[50%, 350%]`.
   - Presidential approval bounded in `[5%, 95%]`.
5. **Committed Balance Artifact**:
   - Re-run `node scripts/balance-report.ts` and commit the updated `balance-report.json`.

---

## 5. Test & Validation Strategy

### 5.1 Unit & Property Tests
- `src/engine/household.test.ts`:
  - Mathematical correctness of all 7 budget equations.
  - Evaluation of all 4 preset personas across baseline, reform, and extreme policies.
  - Custom configuration bounds checking and edge cases (zero income, maximum bracket).
  - Determinism verification (identical outputs across seeds and environments).
  - Zero bare literals and zero `Math.*` (enforced by `pnpm guard`).
- `src/engine/balance.test.ts`:
  - 100-seed benchmark verification against `balance-report.json`.
  - Non-domination assertion for all degenerate bot behaviors.
  - Lever sensitivity assertions for all budget, social, and reform levers.

### 5.2 Accessibility & Viewport Audits (Playwright)
- `tests/a11y.spec.ts`:
  - Axe-core scan of Oval Office Household card and modal.
  - Axe-core scan of Economy screen `Your Household` view and custom builder.
  - Zero serious or critical violations.
- `tests/household-viewport.spec.ts`:
  - Viewport layout and scroll overflow audit at **1376×768** and **1280×720**.
  - Document-level `scrollHeight <= windowHeight` and `scrollWidth <= windowWidth`.
  - Capture visual screenshots in `.planning/phases/12-household-impact-card/screenshots/`.

---

## 6. Proposed Wave Decomposition for Phase 12 Plans

| Plan | Wave | Title & Scope | Requirements |
|---|---|---|---|
| **12-01** | Wave 1 | **Pure Household Budget Engine & Personas**<br>Implement `src/engine/household.ts`, data types, preset catalog, custom builder logic, coefficients in `coefficients.ts`, units in `units.ts`, and full unit test suite `src/engine/household.test.ts`. | HOU-01, HOU-02 |
| **12-02** | Wave 2 | **UI Component Implementation & Screen Integration**<br>Build `HouseholdCard.svelte`, `HouseholdBreakdown.svelte`, and `HouseholdModal.svelte`. Integrate into `OvalOffice.svelte` and `Economy.svelte` with reactive draft binding. | HOU-01, HOU-02 |
| **12-03** | Wave 3 | **Milestone v0.3 Multi-System Game Balance & Calibration Audit**<br>Run 100-seed balance harness over all v0.3 systems (social, regional, reforms, household). Update `scripts/balance-report.ts` and commit updated `balance-report.json`. | HOU-01, HOU-02 |
| **12-04** | Wave 4 | **Accessibility, Viewport Audits & Milestone Verification**<br>Add axe-core audits in `tests/a11y.spec.ts`, viewport tests at 1376×768 and 1280×720 in `tests/household-viewport.spec.ts`, and run all quality gates. | HOU-01, HOU-02 |

---

## RESEARCH COMPLETE
