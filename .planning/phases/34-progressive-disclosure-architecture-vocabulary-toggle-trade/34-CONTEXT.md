# Phase 34: Progressive Disclosure Architecture, Vocabulary Toggle & Trade-Off Components - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning
**Mode:** Smart Autonomous (user-confirmed in Milestone v0.9 initialization)

<domain>
## Phase Boundary

Build the progressive-disclosure foundation, a 1-click `"Plain Talk / Policy Wonk"` vocabulary toggle (`vocabMode: 'plain' | 'wonk'`), a typed Civics Glossary catalog (`src/content/glossary.ts`), and a reusable `<TradeoffPill>` / `<WhyClickCard>` progressive-disclosure UI component (`src/ui/TradeoffPill.svelte`) (`VOCAB-01`, `VOCAB-02`, `VOCAB-03`).

</domain>

<decisions>
## Implementation Decisions

### 1. Vocabulary Mode (`vocabMode: 'plain' | 'wonk'`) (`VOCAB-01`)
- Add `export type VocabMode = 'plain' | 'wonk'` in `src/app/session.svelte.ts` (and optional `vocabMode?: VocabMode` in `GameOptions`, validated in `src/app/save.ts`).
- `Session.vocabMode` defaults to `'plain'` (or reads `localStorage.getItem('govsim_vocab_mode') === 'wonk' ? 'wonk' : (options.vocabMode ?? 'plain')`).
- Add `Session.toggleVocabMode()` and `Session.setVocabMode(mode: VocabMode)` which persist to `localStorage` (`govsim_vocab_mode`), update `document.documentElement.dataset.vocab`, and update `this.options = { ...this.options, vocabMode: this.vocabMode }`.
- Wire `vocabMode` and `onToggleVocab` into `StatusBar.svelte` (`🗣️ Plain Talk` vs. `📜 Policy Wonk`, `data-testid="vocab-mode-toggle"`) and `NewGame.svelte` (`data-testid="vocab-mode-selector"`), keeping `NewGame.svelte` compact so `1376×768` and `1280×720` have zero outer scroll.

### 2. Typed Civics Glossary & Progressive Disclosure Registry (`VOCAB-02`)
- Create `src/content/glossary.ts` (with unit tests in `src/content/glossary.test.ts` and registered in `src/testing/content-gates.test.ts`) exporting `GLOSSARY_CATALOG` and `getGlossaryTerm(id: GlossaryTermId)` / `formatTerm(id: GlossaryTermId, mode: VocabMode)`.
- Include at least 12 core simulationist terms (`cloture`, `reconciliation`, `section_301_232`, `ieepa_ofac`, `major_questions`, `output_gap`, `cpi_pass_through`, `taylor_rule`, `gini`, `tipping_point`, `emp_pop`, `retaliatory_tariff`), each with:
  - `id`: typed `GlossaryTermId`
  - `emoji`: friendly emoji cue
  - `plainLabel`: <= 5 words kitchen-table label
  - `wonkLabel`: official statutory/economic term
  - `plainHint`: 1-sentence plain explanation (grade <= 9.0, <= 20 words)
  - `realTermNote`: concise `"Real term: ..."` progressive-disclosure note

### 3. Reusable `<TradeoffPill>` Progressive Disclosure Component (`VOCAB-03`)
- Create `src/ui/TradeoffPill.svelte` (and `src/ui/TradeoffPill.test.ts`) supporting two clean layouts:
  - `compact`: inline `👍 Upside` and `⚠️ Catch` pills with optional expandable `"📜 Real term / Law"` chip.
  - `card`: right-column `"Why click this?"` advisor decision card with emoji header, 1-sentence advisor pitch, `👍 Upside` / `⚠️ The Catch` rows, optional visual impact meter (`-3` to `+3` dots/bars), and progressive-disclosure statutory/real-term drawer (auto-expanded when `vocabMode === 'wonk'`, toggleable on click/keyboard when `vocabMode === 'plain'`).

</decisions>

<code_context>
## Existing Code Insights

- `src/app/session.svelte.ts`: Holds `calmMode`, `unlockAll`, `options`, and `toggleCalmMode()`.
- `src/app/save.ts`: Validates `SaveFile.options` at the trust boundary.
- `src/ui/StatusBar.svelte`: Renders `.party-calm-wrap` with `calm-mode-toggle`.
- `src/screens/NewGame.svelte`: Renders game setup options inside a `100dvh` layout.
- `src/testing/content-gates.test.ts`: Enforces Flesch-Kincaid grade <= 9.0, <= 20 words/sentence, no real politicians, and party isolation.

</code_context>

<specifics>
## Specific Requirements

- `VOCAB-01`: Persistent `vocabMode: 'plain' | 'wonk'` in `Session`, `NewGame.svelte`, `StatusBar.svelte`, and `save.ts`.
- `VOCAB-02`: `src/content/glossary.ts` with 12+ terms passing all readability gates.
- `VOCAB-03`: `src/ui/TradeoffPill.svelte` with compact & card modes, keyboard accessibility, and progressive disclosure.

</specifics>
