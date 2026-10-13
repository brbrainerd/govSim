# Plan 18-02 Summary: Pure Evil Lever Resolution Engine & Trace Attribution

## Summary
- Extended `EvilDecision` in `src/engine/decisions.ts` with `enactedLevers?: readonly EvilLeverId[]`.
- Implemented `EvilLeversResult` and pure `resolveEvilLevers` function in `src/engine/evil.ts`:
  - Enforces clout affordability, deduplicates levers, and aggregates kickback stash ($B), heat changes, trust and approval penalties.
  - Generates detailed log entries for enacted and unaffordable levers.
- Integrated evil lever resolution into `step()` in `src/engine/game.ts`:
  - Clout deduction via `clout:evil_levers`.
  - Offshore stash accumulation and heat modification (+heat for siphoning, -heat for watchdog suppression).
  - Recorded trace terms in `approval:evil_levers` and `trust:evil_levers`.
  - Clout deducted prior to legislative deal purchases.
- Registered trace keys and Flesch-Kincaid validated plain-language descriptions (grade <= 9.0) in `src/engine/trace.ts` and `src/content/text/why.ts`.
- Verified determinism, invariants, why-copy, and engine unit tests:
  - 62 test files passing (393 tests).
  - All 7 golden hash replays match with zero drift.
  - Zero svelte-check diagnostics and clean pre-commit guards.
