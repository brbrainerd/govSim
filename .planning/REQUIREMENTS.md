# Requirements: govSim v1.0 — High-Craft Character Art, Living Animations & Incremental Mandate Synergies

**Defined:** 2026-10-18
**Core Value:** A player can make real presidential tradeoffs (or play the satirical "Evil Mode" kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## v1.0 Requirements

### High-Craft SVG Character Anatomy, Poses & Portrait Medallions (Phase 39)

- [ ] **GFX-01**: Upgrade `src/ui/art/Character.svelte`, `src/ui/art/FedPortrait.svelte`, and `src/ui/art/CourtBench.svelte` with sculpted neck/jawline shading, upper eyelids + gaze catchlights, multi-layer mouths, back-hair layers (`long`, `bob`, `afro`, `bald` horseshoe), and an enamel US flag lapel pin.
- [ ] **GFX-02**: Add articulated character poses (`hips`, `crossed`, `celebrate`, `facepalm`, `cash`, `podium`) and occupational outfits/props (`scrubs` + stethoscope, `hardhat` + safety vest, `blazer` + broadcast earpiece/mic, `cardigan` + glasses).
- [ ] **GFX-03**: Build a reusable `<CharacterPortrait>` medallion component (`src/ui/art/CharacterPortrait.svelte`) supporting circular framed bust/expression avatars (`triumphant` confetti, `facepalm`, `panicked` blue-forehead gradient + twin sweat drops, `scheming`, `confident`, `stressed`).

### Inauguration Look Picker, Oval Office Scenes & Advisor NPCs (Phase 40)

- [ ] **SCENE-01**: Add a selectable 4-option Presidential Look / Avatar picker on `src/screens/NewGame.svelte` (persisted in `GameOptions`, `Session`, `SaveFile`, and URL hash) plus an animated White House portico inauguration banner (`.design-targets/g-newgame.png`) that shifts to dark oxblood/scheming when Evil Mode is toggled.
- [ ] **SCENE-02**: Upgrade `src/ui/art/OvalOfficeScene.svelte` with a high-back leather executive chair, Evil Mode banker's-lamp cone of light + cash stacks on the Resolute Desk + animated cash-fanning hands (`.design-targets/g-evil.png`), and reactive Advisor NPC portrait badges on `src/screens/OvalOffice.svelte`.

### Reactive Congressional Bloc Leaders & Household Citizen NPCs (Phase 41)

- [ ] **NPC-01**: Add live mood- and pose-reactive Congressional Bloc Leaders in `src/ui/art/Hemicycle.svelte` and `src/screens/Congress.svelte` (`crossed` + scowl when whip share `< 30%`, pensive when undecided, `wave`/`celebrate` + bounce pulse when a deal flips their bloc).
- [ ] **NPC-02**: Add dedicated Citizen NPC portraits for the 4 Household Personas (`Nurse`, `Auto/Grid Worker`, `Retiree`, `Small Business Owner`) + custom families in `src/ui/HouseholdCard.svelte`, `src/ui/HouseholdModal.svelte`, and `src/screens/Budget.svelte` whose expressions react live to `netMonthlyDelta`.

### Dramatic Modal Vignettes — Bully Pulpit, Broadcast Election Night & Senate Trial (Phase 42)

- [ ] **VIGNETTE-01**: Build an animated Presidential Bully Pulpit Podium scene in `src/ui/SpeechModal.svelte` with dual microphones, camera flashes, and target audience silhouettes (`General Public`, `Congress`, `Business Leaders`).
- [ ] **VIGNETTE-02**: Add a Live Broadcast News Anchor + You-vs-Opponent EV portrait medallions in `src/ui/ElectionNightModal.svelte` (`.design-targets/g-election.png`) and state voter mood portraits in `src/screens/Voters.svelte`.
- [ ] **VIGNETTE-03**: Add a dramatic Senate Trial / Chief Justice verdict scene in `src/ui/ImpeachmentModal.svelte`, Historian/Advisor header badge in `src/ui/TurnReport.svelte`, and Presidential Legacy / Kleptocrat Heist vignette in `src/screens/EndScreen.svelte`.

### Quarterly Mandate & Task Force RNG Draft — Brotato Shop Loop (Phase 43)

- [ ] **PERK-01**: Build a pure deterministic Mandate & Task Force RNG draft engine (`src/engine/perks.ts`, dedicated `rng.ts` stream 21) that rolls 3 tiered cards (`Tier I Routine` → `Tier IV Historic Mandate`) per eligible quarter with registered `coefficients.ts` parameters, reroll/lock state in `GameState`, and causal `Ledger` traces.
- [ ] **PERK-02**: Build an interactive *Brotato*-style **White House Task Force / Mandate Draft** modal (`src/ui/PerkDraftModal.svelte`) with `👍 Upside` / `⚠️ The Catch` trade-off pills, **Spend Clout to Reroll**, **Lock Card for Next Quarter**, **Skip for +Clout**, and a `"Classic Sim (No Perks)"` toggle on `src/screens/NewGame.svelte` (`GameOptions.classicSim`).
- [ ] **PERK-03**: Author a curated 24-card nonpartisan Presidential Task Force & Institutional Doctrine catalog (`src/content/perks.ts`) spanning fiscal, industrial, regulatory, judicial, diplomatic, and populist playstyles with Plain-Talk + Policy-Wonk dual copy and verified civic notes.

### Policy Doctrine Synergy Tags & How Many Dudes? Chain-Reaction Engine (Phase 44)

- [ ] **SYN-01**: Tag Executive Orders, Budget packages, Trade pacts/tariffs, Social policies, Reforms, and drafted Task Forces with **Policy Doctrine Families** (`🏗️ Industrial`, `🌱 Green Transition`, `🛡️ National Security`, `📈 Main Street`, `⚖️ Institutionalist`, `🌐 Globalist`) and surface tag badges on action cards.
- [ ] **SYN-02**: Implement *How Many Dudes?*-style **Doctrine Set Thresholds (`2 / 4 / 6`) & Chain-Reaction Triggers** (`src/engine/synergies.ts`) where stacking families unlocks multiplicative institutional flywheels and event-driven chain triggers (*"Action A triggers Bonus B"*) recorded in `report.trace` with `src/content/text/why.ts` explanations.
- [ ] **SYN-03**: Build a live **Administration Doctrine & Synergy Bar** (`src/ui/SynergyBar.svelte`) on `src/screens/OvalOffice.svelte` and `src/ui/TurnReport.svelte` with cascading combo popups (`+Clout`, `+Prosperity`, `+$B Stash`) that fire sequentially when chain triggers resolve (respecting `Calm mode`).

### Evil Mode Heist Relics, Presidential Archetypes & Mastery Stars (Phase 45)

- [ ] **HEIST-01**: Author the Evil Mode **"Heist Relics & Fixer Syndicate"** catalog and draft pool (`🏝️ Shell Network`, `🕵️ Fixer Ring`, `🏛️ Captured Regulators`) with corrupt multiplicative chain triggers that boost offshore `$B` skims and launder Heat when stacking crony levers.
- [ ] **HEIST-02**: Add the Evil Mode dark-market draft skin in `src/ui/PerkDraftModal.svelte` and Syndicate combo breakdowns in the `src/screens/EndScreen.svelte` Kleptocratic Heist Review.
- [ ] **ARCH-01**: Add selectable **Presidential Playstyle Archetypes** on `src/screens/NewGame.svelte` (`src/content/archetypes.ts`: *The Deal-Maker*, *The Technocrat*, *The Populist Firebrand*, *The Beltway Insider*, *The Constitutional Purist*) with rule-warping passive modifiers, starting Doctrine relics, and `SaveFile` / URL hash persistence.
- [ ] **ARCH-02**: Implement persistent `localStorage` **Silver & Gold Mastery Stars** (`src/app/mastery.ts`) tracked per Archetype and Scenario (Silver = win reelection & beat autopilot; Gold = beat autopilot by `>= +5.0` or escape Evil Mode with `>= $20B`), surfaced on `NewGame.svelte` and `EndScreen.svelte`.

### Balance Calibration, Multi-Viewport Computer-Vision Audit & Determinism Gate (Phase 46)

- [ ] **AUDIT-01**: Conduct a Playwright + computer-vision visual audit across all screens and modals at `1376×768` and `1280×720` with before/after verification, zero outer viewport scroll (`scrollHeight <= clientHeight`), and `Calm mode` / `prefers-reduced-motion` animation compliance.
- [ ] **AUDIT-02**: Verify 100-seed Monte Carlo balance across both Standard (with Perks/Synergies) and Classic Sim modes (`sensible - nothing` in `[2, 10]`, party neutrality `<= 5 pp`, no degenerate single-tag exploit), Flesch-Kincaid reading grade ≤ 9.0, 0 axe violations, and 8/8 cross-browser determinism hashes.

## Future Requirements

- Custom community Doctrine / Perk deck builder via JSON export/import
- Endless "Constitutional Crisis / Century Mode" beyond Turn 32 for extreme incremental scaling experiments

## Out of Scope

- Mandatory tutorials or pop-up quizzes that block turn progression — all progressive disclosure and perk drafts remain fast, skippable, and zero-friction
- Partisan blame framing — all Task Forces, Doctrines, Archetypes, and Evil Mode Heist Relics critique institutional incentives and trade-offs, never political parties or real officeholders (`GR-20`, `GR-21`)
- Unbounded exponential math that breaks macro indicators outside plausible civic ranges — all synergy and chain-trigger bonuses are bounded by `LIMITS` and `coefficients.ts` caps

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
| PERK-01 | Phase 43 | Pending |
| PERK-02 | Phase 43 | Pending |
| PERK-03 | Phase 43 | Pending |
| SYN-01 | Phase 44 | Pending |
| SYN-02 | Phase 44 | Pending |
| SYN-03 | Phase 44 | Pending |
| HEIST-01 | Phase 45 | Pending |
| HEIST-02 | Phase 45 | Pending |
| ARCH-01 | Phase 45 | Pending |
| ARCH-02 | Phase 45 | Pending |
| AUDIT-01 | Phase 46 | Pending |
| AUDIT-02 | Phase 46 | Pending |

**Coverage:**

- v1.0 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓
