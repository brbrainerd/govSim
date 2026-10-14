# Plan 21-01 Summary: Explainers Catalog, New Myths & Curiosity Bonus Engine

**Completed:** 2026-10-13
**Requirements:** LEARN-01, LEARN-02, LEARN-03

## Changes
- Added `explainerRewardClout` (`value: 1`) to `src/engine/coefficients.ts` and updated `src/engine/powers.ts` and `src/app/session.svelte.ts` to award `+1 Clout` on first view of an explainer (`explainer:<id>`) and `+5 Clout` on first view of a myth card.
- Created `src/content/explainers.ts` with 4 cited explainers (`oval_office`, `economy`, `budget`, `trade`).
- Expanded `src/content/myths.ts` with `supply_side_taxes`, `debt_ceiling_default`, and `trade_deficits`.
- Updated `src/content/briefing.ts` so every suggestion with `target: null` specifies `openCrisis: true` or a valid `mythId`.
