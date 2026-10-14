# Summary: Plan 25-02 — State-Reactive Scenes & Upgraded Editorial Illustrations

## Objective
Upgrade `OvalOfficeScene.svelte`, `ReporterScene.svelte`, `CourtBench.svelte`, and `FedPortrait.svelte` to dynamically react to live game state, add rich editorial Americana poster props and framing, and verify with Playwright E2E tests across 1376x768 and 1280x720 viewports.

## Delivered
- `src/ui/art/OvalOfficeScene.svelte`:
  - Dynamically reflects `approval`, `inflation`, `unemployment`, `hasCrisis`, `evilMode`, `heat`, and `stagedCount`.
  - Windows adapt to `weather`: `'sunny'` with clouds/sun, `'rain'` with overcast clouds/streaks when unemployment or inflation is elevated, `'storm'` with dark clouds and lightning bolts during active crisis.
  - Resolute desk props: steaming coffee cup, folders stack proportional to staged decisions, brass desk lamp, and a pulsing red crisis phone (`data-testid="oval-crisis-phone"`) when a crisis is active.
  - Evil Mode props: document shredder (`SHRED-O-MATIC`, `data-testid="oval-evil-shredder"`) with paper strips and offshore ledger folder.
  - Character moods react dynamically: President turns scheming/panicked/triumphant/stressed; Chief of Staff sweats and panics during crisis or high heat.
- `src/screens/OvalOffice.svelte`:
  - Wired live `GameState` properties into `<OvalOfficeScene>`.
- `src/ui/art/ReporterScene.svelte` & `src/ui/CrisisModal.svelte`:
  - Added broadcast studio mic array (`WDC`, `CAP`, `LIVE`), overhead lighting grid, camera silhouette with tally light, and dynamic lower-third chyron text from `crisis.headline`.
- `src/ui/art/CourtBench.svelte`:
  - Added classical fluted columns, hanging brass scales of justice (`<g class="scales">`), Chief Justice gavel and sounding block, pleated jabots, and majority/minority ideological eyebrows.
- `src/ui/art/FedPortrait.svelte`:
  - Added classical pediment header (`FEDERAL RESERVE`), background yield-curve grid lines with dynamic yield curve by stance (`hawk`, `centrist`, `dove`), wire glasses, and stance-reactive eyebrows.
- `tests/art-scenes.spec.ts`:
  - Playwright E2E test verifying reactive Oval Office scenes in standard and Evil Mode, upgraded CourtBench and FedPortrait, zero outer viewport scrolling, and zero axe accessibility violations across 1376x768 and 1280x720 viewports.

## Verification
- `npx playwright test tests/art-scenes.spec.ts` (4 passed across 1376x768 and 1280x720)
- `pnpm check` (0 errors, 0 warnings)
- `pnpm guard` (guard ok)
- `pnpm test` (69 test files, 431 tests passed)
