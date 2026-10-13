# Phase 10: Demographic & Regional Distribution — Research & Technical Specification

**Phase:** 10  
**Milestone:** v0.3 (Social Policy & Domestic Reform)  
**Requirement:** SOC-05 (Sector & Demographic Distribution)  
**Status:** Research Complete — Ready for Planning  

---

## 1. Executive Summary

Phase 9 established the pure, deterministic foundation for domestic social policy levers across Healthcare, Immigration, Energy/Climate, and Education (SOC-01..04). However, national policy shifts in the real United States do not affect all 50 states or voter groups equally:
- An expansion of Affordable Care Act subsidies dramatically reduces health spending and uninsured rates in states like Texas (16.6% uninsured) and Georgia (12.6%), while having negligible marginal impact in Massachusetts (2.4% uninsured).
- Medicare prescription drug price negotiation delivers immediate, tangible out-of-pocket relief in senior-dense states like Florida, Maine, and West Virginia (each >21% age 65+).
- Clean energy production tax credits catalyze localized capital investment and green manufacturing across the wind-and-solar Plains corridor (Iowa, Kansas, Texas, New Mexico), while stringent carbon standards create transition friction and higher utility costs in coal-dependent states (West Virginia, Wyoming, Kentucky).
- Universal Pre-K and Title I school funding ease kitchen-table balance sheets for working parents and high-poverty school districts, while student debt relief targets college-educated suburban populations.

**Requirement SOC-05** demands that domestic social policy choices dynamically transmit to:
1. **State-Level Voter Coalitions**: Battleground margins shift realistically based on state industry, demographic, and policy exposure.
2. **Local Cost-of-Living Metrics**: Regional Price Parities (RPP) adjust national family relief to show true local purchasing power and kitchen-table impact.
3. **Congressional Seat Leanings**: State-level coalition movements translate into House delegation leanings and midterm seat pressure.
4. **Demographic Coalition Sentiment**: Distinct voter cohorts (Seniors, Working Class, Young Families, College-Educated, Immigrant Communities, Energy Workers) react to policy tradeoffs with transparent, plain-language attribution.

This specification provides the empirical foundation, mathematical transmission mechanics, state exposure data schema, UI architecture, and guardrail verification suite to implement Phase 10 with bit-identical determinism and zero balance regressions.

---

## 2. Current Codebase Architecture & Gaps

### 2.1 Existing Electoral Model (`src/engine/voters.ts`)
The current voter engine simulates 56 units (50 states + DC + ME-1/ME-2/NE-1/NE-2/NE-3):
- **Margin Formulation**:
  ```typescript
  const currentMargin = isUnadjusted
    ? unadjustedBase
    : baselineMargin + natShift + totalExposureShift + shock;
  ```
  Where:
  - `natShift = approvalDelta * C.voterApprovalElasticity`
  - `totalExposureShift = farmShift + mfgShift + energyShift`
    - `farmShift = -tariffDev * exp.farm * C.voterFarmTariffSensitivity`
    - `mfgShift = growthDev * exp.manufacturing * C.voterMfgGrowthSensitivity`
    - `energyShift = -inflDev * exp.energy * C.voterEnergyInflationSensitivity`
- **State Exposures (`src/data/electoral.ts` & `data/electoral-2024.json`)**:
  - `STATE_EXPOSURES` currently only tracks 3 economic variables: `farm` (share of state GDP), `manufacturing` (share of state GDP), and `energy` (share of state GDP).
- **Voter Reasons (`deriveReasons`)**:
  - Generates simple bullet points strictly for tariffs, industrial growth, inflation on energy, and national approval.
- **Tipping-Point Centering (`calculateTippingPointOffset`)**:
  - Guarantees baseline fairness so both parties start with ~270 EV and maintain equal reelection odds within 5 pp over 300 random seeds (D4, GR-16).

