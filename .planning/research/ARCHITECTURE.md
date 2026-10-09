# Architecture Research

**Domain:** Deterministic, seed-replayable presidential strategy game (static TS + Svelte 5), milestone v0.2 "Playable First Term"
**Researched:** 2026-10-09
**Confidence:** HIGH for integration points (read from the code at `63851d7`); MEDIUM for model specifics (voter and Fed coefficients are design choices, not sourced estimates)

## Where the code is today (what v0.2 has to fit into)

| Fact in code | Consequence for v0.2 |
|---|---|
| `step()` in `src/engine/game.ts` is pure and draws exactly 3 normals per quarter from one threaded `state.rng` | Macro shocks don't depend on decisions *today*, but only because the draw count is fixed. The first conditional draw (a court challenge only when an EO is signed, an event only when a hazard fires) would shift every later shock and break "same crises in autopilot". |
| `Decisions = { budget?, clout? }`. `Session.nextTurn` sends a **net clout delta** computed in the UI | The engine trusts a number from the UI. A replay log built on that would be a log of outputs, not inputs, and an imported save could set any clout value. |
| `endTurn` returns a bare `GameState`. There's no record of *why* anything changed | The "turn report card" has nothing to read. Causal terms exist only as local variables inside `step()`. |
| `legacy()` calls `step(s, {})` 40 times past turn 32 | Anything new in `step` (events, EOs, elections) also runs in the legacy projection unless it's explicitly gated. |
| `Session` keeps `history` and `autopilot` as `$state.raw<GameState[]>`, and the draft is UI-only | That's the right shape. Add an input log beside them and you have save/load and replay. |
| `screens.ts` is the screen SSOT; `ScreenLayout.svelte` enforces the What / Next-step zones | Economy, Voters and Powers fill existing registry rows. Overlays (crisis, report, election, end) need one shell that reuses the same split (design §7d). |
| `data/us-2026.json` already has 50 states + DC with `electoralVotes` and `margin2024` (R − D). ME/NE margins are statewide only | The Voters model can start from real data. It still needs per-state exposure fields (for example farm share) and a decision on the president's party. |

## Standard Architecture

### System Overview

