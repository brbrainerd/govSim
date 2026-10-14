---
phase: 24-replayable-starting-scenarios
reviewed: 2026-10-13T19:08:00-07:00
depth: standard
commit_range: a55c93c..11bf951
files_reviewed: 34
files_reviewed_list:
  - src/app/save.ts
  - src/app/session-pacing.test.ts
  - src/app/session.svelte.ts
  - src/app/share.ts
  - src/content/briefing.test.ts
  - src/content/briefing.ts
  - src/content/explainers.test.ts
  - src/content/explainers.ts
  - src/content/myths.test.ts
  - src/content/myths.ts
  - src/content/scenarios.test.ts
  - src/content/scenarios.ts
  - src/engine/coefficients.ts
  - src/engine/congress.test.ts
  - src/engine/congress.ts
  - src/engine/powers.test.ts
  - src/engine/powers.ts
  - src/screens/Budget.svelte
  - src/screens/Budget.test.ts
  - src/screens/Congress.svelte
  - src/screens/Congress.test.ts
  - src/screens/Economy.svelte
  - src/screens/EndScreen.svelte
  - src/screens/Game.svelte
  - src/screens/NewGame.svelte
  - src/screens/OvalOffice.svelte
  - src/screens/Trade.svelte
  - src/testing/content-gates.test.ts
  - src/ui/ExplainerModal.svelte
  - src/ui/StatusBar.svelte
  - tests/advisor-autowhip-budget.spec.ts
  - tests/learn-loop.spec.ts
  - tests/pacing-controls.spec.ts
  - tests/scenarios.spec.ts
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Milestone v0.6 (Phases 21–24): Code Review Report

**Reviewed:** 2026-10-13  
**Depth:** Standard (5-axis review across Correctness, Architecture & Guardrails, Security & Trust Boundaries, Accessibility & UI, Performance & Simplicity)  
**Range:** `a55c93c..11bf951` (34 files)  
**Overall Status:** Issues Found — 2 Critical, 5 Warning, 3 Info (all remediated in follow-up commit)

---

## Summary

Milestone v0.6 cleanly implemented the Learn Loop & Interactive Explainers (Phase 21), Smart Advisor Plays, Auto-Whip & Live Household Budgeting (Phase 22), Pacing Controls — Fast-Forward & Staged Decisions Tray (Phase 23), and Replayable Starting Scenarios (Phase 24). Engine purity (`src/engine/` free of DOM/Svelte imports and bare magic numbers), party blindness (`src/content/parties.ts`), and Flesch-Kincaid Grade ≤ 9.0 readability gates are all respected.

However, the cross-phase review uncovered a critical save/share trust-boundary regression where newer `Decisions` keys (`geopoliticalCrisis`, `foreignPolicy`, `trade`, `evil`) were omitted from `validateDecisions()` in `src/app/save.ts`, causing autosave/export/share-link validation to fail when those levers are used. It also identified a reelection-loss state restoration edge case in `Session.fromSave` / `Session.fromRun` and five warning-level improvements.

---

## Critical Issues

### CR-01: `validateDecisions` rejects `geopoliticalCrisis`, `foreignPolicy`, `trade`, and `evil` decision keys
**File:** `src/app/save.ts:51-61, 134-209`  
**Issue:** `Session.nextTurn()` (`src/app/session.svelte.ts:743-791`) writes `decisions.geopoliticalCrisis`, `decisions.foreignPolicy`, `decisions.trade`, and `decisions.evil` into `this.inputs`. However, `VALID_DECISION_KEYS` and `validateDecisions()` in `src/app/save.ts` only allow `'bill'`, `'crisis'`, `'powers'`, `'social'`, `'filibusterRule'`, `'reform'`, `'amendmentProposal'`, `'amendmentCampaign'`, and `'presidentialSide'`. Any run that uses foreign policy, trade agreements/tariffs, geopolitical crises, or Evil Mode fails `parseSave()` and `decodeRunCode()` with `Unknown decision property`.  
**Fix:** Add `'geopoliticalCrisis'`, `'foreignPolicy'`, `'trade'`, and `'evil'` to `VALID_DECISION_KEYS` and validate/copy each field in `validateDecisions()` so `replaySave(parsed)` produces the identical `stableHash(endState)`.