### 2.2 Existing Social Engine (`src/engine/social.ts`)
- 12 active levers across 4 domains (`aca`, `drg`, `pub`, `bdr`, `vis`, `reg`, `cln`, `fos`, `crb`, `k12`, `sdr`, `prek`).
- `GameState.socialPolicy` stores enacted laws (`SocialDraft | undefined`).
- Macro indicators (GDP, employment, inflation, deficit, family monthly budget, life expectancy) already update in `step()` (`game.ts`).
- **Critical Gap**: `voters.ts` does not inspect `state.socialPolicy`! Enacting a major healthcare reform, immigration overhaul, energy transition, or education grant currently produces zero regional variance or demographic coalition response.

### 2.3 Existing Congress Engine (`src/engine/congress.ts`)
- `calculateMidtermShift(approval: number)` evaluates midterm House and Senate seat swings solely as a function of national presidential approval.
- `HOUSE_DELEGATIONS` in `data/electoral-2024.json` records 119th Congress partisan breakdowns (e.g. PA: 7 D, 10 R) but is currently only used for 12th Amendment contingent election resolution.
- **Gap**: State-level voter realignment does not currently feed into competitive House district shifts or midterm delegation movements.

### 2.4 Existing UI (`src/screens/Voters.svelte`)
- Provides interactive SVG map (`USMap.svelte`) and sortable data table (`states-table`).
- Shows 270 EV progress bar with honest projection range (VOT-03).
- State inspector sidebar displays Support %, Trend vs baseline, and "WHY VOTERS FEEL THIS WAY" reasons.
- **Gap**: No demographic cohort breakdown, no state-level cost-of-living indicator, and no social policy attribution in the state inspector.

---

## 3. Domain Analysis & State Exposure Model

To model SOC-05 faithfully to real-world civics without overwhelming the engine, we introduce an expanded, empirical **State Demographic and Sector Exposure Dataset** sourced directly from the U.S. Census Bureau (ACS 2023/2024), Bureau of Economic Analysis (BEA SAGDP & RPP), and Energy Information Administration (EIA SEDS).

### 3.1 Social Policy Transmission Channels

| Domain | Levers | Primary State Exposure Metric | Transmission Mechanism to State Margin |
|---|---|---|---|
| **Healthcare** | `aca` (ACA Subsidies)<br>`pub` (Public Option) | **Uninsured Rate** (`exp.uninsuredRate`) | Lower out-of-pocket costs and increased coverage boost voter sentiment proportionally in states with high uninsured rates (TX 16.6%, OK 13.8%, GA 12.6%, FL 12.1% vs MA 2.4%). |
| **Healthcare** | `drg` (Medicare Drug Negotiations) | **Senior Share (65+)** (`exp.seniorShare`) | Direct savings on Medicare Part D prescriptions provide high financial relief in senior-dense states (FL 21.6%, ME 21.8%, WV 21.0%, VT 20.6% vs UT 11.7%). |
| **Immigration** | `bdr` (Border Enforcement) | **Border Proximity / Salience** (`exp.borderSalience`) | Southern border states (TX, AZ, NM, CA) experience direct community impacts from border resources and security personnel. |
| **Immigration** | `vis` (Skilled & Ag Visas)<br>`reg` (Regularization) | **Immigrant Labor Share** (`exp.immigrantLaborShare`) | High immigrant workforce states (CA 26.5%, NJ 22.8%, NY 22.4%, NV 19.3%, FL 21.1%) benefit economically from legal status regularization and visa workforce stability. |
| **Energy** | `cln` (Clean Energy Credits) | **Clean Energy Resource / Investment** (`exp.cleanEnergyGrowth`) | Production tax credits spur massive localized investment in wind/solar corridor states (IA, KS, OK, TX, NM, NV, CO). |
| **Energy** | `fos` (Federal Permitting & Leasing) | **Fossil Energy Production** (`exp.fossilEnergy`) | Public lands oil, gas, and coal leasing velocity directly drives employment and state royalties in extraction economies (WY 18.2%, NM 15.8%, ND 14.9%, AK 13.8%, TX 9.2%, WV 8.4%). |
| **Energy** | `crb` (Carbon Standards) | **Grid Carbon / Coal Intensity** (`exp.carbonIntensity`) | Heavy industrial and coal-reliant grids (WV, WY, KY, IN, MO, ND) face higher capital compliance costs and consumer utility bill increases. |
| **Education** | `k12` (Title I School Grants) | **Child Poverty / Title I Need** (`exp.childPovertyRate`) | Formula grants allocate federal aid directly to high-poverty school districts (MS 27.2%, LA 26.5%, NM 23.9%, AR 21.8%, AL 21.4%, WV 20.9%). |
| **Education** | `sdr` (Student Debt Relief) | **Student Debt Burden** (`exp.studentDebtShare`) | Monthly payment relief targets young college-educated populations and suburban battlegrounds (GA, DC, NC, VA, PA, MI, OH). |
| **Education** | `prek` (Universal Pre-K) | **Working Young Families** (`exp.youngFamilyShare`) | Childcare subsidies generate enormous household savings in states with high dual-income parental employment (MN, WI, IA, NE, NH, VT, NJ). |

