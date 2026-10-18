# Roadmap: govSim

## Milestones

- 🚧 **v1.0 High-Craft Character Art, Living Animations & Incremental Mandate Synergies** — Phases 39-46 (in progress)
- ✅ **v0.9 Progressive Disclosure, Plain-Talk Civics, Trade-Off Clarity & Gameplay Balance** — Phases 34-38 (shipped 2026-10-16)
- ✅ **v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy** — Phases 30-33 (shipped 2026-10-14)
- ✅ **v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director** — Phases 25-29 (shipped 2026-10-14)
- ✅ **v0.6 Completeness, Advisor Agency & Scenarios** — Phases 21-24 (shipped 2026-10-14)
- ✅ **v0.5 Satirical "Evil Mode"** — Phases 17-20 (shipped 2026-10-13)
- ✅ **v0.4 Foreign Policy & International Crises** — Phases 13-16 (shipped 2026-10-12)
- ✅ **v0.3 Social Policy & Domestic Reform** — Phases 9-12 (shipped 2026-10-12)
- ✅ **v0.2 Playable First Term** — Phases 1-8 (shipped 2026-10-12)

## Phases

### v1.0 High-Craft Character Art, Living Animations & Incremental Mandate Synergies (Phases 39-46)

- [ ] **Phase 39: High-Craft SVG Character Anatomy, Poses & Portrait Medallions** — Upgrade `Character.svelte`, `FedPortrait.svelte`, and `CourtBench.svelte` with sculpted facial/neck anatomy, back-hair layers, articulated poses (`hips`, `crossed`, `celebrate`, `facepalm`, `cash`, `podium`), occupational outfits/props, and the reusable `<CharacterPortrait>` medallion component (`GFX-01`, `GFX-02`, `GFX-03`).
- [ ] **Phase 40: Inauguration Look Picker, Oval Office Scenes & Advisor NPCs** — Add a 4-option Presidential Look picker and animated White House portico inauguration banner on `NewGame.svelte`, upgrade `OvalOfficeScene.svelte` with the leather executive chair and Evil Mode banker's-lamp cash-counting desk, and add reactive Advisor NPC portrait badges on `OvalOffice.svelte` (`SCENE-01`, `SCENE-02`).
- [ ] **Phase 41: Reactive Congressional Bloc Leaders & Household Citizen NPCs** — Add live whip-reactive Congressional Bloc Leaders in `Hemicycle.svelte` / `Congress.svelte` and `netMonthlyDelta`-reactive Citizen NPC portraits for the 4 Household Personas + custom families in `HouseholdCard.svelte`, `HouseholdModal.svelte`, and `Budget.svelte` (`NPC-01`, `NPC-02`).
- [ ] **Phase 42: Dramatic Modal Vignettes — Bully Pulpit, Broadcast Election Night & Senate Trial** — Build the animated Presidential Bully Pulpit Podium scene in `SpeechModal.svelte`, Broadcast News Anchor + You-vs-Opponent EV medallions in `ElectionNightModal.svelte` / `Voters.svelte`, and Senate Trial / Legacy vignettes in `ImpeachmentModal.svelte`, `TurnReport.svelte`, and `EndScreen.svelte` (`VIGNETTE-01`, `VIGNETTE-02`, `VIGNETTE-03`).
- [ ] **Phase 43: Quarterly Mandate & Task Force RNG Draft — Brotato Shop Loop** — Build the pure deterministic Mandate & Task Force RNG draft engine (`src/engine/perks.ts`, dedicated `rng.ts` stream 21), the 24-card Presidential Task Force catalog (`src/content/perks.ts`), and the interactive `PerkDraftModal.svelte` with `👍/⚠️` trade-offs, Clout rerolls, card locking, and the `"Classic Sim (No Perks)"` toggle (`PERK-01`, `PERK-02`, `PERK-03`).
- [ ] **Phase 44: Policy Doctrine Synergy Tags & How Many Dudes? Chain-Reaction Engine** — Tag presidential actions with 6 Policy Doctrine Families, implement `2/4/6` set bonuses and event-driven chain-reaction triggers (`src/engine/synergies.ts`) recorded in `report.trace`, and build the live `SynergyBar.svelte` with cascading combo popups (`SYN-01`, `SYN-02`, `SYN-03`).
- [ ] **Phase 45: Evil Mode Heist Relics, Presidential Archetypes & Mastery Stars** — Author the Evil Mode Heist Relics & Fixer Syndicate pool and dark-market draft skin, add 5 selectable Presidential Playstyle Archetypes with rule-warping passives + starting relics on `NewGame.svelte`, and implement persistent Silver & Gold Mastery Stars (`HEIST-01`, `HEIST-02`, `ARCH-01`, `ARCH-02`).
- [ ] **Phase 46: Balance Calibration, Multi-Viewport Computer-Vision Audit & Determinism Gate** — Conduct a Playwright + computer-vision visual audit across all screens/modals at `1376×768` and `1280×720` with zero outer scroll and `Calm mode` compliance, and verify 100-seed Monte Carlo balance (Standard & Classic Sim), Flesch-Kincaid grade ≤ 9.0, 0 axe violations, and 8/8 cross-browser determinism (`AUDIT-01`, `AUDIT-02`).

