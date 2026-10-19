---
phase: 50-borderless-flat-vector-pill-pawn-rig-oval-office-overhaul
plan: 01
subsystem: ui-art
tags: [character-art, svg, pill-people, oval-office, fed-portrait]
provides:
  - Borderless flat-vector pill-pawn character rig matching .design-targets/D.png, cast.png, and uikit.png
  - Unadorned smooth thumb/finger dome silhouette for male characters (PRESIDENT_LOOKS[0..2], COS, Fed Chair, Bloc Leaders)
  - Full-height pleated curtains, narrower executive chair, and non-overlapping chyron strip in OvalOffice
affects:
  - src/ui/art/Character.svelte
  - src/ui/art/CharacterPortrait.svelte
  - src/ui/art/FedPortrait.svelte
  - src/ui/art/OvalOfficeScene.svelte
  - src/screens/OvalOffice.svelte
key-files:
  modified:
    - src/ui/art/Character.svelte
    - src/ui/art/CharacterPortrait.svelte
    - src/ui/art/FedPortrait.svelte
    - src/ui/art/OvalOfficeScene.svelte
    - src/screens/OvalOffice.svelte
requirements-completed: [CHAR-01, CHAR-02, CHAR-03, OVAL-01, OVAL-02]
completed: 2026-10-18
---

# Phase 50 Plan 01: Borderless Flat-Vector Pill-Pawn Rig & Oval Office Scene Overhaul Summary

Overhauled `Character.svelte`, `CharacterPortrait.svelte`, `FedPortrait.svelte`, `OvalOfficeScene.svelte`, and `OvalOffice.svelte` to match `.design-targets/D.png`, `cast.png`, `uikit.png`, `g-home.png`, and `g-evil.png`.

## Key Changes
- **Borderless Flat-Vector Pill-Pawns (`CHAR-01`, `CHAR-03`)**: Removed all cartoon `stroke="var(--ink)"` outer borders across `Character.svelte`, `CharacterPortrait.svelte`, and `FedPortrait.svelte` (`characterOuterStrokeCount === 0` across all 12 flywheel captures), relying on layered tonal fills (`--hair-3` at `.07`–`.24` opacity) and crisp V-neck collar/lapel/tie geometry.
- **Unadorned Thumb/Finger Dome Heads (`CHAR-02`)**: Updated `PRESIDENT_LOOKS[0..2]` and male character presets to use the smooth, unadorned thumb/finger dome silhouette from `D.png` (`#1 President`, `#2 COS`, `#3 Fed Chair`, `#5 Blue Bloc`, `#6 Red Bloc`) and `g-newgame.png`, while keeping swept bob/bun/long/afro hair on female characters (`#4 News Anchor`, `#7 Citizen`, `PRESIDENT_LOOKS[3]`). Upgraded `scheming` mood with a wide toothy grin matching `g-evil.png`.
- **Oval Office Architecture & Chyron (`OVAL-01`, `OVAL-02`)**: Removed the 4 floating rectangles in front of the curtains, widened/lengthened the pleated curtains to full height (`y=14..286`), narrowed the executive chair behind the President's shoulders, and moved `.chyron-strip` into the flex flow below `.scene` (`chyronOverlapsScenePx === 0`).
