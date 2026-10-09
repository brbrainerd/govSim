# Pitfalls Research

**Domain:** Civics / political strategy game (fictional US President, real 2026 data, quarterly turns, score vs autopilot + 10-yr legacy, teens 14+, static web). Milestone v0.2 "Playable First Term": seeded crises + decision modals, turn report card, Economy / Voters / Your Powers screens, election night + end screen.
**Researched:** 2026-10-09
**Confidence:** HIGH for code-derived findings (read directly from `src/engine/game.ts`, `src/app/session.svelte.ts`, `data/us-2026.json`, `balance.test.ts`); MEDIUM for game-design and civics claims (secondary sources, cross-checked where noted). The research-confidence seam rates every web source in this run LOW by default; claims below that rely only on a single web source are marked *(LOW)*.

> **How to read this file.** Every pitfall ends with a **Guardrail** row. A guardrail is something CI or a scripted check can fail on, not a good intention. IDs (`GR-nn`) are stable so the roadmap and plans can cite them as success criteria. All thresholds are **starting values**; tune them once, record why, and after that change them only in a PR that says why.

---

## Critical Pitfalls

### Pitfall 1: Crises break the "same seed, same crises" autopilot comparison (RNG stream entanglement)

**What goes wrong:**
The design says crises are "seeded identically for autopilot" **and** "per-quarter probabilities modulated by policy" (design §3). The current engine has one chained RNG state (`state.rng`, mulberry32). `step()` draws three normals per turn from it. If crisis rolls, court-challenge rolls, Fed-chair confirmation rolls or decision-modal outcomes also draw from `state.rng`, then the number of draws depends on what the player did. After the first policy-dependent draw the player stream and the autopilot stream fall out of step. Every later macro shock and crisis then differs, and "better than doing nothing" measures luck, not skill. This is the "random draw misalignment" problem from the simulation literature on common random numbers (CRN).

**Why it happens:**
Chained PRNG state is the obvious way to code it, and it works for a single run. The divergence only shows up when you compare two runs. Adding even one conditional draw (for example, "roll court outcome only if an EO was signed") silently breaks the comparison. It also changes every number in the existing balance harness.

**How to avoid:**
- Replace chained draws with **counter-based, keyed draws**: `u = rand(seed, stream, turn, index)`, where `stream` is a fixed enum (`macro`, `crisis`, `court`, `election`, `voters`, ...). The draw is a pure hash (for example, mulberry32/splitmix over a hashed key), so a draw never depends on how many draws came before.
- Split crises into **exogenous** (hurricane, wildfire, earthquake, pandemic, SCOTUS vacancy): a pre-rolled **calendar** from `(seed, 'crisis', turn)`, identical for player and autopilot. Split **endogenous** crises (recession, financial shock, debt standoff, unrest, shutdown, debt ceiling) from them: these are **deterministic threshold triggers on state**, plus at most a keyed jitter. Policy then changes *whether the threshold is crossed*, not which random numbers are consumed.
- Where a policy-modulated probability is really wanted, compare the **same keyed `u`** against the modulated `p` (CRN). Lower risk then only ever removes crises; it never reshuffles them.

**Warning signs:**
- The balance-harness means move when you add an unrelated content row.
- A player who makes zero decisions gets a different crisis log from autopilot.
- Reloading a turn and choosing differently produces a different *exogenous* disaster.

**Guardrail (GR-01, GR-02, GR-03):**
- **GR-01** (unit test): for 200 seeds, `crisisLog(player with no decisions) === crisisLog(autopilot)` exactly.
- **GR-02** (property test): for every seed and every scripted strategy, the exogenous crisis calendar is byte-identical to autopilot's.
- **GR-03** (property test, monotonicity): for any policy that only lowers a modulated risk, `crisisSet(player) ⊆ crisisSet(autopilot)` for that crisis type.

**Phase to address:** Engine foundations (first v0.2 phase, before any crisis content).

---

### Pitfall 2: The in-game score disagrees with the end-of-term score (punishment without telegraphing)

**What goes wrong:**
`session.svelte.ts` shows `vsNothing = prosperity(you).index − prosperity(autopilot).index`. That is the **term-end index only**. But `finalScore()` = ½ index now + ½ index after a 40-quarter legacy projection. A sugar-high deficit player sees "+6 better than doing nothing" for 16 turns, then gets a negative final score on the end screen. The harness was built specifically to punish that strategy (design §3). The player experiences it as a bait-and-switch, which is exactly what UX-3 "punish fairly" forbids.

**Why it happens:**
The legacy projection costs 40 extra steps, so the hub shows the cheap number. The two numbers were built at different times for different screens.

**How to avoid:**
Show one headline number: the **projected final score** (same formula as the end screen, recomputed on Next turn). Or, at minimum, show "Now" and "In 10 years" side by side on the top bar from turn 1. Forty extra steps per turn is trivial on the main thread.

**Warning signs:** Playtesters say "I was winning the whole game and then lost."

**Guardrail (GR-04):** one test asserts that the top-bar score and the end-screen score both come from the same exported function. A harness test then checks that, at turn 16, the sign of the displayed headline matches the sign of `finalScore − autopilotFinal` in ≥ 95% of (seed × strategy) runs. The maxDeficit strategy must show a negative displayed headline before turn 16 in ≥ 80% of seeds.

**Phase to address:** Economy screen (owns "all 8 scores"), with the top bar updated in the same phase.

---

### Pitfall 3: Opaque cause → effect ("why did inflation go up?")

**What goes wrong:**
The report card promises "every indicator with arrow + one-line why" (UX-3). Teams hand-write the "why" lines, or pick them with heuristics like "if tariff changed, blame tariffs". The copy then drifts from the model. The game says "your tariff cut helped" in a turn where the random shock was 5× larger. The player learns false civics, and the game's core value ("always understand *why*") fails without anyone noticing. Democracy 4's developer has written publicly that approval charts confused players even though the underlying model was right; the problem was the explanation, not the sim. *(LOW: single blog source)*

