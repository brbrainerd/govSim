---
phase: 01-engine-foundations
plan: 07
subsystem: engine
tags: [modifiers, scheduled, resolvers, legacy, replay, determinism, fnd-01, fnd-02, fnd-06]
status: complete

requires:
  - phase: 01-04
    provides: pnpm determinism (Node vs Chromium, Firefox, WebKit, unminified and minified)
  - phase: 01-06
    provides: Ledger/trace, conservationErrors, registry-backed step
provides:
  - src/engine/modifiers.ts: Channel, Modifier, Scheduled, Resolver, ResolverResult, RESOLVERS (empty), activeAt
  - GameState.modifiers and GameState.scheduled (both [] in newGame); StepOptions { legacy, resolvers }; step/endTurn take opts
  - FOREVER in units.ts
  - legacy() runs every quarter with { legacy: true }: eo modifiers dropped, no resolvers, keyed macro shocks kept
  - Replay fixture Log gains optional setup and resolvers; three new logs (failing-bill, unaffordable-bill, modifiers)
affects: [phase-4-events, phase-5-executive-orders-and-courts, phase-2-saves]

plan_head_before: 1893d0320d545e338deaed4ae61373855201c2f0
actuals:
  tokens: 4450
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A modifier is a trace term named by its source in the ledger of its channel (before clamp or rounding), so conservation holds by construction"
    - "Scheduled items resolve at the start of step through a registry looked up with Object.hasOwn; unknown kind throws a named Error"
    - "Resolvers use keyed draws (draw(seed, 'court', turn, item.id)); nothing consumes sequential randomness"

key-files:
  created:
    - src/engine/modifiers.ts
    - src/engine/modifiers.test.ts
    - src/engine/legacy.test.ts
    - src/testing/mods.ts
  modified:
    - src/engine/game.ts
    - src/engine/units.ts
    - src/engine/replayFixture.ts
    - src/engine/determinism.test.ts

key-decisions:
  - "Channel mapping: gap/inflation/expected/approval/trust/clout to the same-named ledger; potential to the growth ledger (level); fedTarget to the fed ledger times fedSmooth; debtBn adds amount/BN_PER_TN to debt and (amount/BN_PER_TN/gdp1)*PERCENT to the debtPct ledger"
  - "Resolver log entries precede the bill entry in report.log (they happen at the start of the step)"
  - "Resolution selects items with due === turn only; an overdue item is not resolved (Phase 2's save validator must reject stale due values)"
  - "Registry lookup uses Object.hasOwn so a kind such as 'constructor' cannot reach an inherited property"

patterns-established:
  - "Shared test helpers for synthetic states live in src/testing/mods.ts (mod, withMods), not imported from another test file"

requirements-completed: [FND-06, FND-01, FND-02]

duration: 12 min
completed: 2026-10-10
---

# Phase 1 Plan 07: Modifiers, scheduled effects and legacy gating Summary

Lasting effects (modifiers) and delayed effects (scheduled items resolved by keyed draws) now share one mechanism that shows up in the trace under the effect's own name; the legacy projection drops executive orders and skips resolvers while keeping events and the keyed macro shocks; and every Phase 1 input type replays identically on Node, Chromium, Firefox and WebKit.

## Performance

- **Duration:** about 12 min
- **Tasks:** 3 of 3
- **Files:** 4 created, 4 modified

## Task Commits

1. **Task 1 (tracer): lasting effects change the economy under their own name** - `f347b6a`
2. **Task 2: delayed effects arrive on schedule without moving a draw** - `527d243` (tests; the code is in `f347b6a`)
3. **Task 3: replay every input type across Node and three browsers** - `e977f3f`

## What was built

- `modifiers.ts`: types, an empty `RESOLVERS`, and `activeAt` (drops `eo` only when legacy).
- `step`: resolves due scheduled items first (add, endGroups = `until: turn - 1`, logs), drops them from `state.scheduled`, then folds the active modifiers into the channel ledgers. Input arrays are never mutated. In legacy steps resolution is skipped and `scheduled` carried unchanged.
- Fixture: `failing-bill`, `unaffordable-bill` and `modifiers` logs (active eo and event modifiers on `FOREVER`, one scheduled `fixture` item resolved by a keyed court draw). `finalScore` already hashes the legacy projection, which therefore covers eo-dropping.
- Gate results: `pnpm test` (98 tests), `pnpm check` (0 errors), `pnpm build`, `node scripts/notices.mjs --check` all exit 0; `timeout 300s pnpm determinism` exit 0 with 8 OK lines (node, chromium 156, firefox 157, webkit 27.2; unminified and minified).

## Deviations from Plan

**1. [Process] Task 2's `step()` resolution code landed in the Task 1 commit.** The resolver loop and the modifier fold are one edit to the top of `step`, so `f347b6a` contains both; `527d243` holds the Task 2 tests. Behaviour is the same as if split.

**2. [Rule 2 - Missing coverage] Added `src/testing/mods.ts`** (shared `mod`/`withMods` helpers) so `legacy.test.ts` does not import another test file, and a `fixture coverage` block in `determinism.test.ts` asserting that the new logs actually produce a failed bill, a rejected bill and exactly one ruling (otherwise the fixture could silently stop covering what the plan claims). Neither file was in the plan's `files_modified`.

**3. Test-state setup uses spreads of `newGame` as planned; `Log.setup` is code, not JSON.** The JSON round-trip test still passes because it only round-trips `inputs`; setup and resolvers are carried through unchanged.

No snapshot, known-answer vector or replay expectation was regenerated or rewritten: the six existing fixture logs and the characterization block are untouched and pass as before (no modifiers are active in them).

## Handoff

The characterization block in `determinism.test.ts` stays as the behaviour guard until Phase 2's golden replays (OBS-02) replace it. Phase 2's save validator must reject unknown scheduled kinds, non-finite modifier values and overdue `due` values before replay (T-1-13).

## Issues Encountered

- lean-ctx tools were rooted at another project, so native Read and Bash were used for repo files.

## Known Stubs

None. `RESOLVERS` is intentionally empty; Phases 4 and 5 register their kinds.

## Threat Flags

None beyond the plan's threat model (T-1-13 unknown kind throws, T-1-05 FOREVER is finite with a JSON round-trip test, T-1-04 resolvers live in `src/engine` so the purity scan covers them).

## Self-Check: PASSED

Files found: modifiers.ts, modifiers.test.ts, legacy.test.ts, mods.ts, replayFixture.ts. Commits found: f347b6a, 527d243, e977f3f.
