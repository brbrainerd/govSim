# Requirements: govSim v0.8 — Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy

**Defined:** 2026-10-14
**Core Value:** A player can make real presidential tradeoffs (or play the satirical "Evil Mode" kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## v0.8 Requirements

### Expanded 12-Card Myth Catalog, Bottleneck Predictions & Actionable Pivot Schema (Phase 30)

- [ ] **DECK-01**: Expand `src/content/myths.ts` from 8 to 12 spectrum-balanced civics myth cards (`|count(left) - count(right)| <= 1`, with 4 `left`, 4 `right`, 4 `both`), adding 4 sourced institutional/mechanism myths (`veto_line_item`, `popular_vote_mandate`, `immigration_crime_budget`, `scotus_instant_reversal`) covering Congress, Voters, Social Policy, and Courts/Reforms, all passing Flesch-Kincaid reading grade ≤ 9.0 and ≤ 20 words/sentence gates.
- [ ] **DECK-02**: Enrich every `MythCard` in `src/content/myths.ts` with a structured 2-option prediction prompt (`predictionPrompt`: question, 2 options, `correctIndex`, plain-language refutation feedback) and a tempting `mirageLabel` string for situated UI discovery.
- [ ] **PIVOT-01**: Add typed `realLeverActions` metadata to every `MythCard` in `src/content/myths.ts`, mapping each real constitutional lever pill to a concrete `ScreenId` and optional `Session` draft action (budget package/lever, executive order, trade tariff/accord, or reform modal).

### Interactive Reality-Check Modal & 1-Click Tactical Pivots (Phase 31)

- [ ] **MYTH-03**: Upgrade `src/ui/MythModal.svelte` with an interactive "Call the Bluff / Spot the Bottleneck" prediction step that lets the player test their intuition before revealing the causal reality and slamming the `MYTH BUSTED` stamp (respecting `calmMode` and `prefers-reduced-motion`).
- [ ] **MYTH-04**: Provide a zero-friction `"Skip to Reality"` / direct `"Got It"` path in `src/ui/MythModal.svelte` so players are never gated by a mandatory quiz and can claim or dismiss the card in one click.
- [ ] **PIVOT-02**: Convert the static `realLevers` pills in `src/ui/MythModal.svelte` into interactive 1-click tactical pivot buttons (`Session.applyMythLeverAction`) that mark the myth examined, stage or highlight the real lever, navigate to the target screen, and close the modal.

### Tempting "Mirage Levers" Across Screens & Contextual Blame Triggers (Phase 32)

- [ ] **MYTH-01**: Place viewport-safe tempting "Mirage Lever" controls (plausible populist "Easy Buttons" that trigger the corresponding Myth Reality Check at the moment of player intent) across `Economy.svelte`, `Budget.svelte`, `Congress.svelte` (wiring `onOpenMyth` in `Game.svelte`), `Powers.svelte`, `Trade.svelte`, and `Voters.svelte`, maintaining zero outer viewport scrolling at `1376×768` and `1280×720`.
- [ ] **MYTH-02**: Upgrade `generateBriefing` in `src/content/briefing.ts` and `OvalOffice.svelte` so that when inflation, gas/energy costs, unemployment, or budget deficits spike, the Chief of Staff surfaces a contextual "Public Blame / Myth Check" suggestion tied to the active macro pressure.

### "Debunk vs. Spin" Gameplay Mechanics & EndScreen Civic Dossier (Phase 33)

- [ ] **SPIN-01**: Implement the pure-engine `"Debunk vs. Spin"` mechanic (`spinMyth?: string` in `PowerDecisions`, registered coefficients `mythSpinApprovalBoost`, `mythSpinTrustPenalty`, `mythSpinHeatDelta` in `coefficients.ts`, `'event:myth_spin'` trace copy in `why.ts`, and `save.ts` validation) so players can either Debunk a myth (+5 Clout) or Spin it on TV (+Approval rally for 1 turn, −Social Trust, and +Heat in Evil Mode) while keeping all existing determinism golden hashes bit-identical.
- [ ] **SPIN-02**: Wire the `"Spin This Myth"` demagogue action in `src/ui/MythModal.svelte` and `Session` (`src/app/session.svelte.ts`), and upgrade `src/screens/EndScreen.svelte` with a Civic Mastery Dossier summarizing Myths Busted vs. Myths Spun at term end.

## Future Requirements

- Multi-card press conference debate chains

## Out of Scope

- Mandatory blocking quizzes that halt turn progression — learning must remain opt-in and intrinsic
- Partisan blame framing — all myths critique institutional mechanics, never political parties (`GR-20`, `GR-21`)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DECK-01 | Phase 30 | Pending |
| DECK-02 | Phase 30 | Pending |
| PIVOT-01 | Phase 30 | Pending |
| MYTH-03 | Phase 31 | Pending |
| MYTH-04 | Phase 31 | Pending |
| PIVOT-02 | Phase 31 | Pending |
| MYTH-01 | Phase 32 | Pending |
| MYTH-02 | Phase 32 | Pending |
| SPIN-01 | Phase 33 | Pending |
| SPIN-02 | Phase 33 | Pending |

**Coverage:**
- v0.8 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓
