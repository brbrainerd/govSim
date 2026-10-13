# Plan 19-03 Summary: Reactive Session Store, Impeachment Modal & Backlash UI (IMPEACH-02, IMPEACH-03)

## Accomplished
1. **StatusBar Alerts (`src/ui/StatusBar.svelte`)**:
   - Added active special counsel subpoenas badge: `SPECIAL COUNSEL SUBPOENAS ACTIVE (−25 CLOUT/QTR)` with warning icon, tooltip, and testid `status-special-counsel`.
   - Updated Heat tooltip to accurately reflect thresholds: `60: Special Counsel, 80: Impeachment, 67 Senate Votes: Conviction`.
2. **Impeachment Modal (`src/ui/ImpeachmentModal.svelte`)**:
   - Created accessible modal dialog built with `Overlay.svelte` (`role="dialog"`, `aria-modal="true"`, focus-trapping, escape-dismiss).
   - Dynamic Chamber tallies:
     - House Impeachment: Yeas vs Nays relative to 218 threshold with progress track.
     - Senate Trial: Guilty vs Not Guilty relative to 67 supermajority threshold with progress track.
   - Satirical civics narrative and fallout callouts:
     - Conviction: `EXECUTIVE POWERS STRIPPED · OFFSHORE STASH FORFEITED` — "All offshore accounts frozen by federal decree ($0.0B recovered)", Term Over action.
     - Acquittal: `TRIAL CONCLUDED · EXECUTIVE AUTHORITY PRESERVED` — "Acquitted by narrow minority: Heat burns hot but power remains intact", Return to Oval Office action.
   - Design token purity: 100% tokens from `tokens.ts`, zero bare color hex or rgba.
3. **Session Store & Screen Wiring (`src/app/session.svelte.ts`, `src/screens/Game.svelte`)**:
   - Added `showingImpeachmentModal` and `dismissImpeachmentModal()` on `Session`.
   - Automatically surfaces `showingImpeachmentModal` upon adoption, conviction, or acquittal events in `nextTurn()`.
   - Rendered in `Game.svelte` with game backdrop preserved behind modal dialog.
4. **Verification**:
   - Unit tests added in `src/ui/ImpeachmentModal.test.ts` (SSR rendering, conviction, acquittal, all elements verified).
   - 407/407 tests passing across 63 test files.
   - Svelte check clean with 0 errors and 0 warnings.
   - Token drift audit clean (`screens.test.ts`).