**Why it happens:**
`step()` computes indicators in one shot. There is no record of each term's contribution, so the UI has to guess.

**How to avoid:**
Make `step()` return an **attribution ledger** for each indicator: named contributions that sum to the change. For example, inflation Δ = expectations pull + demand (Phillips) + tariff pass-through + crisis + "the world (luck)". Build the why-line from the largest contribution by absolute size. The random shock gets a plain-language name ("Bad luck: world oil prices") and is **never hidden**. When luck dominates, say so.

**Warning signs:** Why-lines are written in `.svelte` files. The why-line names a lever the player didn't touch this turn.

**Guardrail (GR-05, GR-06, GR-07):**
- **GR-05** (conservation test): for every indicator, every turn, 40 seeds × all strategies, `|Σ contributions − Δindicator| < 1e-9`.
- **GR-06** (honesty test): the cause named in the why-line is the largest contribution by absolute size. If no contribution is ≥ 40% of the total absolute movement, the line must use the "several things" template.
- **GR-07** ("every number has a reason" lint): every numeric value rendered on See screens, the report card and modals comes from a typed `Explained<number>` (value + reason id + optional citation). A test walks the screen registry and mounts each screen with a fixture. It fails if any rendered number lacks a `data-reason` attribute.

**Phase to address:** Engine foundations (ledger) → crises and report card (rendering).

---

### Pitfall 4: Crisis RNG feels unfair (pile-ups, droughts, streaks)

**What goes wrong:**
Independent per-quarter rolls over ~11 crisis types produce, on some seeds, three disasters in a row, or a hurricane on turn 1 before the player understands the UI. On other seeds, nothing happens for eight turns. Sid Meier's GDC 2010 keynote is the classic account: players misread odds, and when a bad streak hits they decide the game is broken or cheating. *(LOW: secondary write-ups)* The autopilot comparison makes this fair *in score*, but it does not make it *feel* fair.

**Why it happens:**
Probabilities are tuned for the mean, while players experience the tail.

**How to avoid:**
Run a **crisis director** on top of the keyed calendar:
- No crisis on turns 1–2 (onboarding). The first crisis modal comes by turn 3.
- At most **1 crisis modal per turn**. A second same-turn crisis is merged into the briefing as news.
- At least one quiet turn after a "major" crisis.
- Per-term min and max counts.
- A pity counter: if the player has had no crisis for N turns, the next one becomes more likely. Dota 2's pseudo-random distribution is the well-known pattern. *(LOW)*

The director must use only keyed draws and turn numbers, never player state, so GR-01 still holds. Exogenous crises can be **seasonally telegraphed**: "Hurricane season: Summer–Fall".

**Warning signs:** Harness histograms of crises per term have long tails. Playtest notes say "again?!".

**Guardrail (GR-08):** a harness test over 500 seeds checks that:
- Crises per 16-turn term fall in **[4, 9]** for 100% of seeds.
- No 3 consecutive turns contain a crisis modal.
- The first crisis falls on turn **3–5**.
- Each crisis type appears in ≥ 10% and ≤ 60% of terms (no dead or overused content).

**Phase to address:** Crises and decision modals.

---

### Pitfall 5: Dominant crisis options and dominant strategies ("water finds a crack")

**What goes wrong:**
Each crisis modal has 2–4 options. Without discipline, one option is always best (for example, "Federal aid" always beats "Wait"). Players learn it in two crises, and modals turn into click-through tax. At the strategy level: clout is uncapped (`Math.max(0, …)` with no upper bound), so "hoard clout, spend in year 4" or "give a speech every turn" can dominate. Soren Johnson's "Water Finds a Crack" (Game Developer, March 2011): given the chance, players will optimize the fun out of a game. *(LOW)*

**Why it happens:**
Options get written as prose first and given effects later. Nobody computes the effect vectors side by side.

**How to avoid:**
- Content schema: each option declares effect vectors on the 8 score components plus clout and approval. Each option must have at least one cost and one benefit.
- For each crisis, at least two options must be best under **different** contexts (state bands such as high debt vs low debt), or trade off different components.
- Exactly one option is marked `autopilot: true` and is the reasonable status-quo choice (see Pitfall 6).
- Cap or decay clout.
- Add these strategies to the harness: `alwaysOptionA`, `alwaysCheapest`, `speechSpam`, `eoSpam`, `fedPressureEveryTurn`, `clouthoard`, `random`, and a **greedy hill-climber**. The hill-climber is coordinate search on levers, trained on seeds 1–40 and evaluated on seeds 41–80.

**Warning signs:** The hill-climber's best policy sits at a lever's min or max. An "always X" strategy matches sensible play.

**Guardrail (GR-09, GR-10, GR-11):**
- **GR-09** (schema test): no option is Pareto-dominated by a sibling option across every context fixture.
- **GR-10** (harness): every `always*` and spam strategy scores below `sensible`. The hill-climber's holdout score beats `sensible` by ≤ 3 index points, and no lever in its solution sits at a slider bound.
- **GR-11** (harness): maximum clout reached across all runs is ≤ the cap. Hoarding (spending everything in the final 4 turns) loses to steady spending.

**Phase to address:** Crises (schema + options); Your Powers (EO, speech and Fed strategies join the harness when those levers land).

---

### Pitfall 6: The autopilot is a strawman (or a genius)

**What goes wrong:**
Once crises have choices, the autopilot has to choose something. If it picks "do nothing" during a pandemic, beating it is trivial, and every player sees "+15 better than doing nothing". The headline stops carrying information. If it picks the best option, the bar is impossibly high.

**Why it happens:**
"Autopilot = no decisions" was defined before decisions existed inside crises.

