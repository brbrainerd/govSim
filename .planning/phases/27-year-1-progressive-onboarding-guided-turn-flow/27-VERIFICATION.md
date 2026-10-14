---
phase: 27-year-1-progressive-onboarding-guided-turn-flow
status: passed
score: 2/2
verified_at: 2026-10-14T12:10:00Z
---

# Phase 27 Verification: Year-1 Progressive Onboarding & Guided Turn Flow

## Requirements Verification

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| ONBOARD-01 | Progressive unlocking of tabs with NEW badges, Experienced Mode toggle in NewGame, and in-rail quick-unlock escape hatch | PASSED | `src/app/screens.ts`, `src/ui/Rail.svelte`, `src/screens/NewGame.svelte`, and `src/app/session.svelte.ts` wire `unlockAll` and render `data-testid="rail-new-badge-{id}"`, `data-testid="unlock-all-toggle"`, and `data-testid="rail-unlock-all-btn"`; verified in `tests/onboarding.spec.ts`. |
| ONBOARD-02 | Guided Year-1 turn flow callout on Oval Office stage | PASSED | `year1GuideFor` in `src/app/screens.ts` and `<div class="year1-guide" data-testid="year1-onboarding-guide">` in `src/screens/OvalOffice.svelte` guide the first 3 turns; verified in `tests/onboarding.spec.ts`. |

## Automated Verification Results
- `npx playwright test tests/onboarding.spec.ts tests/trade.spec.ts tests/voters.spec.ts` → 9 passed (100% across 1376x768 and 1280x720)
- `pnpm check` → 0 errors, 0 warnings
- `pnpm guard` → guard ok (zero bare color literals, pure engine boundary maintained)
- `pnpm test` → 71 test files, 440 tests passed
- Outer viewport scrolling → 0px overflow across 1376x768 and 1280x720 viewports
