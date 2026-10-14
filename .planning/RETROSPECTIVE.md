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

## Milestone: v0.3 — Social Policy & Domestic Reform

**Shipped:** 2026-10-12  
**Phases:** 4 | **Plans:** 16 | **Tests:** 330 unit, 23 E2E

### What Was Built
- Domestic social policy levers across healthcare (ACA, prescription drugs), immigration (visas, border security), energy/climate (clean energy credits, leasing permits), and education (Title I grants, student loans).
- Demographic and regional distribution model connecting macro policy to state economies, BEA regional price parity, and voter coalition shifts.
- Structural government reform mechanics: Senate filibuster rule modifications, Supreme Court ethics and 18-year term limits, and high-hurdle constitutional amendment ratifications (2/3 Congress + 3/4 state legislatures).
- "Your Household" impact card displaying monthly kitchen-table budget impacts across 7 categories, 4 preset personas, and custom builder drawer.
- Extended Monte Carlo balance suite across 100 seeds verifying +3.425 headroom and party neutrality within 5 percentage points.

### What Worked
- **Regional Price Parity Indexing**: Integrating BEA state RPP indices into the household model grounded abstract macroeconomic inflation in realistic geographic cost variations.
- **Immediate Color Contrast Enforcement**: Removing intermediate CSS transitions on active filter/tab buttons eliminated transient axe color contrast failures.
- **Progressive Reform Mechanics**: Modeling realistic political friction (e.g. state-by-state amendment ratification pacing) created authentic civics learning opportunities without breaking game balance.

### What Was Inefficient
- Re-running entire visual and E2E suites on every small style adjustment can take ~35 seconds; isolating viewport tests during development speeds up feedback loops.

### Patterns Established
- **Persona Preset Architecture**: Fixed demographic archetypes paired with a flexible custom builder provide immediate relatable context for diverse players.
- **Party Neutrality Testing**: Automated regression assertions proving that symmetric policies yield symmetric reelection probabilities for both parties within 5 percentage points.

### Key Lessons
1. Household-level microeconomic models provide immediate player empathy and clarify complex federal macroeconomic tradeoffs.
2. High-hurdle institutional mechanics (filibuster thresholds, constitutional amendments) require explicit feedback and intermediate state indicators to remain satisfying game loops.

## Milestone: v0.4 — Foreign Policy & International Crises

**Shipped:** 2026-10-12  
**Phases:** 4 | **Plans:** 16 | **Tests:** 365 unit, 35 E2E

### What Was Built
- Paced geopolitical crisis deck (oil embargo, shipping blockade, debt contagion, cyber blackout) with cited diplomatic/economic/military resolution options and multi-turn escalation.
- Foreign policy levers (defense readiness posture, foreign assistance, targeted sanctions) with domestic inflation pass-through and civics myth cards.
- Pure deterministic 0–100 Security Index driving 10% of Prosperity Index with causal trace explanations.
- International Trade & Tariffs screen with strategic sector tariffs (chips, minerals, clean energy), bilateral trade accords, and state export vulnerability matrix.

### What Worked
- **Reciprocal Retaliation Logic**: Coupling unilateral tariffs to foreign reciprocal rates grounded trade policy in authentic international economics without arbitrary balancing numbers.
- **Security Index Composite**: Modularizing defense readiness, alliances, and crisis fallout into a single 0–100 index provided intuitive player feedback.

### Key Lessons
1. Clear risk bands and multi-turn escalation horizons give players time to respond thoughtfully to international shocks.

---

## Milestone: v0.5 — Satirical "Evil Mode"

**Shipped:** 2026-10-13  
**Phases:** 4 | **Plans:** 16 | **Tests:** 417 unit, 51 E2E

### What Was Built
- Alternative "Evil Mode" kleptocracy toggle, pure deterministic offshore stash accumulator ($B), and dynamic 0–100 Heat meter with natural decay and evidence leaks.
- Catalog of corrupt presidential levers (no-bid contracts, land auctions, tariff exemption sales, slush funds, watchdog purges).
- Institutional backlash system: special counsel investigations, House impeachment votes, and Senate conviction trial with immediate asset forfeiture.
- Dark Americana theme (oxblood, aged gold, ink), live Oval Office stash rosette/heat gauge, Kleptocratic Heist Review EndScreen, and 6-tier satirical verdicts.

