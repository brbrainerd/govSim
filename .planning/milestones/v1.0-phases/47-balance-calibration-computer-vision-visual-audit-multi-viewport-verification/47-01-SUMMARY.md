# Phase 47 Plan 01 Summary: Balance Calibration, High-Craft Character/Scene Art Overhaul & Multi-Viewport Verification

**Completed:** 2026-10-18
**Requirements Verified:** `AUDIT-01`, `AUDIT-02`

## Summary of Changes

1. **Concept-Target Character Anatomy & Pawn Rig Overhaul (`src/ui/art/Character.svelte`, `CharacterPortrait.svelte`, `FedPortrait.svelte`, `CourtBench.svelte`, `src/design/tokens.ts`)**:
   - Rebuilt `Character.svelte` around the exact continuous 72px-wide finger/thumb-shaped head + 72px-wide torso pawn silhouette from `.design-targets/D.png` and `cast.png` (eliminating skinny stick necks, white sclera eye rings, and stick noses).
   - Added solid dark dot eyes (`r="4.2"`), happy `^ ^` curved eyes (`triumphant`), closed facepalm arc eyes, maroon/pink-tongue expressive mouths, articulated thumb-and-palm hands, 5-finger waving palm, 4-finger facepalm hand, round wire-frame glasses, and tailored occupational outfits (`suit`, `shirt` with khaki pants & clipboard/pen, `cardigan`, `blazer` with skirt/heels & red-cube broadcast mic, `scrubs` with stethoscope, `hardhat`).
   - Updated `FedPortrait.svelte` and `CourtBench.svelte` to use the same continuous thumb-head anatomy, round wire-frame spectacles, and 9-justice crimson high-back judicial chairs.

2. **Concept-Target Scene & Emblem Overhaul (`src/ui/art/OvalOfficeScene.svelte`, `ReporterScene.svelte`, `CivicEmblem.svelte`, `NewGame.svelte`, `OvalOffice.svelte`, `PerkDraftModal.svelte`, `SynergyBar.svelte`, `TradeoffPill.svelte`, `StatusBar.svelte`, `Rail.svelte`)**:
   - Rebuilt `OvalOfficeScene.svelte` to match `.design-targets/g-home.png`, `hub2.png`, and `g-evil.png`: curved architectural dado rail & recessed wainscot panels, 3 tall mullioned windows with pleated curtains and scalloped Evil Mode valances, curved royal-blue carpet with the **Presidential Eagle Seal** in the foreground, credenza with two framed portraits, US flag with gold eagle finial, navy Presidential seal flag, 3-bay carved mahogany **Resolute Desk** with carved Presidential Eagle relief and gold `"PRESIDENT"` nameplate, and Evil Mode brass banker's lamp + warm glow cone + 3D stacks of banded bills + scheming President counting green bills + standing office paper shredder with document feed and shredded strips.
   - Rebuilt `ReporterScene.svelte` to match `.design-targets/g-crisis.png` with a Gulf Coast state-border weather map, amber storm-surge band, coastal houses/trees, multi-arm white hurricane vortex spiral, and the News Anchor holding the red-cube broadcast microphone.
   - Created `src/ui/art/CivicEmblem.svelte` with bespoke multi-layered Americana SVG emblems for all 6 Policy Doctrines, 3 Evil Syndicates, 5 Presidential Archetypes, 27 Task Force Perks & Heist Relics, and UI micro-icons (`up`, `warn`, `bolt`, `dice`, `lock`, `unlock`, `skip`, `speech`, `grad`), replacing raw Unicode emojis across `NewGame.svelte`, `OvalOffice.svelte`, `SynergyBar.svelte`, `PerkDraftModal.svelte`, `TradeoffPill.svelte`, and `StatusBar.svelte`.
   - Updated `playwright.config.ts` (`reuseExistingServer: false`) so e2e visual tests always build and serve fresh production assets.

3. **100-Seed Monte Carlo Balance & Multi-Viewport Playwright Audit (`src/engine/balance.test.ts`, `tests/v1-milestone.spec.ts`)**:
   - Added 100-seed Monte Carlo balance verification across Standard Mode (with Task Force drafts & Policy Doctrine synergies), Classic Sim Mode (`classicSim: true`), and all 5 Presidential Playstyle Archetypes (`dealmaker`, `technocrat`, `firebrand`, `insider`, `purist`), verifying no single-tag strategy or archetype creates a degenerate exploit.
   - Audited all v1.0 flows and screens at `1376×768` and `1280×720` via Playwright (`tests/v1-milestone.spec.ts`, `tests/art-scenes.spec.ts`, `tests/evil-mode.spec.ts`, `tests/plain-talk-clarity.spec.ts`, `tests/visual.spec.ts`) and inspected rendered screenshots via `view_file`.
