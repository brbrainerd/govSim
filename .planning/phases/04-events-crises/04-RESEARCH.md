# Phase 4 Research: Events, Crises & Pacing Calibration

**Phase:** 04-events-crises  
**Requirements:** EVT-01, EVT-02, EVT-03, EVT-04, EVT-05, EVT-06, EVT-07, RPT-04  
**Guardrails:** GR-01, GR-02, GR-03, GR-08, GR-09, GR-10, GR-12, GR-38  

---

## 1. Keyed Exogenous Crisis Schedulers (CRN Guarantee)

### 1.1 The Common Random Numbers (CRN) Principle (D2, GR-01, GR-02)
To ensure the comparison against autopilot remains an honest test of skill rather than RNG luck:
- All exogenous events (hurricanes, earthquakes, oil shocks, pandemics, court vacancies) MUST be pre-scheduled using keyed RNG draws independent of player decisions:
  `draw = uniform(seed, 'crisis', turn, crisisKey)`
- Autopilot and player experience the exact same exogenous crisis schedule on the same seed across all turns.
- Endogenous crises (debt crisis, civil unrest, financial panic) are triggered purely by state thresholds (e.g. `debt/gdp > 125%`, `gini > 0.49`, or `approval < 25%`). When an endogenous crisis fires, it displays:
  `"Autopilot didn't face this"` (EVT-03).

### 1.2 Crisis Director Pacing & Calibration (GR-08)
The crisis director enforces realistic narrative pacing over 16 quarterly turns:
1. **Onboarding Grace Period:** Turns 1 and 2 NEVER fire a crisis modal.
2. **First Crisis Arrival:** The first crisis fires on Turn 3, 4, or 5.
3. **Pacing Limits:**
   - At most 1 crisis modal per turn.
   - No 3 consecutive turns may feature a crisis modal.
   - Total crises in a 16-turn term must fall strictly in `[4, 9]` across 100% of seeds.
4. **Distribution:** Every crisis archetype must appear in >= 10% and <= 60% of terms.

---

## 2. Crisis Archetypes & Option Trade-off Matrix (GR-09, GR-12)

Every crisis defines 2 to 3 active options plus 1 status-quo option. Exactly one option is marked `autopilot: true`.

| Crisis ID | Type | Trigger / Season | Option A | Option B | Status Quo / Option C | Autopilot Default |
|---|---|---|---|---|---|---|
| `hurricane` | Exogenous | Summer / Fall (Q3) | Emergency Declaration (10 clout, $15B aid, +approval rally, +health) | Comprehensive Reconstruction (25 clout, $40B aid, +gdp boost, -debt score) | Minimal Federal Role (0 clout, $0, -approval, -trust) | Emergency Declaration |
| `oil_shock` | Exogenous | Global draw (Q1-Q4) | Release Strategic Reserves (15 clout, cools inflation, short-term) | Subsidize Transit & Consumers (20 clout, $20B, protects low-income) | Market Adjustment (0 clout, inflation spikes, trust falls) | Release Strategic Reserves |
| `epidemic` | Exogenous | Winter / Spring (Q1/Q2) | Rapid Public Health Mobilization (25 clout, $25B, saves lives, slight output dip) | Targeted Advisory (10 clout, $5B, moderate spread) | Voluntary Precautions (0 clout, mortality increases, long-term health hit) | Targeted Advisory |
| `scotus_vacancy`| Exogenous | Keyed draw (Turn 5-12) | Nominate Centrist Jurist (10 clout, guaranteed swift confirmation) | Nominate Bold Ideologue (30 clout, rallies base, risks Senate standoff) | Delay Nomination (0 clout, base anger, institutional deadlock) | Nominate Centrist Jurist |
| `debt_standoff`| Endogenous | Debt/GDP > 115% | Bipartisan Commission Deal (20 clout, trims deficit, compromises) | Presidential Veto Threat (15 clout, draws line, market nervous) | Accede to Congressional Demands (0 clout, large spending cuts) | Accede to Demands |
| `civil_unrest` | Endogenous | Inequality Gini > 0.495 or Approval < 28% | Community Investment Package (20 clout, $30B, calms tension, improves trust) | Law Enforcement Surge (15 clout, rapid order, increases polarization) | Call for Calm (0 clout, unrest lingers, economic drag) | Community Investment |

### Non-Domination Verification (GR-09):
- No option Pareto-dominates another: High-clout options deliver superior outcomes in indicators but deplete political capital; low-clout options preserve capital for legislation but suffer public approval or indicator drag.
- Autopilot chooses sensible status-quo responses, keeping `sensible - autopilot` within the `[+2, +10]` score band (GR-12).

---

## 3. Scheduled Modifiers & Delayed Effects

Phase 1 established `Scheduled` effects and the `RESOLVERS` table in `src/engine/modifiers.ts`.
In Phase 4:
- Disasters register temporary relief spending as scheduled modifiers over 2–4 quarters.
- Handling a disaster well grants a temporary rally in approval (`EVT-06`), which decays via a registered resolver over 3 quarters.
- Delayed consequences appear in the Turn Report card as unforeseen effects (`RPT-04`).

---

## 4. Plan Breakdown for Phase 4

- **04-01-PLAN.md (Wave 1):** Crisis Catalog, Keyed Director & Engine State Integration (EVT-01, EVT-03, GR-01, GR-02, GR-08)
- **04-02-PLAN.md (Wave 1):** Crisis Decisions, Clout Costs, Autopilot Choices & GR-09/GR-12 Calibration (EVT-02, GR-09, GR-10, GR-12, GR-38)
- **04-03-PLAN.md (Wave 2):** Crisis Modal Dialog (`CrisisModal.svelte`) & Reporter Art matching `g-crisis.png` (EVT-02, OBS-07)
- **04-04-PLAN.md (Wave 2):** Congress Deadlines, Countdown Indicators & Qualitative Risk Bands (EVT-04, EVT-05)
- **04-05-PLAN.md (Wave 2):** Oval Office Real Events Briefing & Turn Report Unforeseen Effects (EVT-06, EVT-07, RPT-04)