```
┌──────────────────────────── UI (Svelte 5) ─────────────────────────────────────────┐
│ StatusBar · Rail · ScreenLayout(What | Next step) · Overlay(what happened | do)    │
│ Screens: Oval · Economy · Voters · Budget · Congress · Powers                      │
│ Overlays: Crisis · TurnReport · ElectionNight · EndOfTerm                          │
│   read: session.current / history / autopilot / report      write: session.draft  │
└───────────────┬──────────────────────────────────────────────────────▲─────────────┘
                │ draft edits (pure previews via engine fns)            │ $derived
┌───────────────▼──────────────── App layer (src/app) ──────────────────┴─────────────┐
│ Session (runes class): inputs log · history · autopilot · draft · overlay           │
│ save.ts (serialize / validate / replay) · indicators.ts · copy lookup (why → text)  │
└───────────────┬──────────────────────────────────────────────────────────────────────┘
                │ endTurn(state, Decisions)  — inputs only
┌───────────────▼──────────────── Engine (src/engine, pure, no UI imports) ─────────┐
│ rng.ts draw(seed, stream, turn, key)    game.ts step → { state, report }           │
│ events.ts hazards+resolve   powers.ts EOs/court/Fed/speech   voters.ts states+EC   │
│ budget.ts / congress.ts (existing)      modifiers: one effect vocabulary + trace    │
└───────────────┬──────────────────────────────────────────────────────────────────────┘
                │ imports pure data only
┌───────────────▼──────────── Content + Data (no logic beyond tables) ───────────────┐
│ src/content/events.ts · orders.ts · myths.ts (id, label, effects, citation)         │
│ src/content/text/*.ts (why-templates, verdicts, briefings) · data/us-2026.json      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Owns | New / Modified |
|---|---|---|
| `src/engine/rng.ts` | Keyed, stateless random draws per (seed, stream, turn, key) | **NEW** (replaces `state.rng` threading in `game.ts`) |
| `src/engine/game.ts` | `step`/`endTurn` gain modifiers, a per-turn `report` (trace + log), Fed chair/pressure terms in the Taylor rule, election hook at turn 16, legacy gating | **MODIFIED** (largest change) |
| `src/engine/effects.ts` | `Effect` type (channels), `Modifier` (source, channel, amount, until), `applyModifiers` into the trace | **NEW** (small; could live in game.ts until it exceeds ~60 lines) |
| `src/engine/events.ts` | Hazard per card per turn (common random numbers), pending cards, resolving a chosen option (or the default) into modifiers | **NEW** |
| `src/engine/powers.ts` | EO signing (clout cost, modifiers), court challenge schedule and resolution, Fed chair nomination and pressure, speech | **NEW** |
| `src/engine/voters.ts` | Per-state approval → projected margin → Electoral College tally; swing states | **NEW** |
| `src/engine/congress.ts` | `tally`/`voteOutcome` unchanged; the engine now *calls* them from `Decisions.bill` | **MODIFIED** (call site only) |
| `src/content/events.ts`, `orders.ts`, `myths.ts` | One row per card or EO: id, label, mechanics (`Effect`), options, citation (design §10 "Actions / levers / EOs / myth levers") | **NEW** |
| `src/content/text/why.ts`, `verdict.ts` | Plain-language templates keyed by trace source ids and score bands | **NEW** (replaces placeholder `src/content/sample.ts`) |
| `src/app/session.svelte.ts` | Adds `inputs: Decisions[]`, `overlay`, `load()`; builds `Decisions` from the draft (no more net clout); autosaves on `nextTurn` | **MODIFIED** |
| `src/app/save.ts` | Save schema, `toSave`, `parseSave` (validation at the trust boundary), `replay` | **NEW** |
| `src/app/indicators.ts` | Grows from 4 tiles to the 8 prosperity parts, keyed by `prosperity()` part key (one label table for Economy, report card and tiles) | **MODIFIED** |
| `src/app/screens.ts` | `economy`/`voters`/`powers` already registered. Add `component` per the §10 spec so `App.svelte` drops its if-chain | **MODIFIED** (small) |
| `src/ui/Overlay.svelte` | Overlay shell: left "what happened", right "what you can do" + one stamp (design §7d) | **NEW** |
| `src/screens/Economy.svelte`, `Voters.svelte`, `Powers.svelte` | The three placeholder screens | **NEW** |
| `src/screens/overlays/Crisis.svelte`, `TurnReport.svelte`, `ElectionNight.svelte`, `EndOfTerm.svelte` | Overlay bodies | **NEW** |
| `src/data/schema.ts`, `us.ts`, `data/us-2026.json` | `Start` gains `states[]` (code, ev, margin2024, exposures), the court lean and the Senate seats needed for confirmation | **MODIFIED** |
| `src/engine/balance.test.ts` | Strategies gain crisis and EO policies. New assertions: reelection rate per strategy, events never make autopilot dominate, replay equality | **MODIFIED** |
| `src/engine/replay.test.ts` | Property test: random scripted inputs → save → parse → replay deep-equals the live history, for N seeds | **NEW** |

## Recommended Project Structure

```
src/
├── engine/                 # pure, deterministic, no svelte/app imports
│   ├── rng.ts              # NEW  draw(seed, stream, turn, key) + normals()
│   ├── effects.ts          # NEW  Effect channels, Modifier, trace accumulation
│   ├── game.ts             # MOD  step → state + report; Fed terms; election hook
│   ├── events.ts           # NEW  hazards (CRN), pending cards, defaults
│   ├── powers.ts           # NEW  EOs, court, Fed chair/pressure, speech
│   ├── voters.ts           # NEW  state approval, EC tally, swing states
│   ├── budget.ts           # unchanged
│   ├── congress.ts         # unchanged (now called by the engine too)
│   └── *.test.ts           # + replay.test.ts, voters.test.ts, events.test.ts
├── content/                # data tables only; may be imported by engine
│   ├── events.ts           # NEW  crisis deck rows
│   ├── orders.ts           # NEW  ~10 curated EOs
│   ├── myths.ts            # NEW  myth cards (balanced tags, citations)
│   └── text/               # NEW  why-templates, verdicts, briefing lines
├── app/
│   ├── session.svelte.ts   # MOD  inputs log, overlay, load, autosave
│   ├── save.ts             # NEW  schema, validate, replay
│   ├── indicators.ts       # MOD  8 parts, shared label table
│   └── screens.ts          # MOD  component field
├── ui/Overlay.svelte       # NEW
└── screens/                # NEW Economy, Voters, Powers + overlays/
```

### Structure Rationale

- **`content/` is importable by the engine.** Design §10 makes `src/content/*.ts` the SSOT for actions, EOs and myth cards (id, label, cost, effects, citation in one row). That's data, not UI, so the engine's purity rule ("no UI imports") still holds. Enforce it with a test: nothing under `src/engine` or `src/content` imports `svelte`, `src/app` or `src/ui`. Budget levers stay in `engine/budget.ts` for now. Moving them is churn with no payoff this milestone.
- **One file per mechanic in `engine/`** mirrors the existing `budget.ts`/`congress.ts` split. `game.ts` stays the integrator: it composes the mechanics in `step`.

## Architectural Patterns

### Pattern 1: Keyed random streams (counter-based RNG) instead of a threaded rng

**What:** Every random number is a pure function of `(seed, stream, turn, key)`. There's no rng state in `GameState`. Streams: `macro`, `events`, `court`, `fed`, `voters`. The key is a hashed id (card id, EO id, state code).
**Why:** A player's decision can then never shift another draw. Signing an EO draws `court/turn/eoId`; the autopilot never makes that draw, and nothing else moves. The same seed gives the autopilot identical macro shocks and identical event *uniforms*. It also gives random access for replay and for the legacy turns 33–72.
**Trade-offs:** Removing `state.rng` changes the shock sequence for every seed once, which is fine because no saves exist yet. Rerun the balance harness; its assertions are 40-seed averages and should hold.

```ts
// src/engine/rng.ts
const STREAM = { macro: 1, events: 2, court: 3, fed: 4, voters: 5 } as const;
const fmix = (h: number) => { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return h ^ (h >>> 16); };
const strHash = (s: string) => { let h = 0x811c9dc5; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193); return h; };
/** Seed for one (stream, turn, key) cell; feed to nextRandom/normals for a fixed-count sequence. */
export const cell = (seed: number, stream: keyof typeof STREAM, turn: number, key: string | number = 0) =>
  fmix(fmix(fmix(seed ^ STREAM[stream]) ^ turn) ^ (typeof key === 'string' ? strHash(key) : key));
