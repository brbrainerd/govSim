---
phase: 49-evil-mode-non-inverted-palette
plan: 01
subsystem: design
tags: [tokens, evil-mode, palette, status-bar, oval-office]
provides:
  - Non-inverted Evil Mode palette matching .design-targets/g-evil.png
  - Separate --canvas (#1A1410 dark espresso) vs --paper (#E6D5B8) and --card (#F5EBD6 warm cream parchment)
  - Antique-brass top StatusBar and crimson OVAL OFFICE ribbon in Evil Mode
affects:
  - src/design/tokens.ts
  - src/design/global.css
  - src/ui/StatusBar.svelte
  - src/ui/art/Ribbon.svelte
  - src/ui/Rail.svelte
  - src/ui/ScreenLayout.svelte
  - src/screens/OvalOffice.svelte
  - src/ui/MythModal.svelte
key-files:
  modified:
    - src/design/tokens.ts
    - src/design/global.css
    - src/ui/StatusBar.svelte
    - src/ui/art/Ribbon.svelte
    - src/ui/Rail.svelte
    - src/ui/ScreenLayout.svelte
    - src/screens/OvalOffice.svelte
    - src/ui/MythModal.svelte
requirements-completed: [EVIL-PAL-01, EVIL-PAL-02, EVIL-PAL-03]
completed: 2026-10-18
---

# Phase 49 Plan 01: Evil Mode Non-Inverted Palette & Surface Remediation Summary

Eliminated the photo-negative Evil Mode card inversion and aligned all Evil Mode surfaces with `.design-targets/g-evil.png`.

## Key Changes
- **Token Separation (`src/design/tokens.ts`, `src/design/global.css`)**: Separated `--canvas` (`#1A1410` dark espresso in `evil`, `#F4E8CE` in `day`) from `--paper` (`#E6D5B8` warm aged parchment) and `--card` (`#F5EBD6` warm cream parchment), keeping `--ink` dark (`#1E1612`) so cards, interior pills, and SVG art never invert into dark-on-dark or photo-negative brown. Added `--paper-ink` (`#F5EBD6`) and `--paper-ink-soft` (`#D5C29A`) for headings/labels rendered directly on the dark outer `--canvas`.
- **Top StatusBar & Ribbon (`src/ui/StatusBar.svelte`, `src/ui/art/Ribbon.svelte`)**: Styled Evil Mode `StatusBar` with warm antique-brass (`var(--paper-warm)`) and dark ink, and styled the Evil Mode title `Ribbon` in rich crimson (`var(--alert)` / `var(--alert-dark)`) with cream lettering.
- **Oval Office Evil Mode Scene (`src/ui/art/OvalOfficeScene.svelte`, `src/screens/OvalOffice.svelte`)**: Updated walls (`#3D311E` olive-brass), drapes (`#7E191B` crimson with theatrical corner swag drapes), desk (`#3A2416` dark walnut), banker's lamp shade (`#F3DE9A` glowing cream), and shredder paper (`#F5EBD6` crisp cream).
