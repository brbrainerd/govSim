# govSim

## What This Is

A browser strategy game where you play a fictional President of the United States, inaugurated into the
real, present-day country (sourced 2026 data). One goal: leave America as prosperous as possible — scored
against "doing nothing" on the same seed plus a 10-year legacy. Satirical "evil mode" comes later. It is
also a civics teacher: accurate mechanics, myth cards, plain language, nonpartisan, for teens 14+ and adults.
Open source. Full design: `docs/design.md`.

## Core Value

A player can make real presidential tradeoffs (budget, Congress, executive powers, social policy, structural reforms)
against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

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

### Active

- [ ] Global crisis & geopolitical events deck (oil supply shocks, international conflicts, treaty crises) — v0.4
- [ ] Foreign policy levers & presidential powers (diplomatic postures, sanctions, defense posture/readiness, foreign aid myth card) — v0.4
- [ ] Security Index & macro feedback integration (10% Security Prosperity weight, defense multiplier, import/energy inflation pass-through) — v0.4
- [ ] International trade & tariff dynamics (bilateral trade negotiations, currency/cost pass-through, retaliatory spirals) — v0.4

### Out of Scope

- Evil mode — design M4 (planned for Milestone v0.5)
- Audio, voice narration — decided no audio (A5)
- Live news feed — needs a server, partisan risk (E5)
- Real officeholders — fictional people only (Q6)

## Context

- Shipped Milestone v0.3 ("Social Policy & Domestic Reform") with 330 unit tests across 54 files, 23 Playwright E2E tests, zero axe violations, and clean token guardrails.
- Pure client application (TypeScript + Svelte 5 runes + Vite), zero backend dependencies, zero telemetry.
- Visual direction C (Americana poster) + best of A; tokens SSOT, zero outer viewport scrolling across 1376×768 and 1280×720 viewports.
- Balance calibrated across 100 seeds; sensible play reliably beats do-nothing by +3.425 index points with $\le 5$ percentage points party neutrality.

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

## Current Milestone: v0.4 Foreign Policy & International Crises

**Goal:** Introduce international diplomacy, defense posture, global crises, and foreign trade mechanics to complete the presidential toolkit and drive the Security Index.

**Target features:**
- Global crisis deck & geopolitical event engine (oil shocks, trade conflicts, alliance tensions)
- Foreign policy levers & presidential powers (diplomatic posture, sanctions, defense posture/readiness, foreign aid myth card)
- Security Index integration & macro feedback (10% Security Prosperity weight, defense budget multipliers, import/energy inflation)
- Trade & tariff dynamics (bilateral agreements, retaliatory spirals, export/import cost impacts)

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
*Last updated: 2026-10-12 for Milestone v0.4 initialization*
