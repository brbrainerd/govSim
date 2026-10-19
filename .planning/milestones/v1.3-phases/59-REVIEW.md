---
milestone: v1.3
phases: 56-59
reviewed: 2026-10-18T21:16:00Z
depth: deep
files_reviewed: 26
files_reviewed_list:
  - src/app/beat-baseline.ts
  - src/app/beat-baseline.test.ts
  - src/app/turn-triggers.ts
  - src/app/session.svelte.ts
  - src/app/session-pacing.test.ts
  - src/content/briefing.ts
  - src/design/tokens.ts
  - src/ui/art/CivicEmblem.svelte
  - src/ui/art/MiniChart.svelte
  - src/ui/art/USMap.svelte
  - src/ui/art/OvalOfficeScene.svelte
  - src/ui/art/ReporterScene.svelte
  - src/ui/Rail.svelte
  - src/ui/StatusBar.svelte
  - src/ui/TurnAgendaCard.svelte
  - src/ui/TurnReport.svelte
  - src/ui/CrisisModal.svelte
  - src/screens/Game.svelte
  - src/screens/OvalOffice.svelte
  - src/screens/Economy.svelte
  - src/screens/Voters.svelte
  - src/screens/Budget.svelte
  - src/screens/Congress.svelte
  - src/screens/Powers.svelte
  - scripts/cv-flywheel.ts
  - tests/cv-flywheel.spec.ts
findings:
  critical: 0
  warning: 0
  info: 0
  fixed: 11
status: passed
---

# Milestone v1.3 (Phases 56–59): Code Review Report (`--fix --all`)

**Reviewed:** 2026-10-18
**Depth:** Deep (5-dimension multi-axis review via `code-reviewer` subagent + automated fix verification)
**Files Reviewed:** 26
**Status:** Passed (`11/11` findings fixed across Critical, Warning, and Info)

## Summary

Milestone `v1.3` (`v1.0..HEAD`, Phases 56–59) was reviewed across all five engineering dimensions (Correctness, Readability, Architecture, Security, and Performance). All **2 Critical (`CR-01`..`CR-02`)**, **5 Warning (`WR-01`..`WR-05`)**, and **4 Info (`IN-01`..`IN-04`)** findings identified during the review were remediated and verified against `pnpm guard`, `pnpm check`, `pnpm test` (`540/540` passing), `pnpm determinism` (`8/8` OK), and Playwright E2E + CV Flywheel comparison sheets.

---

## Resolved Findings (`--fix --all`)

### Critical (`CR-NN`) — All Fixed

- **`CR-01` [FIXED] — `src/app/beat-baseline.ts` (`buildPreviewDecisions` & `previewDraftVsBaseline`)**:
  - **Issue:** (1) When a budget/social bill was sent to Congress (`hasBillQueued === true`) before whipping to 218 votes (`billCurrentlyPasses === false`), `buildPreviewDecisions(session, true)` used the unwhipped `session.bill` instead of computing the auto-whipped coalition, causing `deltaVsIdle.total` to drop to `0.0`. (2) `buildPreviewDecisions` omitted `draft.stagedEvilLevers`, `draft.dynamicCrisisDelta`, `draft.perkRerolls` / `draft.perkLockedId`, `draft.turnEntropy`, and `decisions.presidentialSide`.
  - **Fix:** Updated `buildPreviewDecisions(session, forcePassBill)` so `forcePassBill && (hasBillChanges || hasBillQueued) && !billCurrentlyPasses` computes `findCheapestCoalition` and evaluates the passed bill while `queuedDeltaVsIdle` evaluates the unwhipped bill; added `decisions.evil`, `decisions.dynamicCrisisDelta`, `decisions.perk` (`rerolls`, `lockedId`), `decisions.turnEntropy`, and `decisions.presidentialSide`. Added regression tests in `src/app/beat-baseline.test.ts`.

