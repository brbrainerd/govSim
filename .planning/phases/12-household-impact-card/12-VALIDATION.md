# Phase 12: Household Impact Card & Balance — Validation Plan

**Requirements:** HOU-01, HOU-02  
**Type:** Unit, Property, Determinism, E2E, Accessibility, Viewport, Balance

---

## 1. Automated Test Coverage

| Test File | Target Requirement | Key Verifications |
|---|---|---|
| `src/engine/household.test.ts` | HOU-01, HOU-02 | Pure household budget calculation across 7 categories (wages, groceries, energy, healthcare, childcare, student loans, taxes); preset persona evaluations; custom builder inputs and edge cases; determinism and bounds |
| `src/engine/balance.test.ts` | HOU-01..02, Milestone v0.3 | 100-seed balance verification against `balance-report.json`; non-domination of sensible play over autopilot (+2.0..+10.0 headroom) and degenerate strategies; party neutrality ($\le$ 5 pp re-election divergence) |
| `tests/household.spec.ts` | HOU-01, HOU-02 | Playwright E2E: inspect household card in Oval Office, switch personas, customize household in Economy screen, observe real-time policy draft delta |
| `tests/a11y.spec.ts` | HOU-01, HOU-02 | Axe-core audits on Oval Office Household card and modal, Economy `Your Household` view and custom builder (0 serious/critical violations) |
| `tests/household-viewport.spec.ts` | HOU-01, HOU-02 | Zero document-level scroll overflow at 1376×768 and 1280×720 viewports across Oval Office and Economy screens |

---

## 2. Purity & Invariants

1. **Zero Bare Literals**: Every household coefficient in `coefficients.ts` or `units.ts`; verified by `src/engine/coefficients.test.ts`.
2. **Zero `Math.*` in Engine**: All arithmetic uses `detmath.ts` (`clamp`, `round`, `abs`, `sqrt`).
3. **Determinism**: Verified across Node, Chromium, Firefox, WebKit (`pnpm determinism`).
4. **Replay Invariance**: Baseline runs without household customization maintain identical hashes.
5. **Party Blindness**: Zero civic party references in `src/engine/household.ts`.
