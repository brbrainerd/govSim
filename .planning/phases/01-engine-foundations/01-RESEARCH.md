# Phase 1: Engine foundations - Research

**Researched:** 2026-10-09
**Domain:** Deterministic, replayable TypeScript simulation engine (keyed RNG, bit-reproducible math, causal trace, raw-input decisions, term calendar, coefficient registry) inside an existing Svelte 5 / Vite 8 / vitest 5 app
**Confidence:** HIGH for D10 determinism (measured on 5 engines), RNG/trace/decision designs (prototyped against the real engine), calendar. MEDIUM for coefficient citations (several sources seen only as search snippets) and for UI details (Session test with runes not yet tried).

<user_constraints>
## User Constraints (no CONTEXT.md exists)

The user chose to plan from research + requirements instead of running `/gsd-discuss-phase`. The decisions in `.planning/research/SUMMARY.md` (D1-D11), already applied in `REQUIREMENTS.md` and `ROADMAP.md`, are therefore the locked decisions. Copied verbatim from `REQUIREMENTS.md` line 6:

### Locked Decisions
"Decisions applied (research/SUMMARY.md): D1 term-relative calendar · D2 exogenous crises identical, endogenous labelled · D3 minimal midterms · D4 tipping-point centring + party pick · D5 EOs expire in legacy · D6 axe dev-only exception · D7 MIT + CC BY 4.0 · D8 public title deferred · D9 subdomain of an owned domain, private until public link · D10 bit-reproducible engine math · D11 one projected-final headline. Deploy: Coolify (Docker) on Hetzner, GHCR, auto-promote on push to main, Cloudflare R2 for assets."

Phase-1-relevant ones, restated: D1 (Year N · Season labels, turn 1 = Winter, turn 8 = Fall Y2, turn 16 = Fall Y4, real date in a tooltip), D2 (exogenous crises identical for autopilot), D4 (party pick at New Game; engine stays party-blind), D5 (EOs do not carry into legacy), D10 (ban transcendental `Math` in `src/engine`; arithmetic-only replacements; verify on Node + WebKit + Firefox), D11 (Phase 3 concern; Phase 1 must not block it).

### Claude's Discretion
Everything not listed above: file layout of the engine, exact term/source ids, hash function, RNG construction, normal-deviate method, tanh replacement, registry shape, plan decomposition, New Game layout.

### Deferred Ideas (OUT OF SCOPE)
`REQUIREMENTS.md` "Future Requirements" and everything owned by Phases 2-8: save format/autosave/CI/CSP/deploy (Phase 2), report card UI and charts (Phase 3), crisis content and director (Phase 4), EOs/courts/Fed chair/speeches (Phase 5), voters/Electoral College/midterms (Phase 6), election night/second term (Phase 7), badges/share codes (Phase 8). Phase 1 builds only the mechanisms those phases plug into.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REL-01 | LICENSE, LICENSE-ASSETS, TRADEMARKS.md, CONTRIBUTING.md (DCO), generated notices | ALREADY DONE in commit bb36df0 (files verified present; `LICENSE` starts "MIT License"). Do NOT re-plan. Only gap: GitHub shows a license only once the files are on the default branch `master`; repo is on `game-pivot` (no `origin/game-pivot`). User must push and merge. See Open Question 5. |
| FND-01 | No-decision player faces the same shocks as autopilot, whatever else they do | Keyed `draw(seed, stream, turn, key)` (Pattern 1), `report.luck` shock log, 200-seed test |
| FND-02 | Saved game replays identically in Chromium, WebKit, Firefox | D10 spike (measured drift, zero-drift fix), source scan, `scripts/determinism.mjs` (Pattern 9) |
| FND-03 | "Year N · Season" labels, real date in tooltip, midterm Y2 Fall, reelection Y4 Fall | `calendar.ts` (Pattern 5) |
| FND-04 | Every indicator change = sum of named causes incl. luck | Ledger + step restructure (Pattern 2), conservation test |
| FND-05 | Clout charged by engine from raw choices; preview == result | `decisions.ts` (Pattern 3) |
| FND-06 | Legacy runs with no new events; EOs do not carry | `StepOptions.legacy` + modifier tags (Pattern 6) |
| FND-07 | Every coefficient has citation or "judgement" tag + range | `coefficients.ts` registry + literal scan (Pattern 7) |
| FND-08 | Party pick at New Game; engine party-blind | Party lives in Session options, never in engine (Pattern 8) |
</phase_requirements>

## Summary

The current engine is small (`game.ts` 245 lines) and already pure, but it fails the Phase 1 bar in five measurable ways. (1) It is **not cross-engine reproducible**: I ran the exact current engine (200 seeds x 4 strategies x 31 turns, 349,600 values) on Node 26 (V8), Chromium 156, Firefox 157 (SpiderMonkey), WebKit 27.2 and the macOS system JavaScriptCore. Every engine pair disagrees: 1,908 to 9,213 values differ, up to 5.3e-13 relative, and 600 of 800 runs differ somewhere. The cause is `Math.log/cos/sin/tanh/exp/atan`, which all differ between engines (even Node's V8 vs Chromium's V8). (2) One chained `state.rng` threads three draws per turn. (3) `Decisions.clout` is a UI-computed net delta. (4) Causes are local variables inside `step()`. (5) Calendar labels and legacy gating are wrong for the new design.

The fix is mostly mechanical and I prototyped the risky parts. A keyed hash RNG (murmur3 `fmix32` chain, integer ops only) plus Irwin-Hall(12) normals plus a Pade tanh makes the engine arithmetic-only. The prototype produced **0 differing values out of 349,600** on all five engines, also when minified. Swapping the RNG and tanh shifts the balance harness means by at most 0.12 index points (200 seeds), and the existing three `balance.test.ts` tests pass unchanged. A ledger-based `step()` (named terms, explicit `clamp`/`rounding` residuals) prototyped against the real equations conserves to 7e-12 over 37,200 steps and matches the untraced engine to 1.7e-10.

Because `game.ts` is the hotspot and every requirement except FND-03/FND-08 edits it, the plan decomposition below makes game.ts-touching plans strictly sequential (one per wave) and puts everything else in new files that can run in parallel in Wave 1. A tolerance-based characterization check carries behaviour across the refactor waves.

**Primary recommendation:** Build Wave 1 as three file-disjoint plans (deterministic core, calendar+party UI, coefficient registry data), then four sequential game.ts plans (raw-input decisions, ledger+registry step rewrite, modifiers/scheduled/legacy, integration), with `pnpm determinism` (Playwright, Node vs 3 browsers, unminified and minified) as the FND-02 proof.

## Architectural Responsibility Map

This is a client-only static app, so "tiers" are the code layers in `ARCHITECTURE.md`.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Keyed RNG, shocks, luck log | Engine (`src/engine`) | - | Pure function of (seed, stream, turn, key); no UI input may reach it |
| Causal trace / ledger, residual terms | Engine | - | Engine is the only source of causal truth (Core Value); UI only words it (Phase 3) |
| Clout cost, bill vote, preview | Engine (shared pure fns) | Session (calls same fns for preview) | Preview and result must be literally the same function (FND-05) |
| Coefficient registry + citations | Engine (`coefficients.ts`) | Content gate (Phase 2 reads it) | Model constants are engine data; citations are metadata on them |
| Term calendar labels, election turns | Engine (`calendar.ts`, pure) | UI (StatusBar renders, `title` tooltip) | Phases 6/7 need election turns without UI |
| Party pick | UI (NewGame) + Session options | Save `options` (Phase 2) | Engine must never see it; strongest blindness is absence |
| Modifier / scheduled-effect mechanism | Engine | - | Phases 4 and 5 plug in content tables |
| Legacy gating | Engine (`StepOptions.legacy`) | - | One flag in step, not a second step function |
| Cross-browser determinism check | Tooling (`scripts/determinism.mjs`) | CI (Phase 2) | Needs real browsers; not a vitest unit |
| Source scans (banned Math, literals, purity) | Test layer (vitest reading `src/`) | CI | Extends existing `screens.test.ts` pattern |

## D10 Spike Results (answers question 1)

**Method** [VERIFIED: ran this session]. Bundled the unmodified `src/engine/game.ts` with a Vite lib build (iife, unminified) and a driver running seeds 1-200 x {autopilot, Infrastructure push, Tax cut, tariffs 35} x 31 turns, dumping 14 fields per turn plus `finalScore`. Ran it in Node 26.10.0, system JSC (`/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`), and, via `@playwright/test`-family `playwright@1.64.0` installed in a scratch dir outside the repo, Chromium 156.0.8078.4, Firefox 157.0 and WebKit 27.2. JSON number text is the comparison (ECMAScript number-to-string is exact, so equal text means equal bits).

| Comparison (current engine) | Values differing of 349,600 | Max relative diff |
|---|---|---|
| Node 26 (V8) vs Chromium 156 | 7,610 | 3.2e-13 |
| Node 26 vs Firefox 157 (SpiderMonkey) | 1,908 | 3.0e-13 |
| Node 26 vs WebKit 27.2 | 8,875 | 5.3e-13 |
| WebKit (Playwright) vs system `jsc` | 0 | 0 |
| Firefox vs WebKit | 9,213 | 5.3e-13 |

- 600 of 800 runs differ somewhere; first divergence lands on turns 2-32 (spread evenly). Differences are in `gap`, `growth`, `unemployment`, `inflation`, `gdp`, `realIncome`, `crime`. In this sample `approval`, `fedRate` and `clout` (the rounded fields) never flipped, so no discrete flip was observed, but nothing prevents one: thresholds in Phases 4-7 (crisis, election) would flip eventually. 80 of 800 runs differ in `finalScore` at full precision.
- Per-function probe (20,000 inputs each, hash compare): `Math.log`, `cos`, `sin`, `tanh`, `exp`, `atan` differ on every pair of Node/Chromium/Firefox/WebKit. `Math.sqrt` was identical everywhere, and `Math.pow` was identical for the one exponent probed (not evidence for pow in general). Even two V8 builds (Node 26 and Chromium 156) differ, so "V8 is the same everywhere" is false. [VERIFIED: ran this session]
- All five runs were on one arm64 Mac. Linux x86-64 was not tested here; the arithmetic-only fix does not depend on the CPU (ECMAScript `+ - * /` and `Math.imul` are IEEE-754 binary64 / 32-bit-integer exact), but Phase 2's Linux CI run is the second-architecture proof. [ASSUMED: spec reasoning for x86; see A2]

**Replacement prototype** [VERIFIED: ran this session]. Keyed hash RNG (`rng.ts` below), Irwin-Hall(12) normals, Pade tanh, nothing else changed:

