# Phase 3 Plan 02 Summary: Trace Attribution Engine & Copy Dictionary (RPT-01, GR-06, GR-07, OBS-05)

**Executed:** 2026-10-12  
**Requirements Addressed:** RPT-01, OBS-05  
**Guardrails Satisfied:** GR-06, GR-07, OBS-05  

---

## 1. What was built

1. **Plain-Language Copy Dictionary (`src/content/text/why.ts`):**
   - Created `WHY_COPY: Record<string, string>` mapping every engine trace source id to concise, plain-language descriptions (grade <= 9, <= 20 words, nonpartisan, no real politicians).
   - Exported `whyText(sourceId)` with dynamic resolution for open prefixes (`event:`, `eo:`, `law:`) and fallback to `"Several small factors"`.
   - Exported `formatLuckText(luck)` summarizing exogenous quarterly shocks.
2. **Trace Attribution Extractor (`src/app/attribution.ts`):**
   - `attributeTerms(terms, delta)`: filters negligible residuals (< 1e-9), identifies dominant term (>= 35% of total movement magnitude), and assigns directional arrows/words (`up`, `down`, `flat`).
   - `extractTurnAttributions(current, previous)`: extracts all 8 core prosperity indicators + approval + clout with values, units, formatted deltas, direction, and causal attributions.
3. **Drift & Readability Test Suite (`src/content/text/why.test.ts`, `src/app/attribution.test.ts`):**
   - Drift guard testing 100% coverage across all keys in `SOURCES` from `src/engine/trace.ts` as well as all active terms emitted during simulation runs.
   - Readability and content gate testing Flesch-Kincaid grade <= 9.0 and sentence word length <= 20 across all strings.
   - Purity verification ensuring engine remains arithmetic-only.

---

## 2. Verification Evidence

- `pnpm exec vitest run src/content/text/why.test.ts src/app/attribution.test.ts`: 9/9 tests passed.
- `pnpm guard && pnpm check && pnpm test && pnpm determinism`: 24 test files passed, 144 tests passed, 8/8 determinism passed, 0 errors, 0 warnings.
- `pnpm test:e2e`: 5/5 Playwright tests passed.