### 3.2 State Exposure Data Schema (`src/data/electoral.ts`)

```typescript
export interface StateDemographicExposure {
  // Existing industry shares (from SAGDP2N)
  readonly farm: number;           // Agricultural share of GDP (0..1)
  readonly manufacturing: number;  // Manufacturing share of GDP (0..1)
  readonly energy: number;         // Fossil extraction share of GDP (0..1)

  // Social & demographic extensions (ACS, BEA, EIA)
  readonly seniorShare: number;       // Population aged 65+ (0..1, nat avg ~0.175)
  readonly uninsuredRate: number;     // Population under 65 uninsured (0..1, nat avg ~0.080)
  readonly borderState: boolean;      // Border adjacency flag (TX, CA, AZ, NM)
  readonly immigrantLaborShare: number;// Foreign-born share of labor force (0..1, nat avg ~0.185)
  readonly cleanEnergyGrowth: number; // Renewable generation potential/growth (0..1, nat avg ~0.150)
  readonly carbonIntensity: number;   // Grid carbon intensity kg CO2/MWh (rel to nat avg 1.0)
  readonly childPovertyRate: number;  // School-age child poverty rate (0..1, nat avg ~0.160)
  readonly studentDebtShare: number;  // Adults aged 20-39 with student loans (0..1, nat avg ~0.200)
  readonly youngFamilyShare: number;  // Households with children under 6 (0..1, nat avg ~0.095)
  readonly rpp: number;               // Regional Price Parity index (nat avg = 100.0)
}
```

---

## 4. State-Level Cost of Living & Demographic Cohort Dynamics

### 4.1 Regional Price Parities & Local Family Relief (SOC-05)
A headline household relief of $50/month does not have the same purchasing power across America:
- In Mississippi or Arkansas (RPP ~87.0), $50/month covers a noticeably larger share of monthly groceries or utilities.
- In California or New York (RPP ~112.0), energy price increases or healthcare premium spikes hit household balance sheets harder in dollar terms.

