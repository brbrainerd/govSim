# Phase 1: Engine foundations - Pattern Map

**Mapped:** 2026-10-10
**Files analyzed:** 36 (new + modified, from RESEARCH.md "Plan Decomposition")
**Analogs found:** 31 / 36 (all analog paths verified git-tracked via `git ls-files src scripts`)

Codebase conventions seen everywhere (apply to every new file):
- Engine files open with a 1-3 line `//` header naming the design.md section, plus `// ponytail:` ceiling comments for deliberate simplifications (`game.ts:1-3`, `congress.ts:1-2`, `budget.ts:1-3`).
- Relative imports without extensions (`'./budget'`, `'../engine/game'`); `import type` / inline `type` for types. Svelte imports keep `.svelte` ext; `session.svelte` is imported without it (`'./app/session.svelte'`).
- `as const` / `as const satisfies readonly {...}[]` for data tables (`congress.ts:16-20`).
- Terse prose, one-line trailing comments for units (`game.ts:9-24`). Engine has no UI imports.
- Tests: vitest `describe/it/expect`, `START` from `./fixture`, tiny `play(seed)` loop helpers, no fixtures framework.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `src/engine/rng.ts` | utility | transform | `src/engine/game.ts:85-105` (`nextRandom`/`normals`, being replaced) | role-match |
| `src/engine/detmath.ts` | utility | transform | `src/engine/game.ts:107` (`clamp`) | role-match |
| `src/engine/hash.ts` | utility | transform | `src/engine/congress.ts` (small pure module) | partial |
| `src/engine/replayFixture.ts` | utility/fixture | batch | `src/engine/fixture.ts` + `balance.test.ts:15-19` (`run`) | role-match |
| `src/testing/scan.ts` | test support | transform (AST) | `src/app/screens.test.ts:21-28` (fs scan of `src/`) | role-match |
| `src/engine/{rng,detmath,hash,calendar,coefficients,decisions,trace,modifiers,legacy,shocks,determinism,characterization}.test.ts` | test | request-response | `src/engine/game.test.ts`, `balance.test.ts`, `budget.test.ts` | exact |
| `src/engine/purity.test.ts`, literal-scan, `party.test.ts` | test | file-I/O scan | `src/app/screens.test.ts:21-28` | exact |
| `scripts/determinism.mjs` | script | batch | `scripts/notices.mjs` | role-match |
| `package.json`, `pnpm-lock.yaml` | config | - | `package.json` | exact |
| `src/engine/calendar.ts` | utility | transform | `src/engine/game.ts:237-245` (`turnLabel`) | exact (move) |
| `src/engine/coefficients.ts` | config/model | static data | `src/engine/game.ts:59-83` (`C`) + `budget.ts:5-33` (`Lever` table) | exact |
| `src/engine/units.ts` | config | static data | `src/engine/congress.ts:4-5` (named consts) | role-match |
| `src/engine/decisions.ts` | service | request-response (pure) | `src/engine/congress.ts:23-39` (`tally`, `voteOutcome`) + `budget.ts:55-64` (`estimate`) | role-match |
| `src/engine/trace.ts` | utility | transform | none in repo (use RESEARCH Pattern 2) | none |
| `src/engine/modifiers.ts` | model | event-driven (pure) | none in repo (use RESEARCH Pattern 6) | none |
| `src/engine/score.ts` | utility | transform | `src/engine/game.ts:203-235` (moved verbatim) | exact (move) |
| `src/engine/game.ts` (MOD) | engine core | request-response | itself | - |
| `src/content/parties.ts` | content/data | static | `src/content/sample.ts` | exact |
| `src/app/options.ts` | model (types) | - | `src/app/screens.ts` (type + table), `Start` in `game.ts:9` | role-match |
| `src/app/session.svelte.ts` (MOD) | store | CRUD (draft) | itself | - |
| `src/app/session.test.ts` | test | request-response | `src/engine/game.test.ts` (play loop) | role-match |
| `src/screens/NewGame.svelte` | component (screen) | request-response | `src/screens/Congress.svelte` (+ `ScreenLayout`) | role-match |
| `src/screens/Game.svelte` | component | - | `src/App.svelte` body (moved) | exact (move) |
| `src/App.svelte` (MOD) | component | - | itself | - |
| `src/ui/StatusBar.svelte` (MOD) | component | - | itself (`title=` convention, line 12/22) | - |
| `src/screens/Congress.svelte` (MOD) | component | - | itself | - |
| `src/engine/budget.ts` (MOD: `basis`/`note` on `Lever`) | model | static | itself | - |
| `src/data/us.ts` (MOD: drop `POTENTIAL_GROWTH`) | data adapter | transform | itself | - |

