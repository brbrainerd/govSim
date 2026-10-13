# Summary 17-01: Pure Evil Mode Engine, Heat Decay, and Registered Coefficients

## Changes
- **Registered Model Coefficients (`src/engine/coefficients.ts`, `src/engine/units.ts`)**:
  - Registered `heatDecayQuarterly` (3.0 heat/quarter natural decay).
  - Registered `heatApprovalPenalty` (0.20 approval pts/heat pt).
  - Registered `heatTrustPenalty` (0.30 trust pts/heat pt).
  - Registered `heatCongressionalFriction` (0.10 opposition votes/heat pt).
  - Added `heat` bounds `[0, 100]` in `LIMITS`.
  - Added constants `MAX_HEAT = 100`, `MIN_HEAT = 0`, `HEAT_SPECIAL_COUNSEL_THRESHOLD = 50`, `HEAT_IMPEACHMENT_THRESHOLD = 75`, `HEAT_CONVICTION_THRESHOLD = 90` in `units.ts`.
- **Pure Evil Mode Module (`src/engine/evil.ts`)**:
  - Implemented `EvilState` contract: `{ offshoreStashBn, heat, investigationsActive, specialCounselAppointed, articlesOfImpeachmentVoted, convicted }`.
  - Implemented `defaultEvilState()`.
  - Implemented `calculateHeatDecay(currentHeat, decayRate)` with clamping to `[MIN_HEAT, MAX_HEAT]`.
  - Implemented `calculateHeatPenalties(heat)` returning `approvalDelta`, `trustDelta`, and `congressFrictionVotes`.
  - Implemented `sanitizeEvilState(raw)` with bounded validation and type resilience.
- **Unit Tests (`src/engine/evil.test.ts`)**:
  - 12 comprehensive unit tests covering clean defaults, natural decay, clamping boundaries, penalty formulas, non-finite values, and deserialization sanitization.
  - Zero numeric literals outside exempt files confirmed via `npm run guard` AST literal scanner.

## Verification
- `npm run guard`: Passed cleanly.
- `npm run check`: Svelte/TS typecheck passed with 0 errors.
- `npm test`: 60 test files passed (375 tests).
