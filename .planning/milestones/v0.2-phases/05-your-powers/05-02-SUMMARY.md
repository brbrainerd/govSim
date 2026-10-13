# Phase 05-02: Judicial Review, Fed Pressure & Speech Mechanics Summary

Executed Plan 05-02: Implemented pure engine mechanics for executive orders, judicial review via keyed draws, Federal Reserve pressure and appointments, and bully pulpit speeches with diminishing returns.

## Delivered Artifacts

1. **`src/engine/powers.ts` (PWR-01..PWR-07, D5)**:
   - `resolvePowerDecisions()`: Pure resolution function handling order signing/revoking, speech delivery, Fed pressure, Fed chair nominations, and myth rewards.
   - `evaluateCourtChallenge()`: Keyed draw on `court` stream against order risk probability.
   - `resolveCourtRuling()`: Resolver for scheduled `court_ruling` events evaluating outcomes against 6–3 Court lean (upholding orders with public trust lift, or striking them down with -5 clout penalty and modifier group revocation).
   - `speechCost()` & `speechApprovalGain()`: Pure diminishing returns formula for bully pulpit addresses.
   - `senateConfirmationVotes()`: Senate confirmation threshold (51 votes) for Fed nominations.
   - Strictly references all model constants from `coefficients.ts`, `congress.ts`, and `units.ts` with no bare literals.

2. **Integration into Engine Core**:
   - `src/engine/modifiers.ts`: Registered `court_ruling` in `RESOLVERS`.
   - `src/engine/decisions.ts`: Added `powers?: PowerDecisions` to `Decisions` interface.
   - `src/engine/game.ts`: Wired power decisions into `step()`, handling clout accounting (`clout:powers`), EO modifier activation/revocation, and scheduled rulings.
   - `src/engine/trace.ts`: Registered `clout:powers` and `fed:credibility` in `SOURCES`.
   - `src/content/text/why.ts`: Added plain language copy for `clout:powers` and `fed:credibility`.
   - `src/engine/coefficients.ts`: Registered all power-related constants (`speechDiminishingFactor`, `courtUpholdLow/Moderate/High`, `courtStrikeCloutPenalty`, `fedPressureCost`, etc.).
   - `src/engine/congress.ts`: Exported `SENATE_SEATS`, `SENATE_CONFIRMATION_THRESHOLD`, and `SENATE_CONFIRMATION`.

3. **Test Suites & Verification**:
   - `src/engine/powers.test.ts`: 9 tests verifying EO signing/revoking, legacy exclusion (D5), keyed court challenges, Fed pressure credibility hit, Fed appointments, speech diminishing returns, myth reward idempotency, and cloutCap.
   - `src/engine/balance.test.ts`: Verified speech-spamming and clout-hoarding strategies do not dominate sensible play (GR-10, GR-11).
   - `src/engine/coefficients.test.ts`: Passed literal scan over all engine files.
   - All 31 test files passing (184/184 unit/property tests).
   - Determinism 8/8 OK across Node and browsers.
   - `pnpm guard` and `pnpm check` clean with 0 warnings.
