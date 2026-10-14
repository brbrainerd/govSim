---
phase: 21-complete-learn-loop-explainers
status: passed
verified_at: "2026-10-13T14:54:15.000Z"
requirements:
  - LEARN-01
  - LEARN-02
  - LEARN-03
---

# Phase 21 Verification: Complete the Learn Loop & Interactive Explainers

## Goal Verification
- **LEARN-01 (Interactive "How it works" explainers + +1 Clout curiosity bonus)**: Verified. Zero disabled `"Coming soon"` buttons remain across `src/screens/`. Clicking `"How it works"` on Oval Office, Economy, Budget, or Trade opens `ExplainerModal` and awards `+1 Clout` (`C.explainerRewardClout`) on first view.
- **LEARN-02 (Trade Learn strip + 3 new Myth cards)**: Verified. `Trade.svelte` renders `{#snippet learn()}` and `MYTHS_CATALOG` includes `supply_side_taxes`, `debt_ceiling_default`, and `trade_deficits` with balanced left/right challenges (`3 left`, `3 right`, `2 both`).
- **LEARN-03 (Oval Office suggestion modal triggers)**: Verified. All `Suggestion` items in `src/content/briefing.ts` with `target: null` specify `openCrisis: true` or a valid `mythId`, and clicking them on `OvalOffice.svelte` opens `CrisisModal` or `MythModal`.

## Automated Gates
- `pnpm test`: 422 passing (66 files)
- `npx playwright test tests/learn-loop.spec.ts`: 1 passed across `1376x768` and `1280x720` with 0 serious/critical axe violations
- `pnpm check`: 0 errors, 0 warnings
- `pnpm guard`: ok
