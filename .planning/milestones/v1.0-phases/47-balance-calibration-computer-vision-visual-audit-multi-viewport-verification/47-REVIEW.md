---
phase: 47-balance-calibration-computer-vision-visual-audit-multi-viewport-verification
milestone: v1.0
reviewed: 2026-10-18T21:25:00Z
depth: thorough
files_reviewed: 21
files_reviewed_list:
  - src/engine/perks.ts
  - src/engine/synergies.ts
  - src/engine/game.ts
  - src/engine/decisions.ts
  - src/engine/coefficients.ts
  - src/app/session.svelte.ts
  - src/app/save.ts
  - src/app/share.ts
  - src/app/mastery.ts
  - src/content/perks.ts
  - src/content/archetypes.ts
  - src/content/myths.ts
  - src/testing/content-gates.test.ts
  - src/ui/art/Character.svelte
  - src/ui/art/CharacterPortrait.svelte
  - src/ui/art/CivicEmblem.svelte
  - src/ui/art/OvalOfficeScene.svelte
  - src/ui/PerkDraftModal.svelte
  - src/ui/SynergyBar.svelte
  - src/ui/MythModal.svelte
  - src/ui/StatusBar.svelte
  - src/screens/EndScreen.svelte
findings:
  critical: 0
  warning: 6
  info: 2
  total: 8
status: resolved
---

# Milestone v1.0 (Phases 39–47): Code Review Report

**Reviewed:** 2026-10-18
**Depth:** Thorough (Engine Determinism & Purity, Save/Share Trust Boundary, Content Readability Gates, Accessibility & Svelte 5 Runes)
**Files Reviewed:** 22
**Status:** Resolved (All 6 Warnings and 2 Info items fixed and verified with unit/E2E tests)

## Summary

Milestone v1.0 (`v0.9..HEAD`, Phases 39–47) was audited across engine purity/determinism, save/share serialization parity, content readability gates, and Svelte 5 runes / design token compliance:

1. **Engine Determinism & Purity (`src/engine/`)**:
   - RNG Stream 21 (`perks`) is strictly isolated in `src/engine/perks.ts`; drafting or rerolling perks never shifts crisis, court, or citizen draws on streams 0–20.
   - All numeric coefficients in `src/engine/perks.ts` and `src/engine/synergies.ts` reference `C` (`src/engine/coefficients.ts`) and `src/engine/units.ts` with zero bare literals outside `0`/`1`.
   - Every perk and synergy modifier source ID is registered in `src/content/text/why.ts`.
2. **Save/Load & Share-Your-Run Parity (`src/app/save.ts`, `src/app/share.ts`, `src/app/session.svelte.ts`)**:
   - `parseSave` and `validateDecisions` validate all Milestone v1.0 options (`presidentLook`, `classicSim`, `archetype`, `showMyths`) and decisions (`perk`, `spinMyth`) at the trust boundary.
   - Resolved parity gap in `share.ts` / `Session.fromRun` for `presidentLook` and `showMyths` (`WR-03`).
3. **Content & Readability Gates (`src/testing/content-gates.test.ts`)**:
   - Added `src/content/perks.ts` and `src/content/archetypes.ts` to the automated Flesch-Kincaid (`<= 9.0`) and 20-word sentence gate (`WR-02`).

---

## Warnings (Resolved)

### WR-01: Archetype starting perk modifiers and Evil Mode offsets not attached on Turn 1
**File:** `src/content/archetypes.ts:123-170`
**Issue:** `applyArchetypeToInitialState` appended `startingPerk` to `state.activePerks` (which counted toward Doctrine tags) but did not attach the starting perk's permanent `Modifier[]` entries to `state.modifiers` or apply `evilStashBonusBn` / `evilHeatDelta` to `state.evil`.
**Resolution:** Fixed in `src/content/archetypes.ts` by looking up `getPerk(startingPerk)` and attaching `perk:${perkDef.id}#${eff.channel}#t1` modifiers (`until: FOREVER`, `tag: 'perk'`) plus Evil Mode `offshoreStashBn` / `heat` deltas when `isNewPerk` is true. Added unit test coverage in `src/content/archetypes.test.ts`.