---

## Phase Details

### Phase 39: High-Craft SVG Character Anatomy, Poses & Portrait Medallions

- **Goal**: Elevate character anatomy, facial expressions, outfits, and poses from basic geometric shapes into expressive Americana editorial-poster illustrations with a reusable circular medallion component.
- **Requirements**: GFX-01, GFX-02, GFX-03
- **Success Criteria**:
  1. `Character.svelte`, `FedPortrait.svelte`, and `CourtBench.svelte` render sculpted neck/jawline shading, upper eyelids + gaze catchlights, multi-layer mouths, back-hair layers (`long`, `bob`, `afro`, `bald` horseshoe), and an enamel US flag lapel pin using design tokens only.
  2. `Character.svelte` supports articulated poses (`hips`, `crossed`, `celebrate`, `facepalm`, `cash`, `podium`) and occupational outfits/props (`scrubs` + stethoscope, `hardhat` + safety vest, `blazer` + broadcast earpiece/mic, `cardigan` + glasses) with separated SVG positioning `<g>` and inner CSS animation `<g>`.
  3. `CharacterPortrait.svelte` renders circular framed bust/expression medallions supporting `triumphant` confetti, `facepalm`, `panicked` blue-forehead gradient + twin sweat drops, `scheming`, `confident`, and `stressed` moods.

### Phase 40: Inauguration Look Picker, Oval Office Scenes & Advisor NPCs

- **Goal**: Let players customize their President's look at New Game beneath an animated White House inauguration banner, upgrade the Oval Office stage (including Evil Mode's banker's-lamp cash-counting scene), and add reactive Advisor NPC portraits.
- **Requirements**: SCENE-01, SCENE-02
- **Success Criteria**:
  1. `NewGame.svelte` offers a 4-option Presidential Look / Avatar picker (persisted across `GameOptions`, `Session`, `SaveFile`, and URL hash) and an animated White House portico inauguration banner (`.design-targets/g-newgame.png`) that shifts to dark oxblood/scheming when Evil Mode is toggled.
  2. `OvalOfficeScene.svelte` renders a high-back leather executive chair and, in Evil Mode, a banker's-lamp cone of light, cash stacks on the Resolute Desk, and animated cash-fanning hands (`.design-targets/g-evil.png`), while `OvalOffice.svelte` displays reactive Advisor NPC portrait badges.

### Phase 41: Reactive Congressional Bloc Leaders & Household Citizen NPCs

- **Goal**: Bring Congress and Household impact cards to life with live mood- and pose-reactive Bloc Leader and Citizen NPC portraits.
- **Requirements**: NPC-01, NPC-02
- **Success Criteria**:
  1. `Hemicycle.svelte` and `Congress.svelte` render Congressional Bloc Leaders whose poses and expressions react live to whip share and staged deals (`crossed` + scowl when `< 30%`, pensive when undecided, `wave`/`celebrate` + bounce pulse when a deal flips their bloc).
  2. `HouseholdCard.svelte`, `HouseholdModal.svelte`, and `Budget.svelte` render occupational Citizen NPC portraits for the 4 Household Personas (`Nurse`, `Auto/Grid Worker`, `Retiree`, `Small Business Owner`) + custom families whose facial expressions react live to `netMonthlyDelta`.

### Phase 42: Dramatic Modal Vignettes — Bully Pulpit, Broadcast Election Night & Senate Trial

