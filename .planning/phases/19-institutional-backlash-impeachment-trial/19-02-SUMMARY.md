# Plan 19-02 Summary: House Impeachment Vote & Senate Conviction Trial Mechanics (IMPEACH-02, IMPEACH-03)

## Accomplished
1. **House Impeachment Model (`src/engine/evil.ts`)**:
   - Implemented `calculateHouseImpeachmentVote(houseSeatDelta, heat, approval)`:
     - Baseline opposition votes: `HOUSE_OPPOSITION_BASE_SEATS` (213) adjusted by presidential midterm delta (`- houseSeatDelta`).
     - Defection votes driven by heat above threshold (`heat - 80`) with slope `impeachmentHouseHeatSlope` (1.2) and approval below threshold (`45 - approval`) with slope `impeachmentHouseApprovalSlope` (0.8).
     - Clamped to `[0, HOUSE_TOTAL_SEATS]` (435). Pass threshold: `>= 218` (`HOUSE_IMPEACHMENT_THRESHOLD`).
2. **Senate Conviction Trial Model (`src/engine/evil.ts`)**:
   - Implemented `calculateSenateTrialVote(senateSeatDelta, heat, approval)`:
     - Baseline opposition senators: `SENATE_BASE_SEATS` (50) adjusted by midterm Senate delta (`- senateSeatDelta`).
     - Bipartisan crossover defectors driven by critical heat (`heat - 85`) with slope `convictionSenateHeatSlope` (1.0) and public disapproval (`45 - approval`) with slope `convictionSenateApprovalSlope` (0.6).
     - Clamped to `[0, SENATE_TOTAL_SEATS]` (100). Supermajority threshold: `>= 67` (`SENATE_CONVICTION_THRESHOLD`).
3. **Turn Resolution & Stash Forfeiture Integration (`src/engine/game.ts`)**:
   - Dynamically evaluates House impeachment vote and Senate conviction trial during `step()` when `nextHeat >= HEAT_IMPEACHMENT_THRESHOLD`.
   - Records vote tallies in `EvilState`: `houseImpeachmentVotes`, `senateConvictionVotes`, `articlesOfImpeachmentVoted`, `convicted`, and `termEnded`.
   - When convicted:
     - Offshore stash is immediately wiped to `$0.0B` (`offshoreStashBn = 0`).
     - `termEnded = true` set to signify presidential removal from office.
     - Descriptive log entries emitted for adoption, conviction forfeiture, or acquittal.
4. **Verification & Gates**:
   - Strict party-blindness preserved (0 occurrences of forbidden party words in engine).
   - Zero bare literals outside exempt files; all constants in `units.ts` and `coefficients.ts`.
   - 405/405 unit and property tests passing across 62 test files.
   - Determinism test suite passing 8/8 across Node, Chromium, Firefox, WebKit (minified & unminified).
