---
phase: 42-animated-bully-pulpit-broadcast-election-night-senate-trial-
plan: 01
subsystem: ui
tags: [svelte, svg, vignettes, bully-pulpit, election-night, impeachment, turn-report, end-screen]
requires:
  - phase: 39-character-anatomy-outfits-poses-prop-vocabulary
    provides: [Character.svelte, CharacterPortrait.svelte]
  - phase: 40-presidential-avatar-selector-oval-office-evil-desk-advisor-r
    provides: [resolvePresidentLook, PRESIDENT_LOOKS]
provides:
  - Animated Bully Pulpit Podium broadcast SVG scene in SpeechModal.svelte
  - Live Broadcast News Anchor and You-vs-Opponent EV portraits in ElectionNightModal.svelte
  - State voter mood CharacterPortrait in Voters.svelte
  - Senate Trial & Chief Justice verdict vignette in ImpeachmentModal.svelte
  - Historian/Advisor portrait in TurnReport.svelte
  - Presidential Legacy & Kleptocrat Heist vignette in EndScreen.svelte
affects: [SpeechModal.svelte, ElectionNightModal.svelte, Voters.svelte, ImpeachmentModal.svelte, TurnReport.svelte, EndScreen.svelte]
key-files:
  modified:
    - src/ui/SpeechModal.svelte
    - src/ui/ElectionNightModal.svelte
    - src/screens/Voters.svelte
    - src/ui/ImpeachmentModal.svelte
    - src/ui/TurnReport.svelte
    - src/screens/EndScreen.svelte
    - src/ui/ElectionNightModal.test.ts
    - src/ui/ImpeachmentModal.test.ts
    - src/screens/EndScreen.test.ts
    - src/screens/Voters.test.ts
key-decisions:
  - "Disabled camera flash pulse animations under prefers-reduced-motion and [data-calm='true']."
  - "Rendered candidate EV portraits and Live Broadcast News Anchor directly in ElectionNightModal.svelte so they remain visible throughout state calls and certified results."
requirements-completed: [VIGNETTE-01, VIGNETTE-02, VIGNETTE-03]
completed: 2026-10-18
---

# Phase 42 Plan 01: Animated Bully Pulpit Broadcast, Election Night, Senate Trial & Legacy Vignettes Summary

## Accomplishments
- **`VIGNETTE-01` (`src/ui/SpeechModal.svelte`)**: Added an animated Bully Pulpit Podium broadcast SVG scene (`data-testid="speech-podium-vignette"`) showing the President at the presidential seal rostrum (`pose="podium"`) with dual microphones, `Calm Mode`-safe camera flash pulses, and target audience silhouettes (`general`, `congress`, `business`).
- **`VIGNETTE-02` (`src/ui/ElectionNightModal.svelte`, `src/screens/Voters.svelte`)**: Added a Live Broadcast News Anchor (`outfit="blazer"`, `prop="earpiece"`, `data-testid="election-anchor-vignette"`) and You-vs-Opponent EV `<CharacterPortrait>` medallions (`data-testid="election-player-portrait"`, `data-testid="election-opponent-portrait"`), plus a state voter mood `<CharacterPortrait>` (`data-testid="voters-state-portrait"`) in `Voters.svelte`.
- **`VIGNETTE-03` (`src/ui/ImpeachmentModal.svelte`, `src/ui/TurnReport.svelte`, `src/screens/EndScreen.svelte`)**: Added a Senate Trial & Chief Justice verdict SVG vignette (`data-testid="impeachment-trial-vignette"`), a Historian/Advisor `<CharacterPortrait>` (`data-testid="turn-report-portrait"`), and a Presidential Legacy / Kleptocrat Heist vignette (`data-testid="endscreen-legacy-vignette"`).

## Verification
- `pnpm vitest run src/ui/ElectionNightModal.test.ts src/ui/ImpeachmentModal.test.ts src/screens/EndScreen.test.ts src/screens/Voters.test.ts`: 19 tests passed.
- `pnpm guard`: OK.
- `pnpm check`: 0 errors and 0 warnings.
