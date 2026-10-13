---
phase: 12
phase_name: "Household Impact Card & Balance"
project: "govSim"
generated: "2026-10-12"
counts:
  decisions: 4
  lessons: 3
  patterns: 3
  surprises: 2
missing_artifacts: []
---

# Phase 12 Learnings: Household Impact Card & Balance

## Decisions

### 1. BEA Regional Price Parities for Microeconomic Cost of Living
Used authentic Bureau of Economic Analysis (BEA) state-level Regional Price Parity indices to adjust household line items (groceries, energy, healthcare, childcare) by state rather than using a national flat rate.

**Rationale:** Makes the player's choice of state (e.g. Florida vs Ohio vs California) feel genuinely differentiated and realistic in purchasing power without adding arbitrary math.  
**Source:** 12-01-PLAN.md, 12-01-SUMMARY.md

---

### 2. Immediate Active-State Button Styles Without Color Transitions
Removed CSS color transitions on `.switch-btn` active states in `Voters.svelte` and `Economy.svelte`.

**Rationale:** Color transitions cause intermediate color contrast dips that trigger automated WCAG 2 AA failures under axe-core when inspected immediately after clicking.  
**Source:** 12-04-PLAN.md, 12-04-SUMMARY.md

---

### 3. Dual Preset Persona and Custom Builder Architecture
Provided 4 curated, authentic household personas (`Rust Belt Manufacturing Family · OH`, `Sun Belt Retiree · FL`, `Suburban Tech Couple · WA`, `Working Class Single Parent · TX`) alongside an expandable custom drawer for arbitrary state/income/family size configuration.

**Rationale:** Gives players immediate 1-click relatable empathy while allowing deeper exploration of specific personal scenarios.  
**Source:** 12-02-PLAN.md, 12-02-SUMMARY.md

---

### 4. Regression Assertion for Reelection Party Neutrality
Integrated automated 100-seed regression tests asserting that under identical presidential policy choices, Democratic and Republican re-election odds diverge by no more than 5 percentage points.

**Rationale:** Enforces core design constraint D4/GR-16 (party-blind engine and fair nonpartisan play) permanently in CI.  
**Source:** 12-03-PLAN.md, 12-03-SUMMARY.md

---

## Lessons

### 1. Microeconomic Grounding Enhances Macroeconomic Engagement
Players connect much more intuitively with inflation and tax policy when translated to "$42/mo grocery increase" or "$115/mo child care tax credit" than abstract percentage points of CPI or deficit.

**Context:** The "Your Household" card bridges high-level policy trade-offs into visceral kitchen-table realities.  
**Source:** 12-02-SUMMARY.md

---

### 2. Automated Quality Gates Prevent UI Regressions at Scale
Automating 23 headless Playwright tests, axe-core scans, and dual viewport checks (1376x768 and 1280x720) caught multiple contrast and layout edge cases before release.

**Context:** With expanding screens, manual UI auditing does not scale.  
**Source:** 12-04-SUMMARY.md

---

### 3. Balance Calibration Must Account for Active Power Usage
A passive simulation bot underestimates human player efficacy. Calibrating sensible play with realistic bully pulpit speech usage brought reelection rates cleanly into the target 40%–85% band.

**Context:** Automated balance harnesses need realistic agent behaviors.  
**Source:** 12-03-SUMMARY.md

---

## Patterns

### 1. Pure Functional Household Impact Engine
The `calculateHouseholdImpact` engine is completely pure and stateless, taking `(state, persona, bills)` and returning structured monthly category deltas.

**When to use:** Whenever computing derived projections or localized breakdowns from global game state.  
**Source:** 12-01-PLAN.md, src/engine/household.ts

---

### 2. High-Contrast Semantic Color Tokens
Using `var(--sage-dark)` / `var(--card)` and `var(--ink)` on soft backgrounds to guarantee >4.5:1 contrast ratios across light and dark elements.

**When to use:** On status pills, active tags, and highlight ribbons.  
**Source:** 12-04-PLAN.md, src/ui/HouseholdBreakdown.svelte

---

### 3. Dual-Viewport Layout Assertions
Auditing DOM scroll geometry via `scrollHeight <= windowHeight` and `scrollWidth <= windowWidth` on both 1376x768 and 1280x720 in headless Playwright.

**When to use:** For every full-screen view and complex modal to guarantee zero viewport overflow.  
**Source:** tests/household-viewport.spec.ts

---

## Surprises

### 1. Rapid Execution of Complex Multi-Phase Milestone
Milestone v0.3 implemented 4 distinct major systems (social levers, regional distribution, government reform, and household impact) in 16 plans with zero regressions.

**Impact:** Demonstrates high effectiveness of SDD wave-based planning and continuous test suites.  
**Source:** v0.3-MILESTONE-AUDIT.md

---

### 2. Automated Axe Sensitivity to CSS Color Fades
Axe-core evaluates colors at the exact moment of execution; a 150ms CSS color transition was detected as an active violation mid-fade.

**Impact:** Establishing the rule that theme/active-state color switches should never transition across contrast thresholds.  
**Source:** 12-04-SUMMARY.md
