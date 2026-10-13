# UI Design Contract: Phase 2 — Saves, Guardrails & Continuous Deploy

**Phase:** 02-saves-guardrails-continuous-deploy  
**Status:** Approved  
**Related Requirements:** OBS-01, OBS-05, OBS-07  
**Design Targets:** `.design-targets/g-home.png`, `.design-targets/g-budget.png`, `.design-targets/g-congress.png`, `.design-targets/uikit.png`

---

## 1. Scope of UI in Phase 2

Phase 2 focuses on persistence (autosave, export, import, resume), accessibility hardening (WCAG AA, axe, keyboard-only), and content/test gates.

The visual additions must adhere strictly to the established Americana civics poster design grammar (design.md §7d):
- **Cream cardstock background (`--paper`)** with halftone dot pattern (`--dot`).
- **Navy ink typography (`--ink`)** using Atkinson Hyperlegible for body copy, Barlow Condensed for labels/buttons, and Arvo for slab headlines.
- **Red stamp buttons (`--alert`, `--alert-dark`)** for primary irreversible actions.
- **Flat offset shadows (`var(--shadow)`)** and double rules.

---

## 2. Component Specifications

### 2.1 Resume & Start Dialog (On Reload / New Game)
When a saved game exists in `localStorage`:
- **Placement:** Modal dialog / overlay over the New Game screen.
- **Headline:** `"Resume your term?"` (Arvo slab, font-weight 700).
- **Body Details:** Shows saved state metadata:
  - Turn number and term season: e.g. `"Turn 4 of 32 · Year 1 · Fall"`.
  - Leading party name: e.g. `"Democratic Party"` or `"Republican Party"`.
  - Current score vs autopilot: e.g. `"+0.4 better than doing nothing"`.
- **Actions:**
  - Primary button: Solid red stamp button: `"Resume term"`.
  - Secondary button: Navy button: `"Start new term"` (with confirmation prompt to prevent accidental data loss).

### 2.2 Save Export & Import Controls
- **Placement:** Subtle footer / utility tray accessible from the left rail or status bar.
- **Export Action:**
  - Label: `"Export save"` (button with download icon).
  - Triggers browser download of formatted JSON: `govsim-save-turn{T}-{seed}.json`.
- **Import Action:**
  - Label: `"Load save"` (button with upload icon).
  - Hidden file input accepting `.json`.
  - Strict validation on load: checks format version, seed, input log integrity, finite numbers, and known action IDs.
- **Error Feedback:**
  - Accessible alert banner / toast on invalid save file:
    `"Cannot load save: file is damaged, modified, or incompatible."`
  - Rejection does not overwrite or corrupt any existing active session.

### 2.3 Autosave Status Indicator
- **Placement:** Status bar or rail footer.
- **Behavior:**
  - Displays `"Autosaved"` briefly upon turn completion (`session.nextTurn()`).
  - Screen reader announcement via `aria-live="polite"`.

---

## 3. Typography, Text Width & Responsive Rules

* **Text Reading Length:**
  - All paragraphs, descriptions, and error text must have `max-width: 65ch` (enforced via `.line`, `p`, `.prose`).
  - Modals and info cards must bound text lines to prevent unreadable horizontal stretching on wide viewports.
* **Viewport Boundaries:**
  - Entire application fits within `100dvh` across standard viewports (1376×768, 1280×720, and 1024×768).
  - Primary commit buttons (stamp buttons) must remain pinned or visible within the viewport without outer document scrolling.
  - Dialogs and overlays trap keyboard focus (`Tab` cycling) and dismiss on `Escape`.

---

## 4. Accessibility & Verification Contract (OBS-07)

* **Axe Core Audit:** Zero violations (`critical`, `serious`, or `moderate`) on:
  - New Game / Resume screen
  - Oval Office (Home)
  - Budget (Taxes & Spending)
  - Congress (House Whip)
* **Keyboard-Only Traversal:**
  - Full game cycle playable using `Tab`, `Shift+Tab`, `Space`, `Enter`, and arrows for sliders.
  - Visible focus ring (`outline: 3px solid var(--gold); outline-offset: 3px;`).
* **Visual Regression Baseline:**
  - Screenshot baselines captured via Playwright in Linux container (`mcr.microsoft.com/playwright:v1.64.0-noble`).
