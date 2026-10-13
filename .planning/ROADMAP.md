# Roadmap: govSim

## Milestones

- 🚧 **v0.6 Completeness, Advisor Agency & Scenarios** — Phases 21-24 (in progress)
- ✅ **v0.5 Satirical "Evil Mode"** — Phases 17-20 (shipped 2026-10-13)
- ✅ **v0.4 Foreign Policy & International Crises** — Phases 13-16 (shipped 2026-10-12)
- ✅ **v0.3 Social Policy & Domestic Reform** — Phases 9-12 (shipped 2026-10-12)
- ✅ **v0.2 Playable First Term** — Phases 1-8 (shipped 2026-10-12)

## Phases

### 🚧 v0.6 Completeness, Advisor Agency & Scenarios (In Progress)

**Milestone Goal:** Eliminate every remaining "Coming soon" stub and disconnected UI loop, elevate day-to-day gameplay feel with one-click Advisor Plays, Congress Auto-Whip, and Fast-Forward pacing controls from `docs/design.md`, and multiply replayability with selectable starting scenarios.

- [x] **Phase 21: Complete the Learn Loop & Interactive Explainers** (3/3 plans) — completed 2026-10-13
- [ ] **Phase 22: Smart Advisor Plays, Auto-Whip & Live Household Budgeting** — One-click Chief of Staff plays, Congress Auto-Whip cheapest coalition solver, live Household Persona binding on Budget, and policy-in-force vs baseline slider deltas
- [ ] **Phase 23: Pacing Controls — Fast-Forward & Staged Decisions Tray** — Top-bar Staged Decisions indicator and safe "Skip to Next Event" fast-forward with automatic crisis/deadline interrupts
- [ ] **Phase 24: Replayable Starting Scenarios** — Selectable Starting Scenarios at New Game (*2026 Baseline*, *70s Stagflation Shock*, *Debt Ceiling Brinkmanship*, *Global Trade War*) with scenario briefings and Legacy Report badges

### Phase Details

#### Phase 21: Complete the Learn Loop & Interactive Explainers

**Goal**: Replace every disabled "Coming soon" button in the Learn strips with working interactive "How it works" civic explainer modals (+1 Clout curiosity reward), add the missing Learn strip to the Trade screen alongside 3 new cited Myth cards, and wire Oval Office Chief of Staff suggestion buttons so crisis and myth cards open their respective modals directly.
**Depends on**: Milestone v0.5 foundations
**Requirements**: LEARN-01, LEARN-02, LEARN-03
**Success Criteria** (what must be TRUE):

  1. Zero disabled `"Coming soon"` buttons remain anywhere in `src/screens/`; clicking `"How it works"` on Oval Office, Economy, Budget, or Trade opens a cited step-by-step civic explainer modal and grants a one-time +1 Clout curiosity bonus.
  2. `Trade.svelte` includes a complete `{#snippet learn()}` strip, and `src/content/myths.ts` adds cited myth cards for `supply_side_taxes`, `debt_ceiling_default`, and `trade_deficits`.
  3. Clicking `"Decide now"` or `"Find out"` on Oval Office Chief of Staff suggestion cards opens the active Crisis modal or target Myth modal directly when `target` is a modal action.

**Plans**: 3 plans executed (completed 2026-10-13)

#### Phase 22: Smart Advisor Plays, Auto-Whip & Live Household Budgeting

**Goal**: Turn Chief of Staff suggestions into one-click Advisor Plays that navigate and optionally pre-fill recommended policy levers, add a one-click "Auto-Whip Cheapest Path" button on Congress, connect the Budget screen impact card to the player's chosen `selectedHouseholdPersona`, and show slider changes relative to both policy-in-force and the 2026 baseline.
**Depends on**: Phase 21
**Requirements**: ADVISOR-01, ADVISOR-02, ADVISOR-03
**Success Criteria** (what must be TRUE):

  1. Chief of Staff policy suggestions offer a one-click play action that navigates to the relevant screen and pre-fills a recommended draft adjustment.
  2. Congress displays the cheapest Clout path to passing the current bill and provides a one-click `"Auto-whip cheapest coalition"` button that stages those deals automatically.
  3. `Budget.svelte` renders the active `session.selectedHouseholdPersona` (and net kitchen-table impact from `session.householdImpact`) instead of a hardcoded `"Nurse in Ohio"` card, and distinguishes slider changes vs policy-in-force (`session.current.policy`) from changes vs the 2026 baseline.

**Plans**: TBD

#### Phase 23: Pacing Controls — Fast-Forward & Staged Decisions Tray

**Goal**: Give players full clarity and control over turn pacing via a top-bar Staged Decisions summary indicator/popover and a "Skip to Next Event" fast-forward button that advances quiet turns while stopping automatically on any crisis, budget deadline, midterm, or pending vote.
**Depends on**: Phase 22
**Requirements**: PACE-01, PACE-02
**Success Criteria** (what must be TRUE):

  1. Top status bar shows a live Staged Decisions pill/tray summarizing unsent budget drafts, queued congressional deals, and pending executive actions before the player clicks Next Turn.
  2. Player can trigger `"Skip to next event"` to fast-forward through quiet quarters; the loop halts immediately and surfaces the relevant screen/modal when an active crisis, annual budget deadline, congressional vote, impeachment step, or election arrives.

**Plans**: TBD

#### Phase 24: Replayable Starting Scenarios

**Goal**: Multiply replayability by adding a Starting Scenario selector at New Game with 4 curated, historically grounded scenarios (*2026 Standard Baseline*, *70s Stagflation Shock*, *Debt Ceiling Brinkmanship*, *Global Trade War*) that deterministically configure initial conditions, display inauguration briefing objectives, and record scenario badges on the EndScreen and URL replay hash.
**Depends on**: Phase 23
**Requirements**: SCEN-01, SCEN-02
**Success Criteria** (what must be TRUE):

  1. New Game modal lets the player choose among 4 starting scenarios, each applying deterministic initial macro/fiscal/crisis overrides on top of `us-2026.json` while preserving bit-for-bit cross-browser determinism and autopilot comparison fairness.
  2. Inauguration / Oval Office briefing surfaces the active scenario's context and strategic challenge, and the Post-Term Legacy Report and shareable replay hash preserve and display the completed scenario badge.
  3. Fully audited with headless Playwright across 1376×768 and 1280×720 viewports with zero serious/critical axe violations.

**Plans**: TBD

---

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

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|---|---|:---:|:---:|:---:|
| 1-8 | v0.2 | 39/39 | Complete | 2026-10-12 |
| 9-12 | v0.3 | 16/16 | Complete | 2026-10-12 |
| 13-16 | v0.4 | 16/16 | Complete | 2026-10-12 |
| 17-20 | v0.5 | 16/16 | Complete | 2026-10-13 |
| 21. Complete the Learn Loop & Interactive Explainers | v0.6 | 3/3 | Complete | 2026-10-13 |
| 22. Smart Advisor Plays, Auto-Whip & Live Household Budgeting | v0.6 | 0/0 | Not started | - |
| 23. Pacing Controls — Fast-Forward & Staged Decisions Tray | v0.6 | 0/0 | Not started | - |
| 24. Replayable Starting Scenarios | v0.6 | 0/0 | Not started | - |
