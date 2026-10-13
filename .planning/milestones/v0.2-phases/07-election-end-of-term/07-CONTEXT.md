# Phase 7: Election & end of term - Context

**Gathered:** 2026-10-12
**Status:** Ready for planning
**Mode:** Smart discuss (all 4 grey areas accepted)

<domain>
## Phase Boundary

Phase 7 delivers the resolution of the presidential term through the Electoral College reelection at Turn 16 (Year 4), an interactive skippable election-night reveal, a deterministic 12th Amendment House contingent election for 269-269 ties, a trace-attributed why-you-won/lost debrief with turn 16 retry, second-term continuation through Turn 32 (Year 8), and the comprehensive End Screen with 10-year legacy projection and nonpartisan historian verdict tiers.

</domain>

<decisions>
## Implementation Decisions

### Election Night Reveal & Contingent Election (ELC-01, ELC-02)
- Modal overlay over the US Map with an animated EV bar race, "Skip to Result" button, and instant reveal under `prefers-reduced-motion` (`GR-37`, Pitfall 23).
- House contingent election on a 269-269 tie resolved deterministically by state delegations (26 of 50 states needed, DC excluded per 12th Amendment, `GR-15`).
- Side-by-side comparison pill in election result header comparing player vs autopilot outcome ("You: Won 287 EV · Autopilot: Lost 251 EV").
- Fast 4-second sequence calling safe states first then battlegrounds, skippable anytime via Space or Click.

### Why-You-Won/Lost Analysis & Turn Retry (ELC-03)
- Trace-derived card ranking the top 3 causal drivers that tipped key states (inflation, trade tariffs, energy prices) built directly from the engine trace.
- Prominent "Retry Turn 16" button restoring the turn 16 start state on the same seed so the player can adjust year-end decisions without rerolling luck.
- Restores turn 16 start snapshot directly into active session and updates autosave (`OBS-01`).
- Accessible on the result card for both wins and losses, encouraging counterfactual exploration.

### Second Term Continuation vs End Screen Triggers (ELC-04)
- Reelection victory displays a summary toast with "Enter Second Term" stamp, transitioning seamlessly to Turn 17 ("Term 2 · Year 5") up to Turn 32.
- Reelection defeat transitions directly to the End Screen with 4-year performance, 10-year legacy projection, and "Retry Turn 16" option.
- Turn 32 completion marks the full 8-year term, transitioning to the End Screen with final score vs autopilot and 10-year horizon.
- No premature death on low approval (rubber-band rally events prevent death spirals per design §7c); only Turn 16 loss or Turn 32 completion trigger end of term.

### End Screen Scoring, 10-Year Legacy & Historian Verdicts (ELC-05)
- Structured according to the 4-part layout grammar: Status summary, Left Rail (Record breakdowns), Main Area (10-year legacy projection chart), Right Rail (Historian Verdict card, Retry, New Game).
- Strictly single shared scoring function matching top bar headline score (`+X.X vs doing nothing`, with "Now" and "In 10 years" parts per `GR-04`).
- 5 objective, nonpartisan tiers based purely on score bands (*Transformational*, *Steward of Stability*, *Mixed Legacy*, *Unresolved Crises*, *Institutional Breakdown*), zero ideological bias.
- Pure engine 40-step projection with policies held fixed and stabilizers active, charting long-term debt and prosperity trajectory.

### The Agent's Discretion
- Exact styling details of the election night ticker tape and television network banner aesthetics matching the Americana civics poster theme.
- Visual styling of the state delegation roll-call list during a contingent election.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/voters.ts`: `evaluateElectoralCollege`, `calculateElectoralProjection`, `STATE_PROFILES`, tipping point centering logic.
- `src/engine/score.ts`: `projectScore`, `evaluateFinalScore`, prosperity index components.
- `src/ui/art/USMap.svelte`: Interactive SVG map with state path rendering and nonpartisan pattern encoding.
- `src/ui/ScreenLayout.svelte`: 4-part layout grammar scaffold.
- `src/ui/Overlay.svelte` / `src/ui/TurnReport.svelte`: Modal patterns and report cards.
- `data/us-2026.json`: Baseline state electoral votes, 2024 margins, House delegation counts.

### Established Patterns
- Svelte 5 runes (`$state`, `$derived`, `$props`).
- CSS variables exclusively from `src/design/tokens.ts` (e.g. `var(--ink)`, `var(--sage)`, `var(--alert)`, `var(--gold)`, `var(--card)`, `var(--paper)`).
- LayerChart / SVG for data visualization with zero-based axes and `<table>` fallback.

### Integration Points
- `src/app/session.svelte.ts`: Turn advancement, turn 16 reelection interception, turn 16 snapshot saving for retry, turn 32 end game routing.
- `src/screens/Game.svelte`: Adding `EndScreen` route or overlay handling.
- `src/screens/EndScreen.svelte`: The dedicated end-of-term review screen.

</code_context>

<specifics>
## Specific Ideas
- In election night, highlight the magic number "270" with a dramatic pause before calling the tipping-point state.
- In contingent election, display each state's delegation banner with House seat breakdown (e.g. "PA: 10 D, 7 R → Casts vote for D").

</specifics>

<deferred>
## Deferred Ideas
- Steam achievements / badges for winning landslide reelections (deferred to Phase 8 / `RPT-03`).
- Social media share image generator (deferred to Phase 8 / `REL-03`).

</deferred>
