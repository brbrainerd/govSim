# Phase 9: Domestic Social Policy Levers — Research & Technical Specification

**Phase:** 09
**Milestone:** v0.3 (Social Policy & Domestic Reform)
**Scope:** Healthcare, Immigration, Energy/Climate, and Education policy models (SOC-01, SOC-02, SOC-03, SOC-04).

---

## 1. Domain & Empirical Foundations

Phase 9 introduces 4 key domestic policy domains into the simulation engine. In keeping with `govSim` core tenets, each domain is represented by:
1. Pure mathematical levers (bounded slider or stepped levels).
2. Explicit trade-offs (every policy has upside benefits and downside fiscal or market costs).
3. Plain-language labels and definitions (UX-1).
4. Sourced empirical basis or explicit `judgement` tags in `coefficients.ts`.

### 1.1 Domain Specifications

#### A. Healthcare Policy (SOC-01)
* **Mechanisms:**
  * **ACA Subsidy Level:** Expands subsidized health insurance coverage. Reduces uninsured rate; increases federal outlays; lowers family health spending burden.
  * **Medicare Drug Price Negotiation:** Lowers federal Medicare Part D/B outlays and retail prescription costs; modest reduction in pharma R&D capital intensity.
  * **Public Option:** Government-sponsored coverage choice competing on insurance exchanges; lowers average premium costs, increases enrollment, modest crowd-out of private insurer margins.
* **Key Indicators Impacted:** `lifeExp`, `realIncome` (via lower out-of-pocket medical costs), federal deficit, `approval`.
* **Empirical References:** CBO (Estimating the Effects of the Affordable Care Act and Drug Negotiation Provisions of the IRA 2022); KFF Health Tracking.

#### B. Immigration Policy (SOC-02)
* **Mechanisms:**
  * **Border Security & Enforcement:** Direct federal spending on border personnel and infrastructure; decreases unauthorized inflows.
  * **Legal Employment & Skilled Visas (H-1B, EB caps):** Expands labor force in technical, agricultural, and healthcare sectors; bolsters potential output growth (`potentialGrowth`) and payroll tax collections.
  * **Legalization & Status Regularization:** Grants legal work authorization to undocumented workers; expands formal labor supply, raises taxable wages, increases safety net eligibility over a 10-year horizon.
* **Key Indicators Impacted:** `empPop`, `potential` growth, wage inflation pressure, tax receipts, `trust`.
* **Empirical References:** CBO (The Budgetary and Economic Effects of Immigration Policies, 2024); BLS Foreign-born Labor Force Analysis.

#### C. Energy & Climate Policy (SOC-03)
* **Mechanisms:**
  * **Clean Energy Tax Credits:** Subsidies for renewables, storage, and nuclear generation; increases clean energy share; increases 10-yr deficit.
  * **Federal Fossil Leasing & Permitting:** Public lands oil/gas leasing royalty rate and permit approval velocity; raises federal royalty revenues and domestic energy supply, lowering short-term energy CPI; increases emissions trajectory.
  * **Carbon Standards / Clean Electricity Benchmark:** Regulatory emission caps on utilities and industrial facilities; reduces emissions; short-term capital expenditure cost passed through to consumer utility rates.
* **Key Indicators Impacted:** `inflation` (via energy CPI pass-through), `gdp`, emissions index, `realIncome`.
* **Empirical References:** NBER WP 31826 (Macroeconomic Effects of the Clean Energy Transition); EIA Annual Energy Outlook 2026.

#### D. Education Policy (SOC-04)
* **Mechanisms:**
  * **Title I Federal K-12 Grants:** Targeted funding for low-income school districts; raises long-run human capital and labor productivity over 10-year horizon; increases discretionary spending outlays.
  * **Income-Driven Student Loan Relief:** Reduces debt service payments for low-to-middle income graduates; increases disposable income in the short run; increases federal net debt.
  * **Universal Pre-K Grants:** Federal matching grants to states for early childhood education; increases maternal/parental labor force participation (`empPop`) and long-term child cognitive outcomes.
* **Key Indicators Impacted:** `realIncome`, `empPop`, `potential`, `debtPct`, `gini`.
* **Empirical References:** Chetty et al. (Kindergarten Classroom Quality and Adult Outcomes, QJE); Brookings (Economic Impacts of Early Childhood Education).

---

## 2. Architectural Design & Integration

### 2.1 Pure Engine Separation
* Following Phase 1 rules, all new logic lives in pure, stateless TypeScript functions under `src/engine/social.ts`.
* No non-deterministic standard math calls (`Math.random`, `Math.exp`, etc.). Pure calculations rely on `detmath.ts` (`clamp`, `tanhPade`).
* Every coefficient is registered in `src/engine/coefficients.ts` with valid ranges, units, and citation or judgement tags.

### 2.2 Legislative & Decision Integration
* In `src/engine/decisions.ts`, `Bill` expands to include optional social policy packages or standalone policy packages:
  ```typescript
  export interface SocialDraft {
    acaSubsidy?: number;
    drugNegotiation?: number;
    publicOption?: boolean;
    borderFunding?: number;
    visaCaps?: number;
    regularization?: boolean;
    cleanEnergyCredits?: number;
    fossilPermitting?: number;
    carbonStandard?: number;
    titleIFunding?: number;
    studentDebtRelief?: number;
    universalPreK?: boolean;
  }
  ```
* Sanitization via pure `sanitizeSocial(draft)` guarantees that hand-edited saves or untrusted inputs cannot crash the engine or corrupt state.
* Congressional voting blocs (`src/engine/congress.ts`) evaluate social policy reforms against ideological preferences.

### 2.3 Ledger Conservation & Attribution Tracing
* All deltas produced by social policies fold cleanly into `trace.ts` with explicit source ids:
  * `social:aca`
  * `social:pharma`
  * `social:visas`
  * `social:energy`
  * `social:education`
* `src/content/text/why.ts` includes plain-language copy for every emitted trace source id, verified by automated unit tests.

---

## 3. Pitfalls & Guardrails

| ID | Risk | Mitigation |
|---|---|---|
| **GR-SOC-01** | Unbalanced Dominant Strategy | Balance harness tests verify that no single social policy choice dominates all outcomes. |
| **GR-SOC-02** | Non-Deterministic Calculations | All math uses pure arithmetic; zero transcendental standard library calls. |
| **GR-SOC-03** | Partisan Language Bias | Descriptions strictly adhere to neutral civics guidelines; critique incentives, not parties. |
| **GR-SOC-04** | Save Format Backward Compatibility | Save format `v: 1` parses optional `social` fields safely with fallback to baseline defaults. |
