---
phase: 41-reactive-congressional-bloc-leaders-kitchen-table-citizen-np
plan: 01
subsystem: ui-npcs
tags: [congress, hemicycle, household, budget, npcs]
requires: [GFX-01, GFX-02, GFX-03, SCENE-01, SCENE-02]
provides: [NPC-01, NPC-02]
affects:
  - src/ui/art/Character.svelte
  - src/ui/Hemicycle.svelte
  - src/screens/Congress.svelte
  - src/ui/HouseholdCard.svelte
  - src/ui/HouseholdBreakdown.svelte
  - src/screens/Budget.svelte
  - src/screens/Congress.test.ts
  - src/screens/Budget.test.ts
tech-stack:
  added: []
  patterns: [whip-reactive-bloc-leaders, household-citizen-medallions]
key-files:
  created: []
  modified:
    - src/ui/art/Character.svelte
    - src/ui/Hemicycle.svelte
    - src/screens/Congress.svelte
    - src/ui/HouseholdCard.svelte
    - src/ui/HouseholdBreakdown.svelte
    - src/screens/Budget.svelte
    - src/screens/Congress.test.ts
    - src/screens/Budget.test.ts
decisions:
  - Exported resolveHouseholdPortrait from Character.svelte module script so HouseholdCard, HouseholdBreakdown, and Budget share a single persona-to-outfit/prop/mood mapping.
  - Added whip-share pose/mood transitions and deal-flipped spring bounce on Hemicycle bloc leaders while clamping the top-apex Centrists leader inside the card border.
metrics:
  duration: 10m
  completed: 2026-10-18
---

# Phase 41 Plan 01: Reactive Congressional Bloc Leaders & Kitchen-Table Citizen NPCs Summary

## Delivered
- **NPC-01 (`Hemicycle.svelte`, `Congress.svelte`)**: Congressional Bloc Leaders (`pro`, `mod`, `cen`, `con`, `fre`) dynamically switch poses (`celebrate`, `wave`, `hips`, `crossed`) and moods (`triumphant`, `confident`, `stressed`) based on whip share (`> 60%`, `30%–60%`, `< 30%`) and trigger a spring bounce pulse (`class="deal-flipped"`) when a legislative deal flips votes in their bloc.
- **NPC-02 (`HouseholdCard.svelte`, `HouseholdBreakdown.svelte`, `Budget.svelte`)**: Added `resolveHouseholdPortrait(persona, netMonthlyDelta)` mapping the 4 Household Presets (`FACTORY` hardhat + wrench, `RETIREE` cardigan + glasses, `EDUCATOR` blazer + clipboard, `NURSE` scrubs + stethoscope) + custom families to `<CharacterPortrait>` medallions whose mood and ring color react live to `netMonthlyDelta`.
