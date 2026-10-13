# Phase 4 Plan 03 Summary: Crisis Modal Dialog & Reporter Artwork

**Plan:** `04-03`  
**Requirements Delivered:** EVT-02, OBS-07  
**Guardrails Verified:** GR-09, GR-38  

---

## 1. What Was Built

1. **ReporterScene SVG Art Component (`src/ui/art/ReporterScene.svelte`):**
   - Americana flat vector illustration matching civics poster aesthetic.
   - Studio backdrop with adaptive graphic display (weather/radar map for storms, market graphs for financial/debt panic, capitol pillars for political crises).
   - News reporter pill-person character with microphone, LIVE broadcast badge, and news bulletin chyron.
   - Responsive scaling with zero hardcoded pixel heights or non-token colors.

2. **CrisisModal Dialog (`src/ui/CrisisModal.svelte`):**
   - Matches visual design target `.design-targets/g-crisis.png`:
     - Centered red `"BREAKING"` ribbon banner across the top.
     - Left column: `"What happened"` label, Arvo display headline, `<ReporterScene />`, description, and civics explainer link.
     - Endogenous crises badge: `"Autopilot didn't face this"` (EVT-03).
     - Right column: `"What will you do?"` header with selectable option cards (`role="radiogroup"`), each showing title, description, and clout cost pill (`{cost} clout` or `free`).
     - Affordability guard: options exceeding available political capital are disabled.
     - Red stamp button `"DECIDE"` saves choice to session draft and dismisses modal.

3. **Game Integration & Auditing (`src/screens/Game.svelte`, `tests/a11y.spec.ts`, `tests/visual.spec.ts`):**
   - Mounted `CrisisModal` reactively when `session.current.activeCrisis` is present on turn transition.
   - Headless Playwright automated a11y audit with `@axe-core/playwright`: 0 serious or critical violations.
   - Visual viewport audit across 1376×768 and 1280×720 viewports: zero outer page scrollbars, DECIDE action button fully visible and in bounds.
   - Captured screenshot artifacts: `.playwright-screenshots/crisis-1376x768.png` and `crisis-1280x720.png`.

---

## 2. Gates Passed

- `pnpm guard`: OK
- `pnpm check`: 0 errors, 0 warnings
- `pnpm test`: 26 files passed, 153 tests passed
- `pnpm determinism`: 8/8 OK across Node, Chromium, Firefox, WebKit
- `pnpm test:e2e`: 5 tests passed (a11y, zero-egress, keyboard nav, 1376x768 visual, 1280x720 visual)
