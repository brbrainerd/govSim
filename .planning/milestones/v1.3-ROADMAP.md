# Roadmap: govSim v1.3 — Beat-the-Baseline Strategy Coach, Playbook Variety, Concept-Art Folder/Rosette GUI & Full-Surface CV Flywheel

## Overview

Milestone v1.3 closes the remaining visual gaps against `.design-targets/g-economy.png`, `g-voters.png`, `g-crisis.png`, `g-report.png`, and `uikit.png` across all 8 core surfaces while making it dramatically easier and more fun for players to figure out what to do, discover varied strategic playbooks, and see immediately how their choices beat "doing nothing" (`autopilot`).

## Phases

- [x] **Phase 56: 8-Surface CV Flywheel, Layered Crisis/Report Plates & Concept-Art Folder/Medal GUI** — Capture the 16-image `v1.3` BEFORE baseline across 8 surfaces (`newgame`, `oval-day`, `oval-evil`, `economy`, `voters`, `powers`, `congress`, `budget`), generate and layer `crisis-newsroom-bg.jpg` and `report-oval-bg.jpg`, upgrade left-rail tabs to authentic Manila Folder Tabs with halftone dot texture, and add hanging ribbon tails to the StatusBar Approval medal (`CV-FULL-01`, `GUI-ART-01..03`).
- [x] **Phase 57: Live "Beat the Baseline" Score-Delta Preview Engine & Interactive 8-Component Strategy Coach** — Build `src/app/beat-baseline.ts` (`previewDraftVsBaseline`, `diagnoseBaselineGaps`), surface live `Est. +X.X vs. Autopilot` score-delta pills across `StatusBar`, `TurnAgendaCard`, `Budget`, and `Congress`, and add the interactive 8-Component **"How to Beat Doing Nothing" Strategy Coach** (`BEAT-01..03`).
- [x] **Phase 58: Multi-Path Strategic Playbook Variety & Early-Turn Momentum Balance** — Upgrade `src/content/briefing.ts`, `OvalOffice.svelte`, and `TurnAgendaCard.svelte` so every turn offers 3 distinct strategic playbooks with visible projected score impact (`+X.X vs. Autopilot`) and turn-by-turn variety, and tune early-turn responsiveness (`FUN-01..03`).
- [x] **Phase 59: Concept-Art `Economy` & `Voters` Overhaul (`g-economy.png`, `g-voters.png`) & After/Compare CV Verification** — Upgrade `Economy.svelte` (double-line vintage frames, live draft trajectory preview on charts, zero raw emojis, inline Beat Autopilot gap banner) and `Voters.svelte` (Americana blue/coral/gold swing-state map, circular `270` bullseye badge, zero raw emojis, 1-click battleground moves), and run the 16-sheet CV Flywheel after/compare audit (`ECON-VOT-01..03`).

## Phase Details

### Phase 56: 8-Surface CV Flywheel, Layered Crisis/Report Plates & Concept-Art Folder/Medal GUI
**Goal**: Expand the CV Flywheel to 8 surfaces, layer generated Americana plates into `CrisisModal`/`ReporterScene` and `TurnReport`, and align `Rail.svelte` folder tabs and `StatusBar.svelte` approval medal ribbons with `g-voters.png`, `g-economy.png`, and `uikit.png`.
**Depends on**: Milestone v1.2
**Requirements**: `CV-FULL-01`, `GUI-ART-01`, `GUI-ART-02`, `GUI-ART-03`
**Success Criteria**:
  1. `node scripts/cv-flywheel.ts --stage before` captures all 8 surfaces across `1376×768` and `1280×720` (16 PNGs) with non-occluding comparison header banners.
  2. `public/assets/environments/crisis-newsroom-bg.jpg` and `public/assets/environments/report-oval-bg.jpg` are generated, optimized (`<= 220KB`), and layered into `ReporterScene.svelte` / `CrisisModal.svelte` and `TurnReport.svelte`.
  3. Left navigation tabs in `src/ui/Rail.svelte` render authentic Manila Folder tab ears with a halftone dot-matrix rail backdrop, and `StatusBar.svelte` renders hanging navy ribbon tails below the Approval medal circle.

