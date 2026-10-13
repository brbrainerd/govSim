# Phase 14: Foreign Policy & Sanctions Levers Verification

## Verification Summary
- **Phase**: 14 - Foreign Policy & Sanctions Levers
- **Requirements Satisfied**:
  - `FORPOL-01`: Player can adjust defense readiness posture vs. budget savings and foreign assistance levels in the budget/executive screens.
  - `FORPOL-02`: Player can enact targeted economic sanctions (asset freezes, trade restrictions) with explicit domestic inflation and trade fallout.
  - `FORPOL-03`: Player can inspect the "Cut Foreign Aid to Fix Deficit" myth card showing foreign aid is <1% of federal spending.
- **Automated Verification**:
  - Vitest engine test suite: `src/engine/foreign.test.ts` (7/7 tests passing).
  - Vitest UI test suites: `src/screens/Powers.test.ts` and `src/screens/Budget.test.ts`.
  - Playwright E2E suite: `tests/foreign-policy.spec.ts` (4/4 tests passing).
  - Playwright full suite: 30/30 tests passing.
  - Typecheck: `npm run check` (0 errors, 0 warnings).
  - Accessibility: `@axe-core/playwright` audit on foreign policy controls with 0 serious or critical violations.
  - Viewports: 1376×768 and 1280×720 visual audits with zero outer page scroll and screenshots captured.

## Screenshots
- `.planning/phases/14-foreign-policy-sanctions-levers/screenshots/powers-foreign-policy-1376x768.png`
- `.planning/phases/14-foreign-policy-sanctions-levers/screenshots/powers-foreign-policy-1280x720.png`
- `.planning/phases/14-foreign-policy-sanctions-levers/screenshots/budget-foreign-assistance-1376x768.png`
- `.planning/phases/14-foreign-policy-sanctions-levers/screenshots/budget-foreign-assistance-1280x720.png`
