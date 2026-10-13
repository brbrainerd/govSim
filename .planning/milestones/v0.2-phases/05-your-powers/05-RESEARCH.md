# Phase 05: Your Powers — Research & Technical Findings

## 1. Domain & Civics Context

### 1.1 Executive Orders & Court Review
* **Constitutional Basis**: Article II, Section 1 (Executive power) and Section 3 (Take Care Clause).
* **Statutory Authority**: Modern executive orders rely on delegated statutory authority (e.g., Trade Expansion Act § 232, Defense Production Act, Federal Property and Administrative Services Act).
* **Judicial Review (2025–2026 Precedents)**:
  - The Supreme Court's 6–3 conservative majority strictly enforces the **Major Questions Doctrine** (*West Virginia v. EPA*, *Biden v. Nebraska*), requiring clear congressional authorization for regulations of major economic significance.
  - In *United States v. Texas* and recent procedural rulings, the Court has limited universal nationwide injunctions by single district judges, meaning challenges escalate predictably to circuit courts and the Supreme Court over 1–3 quarters.
  - Challenges are filed by state attorneys general and commercial plaintiffs based on ideological alignment and regulatory burden.

### 1.2 The Federal Reserve & Credibility
* **Institutional Independence**: The Fed operates under the Federal Reserve Act with a statutory Dual Mandate (maximum employment and price stability).
* **Chair Term**: 4-year term, subject to Senate confirmation (51 votes).
* **Executive Pressure Consequences**: When presidents publicly pressure the Fed for lower rates, bond markets price in political interference, raising long-term inflation expectations ($\pi^e$) and reducing monetary policy credibility (*Barro-Gordon model*).

### 1.3 Bully Pulpit & Diminishing Returns
* Theodore Roosevelt coined the "bully pulpit" as an executive agenda-setting power.
* Political science research (*Edwards, "On Deaf Ears"*) demonstrates that presidential speeches have sharply diminishing returns: repeated public addresses saturate media attention, polarize audiences, and yield diminishing persuasion.

### 1.4 Civics Myth Cards (GR-20, GR-21, Pitfall 17)
* Civics payload focuses strictly on **institutional mechanics** (who controls what), never on moral or political values.
* 5 balanced topics:
  1. *Gas Prices*: Global crude markets, refinery crack spreads, state fuel taxes vs presidential control. (Challenges Right/Opponents).
  2. *Interest Rates*: Central bank independence, FOMC voting, Taylor rule vs White House control. (Neutral/Both).
  3. *Job Creation*: Macro cycle, demographics, Fed policy vs White House job creation claims. (Neutral/Both).
  4. *Rule by Decree*: Article II statutory limits, non-appropriation, judicial invalidation. (Challenges Left).
  5. *Foreign Aid & the Deficit*: Foreign assistance is < 1% of federal budget vs mandatory outlays. (Challenges Right).
* Balance verification: `|count(challenges=left) - count(challenges=right)| <= 1`.

---

## 2. Technical Architecture & Engine Integration

### 2.1 Executive Orders Catalog (`src/content/orders.ts`)
* 10 curated orders with:
  - `id`: Unique identifier (e.g., `eo_hiring_freeze`, `eo_tariff_review`).
  - `name`: Plain language title.
  - `description`: Plain language explanation of mechanics.
  - `legalBasis`: Cited federal statute or constitutional provision.
  - `cloutCost`: Clout required to issue (10–30 clout).
  - `courtRisk`: Qualitative risk band (`Low`, `Moderate`, `High`).
  - `riskProbability`: Deterministic baseline probability of legal challenge (0.10 to 0.60).
  - `effects`: Modifier channels (`gdp`, `inflation`, `debtBn`, `trust`, `approval`, etc.).
  - `citation`: Authoritative legal or governmental source URL/record.

### 2.2 Judicial Review Mechanics (PWR-02)
* When an EO is signed, a keyed draw `normal(seed, 'court', turn, orderId)` determines if an emergency challenge is filed.
* If challenged, a `Scheduled` event `court_ruling` is queued for `turn + 2` (1–3 quarters later).
* The 6–3 Court evaluates the statutory basis:
  - **Upheld**: The order remains active; public institutional trust gains $+1\%$.
  - **Struck Down**: The order is invalidated; the modifier is removed immediately; player loses $-5$ clout and public approval is penalized.
