# Phase 37: Kitchen-Table Clarity on Hub, Diagnostic & Crisis Screens — Context

**Gathered:** 2026-10-16
**Status:** Ready for planning
**Mode:** Autonomous (`/gsd-autonomous`)

<domain>
## Phase Boundary

Upgrade `Economy.svelte`, `TurnReport.svelte`, `OvalOffice.svelte`, `Voters.svelte`, and `CrisisModal.svelte` (`SEE-01`, `SEE-02`) with Plain-Talk indicator headers, emoji health badges, `"What this means for regular people"` summaries, `whyTextForMode(source, session.vocabMode)` causal translations, and scannable `👍 Upside` / `⚠️ The Catch` `<TradeoffPill>` badges on every crisis option button and Chief of Staff advisor play.

</domain>

<decisions>
## Implementation Decisions

### Diagnostic & Report Clarity (`SEE-01`, `src/screens/Economy.svelte`, `src/ui/TurnReport.svelte`)
- **`Economy.svelte`:**
  - Use `whyTextForMode(term.source, session.vocabMode)` when building the `"Why it's happening"` top movers list so Policy Wonk mode surfaces technical macro channels (`Output gap Phillips curve`, `Taylor Rule rate adjustment`) while Plain Talk mode surfaces conversational kitchen-table causes.
  - Add a compact `"🏠 What this means for regular people"` summary line (`data-testid="economy-kitchen-table-summary"`) in the right-hand `why-panel` translating the current growth, jobs, and inflation mix into a 1-sentence household takeaway.
  - In the `"All 8 Prosperity Scores"` overlay table, prefix each indicator with a friendly emoji badge and in `wonk` mode show the technical econometric metric name in a subtitle/tooltip.
- **`TurnReport.svelte`:**
  - Prefix each indicator row in `TurnReport.svelte` with its friendly emoji icon and use `whyTextForMode(item.topCauseId, session.vocabMode)` (falling back to `item.topCauseText` when `topCauseId` is `'none'`, `'mixed'`, or security channels) while preserving existing E2E cause regex matches (`Defense readiness posture change|International crisis containment`).
  - Add a compact `"🏠 Kitchen-table takeaway"` callout line inside the `score-box` card (`data-testid="report-kitchen-table-summary"`).

### Hub, Electoral & Crisis Clarity (`SEE-02`, `src/screens/OvalOffice.svelte`, `src/screens/Voters.svelte`, `src/ui/CrisisModal.svelte`)
- **`OvalOffice.svelte`:**
  - When a Chief of Staff suggestion includes a `play?.pack` or `play?.autoWhip`, display a compact `👍 / ⚠️` trade-off hint (`BUDGET_PACKAGE_TRADEOFFS[s.play.pack]` or auto-whip vote/clout summary) right beneath the suggestion title (`data-testid="advisor-play-tradeoff"`), keeping the `.option` card compact for `1280×720`.
- **`Voters.svelte`:**
  - Add Plain-Talk tooltips (`termTooltipForMode('tipping_point_state', session.vocabMode)`) and friendly emoji cues to the `★ Tipping Point` and `Swing States` badges while keeping existing test text (`Tipping Point:`, `LOCAL FAMILY IMPACT`, `Price parity index:`) intact.
  - Add a Plain-Talk translation note in `local-family-impact` explaining what Regional Price Parity means for a family's grocery and rent bill.
- **`CrisisModal.svelte`:**
  - On every crisis response option card (`crisis.options`), compute `describeCrisisOptionTradeoff(opt.effects, opt.cloutCost, Boolean(crisis.isGeopolitical))` and render `<TradeoffPill variant="compact" emoji={t.emoji} upside={t.upside} catchText={t.catchText} whyClick={t.whyClick} vocabMode={session.vocabMode} />` inside the option card (`data-testid="crisis-option-tradeoff-{opt.id}"`) so players see the exact `👍 Upside` and `⚠️ The Catch` before clicking `DECIDE`.

</decisions>
