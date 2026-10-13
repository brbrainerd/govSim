# Phase 07 — UI Specification: Election & End of Term

## 1. Design Targets & Visual References

This specification establishes the visual, layout, and interaction contracts for **Phase 7: Election & end of term**, delivering:
* **Election Night Reveal Overlay** (`src/ui/ElectionNightModal.svelte`): An animated, skippable election-night tally overlay over the map when completing Turn 16.
* **Why-You-Won / Lost Result Card** (`src/ui/ElectionResultCard.svelte`): A trace-attributed analysis card with a "Retry Turn 16" action.
* **Contingent Election Roll-Call Modal** (`src/ui/ContingentElectionModal.svelte`): 12th Amendment House vote breakdown for 269-269 ties.
* **End Screen** (`src/screens/EndScreen.svelte`): The definitive end-of-presidency review screen adhering strictly to the 4-part layout grammar (`design.md §7d`).

---

## 2. Layout Grammar & Screen Anatomy

### 2.1 Election Night Modal (`ElectionNightModal.svelte`)
* **Role**: Two-phase dramatic sequence launched automatically when Turn 16 resolves.
* **Split Layout**:
  - **Left Section (Live Board)**:
    - Breaking Broadcast Ribbon: `"DECISION NIGHT · ELECTORAL COLLEGE"`
    - Live 270 Bar: Real-time progress bar expanding towards 270 as states are called.
    - Animated State Call Ticker: Fast sequential list of state calls with EV counts (Safe states batch first, then swing battlegrounds call one by one).
    - Skip Button: `"Skip to Final Result [Space]"`. Under `prefers-reduced-motion`, all animations resolve immediately in `< 100ms`.
  - **Right Section (Decision Summary)**:
    - Milestone Call: `"PROJECTED WINNER: YOU"` or `"PROJECTED WINNER: OPPONENT"`.
    - EV Comparison Pill: `"You: 287 EV · Opponent: 251 EV"`.
    - Autopilot Side-by-Side: `"Autopilot (Doing Nothing): 242 EV (Lost)"`.
    - Primary Button:
      - If Won: `"Continue to Second Term →"` (or `"Review Results"`).
      - If Lost: `"View Presidential Legacy →"`.
    - Retry Action: `"Retry Turn 16"` button.

### 2.2 Contingent Election Modal (`ContingentElectionModal.svelte`)
* **Trigger**: 269–269 Electoral College tie (`GR-15`).
* **Visual**:
  - Banner: `"CONSTITUTIONAL CRISIS: 269–269 TIE"`.
  - Subhead: `"12th Amendment: The House decides, voting by state delegation (26 of 50 to win; DC excluded)"`.
  - Delegation Roll Call: Interactive 50-state delegation list showing House seats by party (e.g., `PA: 10 D, 7 R → D`, `TX: 12 D, 26 R → R`).
  - Tally Tracker: `You: X states · Opponent: Y states (26 to win)`.

### 2.3 End Screen (`EndScreen.svelte`)
Adheres to the standard 4-part layout grammar (`design.md §7d`):

1. **Zone 1: Status (Top Bar)**:
   - Identical top bar: Displays final Approval, Clout, Headline Score (`+X.X better than doing nothing`), and Term Summary (`"4 Years Completed"` or `"8 Years Completed"`).
2. **Zone 2: Where (Left Navigation)**:
   - Summary selector tabs: `Overview`, `Economic Record`, `Legislative Acts`, `Voter Coalition`.
3. **Zone 3: What (Main Area)**:
   - Plain Question Headline: `"What is your lasting legacy?"`
   - **10-Year Legacy Trajectory Chart**:
     - 40-quarter projection forward beyond exit term with automatic stabilizers active and policies held constant.
     - Comparative trajectories: Player (Sage/Navy) vs Doing Nothing (Dotted Gold).
     - Indicator selector: GDP Growth, Debt / GDP, Unemployment, Inflation.
     - Zero-based axes with table fallback (`<table>`).
4. **Zone 4: Next Step (Right Rail)**:
   - **Historian Verdict Card**:
     - Nonpartisan verdict badge: One of 5 tiers (*Transformational*, *Steward of Stability*, *Mixed Legacy*, *Presidency of Unresolved Crises*, *Institutional Breakdown*).
     - Outcome explanation citing specific economic and societal indicators.
   - **Primary Action Buttons**:
     - Primary Red Stamp: `"START NEW PRESIDENCY"` (clears session and returns to New Game).
     - Secondary Action: `"RETRY FROM TURN 16"` (if entered from turn 16 defeat).
     - Tertiary Action: `"EXPORT RECORD (JSON)"`.

---

## 3. Design Tokens & Styling Rules

* **Tokens**: Strictly use CSS custom properties defined in `src/design/tokens.ts`:
  - Surfaces: `var(--paper)` (`#FAF6EE`), `var(--card)` (`#FFF8EA`), `var(--card-alt)` (`#F3ECE0`).
  - Text & Inks: `var(--ink)` (`#1F2F55`), `var(--ink-soft)` (`#506080`).
  - Accent colors: `var(--alert)` (`#C0392B`), `var(--sage)` (`#2E7D5B`), `var(--sky)` (`#3B7EA1`), `var(--gold)` (`#D9A23B`).
* **Zero Literals**: No hex color codes or `rgba(...)` in components outside `tokens.ts`.
* **Contrast Compliance**:
  - Text on `--card` must use `var(--ink)` (> 11:1) or `var(--ink-soft)` (> 5.5:1).
  - Badges with colored backgrounds must pair with high-contrast text.

---

## 4. Accessibility & Viewport Contracts

* **Viewport Restraints (`OBS-07`)**:
  - Zero outer document scroll on standard 1376×768 and 1280×720 viewports.
  - Modals and charts fit within the viewport using flexbox overflow containment (`min-height: 0`, `overflow-y: auto` within internal sub-containers).
* **Keyboard Navigation**:
  - All interactive elements are fully focusable with clear focus rings (`outline: 2px solid var(--ink)`).
  - Space/Enter triggers state advancement and modal dismissal.
* **Reduced Motion**:
  - Honor `prefers-reduced-motion`: disable state call timers, instantly display final tallies, and render static charts without transition delays.
