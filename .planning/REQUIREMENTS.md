# Requirements: govSim v1.0 — High-Craft Character Art, Living Animations, UI/UX Alignment & Incremental Mandate Synergies

**Defined:** 2026-10-18
**Core Value:** A player can make real presidential tradeoffs (or play the satirical "Evil Mode" kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## v1.0 Requirements

### Character Anatomy, Outfits & Poses (`GFX` — Phase 39)

- [x] **GFX-01**: Upgrade `Character.svelte`, `FedPortrait.svelte`, and `CourtBench.svelte` to match `.design-targets/cast.png` and `D.png` with seamless capsule-to-shoulder joints, sculpted neck/jawline shading, upper eyelids + gaze catchlights, expressive dot/arc/open-tongue mouths, back-hair layers (`long`, `bob`, `afro`, `bun`, `bald` horseshoe), swallowtail ribbon nameplate banners, and enamel US flag lapel pin
- [x] **GFX-02**: Add articulated character poses (`hips`, `crossed`, `celebrate`, `facepalm`, `cash`, `podium`) and occupational outfits/props (`scrubs` + stethoscope, `hardhat` + safety vest, `blazer` + broadcast earpiece/mic, `cardigan` + glasses) while separating outer SVG positioning `<g>` from inner CSS animation `<g>`
- [x] **GFX-03**: Create reusable `<CharacterPortrait>` medallion component (`src/ui/art/CharacterPortrait.svelte`) supporting circular framed bust/expression avatars (`triumphant` confetti burst, `facepalm` hand over face, `panicked` blue-forehead dread gradient + twin sweat drops, `scheming`, `confident`, `stressed`)

### Oval Office Scenes, Avatar Picker & Advisors (`SCENE` — Phase 40)

- [x] **SCENE-01**: Add a 4-option Presidential Look / Avatar selector on `NewGame.svelte` (persisted in `GameOptions`, `Session`, and `SaveFile`) plus an animated White House portico inauguration banner (`.design-targets/g-newgame.png`) that shifts to dark oxblood/scheming when Evil Mode is toggled
- [x] **SCENE-02**: Upgrade `OvalOfficeScene.svelte` with a high-back leather executive chair, Evil Mode brass banker's lamp + warm light cone + cash stacks on the Resolute Desk + animated cash-fanning hands (`.design-targets/g-evil.png`), and reactive Advisor NPC portrait badges on `OvalOffice.svelte`

### Reactive Congressional & Citizen NPCs (`NPC` — Phase 41)

- [x] **NPC-01**: Upgrade Congressional Bloc Leaders in `Hemicycle.svelte` and `Congress.svelte` with live whip-reactive poses and expressions (`crossed` + scowl when whip share `< 30%`, pensive when undecided, `wave`/`celebrate` + bounce pulse when a deal flips their bloc)
- [x] **NPC-02**: Add dedicated Citizen NPC portraits for the 4 Household Personas (`Nurse`, `Auto/Grid Worker`, `Retiree`, `Small Business Owner`) + custom families in `HouseholdCard.svelte`, `HouseholdModal.svelte`, and `Budget.svelte` whose expressions react live to `netMonthlyDelta`

### Animated Modal & End-of-Term Vignettes (`VIGNETTE` — Phase 42)

- [ ] **VIGNETTE-01**: Add an animated Presidential Bully Pulpit Podium scene in `SpeechModal.svelte` with dual microphones, camera flashes, and target audience silhouettes (`General Public`, `Congress`, `Business Leaders`)
- [ ] **VIGNETTE-02**: Add a Live Broadcast News Anchor + You-vs-Opponent EV portrait medallions in `ElectionNightModal.svelte` (`.design-targets/g-election.png`) and state voter mood portraits in `Voters.svelte`
- [ ] **VIGNETTE-03**: Add a dramatic Senate Trial / Chief Justice verdict scene in `ImpeachmentModal.svelte`, Historian/Advisor header badge in `TurnReport.svelte`, and Presidential Legacy / Kleptocrat Heist vignette in `EndScreen.svelte`

### Full-Screen UI/UX, Layout & Alignment Remediation (`LAYOUT` — Phase 43)

- [ ] **LAYOUT-01**: Remediate Global Shell, Top Status Bar & Left Folder Nav alignment (`App.svelte`: uniform single-line status pills for `0 STAGED` / `PLAIN TALK` / `CALM`, non-wrapping turn/season/skip indicators on wide-banner screens like `Trade & Tariffs`, and clean vertical spacing between `HOME`/`SEE`/`ACT` section headers and folder tab ears)
- [ ] **LAYOUT-02**: Remediate Oval Office & Congress collision and right-sidebar overflow bugs (`OvalOfficeScene.svelte` speech bubble positioned clear of the Chief of Staff's head; `OvalOffice.svelte` right-sidebar cards compacted so the 5th card never clips at `1280×720`; `Hemicycle.svelte` Centrists bloc leader moved inside `.card` top border; `Congress.svelte` right sidebar compacted on deadline turns so `CALL THE VOTE` is never pushed off-screen)
- [ ] **LAYOUT-03**: Remediate Budget, Powers, Trade & Voters layout and clipping bugs (`Budget.svelte` icon-to-label spacing on preset buttons and slider headers; `Powers.svelte` card grid density and `BULLY PULPIT SPEECH` header gap so bottom cards fit `1280×720`; `Trade.svelte` 5-column KPI row so sector tariff cards fit without clipping; `Voters.svelte` height budget so the bottom Electoral College bar and progress meter never clip at `1280×720`)
- [ ] **LAYOUT-04**: Remediate Modal & EndScreen alignment bugs (`CrisisModal.svelte` top badge clipping & `ReporterScene.svelte` full-bleed width/chyron fit; `ElectionNightModal.svelte` live EV progress bar fill calculation & inner `.card` border fit; `EndScreen.svelte` top header stat alignment, single-row chart filter pills, and scrollable/fitted Milestones grid)

### Quarterly Mandate & Task Force RNG Draft — Brotato Shop Loop (`PERK` — Phase 44)

- [ ] **PERK-01**: Build a pure deterministic Mandate & Task Force RNG draft engine (`src/engine/perks.ts`, dedicated `rng.ts` stream 21) that rolls 3 tiered cards (`Tier I Routine` → `Tier IV Historic Mandate`) per eligible quarter with registered `coefficients.ts` parameters, reroll/lock state in `GameState`, and causal `Ledger` traces
- [ ] **PERK-02**: Build an interactive *Brotato*-style **White House Task Force / Mandate Draft** modal (`src/ui/PerkDraftModal.svelte`) with `👍 Upside` / `⚠️ The Catch` trade-off pills, **Spend Clout to Reroll**, **Lock Card for Next Quarter**, **Skip for +Clout**, and a `"Classic Sim (No Perks)"` toggle on `src/screens/NewGame.svelte` (`GameOptions.classicSim`)
- [ ] **PERK-03**: Author a curated 24-card nonpartisan Presidential Task Force & Institutional Doctrine catalog (`src/content/perks.ts`) spanning fiscal, industrial, regulatory, judicial, diplomatic, and populist playstyles with Plain-Talk + Policy-Wonk dual copy and verified civic notes

### Policy Doctrine Synergy Tags & How Many Dudes? Chain-Reaction Engine (`SYN` — Phase 45)

- [ ] **SYN-01**: Tag Executive Orders, Budget packages, Trade pacts/tariffs, Social policies, Reforms, and drafted Task Forces with **Policy Doctrine Families** (`🏗️ Industrial`, `🌱 Green Transition`, `🛡️ National Security`, `📈 Main Street`, `⚖️ Institutionalist`, `🌐 Globalist`) and surface tag badges on action cards
- [ ] **SYN-02**: Implement *How Many Dudes?*-style **Doctrine Set Thresholds (`2 / 4 / 6`) & Chain-Reaction Triggers** (`src/engine/synergies.ts`) where stacking families unlocks multiplicative institutional flywheels and event-driven chain triggers (*"Action A triggers Bonus B"*) recorded in `report.trace` with `src/content/text/why.ts` explanations
- [ ] **SYN-03**: Build a live **Administration Doctrine & Synergy Bar** (`src/ui/SynergyBar.svelte`) on `src/screens/OvalOffice.svelte` and `src/ui/TurnReport.svelte` with cascading combo popups (`+Clout`, `+Prosperity`, `+$B Stash`) that fire sequentially when chain triggers resolve (respecting `Calm mode`)

### Evil Mode Heist Relics, Presidential Archetypes & Mastery Stars (`HEIST` / `ARCH` — Phase 46)

- [ ] **HEIST-01**: Author the Evil Mode **"Heist Relics & Fixer Syndicate"** catalog and draft pool (`🏝️ Shell Network`, `🕵️ Fixer Ring`, `🏛️ Captured Regulators`) with corrupt multiplicative chain triggers that boost offshore `$B` skims and launder Heat when stacking crony levers
- [ ] **HEIST-02**: Add the Evil Mode dark-market draft skin in `src/ui/PerkDraftModal.svelte` and Syndicate combo breakdowns in the `src/screens/EndScreen.svelte` Kleptocratic Heist Review
- [ ] **ARCH-01**: Add selectable **Presidential Playstyle Archetypes** on `src/screens/NewGame.svelte` (`src/content/archetypes.ts`: *The Deal-Maker*, *The Technocrat*, *The Populist Firebrand*, *The Beltway Insider*, *The Constitutional Purist*) with rule-warping passive modifiers, starting Doctrine relics, and `SaveFile` / URL hash persistence
- [ ] **ARCH-02**: Implement persistent `localStorage` **Silver & Gold Mastery Stars** (`src/app/mastery.ts`) tracked per Archetype and Scenario (Silver = win reelection & beat autopilot; Gold = beat autopilot by `>= +5.0` or escape Evil Mode with `>= $20B`), surfaced on `NewGame.svelte` and `EndScreen.svelte`

### Balance Calibration, Computer-Vision Visual Audit & Verification (`AUDIT` — Phase 47)

- [ ] **AUDIT-01**: Complete a computer-vision visual audit across all screens and modals at `1376×768` and `1280×720` with before/after screenshot verification, zero inner/outer element clipping, zero outer viewport scroll, 0 axe violations, and `Calm mode` / `prefers-reduced-motion` animation compliance
- [ ] **AUDIT-02**: Verify 100-seed Monte Carlo balance across both Standard (with Perks/Synergies) and Classic Sim modes (`sensible - nothing` in `[2, 10]`, party neutrality `<= 5 pp`, no degenerate single-tag exploit), Flesch-Kincaid reading grade ≤ 9.0, and 8/8 cross-browser determinism hashes

## Out of Scope

| Feature | Reason |
|---------|--------|
| External Rive / Lottie runtime | Violates zero-dependency static SVG art rule (`docs/design.md` §1) |
| Audio / voice narration | Explicitly out of scope (`docs/design.md` A5) |
| Partisan caricatures of real politicians | Violates nonpartisan institutional rule (`docs/design.md` Q6, E4) |
| Unbounded exponential math outside macro bounds | All synergy and chain-trigger bonuses are bounded by `LIMITS` and `coefficients.ts` caps |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GFX-01 | Phase 39 | Complete |
| GFX-02 | Phase 39 | Complete |
| GFX-03 | Phase 39 | Complete |
| SCENE-01 | Phase 40 | Complete |
| SCENE-02 | Phase 40 | Complete |
| NPC-01 | Phase 41 | Complete |
| NPC-02 | Phase 41 | Complete |
| VIGNETTE-01 | Phase 42 | Pending |
| VIGNETTE-02 | Phase 42 | Pending |
| VIGNETTE-03 | Phase 42 | Pending |
| LAYOUT-01 | Phase 43 | Pending |
| LAYOUT-02 | Phase 43 | Pending |
| LAYOUT-03 | Phase 43 | Pending |
| LAYOUT-04 | Phase 43 | Pending |
| PERK-01 | Phase 44 | Pending |
| PERK-02 | Phase 44 | Pending |
| PERK-03 | Phase 44 | Pending |
| SYN-01 | Phase 45 | Pending |
| SYN-02 | Phase 45 | Pending |
| SYN-03 | Phase 45 | Pending |
| HEIST-01 | Phase 46 | Pending |
| HEIST-02 | Phase 46 | Pending |
| ARCH-01 | Phase 46 | Pending |
| ARCH-02 | Phase 46 | Pending |
| AUDIT-01 | Phase 47 | Pending |
| AUDIT-02 | Phase 47 | Pending |

**Coverage:**

- v1.0 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓
