# Summary 17-02: Evil Engine Step Integration, Legislative Friction, Trace & Determinism

## Changes
- **Model Coefficients & Evil State Friction (`src/engine/coefficients.ts`, `src/engine/evil.ts`)**:
  - Registered `heatSenateFriction` in `COEFF` (0.03 opposition votes per heat point).
  - Updated `calculateHeatPenalties` to output both House `congressFrictionVotes` and Senate `senateFrictionVotes`.
- **Trace & Reading Grade Plain Language (`src/engine/trace.ts`, `src/content/text/why.ts`)**:
  - Registered `'approval:evil'` and `'trust:evil'` in `SOURCES` (`kind: 'policy'`).
  - Added `'evil:'` to `SOURCE_PREFIXES`.
  - Added plain-language descriptions in `WHY_COPY` and prefix fallback in `whyText` satisfying Flesch-Kincaid grade <= 9.0 and nonpartisan guidelines.
- **Legislative Friction & Decisions (`src/engine/decisions.ts`)**:
  - Added `EvilDecision` interface and `evil?: EvilDecision` to `Decisions`.
  - Updated `resolveBill` to accept `heat = 0` parameter and apply House and Senate friction hurdles to voting thresholds.
- **Game Loop Integration (`src/engine/game.ts`)**:
  - Added `readonly evil?: EvilState;` to `GameState`.
  - Initialized `evil: defaultEvilState()` in `newGame`.
  - Wired `step()` to process heat decay, corrupt decisions (siphoning, heat additions), institutional escalation thresholds (Special Counsel at 50, Impeachment at 75, Conviction at 90), and log events.
  - Added trace terms for approval and trust penalties.
  - Passed `currentEvil.heat` to `resolveBill`.
- **Determinism Goldens & Compatibility**:
  - Verified 1000 randomized property games in `invariants.property.test.ts` (passed in 1.3s).
  - Updated 6 golden replay hashes in `src/engine/determinism.test.ts` and updated `tests/fixtures/v1-save.json`.
  - Verified zero bare literals via `npm run guard`.

## Verification
- `npm run guard`: Passed cleanly.
- `npm run check`: 0 errors, 0 warnings.
- `npm test`: 60/60 test files passed (379 tests).
