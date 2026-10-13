# Phase 05 — UI Specification: Your Powers & Myth Cards

## 1. Design Targets & Visual References

This specification establishes the visual, layout, and interaction contract for **Phase 5: Your Powers**, matching the project design targets:
* Primary Screen Target: `.design-targets/g-powers.png` (Your Powers screen)
* Modal Dialog Target: `.design-targets/g-myth.png` (Civics Myth card modal)

---

## 2. Layout Grammar (design.md §7d)

The Your Powers screen adheres to the 4-part layout grammar:
1. **Plain Question Headline**: `"What can you do without Congress?"`
2. **Main Object Container**:
   - Executive Orders grid (selectable cards showing order name, clout cost, and court risk band).
   - Institutional Power Strip (bottom row):
     - **The Fed (independent)**: Avatar portrait, rate control summary, current Fed stance.
     - **Supreme Court (leans 6–3)**: Bench of 9 justice pill-people, court lean, pending challenge status.
3. **Learn Strip (bottom-left)**:
   - Plain link: `"How it works: Executive power & court review"`
   - Ticket button: `"Myth? Can you lower gas prices"` (launches Myth Modal).
4. **Next Step Sidebar (right column)**:
   - `"What it means"` card explaining the selected executive order's immediate impact, trade-offs, and legal vulnerability.
   - Action Card 1: `"Give a speech"` with button `"Open Speech"`.
   - Action Card 2: `"Pressure the Fed"` with button `"Open Fed"` (or `"Nominate Fed Chair"` on vacancy).
   - Primary Red Stamp Button: `"SIGN ORDER"` or `"REVOKE ORDER"` (fixed bottom-right).

---

## 3. Screen Structure & Component Breakdown

### 3.1 Executive Orders Grid (`src/screens/Powers.svelte`)
* **Grid Layout**: 2 columns or 3 columns of executive order cards, scrollable internally if needed.
* **Card Anatomy**:
  - Title: Bold `var(--font-display)` or `var(--font-ui)`.
  - Clout Cost: Pill or text with `var(--font-condensed)`, e.g., `"15 clout"`.
  - Court Risk: Qualitative risk band (`"Court risk: Low"`, `"Court risk: Moderate"`, `"Court risk: High"`).
  - Status Indicators:
    - `"Signed"` badge (dark navy or ink fill) if active.
    - `"Challenged"` badge (alert red fill) if pending court review.
    - Selected state: Mustard gold border (`3px solid var(--gold)`) with subtle gold background tint (`var(--gold-tint)`).
* **Keyboard Interaction**: Arrow keys / Tab navigate between cards; Enter / Space selects an order for preview in the sidebar.

### 3.2 Institutional Power Strip
* **The Federal Reserve**:
  - Left card with 2px ink border.
  - Avatar: Circular portrait of Fed Chair pill-person (`Character.svelte`).
  - Copy: `"The Fed (independent)"`, `"Sets rates, controls money supply"`.
  - Credibility rating indicator if pressured.
* **The Supreme Court**:
  - Right card with 2px ink border.
  - Bench illustration: Row of 9 pill-person justice avatars behind the mahogany bench.
  - Header: `"Supreme Court · leans 6–3"`.
  - Subtext: `"Rules on executive actions"`. Displays active challenge rulings when scheduled.

### 3.3 Myth Card Modal (`src/ui/MythModal.svelte`)
Matches `.design-targets/g-myth.png`:
* **Overlay Shell**: Uses `Overlay.svelte` with backdrop blur and focus trap.
* **Left Column**:
  - Bold red crossed-out `"MYTH"` header icon.
  - Core misconception in large bold serif: e.g., `"The President sets gas prices."`
* **Right Column**:
  - Header: `"REALITY"`.
  - Flowchart Diagram: Horizontal chain of boxed SVG elements:
    `[World oil price] → [Refiners] → [Taxes] → [Pump price]`
  - Character Scene: Vector pill-person pointing to the real-world flow.
  - `"Real levers"` row: Accessible buttons displaying what the president *can* actually do.
  - Footer: Sourced attribution, e.g., `"Source: EIA, CRS"`.
  - Stamp Button: Bottom-right aligned red stamp `"GOT IT"`.

---

## 4. Modal Dialogs for Ancillary Powers

### 4.1 Bully Pulpit Speech Modal (`src/ui/SpeechModal.svelte`)
* **Audience Selection**:
  - Choice of audiences: General Public, Working Families, Business Leaders, Party Base.
  - Diminishing returns indicator: Shows clout cost vs expected approval shift.
  - Stamp button: `"DELIVER SPEECH"`.

### 4.2 Federal Reserve Dialogue Modal (`src/ui/FedModal.svelte`)
* **Actions Available**:
  - If Chair vacancy: Nominate Chair (`Hawk` / `Centrist` / `Dove`) with Senate confirmation count.
  - If Chair active: `"Publicly pressure for lower rates"` (with warning: costs institutional credibility, making inflation stickier in trace).

---

## 5. Tokens, Viewport & Accessibility Rules

* **Design Tokens Only**: All colors, borders, and typography derive strictly from `src/design/tokens.ts` (enforced by `pnpm guard` and hex/rgb tests).
* **Viewport Boundaries**:
  - Complete interface must fit within `100dvh` without document scrolling at `1376×768` and `1280×720`.
  - Cards and lists scroll internally (`overflow-y: auto`).
* **Accessibility**:
  - Zero `critical` or `serious` Axe-core violations.
  - Full keyboard navigability (Tab, Shift-Tab, Enter, Space, Escape to dismiss modals).
  - Reduced motion respected across all avatar and confetti animations.
