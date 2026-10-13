# govSim

## What This Is

A browser strategy game where you play a fictional President of the United States, inaugurated into the
real, present-day country (sourced 2026 data). One goal: leave America as prosperous as possible — scored
against "doing nothing" on the same seed plus a 10-year legacy. Satirical "evil mode" comes later. It is
also a civics teacher: accurate mechanics, myth cards, plain language, nonpartisan, for teens 14+ and adults.
Open source. Full design: `docs/design.md`.

## Core Value

A player can make real presidential tradeoffs (budget, Congress, executive powers) against an honest,
explainable model of the current US, and always understand *why* the country got better or worse.

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

### Active

(None currently — ready to initialize next milestone with `/gsd-new-milestone`.)

### Out of Scope

- Foreign policy, military, international crises — design M3
- Evil mode — design M4
- Social policy & Reform track — design M2
- Audio, voice narration — decided no audio (A5)
- Live news feed — needs a server, partisan risk (E5)
- Real officeholders — fictional people only (Q6)

## Context

- Shipped Milestone v0.2 ("Playable First Term") with 246 unit tests, 14 Playwright E2E tests, zero axe violations, and clean token guardrails.
- Pure client application (TypeScript + Svelte 5 runes + Vite), zero backend dependencies, zero telemetry.
- Visual direction C (Americana poster) + best of A; tokens SSOT, zero outer viewport scrolling.
- Balance calibrated across training (1–40) and validation (41–80) seeds; sensible play reliably beats do-nothing by 2–10 index points.

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
| Bully pulpit speech in sensible bot | Calibrates reelection rates to 40%–85% across training and validation seeds | ✓ Good |

## Current Milestone: Complete (v0.2 Playable First Term)

Milestone v0.2 is shipped and archived. Run `/gsd-new-milestone` to start the next milestone.

---
*Last updated: 2026-10-12 after shipping milestone v0.2*
