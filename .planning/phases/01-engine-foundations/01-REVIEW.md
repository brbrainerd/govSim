---
phase: 01-engine-foundations
reviewed: 2026-10-10T00:00:00Z
depth: standard
files_reviewed: 42
files_reviewed_list:
  - package.json
  - scripts/determinism.mjs
  - src/App.svelte
  - src/app/session.svelte.ts
  - src/app/session.test.ts
  - src/content/parties.ts
  - src/data/us.ts
  - src/engine/balance.test.ts
  - src/engine/budget.ts
  - src/engine/calendar.ts
  - src/engine/calendar.test.ts
  - src/engine/coefficients.ts
  - src/engine/coefficients.test.ts
  - src/engine/congress.ts
  - src/engine/decisions.ts
  - src/engine/decisions.test.ts
  - src/engine/determinism.test.ts
  - src/engine/detmath.ts
  - src/engine/fixture.ts
  - src/engine/game.ts
  - src/engine/game.test.ts
  - src/engine/hash.ts
  - src/engine/legacy.test.ts
  - src/engine/modifiers.ts
  - src/engine/modifiers.test.ts
  - src/engine/party.test.ts
  - src/engine/purity.test.ts
  - src/engine/replayFixture.ts
  - src/engine/rng.ts
  - src/engine/rng.test.ts
  - src/engine/score.ts
  - src/engine/shocks.test.ts
  - src/engine/trace.ts
  - src/engine/trace.test.ts
  - src/engine/units.ts
  - src/screens/Congress.svelte
  - src/screens/Game.svelte
  - src/screens/NewGame.svelte
  - src/testing/conservation.ts
  - src/testing/mods.ts
  - src/testing/scan.ts
  - src/ui/StatusBar.svelte
findings:
  critical: 0
  warning: 9
  info: 7
  total: 16
status: all_fixed
fixed: 2026-10-12 (commits a159419, 82aaea6)
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-10
**Depth:** standard
**Files Reviewed:** 42
**Status:** issues_found

## Summary

I read all 42 files in full and traced `step` against its ledgers by hand. The arithmetic checks out. I confirmed these by reading the code:

- The debt-to-GDP terms sum to the change in the ratio.
- Unemployment and employment carry their `clamp` residual correctly.
- The keyed RNG is stateless.
- `tanhPade` is continuous and smooth at |x| = 3.
- The calendar turns for the midterm and re-election dates are right.

I found no injection, XSS, secret or path-traversal problems. The Svelte templates only interpolate constants or numbers, and the only `eval` runs the repo's own build output in `scripts/determinism.mjs`.

The defects are at the boundaries between layers:

- The trust-boundary hardening in `decisions.ts` is incomplete: a malformed bill throws instead of being sanitized.
- The Session layer has two pre-existing behaviours that the new raw-input contract exposes: "Keep as is" reverts the policy, and "Send to Congress" is a no-op flag.
- The replay hash has silent collision classes.
- The documented "order is irrelevant" guarantee for scheduled resolvers is not true.
- The cross-browser determinism proof is not enforced in CI.

Already tracked, so not re-reported: legacy projection with no floor on `realIncome`. One related note: `src/testing/conservation.ts:26` relaxes the conservation tolerance to relative precisely because of that collapsed-income path. Once Phase 2 adds the floor, drop that relaxation or the conservation check stays loose for no reason.

## Warnings

### WR-01: `resolveBill` / `sanitizeBudget` throw on a malformed bill, contradicting the "hand-edited decision" contract

**File:** `src/engine/decisions.ts:38-52` (called from `src/engine/game.ts:155`)
**Issue:** The header says a hand-edited decision "cannot mint clout" and that the untrusted object is never trusted. That holds for lever values, but not for the shape of the bill itself.
- `sanitizeBudget(null)` and `sanitizeBudget(undefined)` throw a `TypeError`, because `Object.hasOwn(null, …)` throws.
- `bill.deals = 5` throws in `new Set(5)`.
- `bill.deals = 'mod'` is silently iterated character by character.
- `decisions: null` (a JSON `null` input) throws on `decisions.bill` in `step`.