## Pattern Assignments

### `src/engine/rng.ts`, `detmath.ts`, `hash.ts` (utility, transform)

**Analog:** `src/engine/game.ts` lines 85-107 (the code being replaced) for placement/idiom: pure exported functions, doc comment per function, no state.

```ts
// game.ts:86-92  (idiom to keep: JSDoc one-liner, Math.imul integer ops, /4294967296 uniform)
/** mulberry32: returns [value in 0..1, next state]. */
export function nextRandom(state: number): [number, number] {
  const s = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  ...
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}
// game.ts:107
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
```
Body comes from RESEARCH Patterns 1 (rng) verbatim; `detmath.ts` exports `clamp` (moved from `game.ts:107`), `tanhPade`, `ipow`. `hash.ts`: no analog; follow RESEARCH Don't-Hand-Roll row (sorted keys, float64 bits, canonical -0, throw on non-finite). Delete `nextRandom`, `normals`, `GameState.rng` in `game.ts` (grep confirmed nothing else uses them).

### `src/engine/game.ts` (MOD across P01, P04, P05, P06; sequential, one plan per wave)

Exact edit anchors (line numbers at HEAD):
- P01: line 146 `normals(state.rng, 3)` becomes three `normal(state.seed,'macro',state.turn,'gap'|'infl'|'appr')`; line 153 `Math.tanh(after.growth)` becomes `tanhPade`; remove `rng` from `GameState` (line 45), `newGame` (line 114), return (line 191); remove `nextRandom`/`normals` (85-105).
- P04: `Decisions` (54-57) becomes `{ bill?: Bill }`; line 148 `decisions.budget ?? state.policy` and line 173 `decisions.budget ? ...` become `r?.valid && r.passed`; line 194 `decisions.clout ?? 0` becomes the engine-computed `r.cloutDelta`; delete `turnLabel`/`SEASONS`/`START_QUARTER` (237-245).
- P05: replace `C` (60-83) with import from `./coefficients`; ledger per equation in `step` (156-187); move 203-235 to `score.ts` and re-export from `game.ts` so `session.svelte.ts:3`, `OvalOffice.svelte`, `balance.test.ts:4` imports keep working.
- P06: `endTurn(state, decisions = {}, opts: StepOptions = {})` (line 139); `legacy()` (225-229) passes `{ legacy: true }`.

Guard and early-return idiom to keep (lines 139-141):
```ts
export function endTurn(state: GameState, decisions: Decisions = {}): GameState {
  return state.turn >= TOTAL_TURNS ? state : step(state, decisions);
}
```
Keep order quirks noted in RESEARCH Pattern 2: approval is `Math.round(clamp(...))` (line 186), fedRate is clamp(round(...)) (line 164).

### `src/engine/calendar.ts` (utility, transform) - MOVE of existing code

**Analog:** `src/engine/game.ts:237-245` (copy verbatim, rename `turnLabel` to `realQuarterLabel`).
```ts
const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'] as const;
const START_QUARTER = 2026 * 4 + 3; // Q4 2026: the game starts in the present (design Q19)
export function turnLabel(turn: number): string {
  const q = START_QUARTER + turn - 1;
  return `${SEASONS[q % 4]} ${Math.floor(q / 4)}`;
}
```
Add `termParts`/`termLabel`/`MIDTERM_TURNS`/`REELECTION_TURN` from RESEARCH Pattern 5. Note: `2026 * 4 + 3` has numeric literals; `calendar.ts` must be added to the literal-scan exemption list (or `units.ts` constants used), else P05's scan fails on it.

