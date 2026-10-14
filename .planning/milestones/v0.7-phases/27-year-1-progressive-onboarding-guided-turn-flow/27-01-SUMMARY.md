# Phase 27 Plan 01 Summary: Year-1 Progressive Onboarding & Guided Turn Flow

## Accomplishments
1. **Progressive Unlocking & NEW Badges (`ONBOARD-01`)**:
   - Updated `navFor` in `src/app/screens.ts` to compute `newlyUnlocked` for screens that unlock on the current turn (Turn 2: `powers` and `trade`; Turn 3: `voters`).
   - Added animated `NEW` badge (`data-testid="rail-new-badge-{screenId}"`) on rail tabs in `src/ui/Rail.svelte`.
2. **Year-1 Guided Turn Flow (`ONBOARD-02`)**:
   - Implemented `year1GuideFor(turn)` in `src/app/screens.ts` delivering clear 3-step guidance:
     - Turn 1: Step 1 of 3 (Budget and whip 218 House votes).
     - Turn 2: Step 2 of 3 (Your Powers & Trade unlocked).
     - Turn 3: Step 3 of 3 (Voters map unlocked before Year 2).
   - Rendered `<div class="year1-guide" data-testid="year1-onboarding-guide">` inside `.card.info` on `OvalOffice.svelte`.
3. **Experienced Mode / Quick-Unlock Escape Hatches**:
   - Added `unlockAll?: boolean` to `GameOptions`, `parseSave`, and `Session`.
   - Added `data-testid="unlock-all-toggle"` on `NewGame.svelte` to allow experienced players to unlock all screens on Turn 1.
   - Added in-rail quick-unlock button `data-testid="rail-unlock-all-btn"` in `Rail.svelte` whenever locked tabs exist.
4. **Verification**:
   - Added comprehensive E2E suite `tests/onboarding.spec.ts` (4/4 tests passing across 1376x768 and 1280x720).
   - Verified `tests/trade.spec.ts` and `tests/voters.spec.ts` remain 100% green.
   - Verified 71 unit test files, 440 tests, typecheck, and guard ok.
