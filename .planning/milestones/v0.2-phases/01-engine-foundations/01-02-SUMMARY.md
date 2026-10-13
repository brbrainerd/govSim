---
phase: 01-engine-foundations
plan: 02
subsystem: ui
tags: [party, calendar, svelte, session-options, party-blind-engine]

requires: []
provides:
  - PARTIES / PartyId in src/content/parties.ts (the only file naming real parties)
  - GameOptions and Session.options (party lives beside the engine, never in it)
  - New Game screen (no preselected party) and Game.svelte (the former App body)
  - engine/calendar.ts - termParts, termLabel, realQuarterLabel, MIDTERM_TURNS [8, 24], REELECTION_TURN 16
  - Status bar "Turn N of 32 · Year Y · Season" with a real-calendar tooltip and the party name
affects: [phase-2-saves, phase-6-elections, phase-7-elections, 01-05]

actuals:
  tokens: 6200
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Party-blindness by absence: newGame(seed, start) keeps two arguments, GameState has no party key, a source scan fails on any party mention in src/engine"
    - "Real calendar is tooltip-only; the visible label is the fictional term"

key-files:
  created:
    - src/content/parties.ts
    - src/engine/calendar.ts
    - src/engine/calendar.test.ts
    - src/engine/party.test.ts
    - src/app/session.test.ts
    - src/screens/NewGame.svelte
    - src/screens/Game.svelte
  modified:
    - src/App.svelte
    - src/app/session.svelte.ts
    - src/ui/StatusBar.svelte

key-decisions:
  - "Party is stored in Session.options only; engine call sites are untouched (D4)"
  - "No party preselected at New Game; start button disabled until chosen"
  - "Election turns 8/16/24/32 are all Fall; calendar.ts is pure and UI-free so Phases 6 and 7 can import it"

patterns-established:
  - "Rune modules (.svelte.ts) import under vitest, so Session-level tests are possible without extra tooling"

requirements-completed: [FND-03, FND-08]

duration: 6min
completed: 2026-10-10
status: complete
plan_head_before: 85531c27bced3219a74d4bea95356132c8d11dca
commits: 3
---

# Phase 1 Plan 02: Party pick, party-blind engine, term calendar Summary

**New Game now asks "Which party do you lead?" and stores the answer in Session options only, while the status bar reads "Turn N of 32 · Year Y · Season" with the real quarter on hover.**

## Performance

- **Duration:** about 6 min
- **Tasks:** 3 of 3
- **Files:** 7 created, 3 modified (App.svelte was moved to Game.svelte and rewritten)

## Accomplishments

- `src/content/parties.ts` is the single file naming real parties; `Session` takes `readonly options: GameOptions`; `newGame(seed, start)` calls are unchanged.
- `App.svelte` shows `NewGame` until a session exists; `Game.svelte` is the old App body taking a `session` prop. NewGame uses ScreenLayout, native radios in a `radiogroup`, token-only styles.
- `party.test.ts` (source scan of src/engine, `newGame.length === 2`, no `party` key) and `session.test.ts` (D vs R, 32 turns with a package, three deals and a vote: `history` and `autopilot` deep-equal) prove FND-08.
- `calendar.ts` plus tests cover every label and tooltip value in the plan; midterm/reelection turns are asserted as Fall turns.

## Task Commits

1. Task 1 (tracer), party pick and Game split: `1f7044b`
2. Task 2, party-blindness tests: `e5edfb7`
3. Task 3, term calendar and status bar: `e1c1e4e`

## Verification

`pnpm test` 43/43 passed, `pnpm check` 0 errors 0 warnings, `pnpm build` ok.

## Deviations from Plan

None - plan executed as written. TDD note: Tasks 2 and 3 tests were written alongside code that already satisfied them (Task 2 asserts absence; Task 3 test and module were committed together), so no separate RED commit exists.

## Human verification pending (tracer gate, deferred to end of phase)

`workflow.human_verify_mode` is `end-of-phase` and auto mode is off; the automated verify passed, so execution continued. The browser checks were not run by this agent and remain for the phase-end pass:
- `pnpm dev`: New Game shows "Which party do you lead?", no option selected, "Start the term" disabled; Tab reaches the radios, arrows switch; choosing enables the button; pressing it opens the Oval Office.
- After 7 Next turns: "Turn 8 of 32 · Year 2 · Fall"; hover shows "Real calendar: Summer 2028. Your term is fictional and off-cycle."; party name appears above the label.

## Notes for later plans

- All three status-bar `title=` tooltips (Approval, Clout, turn label) are mouse-only; a keyboard path is a Phase 2 OBS-07 item (not fixed here, since a tabindex on a non-interactive element is flagged by svelte-check).
- Phase 2 OBS-05 content gate must allow-list `src/content/parties.ts`; Phase 2 saves should store `Session.options` alongside the input log.
- `turnLabel` in `src/engine/game.ts` is now unused by the UI; plan 01-05 deletes it with its test, as planned.

## Known Stubs

None.

## Threat Flags

None. T-1-07 mitigated by the tests above; T-1-08 accepted (no data leaves the browser).

## Self-Check: PASSED

Files exist (parties.ts, calendar.ts, NewGame.svelte, Game.svelte, three test files); commits 1f7044b, e5edfb7, e1c1e4e found in git log.
