# Phase 20 Context: Satirical UI Reskin & Heist End Screens

## Goal
Deliver the dark Americana visual reskin (oxblood, aged gold, ink) when Evil Mode is active, live Offshore Stash counter and Heat Gauge integration into the Oval Office hub and status bar, and specialized End Screens ranking unconvicted players by their offshore heist tier or chronicling their political and financial ruin upon conviction or electoral defeat.

## Requirements
- **UI-01**: Satirical visual reskin applying a dark Americana theme (oxblood, aged gold, ink) when Evil Mode is active.
- **UI-02**: Live Offshore Stash counter and Heat Gauge integrated into the status bar and Oval Office / Situation Room.
- **UI-03**: Specialized End Screens ranking unconvicted players by their offshore heist tier, or detailing their downfall upon conviction or electoral rejection.

## Architecture & Design Decisions
1. **Theme Switching (`UI-01`)**:
   - `applyTheme('evil')` applied reactively when an Evil Mode session is loaded/running or when active in game, and gracefully restored to `applyTheme('day')` when returning to standard mode or the main menu.
   - Tokens defined in `src/design/tokens.ts` (oxblood `#7A1E1E`, aged gold `#C9A23A`, near-black paper `#1A1410`, card `#251C16`, cream ink `#EADBB8`, etc.).
   - Contrast check: ensure all text meets WCAG AA (>4.5:1 for body, >3:1 for large UI).
2. **Oval Office / Situation Room Reskin (`UI-02`)**:
   - When `isEvilMode` is true in `OvalOffice.svelte`:
     - Bubble & briefing text reflects kleptocratic posture ("Who can we squeeze this turn?", "Loot Status & Federal Extraction").
     - Dedicated Evil Mode situation card in the action column displaying live Offshore Stash ($B), Heat Gauge with visual meter and thresholds (60 Special Counsel, 80 Impeachment, 67 Senate Conviction), and quick action button routing to Corrupt Levers (`powers`).
     - Rosette / score badge adjusted to showcase Offshore Stash ($B) instead of standard prosperity index.
3. **Kleptocrat Heist Tiers & End Screen (`UI-03`)**:
   - Pure arithmetic classification in `src/engine/evil-endgame.ts` (or `src/engine/evil.ts`):
     - Convicted: `Disgraced Convict` — $0.0B stash forfeited, federal penitentiary sentence, presidential library funded by prison commissary.
     - Defeated in Election: `Ousted Grifter` — electoral loss, loot preserved if low heat, or pending federal indictments if high heat.
     - Completed Term Unconvicted:
       - `< $10B`: `Petty Grifter` (Swiss bank box, modest yacht, talk radio circuit).
       - `$10B – $24.9B`: `Gilded Oligarch` (Private island, superyacht, corrupt foundation).
       - `$25B – $49.9B`: `Sovereign Plunderer` (Megayacht, sovereign immunity passport, bought sports franchise).
       - `>= $50B`: `Transnational Kleptocrat` (Global shadow banking empire, golden statues, private military escort).
   - In `EndScreen.svelte`:
     - Displays satirical heist title, heist tier badge, final loot breakdown, and satirical historian assessment.
     - Dedicated Plunder / Extraction ledger showing enacted corrupt executive levers.
4. **Verification & Audit**:
   - Headless Playwright E2E suite (`tests/heist-reskin.spec.ts`) testing theme toggle, Oval Office evil cards, and End Screen across viewports (1376x768 and 1280x720) with 0 axe violations.