**Test:** move the three `turnLabel` assertions from `game.test.ts:32-36` into `calendar.test.ts` (renamed `realQuarterLabel`), same `it('starts in the present and labels quarters')` style; delete them from `game.test.ts` (and the `turnLabel` import on line 2) in P04.

### `src/engine/coefficients.ts` (config, static data)

**Analog:** `game.ts:59-83` (`C`, with trailing unit comments) and `budget.ts:5-33` (typed interface + table + `as const`/`satisfies`).
```ts
// budget.ts:5-15 interface-then-table style; congress.ts:20 satisfies style
export const deals = [ ... ] as const satisfies readonly { id: string; title: string; ... }[];
```
Use `as const satisfies Record<string, Coeff>` (RESEARCH Pattern 7). Keep the existing 22 keys + their trailing comments as `unit`/`note` seeds; add `potentialGrowth` (from `src/data/us.ts:13-14`, whose `// ponytail:` comment cites CBO ~1.8-2%). `budget.ts` `Lever` gets `basis`/`note` fields; all 11 table rows need them (every row literal at `budget.ts:18-32`).

**Test analog:** `budget.test.ts` (small `describe` per module, `expect(...).toEqual`). Literal scan test uses `src/testing/scan.ts`.

### `src/engine/decisions.ts` (service, pure request-response)

**Analog:** `src/engine/congress.ts:23-39` for pure-function style and `budget.ts:55-64` for iterating the known lever list.
```ts
// congress.ts:36-39  (call as-is inside resolveBill)
export function voteOutcome(total: number, spent: number) {
  const passed = total >= TO_PASS;
  return { passed, cloutBack: passed ? 10 : Math.floor(spent / 2) };
}
// budget.ts:56-58  (iterate KNOWN levers; sanitizeBudget copies this shape)
for (const l of all) { const d = (draft[l.id] ?? l.base) - l.base; ... }
```
Gotchas: `budget.ts` exports `taxLevers`/`spendLevers` but `all` (line 35) is not exported; import the two arrays. `congress.ts` exports `deals` (rename on import to `DEALS` per RESEARCH). The magic `10`/`2` in `voteOutcome` move to `RULES` in P05 (it is in `congress.ts`, so exempt it from the literal scan as "data" or register them).

**Test analog:** `budget.test.ts:12-30` (tally/voteOutcome assertions). The `passingBill` helper (deals `['mod','cen','spc']`) is verified by `budget.test.ts:18-19`.

### `src/engine/trace.ts`, `src/engine/modifiers.ts` (no analog)

No class-based or event-driven modules exist; copy RESEARCH Pattern 2 (`Ledger`, `SOURCES`) and Pattern 6 (`Modifier`, `Scheduled`, `RESOLVERS`, `activeAt`) verbatim. Follow file-header comment convention above. `Ledger.clamp/round` use `Math.min/max/round` (allowed by the purity scan).

### `src/engine/score.ts` (utility) - MOVE

**Analog:** `game.ts:203-235` verbatim (`prosperity`, `LEGACY_QUARTERS`, `legacy`, `finalScore`). `legacy` calls `step`, so export `step` (or `endTurn` internals) from `game.ts` to avoid a circular import; simplest is keep `legacy`/`finalScore` imports from `./game` re-exporting `./score`, with `score.ts` importing `step` via a thin export. Decide in P05 (`score.ts` importing `game.ts` which re-exports `score.ts` is a cycle; avoid by leaving `legacy` in `game.ts` and moving only `prosperity` + SCORE weights).

### `src/engine/replayFixture.ts` (utility, batch)

**Analog:** `balance.test.ts:15-19` for the play loop, `fixture.ts:4-19` for the start fixture.
```ts
// balance.test.ts:15-19
function run(seed: number, budget: BudgetDraft | null): GameState[] {
  const out = [newGame(seed, START)];
  for (let t = 1; t < TOTAL_TURNS; t++) out.push(endTurn(out[t - 1]!, t === 1 && budget ? { budget } : {}));
  return out;
}
```
Imports `START` from `./fixture` (already non-UI, pure). It returns a JSON string of `stableHash(state)` per turn; must have zero imports from `app/ui/screens` (the purity scan enforces this).

