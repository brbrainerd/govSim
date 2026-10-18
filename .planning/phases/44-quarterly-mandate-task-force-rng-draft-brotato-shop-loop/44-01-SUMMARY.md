---
phase: 44-quarterly-mandate-task-force-rng-draft-brotato-shop-loop
plan: 01
subsystem: engine-and-ui
tags: [perks, rng-draft, brotato-shop-loop, mandate-cards, classic-sim]
provides:
  - Dedicated RNG stream 21 ('perks') in src/engine/rng.ts
  - 24 nonpartisan standard White House Task Force & Mandate cards across Tiers I-IV and 9 Evil Mode Heist Relics in src/content/perks.ts
  - Pure deterministic quarterly draft engine (rollPerkSlate, perkRerollCost, totalPerkRerollsCost, resolvePerkDecision) in src/engine/perks.ts
  - Interactive PerkDraftModal.svelte with 3-card slate, escalating Clout reroll, card lock, and Skip for +10 Clout
  - Classic Sim (No Perks) toggle on NewGame.svelte and Task Force Draft launcher on OvalOffice.svelte
affects:
  - src/engine/rng.ts
  - src/engine/coefficients.ts
  - src/engine/units.ts
  - src/content/perks.ts
  - src/engine/perks.ts
  - src/engine/game.ts
  - src/app/session.svelte.ts
  - src/ui/PerkDraftModal.svelte
  - src/screens/NewGame.svelte
  - src/screens/OvalOffice.svelte
tech-stack:
  added: []
  patterns: [isolated-rng-stream, causal-ledger-trace, brotato-shop-draft]
key-files:
  created:
    - src/content/perks.ts
    - src/engine/perks.ts
    - src/engine/perks.test.ts
    - src/ui/PerkDraftModal.svelte
    - src/ui/PerkDraftModal.test.ts
  modified:
    - src/engine/rng.ts
    - src/engine/coefficients.ts
    - src/engine/units.ts
    - src/engine/modifiers.ts
    - src/engine/trace.ts
    - src/content/text/why.ts
    - src/engine/decisions.ts
    - src/engine/game.ts
    - src/app/save.ts
    - src/app/session.svelte.ts
    - src/screens/NewGame.svelte
    - src/screens/OvalOffice.svelte
key-decisions:
  - Used dedicated RNG stream 21 ('perks') so drafting or rerolling never perturbs macro, crisis, or election streams.
  - Added "Classic Sim (No Perks)" toggle on NewGame.svelte for strict classroom runs.
requirements-completed: [PERK-01, PERK-02, PERK-03]
duration: 18min
completed: 2026-10-18
---

# Phase 44 Plan 01: Quarterly Mandate & Task Force RNG Draft Summary

Implemented the *Brotato*-inspired quarterly White House Task Force & Mandate RNG draft engine and interactive modal (`PERK-01`, `PERK-02`, `PERK-03`):

- **Dedicated Stream 21 RNG (`PERK-01`)**: Added `perks: 21` to `STREAM` in `src/engine/rng.ts` and implemented `rollPerkSlate`, `perkRerollCost`, `totalPerkRerollsCost`, and `resolvePerkDecision` in `src/engine/perks.ts`.
- **Curated 24+9 Catalog (`PERK-03`)**: Created `src/content/perks.ts` with 24 nonpartisan standard White House Task Force & Mandate cards across Tiers I–IV and 9 Evil Mode Heist Relics, all with explicit `👍 Upside` / `⚠️ The Catch` trade-offs, Policy Wonk statutory subtitles, and Flesch-Kincaid reading grade $\le 9.0$.
- **Interactive Draft Modal & Classic Sim Toggle (`PERK-02`)**: Built `src/ui/PerkDraftModal.svelte` (`data-testid="perk-draft-modal"`), wired the launcher pill into `src/screens/OvalOffice.svelte` (`data-testid="open-perk-draft-btn"`), and added the `"Classic Sim (No Perks)"` toggle (`data-testid="classic-sim-toggle"`) on `src/screens/NewGame.svelte`.
