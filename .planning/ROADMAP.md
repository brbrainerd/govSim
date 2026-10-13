# Roadmap: govSim

## Milestones

- ✅ **v0.2 Playable First Term** — Phases 1-8 (shipped 2026-10-12)
- 🚧 **v0.3 Social Policy & Domestic Reform** — Phases 9-12 (in progress)

## Phases

<details>
<summary>✅ v0.2 Playable First Term (Phases 1-8) — SHIPPED 2026-10-12</summary>

- [x] Phase 1: Engine foundations (7/7 plans) — completed 2026-10-12
- [x] Phase 2: Saves, guardrails & continuous deploy (6/6 plans) — completed 2026-10-12
- [x] Phase 3: Turn report & Economy (5/5 plans) — completed 2026-10-12
- [x] Phase 4: Events & crises (5/5 plans) — completed 2026-10-12
- [x] Phase 5: Your Powers (5/5 plans) — completed 2026-10-12
- [x] Phase 6: Voters & Electoral College (4/4 plans) — completed 2026-10-12
- [x] Phase 7: Election & end of term (4/4 plans) — completed 2026-10-12
- [x] Phase 8: Balance, hardening & release (4/4 plans) — completed 2026-10-12

</details>

### Milestone v0.3: Social Policy & Domestic Reform

- [x] **Phase 9: Domestic Social Policy Levers** - Healthcare, immigration, energy/climate, and education models, pure engine levers, cited coefficients, causal traces (SOC-01, SOC-02, SOC-03, SOC-04) — completed 2026-10-12
- [x] **Phase 10: Demographic & Regional Distribution** - Sector exposure, state-level cost-of-living impacts, and voter coalition shifts (SOC-05) — completed 2026-10-12
- [x] **Phase 11: Structural Government Reform & Amendments** - Senate filibuster reforms, judicial reform, electoral rules, and constitutional amendment hurdles (REF-01, REF-02, REF-03, REF-04) — completed 2026-10-12
- [x] **Phase 12: Household Impact Card & Balance** - "Your Household" card on Oval Office and Economy screens, persona presets, custom builder, balance calibration pass, and E2E verification (HOU-01, HOU-02) — completed 2026-10-12

## Phase Details

### Phase 9: Domestic Social Policy Levers

**Goal**: Implement pure deterministic engine mechanics, cited coefficient tables, and legislative options for healthcare, immigration, energy/climate, and education policies.
**Depends on**: Milestone v0.2 foundations.
**Requirements**: SOC-01, SOC-02, SOC-03, SOC-04
**Success Criteria**:
  1. Engine supports social policy levers across healthcare (ACA subsidies, prescription drug pricing), immigration (border security, worker visa quotas), energy (clean tax credits, leasing permits), and education (Title I grants, student loan relief).
  2. Each social policy lever has registered coefficients in `coefficients.ts` with valid ranges, units, and citation tags.
  3. Indicator deltas from social policy bills are tracked in `trace.ts` with explicit causal terms and zero unallocated residual leakage.
  4. Unit and property tests prove mathematical determinism and conservation invariance across 500 randomized runs.

**Plans**: 4 plans

Plans:
- [x] 09-01-PLAN.md — Wave 1: Pure Social Levers, Catalog, and Registered Coefficients (SOC-01..04)
- [x] 09-02-PLAN.md — Wave 2: Step() Simulation Dynamics, Ledger Attribution, and Invariants (SOC-01..04)
- [x] 09-03-PLAN.md — Wave 3: Congressional Voting Blocs, Decisions, and Session Drafting (SOC-01..04)
- [x] 09-04-PLAN.md — Wave 4: Plain-Language Attribution, Balance Calibration, and Verification Suite (SOC-01..04)

### Phase 10: Demographic & Regional Distribution

**Goal**: Connect domestic social policy decisions to state economies, demographic cohorts, cost of living, and voter sentiment.
**Depends on**: Phase 9
**Requirements**: SOC-05
**Success Criteria**:
  1. Policy impacts flow to state-level metrics (e.g. energy policy affects energy-producing states like TX/ND/WV differently than consumer states).
  2. Voters screen reflects demographic coalition movement based on active social policy laws.
  3. Interactive breakdowns explain why each state shifted.

**Plans**: 4 plans

Plans:
- [x] 10-01-PLAN.md — Wave 1: State Demographic & Regional Exposure Dataset (SOC-05)
- [x] 10-02-PLAN.md — Wave 2: Pure Engine Dynamics — Regional Transmission & Local Cost of Living (SOC-05)
- [x] 10-03-PLAN.md — Wave 3: Demographic Cohorts & Congressional Delegation Shifts (SOC-05)
- [x] 10-04-PLAN.md — Wave 4: UI Implementation & Accessible Voter Breakdown (SOC-05)

### Phase 11: Structural Government Reform & Amendments

**Goal**: Allow players to pursue high-leverage institutional and constitutional reforms with realistic political friction and high procedural hurdles.
**Depends on**: Phase 9
**Requirements**: REF-01, REF-02, REF-03, REF-04
**Success Criteria**:
  1. Senate filibuster rule options (60-vote threshold, talking filibuster, 55-vote threshold, simple majority) alter bill passage mechanics.
  2. Judicial reforms (18-year term limits, ethics codes) face legal challenges and confirmation political friction.
  3. Constitutional amendment system simulates the 2/3 Congressional and 3/4 state legislature ratification hurdles.

**Plans**: 4 plans

Plans:
- [x] 11-01-PLAN.md — Wave 1: Pure Engine Dynamics, Senate Filibuster & Coefficients (REF-01)
- [x] 11-02-PLAN.md — Wave 2: Judicial & Electoral Reform Engines (REF-02, REF-03)
- [x] 11-03-PLAN.md — Wave 3: Constitutional Amendment Engine & State Ratification (REF-04)
- [x] 11-04-PLAN.md — Wave 4: UI Implementation, Modals, Accessibility & E2E Validation (REF-01..04)

### Phase 12: Household Impact Card & Balance

**Goal**: Ground abstract macro policies in relatable kitchen-table economics through the "Your Household" card and calibrate overall game balance.
**Depends on**: Phase 10, Phase 11
**Requirements**: HOU-01, HOU-02
**Success Criteria**:
  1. Accessible "Your Household" card renders in Oval Office and Economy screens showing monthly household budget deltas.
  2. Players can select preset household personas or customize state, income, and family size.
  3. Balance harness verifies sensible bot non-domination and realistic prosperity scoring across 100 seeds.
  4. 0 axe violations, 0 viewport scroll regressions at 1376×768 and 1280×720 viewports.

**Plans**: 4 plans

Plans:
- [x] 12-01-PLAN.md — Wave 1: Pure Household Engine, Constants, RPP Indexing & Presets (HOU-01, HOU-02)
- [x] 12-02-PLAN.md — Wave 2: Household Card, Modal & Economy Breakdown Views (HOU-01, HOU-02)
- [x] 12-03-PLAN.md — Wave 3: Balance Calibration & Party Neutrality Suite (HOU-01, HOU-02)
- [x] 12-04-PLAN.md — Wave 4: Playwright E2E, Accessibility & Viewport Audits (HOU-01, HOU-02, OBS-07)
