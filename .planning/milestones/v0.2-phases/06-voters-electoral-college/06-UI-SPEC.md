# Phase 06 — UI Specification: Voters & Electoral College

## 1. Design Targets & Visual References

This specification establishes the visual, layout, and interaction contract for **Phase 6: Voters & Electoral College**, directly matching:
* Primary Screen Target: `.design-targets/g-voters.png` (Voters Screen)
* Midterm Result Card: Modal / Turn Report card pattern (`design.md §7c`)

---

## 2. Layout Grammar (design.md §7d)

The Voters screen adheres to the 4-part layout grammar:
1. **Plain Question Headline**: `"Who supports you?"`
2. **Main Object Container**:
   - **View Mode Switcher**: Small segmented toggle (`Map` / `Table`) in the map header.
   - **Interactive US Map**:
     - Pre-projected Albers USA SVG rendering 50 states + DC.
     - Inset panels for Alaska (`AK`) and Hawaii (`HI`).
     - District chips for Maine (`ME-1`, `ME-2`) and Nebraska (`NE-1`, `NE-2`, `NE-3`) plus District of Columbia (`DC`).
     - Player-relative coloring (`sage`/`sky` for You, `alert`/`brick` for Them, `gold` for Tossup).
     - Pattern encoding: Diagonal hatching on opponent states and dot-stipple on tossup states (`GR-23`).
     - Active selection: Mustard gold outline (`3px solid var(--color-gold)`) with gold star badge on the tipping-point state.
   - **Electoral College 270 Bar** (anchored at the bottom of the main container):
     - Left indicator: `"You <playerVotes>"` (in navy/sky).
     - Right indicator: `"Them <opponentVotes>"` (in alert/brick).
     - Center milestone pin: `(270)` marker with a vertical line pointing down to the winning threshold.
     - Segments: Safe You, Likely You, Lean You, Tossup, Lean Them, Likely Them, Safe Them.
     - **Year 3+ Projection Whiskers** (`VOT-03`): Bracket indicator showing honest range (e.g. `245 – 295 EV`).
3. **Learn Strip (bottom-left)**:
   - Badge: `[Learn]`
   - Civics explainer link / button: `"Myth? How the Electoral College works →"`
4. **Next Step Sidebar (right column)**:
   - **Selected State Card**:
     - Headline: `"<State Name> · <EV> votes"`, with a gold star icon if it is the tipping-point state or swing state.
     - Metric: `"<supportPct>% support, <up/down> <delta>"` with arrow indicator.
     - Causal reasons: Up to 3 concise bullet points (e.g., `Farmers upset by tariffs`, `Strong manufacturing growth`, `National approval trend`).
   - **Contextual Action Cards**:
     - Action Card 1: `"Give a speech in <State>"` (with `...` button opening Speech modal if available).
     - Action Card 2: `"Visit swing states"` / `"Address farm concerns"`.
   - **Primary Stamp Button** (bottom-right):
     - Contextual policy recommendation, e.g., `"Change tariffs in Budget →"` or `"Review powers in Powers →"`.

---

## 3. Component Hierarchy & Details

### 3.1 US Map (`src/ui/art/USMap.svelte`)
* **SVG Specifications**:
  - `viewBox="0 0 960 600"`
  - High performance, reactive path coloring based on state leanings.
  - SVG `<defs>`:
    - `pattern-hatch`: 45-degree diagonal lines with `var(--color-alert)` stroke.
    - `pattern-dots`: Stippled dots with `var(--color-gold)` stroke.
* **Keyboard Navigation**:
  - Each `<path>` has `tabindex="0"`, `role="button"`, and `aria-label="<State Name>, <EV> electoral votes, <Support>% support, <Leaning>"`.
  - Arrow keys navigate spatially or cyclically through states.
  - Enter / Space selects the state for inspection.

### 3.2 Sortable Table Fallback (`src/screens/Voters.svelte`)
* Displayed when the player toggles `Table` mode:
  - Columns: State, Electoral Votes, Support %, 2024 Margin, Current Margin, Outlook.
  - Clickable table headers sort ascending/descending.
  - Fully accessible for screen readers and high-contrast accessibility tools (`VOT-01`).

### 3.3 Midterm Results Notification
* At Turn 8 (Year 2 Fall) and Turn 24 (Year 6 Fall):
  - A results banner / card in the Turn Report:
    - `"Midterm Results: Voters have spoken"`
    - House seat net change (e.g. `"-18 House seats"`).
    - Senate seat net change (e.g. `"-2 Senate seats"`).
    - Causal summary: `"Voters reacted to <approval>% national approval and economic conditions."`

---

## 4. Typography, Palette & Spacing Tokens

* All colors sourced strictly from `src/design/tokens.ts`:
  - Player Leaning / Safe: `var(--color-sage)` / `var(--color-sky)`
  - Opponent Leaning / Safe: `var(--color-alert)` / `var(--color-brick)`
  - Tossup: `var(--color-gold)`
  - Background Paper: `var(--color-cream)`
  - Outlines / Ink: `var(--color-ink)`
* Typography:
  - Display / State Names: `var(--font-display)` (Arvo slab serif)
  - Numeric metrics: `var(--font-condensed)` (Barlow Condensed bold)
  - Body & Reasons: `var(--font-ui)` (Atkinson Hyperlegible)
* Responsive Bounds:
  - Layout is strictly bounded to `100dvh` with `overflow: hidden` on viewport roots.
  - Zero document scrolling at $1376 \times 768$ and $1280 \times 720$.
