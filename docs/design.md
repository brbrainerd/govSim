# govSim — Game Design (pivot)

Status: **agreed 2026-10-08** (design grilling session). Supersedes `blueprint.md`,
`roadmap.md`, `methodology.md`, which describe the archived Rust research sim.
Decision IDs (Q/G/D/E/A) refer to the grilling rounds and are kept for traceability.

## 1. Pitch

Play a fictional President of the United States, inaugurated into the **real,
present-day country**. One goal: leave America as prosperous as possible.
Optional satirical **evil mode**: drain the country and escape with the loot.
Secondary aims, served *through* accurate mechanics rather than separate modes:
teach civics, bust common misconceptions, and show how much better (and how much
dumber) government could be.

Audience: teens 14+ and adults, ~9th-grade reading level, classroom-usable,
no teacher tools (E6). Open source (D1).

## 2. Scoring & win/lose

- **Prosperity Index** (Q1, Q20) — weighted composite, every component visible:

  | Component | Weight |
  |---|---|
  | Real median household income | 25% |
  | Employment-to-population ratio | 15% |
  | Inflation distance from 2% | 10% |
  | Debt-to-GDP trajectory | 15% |
  | Life expectancy | 10% |
  | Gini (inequality) | 10% |
  | Security index | 10% |
  | Social trust | 5% |

- **Headline score** = your index − **autopilot** run (same seed, same crises,
  no decisions) (Q24). Breakdown shows absolute index and a **10-year legacy
  projection**. A **historian's verdict** summarizes all three.
- **Length**: two terms, 32 quarterly turns; midterms turn 8, reelection turn 16 (Q2, Q15).
- **Loss**: reelection defeat; impeachment + removal; sovereign debt crisis is a
  brutal non-terminal penalty; courts can block actions (Q27).

## 3. Simulation model

- **Real starting state, stylized dynamics** (Q3). All starting values in
  `data/us-2026.json`, each field with source + as-of date, refreshed by script (Q19).
  Congress pinned to the **119th** (Q23); refresh after Nov 2026 midterms.
- **Hybrid** (Q9): an aggregate quarterly macro core (output gap, Okun, Phillips,
  debt dynamics, tariff pass-through) drives outcomes; a weighted sampled citizen
  population (tagged by state) yields approval, votes, inequality, Electoral College (Q22).
- **Macro core** (`src/engine/game.ts`, all coefficients named in one `C` table):
  output gap ← persistence + fiscal impulse (enacted budget changes) − real-rate drag
  (− debt-crisis drag above 130% debt/GDP); Okun for unemployment; Phillips +
  expectations + one-off tariff pass-through for inflation; Taylor-rule Fed; debt
  accumulates deficits + interest drift + term premium; potential growth gains from
  policy are capped (tanh) and crowded out by debt. Health and inequality move toward
  policy-set *levels*, never drift forever. **Final score** = ½ index at term end +
  ½ index after a 10-year legacy projection (no new decisions), vs autopilot.
- **Balance harness** (`src/engine/balance.test.ts`, 40 seeds × 5 strategies) caught
  and now guards: max-deficit winning on short-term sugar, debt score floor hiding
  runaway debt, cumulative health/inequality drift, near-free tariffs.
- **Fed is independent** (Q18): stylized Taylor rule. President influences it only
  by chair nomination or jawboning (costs credibility, raises inflation expectations).
- **Congress** (Q16): 4–6 voting blocs per chamber with seats, preferences, relationship.
  Real thresholds: House 218, Senate filibuster 60, reconciliation 51, veto, 2/3
  override. Midterms re-roll seats from approval + economy. Filibuster nuclear
  option available in M1 (E3).
- **Courts** (Q17): one SCOTUS entity with 6–3 lean; EOs/laws risk challenge;
  random vacancies → nomination → Senate confirmation.
- **Power** (Q4): EOs immediate; legislation must pass Congress.
- **Political capital** (Q26): earned per turn from approval (+ year-1 honeymoon);
  spent on EOs, bully pulpit, and buying votes. Max **one major bill per quarter**.