**How to avoid:**
Each crisis names one `autopilot` option: what a caretaker government would plausibly do by default (status quo or automatic stabilizers). Calibrate the gap between sensible play and autopilot as a band. Show the autopilot's choice in the report card ("Doing nothing would have: …").

**Guardrail (GR-12):** harness assertions, both bands checked:
- `mean(sensible − autopilot)` final score falls in **[+2, +10]** index points.
- `sensible > autopilot` in ≥ 75% of seeds.
- `autopilot > maxDeficit` and `autopilot > tariffEverything` in the mean.

**Phase to address:** Crises.

---

### Pitfall 7: Electoral College modelling errors (ME/NE, tie, sign, calendar)

**What goes wrong (several concrete traps in the current data):**
1. **ME/NE split, hidden by a coincidence.** `data/us-2026.json` stores only statewide margins for ME and NE ("Maine and Nebraska margins are statewide"). Winner-take-all gives ME 4 to D and NE 5 to R. That is wrong in both places: ME-2 voted R +9.04 and NE-2 voted D +4.6 in 2024. The two errors **cancel**, so a naive baseline still reproduces the real **312–226**. A totals-only test passes while the per-unit model is wrong. Under any swing the errors stop cancelling.
2. **Tie and contingent election.** 538 EV and 270 to win. A 269–269 tie goes to the House under the 12th Amendment: **one vote per state delegation, 26 needed**, and DC gets no vote. The data has House party totals only, with no per-state delegations, so a tie cannot be resolved correctly yet.
3. **Faithless electors.** Modelling random faithless electors adds feel-bad randomness to the climax. *Chiafalo v. Washington* (2020, 9–0) lets states enforce pledges. Make the count deterministic and teach faithless electors in an explainer instead.
4. **Sign convention.** `margin2024 = (R − D)`. The player picks a party at New Game. Applying swing in party terms instead of player terms flips the map for one party.
5. **Partisan asymmetry at the start.** On the real 2024 map the tipping-point state (about PA, R +1.7) favours one party. A D player needs about a 1.7-point swing just to break even, so reelection rates differ by party. Players will read that as bias (Pitfall 9).
6. **Calendar.** `turnLabel` maps turn 8 → "Summer 2028" and turn 16 → "Summer 2030". Midterms and the reelection are designed for turns 8 and 16, so Election Night would read "Summer 2030" in a game that teaches civics. Real federal elections fall in November of even years, and presidential ones in years divisible by 4. Also, the real 2026 midterm happens on turn 1 (Fall 2026), while Congress is pinned to the 119th.
7. **Midterm re-roll.** All 435 House seats are up, but only about a third of the Senate (one class). Re-rolling the whole Senate is a civics error.
8. **Map geometry.** `us-atlas` `states-albers-10m` has no congressional-district shapes, so ME-2 and NE-2 need inset chips. DC is too small to click.

