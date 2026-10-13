---
phase: 01-engine-foundations
plan: 01
subsystem: engine
tags: [rng, determinism, replay, vitest, typescript-ast]

requires: []
provides:
  - Keyed stateless RNG (STREAM, cell, draw, normal) replacing the chained GameState.rng cursor
  - Arithmetic-only clamp and tanhPade (no platform tanh/log/cos/sin in src/engine)
  - report.luck on GameState (raw macro shocks per turn)
  - stableHash, replay fixture logs, chain() and runFixture() for cross-browser comparison
  - src/testing/scan.ts AST scanner with self-test, wired as the engine purity gate
  - enact() fixture helper and a characterization snapshot guarding later refactors
affects: [01-02, 01-03, 01-04, 01-05, 01-06, 01-07, phase-2-golden-replays]

actuals:
  tokens: 10160
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Every random number is draw(seed, stream, turn, key[, k]); never draw-next-and-remember"
    - "Source gates scan the TypeScript AST, with an inline self-test so a broken scanner cannot pass"

key-files:
  created:
    - src/engine/rng.ts
    - src/engine/detmath.ts
    - src/engine/hash.ts
    - src/engine/replayFixture.ts
    - src/testing/scan.ts
    - src/engine/shocks.test.ts
    - src/engine/rng.test.ts
    - src/engine/purity.test.ts
    - src/engine/determinism.test.ts
  modified:
    - src/engine/game.ts
    - src/engine/fixture.ts
    - src/engine/balance.test.ts

key-decisions:
  - "Keyed address (seed, stream, turn, key) replaces the RNG cursor entirely; old mulberry32/Box-Muller deleted, not kept alongside"
  - "STREAM ids and macro keys gap/infl/appr are the replay contract: append only"
  - "Scanner skips an identifier only when it is the name side of a property access (foo.Date), so Date.now() is caught"

patterns-established:
  - "Characterization snapshot (inline) guards refactors; never regenerate with -u to make a refactor pass"
  - "Tests turn a budget into Decisions only via enact() in fixture.ts"

requirements-completed: [FND-01, FND-02]

duration: 8min
completed: 2026-10-10
status: complete
plan_head_before: 158a73f6c2bc6521d21bee81168253cd7d4414cf
commits: 3
---

# Phase 1 Plan 01: Keyed RNG, arithmetic-only engine, replay fixture Summary

**Engine shocks are now keyed stateless draws (luck identical for every strategy over seeds 1-200), the engine is arithmetic-only under a self-tested AST gate, and input logs replay to a stable hash chain.**

## Performance

- **Duration:** about 8 min
- **Tasks:** 3 of 3
- **Files:** 9 created, 3 modified

## Accomplishments

- `rng.ts` implements the researched keyed generator (murmur3 mix, FNV-1a key hash, Irwin-Hall 12 normal); `GameState` lost `rng` and gained `report.luck`.
- `step()` draws `normal(seed, 'macro', turn, 'gap' | 'infl' | 'appr')`; `Math.tanh` became `tanhPade`; equations otherwise untouched. The balance harness (3 tests) and `game.test.ts` stayed green.
- `shocks.test.ts` proves luck equals autopilot's for no-op, `{}`, Infrastructure push, max deficit and tariffs-35 on seeds 1-200, and for the negative seed -31337.
- `purity.test.ts` + `src/testing/scan.ts` fail the build on non-allowed `Math` members, `**`, Date/performance/crypto/Intl/globals and UI imports in `src/engine`; known-answer vectors and 100k-draw statistics pin the RNG.
- `stableHash`, `LOGS` (6 logs incl. negative seed), `chain`, `runFixture` and a 30-row characterization inline snapshot (seeds 1-5, autopilot and Infrastructure push, turns 8/16/32).

## Task Commits

1. Task 1 (tracer): keyed stateless shocks drive every engine step - `63d4b0c`
2. Task 2: engine purity and RNG statelessness tests - `75662bd`
3. Task 3: replay hash chain and characterization snapshot - `99647a6`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scanner skipped `Date.now()`**
- **Found during:** Task 2 (the scanner self-test failed on `const d = Date.now()`)
- **Issue:** The researched snippet ignored any banned identifier whose parent is a property access, so `Date.now()`, `crypto.subtle` and `performance.now()` all passed. The self-test did its job.
- **Fix:** Skip only when the identifier is the `name` of the property access (`foo.Date`), not its object.
- **Files modified:** src/testing/scan.ts
- **Commit:** `75662bd`

**2. [Minor] `readdirSync('src/engine')` written literally** in purity.test.ts to match the plan's acceptance grep (no `dir` variable indirection).

Otherwise the plan executed as written. Known-answer vectors were obtained by running `rng.ts` under Node (not a console.log inside the test) and cross-checked against the first vitest failure value.

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None. T-1-04 (purity scan), T-1-05 (stableHash throws on non-finite) and T-1-06 (header marks it non-cryptographic) are implemented as planned.

## Verification

- `pnpm test` 9 files / 36 tests pass; `pnpm check` 0 errors; `pnpm build` succeeds.
- Not done here: cross-browser run of `runFixture()` (plan 01-04).

## Self-Check: PASSED

- All created files exist; commits `63d4b0c`, `75662bd`, `99647a6` exist on branch game-pivot.
