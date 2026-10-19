---
phase: 48-reusable-before-after-screenshot-cv-flywheel
plan: 01
subsystem: testing
tags: [playwright, computer-vision, screenshots, visual-regression, flywheel]
provides:
  - Reusable before/after Screenshot Computer-Vision Flywheel CLI (`scripts/cv-flywheel.ts`)
  - Baseline `before` screenshots and quantitative metrics (`test-results/cv-flywheel/before/metrics.json`)
affects: [Phase 49, Phase 50, Phase 51]
key-files:
  created:
    - scripts/cv-flywheel.ts
  modified:
    - package.json
requirements-completed: [CV-01, CV-02]
duration: 5min
completed: 2026-10-18
---

# Phase 48 Plan 01: Reusable Before/After Screenshot Computer-Vision Flywheel Summary

Built `scripts/cv-flywheel.ts` (`pnpm cv:flywheel`) and captured the 12-screenshot (`6 surfaces × 2 viewports`) `before` baseline into `test-results/cv-flywheel/before/metrics.json`:
- `oval-evil`: `cardIsCreamParchment=false (lum=29.5)` confirming photo-negative card inversion.
- `oval-day`: `characterOuterStrokeCount=15`, `chyronOverlapsScenePx=22px`.
- `powers`: `fedPortraitAboveFold=false`, `courtBenchAboveFold=false`, `rawEmojiCountInCards=57`.
