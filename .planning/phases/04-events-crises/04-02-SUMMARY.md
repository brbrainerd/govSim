# Phase 4 Plan 02 Summary: Crisis Decisions, Clout Costs, Autopilot Choices & Calibration

**Plan:** `04-02`  
**Requirements Delivered:** EVT-02, EVT-03  
**Guardrails Verified:** GR-09, GR-10, GR-12, GR-38  

---

## 1. What Was Built

1. **Decisions Interface & Clout Resolution (`src/engine/decisions.ts`):**
   - Extended `Decisions` with `crisis?: CrisisDecision` (`{ crisisId: string; optionId: string }`).
   - Implemented pure function `resolveCrisisChoice(clout, crisisId, optionId, turn)`:
     - Validates affordability (`opt.cloutCost <= clout`).
     - Constructs immediate modifiers for indicator impacts across channels (`approval`, `inflation`, `debtBn`, `trust`, `potential`, `gap`).
     - Prepares scheduled items for delayed resolvers.
     - Never throws; malformed inputs produce rejected outcomes.
   - Exported pure helper `autopilotDecisions(state)` selecting the default `autopilot: true` option.

2. **Engine Step Integration (`src/engine/game.ts`):**
   - In `step()`: resolves crisis choice drafts at turn boundaries (GR-38).
   - Injects active crisis modifiers into the macro step before ledger summation.
   - Deducts clout costs via `clout:crisis` term in trace ledger, preserving exact conservation.
   - Registered resolver for `disaster_rally` in `src/engine/modifiers.ts`.
   - Added user-facing plain explanation for `clout:crisis` in `src/content/text/why.ts`.

3. **Session Draft State (`src/app/session.svelte.ts`):**
   - Extended `Draft` with `crisisChoice: CrisisDecision | null`.
   - Added reactive `crisisCost` derived from the selected crisis choice.
   - Added method `selectCrisisOption(crisisId, optionId)` validating against starting clout.
   - In `nextTurn()`: snapshots `draft.crisisChoice` into decisions payload, and steps autopilot with its default choice.

4. **Verification & Balance Calibration (`src/engine/crises.test.ts`, `src/engine/balance.test.ts`):**
   - GR-09 Non-Domination: Verified that across all 15 catalog archetypes, no option Pareto-dominates another across clout and indicator channels.
   - GR-10 & GR-12 Calibration: Verified across 100 seeds with active crises that sensible play beats autopilot by `[+2.0, +10.0]` index points, achieves >= 75% win rate against autopilot, and beats degenerate strategies in the mean.

---

## 2. Gates Passed

- `pnpm guard`: OK
- `pnpm check`: 0 errors, 0 warnings
- `pnpm test`: 26 files passed, 153 tests passed
- `pnpm determinism`: 8/8 OK across Node, Chromium, Firefox, WebKit
