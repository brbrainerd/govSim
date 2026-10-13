# Requirements: govSim (Milestone v0.6)

**Defined:** 2026-10-13
**Core Value:** A player can make real presidential tradeoffs (or play the satirical "Evil Mode" kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## v0.6 Requirements

### Complete Learn Loop & Interactive Explainers (LEARN)

- [x] **LEARN-01**: Replace all disabled "Coming soon" Learn strip buttons across Oval Office, Economy, and Budget with interactive "How it works" civic explainer modals that award a one-time +1 Clout curiosity bonus.
- [x] **LEARN-02**: Add the missing Learn strip to the Trade screen and expand the Myth card deck (`supply_side_taxes`, `debt_ceiling_default`, `trade_deficits`) with cited institutional facts.
- [x] **LEARN-03**: Wire Chief of Staff suggestion actions on the Oval Office (`"Decide now"` and `"Find out"`) so crisis and myth suggestions directly open the corresponding Crisis or Myth modal instead of being no-ops.

### Smart Advisor Plays, Auto-Whip & Live Household Budgeting (ADVISOR)

- [x] **ADVISOR-01**: Upgrade Chief of Staff policy suggestions into one-click "Advisor Plays" that navigate to the target screen and optionally pre-fill recommended slider packages.
- [x] **ADVISOR-02**: Add a one-click "Auto-Whip Cheapest Path" helper in Congress that selects the lowest-Clout combination of bloc deals needed to reach 218 House / 51 (or 60) Senate votes.
- [x] **ADVISOR-03**: Connect the Budget screen impact card to the player's active `selectedHouseholdPersona` (replacing hardcoded "Nurse in Ohio") and display slider changes against both policy-in-force and the 2026 baseline.

### Turn Pacing & Staged Decisions (PACE)

- [ ] **PACE-01**: Add a top-bar Staged Decisions indicator showing pending policy drafts, deals, and executive actions queued for the current turn.
- [ ] **PACE-02**: Add a "Skip to Next Event" fast-forward control that advances quiet quarters automatically and halts immediately when a crisis, budget deadline, midterm, or pending bill vote requires attention.

### Replayable Starting Scenarios (SCEN)

- [ ] **SCEN-01**: Add a Starting Scenario selector at New Game with 4 curated scenarios (*2026 Standard Baseline*, *70s Stagflation Shock*, *Debt Ceiling Brinkmanship*, *Global Trade War*) modifying initial macro/fiscal/crisis state deterministically.
- [ ] **SCEN-02**: Display scenario briefing objectives at inauguration and surface scenario completion badges on the Post-Term Legacy Report and shareable replay hash.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Audio, voice narration | Decided no audio (A5) |
| Live news feeds | Requires external server, breaches zero-egress CSP and creates partisan risk (E5) |
| Real officeholders | Violates civics nonpartisanship and fictional person policy (Q6) |
| Direct tactical military combat sim | govSim is a presidential civilian strategy and macro civics game |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LEARN-01 | Phase 21 | Complete |
| LEARN-02 | Phase 21 | Complete |
| LEARN-03 | Phase 21 | Complete |
| ADVISOR-01 | Phase 22 | Complete |
| ADVISOR-02 | Phase 22 | Complete |
| ADVISOR-03 | Phase 22 | Complete |
| PACE-01 | Phase 23 | Pending |
| PACE-02 | Phase 23 | Pending |
| SCEN-01 | Phase 24 | Pending |
| SCEN-02 | Phase 24 | Pending |

**Coverage:**

- v0.6 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓
