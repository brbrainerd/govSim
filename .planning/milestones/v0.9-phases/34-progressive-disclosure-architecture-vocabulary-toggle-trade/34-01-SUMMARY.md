---
phase: 34-progressive-disclosure-architecture-vocabulary-toggle-trade
plan: 01
subsystem: ui, content, app
tags: [progressive-disclosure, glossary, vocab-mode, tradeoff-pill]
provides:
  - VocabMode ('plain' | 'wonk') reactive session state + persistence
  - Typed Civics Glossary (GLOSSARY_CATALOG) with 12 foundational terms
  - Reusable TradeoffPill component (compact & card variants)
affects: [StatusBar, NewGame, Session, Save]
key-files:
  created:
    - src/content/glossary.ts
    - src/content/glossary.test.ts
    - src/ui/TradeoffPill.svelte
    - src/ui/TradeoffPill.test.ts
  modified:
    - src/app/session.svelte.ts
    - src/app/save.ts
    - src/ui/StatusBar.svelte
    - src/screens/Game.svelte
    - src/screens/NewGame.svelte
    - src/testing/content-gates.test.ts
completed: 2026-10-16
---

# Phase 34 Plan 01 Summary: Progressive Disclosure Architecture, Vocabulary Toggle & Trade-Off Components

## Accomplishments
- **Civics Glossary (`VOCAB-02`):** Created `src/content/glossary.ts` with 12 foundational terms (`clout`, `filibuster`, `reconciliation`, `debt_ceiling`, `yield_curve`, `stagflation`, `fed_funds_rate`, `judicial_review`, `ContinuingResolution`, `tariff_retaliation`, `gini_index`, `pork_barrel`) providing `plainLabel`, `wonkLabel`, `emoji`, `plainExplain`, `whyItMatters`, and `statutoryBasis`.
- **Session & UI Vocabulary Mode (`VOCAB-01`):** Added `vocabMode: 'plain' | 'wonk'` to `Session` (defaulting to `'plain'`, persisted to `localStorage` and save files) and exposed 1-click toggles in `StatusBar.svelte` (`data-testid="vocab-mode-toggle"`) and `NewGame.svelte` (`data-testid="vocab-mode-toggle-newgame"` in a compact 3-column options grid).
- **Trade-Off & Progressive-Disclosure Component (`VOCAB-03`):** Created `src/ui/TradeoffPill.svelte` supporting `compact` inline badges (`👍 Upside` / `⚠️ The Catch` + hover/wonk statutory note) and `card` advisor briefs (`💡 Why click this:` + net impact pill + collapsible Policy Wonk drawer).

## Verification
- `pnpm vitest run src/content/glossary.test.ts src/ui/TradeoffPill.test.ts src/testing/content-gates.test.ts`: 9/9 tests passed.
- `pnpm check`: 0 errors, 0 warnings.
- `pnpm guard`: passed (`guard ok`).