**How to avoid:**
- Add district rows: ME-1 D +21.6, ME-2 R +9.04, NE-1, NE-2 D +4.6, NE-3, all sourced. Allocate as 2 at-large EV plus 1 per district.
- Add per-state House delegations (from the Clerk's data) for the contingent election.
- Express all swing as "your party's margin".
- Centre the national environment on the **tipping-point state**, not the popular vote, so both parties start from the same reelection odds while real state ordering is kept.
- Hold elections on Fall turns (turn 9 and turn 17 under the current Fall 2026 start), or relabel time as "Year N of your term". Add an in-game note that the term is fictional and off-cycle.
- Re-roll only the Senate class that is up.

**Warning signs:** Only totals are asserted. No test seed produces a tie.

**Guardrail (GR-13 – GR-17):**
- **GR-13** (data test): ΣEV = 538 including DC = 3. ME units = 2 + 1 + 1. NE units = 2 + 1 + 1 + 1. Every unit has a margin and a source.
- **GR-14** (replay test): zero swing reproduces 2024 exactly. Trump 312, Harris 226, **and** ME-2 → R, NE-2 → D.
- **GR-15** (tie test): a fixture forced to 269–269 resolves through state delegations (26 of 50), and DC is excluded.
- **GR-16** (symmetry test): over 300 seeds, `|P(reelect | D, autopilot) − P(reelect | R, autopilot)| ≤ 5 pp`, and the economy is bit-identical for D and R given the same decisions (the engine is party-blind).
- **GR-17** (calendar test): every election turn's label is Fall of an even year, the presidential election turn is in a year divisible by 4 (or in-game time is term-relative), and a midterm changes at most 35 Senate seats.

**Phase to address:** Voters screen (data + EC); Election night (tie, calendar). The calendar decision is needed before Election night copy is written.

---

### Pitfall 8: Snowballing and death spirals

**What goes wrong:**
The code already contains a positive feedback loop. Approval → clout (`approval/10` per turn) → bills passed → economy → approval. Midterms re-roll seats from approval, which makes Congress harder exactly when the player is weakest. The debt-crisis drag above 130% compounds through the term premium. The other direction runs away too: approval 80+ means effectively unlimited clout, so everything passes and the game becomes trivial. "Positive feedback destabilizes" is standard game-economy theory (Adams & Dormans, *Game Mechanics: Advanced Game Design*). The design promises "no death spirals" via rally events (UX-3), but nothing enforces it yet.

**How to avoid:**
- Rubber-band lightly: rally events below approval 35, a honeymoon already exists, diminishing clout income above approval 65, and a clout cap.
- Make the midterm penalty bounded: the House loses at most ~N seats more than the historical-average swing.

**Warning signs:** The harness shows a bimodal approval distribution at turn 16. The spread of outcomes widens every turn.

**Guardrail (GR-18, GR-19):**
- **GR-18** (comeback test): start from a turn-6 fixture with approval 30 and play `sensible`. Approval reaches ≥ 42 by turn 16 in ≥ 50% of seeds, and reelection is still possible (> 0% of seeds).
- **GR-19** (runaway test): the 90th-percentile approval at turn 16 is ≤ 75, and the standard deviation of the final index across seeds under `sensible` is ≤ 1.5× its turn-8 value (bounded divergence).

**Phase to address:** Crises (rally events); Voters (midterm model); covered by the harness extension in Engine foundations.

---

### Pitfall 9: Partisan-bias perception (in events, myth cards, the model, and the map)

**What goes wrong:**
The hostile media effect: opposing partisans both rate the **same** neutral coverage as biased against them, and the effect is robust (meta-analytic g ≈ 0.67). *(LOW, cross-checked against Wikipedia and the source studies.)* So "it feels balanced to me" proves nothing; only **structural** balance can be defended. In this game, bias can creep in through:
- Crisis option wording ("tax relief", "handouts", "job creators", "entitlements", "death tax").
- Myth cards that debunk one side's beliefs more often than the other's, or that cover **values** instead of **mechanics**.
- Hand-set macro coefficients that encode an ideology (for example, tariffs always bad, deficits always bad).
- Red/blue map colours colliding with the design's colour roles. Red means "danger/commit" in the tokens, so states of one party would look like alarms.
- An asymmetric starting map (Pitfall 7.5).

**How to avoid:**
- Every content item (crisis, option, myth, historian line) carries `challenges: 'left' | 'right' | 'both' | 'none'` and `target: 'institution' | 'incentive' | 'mechanism'`, never `party`.
- Myth cards must be about **who controls what** (powers and mechanics: the President does not set gas prices or interest rates), never about whether a value is good.
- Coefficient registry: every key in `C` has a citation and a defensible range.
- Colour the map **player-relative** ("leans you / leans them" in sage and sky, with hatching), not party red/blue.
- Keep a loaded-terms list with neutral replacements.

**Warning signs:** One side's issues dominate the myth deck. Reviewers ask "why is my party always the one in the crisis?"

**Guardrail (GR-20 – GR-23):**
- **GR-20** (content test): across myth cards, `|count(challenges=left) − count(challenges=right)| ≤ 1`. Across crises and options, the left/right ratio stays within 40–60%.
- **GR-21** (lint): crisis, myth, briefing and historian text contains no party names, ideological labels, or real officeholder names, from a deny-list (Democrat, Republican, GOP, liberal, conservative, progressive, MAGA, woke, plus real current officeholders). The game's own bloc names ("Progressives, Moderates…") are allow-listed only in Congress UI strings. Loaded-terms deny-list terms fail with the suggested neutral replacement.
- **GR-22** (test): `Object.keys(C)` equals `Object.keys(COEFF_SOURCES)`, and every entry has `citation` and `range`. A property test (fast-check) checks that the model's directional claims (GR in `balance.test.ts` "expected directions") hold for every coefficient across its range, so conclusions don't depend on one hand-picked number.
- **GR-23** (map test): no party colour token is used on the Voters map, and every map state also carries a text or pattern encoding (WCAG "no colour-only meaning").

**Phase to address:** Crises (content schema + lint, first content); Your Powers (myth cards); Voters (map colours); Engine foundations (coefficient registry).

---

### Pitfall 10: Reading-level creep and jargon leak

**What goes wrong:**
Target: about 9th grade (design §1). Every new feature adds prose: crisis briefs, option text, report-card lines, explainers, myth cards, historian verdicts. Engine vocabulary leaks out: "output gap", "fiscal impulse", "term premium", "Taylor rule". Long, clause-heavy sentences accumulate. Nobody re-reads the whole corpus. Flesch–Kincaid is also noisy on short strings, so naive per-label gates produce false failures and teams switch them off.

**How to avoid:**
- Apply FK only where it is meaningful. Pool each content item's body text; gate items of ≥ 30 words or ≥ 3 sentences. Labels get the existing structural rule instead (≤ 6 words, from UX-1).
- Hard cap of 20 words per sentence everywhere.
- Jargon glossary: an engine term may appear only in a `realTerm` tooltip field (the "Real term:" pattern from UX-1).
- Use `flesch-kincaid` + `syllable` (wooorm, MIT, typed, ESM) as exact-pinned dev dependencies, as long as both licenses check out.

**Warning signs:** Explainers longer than the "~20 s" budget (about 60 words at teen reading speeds). Jargon in why-lines.

**Guardrail (GR-24, GR-25):**
- **GR-24** (content test over `src/content/**`): FK grade ≤ 9.0 per pooled item, corpus mean ≤ 8.0, max sentence length 20 words, explainers ≤ 80 words, crisis option text ≤ 25 words, labels ≤ 6 words.
- **GR-25** (lint): glossary terms (`output gap`, `fiscal`, `Okun`, `Phillips`, `Taylor`, `term premium`, `Gini`, `discretionary`, `reconciliation` ...) are banned outside `realTerm` fields. The existing "no literals in `.svelte`" rule is extended to user-visible strings, so all prose stays inside the content tables the test walks.

**Phase to address:** Engine foundations or the first content phase (the gate must exist before the first crisis is written; retrofitting means rewriting).

---

### Pitfall 11: Spreadsheet fatigue and too many levers / decisions per turn

**What goes wrong:**
v0.1 has about 16 budget levers. v0.2 adds about 10 EOs, Fed chair, Fed pressure, speech, court challenges, crisis modals, a report card listing every indicator, a state map with 51+ units, and 8 score components. A turn turns into a chore: read the report, clear the modal, check 4 screens, click Next. The three-beat turn (UX-2) erodes one feature at a time. A related problem is **dead levers**: levers whose maximum effect on the score is noise. They add choices without meaning.

**How to avoid:**
- Report card: top **3 movers** expanded and the rest collapsed. Changes below a per-indicator dead-band show as "steady", with no arrow.
- At most 1 crisis modal and at most 3 *required* decisions per turn.
- Advisor plays cover the common path.
- Run a one-at-a-time sensitivity sweep on every lever. Any lever whose full-range effect on the final score is < 0.3 index points is removed, merged, or moved behind "More".

**Warning signs:** The median count of required clicks per turn rises from milestone to milestone. Playtesters skip the report card.

**Guardrail (GR-26 – GR-29):**
- **GR-26** (harness): number of required decisions per turn ≤ 3 on every seed and turn. Crisis modals per turn ≤ 1.
- **GR-27** (registry test): each Act screen shows ≤ 7 primary controls before a "More" disclosure (counted from content tables).
- **GR-28** (sensitivity test): every lever, EO and crisis option moves the final score by ≥ 0.3 points somewhere in its range. No single lever alone moves it by > 8 points (that would make it dominant).
- **GR-29** (report test): the report card renders ≤ 3 expanded rows, and arrows appear only when |Δ| ≥ the dead-band defined in one table (`indicators.ts`).

**Phase to address:** Crises and report card (report, modal caps); Your Powers (lever count, sensitivity of EOs).

---

### Pitfall 12: Slow or unclear start (time to first meaningful choice)

**What goes wrong:**
New Game → party pick → household card → intro briefing → tutorial overlays → Oval Office → ... and the first decision that actually changes the country comes several minutes in. Teens in a classroom drop off fast. The opposite failure is a crisis modal on turn 1 before the player knows what clout is.

**How to avoid:** First consequential decision (a budget package) within 1 screen of the Oval Office. Explanatory reading before it ≤ 150 words. The first crisis only after the first full loop (turn 3; see GR-08). Unlocks follow UX-2.

**Guardrail (GR-30):** a Playwright test from New Game to the first decision that changes `GameState` checks for ≤ 6 clicks and ≤ 150 rendered words on the screens passed through. Run it with "unlock all" on and off.

**Phase to address:** Crises (onboarding ordering) and the final integration phase (Playwright path test).

---

### Pitfall 13: Save corruption, loss, and version skew

**What goes wrong:**
- **Safari deletes script-written storage** (localStorage, IndexedDB) for origins with no user interaction in the last 7 days of browser use (MDN). Students who play once a week lose their game.
- localStorage is about **5 MiB per origin** and throws `QuotaExceededError` when full (MDN). Full snapshot history × 2 runs × (later) a citizen sample can exceed it.
- `JSON.stringify` turns `NaN` and `Infinity` into `null`. One bad divide corrupts a save, and the corruption only shows on load.
- **Engine version skew:** a save made under old coefficients gets loaded after a coefficient change. If the autopilot is re-simulated with new coefficients but the player history used old ones, the score compares apples to oranges.
- **Cross-engine float drift:** `Math.log/sin/cos/tanh` (used by Box–Muller and potential growth) are not bit-pinned by ECMAScript. V8 and JavaScriptCore can differ in the last bit. Replaying a decision log in a different browser can drift, and a threshold trigger (crisis, election) can flip. *(LOW, multiple secondary sources)*
- Svelte `$state` proxies must go through `$state.snapshot` before `structuredClone` or serialization (Svelte docs; the code already does this for the budget).

**How to avoid:**
- The save holds `{ saveVersion, engineVersion, seed, startDataHash, decisionLog[], snapshots[] }`.
- Load = validate → if `engineVersion` matches, use the snapshots. If it differs, offer "continue (rebased: autopilot re-run under the new rules)" with an explicit note, or "keep old rules" when an old engine build is pinned.
- Validate every number with `Number.isFinite` on save and on load.
- Wrap `setItem` in try/catch with a visible fallback ("Download save").
- Call `navigator.storage.persist()` on first save, from a user gesture.
- Put **Export save** next to Next turn on the end screen.
- Use only `+ − × ÷ sqrt` in the RNG path: an integer or table-based normal, not Box–Muller with `log/cos`. Or never replay across engines: snapshots are the truth, and the log is only used for same-engine retry.

**Warning signs:** "My save disappeared" reports, especially from iPad and Safari users. Scores change after a deploy for in-progress games.

**Guardrail (GR-31 – GR-34):**
- **GR-31** (round-trip test): for 40 seeds × strategies at every turn, `load(save(s))` deep-equals `s`, and every numeric field is finite.
- **GR-32** (replay test): `replay(seed, decisionLog)` reproduces the snapshots bit-for-bit (same engine). CI runs the engine tests on Node and in Playwright WebKit and compares a hash of the final states.
- **GR-33** (migration test): each committed fixture save from earlier versions (`test/fixtures/saves/v*.json`) loads, migrates, and passes GR-31. A PR that bumps `saveVersion` without adding a fixture fails.
- **GR-34** (quota test): the serialized save of a full 32-turn game is ≤ 1 MiB.

**Phase to address:** Engine foundations (format, versioning, RNG); the phase that introduces persistence (probably Election night / end, or earlier if saves land first).

---

### Pitfall 14: Balance drift as coefficients and content change

**What goes wrong:**
The current harness asserts only coarse properties: means over 40 seeds, plausible ranges, and `sensible > autopilot`. Every v0.2 feature changes the numbers: crisis effects, EO effects, Fed pressure, rally events, election rules. A change can halve the skill gap or double crisis damage and still pass. Coefficients are hand-set (PROJECT.md), so they **will** be tweaked often. Each tweak is a silent re-balance. The harness also recomputes `run()` for the same seed and strategy many times (`final()` and `avgIndex()` re-run games). Its runtime grows with each new strategy until somebody trims seeds to keep CI fast, which weakens it.

**How to avoid:**
- Generate a **balance report** artifact (`balance-report.json`: per strategy, the mean and quantiles of final score, reelection rate, crisis counts, approval distribution) and commit it. CI compares the regenerated report to the committed one. Changes beyond a tolerance must be accepted in the PR by updating the file (snapshot-style, as `toMatchFileSnapshot`).
- Assert per-seed win rates, not just means. Memoize runs per (seed, strategy).
- Set a harness time budget.

**Warning signs:** "Fixed a typo in a coefficient" PRs with no balance diff. Harness runtime creeps up.

**Guardrail (GR-35, GR-36):**
- **GR-35:** CI fails if `balance-report.json` differs from the committed one by more than ±0.5 index points (means) or ±5 pp (rates) without an updated file in the same PR.
- **GR-36:** the harness runs in ≤ 60 s in CI. Each (seed, strategy) game is simulated once per test file.

**Phase to address:** Engine foundations (first, so every later phase is measured against it).

---

### Pitfall 15: Election night that is random, or fully known in advance

**What goes wrong:**
If a large election-day shock decides the outcome, losing feels like a coin flip after 16 turns: the worst possible moment for RNG feel-bad. If there is no uncertainty at all, "election night" is a cutscene with no tension.

**How to avoid:** Show a **forecast** with honest error bars from about turn 12 ("Expert forecast" pattern). The election-day shock is small and keyed (`stream='election'`, identical for the autopilot). The animated count reveals states in a fixed real-world order (poll-closing times) for drama, without changing the outcome. A loss ends with the "Why this happened" card (UX-3), built from the attribution ledger.

**Guardrail (GR-37) (calibration):** across 500 seeds, the final-turn forecast leader wins ≥ 80% of the time. In probability bins (for example, 60–70%), the observed win rate is within ±10 pp of the bin. No election is decided by a shock larger than 2σ of the forecast error.

**Phase to address:** Election night.

---

## Moderate Pitfalls

### Pitfall 16: Decision modals that break the game's own interaction rules
**What goes wrong:** UX-2 says "free drafting, every decision editable until Next turn, no confirm dialogs". Crisis modals that commit on click (and run the crisis immediately) contradict this. Players learn two different interaction models.
**Prevention:** A crisis choice is a **draft** that shows in the pending tray and resolves on Next turn. Modals reuse the overlay split (what happened / what you can do, with the primary stamp bottom-right).
**Guardrail (GR-38):** an engine test confirms that crisis resolution happens only inside `endTurn`. A UI test confirms that the modal choice can be changed before Next turn.

### Pitfall 17: Myth-card farming and reward exploits
**What goes wrong:** "+1 clout on first visit to a myth card" gets farmed through reloads or duplicate card ids.
**Prevention:** Track first visits in game state (in the save), not the session. Ids are unique.
**Guardrail (GR-39):** a test confirms the reward is idempotent per card per game and that card ids are unique.

### Pitfall 18: Courts and Fed as hidden coin flips
**What goes wrong:** Court challenges to EOs and Fed-chair confirmations resolve randomly with no preview, which feels arbitrary and teaches nothing.
**Prevention:** Show a probability with its reason before signing ("6–3 court, this order rests on emergency powers → high risk"), drawn from a keyed `court` stream. The "Expert forecast" covers EOs too.
**Guardrail (GR-40):** every EO content row has `legalBasis`, `challengeRisk` and a citation. The UI test confirms the risk is shown before the Sign stamp is enabled.

### Pitfall 19: Historian verdict and debrief text that editorializes
**What goes wrong:** Free-text verdicts praise or blame a philosophy ("your conservative restraint") instead of results.
**Prevention:** Template verdicts keyed only on score components and bands. The text names outcomes, never ideologies.
**Guardrail:** GR-21 and GR-24 apply. A coverage test renders every band combination (8 components × 3 bands sampled) and lints the output.

### Pitfall 20: Unsourced civic claims in new prose
**What goes wrong:** New screens (Your Powers explainers, election rules) add factual claims without citations, against E7.
**Prevention:** Use the existing `{ text, citation? }` shape. Content kinds `explainer | myth | rule` **require** a citation.
**Guardrail (GR-41):** a type-level required field plus a test that every citation is an `https` URL or a `data/` source id.

---

## Minor Pitfalls

### Pitfall 21: Noisy arrows
Tiny changes (Δ 0.01) shown with arrows read as meaningful. Fixed by the dead-band (GR-29).

### Pitfall 22: Chart lies
Truncated y-axes exaggerate the you-vs-autopilot gap. Rule: zero-based axes for levels, or an explicit "zoomed" label; colour-blind-safe series; a table fallback per chart (design §7). **Guardrail:** a chart component test checks that each chart has a `<table>` fallback.

### Pitfall 23: Reduced motion on election night
The animated count must have an instant variant. **Guardrail:** a Playwright run with `prefers-reduced-motion` finishes Election night in ≤ 1 s with no animations.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Draw crisis rolls from the existing chained `state.rng` | No refactor | Breaks the autopilot comparison; reshuffles all balance numbers (Pitfall 1) | Never |
| Hand-written "why" lines | Fast copy | Lies to players once the model changes (Pitfall 3) | Never for the report card; fine for flavour text that makes no causal claim |
| Statewide-only ME/NE | Data already present | Wrong EC under any swing (Pitfall 7) | Never past the Voters phase |
| Store full snapshot history in localStorage | Simple | Quota, Safari eviction, version skew (Pitfall 13) | Prototype only; v0.2 needs versioned saves + export |
| Uncapped clout | Simpler maths | Hoarding becomes dominant, runaway snowball | Until the Your Powers phase adds clout sinks |
| Coarse mean-only harness assertions | Quick to write | Silent re-balancing (Pitfall 14) | Until Engine foundations adds the committed balance report |
| Per-string FK gate on labels | Simple rule | False failures → gate gets disabled | Never; pool per item, labels by word count |

## Integration Gotchas

Internal integration points (the game has no external services).

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Engine ↔ autopilot | Autopilot re-simulated with different code or data than the player's run | Same `engineVersion`, same `startDataHash`, keyed RNG; test GR-01/02 |
| Crises ↔ RNG | Conditional draws on a shared stream | Per-stream keyed draws (Pitfall 1) |
| Report card ↔ engine | UI infers causes | Engine-emitted attribution ledger (GR-05/06) |
| Voters ↔ Congress data | Contingent election using party totals | Per-state House delegations (GR-15) |
| Voters ↔ approval | Approval treated as vote share; party sign flipped | Calibrated mapping + tipping-point centring + player-relative margins (GR-16) |
| Map ↔ `us-atlas` | Expecting district shapes; tiny DC | Inset chips for ME-2, NE-2 and DC; keyboard-focusable list fallback |
| Top bar ↔ end screen | Different score formulas | One exported scoring function (GR-04) |
| Saves ↔ deploys | Old saves silently scored under new coefficients | `engineVersion` check + rebase notice (GR-33) |
| Svelte state ↔ serialization | Cloning `$state` proxies | `$state.snapshot` before clone or serialize |
| LayerChart | Minor-version breaking changes (design D5) | Exact pin (already policy); chart smoke test per screen |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Harness re-simulates the same games | CI time grows with each strategy; seeds get trimmed | Memoize per (seed, strategy); time budget GR-36 | About 10+ strategies × 40+ seeds × multiple `final()` calls |
| Legacy projection inside reactive `$derived` on every slider drag | Jank while dragging | Recompute on draft commit or with a debounce; 40 steps is cheap, but citizen sampling won't be | When a citizen sample (Q22) runs per step |
| Citizen sample (Q22) recomputed for both runs every turn | Slow Next turn on low-end Chromebooks | Fixed-size weighted sample (≤ 5k), typed arrays, computed once per turn | > 10k agents × 2 runs on classroom hardware |
| Map re-render per hover | Laggy Voters screen | Static SVG paths; update only fill/pattern attributes | 51 + 5 units with patterns on low-end GPUs |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting imported save JSON | Prototype pollution, NaN injection, huge files freezing the tab, `{@html}` XSS through a custom name | Size cap (≤ 2 MiB); a hand-written validator (`Object.hasOwn`, finite numbers, known keys only); never `{@html}` on save-derived strings |
| Adding telemetry for playtest metrics | Breaks "inputs never leave the browser" (E5); minors in audience | Local-only playtest log the tester exports by hand (opt-in JSON); bots provide the automated metrics |
| "Report inaccuracy" pre-filling the GitHub issue URL with household data | Personal data leaks into a public issue | Pre-fill only content id + screen; never household inputs |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Score shown without legacy until the end | Feels cheated (Pitfall 2) | Projected final score as the headline from turn 1 |
| Red/blue party map | Partisan-coded; red = "danger" in tokens | Player-relative sage/sky + hatching |
| Calendar showing "Election — Summer 2030" | Teaches wrong civics | Fall elections / term-relative time (GR-17) |
| A modal every turn | Click-through habit | Max 1 crisis modal per turn, quiet turns guaranteed |
| Every indicator in the report | Report skipped | Top 3 movers, rest collapsed |
| Exogenous disaster with no warning | "Unfair" | Seasonal telegraph + mitigation options + same disaster for autopilot, stated in the report |

## "Looks Done But Isn't" Checklist

- [ ] **Crises:** the autopilot gets the same exogenous crises *and* a defined default option. Verify GR-01, GR-02, GR-12.
- [ ] **Report card:** why-lines come from the ledger, and luck is named. Verify GR-05, GR-06.
- [ ] **Economy screen:** the headline equals the end-screen formula. Verify GR-04.
- [ ] **Voters:** ME-2 and NE-2 exist as units; zero-swing replay gives 312–226 *with* the correct district winners. Verify GR-13, GR-14.
- [ ] **Voters:** a tie resolves through state delegations. Verify GR-15.
- [ ] **Voters:** D and R start with equal reelection odds. Verify GR-16.
- [ ] **Election night:** the date label is a November / Fall turn. Verify GR-17.
- [ ] **Your Powers:** each EO shows legal risk + citation before signing; every EO moves the score. Verify GR-28, GR-40.
- [ ] **Myth cards:** left/right balanced; mechanics, not values. Verify GR-20.
- [ ] **All copy:** FK ≤ 9, no jargon outside tooltips, no party or person names. Verify GR-21, GR-24, GR-25.
- [ ] **Saves:** round-trip, migration fixture, export button, Safari eviction note. Verify GR-31 – GR-34.
- [ ] **Balance:** the committed report was updated intentionally in this PR. Verify GR-35.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RNG entanglement found after content ships | HIGH | Introduce keyed streams, bump `engineVersion`, regenerate the balance report, mark old saves "rebased" |
| Hand-written why-lines contradict the model | MEDIUM | Add the ledger, delete the authored causal copy, keep only flavour text |
| EC errors (ME/NE, tie) | LOW–MEDIUM | Add district rows + delegations; GR-13–15 lock the fix |
| Perceived bias reports | MEDIUM | Tag audit (GR-20), deny-list expansion, public `CONTENT-BALANCE.md` generated from the tags as transparency |
| Lost saves (Safari) | LOW (cannot recover data) | Ship export + persist(); add an in-game note on Safari |
| Balance drift discovered late | MEDIUM | Bisect using the committed `balance-report.json` history |

## Pitfall-to-Phase Mapping

Suggested phase names (the roadmap may rename them): **P1 Engine foundations & guardrails** → **P2 Crises, decision modals, report card** → **P3 Economy screen** → **P4 Voters & Electoral College** → **P5 Your Powers** → **P6 Election night, second term, end screen**.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 RNG entanglement | P1 | GR-01, GR-02, GR-03 |
| 2 Score mismatch | P3 (top bar early) | GR-04 |
| 3 Opaque causality | P1 ledger → P2 report | GR-05, GR-06, GR-07 |
| 4 Crisis streaks | P2 | GR-08 |
| 5 Dominant options/strategies | P2, P5 | GR-09, GR-10, GR-11 |
| 6 Strawman autopilot | P2 | GR-12 |
| 7 EC modelling | P4 (data, symmetry), P6 (tie, calendar) | GR-13 – GR-17 |
| 8 Snowball / death spiral | P2 rally, P4 midterms | GR-18, GR-19 |
| 9 Partisan perception | P1 coefficients, P2 schema + lint, P4 map, P5 myths | GR-20 – GR-23 |
| 10 Reading level | P1 (gate before content) | GR-24, GR-25 |
| 11 Lever / decision fatigue | P2, P5 | GR-26 – GR-29 |
| 12 Slow start | P2, P6 integration | GR-30 |
| 13 Saves | P1 format; persistence phase | GR-31 – GR-34 |
| 14 Balance drift | P1 | GR-35, GR-36 |
| 15 Election randomness | P6 | GR-37 |
| 16–20 | P2, P5, P6 | GR-38 – GR-41 |

**Ordering implication:** P1 must land GR-01/02, GR-05, GR-24/25, GR-31/32 and GR-35 **before** any crisis content is written. Each of these is cheap to set up first and expensive to retrofit: you would re-tune all content, rewrite all copy, or break saves.

**Research flags:** P4 needs a short data task (ME/NE district margins from the Secretaries of State, plus per-state House delegations) and a design decision on calendar and tipping-point centring. P2 needs a design decision on the exogenous/endogenous crisis split. P6 needs forecast calibration. P3 and P5 follow standard patterns once the guardrails exist.

## Sources

- Repo (HIGH, read directly): `src/engine/game.ts` (single chained `rng`, Box–Muller, uncapped clout, `turnLabel` → turn 8 "Summer 2028" and turn 16 "Summer 2030", verified by running the formula), `src/app/session.svelte.ts` (`vsNothing` uses `prosperity` index, not `finalScore`), `data/us-2026.json` (ME/NE statewide only; House party totals only), `src/engine/balance.test.ts`, `docs/design.md`.
- Common random numbers / random-draw misalignment: [Noise-free comparison of stochastic agent-based simulations using CRN (arXiv 2409.02086)](https://arxiv.org/html/2409.02086v2); [On the Effectiveness of Common Random Numbers, Management Science](https://pubsonline.informs.org/doi/fpi/10.1287/mnsc.25.7.649) — MEDIUM
- 2024 district results: [2024 US presidential election in Maine (Wikipedia; ME-2 Trump 53.50 / Harris 44.46)](https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Maine); [2024 US presidential election in Nebraska (NE-2 Harris +4.6; statewide Trump +20.46)](https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Nebraska); [Spectrum News: Nebraska and Maine split their electoral votes](https://spectrumlocalnews.com/me/maine/politics/2024/11/06/nebraska-and-maine-split-their-electoral-votes--here-s-how-it-worked) — MEDIUM. Confirm against the Secretary of State canvasses before committing to data.
- Faithless electors: [Chiafalo v. Washington (Cornell LII)](https://law.cornell.edu/supremecourt/text/19-465); [CRS LSB10515](https://www.everycrsreport.com/reports/LSB10515.html) — MEDIUM
- Contingent election: [Contingent election (Wikipedia)](https://en.wikipedia.org/wiki/Contingent_election); [Protect Democracy explainer](https://protectdemocracy.org/work/a-contingent-election-explained/) — MEDIUM
- Player perception of probability: [Sid Meier GDC 2010 keynote recap, Game Informer](https://gameinformer.com/b/news/archive/2010/03/12/sid-meier-gamers-arent-logical); [VentureBeat quotes](https://venturebeat.com/2010/03/12/quotes-from-sid-meiers-keynote-gdc-speech); [Museum of Play recap](https://www.museumofplay.org/blog/gdc-2010-game-psychology-101/) — LOW
- Pseudo-random distribution: [Liquipedia: Random Distribution](https://liquipedia.net/dota2/Random_Number_Generation); [Dota 2 wiki: Pseudo-random distribution](https://dota2.fandom.com/wiki/Pseudo-random_distribution) — LOW
- Dominant strategies: [Soren Johnson, "Water Finds a Crack"](https://designer-notes.com/game-developer-column-17-water-finds-a-crack) — LOW
- Telegraphing for fairness: [Game Developer: Road to the IGF, Into the Breach](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-) — LOW
- Explaining approval in political sims: [Positech (Democracy 4) dev blog](https://www.positech.co.uk/cliffsblog/category/democracy-4/page/19/) — LOW
- Hostile media effect: [Wikipedia: Hostile media effect](https://en.wikipedia.org/wiki/Hostile_media_effect); [Christen et al. 2002, Political Communication](https://terpconnect.umd.edu/~nan/738readings/Christen%20et%20al%202002%20hostile%20media.pdf) — MEDIUM
- Readability tooling: [wooorm/flesch-kincaid](https://github.com/wooorm/flesch-kincaid) — MEDIUM (check license + version at install)
- Storage: [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) (Safari 7-day proactive eviction; ~5 MiB localStorage; `QuotaExceededError`); [web.dev: Persistent storage](https://web.dev/persistent-storage) — HIGH (official docs)
- Float determinism: [MDN: Math (precision is implementation-dependent)](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math); [es-discuss: accuracy of special functions](https://esdiscuss.org/topic/es6-accuracy-of-special-functions) — MEDIUM
- Svelte serialization: Svelte docs, `$state.snapshot` (via Context7 `/sveltejs/svelte`) — HIGH
- Positive feedback / death spirals: Adams & Dormans, *Game Mechanics: Advanced Game Design* (2012), feedback-loop chapters — MEDIUM (from training knowledge, not fetched this session)

---
*Pitfalls research for: civics/political strategy game (govSim v0.2 Playable First Term)*
*Researched: 2026-10-09*
