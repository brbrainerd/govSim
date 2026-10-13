# Plan 20-02 Summary: Oval Office / Situation Room Evil Mode Reskin & Live Widgets

## What Was Done
1. **Dynamic Kleptocratic Briefings (`src/content/briefing.ts`)**:
   - Added `isEvilMode` awareness to `SessionContext` and `generateBriefing`.
   - Built satirical briefing states for:
     - Impeachment threat (heat >= 80): urgent warning to purge watchdogs or rally House votes.
     - Special counsel active (special counsel or heat >= 60): warning about 25 clout/qtr drain.
     - Scandal simmering (heat >= 35): evidence leakage alert.
     - Base state: kleptocratic extraction and vault status.
   - Verified reading grade <= 9.0 and sentence length <= 20 words across all branches in `src/content/briefing.test.ts`.
2. **Oval Office Hub UI Reskin (`src/screens/OvalOffice.svelte`)**:
   - Swapped standard prosperity rosette with **Offshore Stash Rosette** (`data-testid="oval-offshore-stash"`) when `session.isEvilMode` is true, displaying accumulated loot ($B) and quarterly extraction delta.
   - Replaced "How America is doing" with "How the loot is doing".
   - Integrated **Evil Situation Card** (`data-testid="evil-situation-card"`) in the action column:
     - Heat Gauge progress bar (0–100) with visual meter, color-coded heat level, and markers at 60 (Special Counsel) and 80 (Impeachment).
     - Live Offshore Loot counter and watchdog probe status.
     - Quick-action button (`data-testid="goto-corrupt-levers-btn"`) routing directly to `powers`.
3. **Automated Unit Testing (`src/screens/OvalOffice.test.ts`)**:
   - Added test suite verifying clean rendering of both standard and Evil Mode configurations.

## Verification Gates
- `npm run guard`: Passed.
- `npm run check`: 0 errors, 0 warnings.
- `pnpm test src/content/briefing.test.ts src/screens/OvalOffice.test.ts`: Passed.