### `src/testing/scan.ts` + `purity.test.ts` / literal-scan / `party.test.ts` (test support / test, file-I/O)

**Analog:** `src/app/screens.test.ts:1-3, 21-28`.
```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
...
const files = readdirSync('src', { recursive: true, encoding: 'utf8' }).filter((f) => /\.(svelte|css)$/.test(f));
const offenders = files.filter((f) => /.../.test(readFileSync(join('src', f), 'utf8')));
expect(offenders).toEqual([]);
```
Reuse this exact shape (`readdirSync('src', { recursive: true })`, relative to repo root cwd, `expect(offenders).toEqual([])`), filtered to `engine/**/*.ts` minus `*.test.ts`. The assertion style `toEqual([])` gives a readable failure list; use it for `hits`/`literals`. `scan.ts` body: RESEARCH "Source-scan tests". Self-test with inline strings.

### `scripts/determinism.mjs` (script, batch)

**Analog:** `scripts/notices.mjs` (ESM `.mjs`, header comment with usage lines, `node:` imports, `process.exit(1)` on failure, `console.error`/`console.log`).
```js
// notices.mjs:1-5, 27-31
// Generates THIRD_PARTY_NOTICES.md ...
// usage: node scripts/notices.mjs            (write)
import { execFileSync } from 'node:child_process';
...
if (!existsSync(file) || readFileSync(file, 'utf8') !== body) {
  console.error(`${file} is stale: run node scripts/notices.mjs`);
  process.exit(1);
}
```
Body from RESEARCH Pattern 9. Add `"determinism": "node scripts/determinism.mjs"` next to `"notices": "node scripts/notices.mjs"` in `package.json` scripts (line 12). Dev dep line goes in `devDependencies` alphabetically (exact pin, no `^`, matching existing style, e.g. `"vitest": "5.0.3"`): `"@playwright/test": "1.64.0"`. Run `node scripts/notices.mjs --check` after (prod tree only; should stay clean).

### `src/content/parties.ts` (content, static data)

**Analog:** `src/content/sample.ts` (header comment, plain exported `const`s, `as const`).
```ts
export const suggestions = [ { title: 'Pass a budget', cta: 'Open Budget', target: 'budget' }, ... ] as const;
```
Header comment should say it is the only file allowed to name parties.

### `src/app/options.ts` (model/types)

**Analog:** `src/app/screens.ts` style (type + registry in `src/app`, no runes). Just `export type PartyId = 'D' | 'R'; export interface GameOptions { party: PartyId }`. Export `PartyId` derived from `PARTIES` if you want a single source (`(typeof PARTIES)[number]['id']`, same idiom as `DealId` at `congress.ts:21`).

### `src/app/session.svelte.ts` (MOD, store) - P02 (constructor/options) then P04 (bill)

P02 edit (line 43): `constructor(seed: number, start: Start, readonly options: GameOptions)`.
P04 edits, anchors at HEAD:
- Line 36-38 `spent`/`clout`/`whip` deriveds become `bill`/`preview`/`clout`/`whip`/`vote` from RESEARCH Pattern 3; keep the `$derived(...)` class-field style already used.
- `Draft.vote` (line 11, 20) becomes boolean `voteCalled`; `callVote()` (66-70) sets `this.draft.voteCalled = true`; `makeDeal` (60-64) gates on `this.current.clout - cost(deals + this)`.
- `nextTurn` (72-80): keep the structure, replace the decisions construction:
```ts
// current (72-78) - keep the guard `if (next === this.current) return;` and the autopilot line
const next = endTurn(this.current, decisions);
if (next === this.current) return;
this.history = [...this.history, next];
this.autopilot = [...this.autopilot, endTurn(this.autopilot[this.autopilot.length - 1]!)];
this.draft = freshDraft(next.policy);
```
- Use `$state.snapshot(...)` for any draft object sent to the engine (existing line 74 precedent).
Session test (`session.test.ts`, MEDIUM risk: no existing test imports a `.svelte.ts`); `vite.config.ts` loads `svelte()` so it should compile; fall back to engine-level test plus source scan if not.

