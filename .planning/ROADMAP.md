# Roadmap: govSim

## Milestones

- 🚧 **v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director** — Phases 25-29 (in progress)
- ✅ **v0.6 Completeness, Advisor Agency & Scenarios** — Phases 21-24 (shipped 2026-10-14)
- ✅ **v0.5 Satirical "Evil Mode"** — Phases 17-20 (shipped 2026-10-13)
- ✅ **v0.4 Foreign Policy & International Crises** — Phases 13-16 (shipped 2026-10-12)
- ✅ **v0.3 Social Policy & Domestic Reform** — Phases 9-12 (shipped 2026-10-12)
- ✅ **v0.2 Playable First Term** — Phases 1-8 (shipped 2026-10-12)

## Phases

### 🚧 v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director (Phases 25-29)

- [ ] **Phase 25: Dramatic SVG Art Overhaul & Reactive Scenes** — Replace basic geometric pill characters and static backdrops with rich Americana editorial-poster SVG illustrations, 5 reactive facial expressions, and live `GameState`-reactive Oval Office, Reporter, Court, and Fed scenes (`ART-01`, `ART-02`, `ART-03`).
- [ ] **Phase 26: Visual Flair, Micro-Interactions, Satirical Wit & Calm Mode** — Add stamp-slam and hemicycle seat-flip micro-animations, ironic news-ticker chyrons and advisor quips, and an explicit in-game `"Calm mode"` toggle (`JUICE-01`, `JUICE-02`, `JUICE-03`).
- [ ] **Phase 27: Year-1 Progressive Onboarding & Guided Turn Flow** — Guide new players progressively through Year 1 (`docs/design.md` §7b: Turn 1 Budget/Congress, Turn 2 Your Powers, Turn 3+ all screens) with an `"Unlock all screens"` toggle (`ONBOARD-01`, `ONBOARD-02`).
- [ ] **Phase 28: "Show Your Work" Model Inspector & Citation Audit** — Build an interactive Model Inspector drawer/modal exposing live `coefficients.ts` equations, ranges, and literature citations, and audit remaining `judgement` citations (`MODEL-01`, `MODEL-02`).
- [ ] **Phase 29: Free AI Director, OpenRouter `:free` Auto-Routing & Living World Variance** — Add optional non-deterministic Living World shock variance and an opt-in Free AI Director (`openrouter/free` + `:free` auto-discovery, OAuth PKCE, local `window.ai`, Gemini/Groq BYOK) for generative briefings, satirical chyrons, and schema-clamped dynamic crises (`AI-01`, `AI-02`, `AI-03`, `AI-04`).

### Phase Details

#### Phase 25: Dramatic SVG Art Overhaul & Reactive Scenes
**Goal**: Transform govSim's character and scene illustrations from minimal geometric shapes into expressive, layered Americana editorial-poster art that reacts visibly to economic health, crises, approval, and Evil Mode.
**Depends on**: Phase 24
**Requirements**: ART-01, ART-02, ART-03
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. `Character.svelte` renders layered editorial-poster anatomy (hairstyles, ears, noses, eyebrows, expressive eyes, collars, lapels, ties/pearls, shading) and supports 5 distinct mood states (`confident`, `stressed`, `scheming`, `panicked`, `triumphant`) using only CSS custom properties from `src/design/tokens.ts`.
  2. `OvalOfficeScene.svelte` dynamically adapts window weather/sky, desk props (bill stacks, coffee mugs, crisis red phone), advisor/president expressions, and Evil Mode visual tells (shredder, offshore ledger) based on live `GameState`.
  3. `ReporterScene.svelte`, `CourtBench.svelte`, and `FedPortrait.svelte` display upgraded editorial-poster props and mood-reactive expressions.

