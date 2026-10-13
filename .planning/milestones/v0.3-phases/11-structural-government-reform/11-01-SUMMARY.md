# Phase 11 Plan 01 Summary: Senate Filibuster Reform & Cloture Engine

**Milestone:** v0.3 (Social Policy & Domestic Reform)  
**Requirement:** REF-01  
**Status:** Complete  

## 1. Accomplishments
- **Senate Filibuster Catalogs & Thresholds (`src/engine/congress.ts`, `src/engine/units.ts`, `src/engine/coefficients.ts`)**:
  - Registered all 4 filibuster rules:
    1. `sixty_vote`: 60-vote static supermajority cloture under Rule XXII (status quo).
    2. `talking_filibuster`: dynamic cloture scaling from 60 down to 51 based on public approval (`clamp(60 - round((approval - 50) * 0.4), 51, 60)`).
    3. `fifty_five_vote`: 55-vote static supermajority threshold.
    4. `simple_majority`: 51-vote simple-majority nuclear option.
  - Registered all filibuster coefficients in `COEFF` (`filibusterTalkingApprovalSlope`, `filibusterTalkingMinThreshold`, `filibusterNuclearTrustPenalty`, `filibusterNuclearApprovalPenalty`, `filibusterFiftyFiveTrustPenalty`, `filibusterTalkingTrustPenalty`, `filibusterNuclearCloutCost`, `filibusterFiftyFiveCloutCost`, `filibusterTalkingCloutCost`).
  - Added unit constants `SENATE_CLOTURE_60 = 60`, `SENATE_CLOTURE_55 = 55`, `SENATE_SIMPLE_MAJORITY = 51`, `SENATE_TOTAL_SEATS = 100`, `SENATE_BASE_SEATS = 50`.
  - Appended isolated RNG stream `reform: 7` to `STREAM` in `src/engine/rng.ts`.
- **Bicameral Cloture & Senate Vote Derivation (`src/engine/congress.ts`, `src/engine/decisions.ts`, `src/engine/game.ts`)**:
  - Implemented `calculateSenateVotes` evaluating base coalition seats, approval bonuses, and deal/policy appeal.
  - Implemented `billBipartisanAppeal` rewarding centrist, moderate, and swing speech deals, as well as balanced energy (clean + fossil) and immigration (border + visas) compromises.
  - Updated `resolveBill` to evaluate bicameral passage:
    - Pure budget reconciliation bills require 51 Senate votes under the Byrd Rule.
    - Substantive domestic legislation requires the active filibuster cloture threshold.
    - If a bill passes the House (>= 218) but fails the Senate cloture threshold, status is marked `'filibustered'`, `passed: false`, and clout is refunded via `RULES.refundDivisor`.
  - Updated `step` in `src/engine/game.ts` to accept `filibusterRule` decisions, charge clout, apply trust and approval penalties, log reform events, and persist `senateSeatDelta` and `filibusterRule`.
  - Added `reform:` source family and trace keys (`clout:reform`, `trust:reform`, `approval:reform`) in `src/engine/trace.ts` and `src/content/text/why.ts`.
- **Verification & Compatibility**:
  - Unit tests in `src/engine/congress.test.ts` verifying all 4 filibuster rules, dynamic talking filibuster scaling, approval bonus, crossover votes, reconciliation vs substantive filibuster, and broad bipartisan 60-vote passage.
  - Preserved 100% bit-identical golden replay determinism across all 6 golden games in `determinism.test.ts` and 8/8 runtimes in `pnpm determinism`.
  - All 46 test files (291 tests) passing, `pnpm guard` ok, `svelte-check` 0 errors / 0 warnings, Playwright 16/16 passing.

## 2. Artifacts Produced / Modified
- `src/engine/rng.ts`
- `src/engine/units.ts`
- `src/engine/coefficients.ts`
- `src/engine/congress.ts`
- `src/engine/congress.test.ts`
- `src/engine/decisions.ts`
- `src/engine/decisions.test.ts`
- `src/engine/game.ts`
- `src/engine/trace.ts`
- `src/content/text/why.ts`
- `src/app/session.svelte.ts`
- `.planning/phases/11-structural-government-reform/11-01-SUMMARY.md`
