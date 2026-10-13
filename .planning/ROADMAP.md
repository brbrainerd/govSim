# Roadmap: govSim

## Milestones

- 🚧 **v0.5 Satirical "Evil Mode"** — Phases 17-20 (in progress)
- ✅ **v0.4 Foreign Policy & International Crises** — Phases 13-16 (shipped 2026-10-12)
- ✅ **v0.3 Social Policy & Domestic Reform** — Phases 9-12 (shipped 2026-10-12)
- ✅ **v0.2 Playable First Term** — Phases 1-8 (shipped 2026-10-12)

## Phases

### 🚧 v0.5 Satirical "Evil Mode" (In Progress)

**Milestone Goal:** Implement the satirical "Evil Mode" kleptocracy gameplay loop where the objective is to maximize an offshore stash while managing an escalating Heat meter to evade congressional investigations, special counsels, and impeachment trials.

- [x] **Phase 17: Evil Mode Engine, Offshore Stash & Heat Meter** (4/4 plans) — completed 2026-10-12
- [x] **Phase 18: Corrupt Executive Levers & Cronyism** (4/4 plans) — completed 2026-10-12
- [ ] **Phase 19: Institutional Backlash & Impeachment Trial** (IMPEACH-01, IMPEACH-02, IMPEACH-03)
- [ ] **Phase 20: Satirical UI Reskin & Heist End Screens** (UI-01, UI-02, UI-03)

### Phase Details

#### Phase 17: Evil Mode Engine, Offshore Stash & Heat Meter
**Goal**: Implement the alternative game mode toggle at New Game, pure deterministic offshore stash accounting, and the dynamic 0–100 Heat meter tracking public corruption exposure and evidence leakage.
**Depends on**: Milestone v0.4 foundations
**Requirements**: EVIL-01, EVIL-02, EVIL-03
**Success Criteria** (what must be TRUE):
  1. Player can toggle "Evil Mode" during New Game setup, storing mode choice cleanly in session options.
  2. Engine tracks `offshoreStash` ($B) accumulating from corrupt kickbacks and `heat` (0–100) decaying slowly over quarters.
  3. Escalating Heat applies pure arithmetic penalties to voter trust, national approval, and legislative friction.
**Plans**: 4 plans executed (completed 2026-10-12)

#### Phase 18: Corrupt Executive Levers & Cronyism
**Goal**: Provide corrupt executive actions: awarding no-bid crony procurement contracts, fire-sale auctions of federal assets/lands, selling tariff exemptions, and firing inspectors general to suppress investigations.
**Depends on**: Phase 17
**Requirements**: LEVER-01, LEVER-02, LEVER-03
**Success Criteria** (what must be TRUE):
  1. Corrupt actions catalog in `src/data/evil.ts` with direct kickback amounts, clout costs, and heat generation.
  2. Player can enact no-bid contracts and auction tariff exemptions to siphon funds into the offshore stash.
  3. Player can fire inspectors general to suppress active heat generation at high clout and trust costs.
**Plans**: 4 plans executed (completed 2026-10-12)

#### Phase 19: Institutional Backlash & Impeachment Trial
**Goal**: Model institutional retaliation when Heat exceeds critical thresholds: House judiciary investigations, special counsel subpoenas, House impeachment votes, and Senate conviction trials.
**Depends on**: Phase 18
**Requirements**: IMPEACH-01, IMPEACH-02, IMPEACH-03
**Success Criteria** (what must be TRUE):
  1. High heat (>60) triggers special counsel appointments and congressional subpoenas that drain presidential clout each quarter.
  2. Critical heat (>80) triggers House impeachment votes using the 435-seat congressional bloc voting model.
  3. Impeachment leads to a Senate conviction trial requiring a 2/3 supermajority; conviction instantly terminates the term and forfeits the entire offshore stash.
**Plans**: TBD (4 plans expected)

#### Phase 20: Satirical UI Reskin & Heist End Screens
**Goal**: Build the dark Americana poster visual reskin (oxblood, aged gold, ink), live Offshore Stash and Heat Gauge UI components, and specialized victory/conviction end screens.
**Depends on**: Phase 19
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. CSS theme token reskin (ink, aged gold, oxblood) toggles seamlessly when playing Evil Mode.
  2. Offshore stash counter and Heat Gauge permanently displayed in the top status bar and Situation Room.
  3. End screen ranks unconvicted players by their offshore heist tier, or details their downfall upon conviction.
  4. Fully audited with headless Playwright across 1376×768 and 1280×720 viewports with zero a11y violations.
**Plans**: TBD (4 plans expected)

---

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
|-------|-----------|----------------|--------|-----------|
| 1-8 | v0.2 | 39/39 | Complete | 2026-10-12 |
| 9-12 | v0.3 | 16/16 | Complete | 2026-10-12 |
| 13-16 | v0.4 | 16/16 | Complete | 2026-10-12 |
| 17. Evil Mode Engine | v0.5 | 4/4 | Complete | 2026-10-12 |
| 18. Corrupt Executive Levers | v0.5 | 4/4 | Complete | 2026-10-12 |
| 19. Backlash & Impeachment | v0.5 | 0/4 | In progress | - |
| 20. Reskin & Heist Screens | v0.5 | 0/4 | Not started | - |
