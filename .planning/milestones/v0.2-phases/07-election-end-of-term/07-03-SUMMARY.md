# Phase 7 Plan 03: Session Lifecycle & End Screen Summary

## Execution Summary
- **Delivered Requirements**: `ELC-04`, `ELC-05`, `GR-04`.
- **Core Additions**:
  - `src/app/session.svelte.ts`:
    - Stores `turn16Snapshot` immediately upon entering Turn 16.
    - Intercepts Turn 16 resolution in `nextTurn()`: computes `outcome`, `autopilotOutcome`, and `electionReasons`, triggering `showingElectionNight`.
    - Supports `continueAfterElection()`: advances winners to Turn 17 ("Term 2 · Year 5 · Winter") up to Turn 32, and transitions losses directly to the End Screen.
    - Implements `retryTurn16()`: cleanly restores the exact Turn 16 snapshot while preserving the deterministic seed.
  - `src/screens/EndScreen.svelte`:
    - Adheres to the 4-part layout grammar (`ScreenLayout.svelte`):
      - Plain question headline: `"What is your lasting legacy?"`.
      - Headline score badge: `+X.X better than doing nothing` with `Now` and `In 10 years` components (`GR-04`).
      - Left Navigation tabs: `Overview`, `Economic Record`, `Legislative Acts`, `Voter Coalition`.
      - 10-Year Legacy Simulation Trajectory: Interactive comparative SVG chart (Player vs Doing Nothing) for GDP growth, Debt/GDP, Unemployment, and Inflation across 40 quarters forward.
      - Accessible sortable `<table>` data fallback (`Pitfall 22`).
      - Historian Verdict Card: Displays one of the 5 nonpartisan tiers (*Transformational*, *Steward of Stability*, *Mixed Legacy*, *Presidency of Unresolved Crises*, *Institutional Breakdown*) with objective historical assessment.
      - Action buttons: Primary stamp `"START NEW PRESIDENCY"`, secondary `"RETRY FROM TURN 16"` (if defeated in Year 4), and tertiary `"EXPORT RECORD (JSON)"`.
  - `src/screens/Game.svelte`:
    - Renders `<EndScreen>` when `session.termEnded` is true.
    - Renders `<ElectionNightModal>` when `session.showingElectionNight` is true.
  - `src/App.svelte`:
    - Passes `onRestart` handler to `<Game>` to clear autosave and return to `NewGame`.
  - `src/screens/EndScreen.test.ts`:
    - 4 Vitest component tests verifying headline score consistency, legacy chart rendering, table fallback toggle, all 5 historian verdict tiers, and Turn 16 retry button rendering.

## Verification
- Unit tests: 216/216 vitest tests pass across 37 test files.
- Purity & Guards: `pnpm guard` reports 0 errors.
- Typecheck: `pnpm check` reports 0 errors and 0 warnings.
- Build: `pnpm build` creates production bundle in 755ms with zero warnings.
- Determinism: `pnpm determinism` passes across all 8 runtime targets (minified & unminified in Node, Chromium, Firefox, WebKit).
- Notices: `node scripts/notices.mjs --check` ok.
