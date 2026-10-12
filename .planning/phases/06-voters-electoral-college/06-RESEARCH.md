# Phase 06: Voters & Electoral College — Research & Technical Findings

## 1. Domain & Civics Context

### 1.1 Electoral College Structure & District Allocation (VOT-01, VOT-06, GR-13, GR-14)
* **Total Electoral Votes**: 538; needed to win: 270 (23rd Amendment grants 3 EV to the District of Columbia).
* **Allocation Method**:
  - 48 states + DC use statewide winner-take-all.
  - **Maine (4 EV)**: 2 at-large EV to statewide winner; 1 EV to ME-1 district winner; 1 EV to ME-2 district winner.
  - **Nebraska (5 EV)**: 2 at-large EV to statewide winner; 1 EV to NE-1; 1 EV to NE-2; 1 EV to NE-3.
* **2024 Baseline Results**:
  - Certified results: Donald Trump 312 EV, Kamala Harris 226 EV.
  - District results: ME-1 (Harris D +23.0%), ME-2 (Trump R +8.4%), NE-1 (Trump R +10.3%), NE-2 (Harris D +4.4%), NE-3 (Trump R +51.3%).
  - Total units: 51 jurisdictions (50 states + DC) + 5 congressional districts = 56 tracked units with 538 total electoral votes.

### 1.2 Partisan Symmetry & Tipping-Point Centring (D4, VOT-04, GR-16)
* **The Asymmetry Problem**:
  - The 2024 electoral map has a Republican structural tilt: the tipping-point state (Pennsylvania at R +1.73% or Wisconsin at R +0.86%) voted significantly to the right of the national popular vote.
  - If a Democratic player starts with raw 2024 margins, they start with only 226 EV and must overcome a multi-point deficit even at 50% national approval. Opposing partisans perceive this as structural bias (*hostile media effect*, GR-21, GR-23).
* **The Solution (D4)**:
  - Calculate the **tipping-point baseline offset** $M_{\text{tip}}$: when all states/districts are ranked by 2024 margin, find the margin of the unit that delivers the 270th electoral vote.
  - Adjust each unit's baseline margin by $-M_{\text{tip}}$ for the player's chosen party so that at neutral conditions (50% approval, zero economic divergence), the player's party sits at 269–270 EV.
  - **Party Symmetry Standard (GR-16)**: Over 300 random seeds under autopilot, $|P(\text{reelect} \mid \text{Democrat}) - P(\text{reelect} \mid \text{Republican})| \le 5\text{ percentage points}$. The simulation engine remains strictly party-blind.

### 1.3 State Industry Exposures & Causal Attribution (VOT-02, VOT-06)
* Sourced from BEA 2024 gross domestic product by state:
  - `farm`: Agriculture, forestry, fishing share of state GDP (e.g., IA, ND, SD, NE).
  - `manufacturing`: Durable and nondurable manufacturing share (e.g., IN, MI, OH, WI).
  - `energy`: Mining, quarrying, and oil/gas extraction share (e.g., WY, ND, WV, TX, AK).
* Causal drivers for state support:
  - **National Mood**: Linear transmission from national approval change ($\Delta \text{approval}$).
  - **Agricultural Health**: Tariff increases hurt agricultural export states; farm subsidies or trade deals help them.
  - **Industrial Base**: Real GDP growth, output gap, and tariff protection shift manufacturing state sentiment.
  - **Energy Prices & Regulations**: Energy-heavy states react to inflation, regulatory EOs, and fuel costs.
  - **State-Specific Drift**: Keyed RNG draw `normal(seed, 'voters', turn, stateCode)` providing localized idiosyncratic swing.

### 1.4 Midterm Elections & Death Spiral Prevention (D3, VOT-05, GR-18, GR-19)
* **Timing**: Turn 8 (Year 2 Fall) and Turn 24 (Year 6 Fall).
* **Historical Reality**: The incumbent president's party has lost House seats in 19 of 21 midterms since WWII (average loss: ~26 seats; Senate: ~3–4 seats).
* **Feedback Danger**: In a simulation, losing seats makes passing legislation harder, which lowers approval, which causes catastrophic losses in the next cycle (positive feedback destabilization).
* **Bounded Seat Penalty**:
  - House shift: $\Delta \text{seats} = (\text{approval} - 50) \times 1.2 - \text{MidtermPenalty}$.
  - Penalty bounded strictly: Maximum net loss capped at $-35$ seats; maximum gain capped at $+15$ seats.
  - Senate shift: Only the contested class (~33 seats) can flip. Net seat change bounded between $-6$ and $+4$ seats.
  - Guarantees `GR-18` (comeback test: starting from 30% approval at turn 6, sensible play reaches $\ge 42\%$ approval by turn 16 in $\ge 50\%$ of seeds) and `GR-19` (bounded divergence: 90th percentile approval $\le 75\%$).

