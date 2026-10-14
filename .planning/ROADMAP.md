# Roadmap: govSim

## Milestones

- 🚧 **v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy** — Phases 30-33 (in progress)
- ✅ **v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director** — Phases 25-29 (shipped 2026-10-14)
- ✅ **v0.6 Completeness, Advisor Agency & Scenarios** — Phases 21-24 (shipped 2026-10-14)
- ✅ **v0.5 Satirical "Evil Mode"** — Phases 17-20 (shipped 2026-10-13)
- ✅ **v0.4 Foreign Policy & International Crises** — Phases 13-16 (shipped 2026-10-12)
- ✅ **v0.3 Social Policy & Domestic Reform** — Phases 9-12 (shipped 2026-10-12)
- ✅ **v0.2 Playable First Term** — Phases 1-8 (shipped 2026-10-12)

## Phases

### 🚧 v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy (Phases 30-33)

- [ ] **Phase 30: Expanded 12-Card Myth Catalog, Bottleneck Predictions & Actionable Pivot Schema** — Expand `src/content/myths.ts` to 12 spectrum-balanced cards (`|left - right| <= 1`), add 2-option prediction prompts and tempting `mirageLabel` copy, and define typed `realLeverActions` pivot targets (`DECK-01`, `DECK-02`, `PIVOT-01`).
- [ ] **Phase 31: Interactive Reality-Check Modal & 1-Click Tactical Pivots** — Upgrade `MythModal.svelte` with optional 1-click bottleneck prediction, tactile `MYTH BUSTED` stamp-slam animation, zero-friction skip/dismiss, and clickable `realLeverActions` buttons that stage levers and jump to target screens (`MYTH-03`, `MYTH-04`, `PIVOT-02`).
- [ ] **Phase 32: Tempting "Mirage Levers" Across Screens & Contextual Blame Triggers** — Place viewport-safe populist "Mirage Lever" buttons across `Economy`, `Budget`, `Congress`, `Powers`, `Trade`, and `Voters` screens, and surface contextual "Public Blame / Myth Check" suggestions in `OvalOffice` briefings (`MYTH-01`, `MYTH-02`).
- [ ] **Phase 33: "Debunk vs. Spin" Gameplay Mechanics & EndScreen Civic Dossier** — Add pure-engine `spinMyth` support (+Approval rally, −Social Trust, +Evil Heat) with registered coefficients and causal traces, wire the `"Spin This Myth"` button in `MythModal.svelte`, and add a Civic Mastery Dossier to `EndScreen.svelte` (`SPIN-01`, `SPIN-02`).

### Phase Details (v0.8)

#### Phase 30: Expanded 12-Card Myth Catalog, Bottleneck Predictions & Actionable Pivot Schema
- **Goal**: Expand the civics myth deck to cover every core policy screen with 12 spectrum-balanced cards, active prediction prompts, and actionable tactical pivot descriptors.
- **Requirements**: `DECK-01`, `DECK-02`, `PIVOT-01`
- **Success Criteria**:
  1. `MYTHS_CATALOG` in `src/content/myths.ts` contains 12 sourced cards with `|count(left) - count(right)| <= 1` (`4 left`, `4 right`, `4 both`), covering `veto_line_item`, `popular_vote_mandate`, `immigration_crime_budget`, and `scotus_instant_reversal`.
  2. Every `MythCard` includes a `predictionPrompt` (question, 2 options, `correctIndex`, refutation feedback), a `mirageLabel`, and typed `realLeverActions` pointing to valid `ScreenId`s and `Session` draft actions.
  3. All new myth strings pass the automated Flesch-Kincaid reading grade ≤ 9.0, ≤ 20 words/sentence, and party-blind/banned-politician content gates.

#### Phase 31: Interactive Reality-Check Modal & 1-Click Tactical Pivots
- **Goal**: Turn `MythModal.svelte` from a static reading popup into an interactive Reality-Check Dossier with optional prediction-error challenges, tactile stamp animations, and 1-click pivots to real levers.
- **Requirements**: `MYTH-03`, `MYTH-04`, `PIVOT-02`
- **Success Criteria**:
  1. Opening a myth card presents a 1-click "Call the Bluff / Spot the Bottleneck" prediction challenge that reveals refutation feedback and triggers a tactile `MYTH BUSTED` stamp-slam animation (disabled when `calmMode` or `prefers-reduced-motion` is active).
  2. Players can click `"Skip to Reality"` or `"Got It"` at any time without being forced to answer the quiz.
  3. Clicking any `realLeverActions` button inside `MythModal.svelte` marks the myth examined, stages/opens the linked lever in `Session`, closes the modal, and navigates directly to the target screen.

#### Phase 32: Tempting "Mirage Levers" Across Screens & Contextual Blame Triggers
- **Goal**: Surface myths intrinsically at the moment of player intent via tempting "Mirage Lever" buttons on policy screens and dynamic voter-blame briefing cards in the Oval Office.
- **Requirements**: `MYTH-01`, `MYTH-02`
- **Success Criteria**:
  1. `Economy.svelte`, `Budget.svelte`, `Congress.svelte`, `Powers.svelte`, `Trade.svelte`, and `Voters.svelte` each display a tempting "Mirage Lever" control (plus wired `onOpenMyth` on `Congress.svelte`) that opens the corresponding `MythModal` when clicked, with zero outer viewport scrolling at `1376×768` and `1280×720`.
  2. `generateBriefing` in `src/content/briefing.ts` surfaces a contextual myth-check suggestion on `OvalOffice.svelte` when inflation, unemployment, or deficit indicators spike and the corresponding myth has not yet been examined.

#### Phase 33: "Debunk vs. Spin" Gameplay Mechanics & EndScreen Civic Dossier
- **Goal**: Give myth cards strategic teeth by letting players choose between Debunking a myth (+5 Clout) or Spinning it on TV (+Approval rally, −Social Trust, +Heat in Evil Mode), tracked through the EndScreen Civic Mastery Dossier.
- **Requirements**: `SPIN-01`, `SPIN-02`
- **Success Criteria**:
  1. `resolvePowerDecisions` in `src/engine/powers.ts` resolves `powers.spinMyth` using registered coefficients (`C.mythSpinApprovalBoost`, `C.mythSpinTrustPenalty`, `C.mythSpinHeatDelta`), emits `'event:myth_spin'` ledger modifiers with `why.ts` copy, validates in `parseSave`, and preserves 8/8 golden determinism hashes.
  2. First-view `MythModal.svelte` offers both `"Debunk Myth (+5 Clout)"` and `"Spin This Myth (+2% Approval, −Trust)"` actions, and `EndScreen.svelte` displays the player's Myths Busted vs. Myths Spun record.

---

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
