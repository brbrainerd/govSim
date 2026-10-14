# Phase 22: Smart Advisor Plays, Auto-Whip & Live Household Budgeting — Context

**Defined:** 2026-10-13
**Requirements:** ADVISOR-01, ADVISOR-02, ADVISOR-03

## Decisions

1. **One-Click Chief of Staff Advisor Plays (`ADVISOR-01`)**:
   - Extend `Suggestion` in `src/content/briefing.ts` with optional `play?: AdvisorPlay` (`pack?: PackageName`, `levers?: Record<string, number>`, `autoWhip?: boolean`).
   - Clicking a suggestion with `play` on `OvalOffice.svelte` calls `session.applyAdvisorPlay(s.play)` to pre-fill the recommended package/coalition and opens `s.target`.

2. **Congress Auto-Whip Cheapest Coalition (`ADVISOR-02`)**:
   - Pure `findCheapestCoalition` in `src/engine/congress.ts` evaluates all subsets of available deals (`mod`, `cen`, `spc`) to find the lowest-Clout combination reaching 218 House votes (accounting for heat friction and social shifts).
   - `Congress.svelte` surfaces a one-click `"Auto-whip ({cost} clout)"` button (`data-testid="auto-whip-btn"`) whenever the current bill is short of 218 votes and a passing coalition is reachable.

3. **Live Household Persona & Policy-in-Force Budgeting (`ADVISOR-03`)**:
   - `Budget.svelte` binds its `"Your family"` card to `session.selectedHouseholdPersona` and `session.householdImpact.netMonthlyImpact` (with a button to open `HouseholdModal`), replacing the hardcoded `"Nurse in Ohio"` text.
   - `Budget.svelte` compares slider values against `session.current.policy[l.id]` (current law in force) to mark `changed`, and renders both the current-law tick and 2026 baseline tick when they differ.
