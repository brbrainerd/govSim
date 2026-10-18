---
phase: 40-oval-office-evil-mode-scene-presidential-avatar-selector-adv
plan: 01
subsystem: ui-scenes
tags: [scene, avatar, oval-office, evil-mode, advisors]
requires: [GFX-01, GFX-02, GFX-03]
provides: [SCENE-01, SCENE-02]
affects:
  - src/ui/art/Character.svelte
  - src/app/session.svelte.ts
  - src/app/save.ts
  - src/screens/NewGame.svelte
  - src/ui/art/OvalOfficeScene.svelte
  - src/screens/OvalOffice.svelte
  - src/screens/NewGame.test.ts
  - src/screens/OvalOffice.test.ts
tech-stack:
  added: []
  patterns: [presidential-look-catalog, advisor-medallions]
key-files:
  created: []
  modified:
    - src/ui/art/Character.svelte
    - src/app/session.svelte.ts
    - src/app/save.ts
    - src/screens/NewGame.svelte
    - src/ui/art/OvalOfficeScene.svelte
    - src/screens/OvalOffice.svelte
    - src/screens/NewGame.test.ts
    - src/screens/OvalOffice.test.ts
decisions:
  - Exported PRESIDENT_LOOKS and resolvePresidentLook from Character.svelte module script so NewGame, OvalOfficeScene, and modal vignettes share a single 4-avatar catalog.
  - Placed the White House portico inauguration banner and 4-option circular CharacterPortrait Look selector in NewGame's right next column above the scenario briefing and stamp button, preserving zero viewport scroll at 1280x720.
metrics:
  duration: 12m
  completed: 2026-10-18
---

# Phase 40 Plan 01: Oval Office Evil Mode Scene, Presidential Avatar Selector & Advisor NPCs Summary

## Delivered
- **SCENE-01 (`NewGame.svelte`, `session.svelte.ts`, `save.ts`)**: Added `PRESIDENT_LOOKS` (4 nonpartisan Presidential Looks), `presidentLook?: 0 | 1 | 2 | 3` in `GameOptions` and `SaveFile` validation, the 4-option `<CharacterPortrait>` avatar selector (`data-testid="president-look-selector"`), and the animated White House portico inauguration banner (`data-testid="newgame-portico-banner"`) that shifts to a dark kleptocratic vignette when Evil Mode is toggled.
- **SCENE-02 (`OvalOfficeScene.svelte`, `OvalOffice.svelte`)**: Added the high-back leather executive chair (`data-testid="oval-exec-chair"`), Evil Mode brass banker's lamp + warm light cone (`data-testid="oval-evil-lamp-cone"`), stacked green cash bundles on the Resolute Desk (`data-testid="oval-evil-cash-stacks"`), `pose="cash"` cash-fanning hands, and reactive `<CharacterPortrait>` Advisor NPC badges (`COS`, `OMB`, `COUNSEL`, or `FIXER` in Evil Mode) on `OvalOffice.svelte` action recommendation cards.
