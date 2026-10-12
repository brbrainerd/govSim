# Roadmap: govSim

## Milestones

- 🚧 **v0.2 Playable First Term** - Phases 1-8 (in progress)

## Overview

v0.1 shipped a pure quarterly macro engine and three screens (Oval Office, Budget, Congress). v0.2 turns
that into a full game: a player governs the real 2026 country through a term of seeded crises and
explained turn reports, uses every screen (Economy, Your Powers, Voters), faces an Electoral College
reelection at Year 4 Fall, and ends with a score against "doing nothing" plus a 10-year legacy. The order
is guardrails before content: the engine rewrite (keyed RNG, causal trace, raw-input decisions,
bit-reproducible math) lands first, then saves, CI gates and continuous deploy, so every later phase is
measured against golden replays, content gates and a committed balance report, and ships to a private
subdomain on every green push.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Engine foundations** - License files, keyed RNG, causal trace, raw-input decisions, bit-reproducible math, term calendar, party pick (completed 2026-10-12)
- [ ] **Phase 2: Saves, guardrails & continuous deploy** - Autosave/export, golden replays, CI gates, CSP privacy, GHCR to Coolify auto-promote, R2 assets
- [ ] **Phase 3: Turn report & Economy** - Report card overlay, projected-final headline, Economy screen with you-vs-autopilot charts and Fed explainer
- [ ] **Phase 4: Events & crises** - Seeded crisis schedule identical for autopilot, crisis modals, deadlines, risk bands, real Oval Office briefing
- [ ] **Phase 5: Your Powers** - Executive orders and court rulings, Fed chair and pressure, SCOTUS nomination, speeches, myth cards, clout cap
- [ ] **Phase 6: Voters & Electoral College** - State map, state panel, EC bar to 270, party-symmetric odds, minimal midterms, sourced district data
- [ ] **Phase 7: Election & end of term** - Electoral College reelection, election night, why-you-won/lost, second term, end screen with verdict
- [ ] **Phase 8: Balance, hardening & release** - Badges, share-your-run codes, report-a-problem bundle, About/Privacy/Credits, final balance pass

## Phase Details

### Phase 1: Engine foundations

**Goal**: The engine is the single, deterministic source of causal truth: no player choice can shift another random draw, every indicator change is explained by named causes, and the same inputs replay identically in every browser
**Depends on**: Nothing (first phase). REL-01 is done first as a quick task (D7) before any engine work.
**Requirements**: REL-01, FND-01, FND-02, FND-03, FND-04, FND-05, FND-06, FND-07, FND-08
**Success Criteria** (what must be TRUE):

  1. The public repo shows an MIT license on GitHub and contains LICENSE-ASSETS (CC BY 4.0), TRADEMARKS.md, CONTRIBUTING.md with DCO sign-off, and generated third-party notices
  2. Over 200 seeds, a player who makes no decisions gets a byte-identical outside-shock log to autopilot, and changing any decision never moves a draw on another stream; draws come from keyed `(seed, stream, turn, key)` streams, and delayed effects (rulings 1-3 turns later) use a scheduled-modifier mechanism (GR-01, GR-02)
  3. A recorded input log replays to the same end-state hash on Node, Chromium, WebKit and Firefox, and a source scan fails the build on any transcendental `Math` call in `src/engine` (D10, GR-32)
  4. In every turn of every tested seed, each indicator change equals the sum of its named trace terms (including luck and explicit clamp/rounding residuals); the clout preview equals the clout the engine charges from raw choices; every model coefficient has a citation or "judgement" tag plus an allowed range, and an unregistered coefficient fails a test (GR-05, GR-22)
  5. The player picks a party at New Game and sees turns as "Year N · Season" (turn 8 = Year 2 Fall, turn 16 = Year 4 Fall) with the real date in a tooltip; swapping the party changes only labels, not engine output; the 10-year legacy projection runs with no events and without executive-order effects

**Plans**: 7/7 plans executed

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Wave 1: keyed RNG, arithmetic-only math, purity scan, stable hash, replay fixture, characterization snapshot (FND-01, FND-02)
- [x] 01-02-PLAN.md — Wave 1: New Game party pick (party-blind engine) and "Year N · Season" calendar with real-date tooltip (FND-08, FND-03)
- [x] 01-03-PLAN.md — Wave 1: coefficient registry with citation/judgement, ranges and checked sources (FND-07)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-04-PLAN.md — Wave 2: Playwright legitimacy gate, `pnpm determinism` across Node/Chromium/Firefox/WebKit, REL-01 verification (FND-02, REL-01)
- [x] 01-05-PLAN.md — Wave 2: raw-input decisions, engine-charged clout equal to the preview, tamper-proof bills (FND-05)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-06-PLAN.md — Wave 3: ledger trace with named causes on state, registry-backed step, literal scan (FND-04, FND-07, FND-01)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-07-PLAN.md — Wave 4: modifiers and scheduled effects, legacy without EOs or new events, full phase gate (FND-06, FND-01, FND-02)

