---
phase: 51-powers-newgame-layout-density-after-cv-verification
plan: 01
subsystem: ui-screens
tags: [powers, newgame, congress, budget, civic-emblem, cv-flywheel]
provides:
  - Compact 5x2 Executive Orders grid in Powers.svelte keeping FedPortrait and CourtBench above the fold at 1280x720
  - Enlarged White House inauguration poster stage in NewGame.svelte and enlarged Hemicycle in Congress.svelte
  - Zero raw Unicode emojis across Powers, Congress, and Budget cards
  - Completed Before | After | Target CV comparison sheets and cv-report.md
affects:
  - src/ui/art/CivicEmblem.svelte
  - src/screens/Powers.svelte
  - src/screens/NewGame.svelte
  - src/ui/Hemicycle.svelte
  - src/screens/Congress.svelte
  - src/screens/Budget.svelte
key-files:
  modified:
    - src/ui/art/CivicEmblem.svelte
    - src/screens/Powers.svelte
    - src/screens/NewGame.svelte
    - src/ui/Hemicycle.svelte
    - src/screens/Congress.svelte
    - src/screens/Budget.svelte
requirements-completed: [GUI-01, GUI-02, GUI-03]
completed: 2026-10-18
---

# Phase 51 Plan 01: Powers & NewGame Layout Density, Zero-Emoji Sweep & After CV Verification Summary

Completed the `Powers.svelte`, `NewGame.svelte`, `Congress.svelte`, and `Budget.svelte` layout and `<CivicEmblem>` overhaul, and verified all 12 surface-by-viewport captures with `scripts/cv-flywheel.ts --stage after` and `--compare`.

## Key Changes
- **`Powers.svelte` Above-the-Fold Institutions (`GUI-01`)**: Restructured `.orders-grid` into a compact 5×2 grid (`repeat(5, minmax(0, 1fr))`) and tightened `.order-card` and `.institution-card` vertical rhythm so `FedPortrait` (including `Pressure for Rate Cut`) and `CourtBench` (including `Judicial Reforms...`) are 100% visible above the fold at both `1376×768` and `1280×720` (`fedPortraitAboveFold: false -> true`, `courtBenchAboveFold: false -> true`).
- **`NewGame.svelte` & `Hemicycle.svelte` Poster Stage Proportions (`GUI-02`)**: Widened the `NewGame.svelte` right poster column (`clamp(305px, 25vw, 360px)`) and enlarged `.portico-banner` (`clamp(210px, 31vh, 265px)`), and enlarged `Hemicycle.svelte` (`.arc` `max-height: clamp(220px, 39vh, 330px)`, bloc leaders `52×78`) to match `g-newgame.png` and `g-congress.png`.
- **Zero Raw Unicode Emojis (`GUI-03`)**: Expanded `CivicEmblem.svelte` mappings and replaced all 57 raw Unicode emojis in `Powers.svelte` plus remaining emojis in `Congress.svelte` and `Budget.svelte` (`rawEmojiCountInCards: 57 -> 0`).
