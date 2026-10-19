# Requirements: govSim v1.1 Visual Fidelity, Evil Mode Palette & Computer-Vision Flywheel

**Defined:** 2026-10-18
**Core Value:** Leave America more prosperous than doing nothing — and learn how the levers really work along the way.

## v1.1 Requirements

Requirements for Milestone v1.1 ("Visual Fidelity, Evil Mode Palette & Computer-Vision Flywheel").

### Reusable Before/After Screenshot Computer-Vision Flywheel (`CV`)

- [x] **CV-01**: A reusable Playwright + pixel/DOM telemetry script (`scripts/cv-flywheel.ts`) captures deterministic `before` and `after` screenshots across `1376×768` and `1280×720` for key surfaces (`newgame`, `oval-day`, `oval-evil`, `powers`, `congress`, `budget`).
- [x] **CV-02**: The flywheel computes quantitative DOM & pixel metrics (`cardLuminance`, `paperLuminance`, `cardIsCreamParchment`, `characterOuterStrokeCount`, `chyronOverlapsScenePx`, `fedPortraitAboveFold`, `courtBenchAboveFold`, `rawEmojiCountInCards`, `outerOverflowPx`) and emits a structured JSON + Markdown comparison report (`test-results/cv-flywheel/cv-report.md`).
- [x] **CV-03**: The flywheel generates side-by-side **Before | After | Target** comparison sheets (`test-results/cv-flywheel/compare/compare-*.png`) pairing live screenshots against `.design-targets/g-home.png`, `g-evil.png`, `g-powers.png`, `g-newgame.png`, `g-congress.png`, and `g-budget.png`.

### Evil Mode Non-Inverted Palette & Surface Remediation (`EVIL-PAL`)

- [x] **EVIL-PAL-01**: Fix Evil Mode's inverted photo-negative palette in `src/design/tokens.ts` and `src/design/global.css`: keep the outer `--canvas` dark espresso (`#1A1410`), restore `--card` to warm cream parchment (`#F5EBD6`) and `--paper` to warm aged parchment (`#E6D5B8`) with dark `--ink` (`#1E1612`), and add `--paper-ink` (`#F5EBD6`) / `--paper-ink-soft` (`#D5C29A`) for text directly on `--canvas`.
- [x] **EVIL-PAL-02**: Style Evil Mode's top `StatusBar.svelte` with warm antique-brass (`var(--paper-warm)`) and dark ink, and style the Evil Mode `Ribbon.svelte` banner in rich crimson (`var(--alert)` / `var(--alert-dark)`) with cream lettering, matching `.design-targets/g-evil.png`.
- [x] **EVIL-PAL-03**: Align Evil Mode's `OvalOfficeScene.svelte` tokens and stage frame with `.design-targets/g-evil.png`: warm olive-brass walls (`#3D311E`), rich crimson drapes (`#7E191B`) with theatrical corner swag drapes, dark walnut Resolute Desk (`#3A2416`), glowing cream banker's lamp shade (`#F3DE9A`), and crisp cream shredder paper (`#F5EBD6`).

### Borderless Flat-Vector Pill-Pawn Character Rig (`CHAR`)

- [x] **CHAR-01**: Remove cartoon black `stroke="var(--ink)"` outer borders from `Character.svelte`, `CharacterPortrait.svelte`, `FedPortrait.svelte`, and `CourtBench.svelte` (`characterOuterStrokeCount === 0`), matching `uikit.png` ("Pill people as per ref image 2, flat vector, no outlines") and `D.png`.
- [x] **CHAR-02**: Give `PRESIDENT_LOOKS[0..2]` and male character presets in `Character.svelte` and `FedPortrait.svelte` the iconic smooth, unadorned thumb/finger dome head from `.design-targets/D.png` (`#1 President`, `#2 COS`, `#3 Fed Chair`, `#5 Blue Bloc`, `#6 Red Bloc`) and `g-newgame.png`, while keeping swept bob/bun/long/afro hair on female characters (`#4 News Anchor`, `#7 Citizen`, `PRESIDENT_LOOKS[3]`).
- [x] **CHAR-03**: Refine flat-vector suit lapels, V-neck shirt collars, ties, wide toothy `scheming` grin, and handheld props (`clipboard`, `mic`, `cash_fan`, `gavel`) in `Character.svelte` using clean layered fills and subtle cylindrical shading (`opacity=".07"`..`".24"`).

### Oval Office Scene & Non-Overlapping Chyron (`OVAL`)

- [x] **OVAL-01**: Remove the 4 floating rectangles in front of the curtains in `OvalOfficeScene.svelte`, widen and lengthen the pleated curtains to full height (`y=14..286`), and narrow/lower the executive chair behind the President's shoulders to match `g-home.png` and `hub2.png`.
- [x] **OVAL-02**: Move `.chyron-strip` in `OvalOffice.svelte` out of `position: absolute` overlap so it sits cleanly below `.scene` (`chyronOverlapsScenePx === 0`), leaving the Resolute Desk and Presidential Carpet Seal unobstructed.

### Powers & NewGame Layout Density & Zero-Emoji Sweep (`GUI`)

- [x] **GUI-01**: Compact `Powers.svelte`'s Executive Orders grid (5 columns × 2 rows) and card padding so the Institutional Power Strip (`FedPortrait` + `CourtBench`) is completely visible above the fold at both `1376×768` and `1280×720` (`fedPortraitAboveFold === true`, `courtBenchAboveFold === true`), matching `.design-targets/g-powers.png`.
- [x] **GUI-02**: Enlarge the White House inauguration stage hero (`portico-banner` `>= 210px` height in a wider poster column) on `NewGame.svelte` (`g-newgame.png`) and enlarge `Hemicycle.svelte` on `Congress.svelte` (`g-congress.png`) while maintaining zero outer viewport scroll at `1280×720`.
- [x] **GUI-03**: Replace all remaining raw Unicode emojis inside cards on `Powers.svelte`, `Congress.svelte`, and `Budget.svelte` with `<CivicEmblem>` vector icons (`rawEmojiCountInCards === 0`).

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CV-01 | Phase 48 | Complete |
| CV-02 | Phase 48 | Complete |
| CV-03 | Phase 48 | Complete |
| EVIL-PAL-01 | Phase 49 | Complete |
| EVIL-PAL-02 | Phase 49 | Complete |
| EVIL-PAL-03 | Phase 49 | Complete |
| CHAR-01 | Phase 50 | Complete |
| CHAR-02 | Phase 50 | Complete |
| CHAR-03 | Phase 50 | Complete |
| OVAL-01 | Phase 50 | Complete |
| OVAL-02 | Phase 50 | Complete |
| GUI-01 | Phase 51 | Complete |
| GUI-02 | Phase 51 | Complete |
| GUI-03 | Phase 51 | Complete |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Complete: 14 (100%)