**Mathematical formulation**:
```typescript
/**
 * Computes state-specific monthly family financial impact ($/month)
 * adjusting national social relief by state exposure and regional price parity.
 */
export function calculateStateFamilyRelief(
  stateCode: string,
  draft?: SocialDraft
): number {
  if (!draft || isSocialBaseline(draft)) return 0;
  const exp = STATE_EXPOSURES[stateCode];
  if (!exp) return 0;

  // Domain-specific monthly household amounts
  const acaRelief = (socialDev(draft, 'aca') / SOCIAL_INDEX_STEP_FINE) * C.acaFamilyRelief * (exp.uninsuredRate / 0.08);
  const drugRelief = (socialDev(draft, 'drg') / SOCIAL_PERCENT_STEP) * C.drugFamilySavings * (exp.seniorShare / 0.175);
  const pubRelief = socialDev(draft, 'pub') * C.publicOptionPremiumRelief * (exp.uninsuredRate / 0.08);
  const visaBenefit = (socialDev(draft, 'vis') / SOCIAL_INDEX_STEP) * C.visaFamilyBenefit * (exp.immigrantLaborShare / 0.185);
  const regBenefit = socialDev(draft, 'reg') * C.regularizationFamilyRelief * (exp.immigrantLaborShare / 0.185);
  const cleanBenefit = (socialDev(draft, 'cln') / SOCIAL_INDEX_STEP) * C.cleanEnergyFamilyRelief * exp.cleanEnergyGrowth;
  const fossilBenefit = (socialDev(draft, 'fos') / SOCIAL_INDEX_STEP) * C.fossilPermittingFamilyRelief * (exp.energy / 0.03);
  const carbonCost = (socialDev(draft, 'crb') / SOCIAL_PERCENT_STEP) * C.carbonStandardCost * exp.carbonIntensity;
  const titleIBenefit = (socialDev(draft, 'k12') / SOCIAL_INDEX_STEP_FINE) * C.titleIFamilyRelief * (exp.childPovertyRate / 0.16);
  const debtRelief = (socialDev(draft, 'sdr') / SOCIAL_PERCENT_STEP) * C.studentDebtMonthlyRelief * (exp.studentDebtShare / 0.20);
  const prekRelief = socialDev(draft, 'prek') * C.universalPreKFamilyRelief * (exp.youngFamilyShare / 0.095);

  const rawRelief = acaRelief + drugRelief + pubRelief + visaBenefit + regBenefit +
                    cleanBenefit + fossilBenefit - carbonCost + titleIBenefit + debtRelief + prekRelief;

  // Adjust purchasing power by Regional Price Parity (RPP)
  const rppFactor = (exp.rpp ?? 100) / 100;
  return Math.round(rawRelief / rppFactor);
}
```

### 4.2 The 6 National Demographic Cohorts
To make voter movement understandable to players without complex spreadsheets (UX-1, UX-7), Phase 10 introduces 6 recognizable civics demographic cohorts:

```typescript
export interface DemographicCohort {
  readonly id: string;
  readonly name: string;
  readonly sharePct: number;       // Share of national electorate
  readonly supportPct: number;     // Current support percentage (15..85)
  readonly supportDelta: number;   // Change from baseline support
  readonly topPositiveDriver?: string;
  readonly topNegativeDriver?: string;
}
```

1. **Seniors (65+)** [20% of electorate]:
   - Positive: Prescription drug negotiation (`drg`), public option/ACA stabilization (`aca`), lower inflation.
   - Negative: High inflation (`inflDev`), cuts to Medicare solvency.
2. **Working-Class & Industrial Workers** [26% of electorate]:
   - Positive: Fossil permitting (`fos`), manufacturing growth, domestic energy production.
   - Negative: Carbon standard compliance costs (`crb`), high tariffs hurting export industries.
3. **Young Families & Parents** [22% of electorate]:
   - Positive: Universal Pre-K (`prek`), Title I K-12 education grants (`k12`), child tax credits.
   - Negative: Consumer price inflation, elevated mortgage/interest rates.
4. **College-Educated & Young Professionals** [24% of electorate]:
   - Positive: Student debt relief (`sdr`), clean energy tax credits (`cln`), skilled worker visas (`vis`).
   - Negative: High fiscal deficits, economic stagnation.
5. **Immigrant & Border Communities** [15% of electorate]:
   - Positive: Legal status regularization (`reg`), legal visa pathways (`vis`), border modernization.
   - Negative: Unlawful border disorder or perceived economic displacement.
6. **Energy & Agriculture Workers** [8% of electorate]:
   - Positive: Fossil leasing velocity (`fos`), clean energy rural lease income (`cln`).
   - Negative: Retaliatory ag tariffs (`tariffDev`), federal drilling moratoriums, punitive carbon standards (`crb`).