- Cross-engine: Node vs Chromium, Firefox, WebKit, system JSC: **0 of 349,600 values differ**. A minified build (Vite 8 default minifier, `minify: true`) also equals the unminified Node output: 0 differ. Minifier safety is worth re-checking in the script because a minifier rewriting `x / 400` to `x * 0.0025` would change bits; it did not here.
- Accuracy: 200 seeds x 5 strategies, mean final `total` (old to new): autopilot 64.86 to 64.82, sensible 65.39 to 65.36, maxDeficit 49.05 to 48.94, austerity 67.61 to 67.59, tariffEverything 63.78 to 63.70; SDs 0.6-0.8 unchanged; mean approval changes <= 0.3; debt % identical to 0.1. The repo's `balance.test.ts` (3 tests) passes unchanged against the prototype engine.
- Distribution: Irwin-Hall(12) over 100k draws: mean -0.002, variance 0.997, kurtosis 2.89 (normal = 3), max |z| 4.14, P(|z|>2) = 0.0443 (normal 0.0455); support is bounded at +-6. Sibling keys of one cell are uncorrelated (r = -0.002). Uniforms: mean 0.5009, var 0.0834 (1/12 = 0.0833), lag-1 and lag-500 correlation <= 0.001, chi-square(19 dof) = 22.2.
- Pade tanh `x(27+x^2)/(27+9x^2)` clamped to +-1 outside |x| >= 3: max absolute error vs `Math.tanh` is 0.0235 (at |x| = 1.57); smooth (zero slope at +-3) and odd. It feeds `potentialMax * tanh(after.growth)` with `potentialMax = 0.25`, so the model effect is below 0.006 potential-growth points. Shape (monotone, saturating, odd) is what the model needs, not accuracy.
- Collisions: 777,600 cells (200 seeds x 6 streams x 72 turns x 9 keys) gave 94 equal 32-bit cell hashes, which is the birthday expectation (about 70). **Do not write a test asserting zero collisions across all cells**; it will fail. Test statistical quality instead.

**Banned / allowed `Math` for `src/engine`:** allow exactly `abs min max floor ceil round trunc sign imul clz32 fround` (all exact by specification or integer-valued). Ban every other `Math.*` (`log exp pow sin cos tan tanh atan atan2 hypot cbrt expm1 log1p log2 log10 sinh cosh asinh random sqrt ...`), the `**` operator, `Date`, `performance`, `crypto`, `Intl`, `toLocale*`. `sqrt` is excluded on purpose: nothing needs it once Irwin-Hall replaces Box-Muller (a 4-uniform variant would need `sqrt(3)`; use the literal `1.7320508075688772` if ever needed). The task brief calls `Math.sqrt` correctly rounded; all five engines agreed on it, but ECMAScript describes it as implementation-approximated [ASSUMED], so keeping it off the allow-list costs nothing.

**Future needs.** If a later phase needs growth compounding, decay or `(1+r)^n`: use an integer-exponent loop (`ipow`, repeated multiplication is deterministic). If it needs `ln`/`exp`: write a fixed-iteration series using only `+ - * /` and add a cross-browser test; avoid by using probabilities as comparisons of a uniform (`draw(...) < p`) rather than hazards computed via `exp`.

## Standard Stack

### Core
No new runtime dependencies. The engine stays dependency-free TypeScript (Constraint: static site, pure deterministic engine).

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 5.0.3 (installed) | All Phase 1 tests incl. source scans | Already the project runner; `screens.test.ts` already scans `src/` with `node:fs` [VERIFIED: package.json, screens.test.ts] |
| TypeScript | 6.0.3 (installed) | `strict`, `noUncheckedIndexedAccess` already on | [VERIFIED: tsconfig.json] |
| Vite (JS API) | 8.3.4 (installed) | `build()` in `scripts/determinism.mjs` to bundle the engine fixture to an iife string for browsers | Avoids a second bundler [VERIFIED: ran an equivalent lib build this session] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @playwright/test | 1.64.0 (exact, devDependency) | `chromium`/`firefox`/`webkit` launchers for `scripts/determinism.mjs` | Only dev dependency Phase 1 adds. Phase 2 needs it anyway (STACK.md). `import { chromium, firefox, webkit } from '@playwright/test'` works [VERIFIED: ran]. Apache-2.0 [VERIFIED: npm view]. `pnpm add -D --save-exact @playwright/test@1.64.0 --ignore-scripts` succeeds under this repo's `pnpm-workspace.yaml` (release-age rule passes) [VERIFIED: ran in a scratch copy]. |

`fast-check` is **not** added in Phase 1 (OBS-03 is Phase 2). Use plain seed loops (`for seed of 1..200`) as `balance.test.ts` does.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| murmur3-fmix32 chain RNG | `seedrandom`, Philox/PCG libs | Libraries add a dependency and (seedrandom) can touch `Math.random`/`Math` functions; STACK.md rejected `seedrandom`. 15 lines of integer ops is cheaper and the cross-browser test proves it. |
| Irwin-Hall(12) normal | Box-Muller / Acklam inverse CDF / ziggurat | All need `log`/`sqrt`/`exp` or tables. Irwin-Hall is exact arithmetic, bounded at 6 sigma, variance exactly 1. |
| Pade tanh | `x/(1+abs(x))` softsign | Both fine; Pade is closer to tanh near 0 (error 0.0235 vs 0.1+). |
| Node-vs-3-browsers script | Run vitest inside browsers (vitest browser mode) | Extra dependency (`@vitest/browser`); the script is ~60 lines and CI-portable. |
| `stableHash` (cyrb53-style, sync, 53-bit) | `crypto.subtle.digest('SHA-256')` | `subtle` is async and secure-context only; Phase 2 may use it for save `check`. Phase 1 needs a sync, dependency-free structural hash. Non-cryptographic: not for tamper detection. |

**Installation (Plan P01, behind a human-verify checkpoint, see audit):**
```bash
pnpm add -D --save-exact @playwright/test@1.64.0 --ignore-scripts
pnpm exec playwright install chromium firefox webkit   # downloads to the user cache, not the repo
```

**Version verification:** `@playwright/test` 1.64.0 published 2026-10-07T20:44Z, `latest` dist-tag 1.64.0; 1.63.0 was 2026-09-04 [VERIFIED: npm view this session]. Browsers for 1.64.0 (chromium-1248, firefox-1555, webkit-2370) are already in `~/Library/Caches/ms-playwright` on this machine from the spike.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @playwright/test | npm | created 2020-09-24 (6 yrs), latest version 2 days old | 73.4M/wk | github.com/microsoft/playwright | SUS (`too-new`: latest release < 7 days) | Flagged: planner adds a `checkpoint:human-verify` before install. Risk is low: same signal flags `vite` and `vitest`, already in the repo; postinstall null; STACK.md already approved this exact pin. Fallback: pin 1.63.0 (35 days old) and re-download browsers. |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@playwright/test` (`too-new` only). Seam output: `postinstall: null`, `deprecated: false`, repo `microsoft/playwright` [VERIFIED: `gsd-tools query package-legitimacy check` this session]. Package name is from STACK.md (approved earlier), not from search; tagged [VERIFIED: npm registry + prior STACK.md approval].

## Architecture Patterns

### System Architecture Diagram

```
 Session (src/app, runes)                 Engine (src/engine, pure, arithmetic-only)
 ┌─────────────────────────┐   Decisions   ┌───────────────────────────────────────────────┐
 │ draft: budget, deals,   │──(raw only)──▶│ endTurn(state, decisions, opts)               │
 │        voteCalled       │               │   │                                           │
 │ previewBill(...) ◀──────┼── same pure ──│   ├─ resolveBill(clout, bill) ─▶ policy, clout│
 │ party (options) ────────┼─✗ never sent  │   │      terms: clout:deals / reward / refund │
 └──────────┬──────────────┘               │   ├─ shocks: normal(seed,'macro',turn,key)    │
            │ history[], autopilot[]       │   │     keys gap | infl | appr  ──▶ 'luck'    │
            ▼                              │   ├─ active modifiers (from<=turn<=until,     │
   StatusBar: termLabel(turn)              │   │     !(legacy && tag==='eo')) ─▶ named term│
   title = realQuarterLabel(turn)          │   ├─ scheduled resolvers (due==turn; skipped  │
                                           │   │     in legacy) ─▶ modifiers + log         │
                                           │   ├─ equations, each = Ledger of terms        │
                                           │   │     + explicit 'clamp' / 'rounding'       │
                                           │   └─▶ GameState' { econ…, modifiers,          │
                                           │          scheduled, report{trace,luck,log} }  │
                                           └───────────────────────────────────────────────┘
 scripts/determinism.mjs ── Vite build(iife) ──▶ Node + chromium + firefox + webkit
        (unminified and minified) ── stableHash chain per fixture log ── must all be equal
```

### Recommended Project Structure
```
src/engine/
├── rng.ts            # NEW  STREAM ids, cell/uniformAt/draw/normal            (P01)
├── detmath.ts        # NEW  tanhPade, ipow, clamp                              (P01)
├── hash.ts           # NEW  stableHash (sync, canonical, throws on non-finite) (P01)
├── calendar.ts       # NEW  termLabel, realQuarterLabel, election constants    (P02)
├── coefficients.ts   # NEW  COEFF/LIMITS/SCORE/RULES registry; C = values view (P03)
├── units.ts          # NEW  QUARTERS_PER_YEAR=4, PERCENT=100, BN_PER_TN=1000… (P03)
├── decisions.ts      # NEW  Bill, resolveBill, sanitizeBudget, cloutCost       (P04)
├── trace.ts          # NEW  Ledger, Term, TraceKey, SOURCES registry           (P05)
├── modifiers.ts      # NEW  Modifier, activeAt, Scheduled, resolvers hook      (P06)
├── score.ts          # MOVE prosperity/legacy/finalScore out of game.ts        (P05)
├── game.ts           # MOD  state, newGame, step (only integrator)
├── replayFixture.ts  # NEW  fixture input logs + hash chain for the browser script (P01, extended later)
└── *.test.ts         # rng, detmath, hash, purity, shocks, calendar, coefficients,
                      # decisions, trace, modifiers, legacy, determinism