- **Goal**: Give every high-stakes presidential moment (`SpeechModal`, `ElectionNightModal`, `Voters`, `ImpeachmentModal`, `TurnReport`, `EndScreen`) an expressive stage vignette matching `.design-targets/`.
- **Requirements**: VIGNETTE-01, VIGNETTE-02, VIGNETTE-03
- **Success Criteria**:
  1. `SpeechModal.svelte` renders an animated Presidential Bully Pulpit Podium scene with dual microphones, camera flashes, and target audience silhouettes (`General Public`, `Congress`, `Business Leaders`).
  2. `ElectionNightModal.svelte` renders a Live Broadcast News Anchor + You-vs-Opponent EV portrait medallions (`.design-targets/g-election.png`), and `Voters.svelte` displays state voter mood portraits.
  3. `ImpeachmentModal.svelte` renders a Senate Trial / Chief Justice verdict scene, `TurnReport.svelte` includes a Historian/Advisor header badge, and `EndScreen.svelte` renders a Presidential Legacy / Kleptocrat Heist vignette.

### Phase 43: Quarterly Mandate & Task Force RNG Draft — Brotato Shop Loop

- **Goal**: Introduce a deterministic *Brotato*-style between-quarter **White House Task Force / Mandate Draft** where players pick, reroll, or lock tiered perks with explicit `👍 Upside` / `⚠️ The Catch` trade-offs (or toggle `"Classic Sim"` for purist classroom runs).
- **Requirements**: PERK-01, PERK-02, PERK-03
- **Success Criteria**:
  1. `src/engine/perks.ts` deterministically rolls 3 tiered Mandate/Task Force cards (`Tier I Routine` → `Tier IV Historic Mandate`) on dedicated `rng.ts` stream 21 without perturbing macro shocks or autopilot streams, applying registered `coefficients.ts` modifiers and recording named `Ledger` trace terms.
  2. `src/ui/PerkDraftModal.svelte` lets players draft 1 of 3 cards with `<TradeoffPill>` `👍 Upside` / `⚠️ The Catch` badges, spend Clout to **Reroll**, **Lock** a card for next quarter, or **Skip for +Clout**, while `NewGame.svelte` offers a `"Classic Sim (No Perks)"` toggle (`GameOptions.classicSim`).
  3. `src/content/perks.ts` provides 24 nonpartisan Presidential Task Force & Institutional Doctrine cards across fiscal, industrial, regulatory, judicial, diplomatic, and populist playstyles with Plain-Talk + Policy-Wonk dual copy and verified civic notes.

### Phase 44: Policy Doctrine Synergy Tags & How Many Dudes? Chain-Reaction Engine

- **Goal**: Add *How Many Dudes?*-style multiplicative engine-building through 6 Policy Doctrine Families, `2 / 4 / 6` set bonuses, event-driven chain-reaction triggers (*"Action A triggers Bonus B"*), and cascading combo popups.
- **Requirements**: SYN-01, SYN-02, SYN-03
- **Success Criteria**:
  1. Executive Orders, Budget packages, Trade pacts/tariffs, Social policies, Reforms, and drafted Task Forces carry typed **Policy Doctrine Family** tags (`🏗️ Industrial`, `🌱 Green Transition`, `🛡️ National Security`, `📈 Main Street`, `⚖️ Institutionalist`, `🌐 Globalist`) surfaced as scannable badges on action cards.
  2. `src/engine/synergies.ts` computes active `2 / 4 / 6` Doctrine set thresholds and resolves deterministic chain-reaction triggers (e.g., striking a Congress deal, passing a bill, or resolving a crisis triggers secondary bonuses per active Doctrine/Perk), logging every bonus in `report.trace` and `src/content/text/why.ts`.
  3. `src/ui/SynergyBar.svelte` displays active Doctrine counts and set bonuses on `OvalOffice.svelte` and `TurnReport.svelte`, firing sequential cascading combo popups (`+Clout`, `+Prosperity`, `+$B Stash`) when chain triggers resolve while respecting `Calm mode`.

### Phase 45: Evil Mode Heist Relics, Presidential Archetypes & Mastery Stars

