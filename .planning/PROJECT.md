# govSim

## What This Is

A browser strategy game where you play a fictional President of the United States, inaugurated into the
real, present-day country (sourced 2026 data). One goal: leave America as prosperous as possible — scored
against "doing nothing" on the same seed plus a 10-year legacy. A satirical "Evil Mode" offers an alternative
kleptocratic gameplay loop where players maximize their personal offshore stash while managing public heat.
It is also a civics teacher: accurate mechanics, myth cards, plain language, nonpartisan, for teens 14+ and adults.
Open source. Full design: `docs/design.md`.

## Core Value

A player can make real presidential tradeoffs (budget, Congress, executive powers, social policy, structural reforms, foreign policy, or satirical kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## Requirements

### Validated

- ✓ Static TS + Svelte 5 + Vite app; registry-driven Home/See/Act rail, tokens SSOT, layout grammar — v0.1
- ✓ Pure deterministic engine: quarterly macro model (gap, Okun, Phillips, Taylor Fed, debt, crisis), autopilot comparison, 10-yr legacy score — v0.1
- ✓ Sourced starting data `data/us-2026.json` (economy, budget, taxes, society, Congress, Court, 50 states + DC) — v0.1
- ✓ Oval Office, Budget (packages, sliders, expert forecast) and Congress (435-seat whip, deals, vote, reward/penalty) screens matching approved art — v0.1
- ✓ Balance harness (40 seeds × 5 strategies) guarding against degenerate play — v0.1
- ✓ Keyed stateless RNG streams, arithmetic-only engine, bit-reproducible cross-browser determinism — v0.2
- ✓ Term calendar ("Year N · Season") with real-date tooltip, party pick at New Game with party-blind engine — v0.2
- ✓ Coefficient registry with citations, ranges, and static purity scanner — v0.2
- ✓ Save format v1 freeze, localStorage autosave, schema-validated export/import, deflate-raw URL hash replay — v0.2
- ✓ Zero egress CSP architecture, automated prose grade gate, and strict CI continuous deployment — v0.2
- ✓ Post-turn report card with 8 indicators, causal trace breakdowns, luck lines, and unexpected ripple effects — v0.2
- ✓ Economy screen with charts vs do-nothing, Fed rate explainer, and accessible data table fallbacks — v0.2
- ✓ Paced exogenous & endogenous crisis system with countdown deadlines, trade-off modals, and rally effects — v0.2
- ✓ Your Powers screen: 10 cited executive orders, 6-3 court challenges, Fed/Court appointments, speeches, myth cards — v0.2
- ✓ Voters screen: 50-state + DC + ME/NE map, 270 projection bar with uncertainty bands, and midterms — v0.2
- ✓ Year 4 Fall election night reveal, contingent House tie resolution, causal trace debrief, second term extension — v0.2
- ✓ End screen: score vs do-nothing, 10-year legacy projection, and historian verdict tier — v0.2
- ✓ 12 policy milestone badges, balance harness calibration over 80 seeds, About/Privacy/Credits modal, and zero-egress problem report bundle — v0.2
- ✓ Domestic social policy levers (healthcare, immigration, energy/climate, education) with pure engine deltas and registered coefficients — v0.3
- ✓ Demographic and regional distribution: state-level exposure indices, BEA regional price parity, and voter coalition shifts — v0.3
- ✓ Structural government reform: Senate filibuster options, judicial ethics & 18-year term limits, electoral reforms, and 3/4 state amendment ratifications — v0.3
- ✓ "Your Household" impact card: 7 kitchen-table budget lines, 4 authentic preset personas, and custom family/state builder — v0.3
- ✓ Extended 100-seed Monte Carlo game balance calibration (+3.425 headroom, party neutrality $\le 5$ pp) — v0.3
- ✓ Paced geopolitical crises (oil embargo, shipping blockade, debt contagion, cyber blackout) with cited resolution triads and autopilot streaming — v0.4
- ✓ Presidential foreign policy controls: defense posture slider, foreign assistance adjustments, targeted economic sanctions, and foreign aid myth card — v0.4
- ✓ Pure deterministic 0–100 Security Index driving 10% of the composite Prosperity Index with causal trace line items — v0.4
- ✓ International Trade & Tariffs screen: strategic sector tariffs (chips, minerals, clean energy) citing Sec 301/232, bilateral trade accords, and state export vulnerability matrix — v0.4
- ✓ Satirical Evil Mode opt-in toggle, pure deterministic offshore stash accumulator ($B), and 0–100 Heat meter — v0.5
- ✓ Corrupt executive levers: no-bid crony contracts, land auctions, tariff exemption sales, library foundation slush fund, watchdog purges — v0.5
- ✓ Institutional backlash & impeachment: special counsel appointments/subpoenas, House impeachment floor vote, Senate conviction trial with full asset forfeiture — v0.5
- ✓ Dark Americana visual reskin (oxblood, aged gold, ink), live Oval Office stash rosette/heat gauge, Kleptocratic Heist Review EndScreen, and 6-tier satirical verdicts — v0.5
- ✓ Interactive "How it works" explainers across Oval Office, Economy, Budget, and Trade with +1 Clout curiosity reward — v0.6
- ✓ Trade Learn strip and expanded 3-card Myth deck (`supply_side_taxes`, `debt_ceiling_default`, `trade_deficits`) — v0.6
- ✓ Oval Office Chief of Staff suggestion actions wired to Crisis and Myth modals — v0.6
- ✓ One-click actionable Chief of Staff "Advisor Plays" navigating and pre-filling draft packages — v0.6
- ✓ Congress Auto-Whip cheapest-path coalition solver staging lowest-Clout deal sets to reach 218 House votes — v0.6
- ✓ Live Budget Household Persona binding and in-force vs 2026 baseline dual slider indicators — v0.6
- ✓ Top-bar live Staged Decisions tray with unsent warnings and screen jump buttons — v0.6
- ✓ Safe "Skip to Next Event" fast-forward loop with automatic crisis/deadline interrupts — v0.6
- ✓ 4 curated Starting Scenarios at New Game with deterministic macro/fiscal overrides — v0.6
- ✓ Scenario briefing objectives at inauguration and persistent scenario completion badges — v0.6
- ✓ Layered Americana editorial-poster SVG character anatomy, 5 reactive expressions (`confident`, `stressed`, `scheming`, `panicked`, `triumphant`), and live `GameState`-reactive `OvalOfficeScene`, `ReporterScene`, `CourtBench`, and `FedPortrait` — v0.7
- ✓ Stamp-slam and hemicycle seat-flip micro-animations, ironic party-blind news chyrons and advisor banter, and an in-game `"Calm mode"` toggle — v0.7
- ✓ Year-1 progressive onboarding (`docs/design.md` §7b: Turn 1 Budget/Congress, Turn 2 Your Powers, Turn 3+ all screens) with `"Unlock all screens"` toggle — v0.7
- ✓ Interactive `"Show your work"` Model Inspector modal exposing all 138 live `coefficients.ts` parameters, 6 core equations, ranges, and audited citations — v0.7
- ✓ Optional non-deterministic `"Living World"` shock variance (`turnEntropy`) and opt-in Free AI Director (`openrouter/free` + `:free` auto-discovery, OAuth PKCE, local `window.ai`, Gemini/Groq BYOK) for generative briefings, satirical chyrons, and schema-clamped dynamic crises — v0.7

### Active

- [ ] Tempting "Mirage Levers" on policy screens and contextual press/voter blame triggers that surface civics myths at the moment of player intent (`MYTH-01`, `MYTH-02`)
- [ ] Interactive Reality-Check modal with optional 1-click causal bottleneck prediction, tactile `MYTH BUSTED` stamp-slam animation, and zero-friction skip/dismiss (`MYTH-03`, `MYTH-04`)
- [ ] Actionable 1-click "Real Lever" tactical pivot buttons inside myth cards that navigate to the target screen and stage or highlight the real constitutional lever (`PIVOT-01`, `PIVOT-02`)
- [ ] "Debunk vs. Spin" strategic gameplay integration: Statesman path grants an Informed Briefing buff / blame shield, while Evil Mode or cynical play allows weaponizing myths for short-term approval at a credibility/heat cost (`SPIN-01`, `SPIN-02`)
- [ ] Expanded 12-card spectrum-balanced Myth catalog covering Congress, Voters, Social Policy, and Structural Reform (`|left - right| <= 1`), plus an EndScreen Civic Mastery dossier (`DECK-01`, `DECK-02`)

### Out of Scope

- Audio, voice narration — decided no audio (A5)
- Live news feed — needs a server, partisan risk (E5)
- Real officeholders — fictional people only (Q6)
- Tactical direct military combat sim — civilian strategy only
- Nuclear war annihilation sandbox — terminal instant-lose without pedagogical value

## Context

- Shipped Milestone v0.7 ("Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director") with 464 unit/property tests across 75 files, 63 Playwright E2E tests, zero axe violations, zero default network egress, and clean token guardrails.
- Pure client application (TypeScript + Svelte 5 runes + Vite), zero backend dependencies, zero telemetry.
- Visual direction C (Americana poster) with dual theme tokens (Day Americana and Dark Oxblood/Gold/Ink for Evil Mode).
- Zero outer viewport scrolling across 1376×768 and 1280×720 viewports.
- Determinism verified 8/8 bit-for-bit across Node, Chromium, Firefox, WebKit (minified and unminified).

## Constraints

- **Licensing**: MIT/ISC/Apache/CC0 code and assets, CC BY art with credit — open source (D1)
- **Architecture**: static site, no backend; engine pure and deterministic; screens edit drafts only
- **Tech stack**: Svelte 5.57 runes, Vite 8, TypeScript 6 (svelte-check blocks 7), exact dependency pins
- **Neutrality**: criticize institutions/incentives, never parties; every civic claim cited (E4, E7)
- **Accessibility**: WCAG AA, keyboard, reduced motion, colour-blind-safe

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rewrite in TS, archive Rust | Game needs a fast web UI; Rust sim had no game layer | ✓ Good |
| Score vs autopilot + 10-yr legacy | Separates skill from luck; punishes sugar-high deficits | ✓ Good (harness proves it) |
| Agent-authored SVG characters, not Rive | Agent can author, capture and test end to end | ✓ Good |
| Congress unlocks turn 1 | Budget → Congress is one loop | ✓ Good |
| Keyed stateless RNG streams | Guarantees identical shocks for autopilot regardless of player decisions | ✓ Good |
| Pure arithmetic-only engine (`tanhPade`) | Avoids transcendental Math precision drift across browsers | ✓ Good |
| Native deflate-raw URL hash replay | Shareable runs with zero server storage and zero egress | ✓ Good |
| Regional Price Parity Indexing | Uses authentic BEA RPP indices to ground inflation in state-level costs of living | ✓ Good |
| High-hurdle amendment ratifications | Simulates 2/3 Congress and 3/4 state legislature approvals with realistic pacing | ✓ Good |
| 100-seed party neutrality regression | Ensures symmetric policy yields symmetric reelection odds within 5 pp | ✓ Good |
| Deterministic Geopolitical Crisis Deck | Keyed RNG stream 8 with cited diplomatic/military triads and multi-turn escalation | ✓ Good |
| Security Index Composite | Pure arithmetic 0–100 index driving 10% of Prosperity Index with causal trace explanations | ✓ Good |
| Sector Tariffs & Bilateral Accords | Models Sec 301/232 statutory authorities, inflation pass-through, and trade mitigation | ✓ Good |
| Evil Mode Parallel Game Engine | Pure arithmetic offshore stash and heat tracking while keeping standard mode nonpartisan | ✓ Good |
| Authentic Impeachment Thresholds | 218 House majority and 67 Senate conviction threshold with 100% asset forfeiture | ✓ Good |
| Satirical Kleptocrat Verdict Tiers | 6-tier classification ranking unconvicted plunderers or federal prison downfall | ✓ Good |
| One-click Advisor Plays | Reduces player cognitive friction by letting advisors navigate and pre-fill policy suggestions | ✓ Good |
| Pure-Function Auto-Whip Solver | Uses exhaustive subset search ($2^3 = 8$) to find the cheapest vote coalition without engine impurity | ✓ Good |
| In-Force Policy vs Baseline Dual Indicators | Visually distinguishes current active law from 2026 starting point on budget sliders | ✓ Good |
| Deterministic Starting Scenarios | Deterministic macro/fiscal overrides on top of `us-2026.json` preserving bit-for-bit replay | ✓ Good |
| Living World App-Layer `turnEntropy` | Injects turn-level entropy into `Decisions` (stream 19/20) for both player and autopilot while keeping `src/engine/` 100% pure | ✓ Good |
| Opt-In Free AI Director + Schema Clamping | Supports OpenRouter `:free` cascade failover, OAuth PKCE, and `window.ai` with zero default egress and strict `C.dynamicCrisis*Cap` clamping | ✓ Good |

## Current Milestone: v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy

**Goal:** Transform civics myth cards from static popups into interactive, intrinsically motivating gameplay mechanics featuring tempting "Mirage Levers", prediction-error reality checks, 1-click pivots to real policy levers, and "Debunk vs. Spin" strategic trade-offs.

**Target features:**
- Tempting "Mirage Levers" on policy screens and contextual press/voter blame triggers that surface civics myths at the moment of player intent
- Interactive Reality-Check modal with optional 1-click causal bottleneck prediction, tactile `MYTH BUSTED` stamp-slam animation, and zero-friction skip/dismiss
- Actionable 1-click "Real Lever" tactical pivot buttons inside myth cards that navigate to the target screen and stage or highlight the real constitutional lever
- "Debunk vs. Spin" strategic gameplay integration: Statesman path grants an Informed Briefing buff / blame shield, while Evil Mode or cynical play allows weaponizing myths for short-term approval at a credibility/heat cost
- Expanded 12-card spectrum-balanced Myth catalog covering Congress, Voters, Social Policy, and Structural Reform (`|left - right| <= 1`), plus an EndScreen Civic Mastery dossier

## Completed Milestone: v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director (Shipped 2026-10-14)

**Goal:** Overhaul character and scene graphics from simple shapes into expressive, state-reactive Americana editorial-poster illustrations, inject tactile micro-interactions and satirical institutional wit (with Calm Mode), add guided Year-1 onboarding and a "Show Your Work" Model Inspector, and introduce an optional Living World variance mode plus a Free AI Director powered by OpenRouter `:free` routes, browser AI, or free-tier keys.
**Delivered:**
- Dramatic SVG art overhaul & state-reactive scenes: layered Americana editorial-poster anatomy, 5 reactive moods, and live `GameState`-reactive Oval Office, Reporter, Court, and Fed scenes (`ART-01..03`)
- Tactile visual flair, satirical wit & Calm Mode: stamp-slam signing animations, hemicycle seat-flip pulses, 40+ readability-gated chyrons, and a persistent `"Calm mode"` toggle (`JUICE-01..03`)
- Year-1 progressive onboarding: Turn 1/2/3+ screen progression with contextual callouts, `NEW` badges, and `"Unlock all screens immediately"` toggle (`ONBOARD-01..02`)
- "Show Your Work" Model Inspector: interactive catalog exposing all 138 parameters and 6 core macroeconomic equations with live search, domain filters, and verified citations (`MODEL-01..02`)
- Living World variance & Free AI Director: app-layer `turnEntropy` shocks, multi-provider Free AI adapter (`openrouter/free` + `:free` discovery, 429 failover, OAuth PKCE, `window.ai`, Gemini/Groq/Ollama BYOK), and party-blind AI Director with schema-clamped dynamic crisis dilemmas (`AI-01..04`)

## Completed Milestone: v0.6 Completeness, Advisor Agency & Scenarios (Shipped 2026-10-14)

**Goal:** Eliminate every remaining "Coming soon" stub and disconnected UI loop, elevate day-to-day gameplay feel with one-click Advisor Plays, Congress Auto-Whip, and Fast-Forward pacing controls from `docs/design.md`, and multiply replayability with selectable starting scenarios.
**Delivered:**
- Interactive civic explainers & Learn loop: step-by-step interactive "How it works" modals across all screens (+1 Clout bonus), Trade Learn strip, 3 new Myth cards, and wired Oval Office Chief of Staff suggestion modals (LEARN-01, LEARN-02, LEARN-03)
- Smart Advisor plays & Congress Auto-Whip: actionable one-click "Advisor Plays" navigating and pre-filling draft packages, pure `findCheapestCoalition` solver for 218 House votes, live Household Persona binding, and dual in-force vs 2026 baseline slider indicators (ADVISOR-01, ADVISOR-02, ADVISOR-03)
- Turn pacing & staged decisions: top-bar live Staged Decisions tray with unsent warnings and screen jump buttons, safe "Skip to Next Event" fast-forward loop with automatic interrupts on crises/deadlines/elections (PACE-01, PACE-02)
- Replayable starting scenarios: curated Starting Scenario selector at New Game with 4 scenarios, inauguration briefings, and persistent EndScreen and URL hash replay badges (SCEN-01, SCEN-02)

## Completed Milestone: v0.5 Satirical "Evil Mode" (Shipped 2026-10-13)

**Goal:** Implement the satirical "Evil Mode" kleptocracy gameplay loop where the objective is to maximize an offshore stash while managing an escalating Heat meter to evade congressional investigations, special counsels, and impeachment trials.
**Delivered:**
- Alternative game mode toggle at New Game, pure deterministic offshore stash accumulator ($B), and dynamic 0–100 Heat meter (EVIL-01, EVIL-02, EVIL-03)
- Corrupt executive levers: no-bid crony contracts, land auctions, tariff exemption sales, library foundation slush funds, and watchdog purges (LEVER-01, LEVER-02, LEVER-03)
- Institutional backlash: special counsel investigations, House impeachment votes, and Senate conviction trials with immediate asset forfeiture (IMPEACH-01, IMPEACH-02, IMPEACH-03)
- Satirical visual reskin: dark Americana theme (oxblood, aged gold, ink), live Oval Office stash rosette/heat gauge, Kleptocratic Heist Review EndScreen, and 6-tier satirical verdicts (UI-01, UI-02, UI-03)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-14 after v0.7 milestone*
