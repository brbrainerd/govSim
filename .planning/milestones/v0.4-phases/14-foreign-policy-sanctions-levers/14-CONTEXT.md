# Phase 14 Context: Foreign Policy & Sanctions Levers

## Objectives
Implement presidential foreign policy levers, defense readiness posture controls, targeted economic sanctions with explicit macro trade-offs, and the "Cut Foreign Aid to Fix Deficit" civics myth card.

## Requirements
- **FORPOL-01**: Player can adjust defense readiness posture vs. budget savings and foreign assistance levels in the budget/executive screens.
- **FORPOL-02**: Player can enact targeted economic sanctions (asset freezes, trade restrictions) with explicit domestic inflation and trade fallout.
- **FORPOL-03**: Player can inspect the "Cut Foreign Aid to Fix Deficit" myth card showing foreign aid is <1% of federal spending.

## Architectural & Design Principles
1. **Pure Engine Isolation**:
   - All foreign policy dynamics are pure arithmetic functions in `src/engine/foreign.ts`.
   - Coefficients are sourced from CBO, CRS, and Treasury OFAC reports and documented in `src/engine/coefficients.ts`.
   - Autopilot invariant: `autopilotDecisions()` defaults to standard baseline posture, 100% foreign assistance, and 0 optional unilateral sanctions, preserving baseline determinism.
2. **Pedagogical Civics Design**:
   - The myth card clearly explains federal outlays: ~60% mandatory/entitlements, ~13% defense, ~13% net interest, and <1% international assistance.
   - Sanctions make explicit the real-world trade-off: geopolitical coercive leverage comes at the cost of domestic commodity inflation and export fallout.
   - Defense readiness makes explicit the budget cost: heightened deterrence posture costs billions in operational readiness, while drawdown saves money but degrades crisis resilience.
3. **Zero Visual & Color Token Drift**:
   - All components use existing tokens from `src/design/tokens.ts`.
   - Accessible keyboard controls, WCAG 2 AA contrast ratio >= 4.5:1.
   - Playwright audits across 1376×768 and 1280×720 viewports with zero outer viewport scroll.

## Plan Breakdown
1. **Plan 14-01**: Engine Modeling — Foreign Policy Levers, Sanctions, Coefficients & Determinism (`FORPOL-01`, `FORPOL-02`)
2. **Plan 14-02**: Executive & Budget UI Integration — Defense Readiness & Sanctions Controls (`FORPOL-01`, `FORPOL-02`)
3. **Plan 14-03**: Civics Myth Card "Cut Foreign Aid to Fix Deficit" & Citations (`FORPOL-03`)
4. **Plan 14-04**: Playwright E2E Audits, A11y, Screenshots & Milestone Synchronization
