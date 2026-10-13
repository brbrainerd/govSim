# Plan 08-04 Summary: Balance Harness, Release E2E Suite, and Visual Audits (REL-02, REL-03, REL-04, OBS-07)

**Status:** Completed
**Commit:** `e4f9536`

## Overview
Plan 08-04 delivered final release hardening, multi-seed balance calibration, full keyboard playthrough and share replay E2E tests, axe-core accessibility compliance, and visual zero-scroll viewport fitting across standard desktop resolutions.

## Accomplishments
1. **Extended Balance Harness & Calibration (`GR-10`, `GR-11`, `GR-15`)**:
   - Expanded `src/engine/balance.test.ts` to test training seeds 1–40 and validation seeds 41–80 against degenerate bots (`hoardBot`, `spamBot`).
   - Verified that sensible play beats doing nothing by +2.0 to +10.0 index points across both seed groups.
   - Verified that degenerate bots never beat sensible play.
   - Verified that reelection win rate for sensible play is in the calibrated band (40% to 85%).
2. **Release E2E Suite (`tests/release.spec.ts`)**:
   - Implemented automated Playwright tests for:
     - About modal and Problem Report modal with pre-copy reviewable diagnostic bundle.
     - Zero external network requests verification (`OBS-04`) during diagnostic inspection and copy.
     - Deterministic `#run=` hash replay restoring game history identically.
     - Full keyboard navigation flow through navigation rail and modals.
3. **Accessibility Audits (`tests/a11y.spec.ts`)**:
   - Audited About modal, Problem Report modal, and Milestones tab on End Screen with axe-core.
   - Adjusted badge card text colors and badge pill styles to guarantee WCAG 2 AA contrast ratio (> 4.5:1).
   - Added keyboard focusable scrollable region attributes (`role="region" aria-label="..." tabindex="0"`) to scrollable containers.
   - 0 serious or critical violations across all audited surfaces.
4. **Visual Baselines & Viewport Fitting (`tests/visual.spec.ts`, `OBS-07`)**:
   - Captured screenshots for About modal, Problem Report modal, and Milestones tab.
   - Verified `scrollHeight <= innerHeight` (zero outer page scroll) and visible action buttons at 1376×768 and 1280×720 viewports.

## Verification
- `pnpm test`: 246/246 tests passing across 42 test files.
- `pnpm test:e2e`: 14/14 Playwright E2E tests passing.
- `pnpm check`: 0 errors, 0 warnings.
- `pnpm guard`: guard ok.
