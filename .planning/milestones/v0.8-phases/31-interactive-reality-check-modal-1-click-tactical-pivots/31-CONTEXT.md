# Phase 31: Interactive Reality-Check Modal & 1-Click Tactical Pivots - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning
**Mode:** Smart Autonomous (grounded in `.planning/research/v0.8-PEDAGOGY-MYTHS.md`)

<domain>
## Phase Boundary

Turn `MythModal.svelte` from a static reading popup into an interactive Reality-Check Dossier with optional prediction-error challenges, tactile stamp animations, and 1-click pivots to real levers (`MYTH-03`, `MYTH-04`, `PIVOT-02`).

</domain>

<decisions>
## Implementation Decisions

### 1. Interactive Prediction Step in `MythModal.svelte`
- When opened, if the card has never been viewed or if the user wants to test intuition:
  - Present the 2 options from `myth.predictionPrompt.options`.
  - When the player selects an option:
    - Reveal whether their prediction was correct (`correctIndex`).
    - Display `predictionPrompt.refutation`.
    - Slam the tactile `MYTH BUSTED` stamp down with micro-animation (respecting `session.calmMode` and `prefers-reduced-motion`).
    - Reveal the full institutional reality flowchart, character scene, and real levers.

### 2. Zero-Friction Escape Hatch / Direct Dismissal (`MYTH-04`)
- Never gate players behind a mandatory quiz:
  - Display a prominent `"Skip to Reality"` text link/button that immediately reveals the flowchart and real levers without answering.
  - The `"GOT IT (+5 CLOUT)"` or `"Close"` button remains accessible at the bottom.

### 3. Actionable 1-Click Tactical Pivot Buttons (`PIVOT-02`)
- In `MythModal.svelte`, replace the static `<span class="lever-pill">` pills with interactive buttons:
  - Renders each `realLeverActions` entry with a directional arrow and hint tooltip:
    e.g., `⚡ Energy permits →`, `⚡ Release oil reserve →`, `⚡ Adjust fuel tariffs →`.
  - On click:
    - Awards the myth curiosity bonus (`session.viewMythCard(myth.id)`).
    - Navigates directly to the target screen using `go(action.screen)` (passed via props).
    - Closes `MythModal`.
    - If the target screen is opened, focuses or pre-stages the relevant package/lever where applicable.

</decisions>

<code_context>
## Existing Code Insights

- `src/ui/MythModal.svelte`: Currently renders static `myth-quote`, flowchart, static `lever-pill` spans, and a single `GOT IT` button.
- `src/screens/Game.svelte`: Mounts `<MythModal myth={activeMyth} isFirstView={...} onClose={...} onGotIt={...} />`. Needs to pass `go={(screen) => session.currentScreen = screen}` or `session.go(screen)` and handle tactical pivot callbacks.
- `src/app/session.svelte.ts`: `viewMythCard(id: string)` handles recording viewed myth and setting `draft.viewMyth`.

</code_context>

<specifics>
## Specific Requirements

- `MYTH-03`: Interactive 1-click prediction challenge before revealing causal reality + `MYTH BUSTED` stamp animation.
- `MYTH-04`: Zero-friction "Skip to Reality" / direct dismiss path so learning is never forced.
- `PIVOT-02`: Clickable tactical pivot buttons inside `MythModal.svelte` executing navigation and lever staging.

</specifics>