### `src/screens/Congress.svelte` (MOD, 3 reads)

Line 36 `const vote = $derived(session.draft.vote);` becomes `$derived(session.vote)`; line 100 `disabled={done || !!vote || session.clout < d.cost}` unchanged if `vote` alias kept; line 87-88 read `vote.passed/total/cloutBack` (same shape, unchanged if `session.vote` keeps `{ total, passed, cloutBack }`). Line 104 `{#if !vote}` unchanged. Pre-existing hard-coded copy "+10 clout" (line 88) can stay.

### `src/screens/NewGame.svelte` (component, request-response)

**Analog:** `src/screens/Congress.svelte` structure: `<script lang="ts">`, `$props()`, `ScreenLayout` with `{#snippet main()}`, `{#snippet next()}`, scoped `<style>` using design tokens (`var(--ink)`, `var(--card)`), no colour literals (`screens.test.ts:22-27` fails the build on `#hex`/`rgb(`).
```svelte
<!-- Congress.svelte:10, 44-45, 83-84, 104 -->
let { session, question }: { session: Session; question: string; go: ... } = $props();
<ScreenLayout {question}>
  {#snippet main()} ... {/snippet}
  {#snippet next()}
    <div class="card info" aria-live="polite"><span class="label">What it means</span> ... </div>
    <div class="spacer"></div>
    <button class="stamp" onclick={...}>Call the vote</button>
  {/snippet}
</ScreenLayout>
```
Props for NewGame: `{ onStart }: { onStart: (o: GameOptions) => void }`. Use `class="card"`, `class="label"`, `class="stamp"` (global classes from `design/global.css`), `.spacer { flex-grow: 1 }` and `.stamp { align-self: center }` as at `Congress.svelte:138-139`. Radios are native `<input type="radio">` in a `role="radiogroup"`. `ScreenLayout` requires `question` and `next` (`learn`, `main` optional per props type; `main` is declared required, so pass it).

### `src/screens/Game.svelte` + `src/App.svelte` (MOD) - MOVE

Game.svelte: move `src/App.svelte` lines 1-41 verbatim; change only line 12: `const session = new Session(...)` becomes `let { session }: { session: Session } = $props();` (keep `screen`/`go` deriveds at 13-14, template 17-34, and the full `<style>` block 36-41). Fix import depths: `./app/...` becomes `../app/...`, `./screens/Budget.svelte` becomes `./Budget.svelte`, `./ui/...` becomes `../ui/...`.

New App.svelte: RESEARCH Pattern 8 snippet. `fromData, us` imports stay (`'./data/us'`); `let session = $state.raw<Session | null>(null)` matches `$state.raw` use in `session.svelte.ts:29`. Seed stays `Date.now() | 0` (existing App.svelte:12). Note `Date.now()` is in `src/App.svelte`, outside `src/engine`, so the purity scan does not flag it.

### `src/ui/StatusBar.svelte` (MOD)

Line 2: replace `turnLabel` import with `import { realQuarterLabel, termLabel } from '../engine/calendar';` (keep `TOTAL_TURNS, type GameState` from `../engine/game`). Line 32 becomes `Turn {state.turn} of {TOTAL_TURNS} · {termLabel(state.turn)}` inside an element carrying the tooltip, following the existing convention at lines 12 and 22:
```svelte
<div class="stat" title="Real term: approval rating">
<div class="when">Turn {state.turn} of {TOTAL_TURNS} · {turnLabel(state.turn)}</div>
```
New: `<div class="when" title="Real calendar: {realQuarterLabel(state.turn)}. Your term is fictional and off-cycle." tabindex="0">`. Svelte a11y may warn on `tabindex` on non-interactive element; run `pnpm check` and, if it warns, drop it and leave an OBS-07 note (RESEARCH Pitfall 8).

### `src/data/us.ts` (MOD)

