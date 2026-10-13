---
status: passed
phase: 19-institutional-backlash-impeachment-trial
covered_requirements:
  - IMPEACH-01
  - IMPEACH-02
  - IMPEACH-03
---

# Phase 19 Verification: Institutional Backlash & Impeachment Trial

## Verification Results

### 1. Requirements Coverage
- **IMPEACH-01 (Special Counsel & Subpoena Clout Drain)**:
  - Thresholds and coefficients defined: `HEAT_SPECIAL_COUNSEL_THRESHOLD = 60`, `specialCounselCloutDrain = 15`, `subpoenaCloutDrain = 10` in `src/engine/units.ts` and `src/engine/coefficients.ts`.
  - Registered causal trace `'clout:special_counsel'` in `src/engine/trace.ts` and `src/content/text/why.ts` with plain-language why-copy passing Flesch-Kincaid grade 8.38 <= 9.0.
  - Active subpoena banner surfaced in `StatusBar.svelte` with live clout penalty warning and testid `status-special-counsel`.
- **IMPEACH-02 (House Impeachment Vote)**:
  - Pure arithmetic model `calculateHouseImpeachmentVote` in `src/engine/evil.ts`:
    - Baseline opposition seats `HOUSE_OPPOSITION_BASE_SEATS = 213` adjusted by `- houseSeatDelta`.
    - Heat defectors above 80 (`impeachmentHouseHeatSlope = 1.2`) and public disapproval defectors below 45% (`impeachmentHouseApprovalSlope = 0.8`).
    - Clamped strictly between 0 and 435 (`HOUSE_TOTAL_SEATS`), passing at `>= 218` (`HOUSE_IMPEACHMENT_THRESHOLD`).
- **IMPEACH-03 (Senate Conviction Trial & Stash Forfeiture)**:
  - Pure arithmetic model `calculateSenateTrialVote` in `src/engine/evil.ts`:
    - Baseline opposition senators `SENATE_BASE_SEATS = 50` adjusted by `- senateSeatDelta`.
    - Crossover defectors driven by critical heat above 85 (`convictionSenateHeatSlope = 1.0`) and disapproval below 45% (`convictionSenateApprovalSlope = 0.6`).
    - Supermajority conviction threshold `>= 67` (`SENATE_CONVICTION_THRESHOLD`).
  - Stash forfeiture: when convicted, `offshoreStashBn` is immediately wiped to `$0.0B`, `termEnded = true`, and presidential powers stripped.
  - Interactive `ImpeachmentModal.svelte` presents House and Senate vote tallies, progress tracks, and satirical fallout callouts for acquittal and conviction.

### 2. Automated Testing & Verification
- Unit, Determinism & Typecheck:
  - `src/engine/evil.test.ts`: 32/32 tests passing.
  - `src/ui/ImpeachmentModal.test.ts`: 2/2 tests passing.
  - `src/engine/party.test.ts`: 2/2 tests passing (0 mentions of forbidden party words in engine).
  - `src/engine/coefficients.test.ts`: 11/11 tests passing (zero bare literals outside exempt files).
  - Total Vitest: 63 test files passing (407 tests).
  - Pre-commit guards: clean (`guard ok`).
  - Svelte check: 0 errors, 0 warnings.
  - Determinism suite: 8/8 OK bit-for-bit across Node, Chromium, Firefox, WebKit.
- E2E & Layout Verification:
  - `tests/impeachment.spec.ts`: 3/3 Playwright tests passing.
  - Multi-viewport audits across `1376x768` and `1280x720` with zero outer viewport scroll overflow (`scrollHeight <= windowHeight + 1`).
  - Axe accessibility audits on Impeachment modal with 0 serious/critical violations.
  - Responsive screenshots captured in `.planning/phases/19-institutional-backlash-impeachment-trial/screenshots/`.