A Phase 2 save is an input log. One bad entry crashes the whole replay instead of being rejected as `unaffordable` or `invalid`. `decisions.test.ts` covers bad lever values and `__proto__` but not a bad bill shape.
**Fix:**
```ts
export function sanitizeBudget(d: BudgetDraft | null | undefined): BudgetDraft {
  const src = d !== null && typeof d === 'object' ? d : {};
  ...Object.hasOwn(src, l.id) ? src[l.id] : undefined...
}
export function knownDeals(ids: unknown): DealId[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids)].filter(...);
}
```
Then add a test with `{ budget: null, deals: 5 }`.

### WR-02: Budget packages (including "Keep as is") reset every lever to the baseline, not to the policy in force

**File:** `src/app/session.svelte.ts:67-71`, `src/engine/budget.ts:53`
**Issue:** `pickPackage` does `draft.budget = fromPackage(p)`, and `fromPackage` is `{...baseline(), ...packages[p]}`. After a tax cut is enacted, `freshDraft(next.policy)` correctly starts the next draft from the enacted policy. But clicking "Keep as is" (an empty override) replaces the draft with the original baseline. If the player then votes, the bill reverts every earlier change, and the engine records a negative fiscal impulse and `budget:family` income. "Tax cut" likewise resets every lever it does not name. The behaviour pre-dates Phase 1 (same code at 158a73f), but Phase 1 made the draft a raw engine input, so it now has engine consequences.
**Fix:** Overlay the package on the current policy:
```ts
pickPackage(p: PackageName) {
  this.draft.budget = { ...this.current.policy, ...packages[p] };
  ...
}
```
This makes "Keep as is" mean what it says. If packages are meant to be baseline-relative instead, rename "Keep as is" to "Reset to defaults". Add a Session test that plays two turns.

### WR-03: "Send to Congress" is a dead flag, so edited budgets are silently dropped

**File:** `src/app/session.svelte.ts:44-48`, `src/screens/Budget.svelte:73-76`
**Issue:** `draft.sentToCongress` is written in four places and read only to render a button. `bill` is non-null only when `voteCalled || deals.length`. A player who edits sliders, presses "Send to Congress" and then "Next turn" without making a deal or calling a vote gets `bill === null`, so the budget is discarded with no log entry and no message. The A8 rule ("deals without a called vote are voted at Next turn") does not cover a bill that has no deals.
**Fix:** Treat `sentToCongress` as intent: `this.draft.voteCalled || this.draft.sentToCongress || this.draft.deals.length`. Otherwise remove the flag and make the Budget button navigate to Congress. Add a test.

### WR-04: The "order is irrelevant" claim for scheduled resolvers is false, and past-due items are stranded

**File:** `src/engine/game.ts:131-145`
**Issue:**
1. The comment says keyed draws "make the order irrelevant". That is true for random numbers only. Item A (adds group G) followed by item B (`endGroups: ['G']`) ends G in the same step. B then A leaves G active. Outcomes therefore depend on `state.scheduled` array order. That is deterministic only if every producer keeps the same insertion order, and `modifiers.ts:3-4` promises that "adding or resolving an item cannot move any other draw".
2. `filter((i) => i.due === state.turn)` and `scheduled = filter((i) => i.due !== state.turn)` mean an item with `due < turn` (a scheduled-in-the-past bug in Phase 4/5, or a stale loaded save) never fires, never fails loudly, and stays in the state and the hash forever. This conflicts with the T-1-13 "fail loudly" intent.

**Fix:** Process due items in a canonical order (sort by `due` then `id`) and resolve against the original `state.modifiers` for `endGroups`. Alternatively document the ordering contract in `modifiers.ts`. Treat `i.due <= state.turn` as due, or throw on `i.due < state.turn`. Fix the comment either way.

### WR-05: `stableHash` collides for Map, Set, Date and class instances

