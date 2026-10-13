# Plan 20-03 Summary: Satirical Heist & Downfall End Screen

## What Was Done
1. **EndScreen Header & Status Bar Branching (`src/screens/EndScreen.svelte`)**:
   - Branched top bar when `session.isEvilMode`:
     - Displays "KLEPTOCRATIC HEIST REVIEW" and term outcome badge (`Term Terminated (Convicted)` vs `{yearsCompleted} Years Completed`).
     - Replaced approval/clout pills with live Offshore Stash (`data-testid="end-offshore-stash"`), Final Heat (`data-testid="end-heat-meter"`), and Heist Outcome badge.
2. **Main Plunder Score Card & Extraction Ledger**:
   - Replaced standard net prosperity score card with **Offshore Loot Siphoned / Asset Forfeiture Card** (`data-testid="evil-score-card"`).
   - Added dedicated **Extraction Ledger** tab (`data-testid="tab-extraction"`, `data-testid="extraction-ledger-panel"`):
     - Derives all enacted corrupt levers from `session.inputs`.
     - Catalogs corrupt powers used, execution counts, siphoned loot ($B), and net heat generated.
3. **Kleptocrat Assessment & Post-Presidency Epilogue**:
   - In Zone 4, rendered the satirical **Kleptocracy Assessment Card**:
     - Distinctive Heist Tier badge (`data-testid="verdict-tier"`) displaying one of the 6 kleptocratic tiers (`Disgraced Convict`, `Ousted Grifter`, `Petty Grifter`, `Gilded Oligarch`, `Sovereign Plunderer`, `Transnational Kleptocrat`).
     - Post-presidency epilogue block (`data-testid="kleptocrat-epilogue"`) chronicling exile villas, megayachts, or federal penitentiary memoirs.
4. **Unit Tests (`src/screens/EndScreen.test.ts`)**:
   - Added test cases verifying the unconvicted Sovereign Plunderer heist screen and the convicted Disgraced Convict downfall screen.

## Verification Gates
- `npm run guard`: Passed.
- `npm run check`: 0 errors, 0 warnings.
- `pnpm test src/screens/EndScreen.test.ts`: 8/8 passing.