**UI hint**: yes
**Research flag**: Yes. Spike D10 first: arithmetic-only normal and `ln`/`exp` with acceptable accuracy, and whether Node vs WebKit vs Firefox actually diverge on the current engine.

### Phase 2: Saves, guardrails & continuous deploy

**Goal**: The player's game is never lost, every later change is measured by enforced CI gates, the site provably sends nothing anywhere, and every green push to the default branch ships to a private subdomain
**Depends on**: Phase 1 (save = input log; goldens need the final engine shape)
**Requirements**: OBS-01, OBS-02, OBS-03, OBS-04, OBS-05, OBS-06, OBS-07, OBS-08, REL-05, REL-06
**Success Criteria** (what must be TRUE):

  1. The player can reload mid-game and resume at the same turn, and can export a save file and import it elsewhere; a tampered, oversized, non-finite or unknown-id save is rejected with a plain message and the current game is untouched (GR-31, GR-34)
  2. A PR cannot merge to the default branch unless the required check / unit / build / e2e jobs pass: golden replays (~6 logs) reproduce exactly, fast-check invariants hold over random seeds and decision sequences (no NaN, ranges, determinism), Oval Office, Budget and Congress pass axe, a keyboard-only turn and screenshot baselines (Playwright in its Docker image), and bundle/performance budgets, coverage floor, license allowlist (axe-core logged as a dev-only MPL exception, D6) and exact pins all hold
  3. Player-facing text that exceeds reading grade 9 or 20-word sentences, uses jargon outside a "real term", names a party or real person, or makes an uncited civic claim fails CI; a change to the committed balance report fails CI unless explained, and the current report shows sensible play beating doing nothing by 2-10 index points with every lever moving the score (GR-24, GR-25, GR-35, GR-36)
  4. On the deployed site, the CSP allows network access only to its own origin and the R2 asset host, a Playwright egress test records zero other requests, and a source scan finds no telemetry
  5. Pushing a green commit to the default branch builds a Docker image (static app + `/api/health`) on GitHub-hosted runners, publishes it to GHCR by SHA, and auto-promotes it to Coolify on Hetzner after CI is green; a failed health check rolls back to the previous SHA; large assets load from Cloudflare R2 and the site is reachable only on its private subdomain

**Plans**: 6/6 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Wave 1: save serialization, trust boundary, autosave/resume, golden replays (OBS-01, OBS-02)
- [x] 02-02-PLAN.md — Wave 1: fast-check property testing and engine invariants (OBS-03)
- [x] 02-03-PLAN.md — Wave 1: zero-telemetry, strict build-time CSP, egress Playwright test (OBS-04)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-04-PLAN.md — Wave 2: content readability gates, party/person deny-list, committed balance report & headroom (OBS-05, OBS-06)
- [x] 02-05-PLAN.md — Wave 2: axe accessibility audit, keyboard-only turn, viewport fitting & screenshots (OBS-07)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-06-PLAN.md — Wave 3: Dockerfile with /api/health, GHCR publishing, Coolify deploy scripts and GitHub Actions workflows (OBS-08, REL-05, REL-06)
**UI hint**: yes
**Research flag**: Partial. Test patterns are standard (STACK.md). The deploy needs a check: the gigme workflows run on self-hosted runners with `COOLIFY_INSECURE_HTTP`, so GitHub-hosted runners need the Coolify API reachable over HTTPS from the internet (or a Coolify deploy webhook), and `coolify-deploy-kit` must be fetchable from a public runner (public repo or vendored scripts). Decide how "private subdomain" is enforced (unlisted vs Cloudflare Access).
**Why deploy lives here**: REL-05 promotes only "after CI is green", so it needs OBS-08's required checks, and OBS-04's CSP must name the R2 host from REL-06, so all three are one change. Landing it now means Phases 3-8 each ship to the private subdomain for playtesting on every merge, and deploy problems surface on a 3-screen app rather than at release.

### Phase 3: Turn report & Economy

