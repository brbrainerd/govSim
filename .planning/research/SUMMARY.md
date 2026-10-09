# Project Research Summary

**Project:** govSim, milestone v0.2 "Playable First Term"
**Domain:** Static, open-source, privacy-first, deterministic turn-based civics / political strategy game (browser; teens 14+ and classrooms)
**Researched:** 2026-10-09
**Confidence:** HIGH for engineering direction (stack, architecture, code-derived pitfalls). MEDIUM for gameplay tuning numbers and civics model coefficients. LOW-MEDIUM for legal readings (secondary sources, not legal advice).

Inputs: [STACK.md](STACK.md) · [FEATURES.md](FEATURES.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [PITFALLS.md](PITFALLS.md) · [DISTRIBUTION.md](DISTRIBUTION.md)

## Executive Summary

v0.2 turns a working macro engine with three screens into a full game: seeded crises with decision modals, an explained turn report, Economy / Voters / Your Powers screens, and an election at turn 16 leading to a second term and a scored end. Every comparable game (Democracy 4, Suzerain, Political Machine, Frostpunk, Into the Breach, RimWorld, CK3, iCivics) points the same way. Players forgive bad luck if it is telegraphed, shared and named. They give up when they cannot trace an outcome to its cause, when crises pile up or repeat, or when the game feels secretly rigged. govSim already has the feature none of these games has: a same-seed "doing nothing" autopilot. Every v0.2 design choice should protect that comparison and put it on screen.

All five researchers independently converge on one engine rewrite, which must land first, before any content: **(1) keyed, counter-based RNG streams** `draw(seed, stream, turn, key)` replacing the single threaded `state.rng`, so no player decision can shift another random draw; **(2) an engine-emitted causal trace** in which every indicator delta is a sum of named terms (budget, Fed, event X, momentum, luck) and a test checks the sum equals the change; **(3) decisions as raw inputs**, with the engine charging costs, so that **an input log is the save, the replay, the share code, the bug report and the golden test fixture**; and **(4) no telemetry, enforced by a build-only CSP `connect-src 'none'`** plus egress and source-scan tests. That foundation makes "same seed, same crises", "every number has a why" and "inputs never leave the browser" properties CI can check rather than intentions. New runtime deps are limited to four packages that were already approved (`layerchart`, `us-atlas`, `topojson-client`, `d3-geo`). Everything else is engine TypeScript plus native platform APIs.

The main risks are mostly self-inflicted and cheap to prevent early: RNG entanglement silently breaking the autopilot comparison; hand-written "why" text drifting away from the model; a hub score (term-end index) that disagrees with the end-screen score (½ index + ½ legacy), which reads as a bait-and-switch; Electoral College errors (ME/NE districts happen to cancel at baseline, the 2024 map starts asymmetric by party, and election turns are labelled "Summer 2030"); partisan-bias perception; and cross-browser float drift breaking shared replays. There is also a non-code blocker: **the public repo has no LICENSE file**, so legally it is all rights reserved. Several design decisions (listed under "Decisions Needed") change scoring or engine shape and should be made before Phase 1 planning.

## Key Findings

### Recommended Stack

The base stack (Svelte 5.57, Vite 8, TS 6, vitest, tokens SSOT) is unchanged. v0.2 adds four exact-pinned runtime packages, all MIT/ISC, all already approved in design.md §9. Events, Electoral College, EOs, courts, Fed chair and legacy are plain engine code. Observability is local and deterministic: a 14-gate CI suite, no remote services. Detail: [STACK.md](STACK.md).

**Core technologies:**
- `layerchart` 2.6.0 (exact pin): Economy charts only, lazy-loaded with that screen. Svelte-5 native and works without Tailwind. Minor versions have broken APIs before, so pin exactly and add a chart smoke test.
- `us-atlas` 3.0.1 + `topojson-client` 3.1.0 + `d3-geo` 3.1.1: Voters map as a **hand-rolled ~15-line SVG** (pre-projected Albers, null projection, one `<path>` per state), not LayerChart's `<Chart geo>`. Topology is loaded via dynamic `import()` inside the Voters chunk.
- Dev: `@playwright/test` 1.64.0 (run **only** in the matching Docker image for screenshot baselines), `@axe-core/playwright` 4.13.0 (**MPL-2.0, needs a logged exception**), `fast-check` 4.10.2 (property tests over any seed × any decision sequence), `@vitest/coverage-v8` 5.0.3, `sharp` + `pixelmatch`.
- Native instead of packages: `CompressionStream('deflate-raw')` for share codes, `crypto.subtle.digest` for replay hashes, `node:zlib` budget script, `pnpm licenses list` license gate, `<svelte:boundary onerror>` + window listeners for local error capture, `performance.mark` for interaction timing, `svelte-check --fail-on-warnings` for compile-time a11y.
- Explicitly rejected: PostHog/GA/Sentry/GlitchTip/OTel/Umami/Plausible (minors' data, servers, CSP holes); `seedrandom`, `lz-string`, `pako`, `pngjs`, `size-limit` (duplicate stdlib/platform); ESLint for now (source-scan vitest tests extend the existing `screens.test.ts` pattern).

### Expected Features

Ten fun/fairness rules derived from comparable games apply to every feature: every number has a why (≤3 causes + luck); one currency per cost, shown before commit; telegraph threats ≥1 turn ahead (calendar ≥2); luck is neutral and visible ("Autopilot got this hurricane too"); a paced crisis director, not independent dice; recoverable by default (no single event costs > ~4 index points; hard fails only after ≥2 turns of warning); 2–3 real options plus visible "do nothing"; delayed consequences return by name; a ritual report every turn; first term 30–45 min (one class period). Detail: [FEATURES.md](FEATURES.md).

**Must have (table stakes):**
- Seeded crisis deck, identical exogenous crises for autopilot, with a 2–3 option modal plus autopilot default; effects flow through the macro model and decay
- Calendar deadlines (shutdown at fiscal-year start, debt-ceiling X-date) with countdowns, resolved through Congress
- Turn report card: 8 indicators + approval + clout, value/unit/arrow/word/why, events list with "Autopilot faced this too"
- Economy screen: you-vs-autopilot charts for the 8 scores, Fed rate with Taylor explainer, why panel, table fallback
- Voters screen: state map from 2024 margins, state panel, swing list, EC bar to 270, tipping-point state, table fallback, correct EC rules
- Your Powers: ~10 cited EOs with clout cost, court-risk band, delayed ruling, revoke; speech; Pressure the Fed; Fed chair / SCOTUS nominations on vacancy; 5 spectrum-balanced myth cards
- Election night at turn 16 (skippable), why-you-won/lost + retry, second term to turn 32, end screen with score vs autopilot, legacy and historian verdict tiers
- Autosave every turn, JSON export/import

**Should have (differentiators):**
- "You vs doing nothing" on every surface, including autopilot's own simulated election result
- An explicit "Luck" line in every why; "What you didn't see coming" (1–2 items)
- Telegraphed risk bands (hurricane season, outbreak abroad, debt stress)
- Badges tied to real policy milestones (~12); rally-around-the-flag on well-handled disasters
- Historian verdict as tiers with stated thresholds, not real presidents
- Share-your-run code (classroom comparison) and "Report a problem" bundle

**Defer (v0.2.x / M2+):**
- Regional event effects on state approval and region-targeted speeches (once the state model is stable)
- Data-driven historian thresholds from the seed distribution (start fixed)
- Event variant pool expansion; Your Household card; filibuster / full Senate bloc model; impeachment; foreign crises (M3)
- Distribution beyond the web build: itch.io and donations at public alpha, Steam Supporter Edition at v1.0

**Anti-features (do not build):** independent per-quarter crisis dice; policy-modulated *occurrence* of exogenous crises; instant game-over from one event or meter; precise % odds (use qualitative bands); hidden luck adjusters / rubber-banding; mid-turn toasts; branching narrative trees; comparisons to real presidents; campaign micro; coefficients inline; legally impossible EOs (route to myth cards); unskippable animations; intra-turn undo.

### Architecture Approach

Keep the existing layering (UI → Session → pure engine → content/data tables) and make the engine the single source of causal truth. Every mechanic (events, crisis options, EOs, Fed pressure, speeches, court rulings) emits `Modifier { source, channel, amount, until }` on a fixed channel vocabulary. `step()` folds them into its additive equations as named terms and records a trace. The UI only maps source ids to words. The per-turn `report { trace, log, pending }` lives on the `GameState` it produced, so history, autopilot, replay and deep-equal tests carry it for free. Save = `{ format, v, engine, seed, start, options, inputs[], check }`, and states are always re-derived by replay. Detail: [ARCHITECTURE.md](ARCHITECTURE.md).

**Major components:**
1. `engine/rng.ts` (new): keyed stateless draws per (seed, stream ∈ macro/events/court/fed/voters/election, turn, key), MurmurHash3 finalizer over mulberry32.
2. `engine/effects.ts` (new): channels, modifiers, trace accumulation with a sum-to-delta invariant (clamps and rounding become explicit residual terms).
3. `engine/game.ts` (modified, largest change): `step → state + report`, Fed chair/pressure terms in the Taylor rule, election hook at turn 16 **that never halts** (autopilot must run to 32), `legacy: true` mode with no deck and no event carry-over.
4. `engine/events.ts`, `powers.ts`, `voters.ts` (new): one file per mechanic; `voters.ts` is a pure derived `stateView(state)`, nothing stored per state.
5. `content/events.ts`, `orders.ts`, `myths.ts`, `content/text/why.ts`, `verdict.ts` (new): data tables with citations, importable by the engine; a purity test keeps svelte/app/ui out of engine and content.
6. `app/save.ts` (new) + `session.svelte.ts` (modified): inputs log, overlay union, autosave in `nextTurn`, `parseSave` as a strict trust boundary; `Decisions` holds raw choices (bill/deals, crisis choices, orders, fed, speech), and the net-clout field is dropped.
7. `ui/Overlay.svelte` (new): one shell enforcing the §7d split for Crisis / TurnReport / ElectionNight / EndOfTerm. Overlays are not rail screens.

### Critical Pitfalls

Top items from [PITFALLS.md](PITFALLS.md). Each has a stable `GR-nn` guardrail the roadmap can cite as a success criterion.

1. **RNG stream entanglement** breaks "same seed, same crises": one conditional draw on the shared stream desyncs player and autopilot for the rest of the game. Prevent with keyed streams in Phase 1, before any content. Guardrails: GR-01 (no-decision player crisis log === autopilot over 200 seeds), GR-02 (exogenous calendar byte-identical), GR-03 (lowering risk only removes crises).
2. **Hub score ≠ final score.** `vsNothing` uses the term-end index, while `finalScore` = ½ index + ½ legacy, so a deficit-spender sees "+6" for 16 turns and then loses. Prevent with one exported scoring function feeding both, and a projected-final headline from turn 1 (GR-04).
3. **Opaque or dishonest "why".** Hand-written or UI-inferred causes drift from the model and teach false civics. Prevent with an engine trace: conservation test (GR-05), the named cause must be the largest term or the copy says "several things" (GR-06), every rendered number carries a reason id (GR-07).
4. **Unfair-feeling crisis RNG and dominant options.** Pile-ups, droughts, turn-1 crises, one always-best option, clout hoarding or speech spam. Prevent with a paced director (none in turns 1–2, ≤1 modal per turn, cooldowns, per-term min/max), no Pareto-dominated options, a clout cap, and a sensible autopilot default (not a strawman, not a genius). Guardrails GR-08 to GR-12.
5. **Electoral College and neutrality errors.** ME/NE statewide-only data happens to reproduce 312–226 but breaks under any swing; a 269–269 tie needs per-state House delegations; the 2024 map's tipping point (~PA R+1.7) gives the two parties unequal reelection odds; party red/blue collides with the "danger" token; content wording can drift partisan. Guardrails GR-13 to GR-23 (district rows, tie fixture, ≤5 pp party symmetry, player-relative map colours, left/right tag balance, party/person-name deny-list, coefficient citation registry).

Also important: reading-level gate before the first content is written (GR-24/25); Safari 7-day storage eviction, so offer export and call `navigator.storage.persist()` (GR-31 to GR-34); a committed `balance-report.json` so coefficient tweaks show up as reviewed diffs (GR-35/36); election-night forecast calibration so the result is neither a coin flip nor a cutscene (GR-37); crisis choices as drafts that resolve only in `endTurn` (GR-38).

### Distribution, Publishing & Monetization (5th dimension)

Recommendation: **keep the web build free, ad-free and tracking-free on a custom domain. Donations on adult-facing pages only. A paid Steam "Supporter Edition" (Electron + steamworks.js) at v1.0. Grants later via an institutional partner.** Detail: [DISTRIBUTION.md](DISTRIBUTION.md).

- **Blocker (do now):** the public repo has `licenseInfo: null`. Add `LICENSE` (MIT, code), `LICENSE-ASSETS` (CC BY 4.0: art, text, data compilation), a generated `THIRD_PARTY_LICENSES` (OFL fonts, MIT/ISC notices, which must also ship in any Electron build), `TRADEMARKS.md` (forks must rename, since the name is the only moat under MIT), and `CONTRIBUTING.md` with DCO rather than a CLA.
- **Privacy strategy = collect nothing.** The amended COPPA Rule has been fully enforceable since 2026-04-22 (persistent identifiers count as personal information), the UK Children's Code covers under-18s, and classroom use means some players will be under 13. Collecting nothing removes consent UI, age gates and DPAs. Ship `PRIVACY.md` + an in-game About/Privacy/Credits screen that discloses GitHub Pages IP logging.
- **v0.2 distribution scope:** manual-trigger Actions deploy to GitHub Pages (`workflow_dispatch`), custom domain attached **before any public link is shared** (localStorage saves are bound to origin), no monetization code. Hold `FUNDING.yml` until a funding-neutrality policy exists (no parties, PACs, 501(c)(4)s or advocacy orgs; no editorial input; public `FUNDERS.md`).
- **Later:** itch.io free/PWYW + GitHub Sponsors + Ko-fi + Show HN at public alpha (target Civic Learning Week, 2027-03-08, after the 120th Congress data refresh); Steam Coming Soon page during the alpha, October 2027 Next Fest demo, v1.0 before the 2028 cycle. Reject ads, analytics IDs, IAP/loot boxes, Poki/CrazyGames, school licensing, partisan sponsors. Defer iOS/Android (state age-signal laws).
- **Name risk:** "GovSim" is a NeurIPS 2024 LLM benchmark and two itch.io games. Keep it as the repo/code name, but pick a distinctive public title before the Steam page (USPTO search not yet done).

## Cross-Research Agreements

All researchers reached these conclusions independently. Treat them as settled.

| Agreement | Researchers | Implication |
|---|---|---|
| Keyed / split RNG streams, landed first | STACK, FEATURES, ARCHITECTURE, PITFALLS | Phase 1, before golden snapshots and before any crisis content. A one-time break of all seed outcomes is acceptable now (no saves exist). |
| Engine-side causal trace; UI only words it | FEATURES, ARCHITECTURE, PITFALLS | Build once in `step()`. Report card, Economy why, "didn't see coming" and why-you-lost all read it. |
| Input log = save = replay = share code = bug report = golden fixture | STACK, ARCHITECTURE, PITFALLS | One format, one strict validator at the trust boundary, engine/data version + check hash for drift detection. |
| No telemetry, CSP-enforced privacy | STACK, PITFALLS, DISTRIBUTION | Build-only CSP `connect-src 'none'` + Playwright egress test + source scan; balance signal from voluntarily shared run codes and the harness. |
| Decisions are raw inputs; engine charges costs | ARCHITECTURE, PITFALLS (save tampering) | Drop `Decisions.clout`; preview and result use the same pure functions. |
| Exogenous crises identical; policy acts on severity/recovery and endogenous risks | FEATURES, ARCHITECTURE, PITFALLS | Reject design Q28 "policy modulates occurrence" as written for exogenous events (see D2). |
| Calendar labels are wrong today | FEATURES, ARCHITECTURE, PITFALLS | Turn 16 = "Summer 2030" (not a presidential year, not November). Must be fixed before any deadline or election copy. |
| Minimal midterms are needed | FEATURES, ARCHITECTURE, PITFALLS | A "full first term" without them will feel wrong to civics-literate players. |
| Election never halts the engine | ARCHITECTURE, FEATURES | Autopilot must run to turn 32 as a baseline; only `Session` ends the player's game. |
| Legacy projection runs without events | ARCHITECTURE, PITFALLS | `step(s, {}, { legacy: true })`, otherwise legacy becomes luck. |

## Decisions Needed

Open decisions the user must make. Each one changes engine shape, scoring or public-facing commitments. Researchers' recommendations are in bold. Resolve D1 to D5 and D10 before Phase 1 planning.

| # | Decision | Options | Recommendation | Why / source |
|---|---|---|---|---|
| D1 | **Calendar labels vs election timing** | (a) Term-relative labels "Year N · Season", turn 1 = Winter, turn 8 = Fall Y2, turn 16 = Fall Y4; (b) keep real dates and hold elections on Fall turns 9/17; (c) keep current labels and announce the election when leaving turn 16 | **(a) Term-relative**, keep 2026 data as the starting state, real-date mapping in a tooltip, plus an in-game note that the term is fictional and off-cycle | (b) still gives "Fall 2030", which is not a presidential year; (c) teaches wrong civics. Also avoids the real 2026 midterm landing on turn 1 against a pinned 119th Congress. FEATURES, PITFALLS GR-17. ARCHITECTURE's "show it on arrival at turn 17" only works under (b). |
| D2 | **Crisis odds vs autopilot fairness split** (design Q28) | (a) Policy modulates occurrence of all crises; (b) exogenous pre-rolled and identical, policy changes severity/recovery; endogenous (recession pressure, financial shock, unrest, debt crisis) via CRN hazards on the same keyed uniform or state thresholds, labelled "Caused by conditions: autopilot didn't face this" | **(b)** | (a) makes the score luck-dependent. CRN keeps any modulation monotone: lower risk only removes crises (GR-03). The director must use only keyed draws and turn numbers, never player state. Prefer a constrained pre-rolled schedule over a pity counter: same pacing guarantees, no hidden adjuster. |
| D3 | **Midterms in v0.2 scope** | (a) Skip; (b) minimal: re-roll House groups from approval at turns 8 and 24, re-roll only the Senate class that is up (~⅓), shown as a short results card on the election-night component; (c) full Senate bloc model | **(b) Minimal** | Not in the PROJECT.md target list, but all three researchers flag it. Must touch the placeholder 5-group `congress.ts`. Bound the midterm penalty to avoid a death spiral (GR-18/19). |
| D4 | **Party fairness centring** (and the party pick it requires) | (a) Centre swing on the national popular vote (ARCHITECTURE's starting formula); (b) centre on the tipping-point state so D and R start with equal reelection odds while keeping the real state ordering | **(b) Tipping-point centring**, plus a minimal New Game party pick stored in `options`, all margins expressed as "your party", and player-relative map colours (sage/sky + hatching, not red/blue) | Under (a) a D president needs ~1.7 points just to break even. Players read that as bias. GR-16: ≤5 pp reelection difference by party over 300 seeds; the engine stays party-blind. |
| D5 | **EOs expire in the legacy projection** | (a) EOs persist for 10 years like laws; (b) EOs drop out of the legacy projection (a successor can revoke them) | **(b) Expire** | Accurate civics, and makes legislation worth more than EOs. It is a scoring change, so decide before the balance report is committed. ARCHITECTURE. |
| D6 | **axe-core MPL-2.0 license exception** | (a) Log a dev-only exception; (b) no automated runtime a11y audit | **(a) Log it** in design.md §9 and in the license gate allowlist: dev-only, never bundled, file-level copyleft that does not reach govSim code | No MIT tool of comparable quality exists; WCAG AA is a hard constraint. STACK. |
| D7 | **Project license** | MIT code + CC BY 4.0 art/text/data; or GPL; or data as CC0 | **MIT (code) + CC BY 4.0 (art, text, data compilation)**, OFL fonts unchanged, `TRADEMARKS.md`, DCO. CC0 for data is acceptable if maximum reuse matters more than attribution | Repo is public with no LICENSE today, which is a blocker. Matches D1 policy in PROJECT.md. GPL would not stop ad-laden repackages; only the trademark does. DISTRIBUTION. |
| D8 | **Public title / name collision** | Keep "govSim" publicly; pick a distinctive display title | **Keep `govSim` as repo/code name, choose a distinctive public title before the Steam page / public alpha**, after a USPTO search | NeurIPS "GovSim" benchmark dominates search; two itch.io "Gov Sim" games; descriptive marks are weak. Not blocking v0.2 code, but should come before any public link. |
| D9 | **Custom domain** | Ship on `brbrainerd.github.io/govSim`; buy a domain | **Buy and attach a custom domain before any public link is shared** | localStorage saves are bound to origin, so a later move silently wipes every player's save. A stable domain also lets school filters allow-list it, and makes a later switch to Cloudflare Pages invisible. DISTRIBUTION. |
| D10 | **Cross-browser replay determinism** | (a) Accept same-engine-only replay: snapshots or check hash are truth, cross-browser shares show "re-simulated" on mismatch; (b) make the engine bit-reproducible: ban `Math.log/exp/sin/cos/tanh/pow` in `src/engine` (source scan), replace with arithmetic-only implementations (e.g. integer/table or Irwin–Hall normals instead of Box–Muller, polynomial `ln/exp`); verify with GR-32 on Node + WebKit + Firefox | **(b)**, done in Phase 1 alongside the keyed-RNG rewrite (goldens break once either way). Keep ARCHITECTURE's check hash as the backstop | ECMAScript does not pin transcendental results, so V8 and JavaScriptCore can differ in the last bit and flip a threshold (crisis, election). Share-your-run is a classroom feature (Chromebook vs iPad), so (a) undermines it. PITFALLS (LOW-MEDIUM on how often drift actually happens; spike it). |
| D11 | **On-screen score vs final score** | (a) Keep term-end `vsNothing` on the hub; (b) one headline = projected final score (same function as the end screen, recomputed on Next turn); (c) show "Now" and "In 10 years" side by side | **(b), with (c) as the breakdown** | Avoids the bait-and-switch. 40 extra steps per turn is negligible. GR-04: sign agreement ≥95% at turn 16; maxDeficit shows negative before turn 16 in ≥80% of seeds. |

Smaller conflicts between researchers, resolved here:
- **ME/NE districts:** FEATURES would defer them to v0.2.x; PITFALLS says never past the Voters phase. **Include them in the Voters phase.** It is 5 sourced rows, and the cancelling-errors coincidence makes totals-only tests meaningless.
- **269–269 tie:** **add per-state House delegations** (50 rows from Clerk data) so the contingent election resolves correctly (GR-15). It also makes a good myth-card moment.
- **Save format:** ARCHITECTURE says input log only, re-derive states; PITFALLS wants snapshots too. **Input log + embedded `start` + engine/data version + check hash**, no snapshots (D10 makes replay trustworthy). No migration code until a format ships; freeze `v: 1` at milestone end and start GR-33 fixtures then.
- **Phase order of Economy vs Crises:** ARCHITECTURE puts report card + Economy before events (to validate the trace on a first consumer); PITFALLS puts crises + report first. **Report card + Economy first.** Events then arrive with explanations already working.
- **Readability tooling:** PITFALLS suggests `flesch-kincaid` + `syllable` (wooorm) as exact-pinned dev deps; STACK didn't evaluate them. Run them through the license gate at install.

## Implications for Roadmap

Suggested structure: 8 phases. Do the license blocker immediately as a quick task, not a phase.

### Phase 0 (quick task, now): License files
**Rationale:** The public repo has no license, so contributions and reuse are legally unclear. It takes minutes and blocks nothing else.
**Delivers:** `LICENSE` (MIT), `LICENSE-ASSETS` (CC BY 4.0), README license section, `TRADEMARKS.md`, `CONTRIBUTING.md` (DCO). Depends on D7.

### Phase 1: Engine foundations
**Rationale:** Every later feature emits modifiers, draws keyed randomness and must replay. Retrofitting any of these after content exists means rewriting the content and re-tuning the balance. All researchers agree this comes first.
**Delivers:** `rng.ts` keyed streams; deterministic-math decision implemented (D10); term-relative calendar (D1); `effects.ts` modifiers + trace with the sum-to-delta test; `report` on `GameState`; `Decisions` as raw inputs with engine-charged clout; `legacy: true` gating; party in `options` (D4); coefficient registry (`C` keys ↔ `COEFF_SOURCES` with citation + range).
**Addresses:** prerequisites for every P1 feature in FEATURES.md.
**Avoids:** Pitfall 1 (GR-01/02 scaffolding), Pitfall 3 (GR-05), Pitfall 9 (GR-22), Pitfall 13 float drift (GR-32).

### Phase 2: Run log, saves & enforced guardrails
**Rationale:** Golden replays, invariants and content gates have to exist before the first crisis is written, so every later phase is measured against them (PITFALLS ordering implication).
**Delivers:** save/run-log format + `parseSave` validator (size caps, finite numbers, ids against content tables, decompression-bomb limits) + autosave + export/import + `navigator.storage.persist()`; replay property test; golden replay snapshots (~6 logs); fast-check invariants; engine purity / privacy source scans; build-only CSP plugin; coverage floor; committed `balance-report.json` with a memoized harness; content gates (FK ≤ 9 pooled, 20-word sentences, jargon only in `realTerm`, party/person deny-list, required citations); Playwright + axe + visual baselines (in Docker) on the existing three screens; CI split into check/unit/build/e2e; branch protection as required checks; license allowlist + exact-pin gate.
**Uses:** fast-check, coverage-v8, Playwright, axe (D6).
**Avoids:** Pitfalls 10, 13, 14 (GR-24/25, GR-31/32/34, GR-35/36).

### Phase 3: Turn report card + Economy screen
**Rationale:** First consumer of the trace. Validates the attribution design before events and EOs add source ids, and gives visible value early.
**Delivers:** `Overlay.svelte` shell; TurnReport overlay (top-3 movers expanded, dead-band "steady", luck line, "vs doing nothing"); 8-part `indicators.ts`; `text/why.ts` with a drift test (every emitted source id has copy); Economy screen with lazy LayerChart you-vs-autopilot charts, Fed rate + Taylor explainer, why panel, table fallbacks, zero-based axes; projected-final headline in the top bar (D11).
**Implements:** Pattern 3 (trace → copy), Pattern 5 (report on state).
**Avoids:** Pitfall 2 (GR-04), Pitfall 3 (GR-06/07), Pitfall 11 (GR-29), Pitfall 22 chart lies.

### Phase 4: Events & crises
**Rationale:** Needs keyed streams, modifiers and a working report so event effects are explained the moment they land.
**Delivers:** `content/events.ts` deck (~11 types × 1–2 variants, tagged `challenges`/`target`); exogenous pre-rolled schedule + director (none on turns 1–2, ≤1 modal per turn, ≥8-turn cooldowns, ≤1 major per 4 turns, no repeated variant) and endogenous CRN/threshold events (D2); scheduled deadlines (shutdown, debt ceiling) with ≥2-turn countdowns, resolved via Congress; crisis overlay as a draft resolved in `endTurn`; `autopilotChoice` defaults; rally-around-the-flag; "Autopilot faced this too"; risk bands; retire `content/sample.ts`; harness event-response strategies; badges and "What you didn't see coming" if capacity allows (P2 priority).
**Avoids:** Pitfalls 1, 4, 5, 6, 8, 16 (GR-01 to GR-03, GR-08 to GR-12, GR-18, GR-38).

### Phase 5: Your Powers
**Rationale:** Same modifier/stream plumbing as events. Can run in parallel with Phase 4 if delayed resolution (court rulings 1–3 turns later) is a scheduled-modifier mechanism built in Phase 1; otherwise run it after Phase 4 and reuse event scheduling.
**Delivers:** `content/orders.ts` (~10 EOs with `legalBasis`, `challengeRisk`, citation); keyed court draw + delayed named ruling + revoke; Fed chair (`hawk/centrist/dove`) and pressure with credibility → stickier inflation; deterministic Senate confirmation threshold; SCOTUS vacancy nomination; speech with diminishing returns; 5 spectrum-balanced myth cards (mechanics, not values), first-visit reward tracked in game state; clout cap; lever sensitivity sweep; EO legacy expiry (D5).
**Avoids:** Pitfalls 5, 9, 11, 17, 18, 20 (GR-10/11, GR-20, GR-28, GR-39 to GR-41).

### Phase 6: Voters & Electoral College (+ minimal midterms)
**Rationale:** Pure derived view, better once EO/event regional effects exist. Data sourcing is the long pole, so **start it during Phase 3**.
**Delivers:** sourced data additions (ME/NE district rows, per-state House delegations, per-state exposure fields such as farm and manufacturing share); `voters.ts` with tipping-point centring (D4); hand-rolled SVG map with keyboard-focusable states, text/pattern encoding, ME-2/NE-2/DC inset chips, sortable table fallback; state panel, swing list, EC bar to 270, tipping-point highlight; forecast with honest ranges from ~turn 12; minimal midterms at turns 8/24 (D3).
**Avoids:** Pitfalls 7, 8, 9 (GR-13, GR-14, GR-16, GR-19, GR-23).

### Phase 7: Election night, second term & end of term
**Rationale:** Needs the EC tally and stable scoring.
**Delivers:** non-halting election hook at turn 16 (autopilot gets its own simulated result); small keyed election-day shock; skippable election-night reveal in a fixed real-world order with a reduced-motion/calm variant; contingent election on a tie; why-you-won/lost card from the trace + retry from turn start; second term to turn 32; EndOfTerm with score vs autopilot, legacy, historian tiers (`text/verdict.ts` keyed on bands, never ideologies); defeat at 16 goes to the end screen with legacy projected from 16.
**Avoids:** Pitfalls 7, 15, 19, 23 (GR-15, GR-17, GR-37).

### Phase 8: Balance, hardening & release readiness
**Rationale:** Tune once all mechanics exist; freezing the save format earlier would only force migrations. The distribution artifacts land here because the build has to be shareable.
**Delivers:** full harness (spam/hoard/always-X strategies, greedy hill-climber trained on seeds 1–40 and evaluated on 41–80, reelection-rate bands); bump `engine`, freeze save `v: 1`; first GR-33 fixture; per-screen `<svelte:boundary>` + local error ring buffer + "Report a problem" bundle (shown before copying); share-your-run `#run=` codes; About/Privacy/Credits screen + `PRIVACY.md` + generated `THIRD_PARTY_LICENSES`; `workflow_dispatch` Pages deploy + custom domain (D9); keyboard-only turn, time-to-first-decision (GR-30), bundle, engine and interaction perf budgets; session-length check against the 30–45 min first-term target.
**Avoids:** Pitfalls 5, 12, 14; the distribution blockers.

### Phase Ordering Rationale

- **Dependencies:** keyed RNG + trace + inputs-as-decisions → everything. Trace → report/Economy → events/powers (which add source ids). State model → election night → second term → end screen. Calendar fix → every deadline and election.
- **Grouping follows architecture:** one engine file per mechanic, one phase per mechanic, with `game.ts` as integrator. Overlays share one shell introduced with the first overlay (Phase 3).
- **Guardrails before content:** PITFALLS' cost asymmetry. RNG, ledger, reading-level, save format and balance-report gates are cheap first and very expensive to retrofit (re-tune all content, rewrite all copy, break saves).
- **Parallelism:** Phase 4 ∥ Phase 5 (conditional, see Phase 5); Phase 6 data sourcing ∥ Phases 3–5.

### Research Flags

Phases likely needing `/gsd-plan-phase --research-phase <N>`:
- **Phase 1:** spike on deterministic math (D10): an arithmetic-only normal and `ln`/`exp` with acceptable accuracy, and whether Node vs WebKit vs Firefox actually diverge on the current engine.
- **Phase 4:** verify the current debt-limit headroom and X-date after the 2025 reconciliation increase (a standoff may not fall due within the term); calibrate base rates (NBER recession frequency is from training knowledge, not fetched); the pacing numbers are starting values for the harness to tune.
- **Phase 5:** current EO and court law (2025 Supreme Court limits on universal injunctions change how EO challenges play out); Fed chair term timing relative to the game calendar; Senate confirmation threshold modelling.
- **Phase 6:** data sourcing and citations: ME/NE district canvasses (Secretaries of State), per-state House delegations (Clerk), per-state exposure fields (USDA ERS, BEA); the tipping-point centring formula.
- **Phase 7:** forecast error model and calibration (GR-37).

Phases with standard patterns (skip research-phase):
- **Phase 2:** vitest/fast-check/Playwright/CSP patterns are fully specified in STACK.md.
- **Phase 3:** LayerChart + trace → copy is specified; Context7 for LayerChart API at implementation.
- **Phase 8:** harness extension and deploy are standard. Custom domain and title are user decisions, not research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions, licenses, publish dates and peer deps checked with `npm view` / `pnpm licenses` on 2026-10-09; LayerChart integration MEDIUM (Context7 + release notes). `layerchart@2.6.0` and Playwright 1.64.0 are days old and may hit `minimumReleaseAge`. |
| Features | MEDIUM | Comparable-game lessons cross-checked across reviews, wikis and dev statements. Pacing numbers and base rates are judgement starting values. |
| Architecture | HIGH / MEDIUM | Integration points read from code at `63851d7` (HIGH); CRN and counter-based RNG are textbook. Voter and Fed coefficients are design choices (MEDIUM). |
| Pitfalls | HIGH / MEDIUM | Code-derived traps verified (single rng stream, `vsNothing` formula, turn labels, ME/NE data, uncapped clout). Game-design and float-drift claims rest on secondary sources. |
| Distribution | MEDIUM-HIGH | Platform fees and COPPA dates from official docs; grant eligibility, portal splits and the Common Sense review pause are LOW-MEDIUM. Legal content is not legal advice. |

**Overall confidence:** HIGH for what to build and in what order; MEDIUM for tuning numbers and civics-model coefficients, which the balance harness and playtests must settle.

### Gaps to Address

- **Cross-browser float drift magnitude:** unknown whether the current engine actually diverges; spike in Phase 1 (D10).
- **Debt-ceiling timing and Fed chair term:** verify against current law and data before scheduling those cards (Phases 4/5).
- **Per-state exposure data:** not yet sourced; long pole for Phase 6. Start during Phase 3.
- **Pacing and balance numbers:** all director, base-rate and band thresholds (GR-08, GR-12, GR-16, GR-37) are starting values. Tune once, record why, then change only in reviewed PRs.
- **First-term session length (30–45 min):** inferred, not measured. Needs an in-person classroom playtest.
- **Coefficient citations:** the GR-22 registry will expose hand-set coefficients without sources; budget time for sourcing or explicitly marking them as judgement.
- **Legal:** read 16 CFR §312.2 / §312.5(c)(7) before ever adding collection; USPTO search for the public title; NEH eligibility before grants.
- **Steam free-elsewhere tolerance:** precedent only (Mindustry, Shattered Pixel Dungeon), no official statement. Not a v0.2 concern.

## Sources

### Primary (HIGH confidence)
- Codebase at `63851d7`: `src/engine/game.ts`, `budget.ts`, `congress.ts`, `balance.test.ts`, `src/app/session.svelte.ts`, `screens.ts`, `screens.test.ts`, `indicators.ts`, `src/data/*`, `data/us-2026.json`, `docs/design.md`
- npm registry (`npm view`), `pnpm licenses list`, `svelte-check --help`, all run 2026-10-09
- MDN Storage quotas/eviction, web.dev persistent storage, Svelte `$state.snapshot` docs
- COPPA final rule (Federal Register 2025-04-22); ICO Children's Code scope; GitHub Pages / Cloudflare Pages limits; Steam partner docs; itch.io creator docs; GitHub Sponsors / Ko-fi / Open Collective / Patreon fee docs; NEH Digital Projects for the Public
- Common random numbers (Law & Kelton); counter-based RNG (Salmon et al., SC'11); MurmurHash3 finalizer
- `gh repo view brbrainerd/govSim`: public, `licenseInfo: null`

### Secondary (MEDIUM confidence)
- Context7 `/techniq/layerchart` (geo, CSS-only 2.x)
- Game reviews and developer writing: Democracy 4 (Positech), Suzerain, Reigns (GDC), Frostpunk, Papers, Please, iCivics, Into the Breach, RimWorld wiki, Hidden Agenda
- 2024 ME/NE district results, Chiafalo v. Washington, contingent-election explainers, hostile media effect literature
- Law-firm COPPA summaries (Finnegan, Latham, Davis Polk, Loeb); app-store age-signal laws (FPF, MoFo); Steam AI disclosure rewrite coverage
- Open-source paid-on-Steam precedents (Shattered Pixel Dungeon, Mindustry)

### Tertiary (LOW confidence)
- Sid Meier GDC 2010 recaps, Soren Johnson columns, Dota 2 pseudo-random distribution, CK3/XCOM forum threads
- Political Machine reviews; Common Sense Education review pause (single source); CrazyGames/Poki splits; school-filter categorisation advice
- Pacing base rates (judgement) and NBER recession frequency (training knowledge, not fetched)

---
*Research completed: 2026-10-09*
*Ready for roadmap: yes (after Decisions D1–D5 and D10 are resolved)*
