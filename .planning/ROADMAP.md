# Roadmap: govSim v1.0 High-Craft Character Art, NPC Presence, Living Animations & Full UI/UX Alignment

## Overview

Milestone `v1.0` upgrades every SVG character rig, facial expression, occupational outfit, articulated pose, and scene vignette in `govSim` to match `.design-targets/cast.png`, `D.png`, `g-evil.png`, `g-election.png`, and `g-newgame.png`, expands reactive NPC presence across Congress, Household cards, Election Night, Bully Pulpit, Impeachment, and EndScreen, and remediates all UI/UX, layout, and alignment issues audited across `1280×720` and `1376×768` screenshots.

## Phases

- [ ] **Phase 39: High-Craft Character Rig, Facial Expressions, Outfits & Articulated Poses** (`GFX-01`, `GFX-02`, `GFX-03`)
- [ ] **Phase 40: Oval Office Evil Mode Scene, Presidential Avatar Selector & Advisor NPCs** (`SCENE-01`, `SCENE-02`)
- [ ] **Phase 41: Reactive Congressional Bloc Leaders & Kitchen-Table Citizen NPCs** (`NPC-01`, `NPC-02`)
- [ ] **Phase 42: Animated Bully Pulpit, Broadcast Election Night, Senate Trial & Legacy Vignettes** (`VIGNETTE-01`, `VIGNETTE-02`, `VIGNETTE-03`)
- [ ] **Phase 43: Full-Screen UI/UX, Layout & Viewport Alignment Remediation** (`LAYOUT-01`, `LAYOUT-02`, `LAYOUT-03`, `LAYOUT-04`)
- [ ] **Phase 44: Computer-Vision Visual Audit, Calm-Mode Compliance & Multi-Viewport Verification** (`AUDIT-01`)

## Phase Details

### Phase 39: High-Craft Character Rig, Facial Expressions, Outfits & Articulated Poses
**Goal**: Upgrade the foundational SVG character components (`Character.svelte`, `CharacterPortrait.svelte`, `FedPortrait.svelte`, `CourtBench.svelte`) to match `.design-targets/cast.png` and `D.png`.
**Depends on**: Phase 38 (v0.9 complete)
**Requirements**: `GFX-01`, `GFX-02`, `GFX-03`
**Success Criteria** (what must be TRUE):
  1. `Character.svelte` renders seamless capsule-to-shoulder joints, expressive dot/arc/open-tongue mouths, back-hair layers (`long`, `bob`, `afro`, `bun`), swallowtail ribbon nameplate banners, and enamel US flag lapel pins.
  2. `Character.svelte` supports articulated poses (`hips`, `crossed`, `celebrate`, `facepalm`, `cash`, `podium`) and occupational outfits (`scrubs` + stethoscope, `hardhat` + safety vest, `blazer` + broadcast mic/earpiece, `cardigan` + glasses) using separate outer positioning `<g>` and inner CSS animation `<g>` elements.
  3. `CharacterPortrait.svelte` renders circular medallion busts (`triumphant` confetti burst, `facepalm` hand over eye, `panicked` blue-forehead dread gradient + twin sweat drops, `scheming`, `confident`, `stressed`) with fixed outer `clipPath` coordinates.
**Plans**: 1 plan

### Phase 40: Oval Office Evil Mode Scene, Presidential Avatar Selector & Advisor NPCs
**Goal**: Add a selectable Presidential Look / Avatar picker and White House portico banner on `NewGame.svelte`, and upgrade `OvalOfficeScene.svelte` and `OvalOffice.svelte` with Evil Mode banker's-lamp lighting, cash stacks, and reactive Advisor NPC portraits.
**Depends on**: Phase 39
**Requirements**: `SCENE-01`, `SCENE-02`
**Success Criteria** (what must be TRUE):
  1. `NewGame.svelte` lets the player pick from 4 distinct nonpartisan Presidential Looks (persisted in `GameOptions`, `Session`, and `SaveFile`) and displays an animated White House portico inauguration banner that shifts to dark oxblood/scheming when Evil Mode is toggled.
  2. `OvalOfficeScene.svelte` renders a high-back leather executive chair behind the President and, in Evil Mode, a brass banker's lamp casting a warm cone of light onto stacked green cash bundles on the Resolute Desk while the President's hands fan a cash bundle.
  3. `OvalOffice.svelte` displays reactive Advisor NPC portrait medallions alongside action recommendations.
**Plans**: 1 plan

### Phase 41: Reactive Congressional Bloc Leaders & Kitchen-Table Citizen NPCs
**Goal**: Bring Congressional Bloc Leaders and Household Personas to life with live state-reactive poses, outfits, and expressions across `Congress`, `Budget`, and `Household` views.
**Depends on**: Phase 40
**Requirements**: `NPC-01`, `NPC-02`
**Success Criteria** (what must be TRUE):
  1. Congressional Bloc Leaders in `Hemicycle.svelte` and `Congress.svelte` dynamically switch between `crossed` + scowl (whip share `< 30%`), pensive (`30%–60%`), and `wave`/`celebrate` (`> 60%`), with a spring bounce pulse when a deal flips their support.
  2. Each of the 4 Household Personas (`Nurse`, `Auto/Grid Worker`, `Retiree`, `Small Business Owner`) + custom families renders a dedicated Citizen NPC portrait in `HouseholdCard.svelte`, `HouseholdModal.svelte`, and `Budget.svelte` whose mood reacts live to `netMonthlyDelta`.
