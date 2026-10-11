---
phase: 01-engine-foundations
plan: 04
subsystem: tooling
tags: [determinism, playwright, cross-browser, release, fnd-02, rel-01]
status: complete

requires:
  - phase: 01-01
    provides: runFixture() in src/engine/replayFixture.ts (cross-browser bundle entry)
  - phase: 01-05
    provides: raw-input Decisions used by the fixture logs
provides:
  - pnpm determinism (Node vs Chromium/Firefox/WebKit, minified and unminified, 8 OK lines)
  - "@playwright/test 1.64.0 as exact-pinned dev dependency"
  - REL-01 verification record (license set and production-only notices)
affects: [phase-2-ci-e2e, phase-2-OBS-02]

plan_head_before: a83164f4f277541ce47ac22ae0778791ebaba2ea
actuals:
  tokens: 1200
  tasks: 3
  commits: 1

tech-stack:
  added: ["@playwright/test 1.64.0 (dev only)"]
  patterns:
    - "Browsers are compared with Node live, never with committed hashes (goldens are Phase 2 OBS-02)"

key-files:
  created:
    - scripts/determinism.mjs
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Task 1 package-legitimacy checkpoint: @playwright/test 1.64.0 APPROVED by the user on 2026-10-10 (exact pin, dev-only, --ignore-scripts); the 1.63.0 fallback was not needed"
  - "Browser launch/evaluate errors are caught, reported and exit 1, and browsers close in a finally block, so a crash cannot leak processes or look like a pass"

requirements-completed: [FND-02, REL-01]
---

# Phase 1 Plan 04: Cross-browser determinism and REL-01 verification Summary

`pnpm determinism` bundles the fixture entry with Vite (iife, unminified and minified), evaluates it in Node and in Chromium 156, Firefox 157 and WebKit 27.2, and gets identical hash chains from all 8 runs.

## Result

```
OK   node v26.10.0 (min=false)
OK   chromium 156.0.8078.4 (min=false)
OK   firefox 157.0 (min=false)
OK   webkit 27.2 (min=false)
OK   node v26.10.0 (min=true)
OK   chromium 156.0.8078.4 (min=true)
OK   firefox 157.0 (min=true)
OK   webkit 27.2 (min=true)
```

Exit 0 (checked twice). The minified bundle matches the unminified one (Pitfall 3 holds). The script exits 1 on any DIFF, any launch error, or fewer than 8 results.

## Tasks

| Task | Name | Outcome | Commit |
| ---- | ---- | ------- | ------ |
| 1 | Package legitimacy checkpoint | Approved by the user 2026-10-10, version 1.64.0 | n/a |
| 2 | Determinism script + install | Done | 5e1edab |
| 3 | REL-01 verification | Passed, nothing to commit | n/a |

## REL-01 verification (Task 3)

- `git merge-base --is-ancestor bb36df0 HEAD` exits 0.
- LICENSE starts with "MIT License"; LICENSE-ASSETS names Creative Commons Attribution 4.0; TRADEMARKS.md is non-empty; CONTRIBUTING.md has "Developer Certificate of Origin" and "Signed-off-by".
- `node scripts/notices.mjs --check` exits 0 after the Playwright install, so the dev-only package did not enter THIRD_PARTY_NOTICES.md; it was not regenerated.
- `git status --porcelain` on the license files and THIRD_PARTY_NOTICES.md is empty.
- `pnpm test && pnpm check && pnpm build` exits 0.

**Manual step for the user (D7):** GitHub only shows the license in the repo sidebar once these files are on the default branch `master`. The executor did not push. After you push `game-pivot` and merge it to master, confirm the sidebar shows "MIT license".

## Deviations from Plan

None. The plan executed as written. Playwright browsers were already cached, so `playwright install` was not run. The minimum-release-age fallback to 1.63.0 was not needed (pnpm accepted 1.64.0).

## Known Stubs

None.

## Threat Flags

None. T-1-SC mitigated (human gate, exact pin, `--ignore-scripts`, dev-only). T-1-11 accepted as planned.

## Self-Check: PASSED

scripts/determinism.mjs exists; commit 5e1edab exists; `"@playwright/test": "1.64.0"` is in devDependencies.
