---
phase: 29-free-ai-director-openrouter-free-auto-routing-living-world-variance
milestone: v0.7
scope: c700194..HEAD (Phases 25–29, 48 files)
status: resolved
reviewed_at: 2026-10-14T13:19:36Z
resolved_at: 2026-10-14T13:34:00Z
---

# Milestone v0.7 Code Review Report (Phases 25–29)

## Overview
Reviewed all 48 changed files across Milestone v0.7 (`c700194..HEAD`: Dramatic SVG Art Overhaul, Visual Flair & Satirical Wit, Year-1 Progressive Onboarding, Show Your Work Model Inspector, and Free AI Director / Living World Mode). All **2 Critical**, **5 Warning**, and **2 actionable Info** findings have been resolved and verified.

---

## Findings & Resolutions

### Critical Findings

1. **`CR-01`: AI Dynamic Crisis `cloutCost` Displayed in UI But Not Charged in Session or Engine**
   - **Location**: `src/engine/decisions.ts`, `src/engine/game.ts`, `src/app/save.ts`, `src/app/session.svelte.ts`, `src/ui/DynamicCrisisModal.svelte`
   - **Issue**: `DynamicCrisisModal.svelte` displayed `opt.cloutCost` and checked affordability against `session.current.clout`, but `DynamicCrisisDelta` lacked `cloutCost`, so staging and resolving an AI dynamic crisis option deducted 0 clout from `Session.clout` and the `cl` ledger in `step()`.
   - **Resolution**: Added `cloutCost?: number` (validated integer in `[0, MAX_DYNAMIC_CRISIS_CLOUT_COST]`) to `DynamicCrisisDelta`, `isValidDynamicCrisisDelta`, and `validateDecisions`. Updated `DynamicCrisisModal.svelte` to check `availableClout = session.clout + session.dynamicCrisisCost`, default selection to the first affordable option, and pass `cloutCost` when staging. Deducted `dynamicCrisisCost` in `Session.clout` and charged `cl.add('clout:crisis', -dynamicCrisisCloutCost)` in `src/engine/game.ts`.

2. **`CR-02`: Living World `turnEntropy` Omitted From Autopilot Counterfactual Baseline**
   - **Location**: `src/app/session.svelte.ts` (`nextTurn`, `fromSave`, `fromRun`)
   - **Issue**: Under `design.md §2` (`D2`), the autopilot baseline must face the exact same exogenous shocks as the player. `Session.nextTurn()`, `fromSave()`, and `fromRun()` passed `turnEntropy` to the player's `endTurn` step but omitted `turnEntropy` from the autopilot step.
   - **Resolution**: Forwarded `turnEntropy` into `autopilotDecisions` across `nextTurn`, `fromSave`, and `fromRun` so player and autopilot face identical Living World variance shocks.

---

### Warning Findings

1. **`WR-01`: Undefined CSS Custom Properties & Hardcoded Font Names**
   - **Location**: `src/ui/AboutModal.svelte`, `src/ui/AiSettingsModal.svelte`, `src/ui/ModelInspectorModal.svelte`, `src/ui/CrisisModal.svelte`
   - **Issue**: `AboutModal.svelte` referenced undefined `--font-headline`, `--font-label`, and `--gold-soft`; `AiSettingsModal.svelte` referenced undefined `--accent`; `CrisisModal.svelte` referenced undefined `--ink-muted`; `ModelInspectorModal.svelte` hardcoded `'Rokkitt'` and `'Atkinson Hyperlegible'` instead of design tokens.
   - **Resolution**: Replaced all undefined variables and font literals with canonical tokens from `src/design/tokens.ts` (`var(--font-display)`, `var(--font-ui)`, `var(--font-body)`, `var(--gold)`, `var(--ink-soft)`).

2. **`WR-02`: Share-Your-Run (`share.ts` & `Session.fromRun`) Dropped `livingWorld` and `unlockAll` Options**
   - **Location**: `src/app/share.ts`, `src/app/session.svelte.ts`
   - **Issue**: `encodeRunCode` and `decodeRunCode` did not serialize `livingWorld` (`lw`) or `unlockAll` (`ua`), causing shared Living World runs opened mid-term to lose their mode flag on subsequent turns.
   - **Resolution**: Added `lw` and `ua` flags to `encodeRunCode`/`decodeRunCode` and restored them in `Session.fromRun`. Added round-trip assertions in `src/engine/living-world.test.ts`.

3. **`WR-03`: Async Race Condition in `Session.refreshAiDirector()` & Hash Fragment in OpenRouter PKCE `callback_url`**
   - **Location**: `src/app/session.svelte.ts`, `src/app/ai-providers.ts`
   - **Issue**: An in-flight AI completion from Turn $N$ could resolve after advancing to Turn $N+1$ and overwrite `aiTurnPayload`. Additionally, `startOpenRouterPkceAuth` stripped `?query` from `callbackUrl` but could leave `#hash` fragments attached.
   - **Resolution**: Added a monotonically increasing `aiRequestSeq` and `expectedTurn` check in `Session.refreshAiDirector()`, and stripped both `#hash` and `?query` in `startOpenRouterPkceAuth`.

4. **`WR-04`: ARIA Role Mismatch in `ModelInspectorModal.svelte` Domain Filter Pills**
   - **Location**: `src/ui/ModelInspectorModal.svelte`
   - **Issue**: `.domain-pills` used `role="radiogroup"` while child buttons used `aria-pressed` without `role="radio"`.
   - **Resolution**: Updated child buttons to `role="radio"` with `aria-checked={selectedDomain === domain.id}`.

5. **`WR-05`: Readability Gate (`content-gates.test.ts`) Did Not Import `src/content/text/why.ts`**
   - **Location**: `src/testing/content-gates.test.ts`
   - **Issue**: `src/content/text/why.ts` was modified in Phase 29 with new trace explanations but was not included in the readability gate's `mods` array.
   - **Resolution**: Added `await import('../content/text/why')` to `src/testing/content-gates.test.ts`.

---

### Info Improvements Applied

1. **`IN-01`: Custom OpenAI Endpoint CSP Scope Note**: Clarified in `AiSettingsModal.svelte` helper text that custom local endpoints must run on `localhost` or `127.0.0.1` due to strict CSP.
2. **`IN-02`: Clear Saved Key Button**: Added a `"Clear Saved Key"` button (`data-testid="clear-ai-key-btn"`) in `AiSettingsModal.svelte` when an API key is present in `localStorage`.
