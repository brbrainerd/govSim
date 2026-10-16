# Requirements: govSim v0.9 — Progressive Disclosure, Plain-Talk Civics, Trade-Off Clarity & Gameplay Balance

**Defined:** 2026-10-16
**Core Value:** A player can make real presidential tradeoffs (or play the satirical "Evil Mode" kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## v0.9 Requirements

### Progressive Disclosure Architecture, Vocabulary Toggle & Trade-Off Components (Phase 34)

- [x] **VOCAB-01**: Add a persistent `vocabMode: 'plain' | 'wonk'` preference (defaulting to `'plain'`) in `src/app/session.svelte.ts`, `src/screens/NewGame.svelte`, and `src/ui/StatusBar.svelte` so players can switch between friendly Kitchen-Table Plain Talk and full Policy Wonk terminology at any time without altering engine determinism or save compatibility.
- [x] **VOCAB-02**: Create a typed Civics Glossary & Progressive Disclosure catalog (`src/content/glossary.ts`) mapping simulationist terms (`Cloture`, `Reconciliation`, `Section 301/232`, `IEEPA / OFAC`, `Major Questions Doctrine`, `Output Gap`, `CPI Pass-Through`, `Taylor Rule`, `Gini Inequality`, `Tipping-Point State`) to Plain-Talk labels, friendly emojis, witty 1-sentence explanations, and `"📜 Real Civics Term"` progressive-disclosure tooltips/chips.
- [x] **VOCAB-03**: Build a reusable, keyboard-accessible, viewport-safe `<TradeoffPill>` / `<WhyClickCard>` UI component (`src/ui/TradeoffPill.svelte`) that renders compact `👍 Upside` / `⚠️ The Catch` badges, friendly emoji/SVG impact meters, witty advisor `"Why click this?"` notes, and expandable `"📜 Official Law / Real Term"` progressive disclosure.

### De-Jargonizing Content Catalogs with Witty Plain Talk & `👍 / ⚠️` Trade-Offs (Phase 35)

- [x] **COPY-01**: Enrich `ORDERS_CATALOG` (`src/content/orders.ts`), `SANCTIONS_CATALOG` (`src/engine/foreign.ts`), and `SECTOR_TARIFFS_CATALOG` / `TRADE_AGREEMENTS_CATALOG` (`src/data/trade.ts`) with friendly emoji icons, Plain-Talk titles and summaries, explicit `upside` / `catchText` trade-offs, and witty advisor `"Why click this?"` notes (moving raw statutory citations like `19 U.S.C. § 1862` or `IEEPA` into progressive disclosure in Plain Talk mode).
- [x] **COPY-02**: Upgrade `SOCIAL_CATALOG` (`src/content/social.ts`), `REFORMS_CATALOG` (`src/engine/reforms.ts`), `FILIBUSTER_RULES_CATALOG` / `deals` (`src/engine/congress.ts`), and `taxLevers` / `spendLevers` (`src/engine/budget.ts`) to replace dense institutional prose with relatable kitchen-table language, light institutional humor, emoji cues, and clear short-term vs. long-term trade-offs.
- [x] **COPY-03**: Enrich domestic and geopolitical crisis options (`src/engine/events.ts`, `src/engine/geopolitics.ts`) and causal trace explanations (`src/content/text/why.ts`) with scannable `👍 Helps:` / `⚠️ Costs:` previews and conversational advisor translations so non-experts always understand what each option does before clicking.

### Surfacing Decision Trade-Offs & Visual Meters Across Act Screens (Phase 36)

- [x] **UI-CLARITY-01**: Upgrade `src/screens/Budget.svelte` so hovering, focusing, or adjusting any tax or spending slider (or preset package) updates the right-hand `"What it means"` column with a Plain-Talk `"Why move this slider?"` card (`👍 Upside`, `⚠️ The Catch`, emoji indicator, and visual wallet/economy meter) alongside the Expert Forecast.
- [x] **UI-CLARITY-02**: Upgrade `src/screens/Powers.svelte` and `src/screens/Trade.svelte` to replace uppercase statutory jargon (`CPI Pass-Through`, `Retaliatory friction weight`, `JUDICIAL VULNERABILITY`) in Plain Talk mode with friendly headers, emoji badges, compact `👍 / ⚠️` trade-off pills, and a clear `"Why sign this? / What's the catch?"` right-column decision card.
- [x] **UI-CLARITY-03**: Upgrade `src/screens/Congress.svelte`, `src/ui/FilibusterModal.svelte`, `src/ui/JudicialReformModal.svelte`, and `src/ui/AmendmentModal.svelte` so voting blocs, horse-trading deals, Senate rules, and court reforms explain *why* a player would spend Clout on them in plain, witty terms with visual vote-math and trade-off meters.

### Kitchen-Table Clarity on Hub, Diagnostic & Crisis Screens (Phase 37)

- [x] **SEE-01**: Upgrade `src/screens/Economy.svelte` and `src/ui/TurnReport.svelte` so technical macro labels (`Output Gap`, `Emp/Pop Ratio`, `Taylor Rule`, `Gini`) use Plain-Talk headers and emoji health badges in Plain Talk mode (with Wonk terms in progressive-disclosure tooltips), plus a one-line `"What this means for regular people"` summary.
- [x] **SEE-02**: Upgrade `src/screens/OvalOffice.svelte`, `src/screens/Voters.svelte`, and `src/ui/CrisisModal.svelte` so Chief of Staff plays, Electoral College tipping-point/swing badges, and crisis response buttons clearly state `👍 Upside` vs. `⚠️ Risk` with friendly icons/emojis and witty advisor context.

### Presidential Trade-Off Balance Audit, Readability Gate & Multi-Viewport Verification (Phase 38)

- [x] **BAL-01**: Audit and tune policy lever mechanics (`src/engine/budget.ts`, `src/content/orders.ts`, `src/engine/foreign.ts`, `src/engine/trade.ts`, `src/engine/social.ts`, `src/engine/reforms.ts`) so every presidential choice has a genuine felt upside AND counterbalancing catch, 100% aligned with its surfaced UI `👍 / ⚠️` badges, and verified by the 100-seed Monte Carlo balance harness (`sensible - nothing` in `[2, 10]`, party neutrality `<= 5 pp`).
- [x] **BAL-02**: Enforce automated tests verifying Flesch-Kincaid reading grade ≤ 9.0 across all Plain-Talk copy, zero outer viewport scrolling (`scrollHeight <= clientHeight`) across all screens in both `Plain Talk` and `Policy Wonk` modes at `1376×768` and `1280×720`, 0 axe accessibility violations, and 8/8 cross-browser determinism hashes.

## Future Requirements

- Dynamic adaptive vocabulary mode that automatically unlocks Policy Wonk terms as players inspect explainers and myths
- Interactive policy sandbox / "What-if" comparison comparator before starting a term

## Out of Scope

- Mandatory tutorials or pop-up quizzes that block turn progression — all progressive disclosure remains zero-friction and player-driven
- Partisan blame framing — all humor and plain-talk critiques target institutional incentives and trade-offs, never political parties (`GR-20`, `GR-21`)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VOCAB-01 | Phase 34 | Complete |
| VOCAB-02 | Phase 34 | Complete |
| VOCAB-03 | Phase 34 | Complete |
| COPY-01 | Phase 35 | Complete |
| COPY-02 | Phase 35 | Complete |
| COPY-03 | Phase 35 | Complete |
| UI-CLARITY-01 | Phase 36 | Complete |
| UI-CLARITY-02 | Phase 36 | Complete |
| UI-CLARITY-03 | Phase 36 | Complete |
| SEE-01 | Phase 37 | Complete |
| SEE-02 | Phase 37 | Complete |
| BAL-01 | Phase 38 | Complete |
| BAL-02 | Phase 38 | Complete |

**Coverage:**

- v0.9 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓
