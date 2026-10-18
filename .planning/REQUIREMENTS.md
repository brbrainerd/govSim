# Requirements: govSim v1.0 High-Craft Character Art, NPC Presence, Living Animations & Full UI/UX Alignment

**Defined:** 2026-10-18
**Core Value:** A player can make real presidential tradeoffs (or play the satirical "Evil Mode" kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## v1.0 Requirements

### Character Anatomy, Outfits & Poses (`GFX`)

- [ ] **GFX-01**: Upgrade `Character.svelte`, `FedPortrait.svelte`, and `CourtBench.svelte` to match `.design-targets/cast.png` and `D.png` with seamless capsule-to-shoulder joints, expressive dot/arc/open-tongue mouths, back-hair layers (`long`, `bob`, `afro`, `bun`), swallowtail ribbon nameplate banners, and enamel US flag lapel pin
- [ ] **GFX-02**: Add articulated character poses (`hips`, `crossed`, `celebrate`, `facepalm`, `cash`, `podium`) and occupational outfits/props (`scrubs` + stethoscope, `hardhat` + safety vest, `blazer` + broadcast earpiece/mic, `cardigan` + glasses) while separating outer SVG positioning `<g>` from inner CSS animation `<g>`
- [ ] **GFX-03**: Create reusable `<CharacterPortrait>` medallion component (`src/ui/art/CharacterPortrait.svelte`) supporting circular framed bust/expression avatars (`triumphant` confetti burst, `facepalm` hand over face, `panicked` blue-forehead dread gradient + twin sweat drops, `scheming`, `confident`, `stressed`)

### Oval Office Scenes, Avatar Picker & Advisors (`SCENE`)

- [ ] **SCENE-01**: Add a 4-option Presidential Look / Avatar selector on `NewGame.svelte` (persisted in `GameOptions`, `Session`, and `SaveFile`) plus an animated White House portico inauguration banner (`.design-targets/g-newgame.png`) that shifts to dark oxblood/scheming when Evil Mode is toggled
- [ ] **SCENE-02**: Upgrade `OvalOfficeScene.svelte` with a high-back leather executive chair, Evil Mode brass banker's lamp + warm light cone + cash stacks on the Resolute Desk + animated cash-fanning hands (`.design-targets/g-evil.png`), and reactive Advisor NPC portrait badges on `OvalOffice.svelte`

### Reactive Congressional & Citizen NPCs (`NPC`)

- [ ] **NPC-01**: Upgrade Congressional Bloc Leaders in `Hemicycle.svelte` and `Congress.svelte` with live whip-reactive poses and expressions (`crossed` + scowl when whip share `< 30%`, pensive when undecided, `wave`/`celebrate` + bounce pulse when a deal flips their bloc)
- [ ] **NPC-02**: Add dedicated Citizen NPC portraits for the 4 Household Personas (`Nurse`, `Auto/Grid Worker`, `Retiree`, `Small Business Owner`) + custom families in `HouseholdCard.svelte`, `HouseholdModal.svelte`, and `Budget.svelte` whose expressions react live to `netMonthlyDelta`

### Animated Modal & End-of-Term Vignettes (`VIGNETTE`)

- [ ] **VIGNETTE-01**: Add an animated Presidential Bully Pulpit Podium scene in `SpeechModal.svelte` with dual microphones, camera flashes, and target audience silhouettes (`General Public`, `Congress`, `Business Leaders`)
- [ ] **VIGNETTE-02**: Add a Live Broadcast News Anchor + You-vs-Opponent EV portrait medallions in `ElectionNightModal.svelte` (`.design-targets/g-election.png`) and state voter mood portraits in `Voters.svelte`
- [ ] **VIGNETTE-03**: Add a dramatic Senate Trial / Chief Justice verdict scene in `ImpeachmentModal.svelte`, Historian/Advisor header badge in `TurnReport.svelte`, and Presidential Legacy / Kleptocrat Heist vignette in `EndScreen.svelte`

### Full-Screen UI/UX, Layout & Alignment Remediation (`LAYOUT`)

- [ ] **LAYOUT-01**: Remediate Global Shell, Top Status Bar & Left Folder Nav alignment (`App.svelte`: uniform single-line status pills for `0 STAGED` / `PLAIN TALK` / `CALM`, non-wrapping turn/season/skip indicators on wide-banner screens like `Trade & Tariffs`, and clean vertical spacing between `HOME`/`SEE`/`ACT` section headers and folder tab ears)
- [ ] **LAYOUT-02**: Remediate Oval Office & Congress collision and right-sidebar overflow bugs (`OvalOfficeScene.svelte` speech bubble positioned clear of the Chief of Staff's head; `OvalOffice.svelte` right-sidebar cards compacted so the 5th card never clips at `1280×720`; `Hemicycle.svelte` Centrists bloc leader moved inside `.card` top border; `Congress.svelte` right sidebar compacted on deadline turns so `CALL THE VOTE` is never pushed off-screen)
- [ ] **LAYOUT-03**: Remediate Budget, Powers, Trade & Voters layout and clipping bugs (`Budget.svelte` icon-to-label spacing on preset buttons and slider headers; `Powers.svelte` card grid density and `BULLY PULPIT SPEECH` header gap so bottom cards fit `1280×720`; `Trade.svelte` 5-column KPI row so sector tariff cards fit without clipping; `Voters.svelte` height budget so the bottom Electoral College bar and progress meter never clip at `1280×720`)
- [ ] **LAYOUT-04**: Remediate Modal & EndScreen alignment bugs (`CrisisModal.svelte` top badge clipping & `ReporterScene.svelte` full-bleed width/chyron fit; `ElectionNightModal.svelte` live EV progress bar fill calculation & inner `.card` border fit; `EndScreen.svelte` top header stat alignment, single-row chart filter pills, and scrollable/fitted Milestones grid)

### Computer-Vision Visual Audit & Verification (`AUDIT`)

- [ ] **AUDIT-01**: Complete a computer-vision visual audit across all screens and modals at `1376×768` and `1280×720` with before/after screenshot verification, zero inner/outer element clipping, zero outer viewport scroll, 0 axe violations, and `Calm mode` / `prefers-reduced-motion` animation compliance

## Out of Scope

| Feature | Reason |
|---------|--------|
| External Rive / Lottie runtime | Violates zero-dependency static SVG art rule (`docs/design.md` §1) |
| Audio / voice narration | Explicitly out of scope (`docs/design.md` A5) |
| Partisan caricatures of real politicians | Violates nonpartisan institutional rule (`docs/design.md` Q6, E4) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GFX-01 | Phase 39 | Pending |
| GFX-02 | Phase 39 | Pending |
| GFX-03 | Phase 39 | Pending |
| SCENE-01 | Phase 40 | Pending |
| SCENE-02 | Phase 40 | Pending |
| NPC-01 | Phase 41 | Pending |
| NPC-02 | Phase 41 | Pending |
| VIGNETTE-01 | Phase 42 | Pending |
| VIGNETTE-02 | Phase 42 | Pending |
| VIGNETTE-03 | Phase 42 | Pending |
| LAYOUT-01 | Phase 43 | Pending |
| LAYOUT-02 | Phase 43 | Pending |
| LAYOUT-03 | Phase 43 | Pending |
| LAYOUT-04 | Phase 43 | Pending |
| AUDIT-01 | Phase 44 | Pending |

**Coverage:**
- v1.0 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-18*
*Last updated: 2026-10-18 after v1.0 milestone initialization and screenshot UI/UX audit*
