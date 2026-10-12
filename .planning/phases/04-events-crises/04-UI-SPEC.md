# Phase 4 UI Design Contract: Events, Crises & Deadlines

**Phase:** 04-events-crises  
**Requirements:** EVT-01, EVT-02, EVT-03, EVT-04, EVT-05, EVT-06, EVT-07, RPT-04  
**Design Target:** `.design-targets/g-crisis.png`, `docs/design.md §7d`  

---

## 1. Executive Summary & Design Target Mapping

Phase 4 introduces unexpected events, paced crises, and legislative deadlines that challenge both the player and autopilot under identical random seeds.

The visual target is `.design-targets/g-crisis.png`:
- **Overlay Shell:** An attention-commanding modal dialog anchored with a red "BREAKING" ribbon banner.
- **Left Column (What Happened):**
  - Section label: `"What happened"` (`.label`).
  - Plain headline: e.g. `"Hurricane hits the Gulf Coast"` (`.h`, Arvo font, max 45ch).
  - SVG Visual Scene: A stylized Americana civics scene featuring a news reporter pill-person with microphone in front of a storm/event map (`ReporterScene.svelte`).
  - Learn/Explainer link: `"How it works: disaster aid"` (`.link`, WCAG target).
- **Right Column (What Will You Do?):**
  - Section heading: `"What will you do?"`.
  - 2 to 3 option cards plus an explicit status-quo / "Wait and see" option.
  - Each option card displays the action title, plain-language effect preview, and an inline clout cost badge (e.g. `10 clout`, `20 clout`, or `free`).
  - Exactly one option selected at a time (radio button semantics).
  - Selected card highlighted with solid border and paper tint.
  - Primary button: Red stamp button `"DECIDE"` pinned to the bottom right.
- **Autopilot Distinction (EVT-03):**
  - Player-induced crises (e.g. financial panic or debt standoff) carry a clear banner/badge: `"Autopilot didn't face this"`.
- **Congress Integration (EVT-04):**
  - Shutdown and debt ceiling deadlines telegraph a countdown of at least 2 turns (e.g. `"Shutdown deadline: 2 turns remaining"`).
  - Congress screen displays the resolution vote card.
- **Oval Office Integration (EVT-07):**
  - Dynamic briefing bubble and suggestions in `OvalOffice.svelte` driven by active events, risk bands, and legislative deadlines, permanently removing `src/content/sample.ts`.

---

## 2. Structural Layout & Visual Architecture

### 2.1 Crisis Modal Dialog (`src/ui/CrisisModal.svelte` / `g-crisis.png`)
* **Role & Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="crisis-title"`. Focus trapped within dialog, `Escape` key cancels or dismisses draft, keyboard `Tab` cycles focus cleanly.
* **Dimensions:**
  - Max width: `840px`.
  - Max height: `88dvh` (fits comfortably within `100dvh` at `1376×768` and `1280×720` without document scroll).
  - Padding: `clamp(12px, 1.5vh, 20px) clamp(16px, 2vw, 28px)`.
* **Top Ribbon:**
  - Red ribbon banner (`var(--alert)` with `var(--alert-dark)` fold shadows) centered over the top border: `"BREAKING"`.
* **Two-Column Split Layout:**
  - `grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr)`.
  - Gap: `clamp(14px, 2vw, 24px)`.
  - Left column:
    - Label `"What happened"` in `var(--ink-soft)`.
    - Headline in `var(--font-display)` bold.
    - SVG illustration container with border `2px solid var(--ink)` and rounded corners.
    - Autopilot badge if endogenous: `"Autopilot didn't face this"` in `var(--ink-tint)`.
    - Learn link: `"How it works: ..."` (disabled button / link).
  - Right column:
    - Headline `"What will you do?"`.
    - Vertical list of selectable option cards (`role="radiogroup"`).
    - Each option card:
      - Interactive button / radio card (`role="radio"`, `aria-checked`).
      - Option name: bold `var(--font-display)` or `var(--font-ui)`.
      - Clout badge: pill container with `var(--ink)` background and card text (or `free`).
      - Cost / trade-off preview.
    - Stamp button:
      - Bottom-right aligned: `button.stamp` with text `"DECIDE"`.

### 2.2 Legislative Standoff & Deadline Banners (EVT-04)
* **Location:** Congress screen (`src/screens/Congress.svelte`) and Oval Office summary rail.
* **Countdown indicator:**
  - Warning banner with alert border (`2.5px solid var(--alert)`), alert tint background (`var(--alert-tint)`).
  - Copy: `"Debt ceiling deadline in 2 turns"` or `"Government shutdown in 2 turns"`.
  - Call to action: Directs player to vote on a continuing resolution or clean increase in Congress.

### 2.3 Qualitative Risk Bands (EVT-05)
* **Design Rule:** Strictly qualitative—**no percentages**.
* **Risk States:** `"Low"`, `"Elevated"`, `"High"`.
* **Categories:**
  - `"Hurricane Season: Summer – Fall"`
  - `"Fiscal Stress: Elevated"`
  - `"Global Market Uncertainty: Low"`
* Displayed on Oval Office briefing panel and/or status indicators.

### 2.4 Oval Office Real-Event Wiring (EVT-07)
* Replaces `src/content/sample.ts`:
  - `briefing`: Reactively derived from current turn's active event, deadline, or top economic mover.
  - `thisTurn`: Reflects active crisis or impending congressional deadline.
  - `suggestions`: Generated from current state context (e.g. "Resolve Gulf hurricane", "Address debt limit", "Pass federal budget").

---

## 3. Interaction Flows & State Transitions

1. **Turn Transition:**
   - Player clicks `"Next turn"`.
   - Engine steps.
   - If an exogenous or endogenous crisis triggers on this turn:
     - `session.activeCrisis` is populated.
     - Crisis modal opens immediately or after Turn Report dismissal.
2. **Crisis Drafting (GR-38):**
   - In the modal, player selects an option.
   - Selection is held in `session.draft.crisisChoice`.
   - Clicking `"DECIDE"` records the draft choice and closes the modal.
   - The choice applies at the subsequent `nextTurn()` call as part of `Decisions`, ensuring all actions are deterministic drafts.
3. **Autopilot Execution:**
   - Autopilot automatically selects the designated `autopilot: true` option for each crisis (e.g. status-quo emergency declaration or automatic stabilizers).

---

## 4. Typography, Tokens, and Viewport Fit

* **Tokens Exclusivity:** All colors and spacing must draw from `src/design/tokens.ts` (enforced by test).
* **Viewport Boundaries:**
  - Modal and screen must fit within `100dvh` without document scrolling at `1376×768` and `1280×720`.
  - Modal contents scroll internally (`overflow-y: auto`) if needed.
* **Prose Limits:** Max line length bounded to `65ch` for readability.

---

## 5. Accessibility & Verification Contract (OBS-07)

* **Axe-core Audit:** Zero violations (`critical` or `serious`) across:
  - `CrisisModal.svelte` with radio option group and primary action button.
  - Congress screen with active deadline banner.
  - Oval Office with dynamic real-event briefing.
* **Keyboard Navigation:**
  - Crisis modal traps focus; arrow keys or Tab navigate between option cards; Space/Enter selects; `Escape` closes or keeps current selection.
* **Reduced Motion:** SVG animations respect `prefers-reduced-motion: reduce`.
