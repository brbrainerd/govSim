---
status: passed
phase: 18-corrupt-executive-levers-cronyism
covered_requirements:
  - LEVER-01
  - LEVER-02
  - LEVER-03
---

# Phase 18 Verification: Corrupt Executive Levers & Cronyism

## Verification Results

### 1. Requirements Coverage
- **LEVER-01 (No-Bid Procurement & Public Land Auctions)**:
  - Defined `crony_contracts` ($15B kickback, +14 heat, 15 clout, $30B budget impact) and `auction_public_lands` ($25B kickback, +22 heat, 20 clout) in `src/data/evil.ts` and `src/engine/coefficients.ts`.
  - Tested and verified direct siphoning into `offshoreStashBn` in `src/engine/evil.test.ts` and `tests/evil-levers.spec.ts`.
- **LEVER-02 (Tariff Exemptions & Library Slush Foundation)**:
  - Defined `sell_tariff_exemptions` ($10B kickback, +10 heat, 10 clout) and `solicit_library_donations` ($8B kickback, +8 heat, 8 clout) in `src/data/evil.ts` and `src/engine/coefficients.ts`.
  - Tested and verified pure deterministic resolution in `resolveEvilLevers` and `step()`.
- **LEVER-03 (Watchdog Purges & DOJ Subpoena Suppression)**:
  - Defined `fire_inspectors_general` (-20 heat suppressed, 25 clout, 6.0 trust cost) and `pressure_justice_department` (-30 heat suppressed, 35 clout, 9.0 trust cost) in `src/data/evil.ts` and `src/engine/coefficients.ts`.
  - Tested and verified active heat cooling and trust/approval penalties in `src/engine/evil.test.ts` and `tests/evil-levers.spec.ts`.

### 2. Automated Testing & Verification
- Unit & Determinism Tests:
  - `src/data/evil.test.ts`: 5/5 tests passing.
  - `src/engine/evil.test.ts`: 22/22 tests passing.
  - `src/screens/Powers.test.ts`: 4/4 tests passing.
  - `src/content/text/why.test.ts`: 5/5 tests passing (reading grade <= 9.0).
  - `src/engine/determinism.test.ts`: 14/14 tests passing with zero replay drift.
  - Total Vitest: 62 test files passing (395 tests).
- E2E & Layout Verification:
  - `tests/evil-levers.spec.ts`: 4/4 Playwright tests passing.
  - Tested across viewports `1376x768` and `1280x720` with 0 page scroll overflow (`scrollHeight <= windowHeight + 1`).
  - Automated Axe accessibility audits (`wcag2a`, `wcag2aa`) with 0 serious/critical violations.
  - Responsive screenshots captured in `.planning/phases/18-corrupt-executive-levers-cronyism/screenshots/`.
