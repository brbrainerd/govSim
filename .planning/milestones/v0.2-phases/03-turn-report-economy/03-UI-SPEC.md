# UI Design Contract: Phase 3 — Turn Report & Economy

**Phase:** 03-turn-report-economy  
**Status:** Ready to Plan  
**Related Requirements:** RPT-01, RPT-02, ECO-01, ECO-02  
**Design Targets:** `.design-targets/g-report.png`, `.design-targets/g-economy.png`, `.design-targets/uikit.png`

---

## 1. Scope of UI in Phase 3

Phase 3 introduces the post-turn feedback loop and macro-observability:
1. **Turn Report Overlay:** Displays automatically on quarter transition (`Session.nextTurn`), presenting the 8 core indicators plus approval and clout with their top causal attribution derived purely from the engine trace, a luck explanation line, and comparison against doing nothing (`g-report.png`).
2. **Economy Screen:** Implements the "See" tab for Economy (`screens.ts`), showing a 2×2 grid of charts (Growth, Jobs, Prices, Debt) comparing player trajectory against autopilot ("Doing nothing"), with accessible table fallbacks, a Fed Taylor-rule explanation card, a "Why it's happening" trace term breakdown, and navigation to the Budget screen (`g-economy.png`).
3. **Headline Score Unification:** Unifies the top status bar score with the end-screen formula using the projected final score (`finalScore(player) − finalScore(autopilot)`), displaying the "Now" and "In 10 years" breakdown directly underneath (D11, GR-04).

All visual components strictly follow the Americana civics poster grammar (design.md §7d, tokens.ts):
- Cream cardstock (`--paper` / `--card`), halftone background pattern (`.halftone`).
- Navy ink typography (`--ink`, `--ink-soft`), double-rule borders, flat offset shadows.
- Arvo slab headlines, Barlow Condensed uppercase labels/buttons, Atkinson Hyperlegible body text.
- Red stamp button (`--alert`) for modal confirmation / screen commits; navy link buttons for cross-screen navigation.

---

## 2. Component Specifications

### 2.1 Generic Overlay Shell (`src/ui/Overlay.svelte`)
- **Role:** Reusable modal shell for Turn Report, Crisis, and Election Night overlays.
- **Accessibility:**
  - `role="dialog"` and `aria-modal="true"`.
  - Accessible label tied via `aria-labelledby`.
  - Traps keyboard focus (`Tab` / `Shift+Tab`) within the dialog.
  - Dismisses on `Escape` key press (WCAG 2.1 SC 1.4.13, 2.1.2) and backdrop click.
  - Restores focus to the triggering element upon closure.
- **Layout:**
  - Centered over `100dvh` viewport with semi-transparent navy backdrop (`rgba(20, 27, 45, 0.6)`).
  - Max dimensions: `clamp(700px, 85vw, 1100px)` width, `clamp(450px, 85vh, 680px)` height.
  - Double-rule border (`border: 3px double var(--ink)`), offset shadow (`box-shadow: var(--shadow)`), rounded corners (`border-radius: var(--r-md)`).

### 2.2 Turn Report Card (`src/ui/TurnReport.svelte` / `g-report.png`)
- **Trigger:** Rendered inside `Overlay.svelte` immediately after a turn advances (`state.turn > 1`), or when re-opened from the Status Bar.
- **Header:**
  - Gold ribbon (`Ribbon.svelte` variant or CSS banner) displaying:
    `"{SEASON} {YEAR} REPORT"` (e.g. `"SPRING 2027 REPORT"`).
- **Left Column (Indicators Attribution Table):**
  - Displays 10 rows: 8 prosperity indicators + Voter Support (Approval) + Clout.
  - Each row contains:
    1. Indicator name (Plain language, e.g. "Typical Family Income", "People Working", "Inflation Rate", "National Debt", "Voter Support").
    2. Current value formatted with exact unit (e.g. `"$78,200"`, `"61.2%"`, `"2.4%"`, `"102%"`).
    3. Arrow badge with text: `"up"`, `"down"`, or `"flat"` using token colors (`--sage-dark` for favorable, `--alert` for unfavorable, `--ink-soft` for neutral).
    4. Causal explanation: top attribution cause extracted from `report.trace` mapped through `src/content/text/why.ts` (e.g. `"Fed rate cut"`, `"Budget passed"`, `"Energy prices cooled"`, or `"Several small factors"`).
