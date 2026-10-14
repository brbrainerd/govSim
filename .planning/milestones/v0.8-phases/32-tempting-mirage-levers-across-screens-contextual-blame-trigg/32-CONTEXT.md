# Phase 32: Tempting "Mirage Levers" Across Screens & Contextual Blame Triggers - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning
**Mode:** Smart Autonomous (grounded in `.planning/research/v0.8-PEDAGOGY-MYTHS.md`)

<domain>
## Phase Boundary

Surface myths intrinsically at the moment of player intent via tempting "Mirage Lever" buttons on policy screens and dynamic voter-blame briefing cards in the Oval Office (`MYTH-01`, `MYTH-02`).

</domain>

<decisions>
## Implementation Decisions

### 1. Viewport-Safe Mirage Lever Placement Across Policy Screens (`MYTH-01`)
- **Visual Design**:
  - Renders as an eye-catching, populist "Easy Button" (e.g. styled as a ticket/stamp button with gold/alert highlight) labeled with `myth.mirageLabel` (e.g. `⚡ Cap Pump Gas at $2.50`, `⚡ Order 2% Fed Rate Cut`, `⚡ Zero Out Foreign Aid`).
  - Clicking a Mirage Lever opens `MythModal` with that myth ID (`onOpenMyth(mythId)`).
  - Placed strictly in viewport-safe locations audited to prevent outer vertical/horizontal scrolling at `1376×768` and `1280×720`:
    - `Economy.svelte`: Right side of `.economy-nav-bar` (`interest_rates`, `presidential_jobs`).
    - `Budget.svelte`: Right column `{#snippet next()}` above `.spacer` (`foreign_aid_deficit`, `supply_side_taxes`, `immigration_crime_budget`).
    - `Congress.svelte`: Wire missing `onOpenMyth` prop in `Game.svelte`; place in `.chamber .bill` header and Learn strip (`debt_ceiling_default`, `veto_line_item`).
    - `Powers.svelte`: In `.section-header` / `.orders-grid` (`gas_prices`, `rule_by_decree`, `scotus_instant_reversal`).
    - `Trade.svelte`: In `.trade-sidebar` (`trade_deficits`).
    - `Voters.svelte`: In `.voters-sidebar .action-card` (`popular_vote_mandate`).

### 2. Contextual Oval Office Blame Triggers (`MYTH-02`)
- In `src/content/briefing.ts` (`generateBriefing`):
  - When macroeconomic indicators show acute voter stress and the corresponding myth has not yet been viewed:
    - High inflation / gas prices (`inflation > 0.035`): Chief of Staff surfaces suggestion to address fuel price anger (`gas_prices`).
    - High interest rates / rate hikes (`interestRate > 0.045`): Suggestion to address Fed rate blame (`interest_rates`).
    - Elevated unemployment (`unemployment > 0.05`): Suggestion on jobs creation claims (`presidential_jobs`).
    - High deficit (`deficit > 0.05`): Suggestion on foreign aid / entitlement deficit myths (`foreign_aid_deficit` or `immigration_crime_budget`).
  - Suggestion has `cta: 'Bust myth'` or `'Address claim'`, and wires `onOpenMyth(suggestion.mythId)` on `OvalOffice.svelte`.

</decisions>

<code_context>
## Existing Code Insights

- `src/screens/Game.svelte`: Mounts `<Congress session={session} ... />` — currently does NOT pass `onOpenMyth`. Adding `onOpenMyth={(id) => (activeMythId = id)}` unlocks myths in Congress.
- `src/screens/Congress.svelte`: Accepts `onOpenMyth?: (id: string) => void`.
- `src/content/briefing.ts`: Generates dynamic Oval Office briefing text, thisTurn alert, and suggestions. Already has `mythId?: string` on `Suggestion` interface!
- `src/screens/OvalOffice.svelte`: Already handles `onOpenMyth?.(s.mythId)` when `s.mythId` is present on a suggestion.

</code_context>

<specifics>
## Specific Requirements

- `MYTH-01`: Viewport-safe tempting "Mirage Lever" controls across `Economy`, `Budget`, `Congress`, `Powers`, `Trade`, and `Voters` screens (zero outer scroll at `1376×768` and `1280×720`).
- `MYTH-02`: Contextual Chief of Staff briefing suggestions surfacing unexamined myths when macro indicators spike.

</specifics>
