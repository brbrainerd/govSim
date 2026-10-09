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

- **Look**: Infographics-Show-style flat vector everywhere; denser "pro" variants
  for data screens; evil mode = reskin (A1).
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
| Icons | `@lucide/svelte` | 1.53.x | ISC | Tree-shakable, Svelte-5-native (D7) |
| Motion | Svelte built-ins (`Tween`, `Spring`, transitions, `flip`) | — | — | Zero-dep; add `motion` only if layout animation needed (D7) |
| Test | `vitest`, `@playwright/test` | latest at scaffold | MIT / Apache-2.0 | Engine + visual tests |
| Visual tooling (dev) | `sharp`, `pixelmatch` | 0.35.5 / 8.0.0 | Apache-2.0 / ISC | Contact sheets, motion metrics |

**Rejected**: Phaser 4 / PixiJS (game-loop weight vs DOM-first UI, D2), Rive
(agent can't drive end-to-end; paid export; binary source), Spine (license),
GSAP (non-OSI license), Freepik/Storyset (attribution + redistribution terms),
ECharts (size), Theatre.js (abandoned), Remotion/Motion Canvas (video tools),
python-lottie (AGPL).

## 10. Process

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
