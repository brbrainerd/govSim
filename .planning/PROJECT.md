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

### Active

- [ ] **LEARN-01**: Replace all disabled "Coming soon" Learn strip buttons across Oval Office, Economy, and Budget with interactive "How it works" civic explainer modals that award a one-time +1 Clout curiosity bonus.
- [ ] **LEARN-02**: Add the missing Learn strip to the Trade screen and expand the Myth card deck (`supply_side_taxes`, `debt_ceiling_default`, `trade_deficits`) with cited institutional facts.
- [ ] **LEARN-03**: Wire Chief of Staff suggestion actions on the Oval Office (`"Decide now"` and `"Find out"`) so crisis and myth suggestions directly open the corresponding Crisis or Myth modal instead of being no-ops.
- [ ] **ADVISOR-01**: Upgrade Chief of Staff policy suggestions into one-click "Advisor Plays" that navigate to the target screen and optionally pre-fill recommended slider packages.
- [ ] **ADVISOR-02**: Add a one-click "Auto-Whip Cheapest Path" helper in Congress that selects the lowest-Clout combination of bloc deals needed to reach 218 House / 51 (or 60) Senate votes.
- [ ] **ADVISOR-03**: Connect the Budget screen impact card to the player's active `selectedHouseholdPersona` (replacing hardcoded "Nurse in Ohio") and display slider changes against both policy-in-force and the 2026 baseline.
- [ ] **PACE-01**: Add a top-bar Staged Decisions indicator showing pending policy drafts, deals, and executive actions queued for the current turn.
- [ ] **PACE-02**: Add a "Skip to Next Event" fast-forward control that advances quiet quarters automatically and halts immediately when a crisis, budget deadline, midterm, or pending bill vote requires attention.
- [ ] **SCEN-01**: Add a Starting Scenario selector at New Game with 4 curated scenarios (*2026 Standard Baseline*, *70s Stagflation Shock*, *Debt Ceiling Brinkmanship*, *Global Trade War*) modifying initial macro/fiscal/crisis state deterministically.
- [ ] **SCEN-02**: Display scenario briefing objectives at inauguration and surface scenario completion badges on the Post-Term Legacy Report and shareable replay hash.

## Current Milestone: v0.6 Completeness, Advisor Agency & Scenarios

**Goal:** Eliminate every remaining "Coming soon" stub and disconnected UI loop, elevate day-to-day gameplay feel with one-click Advisor Plays, Congress Auto-Whip, and Fast-Forward pacing controls from `docs/design.md`, and multiply replayability with selectable starting scenarios.

**Target features:**
- Complete Learn Loop: interactive "How it works" explainers (+1 Clout reward), Trade Learn strip, 3 new Myth cards, and wired Oval Office modal triggers (Phase 21)
- Smart Advisor Plays, Congress Auto-Whip cheapest coalition solver, live Household Persona binding on Budget, and policy-in-force vs baseline slider indicators (Phase 22)
- Turn Pacing & Staged Decisions: top-bar staged decisions pill/popover and safe "Skip to Next Event" fast-forward with automatic crisis/deadline interrupts (Phase 23)
- Replayable Starting Scenarios: 4 curated starting scenarios at New Game with deterministic initial overrides, briefing cards, and Legacy Report badges (Phase 24)

### Out of Scope

- Audio, voice narration — decided no audio (A5)
- Live news feed — needs a server, partisan risk (E5)
- Real officeholders — fictional people only (Q6)
- Tactical direct military combat sim — civilian strategy only
- Nuclear war annihilation sandbox — terminal instant-lose without pedagogical value

## Context

- Shipped Milestone v0.5 ("Satirical 'Evil Mode'") with 417 unit tests across 65 files, 51 Playwright E2E tests, zero axe violations, and clean token guardrails.
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
*Last updated: 2026-10-13 after v0.5 milestone*
