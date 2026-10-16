# Roadmap: govSim

## Milestones

- 🚧 **v0.9 Progressive Disclosure, Plain-Talk Civics, Trade-Off Clarity & Gameplay Balance** — Phases 34-38 (in progress)
- ✅ **v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy** — Phases 30-33 (shipped 2026-10-14)
- ✅ **v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director** — Phases 25-29 (shipped 2026-10-14)
- ✅ **v0.6 Completeness, Advisor Agency & Scenarios** — Phases 21-24 (shipped 2026-10-14)
- ✅ **v0.5 Satirical "Evil Mode"** — Phases 17-20 (shipped 2026-10-13)
- ✅ **v0.4 Foreign Policy & International Crises** — Phases 13-16 (shipped 2026-10-12)
- ✅ **v0.3 Social Policy & Domestic Reform** — Phases 9-12 (shipped 2026-10-12)
- ✅ **v0.2 Playable First Term** — Phases 1-8 (shipped 2026-10-12)

## Phases

### 🚧 v0.9 Progressive Disclosure, Plain-Talk Civics, Trade-Off Clarity & Gameplay Balance (Phases 34-38)

- [x] **Phase 34: Progressive Disclosure Architecture, Vocabulary Toggle & Trade-Off Components** — Add persistent `vocabMode: 'plain' | 'wonk'` in `Session`, `NewGame.svelte`, and `StatusBar.svelte`, create the typed Civics Glossary & Progressive Disclosure catalog (`src/content/glossary.ts`), and build the reusable `<TradeoffPill>` / `<WhyClickCard>` component (`VOCAB-01`, `VOCAB-02`, `VOCAB-03`). (completed 2026-10-16)
- [x] **Phase 35: De-Jargonizing Content Catalogs with Witty Plain Talk & `👍 / ⚠️` Trade-Offs** — Enrich Executive Orders, Sanctions, Tariffs, Trade Pacts, Social Policies, Reforms, Congress Deals, Crises, and Trace copy with dual-layer Plain/Wonk strings, friendly emojis, institutional humor, and explicit `👍 Upside` / `⚠️ The Catch` trade-off pairs (`COPY-01`, `COPY-02`, `COPY-03`). (completed 2026-10-16)
- [ ] **Phase 36: Surfacing Decision Trade-Offs & Visual Meters Across Act Screens** — Upgrade `Budget.svelte`, `Powers.svelte`, `Trade.svelte`, `Congress.svelte`, and Reform Modals (`FilibusterModal`, `JudicialReformModal`, `AmendmentModal`) to surface right-column `"Why click this?"` advisor cards, compact `👍 / ⚠️` badges, and friendly visual meters while keeping zero outer viewport scroll (`UI-CLARITY-01`, `UI-CLARITY-02`, `UI-CLARITY-03`).
- [ ] **Phase 37: Kitchen-Table Clarity on Hub, Diagnostic & Crisis Screens** — Upgrade `Economy.svelte`, `TurnReport.svelte`, `OvalOffice.svelte`, `Voters.svelte`, and `CrisisModal.svelte` with Plain-Talk indicator headers, emoji health badges, `"What this means for regular people"` summaries, and scannable crisis option trade-offs (`SEE-01`, `SEE-02`).
- [ ] **Phase 38: Presidential Trade-Off Balance Audit, Readability Gate & Multi-Viewport Verification** — Audit and tune policy lever mechanics so every presidential action presents a genuine, balanced strategic trade-off aligned with its UI badges, and verify Flesch-Kincaid grade ≤ 9.0, 100-seed Monte Carlo balance, and zero-scroll UI across `1376×768` and `1280×720` (`BAL-01`, `BAL-02`).

#### Phase 34: Progressive Disclosure Architecture, Vocabulary Toggle & Trade-Off Components

- **Goal**: Build the progressive-disclosure foundation, a 1-click `"Plain Talk / Policy Wonk"` vocabulary toggle, a typed Civics Glossary catalog, and reusable trade-off badge/card UI primitives.
- **Requirements**: VOCAB-01, VOCAB-02, VOCAB-03
- **Success Criteria**:
  1. Players can toggle between `"Plain Talk"` (default) and `"Policy Wonk"` vocabulary modes on `NewGame.svelte` and in `StatusBar.svelte`, persisted in `Session` and `localStorage` without affecting engine determinism or save compatibility.
  2. `src/content/glossary.ts` provides a typed progressive-disclosure dictionary mapping simulationist terms (`Cloture`, `Reconciliation`, `Section 301/232`, `IEEPA / OFAC`, `Major Questions Doctrine`, `Output Gap`, `CPI Pass-Through`, `Taylor Rule`, `Gini`, `Tipping-Point State`) to Plain-Talk labels, friendly emojis, witty 1-sentence explanations, and `"📜 Real Civics Term"` tooltips.
  3. `src/ui/TradeoffPill.svelte` renders compact, keyboard-accessible `👍 Upside` / `⚠️ The Catch` badges, emoji/SVG impact meters, witty advisor `"Why click this?"` notes, and expandable `"📜 Official Law / Real Term"` details within existing card height budgets.

