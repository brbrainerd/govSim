# Phase 13: Geopolitical Crises Deck & Resolution Mechanics - Context

**Gathered:** 2026-10-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement paced international crisis events (oil embargo, shipping strait blockade, debt contagion, regional border clashes) with multi-turn countdowns, cited diplomatic/economic/military response cards, and identical autopilot streaming, fulfilling CRISIS-01, CRISIS-02, and CRISIS-03.

</domain>

<decisions>
## Implementation Decisions

### Crisis Archetypes & Event Deck Composition
- 4 core international crisis archetypes: Global Oil Supply Embargo, Maritime Shipping Corridor Blockade, Foreign Sovereign Debt Contagion, and Regional Border Clashes.
- Integrated keyed stream: Add a dedicated `'geopolitics'` RNG stream in `rng.ts` alongside `'events'` ensuring exactly 1–2 international crises per 4-year term without clumping.
- Functional regional descriptors with real historical precedents (e.g., "Major Maritime Strait", "Allied Energy Producer", citing 1973 oil crisis or 1997 Asian financial crisis) to adhere strictly to nonpartisanship rules Q6 & E5.
- Escalation triggers modulated by presidential posture and prior choices (e.g. low strategic reserves increase oil embargo probability; trade tensions raise blockade risks).

### Multi-turn Countdowns & Escalation Mechanics
- 2-turn telegraphed countdown: Crisis warns in turn T, requiring action or negotiation by turn T+2.
- Automatic severe escalation if countdown reaches zero without player intervention: worst-case economic/security shock (e.g. +1.5% inflation surge, -$50B emergency bailout, or -4 approval hit).
- Hybrid temporal impact: Immediate upfront cost (clout or budget) + scheduled multi-quarter modifier ledger (e.g. 3 quarters of elevated import costs) matching established `modifiers.ts` architecture.
- Visual urgency badge with turns remaining ("2 Quarters to Escalation" in gold, "Final Quarter" in danger red) in the crisis drawer and turn summary.

### Resolution Option Triad & Autopilot Strategy
- Triad of distinct approaches: Every international crisis presents exactly 3 choices: Diplomatic, Economic, and Military.
- Clear strategic trade-offs: Diplomatic costs political clout and yields modest rally approval; Economic costs federal budget/aid and stabilizes markets; Military uses defense readiness, costs high budget, but strongly bolsters security at higher risk of friction.
- Autopilot defaults to cited consensus baseline: Option tagged `autopilot: true` (e.g. multilateral diplomatic accord or standard reserve release), ensuring fair, deterministic baseline scoring without player bias.
- Collapsible "Historical Precedent" panel on each option citing CRS/CBO reports or presidential historical precedents (e.g. Operation Earnest Will 1987, Brady Plan 1989).

### UI Presentation, Accessibility & Zero-Egress
- Crisis Modal with a distinct Geopolitical emblem / globe SVG badge, integrated seamlessly into the start-of-quarter crisis sequence.
- Persistent Geopolitical Crisis banner in Oval Office & Act Rail showing current countdown turns and option to resolve before end of quarter.
- Strict WCAG AA compliance: Zero outer viewport scroll at 1376×768 and 1280×720, full keyboard tab order, contrast >= 4.5:1, and explicit `aria-expanded` / `aria-live` countdown alerts.
- Zero external requests: All emblems rendered as inline SVGs, 100% compliant with strict zero-egress CSP.

### the agent's Discretion
- Exact coefficient values for international crisis effects registered in `src/engine/coefficients.ts` with empirical citations.
- Specific SVG layout for the international crisis globe emblem following the retro Americana poster visual direction.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/crises.ts` — Existing `CrisisDefinition`, `CrisisOption`, `CrisisEffect`, `CRISIS_CATALOG`.
- `src/engine/deadlines.ts` — Existing `DeadlineStatus`, `getImminentDeadlines` countdown logic.
- `src/engine/director.ts` — Pre-scheduled exogenous crisis generator and `ActiveCrisis` tracker.
- `src/engine/modifiers.ts` — Scheduled ledger system for multi-quarter lingering effects.
- `src/components/CrisisModal.svelte` — Accessible modal dialog for displaying crises and options.

### Established Patterns
- Pure deterministic engine with arithmetic-only operations (`tanhPade`, keyed RNG).
- Registered coefficients in `C` (`src/engine/coefficients.ts`) with sources and ranges.
- Svelte 5 runes (`$state`, `$derived`, `$props`) for UI components.
- Zero-egress CSP compliance and inline SVG illustrations.

### Integration Points
- `src/engine/director.ts`: Add geopolitical crisis scheduling stream.
- `src/engine/game.ts`: Advance crisis countdowns, evaluate unhandled expirations, and track resolved international crises.
- `src/components/CrisisModal.svelte`: Display geopolitical badge, countdown timer, and 3-way response cards.

</code_context>

<specifics>
## Specific Ideas
- Cite historical operations in crisis cards: Operation Earnest Will (1987 tanker escort), 1973 Oil Embargo SPR creation, 1994 Mexican Peso Bailout / Brady Bonds.

</specifics>

<deferred>
## Deferred Ideas
- Phase 14 will implement permanent foreign policy levers and sanctions controls.
- Phase 15 will integrate the pure 0-100 Security Index and macroeconomic feedback.
- Phase 16 will introduce the dedicated Trade & Tariffs screen.

</deferred>