### WR-02: `src/content/perks.ts` and `src/content/archetypes.ts` omitted from automated readability gate
**File:** `src/testing/content-gates.test.ts:69-86`, `src/content/perks.ts`
**Issue:** `src/testing/content-gates.test.ts` imported `myths.ts` but omitted `perks.ts` and `archetypes.ts`, leaving several sentences in `perks.ts` above Flesch-Kincaid grade 9.0.
**Resolution:** Added `await import('../content/perks')` and `await import('../content/archetypes')` to `src/testing/content-gates.test.ts` (filtering non-prose keys `id`, `icon`, `emoji`, `startingPerkId`, `evilStartingPerkId`, `favoredDoctrine`, `tags`, `tier`, `channel`, `wonk`), and tightened `perks.ts` prose so every sentence passes FK `<= 9.0` and `<= 20` words.

### WR-03: `presidentLook` and `showMyths` omitted from `#run=` share URL encoding and `Session.fromRun`
**File:** `src/app/share.ts:7-140`, `src/app/session.svelte.ts:722-752`
**Issue:** While `save.ts` preserved `presidentLook` and `showMyths`, `encodeRunCode`/`decodeRunCode` in `src/app/share.ts` and `Session.fromRun` in `src/app/session.svelte.ts` omitted them.
**Resolution:** Added `presidentLook` (`pl: 0 | 1 | 2 | 3`) and `showMyths` (`sm: 0` when `false`) to `RunDescriptor`, `RunSource`, `encodeRunCode`, `decodeRunCode`, and `Session.fromRun`, with round-trip test assertions in `src/content/archetypes.test.ts`.

### WR-04: `recordRunMastery` side effect called inside `$derived` in `EndScreen.svelte`
**File:** `src/screens/EndScreen.svelte:204-230`
**Issue:** `EndScreen.svelte` called `recordRunMastery(...)` (which writes to `localStorage`) inside `$derived(...)`.
**Resolution:** Separated persistence into `$effect(() => { recordRunMastery(masteryInput); })` and kept `masteryOutcome` as a pure `$derived` computation using `evaluateRunMastery(masteryInput)` and `loadMastery()`.

### WR-05: `evilMode` flag hardcoded to `true` in `game.ts` calls to `resolvePerkDecision` and `resolveDoctrineSynergies`
**File:** `src/engine/game.ts:531, 739`
**Issue:** `step()` passed `true` instead of `Boolean(state.evil)` as the `evilMode` parameter to `resolvePerkDecision` and `resolveDoctrineSynergies`.
**Resolution:** Updated both call sites in `src/engine/game.ts` to pass `Boolean(state.evil)`.

### WR-06: `PerkDraftModal.svelte` `prevCost` lookup missed previously picked card after reroll
**File:** `src/ui/PerkDraftModal.svelte:64`
**Issue:** `prevCost` looked up `pickedId` inside `session.perkSlate` rather than `getPerk(pickedId)`, which returned `0` if the player picked a card and then rerolled the slate.
**Resolution:** Replaced `session.perkSlate.find((c) => c.id === pickedId)?.cloutCost ?? 0` with `getPerk(pickedId)?.cloutCost ?? 0`.

---

## Info (Resolved)

### IN-01: Missing `DoctrineTag` and Myth category aliases in `CivicEmblem.svelte`
**File:** `src/ui/art/CivicEmblem.svelte:20-125`
**Issue:** Passing `DoctrineTag` IDs `'green'`, `'security'`, `'main_street'`, `'fixer_ring'`, `'captured_regulators'` or Myth category icons `'gavel'`, `'treasury'`, `'chart_up'`, `'chart'`, `'scroll'`, `'compass'` fell through to the default `'capitol'` emblem.
**Resolution:** Added explicit mappings for all `DoctrineTag` and Myth category icon strings in `CivicEmblem.svelte`.

### IN-02: Raw emoji rendered for archetype badge in `EndScreen.svelte`
**File:** `src/screens/EndScreen.svelte:228`
**Issue:** `EndScreen.svelte` rendered `{session.activeArchetype.icon}` instead of `<CivicEmblem />`.
**Resolution:** Replaced `{session.activeArchetype.icon}` with `<CivicEmblem kind={session.activeArchetype.id} size={14} />`.
