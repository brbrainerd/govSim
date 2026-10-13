---
phase: 01-engine-foundations
verified: 2026-10-13T01:34:00Z
status: passed
score: 8/8 requirements verified in code and tests
covered_requirements:
  - FND-01
  - FND-02
  - FND-03
  - FND-04
  - FND-05
  - FND-06
  - FND-07
  - FND-08
  - REL-01
---

# Phase 1: Engine foundations Verification Report

**Phase Goal:** The engine is the single, deterministic source of causal truth: no player choice can shift another random draw, every indicator change is explained by named causes, and the same inputs replay identically in every browser.
**Verified:** 2026-10-10
**Status:** human_needed (no gaps; two human-only items)
**Re-verification:** No, initial verification

## Gate Commands (run by the verifier, not taken from SUMMARY)

| Command | Result |
| ------- | ------ |
| `pnpm test` | 17 files, 98 tests passed, exit 0 |
| `pnpm check` | svelte-check: 4344 files, 0 errors, 0 warnings |
| `pnpm build` | built in 578ms, `dist/` produced |
| `timeout 300s pnpm determinism` | 8 OK lines: node, chromium 156, firefox 157, webkit 27.2, each min=false and min=true; exit 0 |
| `node scripts/notices.mjs --check` | exit 0 |

## Roadmap Success Criteria

| # | Success criterion | Status | Evidence |
| - | ----------------- | ------ | -------- |
| 1 | MIT license on GitHub; LICENSE-ASSETS (CC BY 4.0), TRADEMARKS.md, CONTRIBUTING.md with DCO, generated notices | PRESENT, GitHub display needs human | `LICENSE` starts "MIT License"; `LICENSE-ASSETS` names CC BY 4.0; `TRADEMARKS.md`, `CONTRIBUTING.md` (DCO section, `Signed-off-by`), `THIRD_PARTY_NOTICES.md` (notices `--check` exit 0, no Playwright entry) all tracked in git. `origin/master` has none of them and `game-pivot` is unpushed, so "shows on GitHub" depends on the user's push/merge (manual, as expected) |
| 2 | 200 seeds: no-decision player gets byte-identical shock log to autopilot; no decision moves a draw on another stream; keyed `(seed, stream, turn, key)`; scheduled-modifier mechanism for delayed effects | VERIFIED | `rng.ts`: stateless `cell(seed, stream, turn, key)` with six named streams, no cursor in `GameState`. `game.ts:150-152` draws `normal(state.seed,'macro',state.turn,key)`. `shocks.test.ts` loops seeds 1-200 over autopilot, `{}` each turn, Infrastructure push, max-deficit and tariffs-35 and `toEqual`s luck; also negative int32 seed. `rng.test.ts` proves extra draws on other streams leave states deep-equal. `modifiers.test.ts` proves scheduling never changes luck and items resolve at their due turn. Phase 1 has only the `macro` stream live, so "another stream" is proven structurally plus by the stateless-draw test |
| 3 | Recorded input log replays to same hash on Node, Chromium, WebKit, Firefox; source scan fails the build on transcendental `Math` | VERIFIED | `pnpm determinism` ran here: 4 runtimes x unminified/minified all match Node's live result across 9 fixture logs (autopilot, packages, tariffs, negative seed, failing and unaffordable bills, modifiers plus keyed-draw scheduled item, legacy via `finalScore`). `purity.test.ts` AST-scans every non-test `src/engine` file (with scanner self-test that flags `Math.log` and `**`); it runs in `pnpm test`, which CI runs. Independent grep found no `Math` member outside the allowlist; `tanhPade` is arithmetic-only |
| 4 | Every indicator change equals the sum of named trace terms incl. luck and bounded clamp/rounding; clout preview equals engine charge; every coefficient has citation/judgement + range; unregistered coefficient fails a test | VERIFIED | `trace.test.ts` sweeps seeds 1-40 x 5 strategies x 31 turns plus 40 legacy steps for conservation (1e-9), all 15 keys present, luck terms equal coefficient x recorded shock, no catch-all source, clamp only on a bound, rounding within half a step. `decisions.test.ts` grid (8 deal subsets x 2 budgets x 6 clout levels) asserts `endTurn` clout equals `resolveBill` + approval income; `session.test.ts` asserts the Session preview matches the post-turn clout; game.ts and Session both call `resolveBill`. `coefficients.test.ts` validates every COEFF/LIMITS/SCORE/RULES entry (basis, unit, note, range, https sources) and a literal scan fails on any numeric literal other than 0/1 in game.ts, score.ts, trace.ts, decisions.ts (scanner proven able to fail) |
| 5 | Party pick at New Game; "Year N · Season" with real date tooltip; party swap changes only labels; legacy runs with no events and without EO effects | VERIFIED in code, UI wiring needs human | `calendar.ts`: turn 8 = Year 2 Fall, 16 = Year 4 Fall, `realQuarterLabel` turn 1 = Fall 2026 (calendar.test.ts). `NewGame.svelte`: `party = $state(null)`, button `disabled={party === null}`. `StatusBar.svelte:110` renders tooltip and `termLabel`. `party.test.ts`: no `party` token in any engine source, `newGame` keeps `(seed, start)` signature. `session.test.ts`: D vs R sessions, same seed, identical history and autopilot. `legacy.test.ts`: eo-tagged modifiers ignored, event-tagged kept, pending scheduled items not resolved, shocks keyed. `game.ts:136,301` gate resolvers and `activeAt(..., legacy)` |