src/content/parties.ts      # NEW  the only file allowed to name parties          (P02)
src/app/options.ts          # NEW  GameOptions { party } (Session/save, not engine) (P02)
src/screens/NewGame.svelte  # NEW                                                  (P02)
src/screens/Game.svelte     # NEW  current App body moved here                     (P02)
scripts/determinism.mjs     # NEW  cross-browser script, `pnpm determinism`        (P01)
```

### Pattern 1: Keyed RNG (answers question 2)
**What:** every random number is a pure function of `(seed, stream, turn, key[, k])`. No rng in `GameState`. Prototyped and measured (see spike).
**Stream ids** are part of the golden contract: **never renumber**; append only. `macro:1 events:2 court:3 fed:4 voters:5 election:6`.
**Shocks:** the existing three per-turn shocks become three keyed normals on stream `macro`, turn = `state.turn` at the start of the step: keys `'gap'`, `'infl'`, `'appr'` (previously draws 1-3 of one chained sequence). Adding a fourth macro key later cannot move these three. Autopilot shares draws by construction because both runs use the same `seed` and the draw reads no player state.
**Replace** `nextRandom`, `normals` and `GameState.rng` (nothing outside game.ts uses them [VERIFIED: grep `nextRandom|\.rng\b` outside game.ts returned nothing]).
```ts
// src/engine/rng.ts  (prototyped; 0 cross-engine diffs)
export const STREAM = { macro: 1, events: 2, court: 3, fed: 4, voters: 5, election: 6 } as const;
export type Stream = keyof typeof STREAM;
const mix = (h: number): number => {            // murmur3 fmix32
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) | 0;
};
const absorb = (h: number, w: number): number => mix(((h ^ w) + 0x9e3779b9) | 0);
export function keyHash(key: string | number): number {   // FNV-1a over UTF-16 units; ints pass through
  if (typeof key === 'number') return key | 0;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h | 0;
}
export const cell = (seed: number, stream: Stream, turn: number, key: string | number = 0): number =>
  absorb(absorb(absorb(absorb(0x2545f491, seed | 0), STREAM[stream]), turn), keyHash(key));
export const uniformAt = (c: number, k: number): number => (mix(absorb(c, k)) >>> 0) / 4294967296; // [0,1)
export const draw = (seed: number, stream: Stream, turn: number, key: string | number = 0, k = 0): number =>
  uniformAt(cell(seed, stream, turn, key), k);
