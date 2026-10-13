# Phase 6 Plan 01: Pure Engine Electoral College Model & Midterms Summary

## Execution Summary
- **Delivered Requirements**: `VOT-04`, `VOT-05`, `VOT-06` (engine calculation foundation).
- **Core Additions**:
  - `src/engine/voters.ts`: Pure functional electoral college simulator with 538 electoral votes (50 states + DC + ME/NE districts), tipping-point centring (`calculateTippingPointOffset`), industry exposure adjustments (farm, manufacturing, energy), Year 3+ uncertainty whiskers, and swing state identification. Strictly party-blind (`side: 'D' | 'R'`).
  - `src/engine/detmath.ts`: Deterministic integer/float square root (`sqrt`) to maintain engine determinism without calling host `Math.sqrt`.
  - `src/engine/congress.ts`: Added `calculateMidtermShift(approval)` with strictly bounded House seat shifts ($-35$ to $+15$) and Senate shifts ($-6$ to $+4$), plus `groupsFor(houseDelta)` preserving 435 House seats across the 5 ideological groups.
  - `src/engine/game.ts`: Integrated `houseSeatDelta: number` into `GameState`, passed `state.houseSeatDelta` to `resolveBill`, and triggered midterms at Turn 8 (Year 2 Fall) and Turn 24 (Year 6 Fall) logging `{ kind: 'midterm', id: 'midterm_results' }`.
  - `src/engine/coefficients.ts` & `src/engine/units.ts`: Declared voter elasticity, exposure sensitivity, midterm shift coefficients, and electoral vote constants.
  - `src/engine/voters.test.ts`: 9 comprehensive tests validating:
    - 538 total electoral votes (including ME and NE district allocations).
    - Unadjusted 2024 replay (Trump 312, Harris 226, ME-2 R, NE-2 D).
    - 300-seed party symmetry: $|P(\text{reelect} \mid \text{D}) - P(\text{reelect} \mid \text{R})| \le 5\text{ pp}$.
    - Bounded midterm losses ($\le 35$ seats) preventing death spirals.
    - Year 3+ honest projection whiskers (turns $\ge 9$).
    - Tariff shock impact on farm-heavy states.
  - `src/engine/determinism.test.ts`: Golden replay end-state hashes updated for intentional addition of `houseSeatDelta` and midterm logs; verified across Node, Chromium, Firefox, WebKit runtimes.

## Verification
- Unit tests: 194/194 vitest tests pass.
- Typecheck: `svelte-check` reports 0 errors and 0 warnings.
- Determinism: `node scripts/determinism.mjs` passes across all 8 runtime variations.
- Guard: `node scripts/guard.ts` ok.
