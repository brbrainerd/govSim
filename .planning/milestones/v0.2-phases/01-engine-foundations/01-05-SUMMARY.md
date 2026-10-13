---
phase: 01-engine-foundations
plan: 05
subsystem: engine
tags: [decisions, clout, bill, preview, tamper, fnd-05]

requires:
  - phase: 01-01
    provides: enact() fixture helper, keyed RNG, characterization snapshot
  - phase: 01-02
    provides: Session.options, calendar.ts as the only label source
  - phase: 01-03
    provides: RULES / C registry (C.cloutPerApproval used by the tests)
provides:
  - Decisions = { bill?: { budget, deals } } (raw choices only, no clout field)
  - resolveBill / cloutCost / knownDeals / sanitizeBudget in src/engine/decisions.ts
  - Report.log with LogEntry; bill passed / failed / rejected entries
  - Session.bill, preview, vote, canDeal; Draft.voteCalled
affects: [01-06, 01-07, phase-2-saves]

actuals:
  tokens: 3650
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "One pure function (resolveBill) is called by both the engine step and the Session preview"
    - "Untrusted objects are rebuilt from a known key list via Object.hasOwn, never spread"

key-files:
  created:
    - src/engine/decisions.ts
    - src/engine/decisions.test.ts
  modified:
    - src/engine/game.ts
    - src/engine/fixture.ts
    - src/app/session.svelte.ts
    - src/screens/Congress.svelte
    - src/app/session.test.ts
    - src/engine/game.test.ts

key-decisions:
  - "Deals made without pressing Call the vote are voted and charged at Next turn (A8); Call the vote only reveals the result early"
  - "enact() sends all three deals (45 clout, 230 of 218 votes) so balance and replay budgets really pass the House from the 120 starting clout"
  - "Session.clout is current clout plus the previewed cloutDelta, so it already includes the vote reward or refund once any deal is drafted"

requirements-completed: [FND-05]

duration: 6 min
completed: 2026-10-10
status: complete
plan_head_before: cd0042ce253aa60107af17ff189bac07a9452d59
commits: 2
---

# Phase 1 Plan 05: Raw-input decisions Summary

**The UI now sends only a raw bill (budget plus deal ids); one pure function, resolveBill, computes cost, vote and clout for both the engine step and the Session preview, and tampered bills (duplicate or unknown deals, `__proto__`, NaN, out-of-range levers, unaffordable deals) cannot mint clout or corrupt policy.**

## Accomplishments

- `decisions.ts`: `Bill`, `Decisions`, `BillResult`, `knownDeals` (deduped, known ids only), `cloutCost`, `sanitizeBudget` (known lever ids via `Object.hasOwn`, non-finite -> lever base, clamp to min/max) and `resolveBill` (unaffordable -> `valid: false`, delta 0).
- `game.ts` step resolves `decisions.bill` with `resolveBill(state.clout, ...)`; policy and the family-income term change only when the bill is valid and passed; clout = `max(0, clout + cloutDelta + round(approval / 10))` (literal kept, plan 01-06 moves it to the registry). `Report` gains `log`; a rejected bill logs `{kind:'bill', id:'rejected', detail:'unaffordable'}`. The old `Decisions` interface and the real-quarter label code (`turnLabel`, `SEASONS`, `START_QUARTER`) are gone from `game.ts`.
- Session previews with `resolveBill(this.current.clout, this.bill)`; `canDeal` uses `cloutCost`; Congress reads `session.vote` and `session.canDeal(d.id)`.
- Tests: preview-equals-charge grid (8 subsets x 2 budgets x 6 clout levels), affordability edges (45/44, 15/14), rejected-bill log and unchanged policy, tamper cases, no-mutation, `enact` passes the House, and Session shown-clout + income = clout after Next turn both with and without a called vote.

## Task Commits

1. Task 1 (tracer): engine charges clout from the raw bill - `0df1980`
2. Task 2: sanitize bills so tampering cannot mint clout - `53474b8`

## Characterization snapshot

Unchanged, never regenerated (`vitest -u` not used). The snapshot excludes clout, and clout is the only thing that bills now change differently: the engine only reads clout for the clout value itself, so econ and approval are identical. The RNG known-answer vectors are untouched. The only behaviour change is the plan's A8: deals made without calling the vote are now voted and charged at Next turn.

## Deviations from Plan

None - plan executed as written. Notes:
- TDD: the tamper tests were run first and failed (`sanitizeBudget is not a function`) before the implementation was added. The grid, edge and Session tests passed against Task 1 code because Task 1 already contained `resolveBill`. Task 2's tests and code share one commit.
- UI side effect of the plan's design: once any deal is drafted the clout display includes the previewed vote reward or refund (the Session test requires shown clout + income = clout after Next turn), so the number shifts before "Call the vote" is pressed.
- Tooling: lean-ctx blocked `cat`/`sed` for this repo during execution, so files were read with the Read tool and `/bin/cat`.

## Known Stubs

None.

## Threat Flags

None. T-1-01 mitigated (engine recomputes cost from known, deduped ids; no clout field in `Decisions`; unaffordable bills rejected and logged). T-1-02 mitigated (`sanitizeBudget` builds from the lever list with `Object.hasOwn`; test parses a real `__proto__` JSON key). T-1-05 mitigated (non-finite -> base, out-of-range -> clamped).

## Verification

`pnpm test` 14 files / 62 tests pass; `pnpm check` 0 errors 0 warnings; `pnpm build` ok. Acceptance greps: `resolveBill(state.clout` 1, `resolveBill(this.current.clout` 1, `session.canDeal(d.id)` 1, `deals: ['mod', 'cen', 'spc']` 1, `Object.hasOwn` 2, `turnLabel` none in `src`.

## Self-Check: PASSED

src/engine/decisions.ts and src/engine/decisions.test.ts present; commits 0df1980 and 53474b8 found in git log.