#### Phase 35: De-Jargonizing Content Catalogs with Witty Plain Talk & `👍 / ⚠️` Trade-Offs

- **Goal**: Overhaul every simulationist content catalog so every lever, order, sanction, tariff, deal, and crisis option has dual-layer (`plain` + `wonk`) copy, friendly emoji signposts, a clear `"Why click this?"` pitch, an explicit `👍 Upside`, and an honest `⚠️ The Catch`.
- **Requirements**: COPY-01, COPY-02, COPY-03
- **Success Criteria**:
  1. `ORDERS_CATALOG` (`src/content/orders.ts`), `SANCTIONS_CATALOG` (`src/engine/foreign.ts`), and `SECTOR_TARIFFS_CATALOG` / `TRADE_AGREEMENTS_CATALOG` (`src/data/trade.ts`) include emoji icons, Plain-Talk titles/summaries, `upside` / `catchText` pairs, and witty advisor notes.
  2. `SOCIAL_CATALOG` (`src/content/social.ts`), `REFORMS_CATALOG` (`src/engine/reforms.ts`), `FILIBUSTER_RULES_CATALOG` / `deals` (`src/engine/congress.ts`), and `taxLevers` / `spendLevers` (`src/engine/budget.ts`) include relatable kitchen-table descriptions, emoji cues, and clear short-term vs. long-term trade-offs.
  3. Domestic and geopolitical crisis options (`src/engine/events.ts`, `src/engine/geopolitics.ts`) and causal trace copy (`src/content/text/why.ts`) include scannable `👍 Helps:` / `⚠️ Costs:` previews and conversational advisor translations passing Flesch-Kincaid reading grade ≤ 9.0.

#### Phase 36: Surfacing Decision Trade-Offs & Visual Meters Across Act Screens

- **Goal**: Surface `"Why click this?"` advisor notes, `👍 Upside / ⚠️ The Catch` badges, emoji cues, and friendly visual meters across `Budget`, `Powers`, `Trade`, `Congress`, and Reform Modals without breaking the zero-scroll `1376×768` / `1280×720` layout budget.
- **Requirements**: UI-CLARITY-01, UI-CLARITY-02, UI-CLARITY-03
- **Success Criteria**:
  1. Hovering, focusing, or moving any tax/spending slider or package on `Budget.svelte` updates the right-hand `"What it means"` column with a Plain-Talk `"Why move this slider?"` card (`👍 Upside`, `⚠️ The Catch`, emoji cue, and visual wallet/economy meter).
  2. `Powers.svelte` and `Trade.svelte` replace uppercase statutory tags and raw macro jargon in Plain Talk mode with friendly headers, emoji badges, compact `👍 / ⚠️` pills, and a clear `"Why sign this? / What's the catch?"` right-column decision card.
  3. `Congress.svelte`, `FilibusterModal.svelte`, `JudicialReformModal.svelte`, and `AmendmentModal.svelte` explain *why* a player would spend Clout on deals, Senate rules, and court/constitutional reforms using plain, witty copy and visual trade-off meters.

#### Phase 37: Kitchen-Table Clarity on Hub, Diagnostic & Crisis Screens

- **Goal**: Make the hub, diagnostic, and crisis screens (`OvalOffice`, `Economy`, `Voters`, `TurnReport`, `CrisisModal`) effortless to understand for players without a civics background.
- **Requirements**: SEE-01, SEE-02
- **Success Criteria**:
  1. `Economy.svelte` and `TurnReport.svelte` display Plain-Talk indicator headers and emoji health badges in Plain Talk mode (with Wonk terms in progressive-disclosure tooltips) plus a one-line `"What this means for regular people"` summary.
  2. `OvalOffice.svelte`, `Voters.svelte`, and `CrisisModal.svelte` clearly present `👍 Upside` vs. `⚠️ Risk` on Chief of Staff plays, Electoral College tipping-point/swing badges, and crisis response buttons with friendly icons/emojis and witty advisor context.

#### Phase 38: Presidential Trade-Off Balance Audit, Readability Gate & Multi-Viewport Verification

- **Goal**: Audit and tune policy lever mechanics so every presidential action has a genuine, balanced strategic trade-off aligned with its UI badges, and verify all readability, balance, determinism, and multi-viewport zero-scroll gates.
- **Requirements**: BAL-01, BAL-02
- **Success Criteria**:
  1. Every Budget slider, Executive Order, Sanction, Sector Tariff, Social Policy, and Reform has a verified non-trivial upside and counterbalancing trade-off in the engine that matches its surfaced `👍 / ⚠️` UI badges, and the 100-seed Monte Carlo balance harness passes (`sensible - nothing` in `[2, 10]`, party neutrality `<= 5 pp`).
  2. Automated gates pass for Flesch-Kincaid reading grade ≤ 9.0 across all Plain-Talk copy, zero outer viewport scrolling (`scrollHeight <= clientHeight`) across all screens in both `Plain Talk` and `Policy Wonk` modes at `1376×768` and `1280×720`, 0 axe violations, and 8/8 cross-browser determinism hashes.

---

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
