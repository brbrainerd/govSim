# Roadmap: govSim

## Milestones

- ✅ **v0.2 Playable First Term** — Phases 1–8 (shipped 2026-10-15)
- ✅ **v0.3 Social Policy & Domestic Reform** — Phases 9–12 (shipped 2026-10-16)
- ✅ **v0.4 Foreign Policy & International Crises** — Phases 13–16 (shipped 2026-10-16)
- ✅ **v0.5 Satirical "Evil Mode"** — Phases 17–20 (shipped 2026-10-16)
- ✅ **v0.6 Completeness, Advisor Agency & Scenarios** — Phases 21–24 (shipped 2026-10-17)
- ✅ **v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director** — Phases 25–29 (shipped 2026-10-17)
- ✅ **v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy** — Phases 30–33 (shipped 2026-10-18)
- ✅ **v0.9 Progressive Disclosure, Plain-Talk Civics, Trade-Off Clarity & Gameplay Balance** — Phases 34–38 (shipped 2026-10-18)
- ✅ **v1.0 High-Craft Character Art, Living Animations, UI/UX Alignment & Incremental Mandate Synergies** — Phases 39–47 (shipped 2026-10-18)
- ✅ **v1.1 Visual Fidelity, Evil Mode Palette & Computer-Vision Flywheel** — Phases 48–51 (completed 2026-10-18)

---

## Milestone v1.1: Visual Fidelity, Evil Mode Palette & Computer-Vision Flywheel

**Goal:** Build a reusable before/after Screenshot Computer-Vision Flywheel (`scripts/cv-flywheel.ts`) that captures baseline and remediated screenshots across `1376×768` and `1280×720`, computes quantitative pixel/DOM telemetry against `.design-targets/*.png`, and drives a visual overhaul fixing Evil Mode's inverted color palette (`g-evil.png`), borderless flat-vector pill-pawn character geometry (`D.png`, `uikit.png`), Oval Office architecture & non-overlapping chyron (`g-home.png`), and above-the-fold layout density + zero raw emojis on `Powers.svelte`, `NewGame.svelte`, `Congress.svelte`, and `Budget.svelte` (`g-powers.png`, `g-newgame.png`, `g-congress.png`, `g-budget.png`).

### Phases

- [x] **Phase 48: Reusable Before/After Screenshot Computer-Vision Flywheel & Baseline Audit** - Build `scripts/cv-flywheel.ts`, capture the `before` baseline across 6 key surfaces at `1376×768` and `1280×720`, and record baseline DOM/pixel metrics (`CV-01`, `CV-02`, `CV-03`).
- [x] **Phase 49: Evil Mode Non-Inverted Palette & Surface Remediation** - Fix Evil Mode's inverted dark-card palette in `src/design/tokens.ts`, `StatusBar.svelte`, `Ribbon.svelte`, `OvalOffice.svelte`, and `OvalOfficeScene.svelte` so cards use warm cream parchment (`#F5EBD6`) with dark ink (`#1E1612`) on a dark espresso outer canvas (`#1A1410`), matching `.design-targets/g-evil.png` (`EVIL-PAL-01`, `EVIL-PAL-02`, `EVIL-PAL-03`).
- [x] **Phase 50: Borderless Flat-Vector Pill-Pawn Character Rig & Oval Office Scene Overhaul** - Remove cartoon `stroke="var(--ink)"` outlines from `Character.svelte`, `CharacterPortrait.svelte`, and `FedPortrait.svelte`, restore smooth unadorned thumb/finger dome heads for male characters (`D.png`), fix `OvalOfficeScene.svelte` curtains/chair/window artifacts, and move `.chyron-strip` out of overlap (`CHAR-01`, `CHAR-02`, `CHAR-03`, `OVAL-01`, `OVAL-02`).
- [x] **Phase 51: Powers & NewGame Layout Density, Zero-Emoji Sweep & After CV Verification** - Compact `Powers.svelte`'s Executive Orders grid so `FedPortrait` and `CourtBench` are visible above the fold at `1280×720`, enlarge `NewGame.svelte`'s White House inauguration stage and `Hemicycle.svelte`, replace all raw Unicode emojis with `<CivicEmblem>`, and run the `after` + `compare` CV flywheel (`GUI-01`, `GUI-02`, `GUI-03`).

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 48. Reusable Before/After Screenshot CV Flywheel | v1.1 | 1/1 | Complete | 2026-10-18 |
| 49. Evil Mode Non-Inverted Palette | v1.1 | 1/1 | Complete | 2026-10-18 |
| 50. Borderless Flat-Vector Pill-Pawn Rig & Oval Office | v1.1 | 1/1 | Complete | 2026-10-18 |
| 51. Powers & NewGame Layout Density & After CV Verification | v1.1 | 1/1 | Complete | 2026-10-18 |