**File:** `src/engine/hash.ts:25-34`
**Issue:** Any `typeof 'object'` that is not an array is hashed via `Object.keys`. A `Map`, a `Set` and a `Date` all hash identically to `{}`. `new Date()` therefore adds nothing to the hash. For a function whose job is to catch replay divergence, a silent "equal" is the worst failure, and it is the exact thing the NaN and Infinity guard (T-1-05) was written to prevent.
**Fix:** Reject non-plain objects:
```ts
const proto = Object.getPrototypeOf(v);
if (proto !== Object.prototype && proto !== null) throw new Error(`stableHash: non-plain object at ${path || '<root>'}`);
```
Add a test.

### WR-06: Turn 32 is inert, but the UI keeps offering actions that are silently discarded

**File:** `src/engine/game.ts:119-121`, `src/ui/StatusBar.svelte:38`, `src/app/session.svelte.ts:84-100`
**Issue:**
- `endTurn` returns the same state at `turn >= TOTAL_TURNS`, so only 31 steps ever run. The player sees "Turn 32 of 32" and a disabled Next-turn button. No game-over or score screen is wired (not in scope here).
- `makeDeal`, `callVote`, the Budget sliders and "Send to Congress" all stay live on turn 32. They mutate a draft that can never be submitted, and the clout and vote preview still render.
- `balance.test.ts` and the fixtures also encode "31 decision turns", while the label says 32.

**Fix:** Decide the intended count. If 32 is the end state, label it so (for example "Final report"). Add `get over() { return this.current.turn >= TOTAL_TURNS }` to Session and short-circuit `makeDeal`, `callVote` and `setLever` when it is true. If 32 decisions were intended, `endTurn` must allow the last step.

### WR-07: Congress screen hard-codes the bill name and the reward and refund text

**File:** `src/screens/Congress.svelte:47`, `:88`
**Issue:**
- The bill is always titled "Infrastructure Push", whichever package or sliders the player chose.
- The result text says "+10 clout for the win" and "Half your clout comes back". `RULES.voteReward` and `RULES.refundDivisor` are registry coefficients (range 5-20 and 1-4), so retuning them makes the UI lie. Of the two, the refund claim is the one that actually breaks, since `refundDivisor` changes the fraction.
- `Passed ${vote.total}–${HOUSE_SEATS - vote.total}` assumes no abstentions.

**Fix:** Derive the title from `session.draft.pack ?? 'Custom budget'`. Build the text from `RULES.voteReward.value` and `vote.cloutBack` (already available: `+${vote.cloutBack}`).

### WR-08: The cross-browser determinism proof is not run in CI

**File:** `.github/workflows/ci.yml`, `scripts/determinism.mjs`, `package.json:13`
**Issue:** CI runs `check`, `test` and `build`. `pnpm determinism` (the only thing that proves FND-02 across Chromium, Firefox and WebKit, minified and not) never runs, so a regression passes CI. The script also needs `playwright install`, which no script or doc provides.
**Fix:** Add a CI job with `pnpm exec playwright install --with-deps chromium firefox webkit` followed by `pnpm determinism`, or state explicitly that it is a manual gate. Add a `postinstall` or `setup` note.

### WR-09: Modifier `source` is never validated at runtime, so it can overwrite built-in trace terms

**File:** `src/engine/game.ts:171,179,194,198,206,257,262,267`, `src/engine/trace.ts:109`
**Issue:** `Ledger.add` merges by source id. `isKnownSource` is used only in `trace.test.ts`. A modifier whose `source` is `'clamp'`, `'rounding'`, `'luck'` or `'momentum'` is added into that term. This breaks the "only clamp and rounding may be residuals, each bounded" guarantee and, for `luck`, corrupts the total-luck line (Pitfall 10). The test guards cover fixtures only, not Phase 4/5 content or a loaded save.
**Fix:** In `step`, or in a `Modifier` factory, throw when `!SOURCE_PREFIXES.some((p) => m.source.startsWith(p))`. Also assert `m.tag` matches the prefix.

## Info

### IN-01: `scan.ts` can be bypassed and its literal allowance for 0 and 1 hides a real coefficient

