# Plan 14-01 Summary: Engine Modeling — Foreign Policy Levers, Sanctions & Coefficients

## Accomplishments
- **Sourced Macro Coefficients (`src/engine/coefficients.ts`)**:
  - `defenseSurgeCostBn`: +$35B/yr deficit surcharge for heightened forward surge posture (CBO).
  - `defensePeacetimeSavingsBn`: -$25B/yr deficit reduction for peacetime troop drawdown (CBO).
  - `foreignAssistancePerPoint`: $0.45B/yr per point deviation from baseline foreign assistance (base 100 = ~$45B/yr, CRS R43838).
  - `sanctionAssetFreezeInflation` (+0.05%), `sanctionAssetFreezeOutput` (-0.03%).
  - `sanctionExportControlsInflation` (+0.10%), `sanctionExportControlsOutput` (-0.08%).
  - `sanctionEnergyEmbargoInflation` (+0.25%), `sanctionEnergyEmbargoOutput` (-0.15%).
  - `sanctionCloutCost` (10 clout per sanction).
- **Pure Arithmetic Foreign Policy Engine (`src/engine/foreign.ts`)**:
  - `DefensePosture`: `'peacetime' | 'standard' | 'surge'`.
  - `SANCTIONS_CATALOG`: 3 curated sanction regimes (Asset Freezes, Advanced Tech Export Controls, Energy Shipping Embargos) with statutory bases (IEEPA, ECRA, CAATSA) and Treasury OFAC/CRS citations.
  - Pure evaluation in `resolveForeignPolicy(...)` computing quarterly deficit, inflation, output gap, and clout changes.
- **Decisions & Macro Integration (`src/engine/decisions.ts`, `src/engine/game.ts`, `src/engine/trace.ts`)**:
  - Added `foreignPolicy?: ForeignPolicyDraft` to `Decisions`.
  - Added `foreignPolicy?: ForeignPolicyState` to `GameState` and `newGame()`.
  - Added `forpol:sanctions` into `gap` and `inflation` ledgers, `forpol:budget` into `debtPct` ledger, and `forpol:` prefix into `trace.ts`.
  - Verified bitwise determinism and updated golden replay hashes in `determinism.test.ts`.
- **Automated Verification**:
  - Created `src/engine/foreign.test.ts` (7/7 tests passed).
  - All 55 test suites (345 unit tests) green; `svelte-check` 0 errors, 0 warnings.
