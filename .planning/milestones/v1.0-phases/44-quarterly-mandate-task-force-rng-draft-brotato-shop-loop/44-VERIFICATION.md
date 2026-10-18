---
phase: 44-quarterly-mandate-task-force-rng-draft-brotato-shop-loop
status: passed
verified: 2026-10-18
requirements: [PERK-01, PERK-02, PERK-03]
---

# Phase 44 Verification: Quarterly Mandate & Task Force RNG Draft

## Verification Results

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **PERK-01**: Pure deterministic Mandate & Task Force RNG engine (`stream 21`) | PASSED | `src/engine/perks.ts` rolls deterministic 3-card slates across Tiers I–IV using stream `21` (`'perks'`), supports escalating Clout rerolls (`6/10/14`) and card locking (`lockedPerkId`), and records causal trace terms (`perk:<id>`, `clout:perks`). |
| **PERK-02**: Interactive Task Force Draft UI (`PerkDraftModal.svelte`) | PASSED | `src/ui/PerkDraftModal.svelte` renders the 3-card slate with `TradeoffPill`, Doctrine tag pills, lock/reroll/skip controls, and `"Classic Sim (No Perks)"` toggle on `NewGame.svelte`. |
| **PERK-03**: Curated 24-card Mandate & Task Force catalog | PASSED | `src/content/perks.ts` defines 24 nonpartisan standard cards across 6 Policy Doctrine families and 4 rarity tiers (plus 9 Evil Mode Heist Relics), verified at Flesch-Kincaid reading grade $\le 9.0$ in `src/engine/perks.test.ts`. |

## Automated Gate Output
- `pnpm test`: 85/85 test files passed (including `src/engine/perks.test.ts` and `src/ui/PerkDraftModal.test.ts`).
- `pnpm guard`: Passed (`coefficients.test.ts`, `purity.test.ts`, `hash.test.ts`, `why.test.ts`).
- `pnpm check`: 0 TypeScript / Svelte errors.
