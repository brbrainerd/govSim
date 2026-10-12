# Phase 2 Plan 05 Summary: Accessibility, Keyboard Navigation & Visual Baselines

**Executed:** 2026-10-12
**Status:** Complete
**Requirements:** OBS-07, D6

## What was built
1. **Automated Axe Accessibility Audits (`tests/a11y.spec.ts`):**
   - Installed `@axe-core/playwright@4.13.0` exact pin (MPL-2.0 approved dev exception, D6) and documented in `docs/design.md` §9.
   - Fixed WCAG AA color contrast issue on card background (`#FFF8EA`) by introducing `sage-dark` token (`#2B6E47`, 5.2:1 contrast ratio) in `src/design/tokens.ts` and updating `OvalOffice.svelte` and `Budget.svelte`.
   - Verified 0 serious or critical violations across New Game, Oval Office, Budget, and Congress screens.
2. **100% Keyboard-Only Turn Navigation (`tests/keyboard.spec.ts`):**
   - Automated full turn playthrough using only `Tab`, `Space`, `Enter`, and Arrow keys from New Game party selection through Turn 2.
   - Verified that every focused element remains visible and focusable throughout navigation.
3. **Viewport Fitting & Screenshot Baselines (`tests/visual.spec.ts`):**
   - Verified across desktop viewports 1376×768 and 1280×720 that document scrollHeight never exceeds window.innerHeight (zero page scrollbar).
   - Asserted that primary bottom-right action buttons ("Start the term", "Send to Congress", "Call the vote") are completely contained within the visible viewport bounds.
   - Generated reference screenshots to `.playwright-screenshots/` (added to `.gitignore`).

## Verification
- `pnpm exec playwright test`: 5/5 tests passed (a11y, egress, keyboard, visual 1376x768, visual 1280x720).
- All gates green: `pnpm guard`, `pnpm check`, `pnpm test` (131 tests passed), `pnpm determinism` (8/8 OK), `notices` (23 packages OK).
