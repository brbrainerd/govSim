# Phase 18 Context: Corrupt Executive Levers & Cronyism

## Goal
Implement the corrupt presidential actions enabling players in Evil Mode to siphon kickbacks directly into their offshore stash, generate/suppress heat, trade clout for self-enrichment, and manage institutional oversight.

## Requirements
- **LEVER-01**: Player can award no-bid crony procurement contracts and auction federal land/assets to siphon kickbacks directly into the offshore stash.
- **LEVER-02**: Player can sell targeted tariff exemptions and solicit presidential "library foundation" donations at the cost of heat generation.
- **LEVER-03**: Player can fire inspectors general and pressure law enforcement to suppress active heat generation at high clout and trust costs.

## Design & Constraints
1. **Engine Rules**:
   - Pure deterministic arithmetic; no `Math.random()` or unseeded operations.
   - Zero bare numeric literals in engine logic — all costs, kickbacks, heat changes, and penalties defined in `src/engine/coefficients.ts` or `src/engine/units.ts`.
   - Idempotent and serializable state additions.
2. **Design Tokens & Theme**:
   - Reskin styling and design tokens consistent with satire theme.
   - Clean a11y with 0 serious/critical axe violations.
   - Responsive multi-viewport verification across `1376x768` and `1280x720`.
3. **Traceability**:
   - Every effect on clout, offshore stash, heat, approval, and trust must be accounted for with explanatory trace strings in `src/content/text/why.ts`.
