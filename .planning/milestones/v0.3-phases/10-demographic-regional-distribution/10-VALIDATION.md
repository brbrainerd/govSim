---
phase: "10"
slug: "demographic-regional-distribution"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-12"
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.0.3 + Playwright 1.64.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm exec vitest run src/engine/voters.test.ts src/data/electoral.test.ts` |
| **Full suite command** | `pnpm guard && pnpm check && pnpm test && pnpm determinism` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm guard && pnpm exec vitest run <relevant-test-file>`
- **After every plan wave:** Run `pnpm guard && pnpm check && pnpm test && pnpm determinism`
- **Before `/gsd-verify-work`:** Full suite must be green + `pnpm test:e2e`
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SOC-05 | — | Sourced state demographics | unit | `pnpm exec vitest run src/data/electoral.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | SOC-05 | — | Registered voter sensitivity coefficients | unit | `pnpm exec vitest run src/engine/coefficients.test.ts` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 2 | SOC-05 | — | State social policy transmission & RPP relief | unit | `pnpm exec vitest run src/engine/voters.test.ts` | ✅ | ⬜ pending |
| 10-02-02 | 02 | 2 | SOC-05 | — | Replay determinism & party balance fairness | unit / mc | `pnpm exec vitest run src/engine/voters.test.ts` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 3 | SOC-05 | — | Demographic cohorts evaluation | unit | `pnpm exec vitest run src/engine/cohorts.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-02 | 03 | 3 | SOC-05 | — | Regional midterm delegation shift & seat conservation | unit | `pnpm exec vitest run src/engine/congress.test.ts` | ✅ | ⬜ pending |
| 10-04-01 | 04 | 4 | SOC-05 | — | Voters screen UI & Coalitions view | unit / a11y | `pnpm exec vitest run src/screens/Voters.test.ts` | ✅ | ⬜ pending |
| 10-04-02 | 04 | 4 | SOC-05 | — | Complete gate suite & E2E verification | e2e / system | `pnpm guard && pnpm check && pnpm test && pnpm test:e2e` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/data/electoral.test.ts` — test verifying all 56 electoral units have complete demographic exposure fields
- [ ] `src/engine/cohorts.test.ts` — test validating demographic cohort support derivations

---

## Manual-Only Verifications

None — all behaviors are audited via automated unit tests and Playwright headless runs.