### 4.3 Congressional Seat Leaning & Midterm Transmission
In addition to presidential approval, competitive House seats lean based on regional battleground mood:
- In `data/electoral-2024.json`, competitive House districts are concentrated in swing states (PA, MI, WI, AZ, NV, GA, NC) and split delegations (e.g. CA, NY, VA).
- When a president's domestic policy broadens coalitions in battleground states (e.g. delivering family relief and industrial growth), competitive House districts tilt toward the executive's party, softening the midterm penalty (VOT-05).
- Conversely, concentrated regional backlash (e.g. energy shocks in the Rust Belt or ag losses in the Midwest) magnifies battleground House seat losses.
- All seat totals remain strictly conserved at 435 (`HOUSE_SEATS`).

---

## 5. UI/UX Integration (Voters Screen & Explainability)

### 5.1 Updated State Inspector (`src/screens/Voters.svelte`)
When the player clicks any state on the map or table, the sidebar renders:
1. **Headline Metrics**: Electoral Votes, Support %, Trend vs baseline, Tipping-Point badge.
2. **Local Cost-of-Living Card**:
   - `Local Family Impact`: e.g. `+$48 / month` (in green) or `-$12 / month` (in red).
   - Plain-language note: `"Price index: 88.4 (low cost of living boosts purchasing power)"`.
3. **Demographic Salience Tags**:
   - Small pills indicating state characteristics: `Seniors: 21.8%`, `Uninsured: 16.6%`, `Energy Producer: 9.2%`.
4. **Dynamic Attributed Reasons**:
   - Sourced directly from policy deltas:
     - `"Seniors benefit from Medicare drug price caps"`
     - `"Families gain from expanded ACA health subsidies"`
     - `"Utility bills rise under carbon standards"`
     - `"Clean energy investments expand local employment"`
     - `"Parents relieved by tuition-free universal Pre-K"`
     - `"Farm export conditions pinched by tariffs"`

### 5.2 Demographic Coalitions View
In the header switcher of `Voters.svelte`:
```html
<div class="view-switcher" role="radiogroup" aria-label="Electoral View">
  <button class:active={viewMode === 'map'}>Map View</button>
  <button class:active={viewMode === 'table'}>Table View</button>
  <button class:active={viewMode === 'coalitions'}>Coalitions</button>
</div>
```
When `Coalitions` is selected:
- Renders an accessible 6-card grid representing the national demographic cohorts.
- Each card shows:
  - Cohort name and share of national electorate (e.g. `"Seniors (20% of voters)"`).
  - Net support bar with clear indicator of movement (`▲ +3.4 pp`).
  - Primary positive and negative policy drivers in plain language.
- Meets all WCAG AA contrast requirements, full keyboard navigability, and table fallback.

---

## 6. Engine Purity & Guardrails

| Guardrail ID | Area | Hard Requirement | Enforcement Mechanism |
|---|---|---|---|
| **GR-SOC-05** | Purity & Determinism | Zero `Math.*` transcendental functions; arithmetic-only via `detmath.ts`. | AST scanner (`src/engine/purity.test.ts`). |
| **GR-SOC-06** | Coefficient Registration | Every new voter sensitivity coefficient must be registered in `coefficients.ts` with basis, range, unit, and note. | Literal scan (`coefficients.test.ts`). |
| **GR-SOC-07** | Replay Invariance | When social policy is at baseline (`undefined` or default values), all state voter margins must be **bit-for-bit identical** to Phase 6. | Replay & determinism test suites (`determinism.test.ts`). |
| **GR-SOC-08** | Party Fairness Balance | Tipping-point offset must preserve both parties' baseline starting EV at ~270 and maintain reelection parity within <= 5 pp over 300 random seeds (D4, GR-16). | Automated Monte Carlo harness (`voters.test.ts`). |
| **GR-SOC-09** | Bounded State Margins | State support percentage must remain clamped strictly within `[15%, 85%]` and House seats conserved at exactly 435. | Property test invariant checks (`invariants.property.test.ts`). |
| **GR-SOC-10** | Non-Domination Balance | No single social policy lever or combination can guarantee permanent victory across all swing states without fiscal or economic trade-offs. | Balance harness (`balance.test.ts`). |

---

## 7. New Coefficients to Register (`src/engine/coefficients.ts`)

