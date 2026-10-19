# Roadmap: govSim — Milestone v1.2 (Layered Environment Art, Civ-Style Turn Triggers & Progressive Decision Clarity)

## Overview

Milestone `v1.2` combines pre-generated vintage Americana environment plates (`oval-day-bg.jpg`, `oval-evil-bg.jpg`, `newgame-portico-bg.jpg`) with live animated SVG weather, desk props, and character rigs, while overhauling turn-by-turn decision clarity using Civ-style per-turn triggers, the `★ PENDING & CLEARING ★` stacked index card from `.design-targets/uikit.png` and `hub2.png`, and progressive disclosure across `OvalOffice`, `Budget`, and `Congress`.

## Phases

- [x] **Phase 52: Layered Environment Art, Animated Atmospheric Overlays & Dimensional Foreground Rigs** - Integrate generated Americana environment plates (`oval-day-bg.jpg`, `oval-evil-bg.jpg`, `newgame-portico-bg.jpg`) as `Layer 0` backdrops, add animated SVG/CSS weather & reactive desk props (`Layer 1`), and upgrade foreground character & stage rigs (`Layer 2`).
- [x] **Phase 53: Civ-Style Per-Turn Trigger Cadence & Smart Turn Blocker Stamp** - Build deterministic per-turn spotlight trigger pacing (`resolveTurnTrigger`), defer non-urgent Task Force prompts off Turn 1 and off Crisis turns, and compact Advisor Play rows.
- [x] **Phase 54: "What Will Clear This Turn" Stacked Index Card & Turn Resolution Preview** - Create `TurnAgendaCard.svelte` (`★ PENDING & CLEARING ★` stacked index card matching `uikit.png` & `hub2.png`) with explicit clearing badges (`CLEARS THIS TURN ✓`, `SHORT N VOTES ⚠`, `DRAFT UNSENT !`) and declutter `OvalOffice.svelte`'s right column.
- [x] **Phase 55: Progressive Disclosure on Action Screens (`Budget`, `Powers`, `Congress`) & Before/After CV Verification** - Add progressive disclosure to `Budget.svelte` and `Congress.svelte`, surface live clearing banners on action screens, and run the Before/After Screenshot CV Flywheel across `1376×768` and `1280×720`.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 52. Layered Environment Art & Foregrounds | 1/1 | Complete | 2026-10-18 |
| 53. Civ-Style Turn Triggers & Smart Turn Stamp | 1/1 | Complete | 2026-10-18 |
| 54. "What Will Clear" Stacked Index Card | 1/1 | Complete | 2026-10-18 |
| 55. Action Screen Progressive Disclosure & CV Audit | 1/1 | Complete | 2026-10-18 |