- **Goal**: Extend the roguelite draft and synergy engine to Evil Mode with corrupt Heist Relics & Fixer combos, add 5 rule-warping Presidential Playstyle Archetypes at New Game, and reward replayability with persistent Silver & Gold Mastery Stars.
- **Requirements**: HEIST-01, HEIST-02, ARCH-01, ARCH-02
- **Success Criteria**:
  1. Evil Mode swaps in a dedicated **"Heist Relics & Fixer Syndicate"** draft pool (`🏝️ Shell Network`, `🕵️ Fixer Ring`, `🏛️ Captured Regulators`) with corrupt chain triggers that multiply offshore `$B` extraction and launder Heat, rendered with a dark-market oxblood/gold skin in `PerkDraftModal.svelte` and summarized in `EndScreen.svelte`.
  2. `NewGame.svelte` lets players choose from 5 **Presidential Playstyle Archetypes** (`src/content/archetypes.ts`: *The Deal-Maker*, *The Technocrat*, *The Populist Firebrand*, *The Beltway Insider*, *The Constitutional Purist*) with rule-warping passive modifiers and starting Doctrine relics persisted in `SaveFile` and URL replay hashes.
  3. `src/app/mastery.ts` tracks persistent `localStorage` **Silver & Gold Mastery Stars** per Archetype and Scenario (Silver = win reelection & beat autopilot; Gold = beat autopilot by `>= +5.0` or escape Evil Mode with `>= $20B`) and displays star badges on `NewGame.svelte` and `EndScreen.svelte`.

### Phase 46: Balance Calibration, Multi-Viewport Computer-Vision Audit & Determinism Gate

- **Goal**: Calibrate synergy and perk numbers so no single tag or archetype creates a degenerate exploit, and audit every screen and modal across `1376×768` and `1280×720` viewports via Playwright and computer vision.
- **Requirements**: AUDIT-01, AUDIT-02
- **Success Criteria**:
  1. Playwright + computer-vision audit verifies all screens and modals at `1376×768` and `1280×720` in Day, Evil, Plain Talk, Policy Wonk, and Calm modes with zero outer viewport scrolling (`scrollHeight <= clientHeight`) and zero visual clipping or overlap.
  2. 100-seed Monte Carlo balance harness passes in both Standard (with Perks/Synergies) and Classic Sim modes (`sensible - nothing` in `[2, 10]`, party neutrality `<= 5 pp`, no degenerate single-tag strategy beating sensible play), Flesch-Kincaid reading grade ≤ 9.0, 0 axe violations, and 8/8 cross-browser determinism hashes.

---

<details>
<summary>✅ v0.9 Progressive Disclosure, Plain-Talk Civics, Trade-Off Clarity & Gameplay Balance (Phases 34-38) — SHIPPED 2026-10-16</summary>

- [x] Phase 34: Progressive Disclosure Architecture, Vocabulary Toggle & Trade-Off Components (1/1 plan) — completed 2026-10-16
- [x] Phase 35: De-Jargonizing Content Catalogs with Witty Plain Talk & `👍 / ⚠️` Trade-Offs (1/1 plan) — completed 2026-10-16
- [x] Phase 36: Surfacing Decision Trade-Offs & Visual Meters Across Act Screens (1/1 plan) — completed 2026-10-16
- [x] Phase 37: Kitchen-Table Clarity on Hub, Diagnostic & Crisis Screens (1/1 plan) — completed 2026-10-16
- [x] Phase 38: Presidential Trade-Off Balance Audit, Readability Gate & Multi-Viewport Verification (1/1 plan) — completed 2026-10-16

Full phase execution history and plans archived to [.planning/milestones/v0.9-ROADMAP.md](milestones/v0.9-ROADMAP.md).
</details>

<details>
<summary>✅ v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy (Phases 30-33) — SHIPPED 2026-10-14</summary>

- [x] Phase 30: Expanded 12-Card Myth Catalog, Bottleneck Predictions & Actionable Pivot Schema (1/1 plans) — completed 2026-10-14
- [x] Phase 31: Interactive Reality-Check Modal & 1-Click Tactical Pivots (1/1 plans) — completed 2026-10-14
- [x] Phase 32: Tempting "Mirage Levers" Across Screens & Contextual Blame Triggers (1/1 plans) — completed 2026-10-14
- [x] Phase 33: "Debunk vs. Spin" Gameplay Mechanics & EndScreen Civic Dossier (1/1 plans) — completed 2026-10-14

Full phase execution history and plans archived to [.planning/milestones/v0.8-ROADMAP.md](milestones/v0.8-ROADMAP.md).
</details>

<details>
<summary>✅ v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director (Phases 25-29) — SHIPPED 2026-10-14</summary>

- [x] Phase 25: Dramatic SVG Art Overhaul & Reactive Scenes (2/2 plans) — completed 2026-10-14
- [x] Phase 26: Visual Flair, Micro-Interactions, Satirical Wit & Calm Mode (2/2 plans) — completed 2026-10-14
- [x] Phase 27: Year-1 Progressive Onboarding & Guided Turn Flow (1/1 plan) — completed 2026-10-14
- [x] Phase 28: "Show Your Work" Model Inspector & Citation Audit (1/1 plan) — completed 2026-10-14
- [x] Phase 29: Free AI Director, OpenRouter `:free` Auto-Routing & Living World Variance (3/3 plans) — completed 2026-10-14

