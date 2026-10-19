# Requirements: govSim v1.3

**Defined:** 2026-10-18
**Milestone:** v1.3 Beat-the-Baseline Strategy Coach, Playbook Variety, Concept-Art Folder/Rosette GUI & Full-Surface CV Flywheel
**Core Value:** A player can make real presidential tradeoffs against an honest, explainable model of the current US, see immediately how to beat "doing nothing" (`autopilot`) across multiple fun strategic playbooks, and experience an authentic vintage Americana civics poster UI verified across 8 core surfaces.

## v1.3 Requirements

### Phase 56: 8-Surface CV Flywheel, Layered Crisis/Report Plates & Concept-Art Folder/Medal GUI (`CV-FULL` & `GUI-ART`)

- [x] **CV-FULL-01**: Expand `scripts/cv-flywheel.ts` to capture and compare all 8 core surfaces (`newgame`, `oval-day`, `oval-evil`, `economy`, `voters`, `powers`, `congress`, `budget`) across `1376×768` and `1280×720` (16 captures per stage), with comparison labels placed above screenshots so the top-left HUD (`Approval`, `Clout`) is never occluded.
- [x] **GUI-ART-01**: Generate and layer vintage Americana environment plates (`public/assets/environments/crisis-newsroom-bg.jpg` matching `.design-targets/g-crisis.png`, and `public/assets/environments/report-oval-bg.jpg` matching `.design-targets/g-report.png`) into `ReporterScene.svelte` / `CrisisModal.svelte` and `TurnReport.svelte`.
- [x] **GUI-ART-02**: Upgrade the left navigation rail (`src/ui/Rail.svelte`) to authentic **Americana Manila Folder Tabs** with stepped top-left folder ears, group header badges (`HOME`, `SEE`, `ACT`), and a vintage halftone dot-matrix rail texture (`uikit.png`, `g-economy.png`, `g-voters.png`).
- [x] **GUI-ART-03**: Upgrade `src/ui/StatusBar.svelte` with hanging navy ribbon tails under the Approval medal circle (`g-voters.png`, `g-crisis.png`, `uikit.png`) and an interactive **`vs. Autopilot` Score Coach trigger** under the center ribbon.

### Phase 57: Live "Beat the Baseline" Score-Delta Preview Engine & Interactive 8-Component Strategy Coach (`BEAT`)

- [x] **BEAT-01**: Build a pure, deterministic lookahead helper `src/app/beat-baseline.ts` (`previewDraftVsBaseline`, `diagnoseBaselineGaps`) that compares the player's staged `draft` against doing nothing (`autopilot`) over a 1-turn + 4-turn + 10-year legacy horizon, returning `nowDelta`, `laterDelta`, `totalDelta`, and the 8-component **You vs. Autopilot** gap breakdown (`Median Income 25%`, `Jobs 15%`, `Inflation 10%`, `Debt/GDP 15%`, `Life Expectancy 10%`, `Equality 10%`, `Security 10%`, `Social Trust 5%`).
- [x] **BEAT-02**: Surface a live **Projected Score Delta Pill** (`data-testid="draft-score-delta-pill"`, e.g. `Est. +0.6 vs. Autopilot`) on `StatusBar.svelte`, `TurnAgendaCard.svelte`, `Budget.svelte`, and `Congress.svelte` so players see immediately how any slider, package, EO, or deal moves their headline score vs. doing nothing.
- [x] **BEAT-03**: Build an interactive **"How to Beat Doing Nothing" Strategy Coach** (`data-testid="beat-baseline-coach"`) accessible from the `StatusBar` score banner and `Economy.svelte`, displaying the 8-component `You vs. Autopilot` gap table and 1-click jump buttons to the top 3 high-leverage opportunities.

### Phase 58: Multi-Path Strategic Playbook Variety & Early-Turn Momentum Balance (`FUN`)

- [x] **FUN-01**: Expand `src/app/beat-baseline.ts` (`getStrategicPlaybooks`) and `src/content/briefing.ts` so every turn offers **3 Distinct Strategic Playbook Options** (e.g., *Roads, Bridges & R&D Boom*, *Kitchen-Table & Drug Price Relief*, *Crack Down on Price-Fixing & Monopolies*, plus dynamic *Bipartisan Tax & Deficit Trim* and *Semiconductor & Clean Grid Leap*) with **visible Est. Score Impact badges (`+X.X vs. Autopilot`)** and turn-by-turn variety instead of repeating the same two suggestions.
- [x] **FUN-02**: Surface interactive **Playbook Variety Strip / Quick-Stage Pills** (`data-testid="playbook-variety-strip"`) on `OvalOffice.svelte` and `TurnAgendaCard.svelte` so players can discover and execute diverse winning strategies in 1 click while keeping Turn 1's primary `.card.option` compatible with `Open Budget` (`Infrastructure push`).
- [x] **FUN-03**: Tune early-turn policy responsiveness and synergy feedback so sensible Turn 1–4 plays across multiple playstyles deliver clear, gratifying positive momentum against Autopilot while preserving all 100-seed Monte Carlo balance invariants (`src/engine/balance.test.ts`, `src/app/beat-baseline.test.ts`).

### Phase 59: Concept-Art `Economy` & `Voters` Overhaul (`g-economy.png`, `g-voters.png`) & After/Compare CV Verification (`ECON-VOT`)

- [x] **ECON-VOT-01**: Upgrade `src/screens/Economy.svelte` and `src/ui/art/MiniChart.svelte` (`g-economy.png`) with double-line vintage frames, zero raw Unicode emojis (replacing all remaining emojis with `<CivicEmblem>`), a live **Draft Trajectory Preview** on the 4 charts (`You` + `Staged Draft` vs `Doing nothing`), and an inline **Beat Autopilot Gap Banner** (`data-testid="economy-baseline-coach"`) with 1-click **"Stage Fix →"** actions.
- [x] **ECON-VOT-02**: Upgrade `src/screens/Voters.svelte` and `src/ui/art/USMap.svelte` (`g-voters.png`) with zero raw Unicode emojis, the crisp Americana poster map palette (Civic Blue `#2F5D8C` / `#4A80B8` / `#85B8E4`, Brick Coral `#DF8E79` / `#C44D3B` / `#9A3324`, Mustard Gold `#D9A23B` swing-state border highlights), and a circular `(270)` Electoral College bullseye marker (`g-voters.png`).
- [x] **ECON-VOT-03**: Run `node scripts/cv-flywheel.ts --stage after` and `node scripts/cv-flywheel.ts --compare`, inspect all 16 side-by-side **Before | After | Target** comparison sheets (`1376×768` and `1280×720`), and verify all Playwright E2E + WCAG AA + determinism + unit test gates pass.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CV-FULL-01 | Phase 56 | Complete |
| GUI-ART-01 | Phase 56 | Complete |
| GUI-ART-02 | Phase 56 | Complete |
| GUI-ART-03 | Phase 56 | Complete |
| BEAT-01 | Phase 57 | Complete |
| BEAT-02 | Phase 57 | Complete |
| BEAT-03 | Phase 57 | Complete |
| FUN-01 | Phase 58 | Complete |
| FUN-02 | Phase 58 | Complete |
| FUN-03 | Phase 58 | Complete |
| ECON-VOT-01 | Phase 59 | Complete |
| ECON-VOT-02 | Phase 59 | Complete |
| ECON-VOT-03 | Phase 59 | Complete |
