# Plan 28-01 Summary — "Show Your Work" Model Inspector & Citation Audit

**Phase:** 28
**Plan:** 28-01
**Requirements:** `MODEL-01`, `MODEL-02`
**Completed:** Yes

---

### Key Accomplishments

1. **Introspection Catalog & Domain Mapping (`src/content/model-inspector.ts`)**:
   - Mapped 100% of keys across `COEFF`, `SCORE`, `LIMITS`, and `RULES` (plus budget levers) into 6 policy domains (`macro`, `fiscal`, `social`, `foreign`, `scoring`, `evil`).
   - Defined 6 plain-language core equations (`Output Gap & Fiscal Impulse`, `Okun's Law (Jobs)`, `Phillips Curve (Inflation)`, `Taylor Rule (Fed Policy Rate)`, `Debt & Sovereign Borrowing Cost`, `Prosperity Index & 10-Yr Legacy`).
   - Implemented `getInspectorEntries(domain, query)` with live substring search over IDs, notes, labels, units, and citation sources.
   - Implemented `getInspectorSummary()` providing total parameter counts, citation counts, and domain breakdowns.
   - Comprehensive unit tests in `src/content/model-inspector.test.ts` (5/5 passing).

2. **Interactive Inspector UI (`src/ui/ModelInspectorModal.svelte`)**:
   - Structured two-column layout in `Overlay.svelte` with header, metric summary bar, live search, and domain filter pills (`data-testid="model-domain-<id>"`).
   - Core equation cards with formatted formulas, plain-language explanations, and official publication links.
   - Parameter registry cards (`data-testid="model-entry-card"`) displaying parameter IDs, table badges, domain badges, basis badges (`VERIFIED CITATION` vs `CALIBRATED JUDGMENT`), current values, units, permitted ranges, and interactive range indicator bars.
   - Zero hardcoded colors; strictly uses design tokens (`var(--card)`, `var(--card-alt)`, `var(--ink)`, `var(--ink-soft)`, `var(--ink-tint)`, `var(--sage-dark)`, etc.).

3. **Entry Points & Navigation Integration**:
   - Added `"Show your work (N params)"` button (`data-testid="open-model-inspector-btn"`) to `Economy.svelte` learn snippet.
   - Added `"Inspect Economic Model & Equations"` button (`data-testid="about-model-inspector-btn"`) to `AboutModal.svelte`.
   - Wired modal state and handlers into `Game.svelte`.

4. **Playwright E2E & Accessibility Verification (`tests/model-inspector.spec.ts`)**:
   - Audited across 1376×768 and 1280×720 viewports with zero horizontal or outer scrollbar overflow.
   - Axe-core accessibility audit confirms 0 serious or critical violations.
   - Validated opening from Economy, filtering by domain, live searching (e.g. "okun"), Escape key dismiss, opening from AboutModal, and footer stamp close.

5. **Guardrails & Determinism**:
   - Zero numeric changes made to `src/engine/coefficients.ts`; `pnpm determinism` remains 8/8 green.
   - `tests/egress.spec.ts` confirms 0 network requests outside origin.
