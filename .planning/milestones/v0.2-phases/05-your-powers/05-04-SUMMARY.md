# 05-04 Summary: Myth Modal and Power Action Dialogs

**Status:** Completed
**Commit:** `feat(05-04): myth modal and power action dialogs`

## Changes
1. **Myth Modal (`src/ui/MythModal.svelte`):**
   - Created full civics myth card overlay matching `g-myth.png`.
   - Left column: bold red stamped `"MYTH"` header watermark, large bold misconception quote (`myth.mythStatement`), and context summary.
   - Right column: `"REALITY"` header, responsive flowchart diagram of institutional steps (`myth.flowSteps`) with SVG connection arrows, vector pill-person analyst character pointing to the chart (`Character.svelte`), `"Real levers"` available to the President, and sourced external attribution.
   - Modal footer with red stamp button: `"GOT IT (+5 CLOUT)"` (first read) / `"GOT IT"`, awarding one-time insight clout bonus.

2. **Power Action Dialogs (`src/ui/SpeechModal.svelte`, `src/ui/FedModal.svelte`):**
   - `SpeechModal.svelte`: Bully pulpit presidential address modal with target audience selection (`general` public approval, `congress` swing district trust, `business` output gap), rolling window fatigue warning, clout cost calculation, and `"DELIVER ADDRESS"` action.
   - `FedModal.svelte`: Federal Reserve dialog explaining central bank statutory independence, with toggle for public rate cut pressure (-0.50% short-term rate) alongside credibility cost warning (+0.20% inflation expectations for 4 lingering turns in the trace).

3. **Screen Wiring & Session Integration:**
   - Wired `MythModal`, `SpeechModal`, and `FedModal` into `src/screens/Game.svelte`.
   - Enabled Learn strip myth ticket buttons in `OvalOffice.svelte` and `Powers.svelte` (`"Myth? Can you lower gas prices"`, `"How it works: Executive orders & court review"`).
   - Wired modal triggers in `Powers.svelte` for bully pulpit speeches and Fed options.
   - Updated `Session` with `mythReward` derivation to preview clout rewards immediately.
   - Added unit test in `src/app/session.test.ts` covering power drafting, myth viewing, and EO signing/revoking.

## Verification
- `pnpm guard && pnpm check && pnpm test && pnpm determinism` all passed with 0 errors/warnings and 8/8 determinism.
