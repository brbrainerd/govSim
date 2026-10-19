# Phase 54 Plan 01 Summary — "What Will Clear This Turn" Stacked Index Card & Next-Turn Preview

**Status:** COMPLETE  
**Date:** 2026-10-18  
**Requirements:** `CLEAR-01`, `CLEAR-02`, `CLEAR-03`

## Changes
1. **`★ PENDING & CLEARING ★` Stacked Index Card (`src/ui/TurnAgendaCard.svelte`)**:
   - Built `TurnAgendaCard.svelte` modeled on `.design-targets/uikit.png` and `hub2.png` with offset stacked paper backing (`box-shadow: 0 3px 0 var(--paper-dark), 0 4px 0 var(--ink)`), navy banner header, spotlight trigger strip (`data-testid="turn-trigger-spotlight"`), numbered checklist rows (`[✓]`, `[!]`, `[ ]`), and a live `Clearing on Next Turn` summary footer (`data-testid="clearing-summary-footer"`).
2. **Explicit Per-Item Clearing Statuses (`src/app/turn-triggers.ts`)**:
   - Implemented `describeStagedItem(session, item)` returning explicit status badges (`PASSES (224/218) ✓`, `CLEARS THIS TURN ✓`, `SHORT N VOTES ⚠`, `DRAFT UNSENT !`) and plain-English effect descriptions (`CLEAR-02`).
3. **StatusBar Staged Popover & Next-Turn Sub-Badge (`src/ui/StatusBar.svelte`)**:
   - Enhanced `[data-testid="staged-decisions-popover"]` to display per-item clearing status tags (`CLEARS ✓`, `AT RISK`, `UNSENT !`) and effect lines while preserving exact `[data-testid="staged-decisions-pill"]` text (`N staged`) and `button.stamp:has-text("Next turn")` text (`CLEAR-03`).
   - Added a live sub-badge (`data-testid="next-turn-clearing-sub"`) directly beneath `Next turn` showing `✓ N clearing` or `! 1 unsent`.
