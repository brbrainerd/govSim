# Roadmap: govSim

## Milestones

- 🚧 **v0.4 Foreign Policy & International Crises** — Phases 13-16 (in progress)
- ✅ **v0.3 Social Policy & Domestic Reform** — Phases 9-12 (shipped 2026-10-12)
- ✅ **v0.2 Playable First Term** — Phases 1-8 (shipped 2026-10-12)

## Phases

### 🚧 v0.4 Foreign Policy & International Crises (In Progress)

**Milestone Goal:** Introduce international diplomacy, defense posture, global crises, and foreign trade mechanics to complete the presidential toolkit and drive the Security Index (10% of Prosperity).

- [x] **Phase 13: Geopolitical Crises Deck & Resolution Mechanics** (CRISIS-01, CRISIS-02, CRISIS-03)
- [x] **Phase 14: Foreign Policy & Sanctions Levers** (FORPOL-01, FORPOL-02, FORPOL-03)
- [x] **Phase 15: Security Index & Macro Feedback Engine** (SEC-01, SEC-02, SEC-03)
- [ ] **Phase 16: International Trade & Tariffs Screen** (TRADE-01, TRADE-02, TRADE-03)

### Phase Details

#### Phase 13: Geopolitical Crises Deck & Resolution Mechanics
**Goal**: Implement paced international crisis events (oil embargo, shipping strait blockade, debt contagion) with multi-turn countdowns, cited diplomatic/economic/military response cards, and identical autopilot streaming.
**Depends on**: Phase 12
**Requirements**: CRISIS-01, CRISIS-02, CRISIS-03
**Success Criteria** (what must be TRUE):
  1. Paced international crisis events trigger via deterministic keyed RNG streams and appear in the crisis modal with countdown timers.
  2. Player can choose between 3 cited resolution options displaying clear budget, approval, and risk trade-offs.
  3. Autopilot runs encounter identical crises and apply non-interventional default responses without drifting replay determinism.
**Plans**: 4 plans (13-01, 13-02, 13-03, 13-04) — completed 2026-10-12

#### Phase 14: Foreign Policy & Sanctions Levers
**Goal**: Provide presidential foreign policy controls including defense readiness posture dials, targeted economic sanctions, and the "Cut Foreign Aid to Fix Deficit" civics myth card.
**Depends on**: Phase 13
**Requirements**: FORPOL-01, FORPOL-02, FORPOL-03
**Success Criteria** (what must be TRUE):
  1. Player can adjust defense readiness posture and foreign assistance levels with clear trade-offs between budget deficits and geopolitical stability.
  2. Sanctions lever allows enacting targeted financial/export sanctions against aggressive regimes, with explicit domestic inflation and trade blowback.
  3. Myth card for "Cut Foreign Aid to Fix the Deficit" clearly illustrates foreign aid spending (<1% of budget) with CBO citations.
**Plans**: 4 plans (14-01, 14-02, 14-03, 14-04) — completed 2026-10-12

#### Phase 15: Security Index & Macro Feedback Engine
**Goal**: Integrate a pure 0–100 Security Index into the 10% Security weight of the Prosperity Index, linking defense readiness and international stability to inflation and output gap.
**Depends on**: Phase 14
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Pure engine computes a deterministic 0–100 Security Index reflecting military posture, international crisis containment, and alliance cohesion.
  2. Prosperity Index composite incorporates Security at 10% weight with transparent causal trace line items in the post-turn report card.
  3. Geopolitical supply disruption coefficients register in `C` and directly feed through into the Phillips curve and import deflators.
**Plans**: 4 plans (15-01, 15-02, 15-03, 15-04) — completed 2026-10-12

#### Phase 16: International Trade & Tariffs Screen
**Goal**: Build a dedicated Trade screen with bilateral agreement options, sector-specific strategic tariffs, retaliatory foreign tariff modeling, and state-level voter exposure feedback.
**Depends on**: Phase 15
**Requirements**: TRADE-01, TRADE-02, TRADE-03
**Success Criteria** (what must be TRUE):
  1. Dedicated Trade screen allows toggling strategic tariffs (minerals, chips, energy) and negotiating bilateral trade pacts.
  2. Foreign retaliatory tariffs dynamically decrease export demand and penalize voter approval in trade-dependent agricultural and manufacturing states.
  3. Trade balance charts, price pass-through metrics, and data table fallbacks pass WCAG AA contrast and keyboard accessibility audits across viewports.
**Plans**: TBD (4 plans expected)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Engine foundations | v0.2 | 7/7 | Complete | 2026-10-12 |
| 2. Saves, guardrails & deploy | v0.2 | 6/6 | Complete | 2026-10-12 |
| 3. Turn report & Economy | v0.2 | 5/5 | Complete | 2026-10-12 |
| 4. Events & crises | v0.2 | 5/5 | Complete | 2026-10-12 |
| 5. Your Powers | v0.2 | 5/5 | Complete | 2026-10-12 |
| 6. Voters & Electoral College | v0.2 | 4/4 | Complete | 2026-10-12 |
| 7. Election & end of term | v0.2 | 4/4 | Complete | 2026-10-12 |
| 8. Balance, hardening & release | v0.2 | 4/4 | Complete | 2026-10-12 |
| 9. Domestic Social Policy | v0.3 | 4/4 | Complete | 2026-10-12 |
| 10. Demographic & Regional | v0.3 | 4/4 | Complete | 2026-10-12 |
| 11. Structural Reform & Amend | v0.3 | 4/4 | Complete | 2026-10-12 |
| 12. Household Card & Balance | v0.3 | 4/4 | Complete | 2026-10-12 |
| 13. Geopolitical Crises | v0.4 | 0/4 | Not started | - |
| 14. Foreign Policy Levers | v0.4 | 0/4 | Not started | - |
| 15. Security Index & Macro | v0.4 | 0/4 | Not started | - |
| 16. Trade & Tariffs Screen | v0.4 | 0/4 | Not started | - |

---

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
