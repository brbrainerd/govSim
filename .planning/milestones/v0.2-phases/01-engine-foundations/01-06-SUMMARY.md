---
phase: 01-engine-foundations
plan: 06
subsystem: engine
tags: [trace, ledger, conservation, coefficients, literal-scan, fnd-01, fnd-04, fnd-07]

requires:
  - phase: 01-01
    provides: enact() fixture, keyed RNG, characterization snapshot
  - phase: 01-03
    provides: C / LIMITS / SCORE / RULES registry
  - phase: 01-05
    provides: resolveBill and Decisions = { bill }
provides:
  - src/engine/trace.ts: Term, TRACE_KEYS, LEVEL_KEYS, Ledger (add, sum, clamp, round, settleTo, scaled), SOURCES, SOURCE_PREFIXES, isKnownSource
  - GameState.report.trace with all 15 keys on every step, including the legacy path
  - src/engine/units.ts, src/engine/score.ts, exported step
  - src/testing/conservation.ts: VALUE and conservationErrors (reused by plan 01-07)
  - Literal scan of the engine files in coefficients.test.ts
affects: [01-07, phase-3-report-card, phase-4-events, phase-5-fed]

actuals:
  tokens: 7600
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Every indicator is before + Ledger of named terms; clamp and rounding are the only residuals"
    - "Level-defined indicators (unemployment, empPop) use settleTo; growth is a level key"
    - "Type-only import of GameState in score.ts avoids a runtime cycle with game.ts"

key-files:
  created:
    - src/engine/trace.ts
    - src/engine/trace.test.ts
    - src/engine/units.ts
    - src/engine/score.ts
    - src/testing/conservation.ts
  modified:
    - src/engine/game.ts
    - src/engine/game.test.ts
    - src/engine/coefficients.test.ts

key-decisions:
  - "conservationErrors tolerance is absolute up to magnitude 1 and relative beyond it (tol * max(1, |before|, |after|))"
  - "Lever bases come from the lever tables (leverBase/leverDev) instead of the literals 22 and 100"
  - "settleTo always records its carry, so unemployment and empPop traces hold a ~1e-16 clamp term most turns"

requirements-completed: [FND-04, FND-07, FND-01]

duration: 14 min
completed: 2026-10-10
status: complete
plan_head_before: 0d003f6ead39d2fc56bd5877862e452b70fa9dde
commits: 3
---

# Phase 1 Plan 06: Ledger trace and registry-backed step Summary

**Every indicator change in `step` is now a sum of named terms recorded on `report.trace` (15 keys, luck as one source id, only bounded clamp and rounding residuals), every model number comes from the coefficient registry, and a literal scan over the engine files fails on any new unregistered number. Behaviour is unchanged.**

## Accomplishments

- `trace.ts`: `Ledger` merges terms by source and skips zeros; `clamp` and `rounding` record their cut as residual terms; `settleTo` carries level-defined values; `scaled` reuses the gap and unemployment ledgers for growth, unemployment and employment. `SOURCES` lists all 43 ids plus the open `event:`, `eo:`, `law:` prefixes. No `residual`/`other`/`misc` source exists.
- `game.ts` `step` (now exported) is 15 ledgers on `C`, `LIMITS`, `RULES` and `units.ts`. Fed rate still rounds then clamps; approval still clamps then rounds. The local coefficient table is gone. Lever bases (`22`, `100`) come from the lever tables.
- `score.ts` holds `prosperity` on the `SCORE` weights; `game.ts` re-exports it, so `Session`, `OvalOffice` and `balance.test.ts` imports are untouched. `legacy` and `finalScore` stay in `game.ts` (`finalScore` is one function, weighted by `SCORE.nowWeight`, for D11). `TOTAL_TURNS` and `LEGACY_QUARTERS` are defined in `units.ts` and re-exported.
- `trace.test.ts` (seeds 1-40 x 5 strategies x 31 turns + 40 legacy steps from each final state, 14,200 steps): conservation for every key, all 15 keys present, gap/inflation/approval luck equal coefficient x recorded shock, growth/unemployment/empPop luck equal their scaled gap luck, every source known, no catch-all name, clamp terms above 1e-9 only on a bound (empPop: the unemployment bound, clout: 0), rounding within half a step (0.125 fed, 0.5 approval). A mutation (renaming a source to `misc`) fails the test.
- `coefficients.test.ts`: literal scan over every non-exempt `src/engine` file (including `game.ts`, `score.ts`, `trace.ts`, `decisions.ts`) with a self-check that `0.4 * y` is reported. The scan found no number the registry lacked, so `coefficients.ts` is unchanged.