Full phase execution history and plans archived to [.planning/milestones/v0.7-ROADMAP.md](milestones/v0.7-ROADMAP.md).
</details>

<details>
<summary>✅ v0.6 Completeness, Advisor Agency & Scenarios (Phases 21-24) — SHIPPED 2026-10-14</summary>

- [x] Phase 21: Complete the Learn Loop & Interactive Explainers (3/3 plans) — completed 2026-10-13
- [x] Phase 22: Smart Advisor Plays, Auto-Whip & Live Household Budgeting (3/3 plans) — completed 2026-10-13
- [x] Phase 23: Pacing Controls — Fast-Forward & Staged Decisions Tray (1/1 plan) — completed 2026-10-13
- [x] Phase 24: Replayable Starting Scenarios (1/1 plan) — completed 2026-10-13

Full phase execution history and plans archived to [.planning/milestones/v0.6-ROADMAP.md](milestones/v0.6-ROADMAP.md).
</details>

<details>
<summary>✅ v0.5 Satirical "Evil Mode" (Phases 17-20) — SHIPPED 2026-10-13</summary>

- [x] Phase 17: Evil Mode Engine, Offshore Stash & Heat Meter (4/4 plans) — completed 2026-10-12
- [x] Phase 18: Corrupt Executive Levers & Cronyism (4/4 plans) — completed 2026-10-12
- [x] Phase 19: Institutional Backlash & Impeachment Trial (4/4 plans) — completed 2026-10-13
- [x] Phase 20: Satirical UI Reskin & Heist End Screens (4/4 plans) — completed 2026-10-13

Full phase execution history and plans archived to [.planning/milestones/v0.5-ROADMAP.md](milestones/v0.5-ROADMAP.md).
</details>

<details>
<summary>✅ v0.4 Foreign Policy & International Crises (Phases 13-16) — SHIPPED 2026-10-12</summary>

- [x] Phase 13: Geopolitical Crises Deck & Resolution Mechanics (4/4 plans) — completed 2026-10-12
- [x] Phase 14: Foreign Policy & Sanctions Levers (4/4 plans) — completed 2026-10-12
- [x] Phase 15: Security Index & Macro Feedback Engine (4/4 plans) — completed 2026-10-12
- [x] Phase 16: International Trade & Tariffs Screen (4/4 plans) — completed 2026-10-12

Full phase execution history and plans archived to [.planning/milestones/v0.4-ROADMAP.md](milestones/v0.4-ROADMAP.md).
</details>

<details>
<summary>✅ v0.3 Social Policy & Domestic Reform (Phases 9-12) — SHIPPED 2026-10-12</summary>

- [x] Phase 9: Domestic Social Policy Levers (4/4 plans) — completed 2026-10-12
- [x] Phase 10: Demographic & Regional Distribution (4/4 plans) — completed 2026-10-12
- [x] Phase 11: Structural Government Reform & Amendments (4/4 plans) — completed 2026-10-12
- [x] Phase 12: Household Impact Card & Balance (4/4 plans) — completed 2026-10-12

Full phase execution history and plans archived to [.planning/milestones/v0.3-ROADMAP.md](milestones/v0.3-ROADMAP.md).
</details>

<details>
<summary>✅ v0.2 Playable First Term (Phases 1-8) — SHIPPED 2026-10-12</summary>

- [x] Phase 1: Engine foundations (7/7 plans) — completed 2026-10-12
- [x] Phase 2: Saves, guardrails & continuous deploy (6/6 plans) — completed 2026-10-12
- [x] Phase 3: Turn report & Economy (5/5 plans) — completed 2026-10-12
- [x] Phase 4: Events & crises (5/5 plans) — completed 2026-10-12
- [x] Phase 5: Your Powers (5/5 plans) — completed 2026-10-12
- [x] Phase 6: Voters & Electoral College (4/4 plans) — completed 2026-10-12
- [x] Phase 7: Election & end of term (4/4 plans) — completed 2026-10-12
- [x] Phase 8: Balance, hardening & release (4/4 plans) — completed 2026-10-12

Full phase execution history and plans archived to [.planning/milestones/v0.2-ROADMAP.md](milestones/v0.2-ROADMAP.md).
</details>