```typescript
// ---- state voter social policy sensitivities (Phase 10, SOC-05) ----
voterAcaSensitivity: {
  value: 0.8, unit: 'pp margin per ACA point per uninsured exposure',
  basis: 'judgement', range: [0.2, 2.0],
  note: 'Responsiveness of high-uninsured state voters to ACA subsidy expansion.',
},
voterDrugPriceSensitivity: {
  value: 1.2, unit: 'pp margin per drug point per senior exposure',
  basis: 'judgement', range: [0.3, 3.0],
  note: 'Electoral support boost from Medicare prescription drug price negotiation in senior-dense states.',
},
voterPublicOptionSensitivity: {
  value: 1.0, unit: 'pp margin per public option in high-uninsured states',
  basis: 'judgement', range: [0.2, 2.5],
  note: 'Voter approval gain from public option coverage availability.',
},
voterBorderSecuritySensitivity: {
  value: 1.5, unit: 'pp margin per border enforcement point in border states',
  basis: 'judgement', range: [0.5, 3.0],
  note: 'Border state electoral responsiveness to border security funding.',
},
voterVisaLaborSensitivity: {
  value: 0.6, unit: 'pp margin per visa quota point in immigrant-dependent economies',
  basis: 'judgement', range: [0.2, 1.8],
  note: 'Economic dividend of high-skilled and agricultural visa quota expansions in tech and farming hubs.',
},
voterRegularizationSensitivity: {
  value: 1.2, unit: 'pp margin per status regularization in high-immigrant states',
  basis: 'judgement', range: [0.3, 2.5],
  note: 'Civic and economic boost from undocumented worker legalization in high-immigrant states.',
},
voterCleanEnergySensitivity: {
  value: 1.0, unit: 'pp margin per clean credit point in renewable resource states',
  basis: 'judgement', range: [0.3, 2.5],
  note: 'Job creation and investment dividend from clean energy tax credits in renewable corridors.',
},
voterFossilPermittingSensitivity: {
  value: 1.4, unit: 'pp margin per leasing point in extraction states',
  basis: 'judgement', range: [0.4, 3.0],
  note: 'Support shift from public lands oil, gas, and mineral permitting velocity in extraction states.',
},
voterCarbonStandardPenalty: {
  value: 1.5, unit: 'pp margin loss per carbon standard point in coal/carbon-heavy grids',
  basis: 'judgement', range: [0.4, 3.5],
  note: 'Backlash against consumer electricity bill increases in carbon-intensive utility states.',
},
voterTitleIEducationSensitivity: {
  value: 0.7, unit: 'pp margin per Title I point in high child poverty states',
  basis: 'judgement', range: [0.2, 2.0],
  note: 'Community support gained from targeted Title I school grants in underfunded districts.',
},
voterStudentDebtSensitivity: {
  value: 1.1, unit: 'pp margin per debt relief point in high student debt states',
  basis: 'judgement', range: [0.3, 2.5],
  note: 'Responsiveness of college-educated suburban voters to federal student debt relief.',
},
voterUniversalPreKSensitivity: {
  value: 1.3, unit: 'pp margin per universal Pre-K in working family states',
  basis: 'judgement', range: [0.4, 3.0],
  note: 'Family gratitude for subsidized childcare and preschool in working parent states.',
},
voterFamilyReliefElasticity: {
  value: 0.05, unit: 'pp margin per $10/mo local family budget relief',
  basis: 'judgement', range: [0.01, 0.15],
  note: 'General kitchen-table purchasing power elasticity on state voter margin.',
},
```

---

## 8. Validation Architecture & Test Strategy

### 8.1 Unit & Contract Tests (`tests/unit/voters.test.ts`)
1. **Baseline Backward Compatibility**:
   - `calculateElectoralCollege(state, 'R')` with baseline/undefined social policy must produce identical vote totals, margin numbers, and tipping point code as pre-Phase-10.
   - Certified 2024 results (Trump 312, Harris 226) must remain exact under `{ unadjusted: true }`.