### Phase 57: Live "Beat the Baseline" Score-Delta Preview Engine & Interactive 8-Component Strategy Coach
**Goal**: Make how to beat "doing nothing" (`autopilot`) immediately obvious and rewarding to discover via live score-delta previews on staged drafts and an interactive 8-component Strategy Coach.
**Depends on**: Phase 56
**Requirements**: `BEAT-01`, `BEAT-02`, `BEAT-03`
**Success Criteria**:
  1. `src/app/beat-baseline.ts` deterministically computes `previewDraftVsBaseline(session)` (`nowDelta`, `laterDelta`, `totalDelta`) and `diagnoseBaselineGaps(state, autoState)` (8-component `You vs. Autopilot` breakdown sorted by leverage) without mutating live session state.
  2. `StatusBar.svelte`, `TurnAgendaCard.svelte`, `Budget.svelte`, and `Congress.svelte` display `[data-testid="draft-score-delta-pill"]` showing `Est. +X.X vs. Autopilot` whenever decisions are staged or previewed.
  3. Clicking the `StatusBar` score callout or the `Economy` coach button opens `[data-testid="beat-baseline-coach"]` with the 8-component `You vs. Autopilot` table and 1-click action buttons to fix the weakest components.

### Phase 58: Multi-Path Strategic Playbook Variety & Early-Turn Momentum Balance
**Goal**: Provide rich strategic variety on every turn with 3 distinct Chief of Staff playbooks (each showing its estimated score gain vs. Autopilot) and gratifying early-turn policy momentum.
**Depends on**: Phase 57
**Requirements**: `FUN-01`, `FUN-02`, `FUN-03`
**Success Criteria**:
  1. `src/content/briefing.ts`, `OvalOffice.svelte`, and `TurnAgendaCard.svelte` surface 3 distinct strategic playbooks per turn (*Roads, Bridges & R&D Boom*, *Kitchen-Table & Drug Price Relief*, *Crack Down on Price-Fixing & Monopolies* / *Bipartisan Tax & Deficit Trim*) with `Est. +X.X vs. Autopilot` badges and dynamic turn-to-turn rotation.
  2. Turn 1's first `.card.option` preserves `Open Budget` (`Infrastructure push`) compatibility while offering 2 additional high-impact strategic paths and 1-click playbook staging.
  3. Unit and balance tests (`src/app/beat-baseline.test.ts`, `src/engine/balance.test.ts`) verify that multiple distinct strategic playbooks beat Autopilot across early and full-term horizons.

### Phase 59: Concept-Art `Economy` & `Voters` Overhaul (`g-economy.png`, `g-voters.png`) & After/Compare CV Verification
**Goal**: Align `Economy.svelte` and `Voters.svelte` visually and interactively with `.design-targets/g-economy.png` and `g-voters.png`, eliminate all remaining raw Unicode emojis, and verify all 16 side-by-side comparison sheets.
**Depends on**: Phase 58
**Requirements**: `ECON-VOT-01`, `ECON-VOT-02`, `ECON-VOT-03`
**Success Criteria**:
  1. `Economy.svelte` and `MiniChart.svelte` render double-line vintage frames (`g-economy.png`), zero raw Unicode emojis, live 4-quarter trajectory previews on the 4 charts, and an inline Beat Autopilot gap banner (`data-testid="economy-baseline-coach"`) with 1-click fix buttons.
  2. `Voters.svelte` and `USMap.svelte` render the Americana poster map palette (Civic Blue, Brick Coral, Mustard Gold swing-state outline glow), a circular `(270)` bullseye target badge (`g-voters.png`), and zero raw Unicode emojis.
  3. `node scripts/cv-flywheel.ts --stage after && node scripts/cv-flywheel.ts --compare` produces all 16 side-by-side **Before | After | Target** comparison sheets, verified alongside `pnpm guard`, `pnpm check`, `pnpm test`, `pnpm determinism`, and Playwright E2E.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 56. 8-Surface CV Flywheel, Layered Crisis/Report Plates & Concept-Art Folder/Medal GUI | 1/1 | Complete | 2026-10-18 |
| 57. Live "Beat the Baseline" Score-Delta Preview Engine & Interactive 8-Component Strategy Coach | 1/1 | Complete | 2026-10-18 |
| 58. Multi-Path Strategic Playbook Variety & Early-Turn Momentum Balance | 1/1 | Complete | 2026-10-18 |
| 59. Concept-Art `Economy` & `Voters` Overhaul & After/Compare CV Verification | 1/1 | Complete | 2026-10-18 |