## Task Commits

1. Task 1 (tracer): output gap as named terms on state - `edeca3d`
2. Task 2: every indicator change is a sum of named causes - `e6a9b7b`
3. Task 3: scoring and every model number read from the registry - `ba95848`

## Characterization snapshot

Unchanged, never regenerated (`vitest -u` not used); `git status` on `determinism.test.ts` is clean and no 01-06 commit touches it. The RNG known-answer vectors are untouched. The ledger changes floating-point summation order, but the 6-significant-digit snapshot did not move, so no entry needed a hand edit. Replay hashes are not committed (compared live across browsers), and `pnpm determinism` prints OK for all 8 runs (Node, Chromium, Firefox, WebKit, minified and unminified).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Conservation tolerance of 1e-9 is below one ulp for large values**
- **Found during:** Task 2
- **Issue:** seed 31 with the max-deficit strategy collapses in the legacy projection to a median income near -6e7 (the model has no income floor, pre-existing); there one ulp is 7e-9, so no addition can conserve to an absolute 1e-9. The terms were right (`-59929464.44147869` against `-59929464.4414787`).
- **Fix:** `conservationErrors` uses `tol * max(1, |before|, |after|)`. Values up to 1 keep the absolute 1e-9; a normal income of 83,000 gets 8e-5 dollars, still far below any plug that matters.
- **Files modified:** src/testing/conservation.ts
- **Commit:** e6a9b7b

Other notes (no deviation):
- TDD: tests ran red before each implementation step (Task 1: `step` not exported and no `report.trace`; Task 2: missing keys; Task 3: 33 literals reported and `score.ts` missing). The residual test originally used one `expect` per term and timed out at 7 s; it now collects violations and asserts once.
- Task 2 listed `trace.ts` as modified; its `SOURCES` was already complete from Task 1, so Task 2 did not touch it.
- `settleTo` records its carry even when it is floating-point noise, so most unemployment and empPop traces include a `clamp` term near 1e-16 (allowed by the 1e-9 guard). Phase 3 should hide residual terms below a display threshold.
- The commit trailer uses `Claude Sonnet 5.5` (the actual model) rather than the `Claude Opus 5.5` line in the dispatch convention and earlier commits.

## Known Stubs

None.

## Threat Flags

None. T-1-03 mitigated (only bounded clamp/rounding residuals, banned catch-all names, conservation over 40 seeds x 5 strategies plus the legacy path). T-1-12 mitigated (AST literal scan with a fixed exempt list and a self-check that the gate can fail).

## Verification

`pnpm test` 15 files / 73 tests pass; `pnpm check` 0 errors 0 warnings; `pnpm build` ok; `pnpm determinism` 8/8 OK. Acceptance greps: `settleTo(` 2, `.round(` 3 in `game.ts`; `export const TOTAL_TURNS` 1 in `units.ts`; `export { prosperity } from './score'` 1; `SCORE.nowWeight` 1 in `game.ts`; `literals` 4 in `coefficients.test.ts`.

## Self-Check: PASSED

src/engine/trace.ts, trace.test.ts, units.ts, score.ts and src/testing/conservation.ts present; commits edeca3d, e6a9b7b and ba95848 found in git log.
