# Plan 20-01 Summary: Theme Switching Hookup & Evil Mode Endgame Engine

## What Was Done
1. **Engine Logic (`src/engine/evil-endgame.ts` & `src/engine/units.ts`)**:
   - Added Kleptocrat Heist Tier constants to `src/engine/units.ts`:
     - `TIER_PETTY_GRIFTER_MAX = 10` ($B)
     - `TIER_GILDED_OLIGARCH_MAX = 25` ($B)
     - `TIER_SOVEREIGN_PLUNDERER_MAX = 50` ($B)
   - Created pure arithmetic, nonpartisan endgame classifier `classifyKleptocratVerdict`:
     - `Disgraced Convict`: Forfeiture of entire stash upon Senate conviction, federal penitentiary sentencing.
     - `Ousted Grifter`: Loss of reelection, preserved stash with ongoing grand jury scrutiny.
     - `Petty Grifter`: Full term survival with < $10B stash, low-key Florida retirement.
     - `Gilded Oligarch`: $10B – $25B stash, megayacht and tax-exempt corrupt foundation.
     - `Sovereign Plunderer`: $25B – $50B stash, private islands and diplomatic immunity passports.
     - `Transnational Kleptocrat`: >= $50B stash, historic heist transforming presidency into private global cartel.
   - Comprehensive unit test suite in `src/engine/evil-endgame.test.ts` (6/6 passing).
2. **Design Tokens & Theme Switching (`src/design/tokens.ts` & `src/App.svelte`)**:
   - Enhanced `themes.evil` in `tokens.ts` with `'card-alt'`, `'gold-dark'`, `'scrim'`, and tint variables.
   - Made `applyTheme` resilient in headless/SSR environments where `document` is undefined.
   - Wired reactive `$effect` in `src/App.svelte` calling `applyTheme(session?.isEvilMode ? 'evil' : 'day')`.

## Verification Gates
- `npm run guard`: Passed (clean nonpartisanship and zero bare literals).
- `npm run check`: 0 errors, 0 warnings.
- `pnpm test`: 413/413 tests passing across 64 test files.
- `pnpm determinism`: 8/8 OK across Node, Chromium, Firefox, WebKit.
