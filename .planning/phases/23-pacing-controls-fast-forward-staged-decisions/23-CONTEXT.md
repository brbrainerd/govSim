# Phase 23 Context: Pacing Controls — Fast-Forward & Staged Decisions Tray

## Goal
Give players full clarity and control over turn pacing via:
1. **`PACE-01` — Top-Bar Staged Decisions Indicator & Popover**:
   - Summarize all pending actions staged in `session.draft` before the player clicks `Next turn`:
     - Unsent budget/social slider adjustments (`warning: true`, links to `budget`)
     - Queued bill / called vote / congressional deals (`congress`)
     - Crisis response selected (`oval`)
     - Signed Executive Orders, Speeches, Institutional Reforms, or Evil Mode levers (`powers`)
     - Federal Reserve pressure (`economy`)
     - Senate cloture or Article V amendment actions (`congress`)
     - Foreign policy or Trade & Tariff adjustments (`powers` / `trade`)
   - Render a compact pill (`data-testid="staged-decisions-pill"`) in `StatusBar.svelte` next to the turn controls showing the count of staged items (or `"0 staged"` / warning badge when a budget draft is unsent), with a toggleable popover (`data-testid="staged-decisions-popover"`) allowing 1-click navigation to each staged item's screen or clearing the draft.
2. **`PACE-02` — "Skip to Next Event" Fast-Forward Control**:
   - Add `canFastForward` and `fastForwardToNextEvent()` on `Session` (`src/app/session.svelte.ts`).
   - Advance quiet quarters automatically and halt immediately when:
     - An active domestic crisis (`activeCrisis`) or geopolitical crisis (`activeGeopoliticalCrises`) is present,
     - A critical congressional deadline arrives (`turnsRemaining <= 1`),
     - A midterm election or presidential reelection turn is reached (`turn === 8`, `16`, `24`),
     - An impeachment event fires or the term ends.
   - When halting on an active crisis, suppress the intermediate `TurnReport` modal (`showingReport = false`) so the crisis modal surfaces immediately.