Remove lines 13-14 (`// ponytail:` comment + `POTENTIAL_GROWTH = 1.8`) and use `COEFF.potentialGrowth.value` (import from `'../engine/coefficients'`); `data/us.ts:1` already imports from `../engine/game`, so engine-to-data import direction is established. Keep the line 13 CBO comment text as the `note`. `src/data/us.test.ts` is the existing test to keep green.

### Existing tests to edit (P04)

- `balance.test.ts:15-19` `run()`: `t === 1 && budget ? { budget } : {}` becomes `{ bill: passingBill(budget) }` with shared helper `passingBill = (b) => ({ budget: b, deals: ['mod','cen','spc'] })`; add an assertion that turn-1 vote passed (RESEARCH Pitfall 1). Put the helper in a test-support file (e.g. `src/testing/bills.ts`) alongside `scan.ts`.
- `game.test.ts`: structure to copy for new engine tests (`play(seed)` helper lines 5-9; `structuredClone` frozen-input check lines 17-25 is the template for the "engine does not mutate decisions" test).

## Shared Patterns

### Pure engine / no UI imports
**Source:** `game.ts:1` header, enforced by new `purity.test.ts`. **Apply to:** all `src/engine/*.ts` non-test files. Only `abs min max floor ceil round trunc sign imul clz32 fround` of `Math`; no `**`, `Date`, `Intl`, `crypto`, `performance`.

### Sourced-or-judgement constants
**Source:** `game.ts:2-3` header ("hand-set round numbers... every one is named here") and trailing unit comments `game.ts:61-83`. **Apply to:** `coefficients.ts`; after P05 no numeric literal besides 0/1/-1 in engine non-test files except exempt files (`coefficients.ts`, `units.ts`, `rng.ts`, `hash.ts`, `budget.ts`, `congress.ts`, `calendar.ts`, `fixture.ts`).

### Source scan via filesystem + vitest
**Source:** `src/app/screens.test.ts:21-28`. **Apply to:** purity, literal, party-blind, `draft.vote` leftovers.

### Immutable state in, new state out
**Source:** `game.ts:189-200` (`return { ...state, ... }`) and `game.test.ts:17-25` (input not mutated, last turn returns same reference). **Apply to:** `step`, resolvers, modifier folding (return new arrays; never mutate `state.modifiers`).

### Untrusted input at the boundary
**Source:** none strong in repo; `data/us.ts:7-10` `num()` is the closest "fail loudly" idiom (`throw new Error(...)`). **Apply to:** `stableHash` (throw on non-finite) and `sanitizeBudget`.

### Design tokens only in `.svelte`/`.css`
**Source:** `screens.test.ts:22-27`. **Apply to:** `NewGame.svelte`, `Game.svelte`, `StatusBar.svelte` (use `var(--ink)` etc.).

### CI / commands
**Source:** `.github/workflows/ci.yml` (tracked), `package.json` scripts `test`, `check`, `build`, `notices`. Per-wave gate: `pnpm test && pnpm check && pnpm build`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/engine/trace.ts` | utility (class) | transform | No classes/ledgers in engine; use RESEARCH Pattern 2 |
| `src/engine/modifiers.ts` | model | event-driven | No event/scheduled mechanism exists; use RESEARCH Pattern 6 |
| `src/engine/hash.ts` | utility | transform | No hashing code in repo; use RESEARCH (cyrb53-style, sorted keys) |
| `src/testing/scan.ts` (AST part) | test support | transform | Only regex fs scan exists; AST body from RESEARCH |
| `src/app/session.test.ts` | test | - | No existing test imports a rune file (`.svelte.ts`); treat as MEDIUM risk, try first in P02 |

## Metadata

**Analog search scope:** `src/engine`, `src/app`, `src/screens`, `src/ui`, `src/content`, `src/data`, `scripts`, `package.json`, `vite.config.ts` (34 tracked files under `src`/`scripts`).
**Files scanned:** 14 read in full or in part (game.ts, session.svelte.ts, App.svelte, StatusBar.svelte, ScreenLayout.svelte, Congress.svelte, congress.ts, budget.ts, fixture.ts, balance/game/budget tests, screens.test.ts, notices.mjs, us.ts, sample.ts).
**Pattern extraction date:** 2026-10-10