export const draw = (...a: Parameters<typeof cell>) => nextRandom(cell(...a))[0];
```

The macro shock becomes `normals(cell(seed, 'macro', turn), 3)`, the same Box–Muller as today. Add a lint test: `Math.random` and `Date.now` must not appear under `src/engine`.

### Pattern 2: Common random numbers for policy-modulated events

**What:** Each turn, every deck card gets one uniform `u = draw(seed, 'events', turn, card.id)`. The card fires if `u < hazard(card, state)`. The hazard is `base × f(state)`, for example recession odds rising with a negative gap or debt stress.
**Why:** The design wants two things at once: probabilities modulated by policy (Q28) and crises "seeded identically for autopilot". CRN gives both. If player and autopilot have equal hazards they get the *same* events. Where they differ, the difference is caused by policy, and the report can say so ("Your deficits made a bond scare likelier").
**Rules:**
- Draw for every card every turn, even when it can't fire. That keeps it cheap and auditable, and keyed streams make it optional rather than required.
- Scheduled cards (debt ceiling, shutdown deadline, Fed chair term end, midterms) fire on fixed turns, not by hazard. Each has a `warn` lead so it's telegraphed at least one turn ahead (UX-3).
- Card *severity* draws use `draw(seed, 'events', turn, card.id + ':sev')`, also keyed.
- **Timing:** cards are drawn at the end of turn N−1, shown during turn N, and resolved in `endTurn` of turn N with the player's chosen option. If the player doesn't choose, the card's `default` option applies, and that's what the autopilot always gets. So "no decision" is well defined and identical for both runs.

### Pattern 3: One effect vocabulary → modifiers → trace (causal attribution)

**What:** Events, crisis options, EOs, Fed pressure, speeches and court rulings never touch state directly. They emit `Modifier { source, channel, amount, until }` on a fixed set of channels: `gap`, `inflation`, `expected`, `approval`, `trust`, `potential`, `debtBn`, `clout`, `fedTarget`, plus `region:<tag>` for voter effects. `step()` adds the active modifiers into its equations as named terms. Every equation records its terms in a trace.
**Why this is the answer to "how do we explain *why*":** The macro core is additive, apart from clamps and rounding. Decomposing each update into named terms gives *exact* attribution at the point of computation, and the engine stays the single source of causal truth. The UI only words it.

| Indicator delta | Terms (source ids) |
|---|---|
| Δgap | `momentum` ((ρ−1)·gap₋₁), `budget` (fiscal impulse), `fed` (real-rate drag), `debtStress`, `luck` (shock), plus one term per modifier source (`event:hurricane`, `eo:buyAmerican`, …) |
| Δunemployment | −okun × each Δgap term (linear, so exact) |
| Δinflation | `expectations`, `heat` (Phillips·gap), `tariffs`, `luck`, plus modifiers |
| ΔfedRate | `fed:inflation`, `fed:gap`, `fed:chair`, `fed:pressure` (each × smoothing), `rounding` |
| Δapproval | `honeymoon`, `jobs`, `prices`, `growth`, `luck`, plus modifiers, `rounding` |
| ΔrealIncome | `growth`, `budget:family` |

**Invariant, enforced by test:** for every indicator, `sum(terms) === after − before` within 1e-9. Clamps and rounding become explicit `clamp`/`rounding` residual terms. That test is the observability guarantee: nothing moves without a recorded reason.

```ts
// src/engine/effects.ts
export type Channel = 'gap' | 'inflation' | 'expected' | 'approval' | 'trust' | 'potential' | 'debtBn' | 'clout' | 'fedTarget';
export interface Modifier { source: string; channel: Channel; amount: number; until: number } // until = last turn active
export type Trace = Partial<Record<keyof Econ | 'approval' | 'clout', { source: string; amount: number }[]>>;
```

**Report card generation (app/content, not engine):** for each of the 8 indicators take the top 2 terms by |amount| and look up `text/why.ts[source]` → "Prices fell: the Fed raised rates; your tariff cut helped a little." A drift test asserts every source id the engine can emit has a template. Add a second line, "vs doing nothing", from `prosperity(you) − prosperity(autopilot)` per part. That separates skill from luck, which the trace alone can't do.

**Rejected alternative: counterfactual ablation** (rerun `step` once with each decision removed). It's generic, but it's N extra steps per turn, it's order-dependent with interactions, and it explains *decisions* but not mechanisms ("the Fed raised rates"). Keep it as an optional "what if I hadn't" button later.

### Pattern 4: Decisions are inputs; the engine charges costs

**What:** `Decisions` records raw choices only, and the engine computes the consequences: clout spent, vote result, court outcome.

```ts
export interface Decisions {
  bill?: { budget: BudgetDraft; deals: DealId[] };   // engine calls tally/voteOutcome (deterministic, no RNG)
  crisis?: Record<string, string>;                  // cardId -> optionId; missing = card.default
  orders?: string[];                                // EO ids signed this turn
  fed?: { nominate?: string; pressure?: boolean };
  speech?: string;
}
```

`Session` keeps calling the same pure functions (`tally`, `voteOutcome`, `cost(decisions)`) for the instant preview. The engine recomputes them at `endTurn`, so preview and result can't diverge. The engine rejects or clamps unaffordable choices (clout < cost), which matters once imported saves exist. This replaces `Decisions.clout`.

### Pattern 5: The per-turn report lives on the state it produced

**What:** `GameState.report: { trace: Trace; log: LogEntry[]; pending: Card[] }` describes "what happened in the quarter that produced this state". No signature change to `endTurn`, and history, autopilot, deep-equal determinism tests and replay all carry it for free.
**Trade-off:** It's a few KB per snapshot. With 33 snapshots × 2 runs that's negligible. `legacy()` can drop it: `step(s, {}, { legacy: true })` skips the event deck and EO carry-over and returns `report` empty.

### Pattern 6: Derived, not stored, voter geography

`voters.ts` is a pure function `stateView(state) → { code, approval, margin, ev }[]` computed from `state.approval`, `state.policy`, active `region:*` modifiers and `start.states`. Nothing per-state is stored except what changes non-derivably (none in v0.2). Starting formula, all coefficients in a named table like `C`:

```
lean_s     = sign(party) × (−margin2024_s − nationalMargin2024) / 2   // toward the president's party
approval_s = national + lean_s + Σ exposure_s[tag] × regionEffect[tag](policy, modifiers) + noise_s
noise_s    = small fixed draw(seed, 'voters', 0, code)                // stable per game, keeps maps from looking mechanical
EC         = Σ ev_s where approval_s-implied two-party share > 50; swing = |margin_s| < 3
```

Tariffs hit farm states through `exposure.farm × (tariff − baseTariff) × γ` (retaliation). That needs sourced per-state exposure fields in `us-2026.json` (USDA ERS farm share, BEA manufacturing share). This is a deliberate simplification of design Q22's sampled citizen population: aggregate per-state math gives the same map for v0.2 at ~1% of the code. Upgrade only if household-level effects (Your Household card) need it. Mark it with a `ponytail:` comment.

## Data Flow

### Turn flow

```
turn N starts: state_N (report.pending = cards drawn at end of N−1)
  └─ UI shows TurnReport overlay (state_N.report.trace vs state_{N−1}) → Crisis overlay per pending card
  └─ player edits draft: budget/deals, crisis choices, EOs, Fed, speech   (previews = pure engine fns)