- **Crisis deck** (Q28): recession, financial shock, oil spike, hurricane, wildfire,
  earthquake, pandemic, unrest, shutdown deadline, debt-ceiling standoff, SCOTUS
  vacancy. Per-quarter probabilities modulated by policy; seeded identically for
  autopilot. Events are headline-shaped, never naming real people (E5).
- **People** (Q6): real parties, fictional individuals.

### M1 levers (Q25, G11)
- **Tax**: 4 income-bracket groups, corporate, capital gains, payroll rate + cap,
  baseline tariff, China tariff.
- **Spending** (% of baseline): defense, Social Security/Medicare formula,
  Medicaid, nondefense discretionary, infrastructure, R&D, safety net.
- **Regulation**: regulatory-burden dial; permitting-reform toggle.
- **Executive**: ~10 curated EOs; Fed chair nomination; Fed jawboning; bully pulpit.
- **Myth levers** (E2): "Lower gas prices", "Set interest rates", "Create jobs",
  "Ban X by EO", "Fix the deficit by cutting foreign aid" → explainer card +
  pointer to the real levers. Balanced across the spectrum, CI-tagged (E4).

## 4. Civics layer (E1–E7)

- Prosperity stays the only win condition; civics is taught by accuracy (E1).
- Myth levers, ~20 s "How it really works" explainers, end-of-term debrief (E2).
- Nonpartisan rule: critique institutions and incentives, never parties; every
  model assumption visible with source in a "show your work" panel (E4).
- **Your Household** card (M1): preset or custom (state, income band, age,
  tenure); shows per-policy household impact; inputs never leave the browser (E5).
- Every civic claim lives in a data file with a citation; CI fails on unsourced
  claims; "report inaccuracy" → GitHub issue template (E7).

## 5. Evil mode (M4, outline — Q5, Q29)

Satirical. Score = offshore stash in $, zeroed if convicted. Win = leave office
unconvicted. Levers: no-bid crony contracts, fire-sale federal assets, "library
foundation", tariff exemptions for sale, gutting inspectors general. **Heat** meter →
investigations → impeachment/conviction via the Congress bloc model. Heat
reduction: firing investigators (legitimacy cost), pardons, distractions. Same UI,
evil skin. Satire targets the corrupt role, never real people or parties.

## 6. Milestones (Q12)

| | Scope |
|---|---|
| **M1** | Economy, budget/tax, tariffs, Congress, courts, Fed, score + autopilot, reelection, domestic crises, myth levers, explainers, debrief, Your Household |
| **M2** | Domestic social policy (healthcare, immigration, energy, education) + **Reform track** (structural reforms, amendments) |
| **M3** | Foreign policy, military, international crises — design deferred to M3 start (Q30) |
| **M4** | Evil mode |

## 7. UI / UX

- **Look** (S1, 2026-10-08): **clean retro Americana civics poster** (direction C)
  with direction A's clarity: big slab numbers, roomy layout, cartoon stage, pill
  characters. Flat fills only; one CSS halftone pattern; 2px navy rules, double-rule
  panel borders, flat offset shadows; ribbon only for screen titles, rosette for the
  score, stamp for END QUARTER. Everything must be renderable in HTML/CSS/SVG —
  AI concept art is a target, never a shipped asset. Evil mode = token reskin
  (ink/aged gold/oxblood). Denser "pro" variants for data screens (A1).
- **Type**: Rokkitt (condensed slab, headings + numbers) + Atkinson Hyperlegible
  (body); both OFL via self-hosted woff2.
- **Screens** (G2): Situation Room (hub, End Quarter), Economy, Budget & Taxes,
  Congress, Executive (EOs, Fed, courts, bully pulpit), Map (state approval, EC
  projection), Crisis modal, Election night / End of term, New Game.
- **Turn flow** (G3): skippable animated quarterly briefing → free hub with
  pending-decisions tray → quick review → End Quarter.
- **CBO-style previews** on every change with honest error bars and deliberate
  blind spots (G4).
- **Animation** (A2), in build priority: animated data → UI micro-interactions →
  ambient idle loops → character reactions → cutscenes.
- **President**: fixed character, a few colour variants; party chosen at New Game (A4).
- **Audio**: none (A5). Text + captions only.
- **Devices**: desktop-first ≥1280 px, tablet OK, phone degraded (G6).
- **Accessibility** (G10, A6): keyboard nav, colour-blind-safe charts, no
  colour-only meaning, WCAG AA, table fallback per chart, `prefers-reduced-motion`
  + in-game calm mode.

