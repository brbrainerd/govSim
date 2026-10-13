# Phase 17 Context: Evil Mode Engine, Offshore Stash & Heat Meter

## Objective
Implement the foundational mechanics for Milestone v0.5 Satirical "Evil Mode": alternative game mode toggle at New Game, pure deterministic offshore stash tracking, dynamic 0–100 Heat meter with quarterly decay, and escalating institutional/voter friction.

## Requirements
- `EVIL-01`: Player can toggle "Evil Mode" at New Game, setting the primary objective to maximizing an offshore stash ($B) while evading conviction.
- `EVIL-02`: Pure engine computes a dynamic 0–100 Heat meter driven by corrupt actions, leaking evidence, and media scrutiny, with slow natural decay.
- `EVIL-03`: Heat level applies escalating penalties to public trust, voter approval, and congressional legislative friction.

## Architecture & Design Decisions
1. **Pure Engine Arithmetic**:
   - `src/engine/evil.ts` handles pure functions: `calculateHeatDecay`, `calculateHeatPenalties`, `sanitizeEvilState`.
   - Pure arithmetic only; zero bare literals outside exempt files.
   - All coefficients registered in `src/engine/coefficients.ts`.
2. **Session & Options Separation (D4)**:
   - `evilMode: boolean` lives in `session.options`.
   - `GameState.evil` tracks `{ offshoreStashBn: number, heat: number, investigationsActive: boolean, specialCounselAppointed: boolean, articlesOfImpeachmentVoted: boolean, convicted: boolean }`.
3. **Traceability & Plain Language**:
   - Trace source `'evil:heat'` registered in `trace.ts` with plain-language explanations in `src/content/text/why.ts` (Flesch-Kincaid grade <= 9.0).
4. **Accessible UI & Screen Testing**:
   - `NewGame.svelte` gets an accessible mode selector with clear visual affordances and screen reader announcements.
   - Playwright audited across 1376×768 and 1280×720 viewports with zero a11y violations.
