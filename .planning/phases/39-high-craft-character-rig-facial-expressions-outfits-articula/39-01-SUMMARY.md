# Summary 39-01: High-Craft SVG Character Anatomy, Poses & Portrait Medallions

**Phase:** 39
**Plan:** 39-01
**Requirements Satisfied:** `GFX-01`, `GFX-02`, `GFX-03`
**Status:** Complete

## What Changed

1. **High-Craft Character Anatomy & Hair Layers (`GFX-01`)**:
   - Upgraded `src/ui/art/Character.svelte` with a sculpted neck + cast jawline shadow (`data-testid="char-neck"`), back-hair layers (`long`, `bob`, `afro`, `bun`) and `bald` horseshoe fringe + crown highlight, an enamel US flag lapel pin (`data-testid="char-lapel-pin"`), upper eyelid creases + catchlights, multi-layer mouths (lips, teeth highlight, tongue depth), panicked blue-forehead dread gradient (`data-testid="char-panic-dread"`), and optional swallowtail ribbon nameplate banners (`data-testid="char-nameplate"`).
   - Upgraded `src/ui/art/FedPortrait.svelte` and `src/ui/art/CourtBench.svelte` with sculpted neck/chin shadows, upper eyelid arcs, ear inner contours, lapel/robe collar details, and Chief Justice sleeve trim using only design tokens.
2. **Articulated Poses & Occupational Outfits (`GFX-02`)**:
   - Added 6 new articulated poses (`hips`, `crossed`, `celebrate`, `facepalm`, `cash`, `podium`) alongside `stand`, `point`, `desk`, and `wave`, plus the `facepalm` mood (`data-testid="char-facepalm-hand"`).
   - Added occupational outfits (`scrubs` + stethoscope, `hardhat` + high-vis safety vest, `blazer` + press badge/earpiece, `cardigan` + gold buttons) and props (`wrench`, `stethoscope`, `earpiece`, `cash_fan`).
   - Separated outer SVG positioning `<g transform="translate(...)">` from inner CSS animation `<g class="breathe">` with `Calm mode` and `prefers-reduced-motion` pauses.
3. **Reusable `<CharacterPortrait>` Medallion (`GFX-03`)**:
   - Created `src/ui/art/CharacterPortrait.svelte` framing a `<Character>` bust inside a double-bordered Americana circular medallion with mood-reactive backdrop accents (`triumphant` confetti burst, `panicked`/`stressed`/`facepalm` alert hatch, `scheming` shadow arc) and optional bottom badge pill.
   - Added unit tests in `src/ui/art/Character.test.ts` and `src/ui/art/CharacterPortrait.test.ts`.

## Verification

- `pnpm exec vitest run src/ui/art/Character.test.ts src/ui/art/CharacterPortrait.test.ts`: 6/6 passing
- `pnpm guard`: `guard ok`
- `pnpm check`: `0 errors and 0 warnings`
