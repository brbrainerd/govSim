---
status: complete
phase: 01-engine-foundations
source: [01-VERIFICATION.md]
started: 2026-10-10T00:00:00Z
updated: 2026-10-10T00:00:00Z
---

## Current Test

number: 1
name: New Game party pick and status-bar calendar
expected: |
  `pnpm dev` → New Game shows no preselected party; "Start the term" is disabled until a party is
  chosen. In game, the status bar shows the party name and "Turn 1 of 32 · Year 1 · Winter"; hovering
  or tabbing to the label shows "Real calendar: Fall 2026. Your term is fictional and off-cycle." After 7× Next turn
  the label reads "Turn 8 of 32 · Year 2 · Fall".
awaiting: user response

## Tests

### 1. New Game party pick and status-bar calendar
expected: No default party; start disabled until chosen; party name in status bar; "Year 1 · Winter" on turn 1; real-date tooltip on hover and keyboard focus; turn 8 = Year 2 Fall.
result: pass

### 2. MIT license visible on GitHub (REL-01)
expected: After the user pushes `game-pivot` and merges it to `master`, the repo sidebar shows "MIT license".
result: pass

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
