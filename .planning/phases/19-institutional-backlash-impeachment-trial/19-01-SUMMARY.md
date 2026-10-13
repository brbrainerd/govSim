# Plan 19-01 Summary: Thresholds Alignment & Special Counsel Clout Drain

## Summary
- Aligned crisis thresholds in `src/engine/units.ts`:
  - `HEAT_SPECIAL_COUNSEL_THRESHOLD = 60`
  - `HEAT_IMPEACHMENT_THRESHOLD = 80`
  - `HEAT_CONVICTION_THRESHOLD = 90`
  - Added `SENATE_CONVICTION_THRESHOLD = 67` (Article I, Section 3 two-thirds supermajority)
  - Added `HOUSE_IMPEACHMENT_THRESHOLD = 218` (Article I, Section 2 simple majority)
- Added coefficients in `src/engine/coefficients.ts` (`COEFF`):
  - `specialCounselCloutDrain: 15` (quarterly clout drain during special counsel probe)
  - `subpoenaCloutDrain: 10` (quarterly clout spent on subpoena compliance and defense)
- Registered `'clout:special_counsel'` trace source in `src/engine/trace.ts` and added Flesch-Kincaid validated description in `src/content/text/why.ts` (grade 8.38 <= 9.0).
- Integrated ongoing quarterly Special Counsel clout drain in `step()` in `src/engine/game.ts`.
- Verified determinism, why copy, unit tests, and guards:
  - 14/14 determinism golden replays pass without drift.
  - `why.test.ts` and `evil.test.ts` pass cleanly.
  - Zero svelte-check diagnostics.