/** Irwin-Hall(12) standard normal: mean 0, variance 1, support +-6. */
export function normal(seed: number, stream: Stream, turn: number, key: string | number): number {
  const c = cell(seed, stream, turn, key);
  let s = 0;
  for (let k = 0; k < 12; k++) s += uniformAt(c, k);   // fixed order = fixed rounding
  return s - 6;
}
```
`step()` uses `const zGap = normal(state.seed, 'macro', state.turn, 'gap')` etc. and records the raw values as `report.luck = { gap, infl, appr }`.

**Scheduled modifiers / delayed effects** (success criterion 2): see Pattern 6.

**FND-01 tests:** (a) For seeds 1-200, `history.map(s => s.report.luck)` is deep-equal for autopilot, a "no decisions" player, and 3 strategies (budget packages, max deficit, tariffs). (b) `draw`/`normal` are stateless: running a game with extra interleaved `draw(seed,'events',t,'x')` calls leaves every state deep-equal. (c) Known-answer vectors (a handful of `draw`/`normal` outputs as literal numbers) so an accidental constant change is caught. (d) Statistical sanity (mean/variance/lag correlation of 100k draws, loose bounds). (e) Optional hardening for Phases 4/5: a test-only draw tap that records `(stream, turn, key)` and asserts the set of draws in `step` is identical for any `Decisions`.

### Pattern 2: Ledger, named terms, trace (answers question 3)
**What:** each traced quantity gets a `Ledger` (ordered list of `{source, amount}`, merged by source). The equation is `value = before + ledger.sum`; clamps and rounding add explicit residual terms named `clamp` and `rounding`. Prototype over 200 seeds x 6 strategies x 31 turns = 37,200 steps: worst conservation error 7.3e-12 (income, dollars), <= 6e-14 elsewhere; traced values match the untraced engine to 1.7e-10 (dollars); no `clamp` residual above 1e-9 ever occurred in normal play [VERIFIED: ran this session].

**Trace keys and sources** (vocabulary for the current equations; `luck` is one id across indicators so "the luck line" is `sum(terms where kind==='luck')`):

| Trace key | Kind | Terms (source ids) |
|---|---|---|
| `gap` | delta | `momentum` (gapPersistence-1)*gap0; `budget` fiscalMultiplier*impulse; `debt:stress`; `fed:drag` -rateDrag*(realRate-neutral); `luck`; + modifiers channel `gap` |
| `growth` | **level** | `potential:base`, `potential:policy`, `potential:crowding`, plus 4 x each gap term (same source ids) |
| `unemployment` | delta | each gap term x (-okun) (same ids); `clamp` |
| `inflation` | delta | `expectations`; `demand` phillips*gap; `tariffs`; `luck`; modifiers channel `inflation`; `clamp` |
| `expected` | delta | `prices` |
| `fedRate` | delta | `fed:neutral` fedSmooth*(neutral+infl-fed0); `fed:inflationGap` fedSmooth*taylorInfl*(infl-2); `fed:outputGap` fedSmooth*taylorGap*gap; modifiers channel `fedTarget` x fedSmooth (Phase 5: `fed:chair`, `fed:pressure`); `rounding`; `clamp` |
| `debtPct` | delta | `deficit:base` (= start deficit%/4 per quarter); `deficit:budget`; `deficit:interest`; `gdp:growth` (dilution 100*debt0*(1/gdp1-1/gdp0)) |
| `income` | delta | `growth`; `budget:family` (only the turn a bill passes) |
| `empPop` | delta | unemployment terms x (-empPerU) |
| `lifeExp` | delta | `health:trend`; `health:spending`; `health:reversion` |
| `gini` | delta | `tax:income`; `spend:medicaid`; `gini:reversion`; `clamp` |
| `crime` | delta | `crime:jobs`; `crime:trend` |
| `trust` | delta | `trust:reversion`; `trust:approval`; `clamp` |
| `approval` | delta | `approval:reversion`; `approval:honeymoon`; `approval:jobs`; `approval:prices`; `approval:growth`; `luck`; modifiers channel `approval`; `clamp`; `rounding` |
| `clout` | delta | `clout:income` (round(approval/10)); `clout:deals` (-spent); `clout:reward` / `clout:refund`; `clamp` (floor at 0) |

`debtPct` is traced instead of `debt` ($tn) because the score and UI use debt/GDP. `gdp`, `debt`, `expected` are derived or internal; `expected` is traced only because it is stored in `Econ` (one term).

**Level-defined variables** (`unemployment = clamp(s.unemployment - okun*gap)`, `empPop`) are path-independent in the original code. To keep behaviour, compute the value from the original level formula and call `ledger.settleTo(before, value)`, which adds the difference as `clamp` (documented carry), instead of `before + sum`. For all other variables use `value = before + sum`.
```ts
// src/engine/trace.ts
export interface Term { source: string; amount: number }
export class Ledger {
  readonly terms: Term[] = [];
  add(source: string, amount: number): void {            // merged by source, zero skipped
    if (amount === 0) return;
    const t = this.terms.find((x) => x.source === source);
    if (t) t.amount += amount; else this.terms.push({ source, amount });
  }
  get sum(): number { let s = 0; for (const t of this.terms) s += t.amount; return s; }
  clamp(v: number, lo: number, hi: number): number { const c = Math.min(hi, Math.max(lo, v)); this.add('clamp', c - v); return c; }
  round(v: number, q: number): number { const r = Math.round(v / q) * q; this.add('rounding', r - v); return r; }
  scaled(k: number): Ledger { const l = new Ledger(); for (const t of this.terms) l.add(t.source, k * t.amount); return l; }
}
// in step():
const g = new Ledger();
g.add('momentum', (C.gapPersistence - 1) * e.gap);
g.add('budget', C.fiscalMultiplier * fiscalImpulse);
g.add('debt:stress', -C.debtStressGap * Math.max(0, (debtPctNow - C.crisisAt) / C.debtStressUnit));
g.add('fed:drag', -C.rateDrag * (realRate - C.neutralReal));
g.add('luck', C.shockGap * zGap);
for (const m of mods('gap')) g.add(m.source, m.amount);
const gap = e.gap + g.sum;
const fed = new Ledger();                                // order: round, then clamp (as today)
fed.add('fed:neutral', C.fedSmooth * (C.neutralReal + inflation - e.fedRate));
fed.add('fed:inflationGap', C.fedSmooth * C.taylorInfl * (inflation - C.inflTarget));
fed.add('fed:outputGap', C.fedSmooth * C.taylorGap * gap);
const fedRate = fed.clamp(fed.round(e.fedRate + fed.sum, C.fedStep), LIMITS.fed[0], LIMITS.fed[1]);
```
`approval` rounds after clamping (today: `Math.round(clamp(...))`); `fedRate` clamps after rounding. Preserve each order.

**SOURCES registry** (`trace.ts`): `export const SOURCES = { momentum: {kind:'structure'}, budget: {kind:'policy'}, 'fed:drag': {kind:'fed'}, luck: {kind:'luck'}, clamp: {kind:'residual'}, rounding: {kind:'residual'}, ... }` plus open families `event:*`, `eo:*`, `law:*` matched by prefix. Phase 3's drift test needs "every id the engine can emit". Test: every source seen over a 40-seed x 5-strategy sweep is in `SOURCES` or a registered prefix family.

**Report on state:** `GameState.report: { trace: Record<TraceKey, Term[]>; luck: { gap: number; infl: number; appr: number }; log: LogEntry[] }`, `newGame` gets an empty report, legacy steps return an empty report (cheap). `LogEntry = { kind: string; id: string; detail?: string; amount?: number }`; Phase 1 emits `bill` (passed/failed/rejected) entries.

**Conservation test (FND-04):** for seeds 1-40 x 5 strategies x every turn x legacy path: for each key, `abs(sum(trace[key]) - (value(after) - value(before))) < 1e-9` (level kind: `- value(after)`); `value()` maps keys to state fields (`debtPct = debt/gdp*100`). Residual guards, else a lazy executor can dump everything into a plug: `clamp` residual non-zero only if `before` or `after` sits on a bound for that key; `|rounding| <= quantum/2` (0.125 fed, 0.5 approval); no source named `residual`/`other`/`misc` allowed.

### Pattern 3: Decisions are raw inputs (answers question 4)
Current shape, verbatim [VERIFIED: src/engine/game.ts:54-57]:
```ts
export interface Decisions {
  budget?: BudgetDraft; // a budget that passed Congress this turn
  clout?: number; // clout spent (−) or won back (+) this turn
}
```
and Session sends `{ clout: this.clout - this.current.clout }` plus `budget` only if the vote passed [VERIFIED: src/app/session.svelte.ts:72-75]. Replace with raw choices:
```ts
// src/engine/decisions.ts
export interface Bill { budget: BudgetDraft; deals: DealId[] }
export interface Decisions { bill?: Bill }        // Phases 4/5 add keys: crisis, orders, fed, speech
export interface BillResult {
  valid: boolean; reason?: 'unaffordable'; budget: BudgetDraft; deals: DealId[];
  spent: number; whip: ReturnType<typeof tally>; passed: boolean; cloutBack: number; cloutDelta: number;
}
export function sanitizeBudget(d: BudgetDraft): BudgetDraft {   // build from KNOWN lever ids only
  const out: BudgetDraft = {};
  for (const l of [...taxLevers, ...spendLevers]) {
    const v = Object.hasOwn(d, l.id) ? d[l.id] : undefined;
    out[l.id] = typeof v === 'number' && Number.isFinite(v) ? Math.min(l.max, Math.max(l.min, v)) : l.base;
  }
  return out;                                                   // no prototype keys, no NaN, in range
}
export function resolveBill(clout: number, bill: Bill): BillResult {   // THE shared pure function
  // `DEALS` = the existing `deals` table imported from ./congress under another name
  const ids = [...new Set(bill.deals)].filter((id) => DEALS.some((d) => d.id === id));   // known ids, deduped
  const spent = ids.reduce((n, id) => n + DEALS.find((d) => d.id === id)!.cost, 0);
  const whip = tally(ids), budget = sanitizeBudget(bill.budget);
  if (spent > clout) return { valid: false, reason: 'unaffordable', budget, deals: ids, spent, whip, passed: false, cloutBack: 0, cloutDelta: 0 };
  const { passed, cloutBack } = voteOutcome(whip.total, spent);  // existing fns, deterministic
  return { valid: true, budget, deals: ids, spent, whip, passed, cloutBack, cloutDelta: -spent + cloutBack };
}
```
Engine: `const r = decisions.bill ? resolveBill(state.clout, decisions.bill) : null; const policy = r?.valid && r.passed ? r.budget : state.policy;` and clout terms `clout:deals = -r.spent`, `clout:reward = +10` when passed / `clout:refund = floor(spent/2)` when failed (these come from `voteOutcome`'s `cloutBack`; keep one source id per case). `budget:family` applies only when `r.passed` (today: `decisions.budget ?`). An invalid bill adds a `log` entry `{kind:'bill', id:'rejected', detail:'unaffordable'}` and changes nothing.

**Session changes** (minimal; screens keep reading the same fields):
```ts
// draft keeps: budget, pack, sentToCongress, deals; `vote` object -> boolean `voteCalled`
bill    = $derived(this.draft.voteCalled || this.draft.deals.length ? { budget: $state.snapshot(this.draft.budget), deals: $state.snapshot(this.draft.deals) } : null);
preview = $derived(this.bill ? resolveBill(this.current.clout, this.bill) : null);
clout   = $derived(this.current.clout + (this.preview?.cloutDelta ?? 0));
whip    = $derived(this.preview?.whip ?? tally([]));
vote    = $derived(this.draft.voteCalled && this.preview ? { total: this.preview.whip.total, passed: this.preview.passed, cloutBack: this.preview.cloutBack } : null);
nextTurn() { const decisions: Decisions = this.bill ? { bill: this.bill } : {}; ... }
```
`Congress.svelte` reads `session.draft.vote`; either keep `draft.vote` as a derived alias or update its 3 reads to `session.vote` (a 3-line edit). `makeDeal` gates on `this.current.clout - cost(deals + this)` instead of the displayed clout.
**Semantic decision (A8):** the engine holds the vote whenever a bill is present, so "made deals but never pressed Call the vote" is charged and voted rather than silently charged with no vote (today: `decisions.clout` includes `-spent` even with no vote). "Call the vote" becomes "reveal the result now". If the user prefers deals to be inert until the vote is called, send `bill` only when `voteCalled` and show clout without provisional spend. Pick one in discuss; the first keeps preview == result with the least UI change.
**FND-05 tests:** for each of the 2^3 deal subsets x {passing budget, failing budget} x clout in {0, 14, 15, 44, 45, 120}: `resolveBill(c, bill).cloutDelta === endTurn(stateWithClout(c), {bill}).clout - c - Math.round(next.approval/10)` (the income term), and `report.trace.clout` terms equal the preview terms; tampered bills (duplicate ids, unknown id, `__proto__` key, `NaN`/`Infinity`/out-of-range lever values, `spent > clout`) leave policy unchanged or clamped, never mint clout.

### Pattern 4: Engine file split (hotspot control)
`game.ts` should shrink to state + `newGame` + `step`; move `prosperity`, `legacy`, `finalScore`, `LEGACY_QUARTERS` to `score.ts` (re-export from `game.ts` so `Session`, `OvalOffice.svelte` and `balance.test.ts` imports keep working) in P05, when the trace rewrite already touches those lines.

### Pattern 5: Term-relative calendar (answers question 5)
Existing code, verbatim [VERIFIED: src/engine/game.ts:238-245]:
```ts
const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'] as const;
const START_QUARTER = 2026 * 4 + 3; // Q4 2026: the game starts in the present (design Q19)
export function turnLabel(turn: number): string {
  const q = START_QUARTER + turn - 1;
  return `${SEASONS[q % 4]} ${Math.floor(q / 4)}`;
}
```
and its tests [VERIFIED: src/engine/game.test.ts:32-36]: `turnLabel(1)` = `'Fall 2026'`, `turnLabel(2)` = `'Winter 2027'`, `turnLabel(32)` = `'Summer 2034'`. These are the **real-calendar** mapping (turn 1 = the Q4 2026 data quarter) and stay true; they are renamed, not rewritten.
```ts
// src/engine/calendar.ts
export const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'] as const;
export type Season = (typeof SEASONS)[number];
export const MIDTERM_TURNS = [8, 24] as const;     // Year 2 Fall, Year 6 Fall
export const REELECTION_TURN = 16;                  // Year 4 Fall; second-term election would be 32
export function termParts(turn: number): { year: number; season: Season } {
  const i = turn - 1;                                // turn 1 = Year 1 Winter
  return { year: Math.floor(i / 4) + 1, season: SEASONS[((i % 4) + 4) % 4]! };
}
export const termLabel = (turn: number): string => { const p = termParts(turn); return `Year ${p.year} · ${p.season}`; };
const START_QUARTER = 2026 * 4 + 3;                  // Q4 2026, the data start
/** The real calendar quarter the same turn would be: used only in the tooltip. */
export const realQuarterLabel = (turn: number): string => { const q = START_QUARTER + turn - 1; return `${SEASONS[q % 4]} ${Math.floor(q / 4)}`; };
```
Tests: `termLabel(1)='Year 1 · Winter'`, `(4)='Year 1 · Fall'`, `(8)='Year 2 · Fall'`, `(16)='Year 4 · Fall'`, `(17)='Year 5 · Winter'`, `(24)='Year 6 · Fall'`, `(32)='Year 8 · Fall'`; `termParts(t).season==='Fall'` for `t` in `MIDTERM_TURNS` and `REELECTION_TURN` and 32; years of 8/16/24 are 2/4/6; the three old `realQuarterLabel` expectations (move the existing test, rename the function). StatusBar line becomes `Turn {n} of 32 · {termLabel(n)}` wrapped in an element with `title="Real calendar: {realQuarterLabel(n)}. Your term is fictional and off-cycle."` following the existing `title="Real term: …"` convention [VERIFIED: StatusBar.svelte:12,22]. Gotcha: the tooltip for turn 16 reads "Summer 2030" (the real-calendar quarter), which is the exact thing D1 avoided as a *label*; it is acceptable only because it is labelled as the real calendar (A3). `title` is not keyboard reachable: give the element `tabindex="0"` or leave a note for Phase 2's axe pass (OBS-07). Delete `turnLabel` and its test from `game.ts`/`game.test.ts` in P04 (the first game.ts-owning plan after P02) so P02 does not touch game.ts.

### Pattern 6: Modifiers, scheduled effects, legacy gating (answers question 6 and success criterion 2)
```ts
// src/engine/modifiers.ts
export type Channel = 'gap' | 'inflation' | 'expected' | 'approval' | 'trust' | 'potential' | 'debtBn' | 'clout' | 'fedTarget';
export const FOREVER = 1_000_000;                  // finite on purpose: Infinity does not survive JSON
export interface Modifier {
  id: string;           // unique per instance, e.g. 'eo:buyAmerican#t5'
  group: string;        // what a revoke/ruling removes together, e.g. 'eo:buyAmerican'
  source: string;       // trace source id, e.g. 'eo:buyAmerican', 'event:hurricane'
  channel: Channel;
  amount: number;       // added to the channel EVERY turn in [from, until]
  from: number;         // delayed effect = from in the future (scheduled modifier)
  until: number;
  tag: 'event' | 'eo' | 'law';
}
export interface Scheduled { id: string; kind: string; due: number; data: Record<string, string | number> }
export type Resolver = (ctx: { seed: number; turn: number; state: GameState; item: Scheduled }) =>
  { add?: Modifier[]; endGroups?: string[]; log?: LogEntry[] };
export const RESOLVERS: Record<string, Resolver> = {};   // Phase 4 / Phase 5 each add their own entries
export const activeAt = (mods: readonly Modifier[], turn: number, legacy: boolean) =>
  mods.filter((m) => m.from <= turn && turn <= m.until && !(legacy && m.tag === 'eo'));
