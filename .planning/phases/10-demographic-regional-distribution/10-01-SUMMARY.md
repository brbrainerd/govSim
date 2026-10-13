# Phase 10 Plan 01 Summary: State Demographic & Regional Exposure Dataset

## Overview
- **Phase:** 10-demographic-regional-distribution
- **Plan:** 01 (Wave 1)
- **Status:** Complete
- **Commit Range:** `90469c8`..`5fbc683`

## Work Completed
1. **Empirical Dataset Enrichment (`data/electoral-2024.json`)**:
   - Sourced and enriched empirical Census ACS (2023 1-Year), BEA Regional Price Parities (2023), and EIA State Electricity Profiles (2023/2024).
   - Metrics added for all 51 jurisdictions:
     - `seniorShare`: 65+ population share (FL: 0.216, ME: 0.218, UT: 0.117).
     - `uninsuredRate`: non-elderly uninsured rate (TX: 0.166, OK: 0.138, MA: 0.024).
     - `borderState`: southern border proximity flag (`TX`, `CA`, `AZ`, `NM`).
     - `immigrantLaborShare`: foreign-born share of workforce (CA: 0.265, NJ: 0.228).
     - `cleanEnergyGrowth`: renewable electricity generation potential & investment (IA: 0.62, KS: 0.47).
     - `fossilEnergy`: fossil extraction share of GDP (retained from existing `energy` metric).
     - `carbonIntensity`: grid emission intensity relative to national average (WV: 1.85, WY: 1.95, VT: 0.10).
     - `childPovertyRate`: school-age child poverty rate (MS: 0.272, LA: 0.265, NH: 0.082).
     - `studentDebtShare`: adults aged 20-39 with federal student loans (GA: 0.245, DC: 0.280).
     - `youngFamilyShare`: households with children under 6 (UT: 0.145, MN: 0.105).
     - `rpp`: BEA Regional Price Parity index (US avg = 100.0; MS: 87.2, AR: 87.8, CA: 112.5, NY: 110.2).

2. **Typed Data Accessors (`src/data/electoral.ts`, `src/data/electoral.test.ts`)**:
   - Exported `StateDemographicExposure` with full type coverage and backward-compatible `StateExposure` alias.
   - Updated `getStateExposure` to gracefully fall back from split districts (`ME-1`, `ME-2`, `NE-1`, `NE-2`, `NE-3`) to parent states.
   - Expanded unit tests validating data bounds, empirical anchors, and fallbacks.

3. **Voter Sensitivity Coefficients (`src/engine/coefficients.ts`, `src/engine/units.ts`)**:
   - Registered 13 voter social sensitivity coefficients in `COEFF`:
     - `voterAcaSensitivity` (0.8)
     - `voterDrugPriceSensitivity` (1.2)
     - `voterPublicOptionSensitivity` (1.0)
     - `voterBorderSecuritySensitivity` (1.5)
     - `voterVisaLaborSensitivity` (0.6)
     - `voterRegularizationSensitivity` (1.2)
     - `voterCleanEnergySensitivity` (1.0)
     - `voterFossilPermittingSensitivity` (1.4)
     - `voterCarbonStandardPenalty` (1.5)
     - `voterTitleIEducationSensitivity` (0.7)
     - `voterStudentDebtSensitivity` (1.1)
     - `voterUniversalPreKSensitivity` (1.3)
     - `voterFamilyReliefElasticity` (0.05)
   - Added `RPP_BASE_INDEX`, `FAMILY_RELIEF_UNIT_DOLLARS`, and national demographic cohort share constants to `src/engine/units.ts`.
   - Verified 100% coefficient registry compliance and zero numeric literal regressions.

## Verification
- `pnpm guard`: guard ok.
- `svelte-check`: 0 errors, 0 warnings.
- `vitest run src/data/electoral.test.ts`: 5/5 passed.
- `vitest run src/engine/coefficients.test.ts`: 11/11 passed (0 unregistered coefficients, zero bare literals).
- `pnpm test`: 45/45 test files passed (274 tests).
