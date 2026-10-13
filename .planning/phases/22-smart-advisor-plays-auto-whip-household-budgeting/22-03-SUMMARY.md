# Plan 22-03 Summary: Unit & E2E Verification for Advisor Plays, Auto-Whip & Budget Household

## Completed Tasks
1. **Engine & Component Unit Tests (`ADVISOR-01..03`)**:
   - Added unit tests for `findCheapestCoalition` in `src/engine/congress.test.ts` verifying cheapest deal subset selection (`['cen', 'spc']` for 25 Clout at 203 baseline House votes), partial existing deal handling, and empty return when already passing (`>= 218`).
   - Updated `src/screens/Congress.test.ts` to assert rendering of `[data-testid="auto-whip-btn"]` (`Auto-whip (2 deals, 25 clout)`).
   - Updated `src/screens/Budget.test.ts` to assert rendering of `[data-testid="budget-household-persona"]` (`Rust Belt Manufacturing Family · OH`) and absence of the hardcoded `'Nurse in Ohio'` string.
2. **Playwright E2E & Accessibility Verification (`tests/advisor-autowhip-budget.spec.ts`)**:
   - Verified across `1376x768` and `1280x720` viewports that clicking Oval Office's `"Open Budget"` suggestion (`Play: Infrastructure push`) navigates to Budget with `"Infrastructure push"` pre-selected (`aria-pressed="true"`).
   - Verified switching household persona on Budget via `[data-testid="budget-switch-household-btn"]` updates `[data-testid="budget-household-persona"]` live (`Sun Belt Retiree · FL`).
   - Verified clicking `[data-testid="auto-whip-btn"]` on Congress stages the cheapest 2-deal coalition (`cen` + `spc`) to reach `218 of 218` House votes.
   - Confirmed 0 serious/critical WCAG 2.1 A/AA axe violations and inspected screenshots across both viewports.