## Observable Truths from PLAN must_haves (spot-verified against code)

| Truth (plan) | Status | Evidence |
| ------------ | ------ | -------- |
| No RNG cursor in state; every shock is keyed `macro` draw (01-01) | VERIFIED | `game.ts:150-152`; `shocks.test.ts:36-50` |
| Engine purity: only allowlisted Math, no `**`, Date, platform globals or UI imports (01-01) | VERIFIED | `purity.test.ts`; manual grep clean |
| Fixture and hash chain stable and JSON-round-trippable; `stableHash` key-order independent, rejects NaN/Infinity (01-01) | VERIFIED | `determinism.test.ts`; hash.ts |
| Registry entries valid, citations https, SCORE weights sum 1, `voteOutcome` reads RULES (01-03) | VERIFIED | `coefficients.test.ts` passes. Whether each cited URL "was opened and supports the note" cannot be re-checked offline and is noted as unverified |
| Playwright pinned exact, `determinism` prints 8 OK and exits non-zero on DIFF or shortfall (01-04) | VERIFIED | `package.json` pins `@playwright/test` 1.64.0; `scripts/determinism.mjs` has `EXPECTED = 8` and exits 1 on DIFF or shortfall |
| Raw-input `Decisions = { bill }`, engine-computed clout, affordability edges (45 ok / 44 rejected), tamper cases (01-05) | VERIFIED | `decisions.test.ts`; `game.ts:155` |
| Trace holds all 15 keys, order unchanged, no catch-all source, ledgers wired in `step` (01-06) | VERIFIED | `trace.test.ts`; `game.ts` ledgers |
| Modifier channels, timing `from<=t<=until`, scheduled resolution/endGroups, unknown kind throws, FOREVER survives JSON (01-07) | VERIFIED | `modifiers.test.ts`; `game.ts:131-147`. Cancellation/ordering behaviors (`endGroups`, resolve-in-step) are exercised by named passing tests, so they are VERIFIED, not presence-only |

No debt markers (`TBD`/`FIXME`/`XXX`) in `src` or `scripts`.

## Requirements Coverage

All nine IDs appear in PLAN frontmatter and in REQUIREMENTS.md (marked `[x]`, traceability "Phase 1 / Complete"). No orphaned Phase 1 requirements.

