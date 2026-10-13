# Phase 4 Plan 01 Summary: Crisis Catalog, Keyed Director & Engine State Integration

**Plan:** `04-01`  
**Requirements Delivered:** EVT-01, EVT-03  
**Guardrails Verified:** GR-01, GR-02, GR-08  

---

## 1. What Was Built

1. **Crisis Catalog (`src/engine/crises.ts`):**
   - Typed data structures: `CrisisType`, `CrisisOption`, `CrisisDefinition`, `CrisisEffect`.
   - 12 exogenous crisis archetypes (`hurricane`, `oil_shock`, `epidemic`, `scotus_vacancy`, `wildfire`, `flood`, `cyberattack`, `crop_blight`, `foreign_turmoil`, `grid_failure`, `heat_wave`, `supply_chain`).
   - 3 endogenous crisis archetypes (`debt_crisis`, `civil_unrest`, `market_panic`).
   - Options include plain descriptions, clout costs, and non-partisan civics framing.
   - Purity and party blindness verified: 0 numeric literals outside 0/1; no forbidden party words.

2. **Deterministic Crisis Director (`src/engine/director.ts`):**
   - Exogenous schedule generator `getExogenousSchedule(seed)` using keyed RNG draws on `STREAM.events` (`stream: 2`).
   - Pacing rules (GR-08) mathematically calibrated and verified:
     - Turns 1–2 have 0 crises.
     - First crisis guaranteed on turns 3, 4, or 5 across 100% of seeds.
     - Total crises per 16-turn term fall strictly in `[4, 9]` across 100% of seeds.
     - No 3 consecutive turns feature a crisis modal.
     - Each exogenous archetype appears in 50%–58% of terms across 500 seeds (strictly within `[10%, 60%]`).
   - Endogenous event triggers:
     - `debt_crisis` when `debt / gdp > C.debtStressThreshold` (1.25).
     - `civil_unrest` when `gini > C.unrestGiniThreshold` (0.495) or `approval < C.unrestApprovalThreshold` (28).
     - Gated by quiet turns and cooldown to prevent consecutive crisis overload.

3. **Engine State Integration (`src/engine/game.ts`):**
   - Added `readonly activeCrisis: ActiveCrisis | null` to `GameState`.
   - Initialized to `null` in `newGame()`.
   - Populated at each turn transition in `step()` via `scheduleTurnEvents`.

4. **Verification Suite (`src/engine/crises.test.ts`):**
   - GR-01 & GR-02: Verified across 200 random seeds that player with no decisions matches autopilot crisis schedule byte-for-byte.
   - GR-08: Verified pacing rules across 500 seeds (0 on turns 1-2, first on turn 3-5, no 3 consecutive, 4-9 total, 10%-60% per archetype).
   - Golden hashes updated in `src/engine/determinism.test.ts` for the newly attached `activeCrisis` field.

---

## 2. Gates Passed

- `pnpm guard`: OK
- `pnpm check`: 0 errors, 0 warnings
- `pnpm test`: 26 files passed, 151 tests passed
- `pnpm determinism`: 8/8 OK (Node, Chromium, Firefox, WebKit; min=false, min=true)