#### Phase 26: Visual Flair, Micro-Interactions, Satirical Wit & Calm Mode
**Goal**: Elevate tactile responsiveness and satirical charm with stamp-slam and seat-flip animations, ironic news chyrons and advisor banter, and an accessible Calm Mode toggle.
**Depends on**: Phase 25
**Requirements**: JUICE-01, JUICE-02, JUICE-03
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Signing a bill or Executive Order triggers a tactile stamp-slam animation, and whipping coalitions in Congress pulses flipped seats in the hemicycle.
  2. News-ticker chyrons and advisor banter feature dry institutional irony and humor while remaining strictly party-blind and passing the Flesch-Kincaid reading grade ≤ 9.0 gate.
  3. Players can toggle `"Calm mode"` in `StatusBar.svelte` (or via `prefers-reduced-motion`) to suppress decorative animations and marquee motion immediately.

#### Phase 27: Year-1 Progressive Onboarding & Guided Turn Flow
**Goal**: Implement the progressive Year-1 onboarding journey from `docs/design.md` §7b so new players learn core loops step-by-step without overwhelm, while allowing experienced players to unlock all screens immediately.
**Depends on**: Phase 26
**Requirements**: ONBOARD-01, ONBOARD-02
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. In Guided mode, Turn 1 highlights Oval Office, Budget, and Congress; Turn 2 introduces Your Powers; Turn 3+ unlocks Voters, Social, Trade, and Reforms with clear step callouts.
  2. Players can toggle `"Unlock all screens immediately"` on `NewGame.svelte` or inside the rail so all tabs are accessible on Turn 1 when desired.

#### Phase 28: "Show Your Work" Model Inspector & Citation Audit
**Goal**: Fulfill the transparency promise of `docs/design.md` §4 with an interactive Model Inspector showing every live equation, coefficient, range, and citation in plain language.
**Depends on**: Phase 27
**Requirements**: MODEL-01, MODEL-02
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Players can open the `"Show your work"` Model Inspector from the Economy screen or About modal to search and inspect live `coefficients.ts` parameters, domain equations, valid ranges, and source citations.
  2. All coefficients in `src/engine/coefficients.ts` have audited citations and plain-language explanatory notes.

#### Phase 29: Free AI Director, OpenRouter `:free` Auto-Routing & Living World Variance
**Goal**: Allow govSim to adapt generatively and non-deterministically to changing circumstances via a Living World variance mode and an opt-in Free AI Director powered by OpenRouter `:free` auto-discovery, OAuth PKCE, browser-local AI, or free-tier BYOK keys.
**Depends on**: Phase 28
**Requirements**: AI-01, AI-02, AI-03, AI-04
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Enabling `"Living World"` mode injects fresh turn-level entropy via `Decisions` / app-layer seed mixing and triggers emergent multi-condition shock chains while keeping `src/engine/` pure and standard seeded runs 100% bit-reproducible.
  2. Players can opt into Free AI in an AI Settings modal supporting OpenRouter `:free` live model discovery + `openrouter/free` auto-router with 429 failover, 1-click OpenRouter OAuth PKCE login, browser `window.ai`, or Gemini/Groq/Ollama endpoints, with zero network egress when AI is off.
  3. When active, the AI Director generates context-aware Oval Office advisor briefings, satirical news chyrons, and schema-clamped dynamic crisis dilemmas (strictly bounded within safe engine limits and sanitized for party-blindness), with instant fallback to deterministic offline templates.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 25. Dramatic SVG Art Overhaul & Reactive Scenes | 0/TBD | Not started | - |
| 26. Visual Flair, Micro-Interactions, Satirical Wit & Calm Mode | 0/TBD | Not started | - |
| 27. Year-1 Progressive Onboarding & Guided Turn Flow | 0/TBD | Not started | - |
| 28. "Show Your Work" Model Inspector & Citation Audit | 0/TBD | Not started | - |
| 29. Free AI Director, OpenRouter `:free` Auto-Routing & Living World Variance | 0/TBD | Not started | - |

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