| Requirement | Plan(s) | Status | Evidence |
| ----------- | ------- | ------ | -------- |
| REL-01 | 01-04 | SATISFIED in repo; GitHub display NEEDS HUMAN | Files present and tracked, notices check exits 0; not yet on origin |
| FND-01 | 01-01, 01-06, 01-07 | SATISFIED | keyed RNG, 200-seed shocks test, luck independent of modifiers/scheduling |
| FND-02 | 01-01, 01-04, 01-07 | SATISFIED | `pnpm determinism` 8/8 OK, purity scan |
| FND-03 | 01-02 | SATISFIED (tooltip rendering needs human glance) | calendar.ts + tests, StatusBar wiring read |
| FND-04 | 01-06 | SATISFIED | trace sweep tests |
| FND-05 | 01-05 | SATISFIED | shared `resolveBill`, grid and Session tests |
| FND-06 | 01-07 | SATISFIED | legacy.test.ts, `activeAt` legacy gate |
| FND-07 | 01-03, 01-06 | SATISFIED | registry validator, literal scan |
| FND-08 | 01-02 | SATISFIED (UI check needs human) | party.test.ts, session.test.ts, NewGame source |

## Prohibitions (must_haves.prohibitions, all judgment tier)

All seven are recorded `status: resolved` by the planner. Verifier judgment on each (NON-AUTHORITATIVE LLM-judge verdict, no wired test-tier enforcement was required):

- FND-01 no play-dependent luck: holds (stateless keyed draws; 200-seed test).
- FND-08 no party into engine / no preselected party: holds (grep clean, `party` initial `null`).
- FND-07 no invented citations: cannot be re-verified offline. unverified-prohibition: human review recommended (spot-check a few `sources` URLs in `coefficients.ts`).
- FND-05 preview computed by the engine's function: holds (single `resolveBill`).
- FND-04 no catch-all trace source: holds (test rejects `residual/other/misc` and unknown ids).
- FND-06 no EO effects in legacy: holds.

## Anti-Patterns / Code Review (01-REVIEW.md, advisory; 0 critical, 9 warnings, 7 info)

None of the findings falsify a roadmap success criterion or a must-have truth. Goal-level relevance:

| Finding | Severity | Assessment |
| ------- | -------- | ---------- |
| WR-01 malformed bill shape (`budget: null`, `deals: 5`, `decisions: null`) throws instead of being rejected | Warning | Phase 1 tamper truth (no minted clout, `__proto__`, NaN, duplicate ids) holds and is tested; a crash is not a mint. Should be hardened before Phase 2 treats a save as an input log |
| WR-04 scheduled items: array-order-dependent `endGroups`; past-due items never fire and are never removed | Warning | Latent; only fixture resolvers exist in Phase 1. Fix before Phases 4/5 add real resolvers |
| WR-09 modifier `source` not validated at runtime; a source named `luck`/`clamp`/`rounding` merges into a built-in term | Warning | Latent; conservation still holds but attribution (FND-04 "named causes") can be corrupted by future content. Add a runtime guard in Phase 4/5 |
| WR-08 `pnpm determinism` not in CI | Warning | The cross-browser proof is a manual gate today; the Math scan IS in CI via `pnpm test`. Phase 2 (OBS-02/OBS-08 golden replays and required checks) is the natural home, though its roadmap text does not name the browser matrix explicitly |
| WR-02/03/06/07, IN-01..07 | Warning/Info | Session/UI behavior and test hygiene (pre-existing "Keep as is" resets levers; dead "Send to Congress" flag; turn 32 inert; hard-coded Congress text). They do not affect the engine determinism, trace or clout-parity truths. Worth fixing in later UI phases |

## Gaps Summary

No gaps. All five roadmap success criteria and all spot-checked PLAN truths are backed by passing tests and a live cross-browser determinism run. Status is `human_needed` solely because (1) the "license shows on GitHub" half of REL-01 requires the user to push/merge `game-pivot`, and (2) no automated test mounts the New Game and status bar components, so the visible party pick and tooltip should get one manual look. The advisory review warnings (WR-01, WR-04, WR-09) are recommended hardening before Phases 2, 4 and 5 consume these APIs; they are not blockers.

---

_Verified: 2026-10-10_
_Verifier: Claude (gsd-verifier)_
