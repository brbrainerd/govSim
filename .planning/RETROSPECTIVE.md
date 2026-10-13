# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v0.2 — Playable First Term

**Shipped:** 2026-10-12  
**Phases:** 8 | **Plans:** 39 | **Tests:** 246 unit, 14 E2E

### What Was Built
- Fully deterministic presidential governance simulation of the United States with 8 economic/civic indicators, approval, and clout.
- Post-turn report card with causal ledger trace explanations, unexpected ripple effects, and comprehensive Economy screen.
- Paced crisis engine with seeded exogenous crises, endogenous player-caused crises, countdown deadlines, and risk horizons.
- Complete presidential powers: executive orders with 6-3 court reviews, nominations, bully pulpit speeches, and myth cards.
- 50-state + DC + ME/NE voter support map, 270 projection bar with uncertainty ranges, and midterms.
- Year 4 Fall election night with contingent House tie handling, why-you-won/lost debrief, and end screen with 10-year legacy score.
- 12 policy milestone badges, v1 save freeze, deflate-raw URL hash replay, and zero-egress problem report bundle.

### What Worked
- **Pure Arithmetic Determinism (`tanhPade`)**: Eliminating all transcendental `Math` functions prevented cross-browser precision drift and guaranteed 100% reproducible hash replays across Node, Chromium, WebKit, and Firefox.
- **Headless Playwright Verification**: Automated E2E verification caught viewport overflow and axe-core contrast issues early without requiring manual testing.
- **Keyed Stateless RNG Streams**: Keying draws by `(seed, stream, turn, key)` cleanly separated player choices from exogenous crises, keeping autopilot comparisons perfectly fair.

### What Was Inefficient
- Initial bot strategy in balance test only played budget levers and ignored bully pulpit speeches, requiring recalibration to reflect realistic player election outcomes.
- Axe contrast issues on badges required manual color token pairing (`var(--ink)` on gold soft background) to meet WCAG 2 AA.

### Patterns Established
- **Single Source of Truth Tokens**: Zero bare numeric literals outside exempt files, strictly validated by `pnpm guard`.
- **Zero-Egress Architecture**: Strict CSP, native browser compression streams (`CompressionStream('deflate-raw')`), and local problem report bundles instead of server-side telemetry.

### Key Lessons
1. Calibrate game balance harnesses with active presidential power usage (e.g. speeches) rather than purely passive baseline play.
2. Build axe-core and viewport tests into the execution loop of each phase to prevent visual regressions from accumulating.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v0.2 | 8 | 39 | GSD autonomous execution with wave parallelization, headless Playwright E2E audits, and pure arithmetic determinism |

### Cumulative Quality

| Milestone | Tests | Axe Violations | Viewport Status |
|-----------|-------|----------------|-----------------|
| v0.2 | 246 unit, 14 E2E | 0 | 0 overflow at 1376x768 & 1280x720 |

### Top Lessons (Verified Across Milestones)

1. Deterministic simulation engines must eliminate transcendental `Math` and stateful RNG cursors for cross-browser reproducibility.
2. Accessibility and viewport responsiveness must be continuously asserted by automated test suites.