### 7a. Plain language (UX-1)

UI says the plain thing; the real civics term appears in a tooltip ("Real term:
political capital") so players learn it without being blocked by it. Labels live
in `src/content/text/` (§10).

| Instead of | Say |
|---|---|
| Situation Room | Oval Office |
| Executive | Your Powers |
| Map | Voters |
| Political capital | Clout |
| +4.2 vs autopilot | +4.2 better than doing nothing |
| End Quarter | Next turn (3 months pass) |
| Whip count 203/218 | 203 of 218 votes |
| Bloc | Group (Progressives, Moderates…) |
| % of baseline | vs. this year |
| Nondefense discretionary | Other agencies |
| Revenue vs outlays | Money in vs money out |
| CBO-style estimate | Expert forecast |
| Jawbone the Fed | Pressure the Fed |
| Bully pulpit | Give a speech |
| Median household income | Typical family income |
| Employment-to-population | People working |
| Debt / GDP | Debt (share of economy) |
| Gini | Inequality |
| Myth lever | "Myth?" ticket on the thing people believe |

Rules: ≤ 6 words per label; numbers carry a unit, an arrow **and** a word
(up/down); one primary action per screen; no chart that isn't game state.

### 7b. Player journey — less tedium (UX-2)

- **A turn is three beats:** Read (one briefing card, skippable) → Decide → Next turn.
- **Advisor plays:** each turn the Chief of Staff offers 2–3 one-click suggestions
  that open the right screen pre-filled. Ignorable.
- **Packages over sliders:** budget and bills start from templates ("Tax cut",
  "Infrastructure push"); sliders are for fine-tuning.
- **Auto-whip:** Congress shows the cheapest path to passing ("3 deals, 40 clout").
- **Fast-forward:** "Skip to next event" auto-advances quiet turns; stops on any
  crisis, deadline or vote.
- **Unlock as you go (year 1):** Budget + Congress turn 1 (one loop), Your Powers turn 2,
  Voters turn 3. Experienced players can unlock all at New Game.
- **Free drafting:** every decision is editable until Next turn; no confirm dialogs.
- **Two clicks max** from Oval Office to any action; last screen remembered;
  keyboard shortcuts from the screen registry.
- News batches into the briefing; no mid-turn toast spam.

### 7c. Reward & punishment (UX-3)

- **Reward often, small, immediately:** bill passes (seats flip, confetti, clout
  refund), indicator goals hit (inflation back to 2%, jobless < 4%) → badges in the
  history log, first visit to a myth card (+1 clout for curiosity).
- **Turn report card:** every indicator with arrow + one-line *why* ("Prices fell:
  the Fed raised rates; your tariff cut helped a little").
- **Punish fairly:** every cost is shown before you commit (Expert forecast); big
  threats are telegraphed ≥ 1 turn ahead (debt-stress meter, deadline countdowns).
  Hidden effects are only voter/behaviour reactions, revealed after in "What you
  didn't see coming".
- **Recoverable by default:** a failed vote refunds half the clout; losing the
  midterms makes Congress harder, not game over; low approval enables rally events
  (no death spirals).
- **Hard fails are rare and earned:** debt crisis (ignored warnings), removal
  (abuse of power), losing reelection. Each ends with a "Why this happened" card
  and "Retry from this turn's start".

### 7d. Layout grammar (UX-4)

Every screen uses the same four zones, so position alone tells you what a thing is.

| Zone | Where | Holds | Never holds |
|---|---|---|---|
| **Status** | top bar, identical everywhere | left: *your resources* (Approval, Clout) · centre: screen title ribbon + score · right: time + global **Next turn** | screen-specific controls |
| **Where** | left rail | tabs in fixed order, grouped: **Home** (Oval Office) · **See** (Economy, Voters) · **Act** (Budget, Congress, Your Powers) | actions |
| **What** | main area | one plain-language question as headline ("How should we tax and spend?") → the screen's one main object (stage, chart grid, sliders, seats, map) → bottom-left **Learn** strip (How it works · Myth? ticket) | buttons that commit |
| **Next step** | right column, fixed width | top: *what it means* (forecast / why) · middle: *options* · bottom: the screen's **one primary stamp** (Send to Congress, Call the vote, Sign order). On See screens the bottom is a link to the Act screen that fixes it | charts |

Overlays (crisis, report, myth, election night) reuse the split: left = *what
happened*, right = *what you can do* + primary stamp bottom-right.

**Card roles (one look each):** Info = cream, double rule · Option = cream +
small navy button · Primary = red stamp, max one per screen · Learn = dashed
ticket · Alert = red ribbon. **Colour roles:** navy structure/text · red commit &
danger · gold selected, changed, reward · sage good · sky neutral data.
Spacing on an 8 px grid; zone gutters 24 px; cards inside a zone share one width.

## 8. Architecture

- **Rewrite** as a static TypeScript web app; Rust sim archived via tag `rust-final` (Q8, Q13).
- **Engine**: pure TS, no UI imports, deterministic from seed, JSON snapshots (G7):
  `newGame(seed, mode)`, `estimate(state, draft)`, `endTurn(state, decisions) → {state, events}`.
  Autopilot runs in parallel on the same seed. Main thread (no worker until profiled).
  No undo; reload start-of-quarter save. Saves: localStorage + JSON export.
- **UI state**: snapshot history + draft decisions + current screen; one-way flow.
  Greenfield UI (G8); nothing from `tauri-app/` is reused by default.
- **Svelte 5 runes conventions**: shared state in classes with `$state` fields
  (no stores); `$state.raw` for large snapshots; `$derived` for computation;
  `$effect` only as escape hatch; `{@attach}` for canvas/chart/external libs;
  snippets over slots; `createContext`; no experimental `await`.
- **Characters** (A3): agent-authored SVG part files with pivots + ~200-line TS
  bone/state-machine rig, pure `pose(t, state)` / `renderAt(t)`; all animation in
  rAF/JS (not CSS keyframes) so it is deterministically capturable. Crowds via an
  in-house flat-shape generator. Rive kept only as a possible future human-artist path.
- **Visual pipeline**: `/rig-lab` route → Playwright frame capture via `renderAt(t)`
  → sharp contact sheets (agent review) + pixelmatch motion metrics (dead loop,
  jank spikes, loop seam, head-bbox blink/lip energy) + `toHaveScreenshot`
  baselines + ffmpeg GIF for human approval.
- **Balance harness** (Q31): headless vitest plays full games with scripted
  strategies (autopilot, max-deficit, max-austerity, tariff-everything, random);
  asserts no degenerate strategy beats sensible play and indicators stay in
  plausible ranges. Runs in CI.
- **Hosting**: GitHub Pages; repo name stays `govSim` (Q32). Deploys only on request.

## 9. Dependencies (D1–D8)

Policy: MIT / ISC / Apache-2.0 / CC0 code and assets; CC BY art with credit.
**Exact pins.** Each dependency justified here; initial-load bundle budget enforced in CI.

| Need | Package | Version (verified 2026-10-08) | License | Why |
|---|---|---|---|---|
| Framework | `svelte` | 5.57.2 | MIT | Decided stack |
| Build | `vite` / `@sveltejs/vite-plugin-svelte` | 8.3.4 / 7.3.1 | MIT | Plain Vite; SvelteKit 3 (1 wk old) unneeded for a no-SEO static game (D4) |
| Charts | `layerchart` | 2.6.0 | MIT | Svelte-5-native; pin exactly — breaking changes in minors (D5) |
| Map | `us-atlas` (`states-albers-10m`) + `topojson-client` | 3.0.1 / 3.1.0 | ISC | Pre-projected 29 KB gz SVG paths (D6) |
| Fonts | Rokkitt, Atkinson Hyperlegible (self-hosted woff2) | — | OFL-1.1 | Slab display + legible body (S1) |
| Icons | `@lucide/svelte` | 1.53.x | ISC | Tree-shakable, Svelte-5-native (D7) |
| Motion | Svelte built-ins (`Tween`, `Spring`, transitions, `flip`) | — | — | Zero-dep; add `motion` only if layout animation needed (D7) |
| Test | `vitest` (+ `@playwright/test` when visual tests land) | 5.0.3 | MIT | Engine + registry + token-drift tests |
| Property testing | `fast-check` | 4.10.2 | MIT | Invariant and fuzz testing over randomized seeds and decisions (OBS-03, D6) |
| Types | `typescript`, `svelte-check`, `@types/node` | 6.0.3 / 4.7.6 / 24.19.1 | Apache-2.0 / MIT / MIT | TS pinned to 6: svelte-check 4.7 does not support TS 7 yet |
| Visual tooling (dev) | `sharp`, `pixelmatch` | 0.35.5 / 8.0.0 | Apache-2.0 / ISC | Contact sheets, motion metrics |

**Rejected**: Phaser 4 / PixiJS (game-loop weight vs DOM-first UI, D2), Rive
(agent can't drive end-to-end; paid export; binary source), Spine (license),
GSAP (non-OSI license), Freepik/Storyset (attribution + redistribution terms),
ECharts (size), Theatre.js (abandoned), Remotion/Motion Canvas (video tools),
python-lottie (AGPL).

## 10. Single sources of truth (maintainability)

Every visual or navigational fact lives in exactly one typed file; everything else
is derived. CI fails on drift.

| Concern | SSOT | Derived from it | Drift check |
|---|---|---|---|
| Colours, type, spacing, radii, shadows, motion durations/easings, halftone | `src/design/tokens.ts` (typed object; themes `day`, `night`, `evil` override a base) | CSS custom properties injected at `:root[data-theme]`; LayerChart series colours; SVG rig palette; design-canvas `tokens.json` export | Lint: no hex/px literals in `.svelte` / rig files outside `tokens.ts`; WCAG contrast test per theme pair |
| Screens & menus | `src/app/screens.ts`: `{ id, label, icon, component, milestone, hotkey, inNav }[]` | Folder-tab rail, command palette, hash routing, keyboard shortcuts, "locked until M2" states, screenshot test list | Test: every screen has an approved baseline screenshot; no nav link outside the registry |
| Actions / levers / EOs / myth levers | `src/content/*.ts` data tables (id, label, cost, effects, citation) | Budget sliders, EO cards, myth cards, CBO estimator inputs, debrief | Test: every lever has an engine effect + citation; myth cards balanced by tag (E4, E7) |
| Characters | `src/art/parts/*.svg` (part library) + `src/art/cast.ts` (character = parts + palette token refs + rig) | All character renders, expressions, crowds | Visual pipeline (§8): contact sheets, motion metrics, pose baselines |
| Icons | One set: `@lucide/svelte`, wrapped by `<Icon name>` whose `name` is a union type from `src/design/icons.ts` | All icons | Type error on unknown icon |
| Raster/vector assets (map topology, any image) | `src/assets/manifest.ts`: `{ id, path, license, source, credit, alt }` | `<Asset id>` component, credits screen, licence report | Build fails if an asset is referenced but not in the manifest, or has no licence |
| Copy & civics claims | `src/content/text/*.ts` with `{ text, citation? }` | All UI strings, explainers, briefings | Unsourced civic claim fails CI (E7) |

Components consume only tokens, registry entries and manifest ids — never literals.
A reskin (evil mode) or a new screen is a data change, not a hunt through components.
Concept art is never bundled; its generator scripts + style bible live in `docs/concepts/`
(images live on the design canvas) so the set can be regenerated consistently.

## 11. Process

1. This doc approved.
2. Tag `rust-final`; remove Rust + Tauri from `master` (after listing what goes).
3. Low-fi wireframes of all 9 screens → approval (G9).
4. Hi-fi live prototypes of Situation Room, Budget & Taxes, Congress, both themes → approval.
5. Each built screen must match its approved prototype (screenshot diff as verification).

Approvals are logged below.

## Approval log

| Date | Item | Status |
|---|---|---|
| 2026-10-08 | Design decisions Q1–Q32, G1–G11, D1–D8, E1–E7, A1–A6 | Agreed in session |
| 2026-10-08 | Low-fi wireframes, 9 screens — layout approved ("feel like a game") | Approved |
| 2026-10-08 | S1 visual direction: C (Americana) + best of A | Chosen |
| 2026-10-08 | UX-4 layout grammar; all 12 surfaces regenerated against it | Pending review |
