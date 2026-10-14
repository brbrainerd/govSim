# Summary 31-01: Interactive Reality-Check Modal & 1-Click Tactical Pivots

**Requirements:** `MYTH-03`, `MYTH-04`, `PIVOT-02`
**Phase:** 31
**Commit:** `c395d5c`

---

## Accomplishments

1. **Interactive Prediction Challenge (`MYTH-03`)**:
   - Upgraded `src/ui/MythModal.svelte` to present a 1-click "Call the Bluff / Spot the Bottleneck" challenge with the myth's question and 2 options when `isFirstView` is true.
   - Selecting an option reveals a tailored refutation banner ("Spot on! You called the institutional bluff." or "A very common misconception!") plus `predictionPrompt.refutation`.
   - Triggers a tactile `MYTH BUSTED` stamp-slam animation (disabled when `calmMode` is true).
2. **Zero-Friction Escape Hatch (`MYTH-04`)**:
   - Added a prominent `"Skip straight to reality →"` button allowing players to bypass the prediction question immediately without penalty.
   - Preserved one-click `"Close"` and `"GOT IT"` buttons.
3. **1-Click Tactical Pivot Buttons (`PIVOT-02`)**:
   - Replaced dead pill spans with interactive `<button class="lever-pivot-btn">` controls displaying `⚡ {action.label} →` and detailed action hints.
   - Wired `onPivot` in `src/screens/Game.svelte`: records myth curiosity reward (`session.viewMythCard`), closes modal, and navigates immediately to the target screen (`go(action.screen)`).
4. **Automated Verification**:
   - Authored `src/ui/MythModal.test.ts` testing prediction challenge rendering, refutation reveal, skip hatch, tactical pivots, and calm mode.
   - All 469 unit tests pass, guard checks pass, and 8/8 bit-for-bit determinism runs pass.