**Goal**: After every turn the player can see what changed, why, and how they compare to doing nothing, using the engine trace as the only source of explanations
**Depends on**: Phase 2 (overlay and screen must pass the e2e/axe/content gates)
**Requirements**: RPT-01, RPT-02, ECO-01, ECO-02
**Success Criteria** (what must be TRUE):

  1. After Next turn, the player sees a report card with the 8 indicators plus approval and clout, each with value, unit, arrow, word and top cause, plus a luck line and "vs doing nothing"; the named top cause is the largest trace term or the copy says "several things", and every source id the engine emits has copy (drift test) (GR-06, GR-07)
  2. The headline score in the top bar and the end-screen score come from one function, showing the projected final score with "Now" and "In 10 years" underneath; a deficit-spending strategy shows a negative headline before turn 16 in at least 80% of seeds, and headline sign matches the final score sign in at least 95% of seeds at turn 16 (D11, GR-04)
  3. The Economy screen charts you vs doing nothing for growth, jobs, prices and debt plus all 8 scores, on zero-based axes, each with a table fallback, and the chart library loads only with that screen (bundle budget holds)
  4. The Economy screen shows the Fed rate with a plain explanation of why the Fed moved (from its rule's trace terms) and a "why it's happening" panel built from the engine trace

**Plans**: TBD
**UI hint**: yes
**Research flag**: No (LayerChart + trace-to-copy is specified; use Context7 for the LayerChart API at implementation). **Parallel work**: start VOT-06 data sourcing (ME/NE district canvasses, per-state House delegations, per-state exposure) now; it is the long pole for Phase 6.

### Phase 4: Events & crises

**Goal**: The player faces paced, telegraphed crises that autopilot faces too, makes decisions in crisis modals, and sees each event's effect explained the turn it lands
**Depends on**: Phase 3 (event effects must appear in the report card the moment they land)
**Requirements**: EVT-01, EVT-02, EVT-03, EVT-04, EVT-05, EVT-06, EVT-07, RPT-04
**Success Criteria** (what must be TRUE):

  1. Over 200 seeds, outside crises (disasters, recession, oil shock, pandemic, court vacancy) occur on the same turns for player and autopilot, never in turns 1-2, at most one per turn, with cooldowns; crises the player causes (financial shock, unrest, debt crisis) carry "autopilot didn't face this", and lowering risk only ever removes them (D2, GR-01 to GR-03, GR-08)
  2. A crisis opens a modal with 2-3 options plus "do nothing", each showing its cost; the choice is a draft that takes effect only at Next turn, autopilot takes a stated default, and no option is dominated on every channel (GR-09, GR-10, GR-38)
  3. Shutdown and debt-ceiling deadlines show a countdown of at least 2 turns and are resolved by a vote on the Congress screen
  4. The player sees qualitative risk bands ahead of time (hurricane season, debt stress, outbreak abroad) with no percentages, and handling a disaster well shows a temporary approval rally in the report card
  5. The Oval Office briefing and suggestions come from the turn's real events (sample text is gone), and the report card names 1-2 effects the player didn't see coming, with their causes

**Plans**: TBD
**UI hint**: yes
**Research flag**: Yes. Verify the current debt-limit headroom and X-date after the 2025 reconciliation increase (a standoff may not fall within the term); calibrate crisis base rates (NBER recession frequency is from training knowledge); pacing numbers are starting values for the harness. **Parallel**: runs alongside Phase 5 (both depend only on Phase 3; delayed effects use Phase 1's scheduled modifiers). Both touch `engine/game.ts`, so merge one before rebasing the other.

### Phase 5: Your Powers

**Goal**: The player can use executive power (orders, appointments, the bully pulpit) with real costs and civics-accurate consequences, without any of it becoming a dominant strategy
**Depends on**: Phase 3 (runs in parallel with Phase 4)
**Requirements**: PWR-01, PWR-02, PWR-03, PWR-04, PWR-05, PWR-06, PWR-07
**Success Criteria** (what must be TRUE):

  1. On the Your Powers screen the player can sign or revoke about 10 cited executive orders, each showing clout cost and a court-risk band; a challenged order gets a named court ruling 1-3 turns later from a keyed draw against a 6-3 court, and signed orders do not appear in the legacy projection (D5)
  2. When the Fed chair seat opens the player can nominate a chair (hawk / centrist / dove) who must clear a Senate confirmation threshold, and can pressure the Fed for lower rates at a credibility cost that makes inflation stickier, visible in the trace
  3. When a Supreme Court seat opens the player can nominate a justice
  4. The player can give a speech to a chosen audience with visibly diminishing returns, clout stops at a cap, and the balance harness shows speech-spam and clout-hoarding strategies do not beat sensible play (GR-10, GR-11)
  5. The player can open 5 cited myth cards balanced across the spectrum (left/right tags balanced, GR-20); the first visit to each gives a small reward exactly once per game, and that survives save and reload

**Plans**: TBD
**UI hint**: yes
**Research flag**: Yes. Current EO and court law (2025 Supreme Court limits on universal injunctions change how challenges play out); Fed chair term timing against the game calendar; Senate confirmation threshold modelling.

### Phase 6: Voters & Electoral College

**Goal**: The player can see, state by state, who supports them and why, how the Electoral College race stands, and what midterms did to Congress, on a map that is fair to either party
**Depends on**: Phase 3; better after Phases 4 and 5 (regional effects of events and orders). VOT-06 data sourcing starts during Phase 3.
**Requirements**: VOT-01, VOT-02, VOT-03, VOT-04, VOT-05, VOT-06
**Success Criteria** (what must be TRUE):

  1. The Voters screen shows a map of the 50 states, DC and the Maine/Nebraska districts in player-relative colours with pattern encoding (not red/blue), every state reachable by keyboard, with a sortable table fallback (GR-23)
  2. Opening a state shows its support, change, electoral votes and reasons; swing states and the tipping-point state are listed, and an Electoral College bar to 270 shows the projection with an honest range from about Year 3
  3. Over 300 seeds, D and R presidents start with reelection odds within 5 points of each other (tipping-point centring, D4, GR-16)
  4. The data file contains sourced, cited Maine/Nebraska district margins, per-state House delegations and per-state farm / manufacturing / energy exposure, and a swing test (not just baseline totals) checks district electoral votes (GR-13, GR-14)
  5. Midterms at Year 2 Fall and Year 6 Fall change House and Senate seats based on approval, shown on a short results card, with the seat penalty bounded so a bad midterm cannot start a death spiral (D3, GR-18, GR-19)

**Plans**: TBD
**UI hint**: yes
**Research flag**: Yes. Data sourcing and citations: ME/NE district canvasses (Secretaries of State), per-state House delegations (House Clerk), per-state exposure (USDA ERS, BEA); the tipping-point centring formula.

### Phase 7: Election & end of term

**Goal**: The term ends in a fair, explained Electoral College reelection, leading either to a second term or to an end screen that scores the presidency against doing nothing and over 10 years
**Depends on**: Phase 6 (needs the Electoral College tally and stable scoring)
**Requirements**: ELC-01, ELC-02, ELC-03, ELC-04, ELC-05
**Success Criteria** (what must be TRUE):

  1. At the end of Year 4 the Electoral College decides reelection; a 269-269 tie goes to a House contingent election by state delegation (tie fixture, GR-15); autopilot's own result is shown, and the engine keeps running autopilot to turn 32 whatever the player's result
  2. The election-night reveal can be skipped and has a reduced-motion version, and the forecast shown beforehand is calibrated so the result is neither a coin flip nor a foregone conclusion (GR-37)
  3. After the result, the player sees a why-you-won/lost card built from the engine trace and can retry from the start of that turn
  4. Winning continues into a second term ending at turn 32; losing goes to the end screen with the legacy projected from turn 16
  5. The end screen shows the score vs doing nothing (same function as the headline), the 10-year legacy and a historian verdict tier keyed on outcome bands, never on ideology

**Plans**: TBD
**UI hint**: yes
**Research flag**: Yes. Forecast error model and calibration (GR-37).

### Phase 8: Balance, hardening & release

**Goal**: The finished first term is balanced, rewarding and shareable: players earn milestones, can share a run or report a problem without anything leaving the browser, and can see exactly what is (not) collected
**Depends on**: Phase 7 (tune once every mechanic exists)
**Requirements**: RPT-03, REL-02, REL-03, REL-04
**Success Criteria** (what must be TRUE):

  1. The player earns about 12 badges for reaching real policy milestones across budget, crises, powers and elections, and sees them on the report card and end screen
  2. The player can copy a share-your-run code; opening it in another browser replays the same game exactly; the save format is frozen at `v: 1` with its first compatibility fixture (GR-33)
  3. The player can view and then copy a "report a problem" bundle (local error log + run code); the egress test still records zero requests, so nothing is sent automatically
  4. The player can open an About / Privacy / Credits screen showing credits and third-party notices; PRIVACY.md states that nothing is collected and which server logs exist (Hetzner/Coolify proxy, Cloudflare R2)
  5. The full balance harness (spam, hoard and always-X strategies, a hill-climber trained on seeds 1-40 and tested on 41-80) keeps sensible play 2-10 points above doing nothing with reelection rates in band; a keyboard-only player can finish a full term within performance budgets

**Plans**: TBD
**UI hint**: yes
**Research flag**: No (harness extension and release artifacts are standard). The 30-45 min first-term session length needs an in-person playtest; public title (D8) is a user decision before any public link.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → (4 ∥ 5) → 6 → 7 → 8. VOT-06 data sourcing runs alongside Phases 3-5.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Engine foundations | 7/7 | Complete    | 2026-10-12 |
| 2. Saves, guardrails & continuous deploy | 0/TBD | Not started | - |
| 3. Turn report & Economy | 0/TBD | Not started | - |
| 4. Events & crises | 0/TBD | Not started | - |
| 5. Your Powers | 0/TBD | Not started | - |
| 6. Voters & Electoral College | 0/TBD | Not started | - |
| 7. Election & end of term | 0/TBD | Not started | - |
| 8. Balance, hardening & release | 0/TBD | Not started | - |
