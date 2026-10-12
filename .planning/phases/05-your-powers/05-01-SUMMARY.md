# Phase 05-01: Executive Orders & Myth Cards Catalogs Summary

Executed Plan 05-01: Built executive orders and civics myth cards catalogs, added Phase 5 power coefficients, extended GameState with cloutCap and power tracking, and verified with dedicated test suites.

## Delivered Artifacts

1. **`src/content/orders.ts` (PWR-01, OBS-05)**:
   - Exactly 10 cited executive orders with statutory bases, clout costs, and qualitative court-risk bands (`Low`, `Moderate`, `High`).
   - Covered key policy areas: workforce hiring freeze, steel tariff review, federal land oil leasing, NEPA environmental reviews, drug cost benchmarking, student loan repayment caps, Buy American procurement, federal EV fleet transition, tech antitrust enforcement.
   - Tested for reading grade <= 9.0, sentence length <= 20 words, and no banned partisan names.

2. **`src/content/myths.ts` (PWR-06, OBS-05, GR-20, GR-21, Pitfall 17)**:
   - Exactly 5 spectrum-balanced civics myth cards focusing strictly on institutional mechanics and constitutional powers.
   - Topics: gas prices, interest rates, job creation, rule by decree, foreign aid & deficit.
   - Balanced across the political spectrum: `|count(challenges=left) - count(challenges=right)| <= 1`.
   - Tested for reading grade <= 9.0 and sentence length <= 20 words.

3. **`src/engine/coefficients.ts` (PWR-07, GR-10)**:
   - Added `cloutCap` (200 clout) to stop political capital hoarding strategies.
   - Added `speechBaseCost` (10 clout), `speechApprovalBoost` (2%), `fedPressureCredibilityHit` (0.2%), `fedRatePressureRelief` (0.25%), `mythRewardClout` (5 clout).

4. **`src/engine/game.ts`**:
   - Extended `GameState` with `activeOrders`, `pendingChallenges`, `viewedMyths`, and `speechCountInWindow`.
   - Clamped clout to `[0, C.cloutCap]`.

5. **Test Suites & Verification**:
   - `src/content/orders.test.ts`: 5 passing tests.
   - `src/content/myths.test.ts`: 5 passing tests.
   - `src/engine/trace.test.ts`: Updated clout clamp bound to `[0, C.cloutCap]`.
   - `src/engine/determinism.test.ts`: Updated golden replay hashes due to `cloutCap` and extended `GameState` schema.
   - All 30 test files passing (174/174 unit/property tests).
   - Determinism 8/8 OK across Node and browsers.
   - `pnpm guard` and `pnpm check` clean.
