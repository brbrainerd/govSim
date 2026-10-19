# Requirements: govSim — Milestone v1.2

**Defined:** 2026-10-18
**Core Value:** Combine high-craft pre-generated Americana environment art with live animated SVG foregrounds, and make every turn effortless to navigate through Civ-style per-turn triggers, a live "What Will Clear This Turn" stacked index card (`uikit.png` / `hub2.png`), and progressive disclosure on dense policy screens.

## v1.2 Requirements

### Phase 52: Layered Environment Art, Animated Atmospheric Overlays & Dimensional Foreground Rigs (`ENV`)
- [x] **ENV-01**: Integrate high-craft generated vintage Americana environment plates (`public/assets/environments/oval-day-bg.jpg`, `oval-evil-bg.jpg`, `newgame-portico-bg.jpg`) as `Layer 0` architectural backdrops in `OvalOfficeScene.svelte` and `NewGame.svelte`, preserving responsive framing and zero network egress.
- [x] **ENV-02**: Layer reactive animated SVG/CSS midground props & weather (`Layer 1`) over the environment plates: animated weather/lighting outside the Oval Office windows (sunbeams in high approval, rain streaks & lightning flash during crises, ominous amber glow in Evil Mode), swaying flags, carved Presidential Seal relief on the Resolute Desk, growing legislative dossier stack matching `stagedCount`, ringing red Crisis phone, and animated Evil Mode paper shredder + cash stacks.
- [x] **ENV-03**: Upgrade foreground character & stage rigs (`Layer 2` in `Character.svelte`, `OvalOfficeScene.svelte`, `NewGame.svelte`) with subtle ground contact shadows, lapel/collar depth shading, and smooth idle/speaking animations (disabled automatically in `Calm mode`).

### Phase 53: Civ-Style Per-Turn Trigger Cadence & Smart Turn Blocker Stamp (`TRIG`)
- [x] **TRIG-01**: Implement a deterministic **Civ-Style Per-Turn Trigger Cadence** (`src/app/turn-triggers.ts` + `resolveTurnTrigger`) that surfaces **at most one primary spotlight trigger per turn** (prioritizing Unresolved Crisis -> Unsent Budget / Failing Bill -> Milestone Event -> Ready Clearing -> Task Force Draft -> Advisor Priority, and automatically deferring non-urgent Task Force prompts off Turn 1 and off Crisis turns).
- [x] **TRIG-02**: Upgrade `StatusBar.svelte`'s primary Turn Stamp area with a live clearing sub-badge (`✓ N clearing` / `! 1 unsent`) and `TurnAgendaCard.svelte`'s spotlight trigger pill that dynamically guides the player through unresolved turn blockers before ending the quarter.
- [x] **TRIG-03**: Add 1-click play staging on `TurnAgendaCard.svelte` and compact single-row horizontal Advisor Play banners in `OvalOffice.svelte`.

### Phase 54: "What Will Clear This Turn" Stacked Index Card & Turn Resolution Preview (`CLEAR`)
- [x] **CLEAR-01**: Build `src/ui/TurnAgendaCard.svelte` — the **`★ PENDING & CLEARING ★` Stacked Index Card** modeled directly on `.design-targets/uikit.png` and `hub2.png` — featuring layered index-card paper edges and a scannable checklist (`[✓]`, `[!]`, `[ ]`).
- [x] **CLEAR-02**: Surface explicit per-item **clearing status badges and projected outcomes** in `TurnAgendaCard.svelte` and `StatusBar.svelte`'s Staged Decisions popover (`CLEARS THIS TURN ✓`, `PASSES (224/218) ✓`, `SHORT N VOTES ⚠`, `DRAFT UNSENT !`, plus net Clout delta and 1-click jump / `×` unstage controls).
- [x] **CLEAR-03**: Declutter `OvalOffice.svelte`'s right column (`{#snippet next()}`) with `TurnAgendaCard`, compact 1-line `HouseholdCard`, and compact single-row `.card.option` Advisor Plays, guaranteeing zero right-column overflow at `1376×768` and `1280×720`.

### Phase 55: Progressive Disclosure on Action Screens (`Budget`, `Powers`, `Congress`) & Before/After CV Verification (`PROG`)
- [x] **PROG-01**: Add progressive disclosure to `Budget.svelte` (`Focus: Core 6 Only` / `Show All 12 Levers` toggle, auto-showing modified levers) plus a live `"Clearing Status"` indicator (`data-testid="budget-clearing-banner"`) above the `Send to Congress` stamp.
- [x] **PROG-02**: Add a live **"What Clears This Turn"** status pill (`data-testid="congress-clearing-banner"`) and progressive deal trade-off toggle (`data-testid="congress-progressive-toggle"`) to `Congress.svelte`.
- [x] **PROG-03**: Extend `scripts/cv-flywheel.ts` and `tests/cv-flywheel.spec.ts` to capture the Milestone `v1.2` **After** screenshots across `1376×768` and `1280×720`, generate side-by-side **Before | After | Target** comparison sheets, and verify all unit, determinism, and Playwright E2E gates pass.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENV-01 | Phase 52 | Complete |
| ENV-02 | Phase 52 | Complete |
| ENV-03 | Phase 52 | Complete |
| TRIG-01 | Phase 53 | Complete |
| TRIG-02 | Phase 53 | Complete |
| TRIG-03 | Phase 53 | Complete |
| CLEAR-01 | Phase 54 | Complete |
| CLEAR-02 | Phase 54 | Complete |
| CLEAR-03 | Phase 54 | Complete |
| PROG-01 | Phase 55 | Complete |
| PROG-02 | Phase 55 | Complete |
| PROG-03 | Phase 55 | Complete |
