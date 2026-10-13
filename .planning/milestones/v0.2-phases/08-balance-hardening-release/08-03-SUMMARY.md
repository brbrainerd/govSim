# Plan 08-03 Summary: About / Privacy / Credits & Zero-Egress Problem Report (REL-02, REL-04)

**Status:** Completed
**Commit:** `717f158`

## Overview
Plan 08-03 established public-facing transparency, nonpartisan attribution, and diagnostic trust surfaces for govSim: `PRIVACY.md`, the About / Privacy / Credits modal (`REL-02`), and the zero-egress "Report a Problem" diagnostic bundle (`REL-04`).

## Accomplishments
1. **PRIVACY.md Policy Documentation (`REL-02`)**:
   - Created root `PRIVACY.md` declaring govSim's zero telemetry, zero cookie, and zero tracking policy.
   - Clarified that all game saves and inputs remain strictly client-side in `localStorage`.
   - Disclosed operational server logs: Hetzner / Coolify web proxy logs and Cloudflare R2 static asset delivery metrics.
   - Confirmed full protection for minors (14+) and COPPA / UK Children's Code compliance by design.
2. **About / Privacy / Credits Modal (`REL-02`)**:
   - Created `src/ui/AboutModal.svelte` accessible modal displaying:
     - Nonpartisan institutional simulation philosophy.
     - Economic calibration data sources: CBO, BEA, BLS, and the Federal Reserve System.
     - Prominent `"ZERO TELEMETRY · ZERO TRACKING"` badge and privacy notice.
     - License credits: Atkinson Hyperlegible & Rokkitt (SIL Open Font License 1.1), CC BY 4.0 content, MIT code.
     - Links: View Source on GitHub, Report a Problem, and Close.
   - Added `"About & Privacy"` navigation item with Lucide Info icon in `src/ui/Rail.svelte` and wired in `src/screens/Game.svelte`.
   - Added unit test in `src/ui/AboutModal.test.ts`.
3. **Transparent Problem Report Bundle (`REL-04`, `OBS-04`)**:
   - Created `src/ui/ProblemReportModal.svelte` presenting a reviewable on-screen `<pre>` diagnostic bundle containing:
     - Client metadata (user agent, viewport dimensions).
     - Game version (`0.2.0`), current turn, screen, state checksum.
     - Deterministic run replay code generated via `encodeRunCode`.
   - Actions: `"COPY DIAGNOSTIC BUNDLE"` with visual copied toast, link to GitHub issues, and Close.
   - Verified zero network requests (`fetchSpy.not.toHaveBeenCalled()`) in `src/ui/ProblemReportModal.test.ts`.

## Verification
- `pnpm test`: 245/245 tests passing across 42 test files.
- `pnpm check`: 0 errors, 0 warnings.
- `pnpm guard`: guard ok.
