# Phase 3 Plan 04 Summary: Economy Screen with Comparative Charts and Fed Explainer (ECO-01, ECO-02, OBS-07)

**Executed:** 2026-10-12  
**Requirements Addressed:** ECO-01, ECO-02, OBS-07  
**Guardrails Satisfied:** D6, OBS-07  

---

## 1. What was built

1. **Responsive Comparative MiniChart (`src/ui/art/MiniChart.svelte`):**
   - Renders a 280x130 responsive SVG chart plotting the player's trajectory ("You", solid line with distinct palette) against the autopilot trajectory ("Doing nothing", dashed line with endpoint label).
   - Zero-based or auto-padded axes with dashed zero baseline indicator.
   - Screen reader accessible `<table>` fallback (`.sr-only`) providing quarter-by-quarter tabular data with captions and table headers (WCAG AA).
   - Collision-avoidance logic for endpoint labels when lines converge.

2. **Economy Screen (`src/screens/Economy.svelte`):**
   - Matches target design `.design-targets/g-economy.png` and layout grammar (`ScreenLayout.svelte`).
   - Main area: 2×2 grid of comparative mini-charts:
     1. **Growth:** Real GDP annual growth (%) with sky line.
     2. **Jobs:** Employment-to-population ratio (%) with sage line.
     3. **Prices:** Inflation rate (%) with red line.
     4. **Debt:** Debt as % of GDP with gold line.
   - Values styled with high-contrast tokens (`--sage-dark`, `--alert-dark`, `--ink-soft`) passing WCAG AA 4.5:1 contrast requirements.
   - Side rail:
     - **Why it's happening:** Dynamic top 3 macroeconomic movers this quarter derived from engine trace terms.
     - **Federal Reserve:** Current policy rate (`fedRate%`) with Taylor-rule rationale explaining decisions against inflation and output gaps, plus placeholder action button.
     - **See the 8 scores:** Expandable modal dialog presenting all 8 prosperity pillars with current values, quarter changes, and primary causal attributions.
     - **Fix it in Budget →:** Primary action button routing directly to the Budget screen.
   - Learn strip with "How it works" and "Myth? Lower taxes boost growth?" placeholders.

3. **Game Integration & Verification (`src/screens/Game.svelte`, `tests/`):**
   - Mounted `Economy` component in `Game.svelte` when `session.screen === 'economy'`.
   - Updated `tests/a11y.spec.ts` to audit the Economy screen and the "All 8 Scores" modal dialog with axe-core (0 serious/critical violations).
   - Updated `tests/visual.spec.ts` with visual assertions verifying zero page scroll and fully visible action buttons across 1376×768 and 1280×720 viewports.

---

## 2. Verification Evidence

- `pnpm guard`: OK
- `pnpm check`: 0 errors, 0 warnings
- `pnpm test`: 24 test files passed, 144 tests passed
- `pnpm determinism`: 8/8 OK across Node, Chromium, Firefox, WebKit
- `pnpm test:e2e`: 5/5 Playwright tests passed (a11y, zero egress, keyboard navigation, 1376x768 and 1280x720 viewports)