* **Legacy Exclusion (D5)**: Handled automatically by `activeAt(modifiers, turn, legacy)` which drops all modifiers with `tag === 'eo'`.

### 2.3 Fed Appointment & Pressure Mechanics (PWR-03)
* If the Fed Chair term lapses, the player nominates:
  - **Hawk**: Raises inflation fighting sensitivity ($+0.25$ on Taylor inflation gap), moderating prices at the expense of growth.
  - **Centrist**: Standard balanced Taylor rule coefficients.
  - **Dove**: Prioritizes employment ($+0.25$ on output gap, $-0.25$ on inflation), running the economy warmer.
* Senate confirmation threshold: requires 51 Senate votes. Centrist passes with bipartisan consensus; Hawk/Dove require party support or clout expenditure.
* **Pressuring the Fed**: Player can spend 15 clout to pressure the Fed. Triggers $-0.25\%$ short-term rate cut from political pressure, but adds `fed:credibility` trace term increasing inflation expectations by $+0.2\%$, making inflation stickier.

### 2.4 Bully Pulpit & Clout Cap (PWR-05, PWR-07)
* `giveSpeech(audience)`:
  - Audiences: `general` (+approval), `congress` (+vote momentum), `business` (+trust/investment).
  - Diminishing returns: Tracked by `speechCountInWindow` in state, dividing returns by $(1 + 0.5 \times count)$ and increasing clout costs.
* `cloutCap`: Hard cap on clout at 200 (defined in `coefficients.ts`), verified in balance tests to defeat hoarding strategies (`GR-10`, `GR-11`).

### 2.5 Myth Cards State & Rewards (PWR-06, Pitfall 17)
* `GameState.viewedMyths: readonly string[]` records card IDs opened by the player.
* On first view: awards $+5$ clout exactly once per game. Survives saving and reloading.

---

## 3. Work Breakdown & Plan Waves

* **Plan 05-01 (Engine & Content Foundations)**:
  - Create `src/content/orders.ts` (10 cited EOs, legal bases, risk ratings).
  - Create `src/content/myths.ts` (5 spectrum-balanced myth cards with EIA, CRS, CBO citations).
  - Add `cloutCap` to `coefficients.ts`.
  - Update `Decisions` and `GameState` for active EOs, pending court challenges, and `viewedMyths`.
* **Plan 05-02 (Court Review, Fed Appointments & Bully Pulpit)**:
  - Keyed judicial review resolver (`court_ruling`) in `src/engine/modifiers.ts`.
  - Fed chair nomination and Fed pressure mechanics in `src/engine/game.ts`.
  - Bully pulpit speech resolution with diminishing returns.
  - Balance tests proving speech-spam and clout-hoarding do not dominate.
* **Plan 05-03 (Your Powers Screen UI)**:
  - Build `src/screens/Powers.svelte` matching `g-powers.png`.
  - Executive orders selectable grid with clout pills and court risk badges.
  - Bottom institutional bar: Fed independent portrait and 6–3 Supreme Court bench.
  - Next step sidebar: "What it means", "Give a speech", "Pressure the Fed", and "SIGN ORDER" / "REVOKE ORDER" stamp button.
* **Plan 05-04 (Myth Card Modal UI & Ancillary Dialogs)**:
  - Build `src/ui/MythModal.svelte` matching `g-myth.png` (Myth vs Reality, flowchart, character scene, real levers, "GOT IT" stamp button).
  - Build `src/ui/SpeechModal.svelte` and `src/ui/FedModal.svelte`.
  - Wire ticket button in Learn strip to `MythModal`.
* **Plan 05-05 (E2E Audits, Readability & Phase Verification)**:
  - Axe-core accessibility audit (0 violations on Your Powers and Myth Modal).
  - Viewport verification at 1376x768 and 1280x720 with Playwright screenshots.
  - Content gate validation: reading grade <= 9.0, sentences <= 20 words, nonpartisan check (GR-20, GR-21).
