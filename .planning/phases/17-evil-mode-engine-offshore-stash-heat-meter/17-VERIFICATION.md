---
status: passed
phase: 17-evil-mode-engine-offshore-stash-heat-meter
covered_requirements:
  - EVIL-01
  - EVIL-02
  - EVIL-03
---

# Phase 17 Verification: Evil Mode Engine, Offshore Stash & Heat Meter

## Verification Results

### 1. Requirements Coverage
- **EVIL-01 (Satirical Evil Mode Opt-In & Rules Engine)**:
  - Opt-in toggle and card selection implemented in `src/screens/NewGame.svelte`.
  - Pure arithmetic evil state engine implemented in `src/engine/evil.ts` and integrated in `src/engine/game.ts` `step()`.
  - State fields `stashBn`, `heat`, `siphonedThisQuarterBn`, `investigationsActive`, `specialCounselAppointed`, `impeachmentTriggered` deterministically tracked.
  - Siphoning rules, quarterly decay, and penalties implemented with zero bare literals.
- **EVIL-02 (Offshore Stash Accumulator & Heat Meter)**:
  - Status display components in `src/ui/StatusBar.svelte` with reactive bindings in `src/app/session.svelte.ts` and `src/screens/Game.svelte`.
  - Plain-language causal trace attribution registered in `src/engine/trace.ts` and `src/content/text/why.ts`.
- **EVIL-03 (Institutional Friction & Threshold Reactions)**:
  - Heat penalties applied to approval and public trust.
  - Congressional legislative friction dynamically scales House and Senate vote hurdles against presidential bills based on accumulated heat in `src/engine/congress.ts` and `src/engine/evil.ts`.
  - Threshold triggers for Special Counsel (heat >= 75) and Impeachment (heat >= 90) active and logging alerts.

### 2. Automated Testing & Verification
- Unit & Determinism Tests:
  - `src/engine/evil.test.ts`: 16/16 tests passing.
  - `src/engine/determinism.test.ts`: Golden hashes match across all platforms.
  - `src/engine/invariants.property.test.ts`: Preserves bounds and determinism across 1000 randomized runs.
  - `src/screens/NewGame.test.ts`: Mode toggle and warning display tests passing.
  - `src/app/session.test.ts`: Session store options and reactive helpers passing.
  - Total Vitest: 61 test files passing (382 tests).
- E2E & Layout Verification:
  - `tests/evil-mode.spec.ts`: 4/4 Playwright tests passing.
  - Tested across viewports `1376x768` and `1280x720` with 0 page scroll overflow (`scrollHeight <= windowHeight + 1`).
  - Automated Axe accessibility audits (`wcag2a`, `wcag2aa`) with 0 serious/critical violations.
  - Responsive screenshots captured in `.planning/phases/17-evil-mode-engine-offshore-stash-heat-meter/screenshots/`.