Next turn ─► Session.buildDecisions(draft) → Decisions_N (inputs only)
          ├─ you:       state_{N+1} = endTurn(state_N, Decisions_N)
          ├─ autopilot: auto_{N+1}  = endTurn(auto_N, {})          // pending cards → default options
          ├─ inputs.push(Decisions_N); history.push(...); autopilot.push(...)
          ├─ localStorage autosave (toSave(session))                 // start-of-quarter save, no undo
          └─ overlay = election? (turn 16→17) : lost? end : report
```

### Inside `step` (engine)

```
cells: macro shocks, event uniforms, court draws      ← rng.ts (keyed, no state)
resolve: bill vote → policy; crisis options/defaults → modifiers; EOs → modifiers + court schedule;
         court rulings due this turn → remove/keep modifiers; Fed nominate/pressure → fed state + modifiers
equations: gap, u, inflation, expectations, Fed target(+chair, +pressure), debt, income, levels, approval
           each adds named terms to trace; clamps/rounding as residual terms
election: if turn === 16 → voters.tally(state) → state.election = { won, ev, byState }   (no halting)
draw next: hazards(state') × event uniforms(turn+1) → report.pending
return { ...state', report: { trace, log, pending } }
```

### Election and game over

- `endTurn` at turn 16 computes `state.election` and **does not halt**. The autopilot must keep running to turn 32 as a baseline even if *it* would have lost.
- `Session` treats `history.at(-1).election?.won === false` as game over for the player only. It opens EndOfTerm comparing `finalScore(you)` with `finalScore(autopilot[16])`.
- Label check: `turnLabel(16)` is Summer 2030, so the result is shown on arrival at turn 17 (Fall 2030, November). Say "Election night" when leaving turn 16, not "during" it.

### Save / load / replay (event-sourcing)

The input log **is** the save. States are always re-derived by replay (32 × 2 steps takes microseconds).

```json
{ "format": "govsim-save", "v": 1, "engine": 3,
  "seed": 123456, "start": { /* full Start incl. states[] */ },
  "options": { "party": "D", "unlockAll": false },
  "inputs": [ /* Decisions per completed turn */ ],
  "check": { "turn": 9, "hash": "9f2c…" } }
```

- **`v`** is the save *shape*. **`engine`** is a constant bumped whenever the model changes outcomes. On load: replay, then compare a hash of the final state with `check`. If they differ, load anyway and show "Saved with an older model; your country was re-simulated." No silent divergence.
- **Embed `start`** (14 numbers + 51 state rows, ~4 KB). A refreshed `us-2026.json` then doesn't silently change an old save's country.
- **Trust boundary:** `parseSave` validates the format tag, integer seed, `inputs.length < TOTAL_TURNS`, every id against the content tables, and numeric ranges against lever min/max. It replays inside try/catch. On any failure it rejects with a message and never half-loads. Engine-side cost checks (Pattern 4) make a tampered save unable to mint clout.
- **No migration code until a format ships.** During v0.2 development an incompatible `v` is discarded with a notice (YAGNI). Write the first migrator when v0.2 is released and `v` changes.
- **Storage:** one `localStorage` slot `govsim:save`, written in `nextTurn` (no `$effect`), plus Export (download JSON) and Import (file input → `parseSave`). The draft is not saved, which is the start-of-quarter semantics from design §8.

### Telemetry / observability (local only)

- **Run log** = `inputs[]` + each state's `report.log` (`{turn, kind: 'event'|'choice'|'vote'|'eo'|'court'|'fed'|'election', id, detail}`) + `report.trace`. Export JSON is the same file as the save, optionally with `report`s inlined for humans.
- **Enforced in CI:** (1) replay property test, live history deep-equals replay(save) for N random strategies × seeds; (2) trace sum-to-delta invariant; (3) no `Math.random`/`Date.now` in `src/engine`; (4) every emitted source id has copy + citation; (5) balance harness extended with crisis/EO strategies.
- **Headless replay CLI:** a vitest-run script `scripts/replay.test.ts` (or `pnpm replay save.json`) prints a per-turn table from an exported save, for bug reports and balance analysis. No network telemetry: static site, privacy promise (E5).

### Fed chair / pressure (Taylor rule integration)

Add `fed: { chair: 'hawk' | 'centrist' | 'dove'; credibility: number }` to `GameState`, with new `C` entries.
- Target = `neutral + π + (taylorInfl + chairTilt)·(π − 2) + taylorGap·gap + pressureCut`.
- `pressure` this turn: `fedTarget −0.25` modifier for 1 quarter, `expected +x` modifier, `credibility −y`. Low credibility raises `expectAdapt`, so repeated jawboning makes inflation stickier. That's the honest civics lesson.
- Chair nomination happens only when a scheduled `fed-chair-term` card fires. Confirmation is a deterministic Senate threshold from `start` seats + approval (no RNG needed).
- Trace sources: `fed:chair`, `fed:pressure`.

### EOs + courts

`orders.ts` rows: `{ id, label, cost, effects: Effect, legalRisk: 0..1, citation }`. Signing adds modifiers with `until = Infinity` and immediately draws `draw(seed, 'court', turn, id)`. If `u < legalRisk × courtLeanFactor(order, start.court)`, a challenge is filed and resolves 2 turns later with a second keyed draw. "Blocked" removes the modifiers and refunds nothing. Both steps are logged and telegraphed in the Powers screen ("In court, ruling in 2 turns").

Open design call for the user: should **EOs expire in the legacy projection** (the next president can revoke them; laws last)? It's accurate civics and makes legislation matter more than EOs. Recommended, but it changes scoring.

## Build Order (phases, by dependency)

| # | Phase | Depends on | Why here |
|---|---|---|---|
| 1 | **Engine foundations:** `rng.ts` keyed streams; `effects.ts` modifiers + trace with the sum-to-delta test; `Decisions` as inputs (bill/deals into the engine, drop net clout); `report` on state; legacy gating; `save.ts` (serialize/validate/replay) + autosave + export/import; replay property test; engine purity lint | none | Every later feature emits modifiers, draws keyed randomness and must replay. Retrofitting any of these after the events/EO code exists means rewriting it. |
| 2 | **Turn report card + Economy screen:** 8-part indicator table, you-vs-autopilot charts from history (chart dependency per STACK.md), Fed rate, `text/why.ts` | 1 (trace) | The first consumer of the trace validates the attribution design before 3 and 4 add source ids. It's also visible value early. |
| 3 | **Events & crises:** `content/events.ts` deck, CRN hazards, scheduled deadlines with warnings, crisis overlay, defaults = autopilot, briefing from pending cards (retire `content/sample.ts`) | 1, 2 | Needs modifiers and keyed streams. The report must already explain event effects. |
| 4 | **Your Powers:** EOs + court challenges, Fed chair/pressure in the Taylor rule, speech, myth cards | 1 (parallel with 3) | Same modifier/stream plumbing. The Fed change is inside `step` and touches the trace. |
| 5 | **Voters + Electoral College:** state exposure data fields (sourced), `voters.ts`, map (`us-atlas` + `topojson-client` per design D6), state panel, swing list, EC race bar | 1. Better after 3 and 4 so tariff/EO regional effects exist | Pure derived view. The data sourcing is the long pole, so start it in parallel during phase 3. |
| 6 | **Election night + second term + end of term:** election hook at turn 16, game-over path, EndOfTerm with `finalScore` vs autopilot, legacy, historian verdict (`text/verdict.ts` by score band + top trace contributors) | 5 | Needs the EC tally and stable scoring. |
| 7 | **Balance + hardening:** extend the harness with crisis/EO strategies and reelection-rate bounds, bump `engine`, freeze save `v: 1` | all | Tuning after all mechanics exist. Freezing the save format earlier would just force migrations. |

Phases 3 and 4 can run in parallel. Phase 5's data work can start during phase 2.

## Scaling Considerations

| Concern | Reality for this project |
|---|---|
| Compute | `step` is about 100 flops. Full game + autopilot + 2 legacy projections is well under 1 ms. No worker needed (design §8 already says profile first). |
| Snapshot memory | 33 snapshots × 2 runs × a few KB of report. Fine. `$state.raw` avoids deep proxies on them. Keep it that way: never `$state` the history. |
| Save size | Inputs + `start` is about 10 KB, far under localStorage limits. |
| First bottleneck | Rendering: the 51-path SVG map and 8 charts re-deriving on every draft edit. Derive `stateView` from `session.current` + `draft` only, and memoize per turn. |

## Anti-Patterns

### Anti-Pattern 1: Drawing event randomness from the shared threaded rng
**What people do:** Add `[u, rng] = nextRandom(rng)` inside the event or court code.
**Why it's wrong:** Draw counts start to depend on decisions. The autopilot then sees different macro shocks, "vs doing nothing" stops measuring skill, and replay breaks after any content change.
**Do this instead:** `draw(seed, stream, turn, key)` everywhere. No rng in state.

### Anti-Pattern 2: Explaining "why" in the UI from before/after diffs
**What people do:** The report compares `previous` and `current` and guesses a cause with heuristics ("inflation up and tariffs up → tariffs").
**Why it's wrong:** It's wrong whenever several causes overlap, it duplicates model knowledge outside the engine (an SSOT violation), and it can't be tested for honesty, which is the project's core value.
**Do this instead:** The engine emits the trace; the UI only maps source ids to words.

### Anti-Pattern 3: UI-computed outcomes passed as Decisions
**What people do:** Keep `Decisions.clout` (net delta) and add `Decisions.approvalBonus`, `courtResult`, and so on.
**Why it's wrong:** The log records outputs, so a save can't be validated and tampering is trivial. Preview and result can drift apart.
**Do this instead:** Raw choices in; the engine computes costs and outcomes with the same pure functions the UI previews with.

### Anti-Pattern 4: Halting the engine on election loss
**What people do:** `endTurn` returns the state unchanged once the election is lost.
**Why it's wrong:** The autopilot can "lose" too and would stop, which breaks the baseline for turns 17–32.
**Do this instead:** Record `state.election`; only `Session` decides game over for the player.

### Anti-Pattern 5: Events and EOs leaking into the legacy projection
**What people do:** `legacy()` keeps calling the full `step`, so crises keep firing for 10 projected years.
**Why it's wrong:** The legacy score turns into luck, not policy durability.
**Do this instead:** Run `step(s, {}, { legacy: true })` with no deck, persistent policy only (and possibly EOs expire, per the open call above).

### Anti-Pattern 6: Overlays as rail screens or ad-hoc modals
**Do this instead:** Add one `session.overlay` union and one `Overlay.svelte` shell that enforces the §7d split, the same way `ScreenLayout` does for screens. Overlays are not registry rows, so the rail stays the six screens.

## Integration Points

### External

| Service | Pattern | Notes |
|---|---|---|
| `localStorage` | Synchronous write in `Session.nextTurn`, read on boot | Wrap in try/catch (private mode, quota) and fall back to export-only. |
| File export/import | `Blob` + `<a download>`; `<input type="file">` → `parseSave` | Native platform, no dependency. Validate at the boundary. |
| Map topology | `us-atlas` states-albers-10m via the asset manifest (design §10) | FIPS ids ↔ state codes need a mapping table. ME/NE congressional-district EVs aren't in `margin2024`, so award them statewide in v0.2 and note it in the Learn strip. |

### Internal boundaries

| Boundary | Communication | Notes |
|---|---|---|
| UI ↔ Session | Screens edit `session.draft`; read `$derived` fields | Unchanged rule: screens never call `endTurn`. |
| Session ↔ Engine | `endTurn(state, Decisions)`; pure previews (`estimate`, `tally`, `cost`, `stateView`, `hazardPreview`) | Decisions are inputs only. |
| Engine ↔ Content | Engine imports `content/*.ts` tables (data only) | A purity test keeps svelte/app/ui imports out of both folders. |
| Engine trace ↔ Copy | Source id strings | Drift test: every emitted id has a template + citation (E7). |
| Save ↔ Engine | `replay(save) = inputs.reduce(endTurn, newGame(seed, start))` | `engine` version + check hash detect model drift. |

## Open questions for the roadmap

1. **President's party.** It's needed to orient `margin2024` for per-state approval. Design A4 says it's chosen at New Game, and no New Game screen exists. Default to letting the player pick on a minimal start overlay, with the choice stored in `options`.
2. **Midterms at turn 8** (design §2/§3) are not in the v0.2 feature list. Without them Congress never re-rolls. Recommend a minimal seat re-roll from approval, reusing `voters.ts` national swing.
3. **Should EOs expire in the legacy projection?** (Recommended; it's a scoring change.)
4. **Data sourcing** for per-state exposure fields (farm, manufacturing, energy). Needs citations per E7 before phase 5 can finish.

## Sources

- Codebase at `63851d7` (HIGH): `src/engine/game.ts`, `budget.ts`, `congress.ts`, `balance.test.ts`, `src/app/session.svelte.ts`, `screens.ts`, `indicators.ts`, `src/ui/ScreenLayout.svelte`, `src/data/schema.ts`, `us.ts`, `data/us-2026.json`, `docs/design.md` §2, §3, §7b–§7d, §8, §10
- Common random numbers (variance reduction for comparing policies on identical randomness): standard simulation technique (Law & Kelton, *Simulation Modeling and Analysis*, ch. on variance reduction) (HIGH, textbook)
- Counter-based / keyed RNG for reproducible parallel streams (Salmon et al., "Parallel Random Numbers: As Easy as 1, 2, 3", SC'11). The `fmix` finalizer is MurmurHash3's (HIGH, well established)
- Event sourcing (state = fold of an input log) as the save/replay model, as in lockstep-deterministic strategy games (MEDIUM, community practice)

---
*Architecture research for: deterministic presidential strategy game, v0.2 integration*
*Researched: 2026-10-09*