### What Worked
- **Parallel Game Loop**: Isolating Evil Mode's offshore stash and heat dynamics within a dedicated engine module maintained strict nonpartisanship in standard mode while delivering a razor-sharp satire of executive corruption.
- **High-Stakes Impeachment Trials**: Authentic constitutional thresholds (218 House, 67 Senate) created intense mechanical tension between greed and political survival.

### Key Lessons
1. Satirical game modes benefit from authentic institutional mechanics rather than cartoonish arbitrary rules.

---

## Milestone: v0.6 — Completeness, Advisor Agency & Scenarios

**Shipped:** 2026-10-14  
**Phases:** 4 | **Plans:** 8 | **Tests:** 428 unit, 57 E2E

### What Was Built
- Interactive civic explainers & Learn loop: step-by-step interactive "How it works" modals across all screens (+1 Clout bonus), Trade Learn strip, 3 new Myth cards, and wired Oval Office Chief of Staff suggestion modals.
- Smart Advisor plays & Congress Auto-Whip: actionable one-click "Advisor Plays" navigating and pre-filling draft packages, pure `findCheapestCoalition` solver for 218 House votes, live Household Persona binding, and dual in-force vs 2026 baseline slider indicators.
- Turn pacing & staged decisions: top-bar live Staged Decisions tray with unsent warnings and screen jump buttons, safe "Skip to Next Event" fast-forward loop with automatic interrupts on crises/deadlines/elections.
- Replayable starting scenarios: curated Starting Scenario selector at New Game with 4 scenarios, inauguration briefings, and persistent EndScreen and URL hash replay badges.

### What Worked
- **Exhaustive Subset Solver for Congressional Coalitions**: Because the deals catalog is concise (3 deals), an exhaustive power-set search ($2^3 = 8$) guarantees finding the exact cheapest coalition instantaneously while preserving pure-engine determinism.
- **Unified Decision Schema Hardening**: Expanding `validateDecisions` and deflate-raw share codes to cover all levers ensured seamless save/share round-trips across every gameplay mechanic.
- **Pacing Controls Without State Divergence**: Reusing `Session.nextTurn()` directly inside `fastForwardToNextEvent` ensured that fast-forwarding advances the exact same deterministic simulation path as clicking turn by turn.

### Key Lessons
1. Reducing cognitive friction (via one-click advisor plays and auto-whip) dramatically improves game feel without dumbing down the underlying model.
2. Replayable starting scenarios multiply depth and player engagement more effectively than adding dozens of isolated policy dials.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v0.2 | 8 | 39 | GSD autonomous execution with wave parallelization, headless Playwright E2E audits, and pure arithmetic determinism |
| v0.3 | 4 | 16 | Deep demographic/regional modeling, kitchen-table microeconomics, and structural reform systems |
| v0.4 | 4 | 16 | International geopolitical crises, defense readiness, foreign assistance, and sector tariffs |
| v0.5 | 4 | 16 | Satirical kleptocracy game loop, heat meter, and constitutional impeachment trials |
| v0.6 | 4 | 8 | Complete learn loop, one-click advisor plays, congress auto-whip, turn pacing, and starting scenarios |

### Cumulative Quality

| Milestone | Tests | Axe Violations | Viewport Status |
|-----------|-------|----------------|-----------------|
| v0.2 | 246 unit, 14 E2E | 0 | 0 overflow at 1376x768 & 1280x720 |
| v0.3 | 330 unit, 23 E2E | 0 | 0 overflow at 1376x768 & 1280x720 |
| v0.4 | 365 unit, 35 E2E | 0 | 0 overflow at 1376x768 & 1280x720 |
| v0.5 | 417 unit, 51 E2E | 0 | 0 overflow at 1376x768 & 1280x720 |
| v0.6 | 428 unit, 57 E2E | 0 | 0 overflow at 1376x768 & 1280x720 |

### Top Lessons (Verified Across Milestones)

1. Deterministic simulation engines must eliminate transcendental `Math` and stateful RNG cursors for cross-browser reproducibility.
2. Accessibility and viewport responsiveness must be continuously asserted by automated test suites.
3. Macroeconomic governance games feel most impactful when grounded in tangible household-level financial consequences.
4. Advisor guidance and auto-solvers keep deep strategic games accessible without compromising mathematical rigor.