### CR-02: `Session.fromSave` and `Session.fromRun` do not set `termEnded = true` on Turn 16 reelection defeat
**File:** `src/app/session.svelte.ts:472-501, 512-541`  
**Issue:** When a player loses reelection at Turn 16 (`outcome.winner !== 'player'`) and reloads or shares the run, `fromSave` and `fromRun` compute `s.reelectionWon = false` at Turn 16, but only set `s.termEnded = true` when `next.turn >= TOTAL_TURNS || Boolean(next.evil?.convicted)`. A 16-turn save or shared run where the player lost reelection therefore reopens at Turn 17 instead of the end-of-term screen.  
**Fix:** In `Session.fromSave` and `Session.fromRun`, if `s.activeElectionOutcome && !s.reelectionWon` after resolving Turn 16 (and the input log ends at Turn 16), set `s.termEnded = true` and slice `s.history` / `s.inputs` consistently with `continueAfterElection()`.

---

## Warnings

### WR-01: `encodeRunCode` / `decodeRunCode` / `Session.fromRun` drop `options.evilMode`
**File:** `src/app/share.ts:38-100`, `src/app/session.svelte.ts:506-510`  
**Issue:** `encodeRunCode` serializes `scenario` (`sc`) and `party` (`p`), but omits `evilMode` (`e`). Shared `#run=` URLs from Evil Mode runs reopen in Standard Mode.  
**Fix:** Include optional `e: 1` when `run.options.evilMode` is true in `encodeRunCode`, restore `evilMode: true` in `decodeRunCode`, and pass `evilMode: run.evilMode` into `Session.fromRun`.

### WR-02: `decodeRunCode` lacks decompressed payload size and turn-count bounds
**File:** `src/app/share.ts:70-93`  
**Issue:** While `code.length > MAX_RUN_CODE_LENGTH` bounds the compressed string, `deflate-raw` payloads with high compression ratios can expand into very large strings or arrays before `validateDecisions` runs.  
**Fix:** Check `text.length <= MAX_SAVE_SIZE_CHARS` and `parsed.i.length <= 32` in `decodeRunCode` before iterating `parsed.i`.

### WR-03: `validateDecisions` does not validate `powers.viewMyth` against known IDs or preserve `nominateFed` / `nominateScotus`
**File:** `src/app/save.ts:142-154`  
**Issue:** `d.powers.viewMyth` accepts any string without checking `getMyth` or `explainer:<id>` (`getExplainer`), and `nominateFed` / `nominateScotus` are not copied if present.  
**Fix:** Validate `d.powers.viewMyth` against `getMyth(id)` or `id.startsWith('explainer:') && Boolean(getExplainer(id.slice(10)))`, and validate/preserve `nominateFed` and `nominateScotus`.

### WR-04: `StatusBar.svelte` staged decisions popover lacks `Escape` key dismissal
**File:** `src/ui/StatusBar.svelte:109-168`  
**Issue:** The staged decisions tray (`trayOpen`) toggles via button click and closes on action selection, but does not close when the user presses `Escape` (WCAG 1.4.13 / keyboard ergonomics).  
**Fix:** Add a `<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && trayOpen) trayOpen = false; }} />` handler in `StatusBar.svelte`.

### WR-05: `Session.applyAdvisorPlay` with `autoWhip: true` does not ensure `sentToCongress = true`
**File:** `src/app/session.svelte.ts:596-607`  
**Issue:** If an advisor play specifies `autoWhip: true` without `sendToCongress: true` (or when 0 additional deals are needed because votes are already ≥ 218), `autoWhipCoalition()` leaves `this.draft.sentToCongress` false.  
**Fix:** In `applyAdvisorPlay`, call `this.sendToCongress()` whenever `play.sendToCongress || play.autoWhip`.

---

## Info / Nits

### IN-01: Document `briefing.ts` readability coverage in `src/testing/content-gates.test.ts`
**File:** `src/testing/content-gates.test.ts:56-64`  
**Note:** `briefing.ts` uses template callbacks and is tested in `src/content/briefing.test.ts`; add a brief comment in `content-gates.test.ts` cross-referencing `src/content/briefing.test.ts`.

### IN-02: Render `.base-tick` on Foreign Assistance slider when `assistInForce !== 100`
**File:** `src/screens/Budget.svelte:62-84`  
**Note:** Regular budget sliders render a `.base-tick` at `l.base` whenever `inForce !== l.base`. Adding `{#if assistInForce !== 100}<span class="tick base-tick" style:left="50%" title="2026 baseline"></span>{/if}` keeps the Foreign Assistance slider visually consistent.

### IN-03: Document `findCheapestCoalition` power-set bound in `src/engine/congress.ts`
**File:** `src/engine/congress.ts:336-350`  
**Note:** Note in the JSDoc that `deals` has 3 entries ($2^3 = 8$ subsets), so exhaustive power-set search is $O(1)$ per reactive update.