```
`GameState` gains `modifiers: readonly Modifier[]` and `scheduled: readonly Scheduled[]` (both `[]` at start). In `step`: (1) if not legacy, run resolvers for items with `due === turn` (keyed draws inside use `draw(seed,'court',turn,item.id)` so order never matters); apply `endGroups` by setting `until = turn - 1` on that group; drop done items; (2) fold `activeAt(...)` per channel into the ledgers as terms named `m.source`; (3) next state carries updated arrays. A ruling "1-3 turns later" is: signing adds the order's modifiers plus `Scheduled{kind:'ruling', due: T+k}`; at `due`, the resolver draws the keyed outcome and either leaves the group or ends it, and logs a named ruling. Because nothing consumes sequential randomness, signing an order cannot move any other draw.
**FND-06 / D5:** `legacy(s)` runs `step(s, {}, { legacy: true })` x 40: no resolvers, no event deck (Phase 4), `eo`-tagged modifiers ignored, empty `report`. Keyed macro shocks continue in legacy and are identical for player and autopilot at the same turn (common random numbers), so legacy differences are policy, not luck (A5 offers "zero shocks" as the alternative).
Signatures: `endTurn(state, decisions = {}, opts: StepOptions = {})`, `interface StepOptions { legacy?: boolean; coeff?: Coefficients; resolvers?: Record<string, Resolver> }`. `opts.resolvers` lets tests inject a stub without content; `opts.coeff` enables the registry sensitivity sweep.
**Tests:** a stub resolver `'test'` scheduled at turn 3 with `due: 5` changes the trace at turn 5 under a named source and not before; the same seed's `luck` log is identical with and without the scheduled item; a `from: 5` modifier has no effect at turns 3-4; a state with an `eo` modifier and a pending `scheduled` item gives `legacy(s)` equal to `legacy(sWithout)` (deep-equal econ), and differs from a non-legacy run; `JSON.parse(JSON.stringify(state))` is deep-equal and finite (no `Infinity`).

### Pattern 7: Coefficient registry (answers question 7)
Current `C` table (verbatim [VERIFIED: src/engine/game.ts:60-83], 22 keys): `gapPersistence 0.85, fiscalMultiplier 0.6, rateDrag 0.15, neutralReal 1.0, okun 0.5, empPerU 0.6, phillips 0.15, expectPull 0.25, expectAdapt 0.1, tariffPass 0.1, taylorInfl 0.5, taylorGap 0.5, fedSmooth 0.4, potentialMax 0.25, crowdOut 0.012, crisisAt 130, termPremium 0.02, approvalPull 0.35, honeymoon 8, shockGap 0.3, shockInfl 0.12, shockApproval 1.0`. But `step()` and `prosperity()` also contain about 40 inline numeric literals (examples verbatim: `0.4 * Math.max(0, (debtPctNow - C.crisisAt) / 10)` line 156; `4 * (gap - e.gap)` line 159; `0.8 * growth) / 400` line 173; `0.015 * (spendDev('mcd') + spendDev('ssm'))` line 177; `0.0015 * ((policy.inc ?? 22) - 22)` line 179; `0.004 * (unemployment - s.unemployment) - 0.001` line 181; `50 + honeymoon - 2.5 * ...` line 184; `score(50 + (e.realIncome / s.medianIncome - 1) * 250)` line 209). A registry that only wraps `C` would pass its own test while most coefficients stay unregistered, so the test must be a literal scan.
```ts
// src/engine/coefficients.ts
export type Basis = 'citation' | 'judgement';
export interface Source { text: string; url: string }              // https only
export interface Coeff {
  value: number; unit: string; basis: Basis; range: readonly [number, number];
  note: string;                                                     // required for judgement: why this size
  sources?: readonly Source[];                                      // required for citation
}
export const COEFF = { okun: { value: 0.5, unit: 'unemployment pts per 1% output gap', basis: 'citation', range: [0.3, 0.6],
  note: 'US short-run estimate about 0.45', sources: [{ text: 'Ball, Leigh, Loungani, Okun\'s Law: Fit at 50?', url: 'https://www.nber.org/papers/w18668' }] },
  /* ... */ } as const satisfies Record<string, Coeff>;
export const C = Object.fromEntries(Object.entries(COEFF).map(([k, v]) => [k, v.value])) as { readonly [K in keyof typeof COEFF]: number };
export type Coefficients = typeof C;
```
Group the registry so one test covers all: `COEFF` (dynamics), `LIMITS` (clamp bounds as `[lo, hi]` with basis/note: unemployment 2.5-15, inflation -2..15, fed 0-10, gini 0.3-0.6, approval 5-95, trust 5-80), `SCORE` (prosperity weights and scale factors 250, 16, 20, 1.25, 50, 2500, 500, 5, weights 0.25/0.15/0.1/0.15/0.1/0.1/0.1/0.05; design.md §2 fixes the weights), `RULES` (newGame approval 52, clout 120; vote reward 10; refund divisor 2; `TOTAL_TURNS` 32; `LEGACY_QUARTERS` 40). Unit conversions (4 quarters, 100 percent, 1000 bn/tn, 10-year budget window, 12 months) go in `units.ts` as named constants (`QUARTERS_PER_YEAR`, ...); they are definitions, not coefficients.
**Tests:** (1) every entry: `lo < hi`, `lo <= value <= hi`, `basis` valid, `unit` and `note` non-empty, `citation` implies >= 1 source with `https:` URL and non-empty text; (2) **literal scan**: in `src/engine/**/*.ts` excluding `*.test.ts`, `coefficients.ts`, `units.ts`, `rng.ts`, `hash.ts`: strip comments and strings, then every numeric literal must be `0` or `1` (or `-1`), else fail naming file:line. Hex constants in `rng.ts`/`hash.ts` are exempt by file. Budget lever tables (`budget.ts`) and `congress.ts` seat/deal data are *data*, not coefficients: require a per-lever `basis` and `note` field on `Lever` (all `judgement`: "linear per-unit effects; 10-yr costs sized from ~2026 magnitudes, not CBO scores" per the file's own header [VERIFIED: budget.ts:2-3]) and exempt the two files from the literal scan; (3) optional sensitivity sweep using `opts.coeff`: set each coefficient to its `range` lo and hi (others default), run 5 seeds x 32 turns, assert all outputs finite and unemployment/inflation/approval inside the harness bounds in `balance.test.ts` (2.5-12, -2..12, 5-95). Tune the declared ranges until it passes; a range that breaks the model is not an "allowed" range. Also move `POTENTIAL_GROWTH = 1.8` from `src/data/us.ts:14` into the registry (`potentialGrowth`, judgement, note cites the CBO long-run range already in that comment).

**Candidate sources** (executor must open each URL and confirm it supports the note; if not, change `basis` to `judgement`; "opened" = fetched this session):

| Key(s) | Value | Basis | Source and what it supports | Opened? |
|---|---|---|---|---|
| `taylorInfl`, `taylorGap`, `inflTarget` (2) | 0.5, 0.5, 2 | citation | Taylor (1993), "Discretion versus Policy Rules in Practice", Carnegie-Rochester Conf. Series on Public Policy 39:195-214. Rule: policy rate = inflation + 0.5 x inflation gap + 0.5 x output gap + equilibrium real rate [CITED: search results from kansascityfed.org/web.stanford.edu/BIS/BoE papers; bibliographic data confirmed, DOI https://doi.org/10.1016/0167-2231(93)90009-L is from memory [ASSUMED]]. Later variants put 1.0 on the gap (Taylor 1999 "balanced approach"): range [0.25, 1.0]. | no |
| `inflTarget` | 2 | citation | FOMC Statement on Longer-Run Goals and Monetary Policy Strategy, https://www.federalreserve.gov/monetarypolicy/files/FOMC_LongerRunGoals.pdf (title confirmed by fetch; body is compressed so the 2 percent text was not extractable) | partly |
| `neutralReal` | 1.0 | judgement (cite FOMC SEP longer-run funds rate 3.0 minus 2.0 goal as support) | https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm (SEP links); the specific "3.0" figure is from memory [ASSUMED]. Range [0, 2]. | no |
| `okun` | 0.5 | citation | Ball, Leigh, Loungani, "Okun's Law: Fit at 50?", NBER WP 18668, https://www.nber.org/papers/w18668; the conference draft reports a US coefficient of -0.45 [CITED: search summary of imf.org seminar paper BLL.pdf]. Range [0.3, 0.6]. | no |
| `phillips` | 0.15 | judgement | Literature slope is small and unstable: Hazell, Herreno, Nakamura, Steinsson (2022, QJE 137(3):1299-1344, https://nber.org/papers/w28005) find a flat curve; their intro contrasts 0.67 (1960-83) with 0.03 (2000-2019q1) in a different specification [CITED: search summary]. Units differ from this model (inflation pts per quarter per 1% output gap), so the note must say "not directly comparable". Range [0.03, 0.3]. | no |
| `fiscalMultiplier` | 0.6 | judgement | CBO's 2009 ARRA analysis used multiplier ranges, e.g. federal purchases 1.0-2.5 per dollar over several quarters [CITED: https://www.cbo.gov/publication/24874 via CRFB summary]; other estimates 0.5-2.0 (Richmond Fed summary). This model's 0.6 is an initial-quarter gap response; with `gapPersistence` 0.85 the cumulative effect is 0.6/(1-0.85)/4 = 1.0 percent-years per 1% of GDP [derived by me from the code, not a quoted figure]. Range [0.3, 1.2]. | no |
| `tariffPass` | 0.1 | citation | Yale Budget Lab: short-run price level +1.9% (July 2025) / +1.8% (Aug 2025) for an average effective tariff rate of 16.8-18.7%, so roughly 0.1 price-level points per rate point [CITED: https://budgetlab.yale.edu/research/tracking-economic-effects-tariffs, https://budgetlab.yale.edu/research/state-us-tariffs-november-17-2025 via search snippets; the page body was truncated when fetched]. Their price estimate assumes no Fed response. Range [0.05, 0.2]. | no |
| `termPremium` | 0.02 | citation | CBO Working Paper 2019-01, "The Effect of Government Debt on Interest Rates": 2-3 basis points per percentage point of debt/GDP [CITED: https://www.cbo.gov/publication/55018]; Mercatus summary cites 3-5 bp elsewhere. 0.02 = 2 bp per point. Range [0.01, 0.05]. | no (CBO returns 403 to the fetcher) |
| `crowdOut` | 0.012 | judgement | CBO's central crowd-out estimate is 33 cents of lower private investment per dollar of deficit [CITED: search summary of CBO; exact CBO URL not confirmed]. Mapping to "potential growth points per point of debt/GDP" is this model's own simplification. Range [0.004, 0.03]. | no |
| `crisisAt` | 130 | judgement | No consensus debt threshold exists; design Q27 sets 130% as the point where bond markets "start to revolt". Say so. Range [100, 160]. | n/a |
| `expectPull`, `expectAdapt`, `gapPersistence`, `rateDrag`, `fedSmooth`, `potentialMax`, `approval*`, `honeymoon`, `shock*`, `empPerU`, health/gini/crime/trust terms, all `SCORE` and `RULES` | as coded | judgement | Hand-set round numbers chosen for plausible direction and size (the file header says exactly this [VERIFIED: game.ts:2-3]). Each needs a one-line note and a range; do not invent citations. | n/a |

### Pattern 8: Party pick, party-blind engine (answers question 8)
The strongest blindness is absence: `newGame(seed, start)` keeps its two-argument signature, `GameState` has no party field, and the party lives in `Session.options` (and later in the save's `options`, where `ARCHITECTURE.md` already puts it). Phase 6/7 pass `party` as an argument to pure `voters`/election functions, not into `step`; if a later phase truly needs it inside `step`, it must add `options.party` to `newGame` and extend the blind test to compare `econ`, `approval`, `clout` and `report.trace` across parties.
```ts
// src/app/options.ts
export type PartyId = 'D' | 'R';                  // margin2024 in data is R minus D
export interface GameOptions { party: PartyId }
// src/content/parties.ts : the ONLY file allowed to name parties (A4)
export const PARTIES = [{ id: 'D', name: 'Democratic Party' }, { id: 'R', name: 'Republican Party' }] as const;
```
`Session` constructor becomes `(seed, start, options: GameOptions)` and stores `readonly options`. **Tests (FND-08):** (1) source scan: no identifier `party`/`Party` in `src/engine/**` non-test files; (2) `GameState` keys do not include `party` (type-level `satisfies` or `Object.keys(newGame(...))`); (3) Session-level: two `Session`s with the same seed and `party: 'D'` vs `'R'` take the same 32 `nextTurn()`s with the same inputs and have deep-equal `history` and `autopilot` (needs the rune-compiled `.svelte.ts` to import under vitest; `vite.config.ts` already loads the svelte plugin, MEDIUM until tried); (4) a Session unit asserting the party label text differs and nothing else does is unnecessary.
**UI (minimal, layout grammar §7d):** overlays reuse the split, left = what happened/the question, right = options + one primary stamp bottom-right [VERIFIED: docs/design.md §7d]. Move the current `App.svelte` body into `src/screens/Game.svelte` (takes `session`), and make `App.svelte`:
```svelte
<script lang="ts">
  import { Session } from './app/session.svelte';
  import { fromData, us } from './data/us';
  import Game from './screens/Game.svelte';
  import NewGame from './screens/NewGame.svelte';
  let session = $state.raw<Session | null>(null);
</script>
{#if session}<Game {session} />{:else}<NewGame onStart={(o) => (session = new Session(Date.now() | 0, fromData(us), o))} />{/if}
```
`NewGame.svelte` uses `ScreenLayout` with `question="Which party do you lead?"`, a `role="radiogroup"` of two Option cards built from native `<input type="radio">` (keyboard and screen-reader support for free), a `next` snippet with an Info card ("Your party changes names and colours. The economy plays the same either way.") and the single `stamp` button "Start the term" disabled until a party is chosen (or default to first option and enable). No `unlockAll`/seed UI (YAGNI; `GameOptions` leaves room). Show the party once in `StatusBar`. The OBS-05 content gate (Phase 2) must allow-list `src/content/parties.ts`.

### Pattern 9: Cross-browser determinism script (answers question 9)
`src/engine/replayFixture.ts` exports `runFixture(): string` returning JSON of `{ [logName]: string[] }`, where each entry is `stableHash(state)` after each turn of a replayed fixture log plus the hash of `finalScore`. Fixture logs: 6 logs = seeds {1, 7, 42, 99, 2026, 31337} with scripted inputs that exercise budgets, a passing bill with deals, a failing bill, and no-input turns, over all 32 turns plus legacy (grows as phases add decision types). `scripts/determinism.mjs`:
```js
import { build } from 'vite';
import { chromium, firefox, webkit } from '@playwright/test';
const bundle = async (minify) => {
  const out = await build({ configFile: false, logLevel: 'error', build: { write: false, minify,
    lib: { entry: 'src/engine/replayFixture.ts', name: 'Fx', formats: ['iife'] } } });
  return (Array.isArray(out) ? out[0] : out).output[0].code;
};
const results = [];
for (const minify of [false, true]) {
  const code = await bundle(minify);
  const run = `(() => { ${code}; return Fx.runFixture(); })()`;
  results.push([`node(min=${minify})`, (0, eval)(run)]);
  for (const [name, bt] of Object.entries({ chromium, firefox, webkit })) {
    const b = await bt.launch(); const p = await b.newPage();
    results.push([`${name}(min=${minify}) ${b.version()}`, await p.evaluate(run)]); await b.close();
  }
}
const [ref] = results[0].slice(1);
const bad = results.filter(([, r]) => r !== ref);
for (const [n, r] of results) console.log(r === ref ? 'OK  ' : 'DIFF', n);
process.exit(bad.length ? 1 : 0);
```
(Prototype used `page.evaluate` of an IIFE-wrapped string successfully on all three browsers; keep that wrapping.) Add `"determinism": "node scripts/determinism.mjs"` to `package.json`. Phase 1 compares browsers to **Node live**, not to committed constants: committed goldens belong to Phase 2 (OBS-02) because the model still changes inside Phase 1. Phase 2's CI `e2e` job runs `pnpm exec playwright install --with-deps chromium firefox webkit` (or the 1.64.0 Docker image) then `pnpm determinism`; CI uses Node 24 [VERIFIED: .github/workflows/ci.yml], local is Node 26.10.0, another reason to compare live.

### Source-scan tests: use the TypeScript AST, not regexes
`typescript` 6.0.3 is already installed. A regex that strips comments and strings is fragile (apostrophes in comments, `https://` in strings). Walk `ts.createSourceFile` instead; one helper serves the purity scan (P01), the literal scan (P05) and the party scan (P02).
```ts
// src/testing/scan.ts : test support, deliberately OUTSIDE src/engine so the engine scan does not scan itself
import ts from 'typescript';
export const ALLOWED_MATH = new Set(['abs', 'min', 'max', 'floor', 'ceil', 'round', 'trunc', 'sign', 'imul', 'clz32', 'fround']);
export const BANNED_IDS = new Set(['Date', 'performance', 'crypto', 'Intl', 'globalThis', 'window', 'document', 'localStorage', 'fetch', 'setTimeout']);
export function scan(file: string, text: string) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2023, true);
  const hits: string[] = [], literals: string[] = [];
  const at = (n: ts.Node) => `${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
  const visit = (n: ts.Node): void => {
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Math' && !ALLOWED_MATH.has(n.name.text)) hits.push(`${at(n)} Math.${n.name.text}`);
    if (ts.isElementAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Math') hits.push(`${at(n)} Math[...]`);
    if (ts.isBinaryExpression(n) && (n.operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskToken || n.operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskEqualsToken)) hits.push(`${at(n)} **`);
    if (ts.isIdentifier(n) && BANNED_IDS.has(n.text) && !ts.isPropertyAccessExpression(n.parent)) hits.push(`${at(n)} ${n.text}`);
    if (ts.isImportDeclaration(n) && /(^|\/)(svelte|app|ui|screens)(\/|$)/.test((n.moduleSpecifier as ts.StringLiteral).text)) hits.push(`${at(n)} import ${(n.moduleSpecifier as ts.StringLiteral).text}`);
    if (ts.isNumericLiteral(n) && !ts.isLiteralTypeNode(n.parent) && n.text !== '0' && n.text !== '1') literals.push(`${at(n)} ${n.text}`);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { hits, literals };
}
```
Self-test the scanner with inline strings (`Math.log(x)` is flagged, `Math.max` is not, a comment `// Math.log` is not, `x ** 2` is flagged, `0.07 * x` is a literal hit), so a broken scanner cannot silently pass. `isPropertyAccessExpression(n.parent)` check lets `foo.Date` pass but a bare `Date` fail; tune if it false-positives.

### Anti-Patterns to Avoid
- **Refactor and behaviour change in one step.** Rewriting `step()` for trace + registry while also changing RNG or decisions makes a regression undiagnosable. Land RNG first, record a characterization table, keep it green through every later plan (see Validation Architecture).
- **A `residual`/`other` source.** It makes the conservation test pass while explaining nothing. Only `clamp` and `rounding` are allowed residual ids, each guarded.
- **Party (or any UI option) as an argument to `step`.** Blindness by convention rots; absence is testable.
- **Sequential draws inside content.** Every future draw is `draw(seed, stream, turn, key)`; never "draw next and remember the state".
- **`Infinity` in state** (modifier `until`): `JSON.stringify` turns it into `null`. Use `FOREVER = 1_000_000`.
- **A committed golden hash in Phase 1.** The model still changes inside the phase; goldens are Phase 2 (OBS-02).
- **`Object.values`/`for-in` over user-supplied objects in the engine** (budget drafts): build from the known lever list.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Normal deviates, tanh, exp/log in the engine | Calls to `Math.log/cos/sin/tanh/exp` (what exists) | Irwin-Hall(12) and Pade tanh from this file | The platform functions differ per engine and build (measured). A library that calls them inherits the drift. |
| Structural state hash | `JSON.stringify` then hash | `stableHash` (sorted keys, float64 bits, `-0` canonicalised, throws on non-finite) | Key order and `-0`/`NaN` payload bits differ; `JSON.stringify` turns `NaN` into `null` |
| Browser automation | Own puppeteer wiring | `@playwright/test` launchers (`chromium/firefox/webkit`) | Already the Phase 2 tool; versions pin browsers |
| Source scanning | Regex over text | `typescript` AST (installed) | Comments, strings and template literals break regexes |
| Test runner / fixtures | Custom harness | vitest 5.0.3 | Already used by 5 test files |
| Save-integrity hash / tamper check | `stableHash` | `crypto.subtle.digest` in Phase 2 | `stableHash` is 53-bit non-cryptographic; do not use it as a security check |

**Key insight:** in this domain the dangerous mistakes are silent (a platform `Math` call that is right to 1e-13, a coefficient inlined as a literal, a plug term that hides a modelling error). Every item above is guarded by a test that fails loudly, which is why most of the phase's effort is tests.

## Common Pitfalls

### Pitfall 1: Balance harness strategies stop passing their budgets
**What goes wrong:** `balance.test.ts` calls `endTurn(state, { budget })` (a budget that "passed Congress" by fiat) [VERIFIED: balance.test.ts:17]. After P04 there is no `Decisions.budget`; a bare `{bill:{budget, deals:[]}}` fails the vote (203 of 218, see `budget.test.ts:16-17`) so every strategy silently equals autopilot and the "sensible beats autopilot" assertion fails or, worse, passes for the wrong reason.
**How to avoid:** a shared test helper `passingBill(budget)` = `{ budget, deals: ['mod','cen','spc'] }` (all deals reach >= 218, `budget.test.ts:18-19`; costs 45 of 120 starting clout, so only on turn 1). Assert the vote passed in the helper.

### Pitfall 2: Golden-looking constants that break on any model edit
**What goes wrong:** committing end-state hashes in Phase 1 means every Wave 3/4 edit churns them.
**How to avoid:** compare browsers against Node live; keep only tolerance-based characterization values until Phase 2.

### Pitfall 3: Minifier rewrites floating-point expressions
**What goes wrong:** a production minifier turning division by a constant into multiplication by its reciprocal changes bits. Not observed (Vite 8 default minifier, 0 diffs), but a future minifier upgrade could.
**How to avoid:** `scripts/determinism.mjs` runs unminified and minified bundles. Keep it a Phase 2 required check.

### Pitfall 4: Clamp/rounding residuals hide model bugs
**How to avoid:** the guard tests in Pattern 2. In normal play clamps essentially never fire (0 residuals above 1e-9 in 37,200 steps), so any non-zero `clamp` in a test is suspicious.

### Pitfall 5: `rounding` on approval and fed rate breaks "terms sum"
**What goes wrong:** the stored value is rounded, so next turn's `before` is the rounded number. That is fine for conservation (each turn is self-contained) but easy to get wrong if someone stores the unrounded value.
**How to avoid:** store only the settled value; `rounding` term = settled - raw.

### Pitfall 6: Seed type
`Session` seeds with `Date.now() | 0` [VERIFIED: App.svelte:12], an int32 that may be negative. `cell` takes `seed | 0`, so negative seeds work; a seed above 2^31 aliases. Share codes (Phase 8) must print the int32.

### Pitfall 7: Stream ids and key strings are part of the replay contract
Renumbering `STREAM` or renaming a key like `'gap'` silently changes every replay. Add a known-answer test (Pattern 1 (c)); changing it is a deliberate "engine version bump" (Phase 2 owns the version number).

### Pitfall 8: `title` tooltips are not keyboard accessible
Existing pattern (`title="Real term: …"`) fails the Phase 2 keyboard/axe bar if relied on for essential information. The real date is secondary information, but give the element `tabindex="0"` or record it for OBS-07.

### Pitfall 9: Session test needs rune compilation
`session.svelte.ts` uses `$state.raw`/`$derived` at class level. vitest loads `vite.config.ts` (svelte plugin present), so it should compile, but no existing test imports it. Try it in P02 first; fall back to testing party-blindness at engine level plus the source scan.

### Pitfall 10: Double-counting `luck` between ledgers
Unemployment and growth reuse gap terms (same ids). A "total luck" line that sums `luck` across all keys double-counts; the report (Phase 3) should show luck per indicator. Document this next to `SOURCES`.

## Code Examples

Verbatim anchors this research relies on (read this session):

```ts
// src/engine/game.ts:146  (the only RNG use today)
const [[zGap, zInfl, zAppr], rng] = normals(state.rng, 3) as [[number, number, number], number];
// src/engine/game.ts:153  (the only tanh)
const potential = s.potential + C.potentialMax * Math.tanh(after.growth) - C.crowdOut * Math.max(0, debtPctNow - s.debtPct);
// src/engine/game.ts:222-229  (legacy today)
export const LEGACY_QUARTERS = 40;
export function legacy(state: GameState): GameState { let s = state; for (let i = 0; i < LEGACY_QUARTERS; i++) s = step(s, {}); return s; }
```
Further sketches are in Patterns 1-9. A characterization table (P01, kept green until P07) looks like:
```ts
// src/engine/characterization.test.ts  (temporary; delete in P07 when Phase 2 goldens replace it)
const EXPECT = { '1:auto:8': { gap: 0.1, inflation: 2.9, /* … 10 significant digits, captured after P01 */ } /* seeds 1-5 x {auto, passingBill(infra)} x turns {8,16,32} */ };
it('does not change behaviour through the refactor waves', () => { /* toBeCloseTo(v, 8) on each field */ });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chained PRNG state in `GameState` | Counter-based / keyed draws (Salmon et al., "Parallel Random Numbers: As Easy as 1, 2, 3", SC'11) | textbook; this phase | A decision can never shift another draw; random access for replay |
| Box-Muller with `log/cos/sin` | Irwin-Hall(12) | this phase | Bit-identical across engines; tails truncated at 6 sigma |
| `Math.tanh` | Pade rational, clamp at +-3 | this phase | Arithmetic-only |
| Net clout delta from the UI | Raw bill in, engine computes cost | this phase | Preview == result; tampered save cannot mint clout |
| Locals inside `step()` | Ledger terms with explicit `clamp`/`rounding` | this phase | The engine is the single source of "why" |

**Deprecated/outdated:** `turnLabel` as the visible label (now the tooltip's `realQuarterLabel`); `Decisions.clout`/`Decisions.budget`; `GameState.rng`; exported `nextRandom`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Taylor (1993) DOI `10.1016/0167-2231(93)90009-L` is correct (bibliographic data was confirmed by search, the DOI string is from memory) | Pattern 7 | A broken citation link; the registry link test (https only) would still pass; executor opens each URL |
| A2 | Linux x86-64 behaves identically to arm64 for the arithmetic-only engine (IEEE `+ - * /`, `Math.imul`, no FMA contraction in JS) | D10 spike | A drift on x86 would show in Phase 2 CI's `pnpm determinism`; fix would be to find the offending op |
| A3 | The tooltip showing the real-calendar quarter (turn 16 = "Summer 2030") is acceptable as a clearly-labelled secondary hint | Pattern 5 | User may prefer a data-vintage note ("Starts from Q4 2026 data") instead; one string |
| A4 | The party picker may name the real parties in `src/content/parties.ts`, with the OBS-05 "no party names" gate allow-listing that single file | Pattern 8 | Gate wording in Phase 2 must match; alternative is neutral labels ("Party A/B") which hurts the civics goal |
| A5 | Macro luck shocks keep running (keyed, identical for both runs) inside the legacy projection | Pattern 6 | If the user wants a pure expected-value projection, set shocks to 0 in legacy (one line) and re-check the harness |
| A6 | Using the `typescript` AST in vitest tests via `import ts from 'typescript'` works under vitest 5 / Vite 8 | Source-scan | Fallback: regex scan with strings removed first; test of the scanner catches breakage |
| A7 | `Math.sqrt` is described by ECMAScript as implementation-approximated (spec text not re-read) | D10 spike | Only affects why sqrt is kept off the allow-list; harmless either way |
| A8 | "Deals made, vote never called" should be voted and charged at Next turn (not inert) | Pattern 3 | UX difference only; either is one `if` in `Session.bill` |
| A9 | Irwin-Hall(12) shocks (bounded at 6 sigma, kurtosis 2.89) are acceptable to replace Box-Muller | D10 spike | Measured impact on the harness is <= 0.12 index points; if a Phase 4 hazard needs fat tails use a mixture of two uniforms |
| A10 | Neutral real rate 1.0 is supported by the FOMC SEP longer-run rate (3.0 nominal at 2.0 inflation) | Pattern 7 | If not, mark `neutralReal` judgement only |

## Open Questions

1. **Legacy shocks: keep or zero?** (A5)
   - Known: legacy currently draws random shocks; keyed draws make them identical for you and autopilot, so differences stay policy-driven. Anti-pattern 5 in ARCHITECTURE.md worries legacy becomes luck.
   - Unclear: whether the headline (Phase 3, D11) wants the lower variance of a zero-shock projection.
   - Recommendation: keep (smallest change, preserves harness behaviour); revisit when Phase 3 measures GR-04 sign agreement.
2. **Deals without a called vote** (A8): discuss before P04; default as in Pattern 3.
3. **Tooltip text** (A3): confirm wording.
4. **Party names** (A4): confirm the allow-list file approach with the Phase 2 content gate.
5. **REL-01 publish:** the files are committed on `game-pivot` (commit bb36df0); `gh repo view` shows `licenseInfo: null` and default branch `master`; `origin` has only `master`. GitHub detects the license from the default branch, so the user must push and merge `game-pivot` (or cherry-pick bb36df0 to `master`). Nothing to plan.
6. **OBS-06 headroom (Phase 2, informational):** 200-seed harness shows `sensible` beating autopilot by only about 0.5 index points (65.39 vs 64.86 before; 65.36 vs 64.82 after the RNG swap), while OBS-06 requires 2-10. Phase 1 will not change that (deliberately); the registry makes the Phase 2 retune auditable. Raise it so Phase 2 budgets time for coefficient tuning.
7. **`growth` as a level trace:** this research uses a level decomposition for growth (Σ terms = value). If the planner prefers delta-only traces, drop `growth` from `TRACE_KEYS` and let Phase 3 explain growth through the `gap` ledger.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | yes | 26.10.0 local (CI: 24) | - |
| pnpm | install/scripts | yes | 12.9.1 | - |
| vitest / vite / typescript | tests, bundling, AST scan | yes | 5.0.3 / 8.3.4 / 6.0.3 | - |
| Playwright browsers (chromium, firefox, webkit) | `pnpm determinism` | yes, cached for 1.64.0 | chromium-1248, firefox-1555, webkit-2370 in `~/Library/Caches/ms-playwright` | `pnpm exec playwright install chromium firefox webkit` |
| System `jsc` (macOS) | optional quick WebKit-engine check | yes | `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc` | not needed; WebKit via Playwright is equivalent (identical output in the spike) |
| `@playwright/test` in repo | `scripts/determinism.mjs` | no | add 1.64.0 | pin 1.63.0 |
| Docker | Phase 2 only | not checked | - | - |

**Missing dependencies with no fallback:** none. Spike leftovers: scratch dir `/private/tmp/claude-501/-Users-brbrainerd-dev-govSim/a82b75c5-2880-413b-9ebc-112726a1c1d0/scratchpad/` (not in repo) and the browser cache above; nothing in the repo was modified.

## Validation Architecture

`.planning/config.json` does not exist, so `workflow.nyquist_validation` is absent and treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.3 [VERIFIED: package.json; `pnpm test` ran, 5 files / 15 tests passed in 1.8 s] |
| Config file | none beyond `vite.config.ts` (svelte plugin) |
| Quick run command | `pnpm exec vitest run src/engine` |
| Full suite command | `pnpm test && pnpm check && pnpm build` |
| Cross-browser | `pnpm determinism` (new; needs browsers) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | Luck log identical across autopilot / no-decision / strategies over 200 seeds; `draw` stateless; known-answer vectors; stat sanity | unit | `pnpm exec vitest run src/engine/rng.test.ts src/engine/shocks.test.ts` | no, P01 (log part P05) |
| FND-02 | Source scan: no banned `Math.*`, `**`, Date, etc. in `src/engine` (scanner self-tested) | unit | `pnpm exec vitest run src/engine/purity.test.ts` | no, P01 |
| FND-02 | Node vs Chromium/Firefox/WebKit, min and unmin, hash chains equal | e2e script | `pnpm determinism` | no, P01 (re-run P07) |
| FND-02 | Recorded input log replays to the same hash chain | unit | `pnpm exec vitest run src/engine/determinism.test.ts` | no, P01 |
| FND-03 | Labels for turns 1/4/8/16/17/24/32; Fall for 8/16/24/32; real-quarter tests moved | unit | `pnpm exec vitest run src/engine/calendar.test.ts` | no, P02 |
| FND-04 | Conservation over 40 seeds x 5 strategies x all turns + legacy; residual guards; sources in `SOURCES`; luck present | unit | `pnpm exec vitest run src/engine/trace.test.ts` | no, P05 |
| FND-05 | `resolveBill` preview == engine clout/trace; tampered bills | unit | `pnpm exec vitest run src/engine/decisions.test.ts` | no, P04 |
| FND-06 | Legacy ignores `eo` modifiers, resolvers, pending items; delayed modifier arrives on time | unit | `pnpm exec vitest run src/engine/modifiers.test.ts src/engine/legacy.test.ts` | no, P06 |
| FND-07 | Registry shape/range/citation; no unregistered literal; optional range sweep | unit | `pnpm exec vitest run src/engine/coefficients.test.ts` | no, P03 (+ literal scan P05) |
| FND-08 | No `party` in engine; `GameState` has no party; Session history equal for D vs R | unit | `pnpm exec vitest run src/engine/party.test.ts src/app/session.test.ts` | no, P02 |
| Existing | Balance harness (ranges, directions, degenerate strategies) | unit | `pnpm exec vitest run src/engine/balance.test.ts` | yes (edit in P04) |

### Sampling Rate
- **Per task commit:** `pnpm exec vitest run src/engine` (target < 15 s).
- **Per wave merge:** `pnpm test && pnpm check && pnpm build`.
- **Phase gate:** the above plus `pnpm determinism` green on this machine, and `node scripts/notices.mjs --check` (dev-only dependency; should stay clean).

### Wave 0 Gaps
- [ ] `src/testing/scan.ts` (AST scan helper, self-tested)
- [ ] Test files listed above (all new)
- [ ] `@playwright/test` install + browsers (behind the SUS checkpoint)
- [ ] `src/engine/characterization.test.ts` table, captured at the end of P01

## Security Domain

`security_enforcement` is absent from config, so it is treated as enabled.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | no accounts |
| V3 Session Management | no | - |
| V4 Access Control | no | single-player, client only |
| V5 Input Validation | yes | `sanitizeBudget` (known lever ids, finite, clamped, `Object.hasOwn`), `resolveBill` (known/deduped deal ids, affordability), engine rejects instead of trusting `Decisions`; Phase 2 adds the save-file validator on top |
| V6 Cryptography | no (explicit) | `stableHash` is non-cryptographic and must not be used for integrity; Phase 2 uses `crypto.subtle` |
| V14 Config / supply chain | yes | exact pin, `--ignore-scripts`, one dev dependency, seam shows `postinstall: null` |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Hand-edited decisions mint clout (negative/duplicate deals, huge levers) | Tampering | Engine recomputes cost from raw bill; unaffordable bill rejected; lever values clamped |
| Prototype pollution via `__proto__`/`constructor` keys in a budget draft | Tampering | Build output from the known lever list; never spread untrusted objects |
| NaN/Infinity propagation | Tampering/DoS | `stableHash` throws on non-finite; sanitize at the boundary; `FOREVER` finite |
| Non-determinism leaking in later (`Date`, `Math.random`) | Repudiation (replay disputes) | Purity scan fails the build |
| Malicious dev dependency | Elevation | Exact pin + human-verify checkpoint + `--ignore-scripts` |

## Plan Decomposition (answers question 10)

`game.ts` is edited by FND-01/02, 04, 05, 06, 07. Plans that edit it must be in different waves (the file-overlap rule), so game.ts work is a deliberate serial chain; the file-disjoint work goes to Wave 1.

| Plan | Wave | Requirements | Files (owner) | Depends on |
|---|---|---|---|---|
| **P01 Deterministic core** | 1 | FND-02, FND-01 (part) | NEW `rng.ts`, `detmath.ts`, `hash.ts`, `replayFixture.ts`, `src/testing/scan.ts`, tests (`rng`, `detmath`, `hash`, `purity`, `determinism`), `scripts/determinism.mjs`, `package.json`, `pnpm-lock.yaml`; MOD `game.ts` (shock draws + tanh + remove `rng`/`nextRandom`/`normals`), `characterization.test.ts` | - |
| **P02 Calendar + party + New Game** | 1 | FND-03, FND-08 | NEW `calendar.ts`+test, `content/parties.ts`, `app/options.ts`, `screens/NewGame.svelte`, `screens/Game.svelte`, `party.test.ts`, `session.test.ts`; MOD `App.svelte`, `ui/StatusBar.svelte`, `app/session.svelte.ts` (constructor/options only). Does **not** touch `game.ts` | - |
| **P03 Coefficient registry (data)** | 1 | FND-07 (part) | NEW `coefficients.ts`, `units.ts`, `coefficients.test.ts`; MOD `budget.ts` (`basis`/`note` on `Lever`), `data/us.ts` (potentialGrowth). Does **not** touch `game.ts` | - |
| **P04 Raw-input decisions** | 2 | FND-05 | NEW `decisions.ts`+test; MOD `game.ts` (Decisions, bill hook, delete `turnLabel`), `game.test.ts`, `balance.test.ts` (passingBill), `app/session.svelte.ts`, `screens/Congress.svelte` (3 reads), `characterization.test.ts` | P01 |
| **P05 Ledger + registry step rewrite** | 3 | FND-04, FND-07 (rest), FND-01 (luck log) | NEW `trace.ts`, `score.ts` (moved `prosperity/legacy/finalScore`), `trace.test.ts`, `shocks.test.ts`, literal-scan test; MOD `game.ts` (every equation) | P03, P04 |
| **P06 Modifiers, scheduled effects, legacy** | 4 | FND-06 | NEW `modifiers.ts`, `modifiers.test.ts`, `legacy.test.ts`; MOD `game.ts` (fold, resolvers, `StepOptions`), `score.ts` | P05 |
| **P07 Integration and sign-off** | 5 | all | MOD `replayFixture.ts` (full fixture logs), delete `characterization.test.ts`, update `REQUIREMENTS.md` traceability; run `pnpm determinism` | P01-P06 |

Checkpoints: P01 `checkpoint:human-verify` before installing `@playwright/test` (SUS). P03/P07: human skim of citations (open each URL; adjust `basis`). P07: `pnpm determinism` output reviewed (it needs real browsers, so run by the user or by an executor with browsers).
Parallel-eligible side work (no file overlap): P02 and P03 run beside P01 in Wave 1. A pure-module draft of `modifiers.ts` could be written during Wave 3 against a stub `Ledger`, but the game.ts glue still lands in Wave 4, so the saving is small; do not split further.
Plan size: P05 is the heaviest (every equation). Keep it to 3 tasks: (1) switch to registry + literal scan with characterization green, (2) Ledger per equation with conservation test, (3) `score.ts` move + `report` on state + luck-log test. Execute with the characterization check after each task.

## Project Constraints (from CLAUDE.md)

Read `~/.claude/CLAUDE.md` and `/Users/brbrainerd/dev/CLAUDE.md` (the repo has no CLAUDE.md of its own). Directives that bind this phase:
- Node via Homebrew, **pnpm** for JS, exact version pins (`--save-exact`); never commit secrets.
- Branch before committing; `master` is the default; do not push, open PRs or deploy unless asked.
- Smallest change that fully solves the problem; match surrounding code's idiom, naming and comment density (existing files use short `// ponytail:` ceiling comments and terse prose).
- Report honestly: show failing test output; say which steps were skipped.
- Use `timeout` for long commands; code lives under `~/dev/<repo>`.
- Project rules from `PROJECT.md`: engine pure and deterministic; screens edit drafts only; Svelte 5 runes; no colour literals outside `tokens.ts` (enforced by `screens.test.ts`); neutrality (no party names in content); WCAG AA.

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `src/engine/game.ts`, `budget.ts`, `congress.ts`, `balance.test.ts`, `game.test.ts`, `budget.test.ts`, `fixture.ts`, `src/app/session.svelte.ts`, `screens.ts`, `screens.test.ts`, `indicators.ts`, `src/data/us.ts`, `schema.ts`, `us.test.ts`, `src/App.svelte`, `src/ui/StatusBar.svelte`, `ScreenLayout.svelte`, `src/screens/Congress.svelte`, `docs/design.md` §2, §7a, §7d, `.github/workflows/ci.yml`, `package.json`, `pnpm-workspace.yaml`, `.planning/{REQUIREMENTS,ROADMAP,STATE,PROJECT}.md`, `.planning/research/{SUMMARY,ARCHITECTURE,PITFALLS}.md`
- Measurements run this session: 5-engine drift test of the current engine; 5-engine zero-drift test of the prototype (incl. minified); 200-seed harness before/after; traced-step conservation (37,200 steps); RNG quality statistics; `pnpm add` dry run in a scratch copy; `npm view @playwright/test`; `gsd-tools query package-legitimacy check`
- Context7 was not used: no library API questions arose (Vite `build()` lib mode and Playwright launchers were exercised directly)

### Secondary (MEDIUM confidence)
- Taylor (1993) rule coefficients: search results (kansascityfed.org rwp10-05, web.stanford.edu/~johntayl, bis.org/publ/work60.pdf, bankofengland.co.uk WP)
- Okun coefficient: https://www.nber.org/papers/w18668 and https://IMF.org/external/np/res/seminars/2012/arc/pdf/BLL.pdf (search summary: US -0.45 in the conference draft)
- CBO multipliers (ARRA, 2009): https://www.cbo.gov/publication/24874 via https://www.crfb.org/blogs/cbo-report-discusses-arra-effect-jobs-gdp-growth
- CBO debt and interest rates: https://www.cbo.gov/publication/55018 (2-3 bp per point); Mercatus summary of 3-5 bp
- Yale Budget Lab tariffs: https://budgetlab.yale.edu/research/tracking-economic-effects-tariffs and https://budgetlab.yale.edu/research/state-us-tariffs-november-17-2025 (search snippets)
- Hazell et al. (2022): https://nber.org/papers/w28005
- FOMC longer-run goals: https://www.federalreserve.gov/monetarypolicy/files/FOMC_LongerRunGoals.pdf (title confirmed)

### Tertiary (LOW confidence)
- Salmon et al., SC'11 (keyed RNG) cited from training knowledge and `ARCHITECTURE.md`; not re-fetched
- DOI of Taylor (1993): memory (A1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, no new runtime deps; one dev dep verified by install in a scratch copy
- Architecture: HIGH for RNG, determinism, ledger, decisions (all prototyped against the real engine); MEDIUM for modifier/scheduled API (no content exists yet to exercise it) and for Session/NewGame UI details
- Pitfalls: HIGH for those found by running code (harness bypass, collision expectation, minifier check); MEDIUM for UI ones
- Coefficient citations: MEDIUM, most seen as search snippets only

**Research date:** 2026-10-09
**Valid until:** 2026-11-08 (Playwright 1.65 is in alpha; re-check the pin if Phase 1 slips past a month)
