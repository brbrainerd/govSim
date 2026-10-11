---
phase: 01-engine-foundations
plan: 03
subsystem: engine
tags: [coefficients, registry, citations, validator, fnd-07]

requires: []
provides:
  - COEFF / LIMITS / SCORE / RULES registry with basis, range, unit, note and sources (src/engine/coefficients.ts)
  - problems() validator, C values view, Coefficients type
  - potentialGrowth read from the registry by data/us.ts
  - basis and note on all 11 budget levers; voteOutcome reads RULES
affects: [01-06]

actuals:
  tokens: 6700
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Registry tables are as-const-satisfies Record<string, Coeff|Limit>; one test loops problems() over all four"
    - "Citation only where the source was opened and supports the note; otherwise judgement with the source flagged as not confirmed"

key-files:
  created:
    - src/engine/coefficients.ts
    - src/engine/coefficients.test.ts
  modified:
    - src/data/us.ts
    - src/engine/budget.ts
    - src/engine/congress.ts

key-decisions:
  - "Only 4 of the 10 research citation candidates survive as 'citation': taylorInfl, taylorGap, inflTarget, okun. Everything else is judgement"
  - "Taylor 1993 is cited through the author's Stanford PDF, not the DOI (the DOI page is an Elsevier redirect that does not show the paper)"
  - "Unconfirmed sources (CBO, FOMC calendar, Yale) are kept on judgement entries with 'Not confirmed' in the source text"
  - "game.ts is untouched; plan 01-06 swaps its literals onto these names"

requirements-completed: [FND-07]

duration: 3 min
completed: 2026-10-10
status: complete
plan_head_before: 09793af279adb59fe793a68c590af913e4afe409
commits: 3
---

# Phase 1 Plan 03: Coefficient registry Summary

**Every model number (22 coefficients, 24 inline-literal names, 7 limits, 18 score entries, 4 rules, 11 budget levers) now has a basis, a unit, a note and a range, with only four values claiming a citation, each from a page that was opened and read.**

## Accomplishments

- `coefficients.ts`: `problems()` validates range (lo < hi, value inside, edges allowed), non-empty unit and note, basis, citation needs a source, every source has text and an https URL. A self-test with nine bad entries proves it can fail.
- `COEFF` holds the 22 names game.ts uses plus 24 names for its inline literals (inflTarget through cloutPerApproval); a test pins every value to what game.ts uses today, so plan 01-06 can swap without changing behaviour. `LIMITS`, `SCORE` (eight weights sum to 1 within 1e-12) and `RULES` are in place.
- `data/us.ts` reads `C.potentialGrowth`; `voteOutcome` reads `RULES.voteReward` and `RULES.refundDivisor` with unchanged results (220/35 gives 10, 210/35 gives 17).
- All 11 levers carry `basis: 'judgement'` and the file header's caveat as `LEVER_NOTE`.

## Source checks (T-1-10)

Fetched with `curl -sL` this session (WebFetch not available); page text treated as data only.

| URL | Result | Outcome |
|---|---|---|
| https://web.stanford.edu/~johntayl/Onlinepaperscombinedbyyear/1993/Discretion_versus_Policy_Rules_in_Practice.pdf | 200, text read: equation 1 is `r = p + .5y + .5(p - 2) + 2` | supports taylorInfl, taylorGap, inflTarget (citation) |
| https://doi.org/10.1016/0167-2231(93)90009-L | 200, Elsevier "Auto Article Locator" redirect page, no paper content | not used as a source (Stanford PDF used instead) |
| https://www.federalreserve.gov/monetarypolicy/files/FOMC_LongerRunGoals.pdf | 200, text read: "inflation at the rate of 2 percent" is most consistent with the mandate | supports inflTarget (citation) |
| https://www.nber.org/papers/w18668 and the PDF at https://www.nber.org/system/files/working_papers/w18668/w18668.pdf | 200, abstract read; PDF tables show US Okun estimates -0.38 to -0.49 | supports okun 0.5 at the top of the band (citation) |
| https://nber.org/papers/w28005 | 200, abstract read: slope of the Phillips curve is small | supports a small phillips slope; kept judgement because units differ |
| https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm | 200, lists meetings and links, no longer-run funds rate figure | downgraded to judgement (neutralReal), source flagged not confirmed |
| https://budgetlab.yale.edu/research/state-us-tariffs-november-17-2025 | 200, 24 Aug 2026 edition: average statutory rate 11.0%, consumer price impact about 0.7% | downgraded to judgement (tariffPass): the per-point ratio is not stated; it also does not contain the 1.9% / 16.8-18.7% figures the research quoted |
| https://budgetlab.yale.edu/research/tracking-economic-effects-tariffs | 200, body is script-rendered, no extractable figures | not cited |
| https://www.cbo.gov/publication/24874 | 403 (also with a browser User-Agent) | fiscalMultiplier stays judgement, source flagged not confirmed |
| https://www.cbo.gov/publication/55018 | 403 (also with a browser User-Agent) | termPremium stays judgement, source flagged not confirmed |

crowdOut has no source (CBO's one-third figure is only noted as "reported, not confirmed").

## Task Commits

1. Task 1 (tracer): registry entry with validator feeds starting potential growth - `a93811c`
2. Task 2: register every model number with basis, range and sources - `532cc03`
3. Task 3: budget levers carry a basis and vote rules read RULES - `e78511c`

## Deviations from Plan

None - plan executed as written. Notes:
- Research candidates `okun` and the Taylor entries stayed citations; `tariffPass` was downgraded as the plan allows (the quoted Yale figures were not on the page that opened).
- TDD: each task's tests and code went into one commit, as in plans 01-01 and 01-02; the tracer test was run against the finished validator, not seen failing first.
- Judgement ranges are mine and untested against the model; the research suggested an optional sensitivity sweep over `opts.coeff`, which this plan does not require and which waits for plan 01-06.

## Human verification pending

The plan's manual check (open each source URL in `coefficients.ts` and confirm it supports its note) was done by this agent through fetched page text, not a browser. The three "Not confirmed" sources (CBO x2, FOMC calendar) and the Yale page should be opened by a person before Phase 3 shows links to players.

## Known Stubs

None.

## Threat Flags

None. T-1-09 mitigated (`problems()` rejects non-https; test asserts it). T-1-10 mitigated (table above).

## Verification

`pnpm test` 13 files / 52 tests pass; `pnpm check` 0 errors 0 warnings; `pnpm build` ok. No party names in coefficients.ts (the party scan passes).

## Self-Check: PASSED

src/engine/coefficients.ts, src/engine/coefficients.test.ts present; commits a93811c, 532cc03, e78511c found in git log; acceptance greps: `C.potentialGrowth` 1, `export function problems` 1, `satisfies Record<string, Coeff>` 3, LIMITS/SCORE/RULES 1 each, `http://` 0, `note: LEVER_NOTE` 11, RULES reads 1 each.
