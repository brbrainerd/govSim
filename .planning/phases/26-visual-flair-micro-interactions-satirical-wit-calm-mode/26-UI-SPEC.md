# Phase 26 UI Design Contract — Visual Flair, Micro-Interactions, Satirical Wit & Calm Mode

**Phase:** 26
**Requirements:** `JUICE-01`, `JUICE-02`, `JUICE-03`
**Target Visuals:** `.design-targets/g-home.png`, `.design-targets/g-congress.png`, `.design-targets/uikit.png`

## 1. Tactile Micro-Interactions (`JUICE-01`)

- **Rubber Stamp-Slam Badge**:
  - When a bill passes in `Congress.svelte` or an Executive Order / Corrupt Lever is staged in `Powers.svelte`, render a bold rubber-stamp overlay (`PASSED & SIGNED`, `VETOED`, `SIGNED BY ORDER`, or `EXTRACTED`) that animates with `transform: scale(2.2) rotate(-14deg) -> scale(1) rotate(-8deg)` over `var(--dur-fast)` using `var(--ease-pop)`.
- **Hemicycle Seat-Flip Pulse**:
  - In `src/ui/Hemicycle.svelte`, seats flipped by whip deals (`seat-deal`) pulse gently and scale on toggle so players feel the coalition growing visually toward 218 votes.
- **Satirical Capitol News Chyron Strip**:
  - A compact single-line news ticker bar at the bottom of the `OvalOffice.svelte` stage card (`data-testid="oval-news-chyron"`) cycling dry, party-blind institutional headlines reacting to current macro/political state.

## 2. Satirical Institutional Wit (`JUICE-02`)

- All new quips, chyrons, and advisor lines live in `src/content/chyrons.ts` and `src/content/briefing.ts` and are registered in `src/testing/content-gates.test.ts`.
- **Hard Readability & Neutrality Rule**:
  - Every sentence MUST be ≤ 20 words and Flesch-Kincaid grade ≤ 9.0 (use short, punchy words: "senators", "lobbyists", "voters", "bond traders", "think tanks").
  - Criticize institutional incentives (pork barrels, cable news panic, bond vigilantes, K-Street lobbyists), NEVER political parties or real politicians.

## 3. Explicit In-Game "Calm Mode" (`JUICE-03`)

- Add a `"Calm"` toggle button (`data-testid="calm-mode-toggle"`, `aria-pressed={calmMode}`) in `StatusBar.svelte` next to the party / staged indicator.
- Toggling `calmMode` persists in `localStorage['govsim_calm_mode']` and sets `document.documentElement.dataset.calm = 'true'` (or `'false'`).
- When `[data-calm="true"]` or `@media (prefers-reduced-motion: reduce)` is active, all stamp-slam animations, seat pulses, character bobbing, and news-chyron transitions are instant/static (`animation: none !important; transition-duration: 0.01ms !important`).
