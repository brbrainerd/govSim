# Phase 3 Plan 01 Summary: Score Unification (RPT-02, D11, GR-04)

**Executed:** 2026-10-12  
**Requirements Addressed:** RPT-02  
**Guardrails Satisfied:** GR-04, D11  

---

## 1. What was built

1. **Unified Scoring Contract (`src/engine/score.ts`, `src/engine/game.ts`):**
   - Exported `ScoreBreakdown` interface `{ now: number; later: number; total: number }`.
   - Exported `finalScore(state)` and `projectedScore = finalScore` ensuring the status bar score and end-screen score use the exact same calculation.
   - Exported `scoreVsAutopilot(state, autopilotState)` calculating the difference between player and autopilot across total, current (now), and legacy (later).
2. **Top Bar Score Presentation (`src/ui/StatusBar.svelte`, `src/app/session.svelte.ts`):**
   - `Session.score` derives `scoreVsAutopilot` on every turn.
   - `StatusBar.svelte` accepts `ScoreBreakdown` and renders the headline comparison (`total`) with a sub-line showing `"Now: {now} · In 10 years: {later}"`.
   - `Game.svelte` passes `session.score`.
3. **GR-04 Calibration & Calibration Tests (`src/engine/balance.test.ts`, `src/engine/score.test.ts`):**
   - Asserted `projectedScore === finalScore`.
   - Tested that over 40 seeds and 4 benchmark strategies (`sensible`, `maxDeficit`, `maxAusterity`, `tariffEverything`), at turn 16 the sign of the displayed headline matches the final score sign in >= 95% of runs.
   - Tested that `maxDeficit` exhibits a negative headline before turn 16 in >= 80% of seeds.

---

## 2. Verification Evidence

- `pnpm exec vitest run src/engine/score.test.ts`: 3/3 passed.
- `pnpm exec vitest run src/engine/balance.test.ts`: 6/6 passed (including GR-04 test).
- `pnpm guard && pnpm check && pnpm test`: all 22 test files (135 tests) passed, 0 errors, 0 warnings.
- `pnpm test:e2e`: 5/5 Playwright tests passed (a11y, zero egress, keyboard navigation, 1376x768 and 1280x720 viewports).