**File:** `src/testing/scan.ts:13-18`, `src/engine/game.ts:258`
**Issue:**
- `const { tanh } = Math;` and `const M = Math; M.exp(x)` are not flagged. Only `Math.<name>` and `Math[...]` are.
- `toLocaleString` and `Intl`-like paths other than the `Intl` identifier are not caught.
- The literal allowance for `0` and `1` lets `ap.round(…, 1)` (the approval quantum in `game.ts:258`) bypass the registry. `trace.test.ts:89` separately hard-codes `approval: 0.5` as the matching half-step.
- A numeric literal in a negative literal type (for example `-1`) is not treated as a type position.

**Fix:** Flag a bare `Math` identifier outside a property access. Register the approval step as `LIMITS.approval.step` or a coefficient.

### IN-02: `Start.tariff` is unused, and the tariff lever base is a second copy of the data

**File:** `src/engine/game.ts:30`, `src/engine/budget.ts:28`, `src/data/us.ts:30`
**Issue:** `start.tariff` is read from data but never used by the engine. `tar.base: 11` and `data.effectiveTariffRate.value: 11` are two independent copies, so a data refresh makes the lever base lie. Equally, the `baseline()` policy for every lever is a hard-coded copy of the real world.
**Fix:** Delete `Start.tariff`, or derive `leverBase('tar')` from `start`. At minimum add a test that `fromData(us).tariff === leverBase('tar')`.

### IN-03: `keyHash` and `cell` fold distinct inputs

**File:** `src/engine/rng.ts:13,20`
**Issue:**
- A numeric key goes through `key | 0`, so 0.5 and 0 collide, and NaN maps to 0.
- A numeric key can equal the FNV hash of some string, which makes `draw(…, 'x')` collide with `draw(…, hashOf('x'))`. This is unlikely, but the contract says "append only, never renumber".
- `seed | 0` makes seeds that differ by 2^32 identical.

**Fix:** Assert `Number.isInteger` for numeric keys, turns and seeds in `cell`, or document the domain next to the known answers.

### IN-04: `StatusBar` can show "−0.0 worse"

**File:** `src/ui/StatusBar.svelte:30`
**Issue:** `score < 0` is tested on the raw value but displayed to 1 decimal. A score of -0.04 renders "−0.0 worse than doing nothing". Round first, then pick the sign and wording.
**Fix:** `const s = Math.round(score * 10) / 10;` and branch on `s`.

### IN-05: Accessibility and placeholder leftovers in the Congress screen

**File:** `src/screens/Congress.svelte:64,80-81`
**Issue:** `aria-label` on a bare `<b>` (generic element) is ignored by assistive technology. Give it `role="img"` or use visually hidden text. `<a href="#learn">` and `<button class="ticket">` are dead controls with no handler. The same goes for the matching ones in `Budget.svelte`. The `go` prop is declared but unused.
**Fix:** Render them disabled, or remove them until the "Learn" feature lands.

### IN-06: Stale and dead test code

**File:** `src/engine/coefficients.test.ts:39,73-75`, `src/engine/determinism.test.ts:37-39`
**Issue:**
- The comment "plan 01-06 swaps it onto the registry" is stale: the swap is done.
- `GAME_VALUES` duplicates every coefficient, so every retune needs two edits. It also adds nothing beyond what the characterization snapshot already catches.
- The `describe('COEFF')` block holds one test and a stray blank line.
- The inline snapshot is flagged "temporary", but nothing removes it.

**Fix:** Delete the stale comments. Either drop `GAME_VALUES` or generate it from `COEFF`. Track the snapshot's removal in the Phase 2 plan.

### IN-07: `Report.trace` arrays are typed `readonly` but still alias the live mutable `Ledger.terms`

**File:** `src/engine/game.ts:287-291`, `src/engine/trace.ts:17`
**Issue:** The ledgers are discarded after `step`, so aliasing is harmless today. `Term` objects are mutable, though: the type is `readonly Term[]`, but `Term.amount` is not readonly. A UI or a later phase that mutates a term corrupts the hash chain without a type error.
**Fix:** `export interface Term { readonly source: string; readonly amount: number }`, and freeze in tests.

---

_Reviewed: 2026-10-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
