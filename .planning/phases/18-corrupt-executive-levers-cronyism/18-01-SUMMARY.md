# Plan 18-01 Summary: Corrupt Executive Levers Catalog & Engine Coefficients

## Summary
- Defined `EVIL_LEVER_IDS` and `EvilLeverId` in `src/engine/units.ts`.
- Registered all corrupt executive lever coefficients in `src/engine/coefficients.ts` (`COEFF`):
  - No-bid contracts (`crony_contracts`): $15B kickback, +14 heat, 15 clout, 3.5 trust cost, 2.0 approval cost, $30B budget outlay.
  - Public lands auction (`auction_public_lands`): $25B kickback, +22 heat, 20 clout, 5.0 trust cost, 3.5 approval cost.
  - Tariff exemptions (`sell_tariff_exemptions`): $10B kickback, +10 heat, 10 clout, 2.5 trust cost, 1.5 approval cost.
  - Library foundation (`solicit_library_donations`): $8B kickback, +8 heat, 8 clout, 2.0 trust cost, 1.0 approval cost.
  - Fire inspectors general (`fire_inspectors_general`): -20 heat suppression, 25 clout, 6.0 trust cost, 4.0 approval cost.
  - Order DOJ to quash subpoenas (`pressure_justice_department`): -30 heat suppression, 35 clout, 9.0 trust cost, 5.5 approval cost.
- Created `src/data/evil.ts` providing the catalog, typed definitions, and lookup helpers.
- Added comprehensive unit tests in `src/data/evil.test.ts` (5 tests passing).
- Verified `npm run guard` and `npm run check` pass cleanly with zero diagnostics.