2. **Domain Transmission Tests**:
   - *Healthcare*: Expanding `aca` and `pub` increases margin in TX and GA by significantly more than in MA or VT. Expanding `drg` moves FL and ME more than UT.
   - *Energy*: Expanding `fos` boosts WY, ND, NM, and AK; enacting `crb` penalizes WV and WY. Expanding `cln` boosts IA, KS, and TX.
   - *Education*: Expanding `sdr` boosts PA, MI, GA, and VA. Universal `prek` boosts MN, WI, and NJ.
   - *Immigration*: Increasing `bdr` produces larger swing in border states (TX, AZ, NM) than in interior states.
3. **Reason Explainability Tests**:
   - Every social policy delta producing an impact > `REASON_IMPACT_THRESHOLD` emits a verified plain-language reason string in `selectedUnit.reasons`.
   - Reasons list never produces empty strings or undefined labels.

### 8.2 Monte Carlo Fairness & Balance Verification
1. **Reelection Parity (GR-16)**:
   - Run 300 random seeds for both parties to turn 16. Party reelection odds difference must remain `<= 5.0 pp`.
2. **Balance Headroom & Non-Domination**:
   - Verify that no extreme social strategy (e.g. maxing all benefits regardless of deficit) produces an automatic electoral landslide without macro economic consequences (inflation, crowding out, bond market stress).

### 8.3 Invariants & Property Tests (`invariants.property.test.ts`)
- Preserves all 538 electoral votes and 435 House seats across 1,000 randomized decision vectors.
- State margins remain finite, bounded, and support percentages strictly between 15% and 85%.

---

## 9. Recommendations for Phase 10 Planning (Wave Decomposition)

Phase 10 should be decomposed into **4 structured plans** executed in sequential dependency waves:

### Plan 10-01: State Demographics & Regional Exposure Dataset (Wave 1)
- **Scope**:
  - Enrich `data/electoral-2024.json` with sourced Census/BEA/EIA state exposure metrics (uninsured rates, senior shares, border proximity, clean/fossil energy shares, carbon intensity, child poverty, student debt, young families, and BEA Regional Price Parities).
  - Update `src/data/electoral.ts` with typed interfaces and accessors.
  - Register all 13 voter social sensitivity coefficients in `src/engine/coefficients.ts` and step units in `src/engine/units.ts`.
  - Add data validation tests confirming 100% coverage across all 50 states + DC + congressional districts.

### Plan 10-02: Pure Engine Dynamics — Regional Transmission & Local Cost of Living (Wave 2)
- **Scope**:
  - Update `calculateElectoralCollege` in `src/engine/voters.ts` to compute domain-specific state policy transmission from `state.socialPolicy`.
  - Implement `calculateStateFamilyRelief(stateCode, draft)` with Regional Price Parity adjustments.
  - Enhance `deriveReasons()` to generate contextual policy attribution reasons for healthcare, immigration, energy, and education.
  - Verify baseline replay invariance and Monte Carlo 300-seed 5 pp party fairness tolerance.

### Plan 10-03: Demographic Cohorts & Congressional Seat Leaning (Wave 3)
- **Scope**:
  - Implement `calculateDemographicCoalitions(state)` returning national support and drivers across the 6 cohorts (Seniors, Working Class, Young Families, College Educated, Immigrant Communities, Energy Workers).
  - Update `src/engine/congress.ts` to connect state battleground coalition movements to competitive House seats and midterm dynamics, conserving total seats at 435.
  - Unit tests covering cohort responses and midterm seat shifts.

### Plan 10-04: UI Implementation & Accessible Voter Breakdown (Wave 4)
- **Scope**:
  - Update `src/screens/Voters.svelte` to integrate the Coalitions view toggle and 6-cohort sentiment display.
  - Enhance the State Inspector sidebar with the Local Family Impact card, demographic salience tags, and policy attribution reasons.
  - Accessibility audit (WCAG AA contrast, keyboard navigation, table alternatives).
  - End-to-end verification and gate checks (`pnpm guard && pnpm check && pnpm test && pnpm determinism`).

---

## RESEARCH COMPLETE
