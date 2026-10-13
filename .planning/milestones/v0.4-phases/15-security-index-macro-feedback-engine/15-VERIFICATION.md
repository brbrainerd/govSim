---
phase: 15-security-index-macro-feedback-engine
verified: 2026-10-13T05:48:00.000Z
status: passed
score: 3/3 requirements verified
covered_requirements:
  - SEC-01
  - SEC-02
  - SEC-03
---

# Phase 15 Verification: Security Index & Macro Feedback Engine

## Requirement Traceability

### SEC-01: Pure engine calculates a 0–100 Security Index based on defense readiness, alliance strength, and crisis containment
- **Status:** PASS
- **Implementation:** `src/engine/security.ts` (`calculateSecurityBreakdown`, `calculateSecurityIndex`), `src/engine/coefficients.ts`.
- **Evidence:** `src/engine/security.test.ts` (6 unit tests passing); accounts for baseline (50), defense surge (+5) / peacetime (-5), foreign assistance deviation, active geopolitical crisis penalties (-12/ea), sanctions deterrence (+2.5/ea), and domestic crime.

### SEC-02: Security Index drives the 10% Security weight in the Prosperity Index with causal trace explanations in report cards
- **Status:** PASS
- **Implementation:** `src/engine/score.ts` (`prosperity`), `src/app/attribution.ts` (`attributeSecurity`).
- **Evidence:** `src/engine/score.test.ts`, `tests/security-index.spec.ts` (Playwright E2E passing at 1376×768 and 1280×720 showing "National Security" and "Defense readiness posture change" causal mover).

### SEC-03: Geopolitical supply disruptions feed into energy/import deflators and Phillips-curve inflation via registered coefficients
- **Status:** PASS
- **Implementation:** `src/engine/game.ts` (quarterly crisis step feeding into `g` and `inf` ledgers via `geopolitical:energy`, `geopolitical:shipping`, `geopolitical:supply`), `src/engine/trace.ts` (`SOURCE_PREFIXES`), `src/content/text/why.ts`.
- **Evidence:** `src/engine/invariants.property.test.ts` (1000 randomized games passing), `src/engine/trace.test.ts` (conservation passing), reading grade <= 9.0 test passing.

## Test & Audit Summary
- **Unit & Invariant Tests:** 57/57 test files, 353/353 tests passing.
- **Determinism:** Determinism replay suites pass with 0 drift.
- **E2E & Accessibility:** 2/2 Playwright tests passing with 0 serious/critical axe violations.
- **Screenshots:** Generated at 1376×768 and 1280×720 with zero layout or contrast issues.