- **Right Column (Context & Next Steps):**
  - **Rosette / Badge Milestone:** Milestone achievement icon or summary box.
  - **"What Happened" / Luck Panel:**
    - Explicit luck line explaining exogenous random shocks:
      `"Luck this quarter: Normal conditions across prices and output."` / `"Bad break: Unexpected price spike."`
    - "Vs doing nothing" comparison line:
      `"+2.1 points better than doing nothing"`.
  - **Action Stamp:**
    - Red stamp button pinned bottom-right: `"Continue term"` or `"Next turn"` to close overlay and proceed.

### 2.3 Economy Screen (`src/screens/Economy.svelte` / `g-economy.png`)
- **Question Headline:** `"How is the economy doing?"`
- **Main Area (2×2 Chart Grid):**
  - Four responsive comparative charts:
    1. **Growth:** Real GDP annual growth rate (%) over turns.
    2. **Jobs:** Employment-to-population ratio (%) or Unemployment rate (%).
    3. **Prices:** Inflation rate (%) relative to 2% target.
    4. **Debt:** Debt as % of GDP.
  - **Visual Treatment:**
    - Solid ink/sky line: **You** (actual player trajectory).
    - Dashed navy line: **Doing nothing** (autopilot trajectory on identical seed).
    - Clear zero-based axes with visible tick marks and gridlines.
  - **Accessible Table Fallbacks:**
    - Each chart provides an accessible data table fallback toggle (`aria-expanded`) or screen-reader table container (`role="table"`).
- **Right Column ("Next Step" / Insights Zone):**
  - **Card 1: "Why it's happening":**
    - Numbered summary of top 3 macroeconomic movers this turn derived from trace terms.
  - **Card 2: "The Federal Reserve":**
    - Displays current Fed Rate (`e.fedRate%`).
    - Plain-language explanation of Taylor rule decision:
      `"The Fed held rates steady because inflation is close to the 2% target and employment is stable."`
  - **Card 3: "All 8 Scores":**
    - Expandable breakdown of the 8 prosperity components (Income, Jobs, Prices, Debt, Health, Inequality, Safety, Trust) with relative point changes.
  - **Card 4: Primary Action:**
    - Navy link button: `"Fix it in Budget →"` (navigates player to Budget screen).

### 2.4 Top Bar Headline Score Unification (RPT-02, D11, GR-04)
- **Top Bar Status (`StatusBar.svelte`):**
  - Single exported score formula: `projectedScore(current, autopilotCurrent)` which evaluates `finalScore(current).total − finalScore(autopilotCurrent).total`.
  - Under the score line:
    `Now: +1.2 · In 10 years: +3.4`
  - Tooltip: `"Projected final score: combination of where the country stands now and its projected health 10 years later vs doing nothing."`

---

## 3. Typography, Tokens, and Viewport Fit

* **Tokens Exclusivity:** All colors and spacing must draw from `src/design/tokens.ts` (enforced by test).
* **Viewport Boundaries:**
  - All screens and overlays must fit within `100dvh` without document scrolling at `1376×768` and `1280×720`.
  - Content containers within the turn report and economy screens use internal scrolling (`overflow-y: auto`) if needed.
* **Prose Limits:** Max line length bounded to `65ch` for readability.

---

## 4. Accessibility & Verification Contract (OBS-07)

* **Axe-core Audit:** Zero violations (`critical` or `serious`) across:
  - Turn Report overlay dialog.
  - Economy screen with chart grid and table fallbacks.
* **Keyboard Navigation:**
  - Turn report overlay traps focus; closes immediately on `Escape` or `Enter`/`Space` on the primary button.
  - Economy charts navigable with keyboard; data table fallback focusable and readable.
* **Reduced Motion:** Charts and overlay animations respect `prefers-reduced-motion: reduce`.