---

## 2. Technical Architecture & Mathematics

### 2.1 Pure Electoral Calculation (`src/engine/voters.ts`)
* Stateless calculation from `(state: GameState, party: 'democrat' | 'republican')`:
  ```typescript
  export interface StateVoterState {
    code: string;
    name: string;
    electoralVotes: number;
    baselineMargin: number; // player party % minus opposition %
    currentMargin: number;
    supportPct: number; // 0..100
    supportDelta: number; // change from baseline
    leaning: 'safe-you' | 'likely-you' | 'lean-you' | 'tossup' | 'lean-them' | 'likely-them' | 'safe-them';
    winner: 'you' | 'them';
    isSwing: boolean;
    isTippingPoint: boolean;
    reasons: string[]; // plain language causal terms (<= 6 words each)
  }

  export interface ElectoralSummary {
    playerVotes: number;
    opponentVotes: number;
    tossupVotes: number;
    tippingPointState: string;
    swingStates: StateVoterState[];
    states: Record<string, StateVoterState>;
    districts: Record<string, StateVoterState>;
    projectionRange?: { low: number; high: number }; // Year 3+ (turn >= 9)
  }
  ```

### 2.2 Margin & Probability Bands
* Margin categorization:
  - Safe You: $\text{Margin} \ge +10.0$
  - Likely You: $+5.0 \le \text{Margin} < +10.0$
  - Lean You: $+1.5 \le \text{Margin} < +5.0$
  - Tossup: $-1.5 < \text{Margin} < +1.5$
  - Lean Them: $-5.0 < \text{Margin} \le -1.5$
  - Likely Them: $-10.0 < \text{Margin} \le -5.0$
  - Safe Them: $\text{Margin} \le -10.0$

### 2.3 Honest Projection Range (VOT-03)
* For turns $< 9$ (Years 1–2): Show point projection based on current conditions.
* For turns $\ge 9$ (Years 3–4): Display honest uncertainty intervals. Remaining uncertainty $\sigma_{\text{rem}} = \sqrt{(16 - \text{turn}) \times 1.8}$.
* $10\text{th}$ and $90\text{th}$ percentile projection ranges are computed by shifting national margin by $\pm 1.28 \times \sigma_{\text{rem}}$ and re-tallying Electoral College votes.

### 2.4 Midterm Mechanics in `congress.ts` & `game.ts`
* At turn 8 (and turn 24):
  - Calculate net House seat change based on `state.approval`.
  - Rebalance the 5 House ideological blocs (`Progressives`, `Moderates`, `Centrists`, `Conservatives`, `Freedom Caucus`) to reflect new majorities.
  - Emit log entry `{ kind: 'midterm', id: 'midterm_results', amount: netSeatShift }`.

---

## 3. UI & Visual Design Grammar

### 3.1 Design Target Reference (`.design-targets/g-voters.png`)
* **Layout**: Standard `ScreenLayout.svelte`
  - Headline: "Who supports you?"
  - Left / Main area:
    - Interactive SVG US Map with Albers projection.
    - AK and HI insets in bottom-left.
    - District callout chips for ME-1, ME-2, NE-1, NE-2, NE-3, and DC.
    - 270 Electoral College bar across the bottom with a clear center peg for 270 and range whiskers in Year 3+.
  - Right / Sidebar:
    - Selected state inspector card: name, electoral votes, support %, trend, causal reasons.
    - Swing states list / Tipping-point callout.
    - Sortable table toggle for full tabular fallback.
    - Stamp button linking to relevant policy action (e.g. "Adjust tariffs in Budget ->").

### 3.2 Nonpartisan Pattern & Color Encoding (GR-23)
* Strictly player-relative colors:
  - You (Player advantage): `--color-sage` / `--color-sky`
  - Them (Opponent advantage): `--color-alert` / `--color-brick`
  - Tossup: `--color-gold`
* **Pattern Encoding**:
  - Opponent-leaning states receive an SVG diagonal hatch pattern.
  - Tossup states receive a stipple/dot pattern.
  - Player states remain solid with subtle paper texture.
  - Ensures full accessibility under color blindness and WCAG 2.1 AA.

### 3.3 Keyboard Navigation & Viewport Restraints
* Map `<path>` elements have `tabindex="0"`, `role="button"`, `aria-label="State, N electoral votes, Support X%"`, and arrow key / tab navigation.
* Sortable table fallback provides a standard semantic `<table>` with sortable columns for State, EV, Support, Margin, and Lean.
* Everything fits in `100dvh` without document scrolling on $1376 \times 768$ and $1280 \times 720$ viewports (`OBS-07`).
