# Summary: Plan 15-03

## Completed Work
1. **Prosperity Index Composite (`src/engine/score.ts`)**:
   - Integrated `calculateSecurityIndex(state)` into `prosperity(state)` for `parts.security.v` at 10% weight (`SCORE.securityWeight.value`).
2. **Causal Trace Attribution in Report Cards (`src/app/attribution.ts`)**:
   - Added `attributeSecurity` function computing top causal contributor (`International crisis containment`, `Defense readiness posture change`, `Targeted economic sanctions`, `Foreign aid and alliance shifts`, `Domestic crime trends`) from `calculateSecurityBreakdown`.
   - Replaced raw domestic crime indicator in Turn Report specs with `National Security` (`pts`, `higherIsBetter: true`).
   - Added `security` unit formatting (`0.0` fixed precision).
3. **Calibration & Verification**:
   - Adjusted `securityCrimeScale` from 25.0 to 30.0 within the justified range `[10.0, 50.0]` in `src/engine/coefficients.ts` to ensure all budget levers satisfy GR-28/GR-36 score sensitivity thresholds.
   - Regenerated `balance-report.json` via `scripts/balance-report.ts`.
   - Verified 57/57 test files, 353/353 unit tests passing, and `guard ok`.
