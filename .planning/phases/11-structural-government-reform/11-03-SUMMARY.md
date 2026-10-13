# Phase 11 Plan 03: Article V Amendments & State Ratification Summary

## Status: COMPLETE

## Requirements Addressed
- **REF-04**: Constitutional Amendment Mechanism (2/3 House = 290, 2/3 Senate = 67, 3/4 state legislatures = 38 of 50 states).

## Work Completed
1. **State Legislature Dataset (`data/electoral-2024.json` & `src/data/electoral.ts`)**:
   - Added state legislature partisan composition for all 50 states (28 R, 20 D, 2 split).
   - Exported `STATE_LEGISLATURES` and `getStateLegislature(stateCode: string)` with typed chamber control.
   - Tested in `src/data/electoral.test.ts` (100% pass).
   - Strictly isolated partisan data to `src/data/` to keep `src/engine/` completely party-blind.

2. **Units & Article V Supermajorities (`src/engine/units.ts`)**:
   - `AMENDMENT_HOUSE_THRESHOLD = 290` (2/3 of 435).
   - `AMENDMENT_SENATE_THRESHOLD = 67` (2/3 of 100).
   - `AMENDMENT_STATES_TO_RATIFY = 38` (3/4 of 50).
   - `AMENDMENT_TOTAL_STATES = 50`.
   - `AMENDMENT_EXPIRY_TURNS = 28` (7 years).
   - `AMENDMENT_DIVIDED_APPROVAL_MIN = 55`, `AMENDMENT_OPPOSED_APPROVAL_MIN = 65`.
   - `AMENDMENT_ALIGNED_RATIFY_BASE_CHANCE = 0.60`, `AMENDMENT_DIVIDED_RATIFY_BASE_CHANCE = 0.25`, `AMENDMENT_OPPOSED_RATIFY_BASE_CHANCE = 0.08`.
   - Appeal and crossover parameters for the 4 candidate amendments.

3. **Coefficients Registered (`src/engine/coefficients.ts`)**:
   - `amendmentProposalCloutCost` (50 clout).
   - `amendmentCampaignCloutCost` (15 clout per turn).
   - Permanent ratified benefits: `amendmentJudicialTrustGain`, `amendmentCampaignFinanceTrustGain`, `amendmentEraGrowthBonus`, `amendmentEraGiniReduction`, `amendmentEraTrustGain`, `amendmentBalancedBudgetBondYieldReduction`.

4. **Amendments Engine (`src/engine/amendments.ts`)**:
   - Created `AMENDMENTS_CATALOG` with metadata and civics descriptions for 4 candidate amendments:
     - `amendment_judicial_terms` (Supreme Court 18-year term limits)
     - `amendment_campaign_finance` (Overturning Citizens United / curbing mega-donor money)
     - `amendment_equal_rights` (Equal Rights Amendment)
     - `amendment_balanced_budget` (Fiscal Responsibility & Balanced Budget Amendment)
   - Implemented `calculateAmendmentProposalVotes` and `checkAmendmentCongressionalProposal` enforcing dual 2/3 supermajorities.
   - Implemented `tickAmendmentRatification` advancing turn-by-turn state legislature ratifications drawing strictly from the isolated `'reform'` stream using counter-based RNG (`draw(seed, 'reform', turn, stateCode)`).
   - Maintained strict party blindness (0 matches for forbidden terms) and zero bare numeric literals.

5. **Game State Integration (`src/engine/game.ts` & `src/engine/decisions.ts`)**:
   - Added `amendmentProposal`, `amendmentCampaign`, and `presidentialSide` to `Decisions`.
   - Added `activeAmendment` and `ratifiedAmendments` to `GameState`.
   - Maintained bit-identical backward compatibility by keeping amendment keys undefined for baseline games.
   - Wired clout economy, trust rewards, and event logging for proposals, campaigns, and ratifications.

6. **Automated Verification**:
   - Created comprehensive unit tests in `src/engine/amendments.test.ts` (9 tests covering catalog, 2/3 hurdles, state alignment, turn-by-turn ratification, campaigning, 38-state completion, 28-turn expiration, and step integration).
   - Full test suite: 48 test files (312 tests) passing 100%.
   - Golden determinism replay tests passing 100% across all 8/8 runtimes.
   - `pnpm guard`, `pnpm check`, and `src/engine/party.test.ts` passing cleanly.

## Key Files Created/Modified
- `src/engine/amendments.ts` (Created)
- `src/engine/amendments.test.ts` (Created)
- `data/electoral-2024.json` (Modified)
- `src/data/electoral.ts` (Modified)
- `src/data/electoral.test.ts` (Modified)
- `src/engine/units.ts` (Modified)
- `src/engine/coefficients.ts` (Modified)
- `src/engine/decisions.ts` (Modified)
- `src/engine/game.ts` (Modified)
