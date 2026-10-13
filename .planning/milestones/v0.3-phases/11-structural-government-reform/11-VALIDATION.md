# Phase 11: Structural Government Reform & Amendments — Validation Plan

**Requirements:** REF-01, REF-02, REF-03, REF-04  
**Type:** Unit, Property, Determinism, E2E, Accessibility, Viewport

---

## 1. Automated Test Coverage

| Test File | Target Requirement | Key Verifications |
|---|---|---|
| `src/engine/congress.test.ts` | REF-01 | 4 filibuster rules, cloture threshold calculations, talking filibuster curve, Senate vote derivation, bicameral bill passage vs filibuster |
| `src/engine/reforms.test.ts` | REF-02, REF-03 | 18-year term limits Article III review challenge, statutory ethics code trust gain, bench expansion confirmation & uphold probability shifting, electoral reform grants and turnout/trust gains |
| `src/engine/amendments.test.ts` | REF-04 | 2/3 House (290) & 2/3 Senate (67) proposal hurdles, turn-by-turn state legislature ratifications across 50 states, 38-state threshold, permanent constitutional benefit codification |
| `tests/reforms.spec.ts` | REF-01..04 | Playwright E2E: filibuster modal rule change, bicameral bill passage, judicial reform modal, amendment proposal and state tracking |
| `tests/a11y.spec.ts` | REF-01..04 | Axe-core audits on `FilibusterModal`, `JudicialReformModal`, and `AmendmentModal` with 0 serious/critical violations |
| `tests/voters-viewport.spec.ts` / reforms viewport audit | REF-01..04 | Zero document-level scroll overflow at 1376×768 and 1280×720 viewports |

---

## 2. Purity & Invariants

1. **Zero Bare Literals**: Every coefficient in `coefficients.ts` or `units.ts`; verified by `src/engine/coefficients.test.ts` literal scan.
2. **Zero `Math.*` in Engine**: All arithmetic uses `detmath.ts` (`clamp`, `round`, `abs`, `sqrt`).
3. **Determinism**: Verified across Node, Chromium, Firefox, WebKit (`pnpm determinism`).
4. **Replay Invariance**: Baseline runs without reform choices maintain identical hashes.
