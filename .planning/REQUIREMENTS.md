# Requirements: govSim (Milestone v0.4)

**Defined:** 2026-10-12
**Core Value:** A player can make real presidential tradeoffs (budget, Congress, executive powers, social policy, structural reforms, foreign policy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## v1 Requirements

### Geopolitical Crises (CRISIS)

- [ ] **CRISIS-01**: Player encounters international crises (oil embargo, foreign debt contagion, shipping strait blockade) with multi-turn countdowns and escalation risks.
- [ ] **CRISIS-02**: Player can select from three cited diplomatic/economic/military resolution options for each crisis with distinct budget, approval, and risk trade-offs.
- [ ] **CRISIS-03**: Autopilot runs receive the identical international crisis stream and default to standard response for fair score attribution.

### Foreign Policy Levers (FORPOL)

- [ ] **FORPOL-01**: Player can adjust defense readiness posture vs. budget savings and foreign assistance levels in the budget/executive screens.
- [ ] **FORPOL-02**: Player can enact targeted economic sanctions (asset freezes, trade restrictions) with explicit domestic inflation and trade fallout.
- [ ] **FORPOL-03**: Player can inspect the "Cut Foreign Aid to Fix Deficit" myth card showing foreign aid is <1% of federal spending.

### Security Index & Macro Feedback (SEC)

- [ ] **SEC-01**: Pure engine calculates a 0–100 Security Index based on defense readiness, alliance strength, and crisis containment.
- [ ] **SEC-02**: Security Index drives the 10% Security weight in the Prosperity Index with causal trace explanations in report cards.
- [ ] **SEC-03**: Geopolitical supply disruptions feed into energy/import deflators and Phillips-curve inflation via registered coefficients.

### International Trade & Tariffs (TRADE)

- [ ] **TRADE-01**: Player can set strategic sector tariffs and pursue bilateral trade agreements with key economic blocs.
- [ ] **TRADE-02**: Retaliatory foreign tariffs reduce export demand and shift voter coalitions in heavily trade-exposed states.
- [ ] **TRADE-03**: Trade screen visualizes trade balances, consumer price pass-through, and household export exposure with accessible fallbacks.

## v2 Requirements

### Multilateral Alliances & Treaties

- **TREATY-01**: Formal NATO/bilateral mutual defense pact obligations with treaty violation penalties.
- **TREATY-02**: Global climate accord negotiations affecting multinational carbon pricing and border adjustment taxes.

### Covert Operations & Intelligence

- **INTEL-01**: Covert cyber/intelligence operations with stochastic exposure and domestic blowback risks.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real foreign heads of state | Violates civics nonpartisanship and fictional person policy (Q6) |
| Direct tactical military combat sim | govSim is a presidential civilian strategy and macro civics game, not an RTS or wargame |
| Nuclear war annihilation sandbox | Terminal instant-lose state without pedagogical civics value |
| Live geopolitical news feeds | Requires external server, breaches zero-egress CSP and creates partisan risk (E5) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRISIS-01 | Phase 13 | Pending |
| CRISIS-02 | Phase 13 | Pending |
| CRISIS-03 | Phase 13 | Pending |
| FORPOL-01 | Phase 14 | Pending |
| FORPOL-02 | Phase 14 | Pending |
| FORPOL-03 | Phase 14 | Pending |
| SEC-01 | Phase 15 | Pending |
| SEC-02 | Phase 15 | Pending |
| SEC-03 | Phase 15 | Pending |
| TRADE-01 | Phase 16 | Pending |
| TRADE-02 | Phase 16 | Pending |
| TRADE-03 | Phase 16 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-12 for Milestone v0.4*
*Last updated: 2026-10-12*
