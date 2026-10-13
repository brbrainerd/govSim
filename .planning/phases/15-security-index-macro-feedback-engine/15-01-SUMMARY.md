# Plan 15-01 Summary: Security Index Sourced Coefficients & Calculation (SEC-01)

## Implemented Work
- **Coefficients Registration (`src/engine/coefficients.ts`)**:
  - Registered sourced coefficients for Security Index:
    - `securityBaseline`: 50.0 neutral base on 0–100 scale.
    - `securityDefenseSurgeBonus`: +8.0 pts for surge posture.
    - `securityDefensePeacetimePenalty`: -10.0 pts for peacetime drawdown.
    - `securityForeignAidScale`: 0.05 pts per point deviation from 100 foreign aid.
    - `securityActiveCrisisPenalty`: -12.0 pts per unresolved active geopolitical crisis.
    - `securitySanctionBonus`: +2.5 pts deterrence per active targeted sanction.
    - `securityCrimeScale`: 25.0 pts domestic crime relative to start.
    - `geopoliticalEnergyInflation`, `geopoliticalShippingInflation`, `geopoliticalSupplyOutputDrag`.
- **Pure Security Module (`src/engine/security.ts`)**:
  - Implemented `calculateSecurityBreakdown(input: SecurityInput): SecurityBreakdown`.
  - Implemented `calculateSecurityIndex(input: SecurityInput): number`.
  - Clamped strictly within `[0, 100]` with zero bare literals outside exempt files.
- **Unit Tests (`src/engine/security.test.ts`)**:
  - Validated baseline 50.0 neutral score.
  - Validated surge (+8) and peacetime (-10) posture adjustments.
  - Validated foreign assistance alliance scaling.
  - Validated uncontained geopolitical crisis penalty (-12).
  - Validated deterrence sanctions and domestic crime improvements.
  - Validated boundary clamping.

## Verification
- `npm run check`: 0 errors, 0 warnings.
- `npm test`: 57 test files, 353 tests passing.