**Plans**: 1 plan

### Phase 42: Animated Bully Pulpit, Broadcast Election Night, Senate Trial & Legacy Vignettes
**Goal**: Add high-craft animated SVG scenes and NPC portraits to `SpeechModal`, `ElectionNightModal`, `Voters`, `ImpeachmentModal`, `TurnReport`, and `EndScreen`.
**Depends on**: Phase 41
**Requirements**: `VIGNETTE-01`, `VIGNETTE-02`, `VIGNETTE-03`
**Success Criteria** (what must be TRUE):
  1. `SpeechModal.svelte` renders an animated Presidential Bully Pulpit Podium vignette with dual microphones, camera flashes, and target audience silhouettes.
  2. `ElectionNightModal.svelte` features a Live Broadcast News Anchor + You-vs-Opponent EV portrait medallions that react as states are called, and `Voters.svelte` shows a state voter mood medallion in the state detail card.
  3. `ImpeachmentModal.svelte`, `TurnReport.svelte`, and `EndScreen.svelte` display reactive Senate Trial / Chief Justice, Historian/Advisor, and Presidential Legacy / Kleptocrat Heist vignettes.
**Plans**: 1 plan

### Phase 43: Full-Screen UI/UX, Layout & Viewport Alignment Remediation
**Goal**: Fix all UI/UX, layout, collision, and sub-container clipping issues identified across `1280×720` and `1376×768` screenshots (`LAYOUT-01..04`).
**Depends on**: Phase 42
**Requirements**: `LAYOUT-01`, `LAYOUT-02`, `LAYOUT-03`, `LAYOUT-04`
**Success Criteria** (what must be TRUE):
  1. `App.svelte` renders uniform single-line status pills (`0 STAGED`, `PLAIN TALK`, `CALM`), non-wrapping turn/season/skip indicators on wide-banner screens (`Trade & Tariffs`), and clean spacing between `HOME`/`SEE`/`ACT` headers and folder tab ears.
  2. `OvalOfficeScene.svelte` positions the Chief of Staff's speech bubble clear of his head; `OvalOffice.svelte` fits all right-sidebar cards at `1280×720` without clipping; `Hemicycle.svelte` keeps the Centrists bloc leader inside the `.card` top border; and `Congress.svelte` keeps `CALL THE VOTE` fully visible on deadline turns at `1280×720`.
  3. `Budget.svelte` has clean icon-to-label spacing; `Powers.svelte` fits its executive order cards and right-sidebar headers cleanly; `Trade.svelte` uses a 5-column KPI row so sector tariff cards never clip at `1280×720`; and `Voters.svelte` keeps the bottom Electoral College bar and progress meter fully visible at `1280×720`.
  4. `CrisisModal.svelte` (top badge + `ReporterScene` full-bleed width/chyron), `ElectionNightModal.svelte` (live EV progress bar fill + inner `.card` border), and `EndScreen.svelte` (top stat alignment, single-row chart filter pills, and Milestones grid fit) render with zero clipping.
**Plans**: 1 plan

### Phase 44: Computer-Vision Visual Audit, Calm-Mode Compliance & Multi-Viewport Verification
**Goal**: Verify all upgraded SVG scenes, NPCs, animations, and layout fixes via headless Playwright screenshots and computer vision across `1376×768` and `1280×720`, ensuring Calm Mode compliance, zero axe violations, and 100% gate pass.
**Depends on**: Phase 43
**Requirements**: `AUDIT-01`
**Success Criteria** (what must be TRUE):
  1. Every screen and modal at `1376×768` and `1280×720` passes computer-vision inspection (`view_file`) with zero text-on-character collisions, zero sub-container clipping, and zero outer viewport scrolling (`scrollHeight <= innerHeight`).
  2. Enabling `Calm mode` or `prefers-reduced-motion: reduce` cleanly pauses all continuous ambient SVG keyframe animations (`breathe`, `wave`, `cash`, `lampGlow`, `flash`).
  3. `pnpm check`, `pnpm test`, `pnpm guard`, `pnpm notices`, `pnpm e2e`, and `pnpm determinism` all pass 100%.
**Plans**: 1 plan

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 39. High-Craft Character Rig, Facial Expressions, Outfits & Articulated Poses | 0/1 | Not started | - |
| 40. Oval Office Evil Mode Scene, Presidential Avatar Selector & Advisor NPCs | 0/1 | Not started | - |
| 41. Reactive Congressional Bloc Leaders & Kitchen-Table Citizen NPCs | 0/1 | Not started | - |
| 42. Animated Bully Pulpit, Broadcast Election Night, Senate Trial & Legacy Vignettes | 0/1 | Not started | - |
| 43. Full-Screen UI/UX, Layout & Viewport Alignment Remediation | 0/1 | Not started | - |
| 44. Computer-Vision Visual Audit, Calm-Mode Compliance & Multi-Viewport Verification | 0/1 | Not started | - |
