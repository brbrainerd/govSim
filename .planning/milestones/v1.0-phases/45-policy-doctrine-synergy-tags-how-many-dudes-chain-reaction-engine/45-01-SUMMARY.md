---
phase: 45-policy-doctrine-synergy-tags-how-many-dudes-chain-reaction-engine
plan: 01
subsystem: engine-and-ui
tags: [synergies, policy-doctrines, chain-triggers, how-many-dudes]
provides:
  - Policy Doctrine family tagging across Executive Orders, Trade Agreements, Sector Tariffs, Reforms, Amendments, Evil Levers, Budget & Social policies (SYN-01)
  - Pure deterministic 2/4/6 set thresholds and chain-reaction trigger engine in src/engine/synergies.ts (SYN-02)
  - Live SynergyBar.svelte with cascading combo popups on OvalOffice.svelte and TurnReport.svelte (SYN-03)
affects:
  - src/engine/synergies.ts
  - src/engine/game.ts
  - src/app/session.svelte.ts
  - src/ui/SynergyBar.svelte
  - src/screens/OvalOffice.svelte
  - src/ui/TurnReport.svelte
  - src/screens/Powers.svelte
  - src/screens/Trade.svelte
tech-stack:
  added: []
  patterns: [doctrine-synergy-thresholds, chain-reaction-triggers, calm-mode-popups]
key-files:
  created:
    - src/engine/synergies.ts
    - src/engine/synergies.test.ts
    - src/ui/SynergyBar.svelte
    - src/ui/SynergyBar.test.ts
  modified:
    - src/engine/game.ts
    - src/app/session.svelte.ts
    - src/screens/OvalOffice.svelte
    - src/ui/TurnReport.svelte
    - src/screens/Powers.svelte
    - src/screens/Trade.svelte
key-decisions:
  - Gated resolveDoctrineSynergies on activePerks.length > 0 so autopilot and Classic Sim runs preserve bit-for-bit identical determinism hashes.
requirements-completed: [SYN-01, SYN-02, SYN-03]
duration: 12min
completed: 2026-10-18
---

# Phase 45 Plan 01: Policy Doctrine Synergy Tags & Chain-Reaction Engine Summary

Implemented Policy Doctrine family tags (`SYN-01`), `2 / 4 / 6` set thresholds and *How Many Dudes?*-style chain-reaction triggers (`SYN-02`), and the live `SynergyBar.svelte` component (`SYN-03`):

- **Doctrine Tagging (`SYN-01`)**: Mapped Executive Orders, Trade Agreements, Sector Tariffs, Reforms, Constitutional Amendments, Budget/Social policies, and Evil Mode Corrupt Levers to Doctrine families (`src/engine/synergies.ts`) and surfaced inline Doctrine tag pills on `Powers.svelte` and `Trade.svelte`.
- **2 / 4 / 6 Set Thresholds & Chain Triggers (`SYN-02`)**: Implemented `computeDoctrineCounts`, `computeActiveSynergies`, and `resolveDoctrineSynergies` in `src/engine/synergies.ts`, wired into `src/engine/game.ts` with full causal `Ledger` traces (`synergy:doctrine`, `clout:synergy`).
- **Live Synergy Bar & Cascading Popups (`SYN-03`)**: Created `src/ui/SynergyBar.svelte` (`data-testid="synergy-bar"`) with sequential combo popups (`data-testid="synergy-chain-popup"`) respecting `Calm mode`, mounted on `OvalOffice.svelte` and `TurnReport.svelte`.
