---
phase: 40-oval-office-evil-mode-scene-presidential-avatar-selector-adv
status: passed
verified: 2026-10-18
requirements:
  - SCENE-01
  - SCENE-02
---

# Phase 40 Verification — Oval Office Evil Mode Scene, Presidential Avatar Selector & Advisor NPCs

## Requirement Verification

| Requirement | Status | Evidence |
|-------------|--------|----------|
| `SCENE-01` | PASSED | `src/screens/NewGame.svelte` renders `data-testid="newgame-portico-banner"` and `data-testid="president-look-selector"` (`president-look-option-0..3`), persisted in `GameOptions` (`src/app/session.svelte.ts`) and `SaveFile` (`src/app/save.ts`). Verified in `src/screens/NewGame.test.ts`. |
| `SCENE-02` | PASSED | `src/ui/art/OvalOfficeScene.svelte` renders `data-testid="oval-exec-chair"`, `data-testid="oval-evil-lamp-cone"`, `data-testid="oval-evil-cash-stacks"`, and `data-pose="cash"`; `src/screens/OvalOffice.svelte` renders reactive `<CharacterPortrait>` Advisor NPC badges (`data-testid="oval-advisor-portrait"`). Verified in `src/screens/OvalOffice.test.ts`. |

## Automated Gate Output
- `pnpm exec vitest run src/screens/NewGame.test.ts src/screens/OvalOffice.test.ts src/app/save.test.ts`: 13/13 tests passed.
- `pnpm guard`: `guard ok`
- `pnpm check`: `0 errors and 0 warnings`
