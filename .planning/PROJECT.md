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

### Active

See `.planning/REQUIREMENTS.md` for milestone v0.2.

### Out of Scope

- Foreign policy, military, international crises — design M3
- Evil mode — design M4
- Social policy & Reform track — design M2
- Audio, voice narration — decided no audio (A5)
- Live news feed — needs a server, partisan risk (E5)
- Real officeholders — fictional people only (Q6)

## Context

- Branch `game-pivot`; Rust research sim archived at tag `rust-final`.
- Visual direction C (Americana poster) + best of A; concept art and code prototypes on the design canvas.
- Coefficients in the macro model are hand-set; lever 10-yr costs sized from real magnitudes, not CBO scores.
- Data gaps: nondefense discretionary null; spending categories are 11-month actuals until Treasury's Sept MTS.

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
| Congress unlocks turn 1 | Budget → Congress is one loop | — Pending playtest |

## Current Milestone: v0.2 Playable First Term

**Goal:** A player can play the real 2026 country through a full term — crises, explained turn reports,
every screen real — ending in an Electoral College reelection and a legacy score.

**Target features:**
- Events & crises (seeded, identical in autopilot) with decision modals and a turn report card
- Economy screen: you vs autopilot charts, Fed rate, why-it's-happening, all 8 scores
- Voters screen: state map from 2024 margins, state panel, swing states, Electoral College race
- Your Powers screen: executive orders, court challenges, Fed chair / pressure, speech, myth cards
- Election night (turn 16), second term, end-of-term score with legacy + historian verdict
- Research & decisions: enforced observability, consistent fun gameplay, distribution/publishing/monetization

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
*Last updated: 2026-10-09 after starting milestone v0.2*
