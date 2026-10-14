# Phase 27 UI Design Contract — Year-1 Progressive Onboarding & Guided Turn Flow

**Phase:** 27
**Requirements:** `ONBOARD-01`, `ONBOARD-02`
**Target Visuals:** `.design-targets/g-newgame.png`, `.design-targets/g-home.png`

## 1. Progressive Year-1 Journey (`ONBOARD-01`)

Per `docs/design.md` §7b, Year 1 introduces the core presidential loops step-by-step:
- **Turn 1 (Winter, Year 1)**: Focus on the legislative loop (`Oval Office` → `Budget` → `Congress`).
- **Turn 2 (Spring, Year 1)**: `Your Powers` and `Trade & Tariffs` unlock in `Rail.svelte` with a gold `NEW` badge (`data-testid="rail-new-badge-powers"`, `data-testid="rail-new-badge-trade"`).
- **Turn 3 (Summer, Year 1)**: `Voters` unlocks in `Rail.svelte` with a gold `NEW` badge (`data-testid="rail-new-badge-voters"`).
- **Turn 1–3 Guided Banner**: In `OvalOffice.svelte` ( inside `.card.info`), show a compact Year-1 guide pill (`data-testid="year1-onboarding-guide"`) summarizing what unlocked this turn and the recommended next step.

## 2. "Unlock All Screens Immediately" Toggle (`ONBOARD-02`)

- **`NewGame.svelte`**: Add an accessible checkbox/toggle (`data-testid="unlock-all-toggle"`) labelled `"Experienced Mode: Unlock all screens on Turn 1"` that passes `unlockAll: true` in `GameOptions`.
- **`Rail.svelte`**: When `turn < 3` and `!unlockAll` (so at least one screen is still locked), render a compact utility button (`data-testid="rail-unlock-all-btn"`) in `.save-tray` (or below the screen list) labelled `"Unlock all screens"` that calls `session.unlockAllScreens()` so a player never feels stuck in Year 1.
- **Backward Compatibility**: Default `unlockAll` is `false` so existing E2E tests (`tests/trade.spec.ts`, `tests/voters.spec.ts`) that assert `.lock` text on Turn 1 continue to pass unchanged.