- **`CR-02` [FIXED] — `src/ui/StatusBar.svelte` (`staged-decisions-popover` & `staged-decisions-pill`)**:
  - **Issue:** `StatusBar.svelte` labeled any `bill-queued` item in `#staged-decisions-popover` as `CLEARS ✓` even when the bill had only been sent to Congress without a vote called, and conflated `budget-unsent` with other warnings.
  - **Fix:** Preserved the `PACE-01` contract on `staged-decisions-pill` (`1 staged (unsent)` before sending, `1 staged` once sent to Congress) while updating `.staged-status-tag` in `StatusBar.svelte` to display `IN CONGRESS` when a bill is sent to Congress without a vote called vs. `CLEARS ✓` once a passing vote is called.

### Warnings (`WR-NN`) — All Fixed

- **`WR-01` [FIXED] — Undefined color CSS variables (`--navy`, `--gold-tint`, `--gold-soft`, `--alert-light`, `--color-good-fg`)**:
  - **Fix:** Added `'gold-tint'` to `base` and `themes.evil` in `src/design/tokens.ts`; replaced `fill="var(--navy)"` with `fill="var(--ink)"` in `src/ui/StatusBar.svelte`; replaced `var(--gold-soft)` with `var(--gold-tint)` in `src/ui/TurnReport.svelte`; replaced `var(--alert-light)` with `var(--alert-tint)` in `src/screens/Voters.svelte`; and replaced `var(--color-good-fg)` with `var(--sage-dark)` in `src/screens/Congress.svelte`.

- **`WR-02` [FIXED] — Typography CSS variables (`--font-condensed`, `--text-xs`..`--text-2xl`)**:
  - **Fix:** Added `'font-condensed'` and `'text-xs'`..`'text-2xl'` to `src/design/tokens.ts` and normalized `var(--font-condensed)` to `var(--font-ui)` across `USMap.svelte`, `Voters.svelte`, `OvalOffice.svelte`, `Congress.svelte`, `Powers.svelte`, and `CrisisModal.svelte`.

- **`WR-03` [FIXED] — `src/ui/StatusBar.svelte` Popover Mutual Exclusion & ARIA Controls**:
  - **Fix:** Ensured opening `beat-baseline-coach` closes `staged-decisions-popover` (and vice versa), and added `id="beat-baseline-coach-popover"` / `id="staged-decisions-popover"` with `aria-controls` on their trigger buttons.

- **`WR-04` [FIXED] — `src/screens/Voters.svelte` Sortable Table Headers Keyboard Accessibility & `aria-sort`**:
  - **Fix:** Added `role="columnheader"`, `tabindex="0"`, `aria-sort={...}`, and `Enter`/`Space` `onkeydown` handlers to all 5 `<th class="sortable">` elements in `src/screens/Voters.svelte`.

- **`WR-05` [FIXED] — `src/ui/art/USMap.svelte` District Chips Keyboard Arrow Navigation**:
  - **Fix:** Added `data-map-code={chip.id}` and `handleKey` arrow-key navigation across all 56 electoral units (`stateCodes` + `DISTRICT_CHIPS`).

### Info (`IN-NN`) — All Fixed

- **`IN-01` [FIXED] — `src/ui/art/CivicEmblem.svelte` Missing `'👷'` and `'🏠'` Mappings**:
  - **Fix:** Added `k === '👷' || k === '🏠'` to the `'industrial'` branch in `src/ui/art/CivicEmblem.svelte`.

- **`IN-02` [FIXED] — `src/screens/Economy.svelte` `.secondary-btn` Cursor**:
  - **Fix:** Changed `cursor: default;` to `cursor: pointer;` on `.secondary-btn` in `src/screens/Economy.svelte`.

- **`IN-03` [FIXED] — `src/ui/art/ReporterScene.svelte` Self-Contained Calm Mode Rule**:
  - **Fix:** Added `:global([data-calm='true']) .spin-slow { animation: none !important; }` in `src/ui/art/ReporterScene.svelte`.

- **`IN-04` [FIXED] — `scripts/cv-flywheel.ts` Markdown Report Header**:
  - **Fix:** Updated `# Computer-Vision Before/After Flywheel Report (\`v1.3\`)` in `scripts/cv-flywheel.ts`.
