# Phase 28 UI Design Contract — "Show Your Work" Model Inspector & Citation Audit

**Phase:** 28
**Requirements:** `MODEL-01`, `MODEL-02`
**Target Visuals:** `.design-targets/g-economy.png`, `.design-targets/g-myth.png`, `docs/design.md` §4

## 1. "Show Your Work" Transparency Promise (`MODEL-01`)

Per `docs/design.md` §4 ("Every model coefficient has a citation or is tagged `judgement` with a plausible range, and the UI exposes a 'Show your work' drawer"):
- Accessible via a `"Show your work (Model)"` button on `Economy.svelte` (`data-testid="open-model-inspector-btn"`) and inside `AboutModal.svelte` (`data-testid="about-model-inspector-btn"`).
- Opens `src/ui/ModelInspectorModal.svelte` inside `Overlay.svelte`:
  - **Left Column**: Domain filter tabs (`All`, `Macro & Fed`, `Budget & Debt`, `Social & Health`, `Foreign & Trade`, `Scoring & Rules`), search filter input (`data-testid="model-search-input"`), and plain-language core equation cards (Output Gap & Okun's Law, Phillips Curve, Taylor Rule, Debt & Interest Pass-Through, Prosperity Index).
  - **Right Column**: Scrollable table/cards of live entries read directly from `COEFF`, `SCORE`, `LIMITS`, and `RULES` in `src/engine/coefficients.ts`, showing:
    - Parameter ID & plain-language label
    - Current `value` and `unit`
    - Valid `range` / `bounds` bar (`[lo, hi]`)
    - Basis badge (`Verified Citation` vs `Calibrated Judgement`)
    - Plain-language `note` and clickable `https://` source citations where present.

## 2. Coefficient Audit & Determinism Guardrail (`MODEL-02`)

- **Hard Rule**: NEVER alter any numeric `value`, `range`, or `bounds` in `src/engine/coefficients.ts` (changing a numeric coefficient would alter `pnpm determinism` golden hashes).
- Audit every entry in `COEFF`, `SCORE`, `LIMITS`, and `RULES`: ensure every entry has a clear, jargon-free `note`, domain classification in `src/content/model-inspector.ts`, and verified `https://` institutional citations where applicable without inventing URLs (`HANDOFF.md` §5.2).
