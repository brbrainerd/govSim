# Plan 33-01 Summary: "Debunk vs. Spin" Gameplay Mechanics & EndScreen Civic Dossier

**Status:** Completed
**Requirements:** `SPIN-01`, `SPIN-02`

## Achievements
1. **Pure Engine Support & Determinism Integrity (`SPIN-01`)**:
   - `src/engine/coefficients.ts`: Registered `mythSpinApprovalBoost` (2.0%), `mythSpinTrustPenalty` (-1.5), and `mythSpinHeatDelta` (5).
   - `src/engine/powers.ts`: Added `spinMyth?: string` to `PowerDecisions`, `spunMyths?: readonly string[]` and `heatDelta?: number` to `PowerDecisionsResult`. Implemented spin resolution logic in `resolvePowerDecisions` with 1-turn approval rally and lasting public trust penalty.
   - `src/engine/game.ts`: Integrated `spunMyths` into `GameState`, applied `powersHeat` in Evil Mode, and used conditional spreading to preserve 100% bit-identical golden determinism replays across Node, Chromium, Firefox, and WebKit (8/8 OK).
   - `src/content/text/why.ts`: Added `'event:myth_spin': 'TV spin on common myths'` passing Flesch-Kincaid readability gates.
   - `src/app/save.ts`: Validated `powers.spinMyth` against `getMyth()`.

2. **Session Integration & Interactive Debunk vs. Spin Choice (`SPIN-01`, `SPIN-02`)**:
   - `src/app/session.svelte.ts`: Added `draft.spinMyth`, `spinMythCard(id: string)`, `hasSpunMyth(id: string)`, and staged decisions tray feedback.
   - `src/ui/MythModal.svelte`: Rendered both `📺 SPIN THIS MYTH (+2% Approval, −Trust)` (`data-testid="spin-myth-btn"`) and `DEBUNK MYTH (+5 CLOUT)` (`data-testid="debunk-myth-btn"`) with WCAG AA compliance in both Day and Evil themes.
   - `src/screens/Game.svelte`: Wired `onSpin` callback to `session.spinMythCard(activeMyth!.id)`.

3. **Civic Mastery Dossier & Unlockable Badges (`SPIN-02`)**:
   - `src/content/badges.ts` & `src/engine/badges.ts`: Added `truth_teller` ("Truth Teller": Debunked 6+ myths, 0 spun) and `demagogue` ("Demagogue": Spun 4+ common myths on TV).
   - `src/screens/EndScreen.svelte`: Added `Civic Dossier` navigation tab (`data-testid="tab-civic-dossier"`), metric stat cards (`data-testid="stat-myths-busted"`, `data-testid="stat-myths-spun"`, `data-testid="stat-trust-impact"`), pedagogical archetypes ("Constitutional Realist", "Calculated Populist", "Unrepentant Demagogue", "Pragmatic Institutionalist", "Passive Observer"), and an interactive myth ledger grid.

4. **Multi-Viewport & Accessibility Verification**:
   - `tests/learn-loop.spec.ts`: End-to-end Playwright tests verifying the live debunk vs. spin gameplay flow, staged tray integration, and EndScreen Civic Mastery Dossier.
   - Zero outer viewport scrolling across 1376×768 and 1280×720 viewports.
   - Zero serious or critical Axe accessibility violations.
   - 77/77 test suites passing (482 tests), 72/72 Playwright e2e tests passing, 8/8 determinism vectors verified.
