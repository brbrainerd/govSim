---
phase: "1"
slug: "engine-foundations"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-09"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 5.0.3 (+ `scripts/determinism.mjs` via Playwright 1.64.0 for cross-browser) |
| **Config file** | none beyond `vite.config.ts` |
| **Quick run command** | `pnpm exec vitest run src/engine` |
| **Full suite command** | `pnpm test && pnpm check && pnpm build` |
| **Estimated runtime** | ~15 seconds (quick), ~40 seconds (full); `pnpm determinism` ~60 s with browsers |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec vitest run src/engine` (plus the characterization table during P04–P06)
- **After every plan wave:** Run `pnpm test && pnpm check && pnpm build`
- **Before `/gsd-verify-work`:** Full suite green, `pnpm determinism` green, `node scripts/notices.mjs --check` clean
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-xx | 01 | 1 | FND-01 | — | Keyed draws are stateless; luck independent of decisions | unit | `pnpm exec vitest run src/engine/rng.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-xx | 01 | 1 | FND-02 | T-1-04 | No `Math.random`/`Date`/transcendental `Math` in engine | unit | `pnpm exec vitest run src/engine/purity.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-xx | 01 | 1 | FND-02 | — | Recorded input log replays to same hash chain | unit | `pnpm exec vitest run src/engine/determinism.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-xx | 01 | 1 | FND-02 | — | Node == Chromium == Firefox == WebKit (min + unmin) | e2e script | `pnpm determinism` | ❌ W0 | ⬜ pending |
| 1-02-xx | 02 | 1 | FND-03 | — | "Year N · Season" labels; Fall at 8/16/24/32 | unit | `pnpm exec vitest run src/engine/calendar.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-xx | 02 | 1 | FND-08 | — | Engine party-blind; D vs R histories equal | unit | `pnpm exec vitest run src/engine/party.test.ts src/app/session.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-xx | 03 | 1 | FND-07 | — | Every coefficient has citation/judgement + range | unit | `pnpm exec vitest run src/engine/coefficients.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-xx | 04 | 2 | FND-05 | T-1-01, T-1-02 | Engine recomputes cost from raw bill; tampered bills rejected | unit | `pnpm exec vitest run src/engine/decisions.test.ts` | ❌ W0 | ⬜ pending |
| 1-05-xx | 05 | 3 | FND-04 | T-1-03 | Every delta = sum of named terms incl. residuals; luck log shared | unit | `pnpm exec vitest run src/engine/trace.test.ts src/engine/shocks.test.ts` | ❌ W0 | ⬜ pending |
| 1-05-xx | 05 | 3 | FND-07 | — | No unregistered numeric literal in `step()` | unit | `pnpm exec vitest run src/engine/coefficients.test.ts` | ❌ W0 | ⬜ pending |
| 1-06-xx | 06 | 4 | FND-06 | — | Legacy ignores events/EO modifiers; delayed modifiers arrive on time | unit | `pnpm exec vitest run src/engine/modifiers.test.ts src/engine/legacy.test.ts` | ❌ W0 | ⬜ pending |
| 1-07-xx | 07 | 5 | all | — | Balance harness, full suite, determinism sign-off | unit + e2e | `pnpm test && pnpm check && pnpm build && pnpm determinism` | ✅ (balance) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky* — task IDs are finalised by the planner.

---

## Wave 0 Requirements

- [ ] `src/testing/scan.ts` — AST scan helper (self-tested), used by purity and literal-scan tests
- [ ] New test files listed above
- [ ] `@playwright/test@1.64.0` exact-pinned dev dep + browsers (behind a human-verify checkpoint; fallback 1.63.0)
- [ ] `src/engine/characterization.test.ts` — tolerance table captured at end of P01, guards P04–P06, deleted in P07

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| License visible on GitHub | REL-01 | GitHub reads the default branch; needs a user push/merge | Push `game-pivot`, merge to `master`; repo page shows "MIT license" |
| Coefficient citations resolve | FND-07 | URLs/snippets need a human skim | Open each `basis` URL in `coefficients.ts`; downgrade to `judgement` if it does not support the value |
| New Game party pick + calendar tooltip | FND-03, FND-08 | Visual/UX check | `pnpm dev`, pick a party, Next turn ×8 → "Year 2 · Fall", hover shows real quarter |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
