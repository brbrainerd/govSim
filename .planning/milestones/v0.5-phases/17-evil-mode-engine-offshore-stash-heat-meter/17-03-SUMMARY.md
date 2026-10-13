# Summary 17-03: Session Evil State, New Game Mode Toggle, and Status Indicators

## Changes
- **Session Layer Updates (`src/app/session.svelte.ts`, `src/app/session.test.ts`)**:
  - Added optional `evilMode?: boolean` to `GameOptions`.
  - Added reactive derived helpers in `Session`: `isEvilMode`, `offshoreStashBn`, `heat`, `evilState`.
  - Updated bill `preview` calculation to pass `this.current.evil?.heat ?? 0` into `resolveBill` so UI previews legislative friction.
  - Added unit tests verifying `evilMode` persistence, reactive getters, and friction preview.
- **Top Status Bar (`src/ui/StatusBar.svelte`, `src/screens/Game.svelte`)**:
  - Added `evilMode` prop to `StatusBar`.
  - Rendered `Stash` ($B) and `Heat` (0-100 with critical alert styling at >= 75) in the resources section when Evil Mode is active.
  - Rendered `SATIRICAL EVIL MODE` headline badge in the center status zone.
  - Connected `evilMode={session.isEvilMode}` in `Game.svelte`.
- **New Game Mode Selector (`src/screens/NewGame.svelte`, `src/screens/NewGame.test.ts`)**:
  - Implemented interactive mode selector cards: Public Servant (Standard) vs Satirical "Evil Mode" (Kleptocracy).
  - Added contextual satirical warning in the sidebar explaining personal enrichment, offshore stash, and the risk of Heat triggering Special Counsel / Impeachment / Conviction.
  - Dynamic submit button ("Start the term" vs "Seize power").
  - Token-pure styling adhering strictly to CSS variables with no color literals.

## Verification
- `npm run guard`: Passed cleanly.
- `npm run check`: 0 errors, 0 warnings.
- `npm test`: 61 test files passed (382 tests).
