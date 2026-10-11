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
| 1-01-01 | 01 | 1 | FND-01 | — | Keyed draws; luck log identical for autopilot, no-decision and 3 strategies over 200 seeds | unit | `pnpm exec vitest run src/engine/shocks.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | FND-02 | T-1-04 | No banned `Math`/`**`/`Date`/globals in engine (self-tested scanner); RNG known answers + stats | unit | `pnpm exec vitest run src/engine/purity.test.ts src/engine/rng.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | FND-02 | T-1-05 | Recorded input log replays to same hash chain after JSON round trip; characterization snapshot | unit | `pnpm exec vitest run src/engine/determinism.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | FND-08 | — | New Game requires a party; Session stores it in options only | build + manual | `pnpm check && pnpm build && pnpm exec vitest run` | ✅ | ⬜ pending |
| 1-02-02 | 02 | 1 | FND-08 | T-1-07 | Engine party-blind; D vs R histories equal | unit | `pnpm exec vitest run src/engine/party.test.ts src/app/session.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 1 | FND-03 | — | "Year N · Season" labels; Fall at 8/16/24/32; real-quarter tooltip text | unit | `pnpm exec vitest run src/engine/calendar.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-01..03 | 03 | 1 | FND-07 | T-1-09, T-1-10 | Every coefficient has citation/judgement + range; validator self-test; levers + RULES | unit | `pnpm exec vitest run src/engine/coefficients.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-02 | 04 | 2 | FND-02 | T-1-SC | Node == Chromium == Firefox == WebKit (min + unmin) | e2e script | `timeout 300s pnpm determinism` | ❌ W0 | ⬜ pending |
| 1-04-03 | 04 | 2 | REL-01 | — | License set present; notices production-only | script | `node scripts/notices.mjs --check` | ✅ | ⬜ pending |
| 1-05-01..02 | 05 | 2 | FND-05 | T-1-01, T-1-02 | Engine recomputes cost from raw bill; preview == charge; tampered bills rejected | unit | `pnpm exec vitest run src/engine/decisions.test.ts src/app/session.test.ts` | ❌ W0 | ⬜ pending |
| 1-06-01..02 | 06 | 3 | FND-04, FND-01 | T-1-03 | Every delta = sum of named terms incl. luck and bounded residuals; legacy path too | unit | `pnpm exec vitest run src/engine/trace.test.ts` | ❌ W0 | ⬜ pending |
| 1-06-03 | 06 | 3 | FND-07 | T-1-12 | No unregistered numeric literal in engine (AST literal scan) | unit | `pnpm exec vitest run src/engine/coefficients.test.ts` | ❌ W0 | ⬜ pending |
| 1-07-01..02 | 07 | 4 | FND-06, FND-01 | T-1-13 | Legacy drops EO modifiers and resolvers, keeps events and shocks; delayed modifiers arrive on time | unit | `pnpm exec vitest run src/engine/modifiers.test.ts src/engine/legacy.test.ts` | ❌ W0 | ⬜ pending |
| 1-07-03 | 07 | 4 | all | — | Full suite + cross-browser sign-off of every input type | unit + e2e | `pnpm test && pnpm check && pnpm build && pnpm determinism && node scripts/notices.mjs --check` | ✅ (balance) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky* — task IDs are finalised by the planner.

---

## Wave 0 Requirements

- [ ] `src/testing/scan.ts` — AST scan helper (self-tested), used by purity and literal-scan tests
- [ ] New test files listed above
- [ ] `@playwright/test@1.64.0` exact-pinned dev dep + browsers (behind a human-verify checkpoint; fallback 1.63.0)
- [ ] Characterization block in `src/engine/determinism.test.ts` — 6-significant-digit inline snapshot captured in plan 01-01, guards plans 01-05 to 01-07, kept until Phase 2 golden replays (OBS-02) replace it

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
