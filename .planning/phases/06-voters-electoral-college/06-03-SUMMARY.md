# Phase 6 Plan 03: Voters Screen with 270 Bar & State Drawer Summary

## Execution Summary
- **Delivered Requirements**: `VOT-01`, `VOT-02`, `VOT-03`, `VOT-05`.
- **Core Additions**:
  - `src/screens/Voters.svelte`: Full 4-part layout screen (`ScreenLayout.svelte`):
    - Plain question headline: `"Who supports you?"`
    - View Mode segmented toggle: `Map View` / `Table View`.
    - Map View with `USMap.svelte` for 50 states + DC + ME/NE district chips with keyboard navigation.
    - Sortable table fallback (`<table>`) with column sorting by Name, EV, Support %, Margin, and Outlook.
    - Electoral College 270 Bar with center 270 milestone pin, player vs opponent tallies, and Year 3+ (turn $\ge 9$) honest uncertainty projection whiskers (`VOT-03`).
    - Next Step sidebar with selected state inspector card (support %, trend vs baseline, EV, tipping-point / swing badges, and causal reasons like farm tariffs, manufacturing, energy) (`VOT-02`).
    - Contextual action cards: Speech in state and primary stamp button to Budget screen.
    - Learn Civics strip linking to constitutional explainer.
  - `src/screens/Game.svelte`: Replaced placeholder with `<Voters />` routing. All 6 screens of the game are now live.
  - `src/ui/TurnReport.svelte`: Added Midterm Results card (`data-testid="midterm-results-card"`) displaying House and Senate seat changes and context when turn 8 or turn 24 midterms resolve (`VOT-05`).
  - `src/screens/Voters.test.ts`: Vitest component tests verifying initial map render, state inspector data, sortable table fallback, and Year 3+ projection whiskers.

## Verification
- Unit tests: 202/202 vitest tests pass.
- Typecheck: `svelte-check` reports 0 errors and 0 warnings.
- Determinism: `node scripts/determinism.mjs` passes across all 8 runtime targets.
- Guard: `node scripts/guard.ts` ok.
