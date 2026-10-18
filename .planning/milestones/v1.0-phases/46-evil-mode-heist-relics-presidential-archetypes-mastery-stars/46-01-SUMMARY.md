---
phase: 46-evil-mode-heist-relics-presidential-archetypes-mastery-stars
plan: 01
subsystem: engine
tags: [heist-relics, archetypes, mastery-stars, evil-mode, replayability]
requires:
  - phase: 45-policy-doctrine-synergy-tags-how-many-dudes-chain-reaction-engine
    provides: Policy Doctrine synergy tags and chain-reaction engine
provides:
  - 9 Evil Mode Heist Relics & Fixer Syndicate catalog (`shell_network`, `fixer_ring`, `captured_regulators`) with dark-market draft skin (`PerkDraftModal.svelte`) and `EndScreen.svelte` Syndicate combo breakdowns (`HEIST-01`, `HEIST-02`)
  - 5 Presidential Playstyle Archetypes (`src/content/archetypes.ts`: The Deal-Maker, The Technocrat, The Populist Firebrand, The Beltway Insider, The Constitutional Purist) with starting Doctrine relics, indicator offsets, and `SaveFile` / URL hash persistence (`ARCH-01`)
  - Persistent `localStorage` Silver & Gold Mastery Stars (`src/app/mastery.ts`) tracked per Archetype and Scenario and surfaced on `NewGame.svelte` and `EndScreen.svelte` (`ARCH-02`)
affects: [47-balance-calibration-computer-vision-visual-audit-verification]
tech-stack:
  added: []
  patterns:
    - "Idempotent `applyArchetypeToInitialState` applied on initial `GameState` in `Session` and `replaySave` without mutating `Start`, preserving 100% hash verification across save/load and URL share links"
key-files:
  created:
    - src/content/archetypes.ts
    - src/app/mastery.ts
    - src/content/archetypes.test.ts
    - src/app/mastery.test.ts
  modified:
    - src/app/session.svelte.ts
    - src/app/save.ts
    - src/app/share.ts
    - src/screens/NewGame.svelte
    - src/screens/EndScreen.svelte
key-decisions:
  - "Presidential Playstyle Archetypes are optional on `NewGame.svelte` (`archetype?: ArchetypeId`), keeping existing un-archetyped baseline runs and E2E tests bit-for-bit identical while rewarding specialized runs with starting relics and Mastery Stars."
patterns-established:
  - "Mastery Stars upgrade monotonically (`none` -> `silver` -> `gold`) in `localStorage` (`govsim_mastery_v1`) and never downgrade on subsequent lower-scoring runs."
requirements-completed: [HEIST-01, HEIST-02, ARCH-01, ARCH-02]
completed: 2026-10-18
---

# Phase 46 Plan 01: Evil Mode Heist Relics, Presidential Archetypes & Mastery Stars Summary

**Implemented the Evil Mode Heist Relics & Fixer Syndicate dark-market draft and EndScreen combo breakdown (`HEIST-01..02`), 5 selectable Presidential Playstyle Archetypes (`ARCH-01`), and persistent Silver & Gold Mastery Stars (`ARCH-02`).**

## Accomplishments
- **Evil Mode Heist Relics & Syndicate Breakdown (`HEIST-01`, `HEIST-02`)**: Wired the 9 Evil Mode Heist Relics (`shell_network`, `fixer_ring`, `captured_regulators`), dark-market draft skin in `PerkDraftModal.svelte`, and Syndicate combo breakdown (`data-testid="endscreen-syndicate-summary"`) on `EndScreen.svelte`.
- **Presidential Playstyle Archetypes (`ARCH-01`)**: Authored `src/content/archetypes.ts` (*The Deal-Maker*, *The Technocrat*, *The Populist Firebrand*, *The Beltway Insider*, *The Constitutional Purist*) with starting Task Force / Heist Relic cards, passive Clout/Approval/Trust modifiers, Flesch-Kincaid reading grade $\le 9.0$, and full `SaveFile` + URL hash persistence.
- **Silver & Gold Mastery Stars (`ARCH-02`)**: Implemented `src/app/mastery.ts` with persistent `localStorage` tracking per Archetype and Scenario, surfaced on `NewGame.svelte` (`data-testid="mastery-stars-{id}"`, `data-testid="scenario-mastery-{id}"`) and `EndScreen.svelte` (`data-testid="endscreen-mastery-badge"`).
