# Feature Research

**Domain:** Single-player civics / political strategy game (turn-based, quarterly, browser). Milestone v0.2 "Playable First Term".
**Researched:** 2026-10-09
**Confidence:** MEDIUM. The comparable-game patterns are well corroborated across reviews, wikis and developer statements. The exact pacing numbers below are my recommended starting values, and the balance harness has to tune them. They are not measured from other games.

Scope: this covers only the new v0.2 features (events and crises, turn report card, Economy, Voters, Your Powers, election night / second term / end screen) and the cross-cutting question of what makes the turn loop consistent, clear and fun. Existing v0.1 features (Oval Office, Budget, Congress, macro engine, autopilot, legacy score, 2026 data) count as dependencies, not research targets.

---

## Part A: What comparable games teach (the fun and fairness evidence)

| Game | What makes the loop work | What players complain about | Lesson for govSim |
|---|---|---|---|
| **Democracy 4** (Positech) | Policies drawn as a cause→effect web. Events are passive, **dilemmas block end-turn**, situations are ongoing. Each dilemma has a long cooldown (32 turns in D3's mod files). | Information overload: "a massive flowchart" (Common Sense Media), "one huge Excel spreadsheet" (TheXboxHub). Players can't trace an outcome back to its causes. Needs a fuller tutorial. Assassination ends the game. | Keep the three-way split of passive events, blocking decisions and ongoing situations. Fix the traceability gap with a per-indicator *why*. No sudden random game-over. |
| **Suzerain** (Torpor) | Dialogue choices with tracked, visible consequences. Dilemmas rarely have a clean answer. Forced autosave stops save-scumming. A 10–15 h run. | Opacity. Players "have no idea what one budget unit is worth", so they can't weigh cost against benefit. Hidden relationship variables. | Every cost goes in **one consistent unit** (clout, approval points, $bn, index points) and is shown before you commit. |
| **The Political Machine** (Stardock) | A state-by-state Electoral College map is the whole game. Short, accessible sessions ("lighter weight… much shorter games"). The AI contests the same battlegrounds. | (Little critical coverage found.) | The Voters screen should make "where am I short of 270" readable at a glance. Keep the reelection loop short. |
| **Reigns** (Nerial) | Binary choices and four meters. Fast. A run is minutes. | Repetitive. Rewards keeping meters in range more than making good choices. An instant game-over when any meter maxes out feels arbitrary. | Keep crisis choices to 2–3 options for speed, but tie outcomes to a real model rather than meter-dancing. No instant meter death. |
| **Frostpunk** Book of Laws | Each law has visible short/medium/long-term effects on Hope and Discontent. Some laws carry implied promises. Repercussions come back later as story events. | Discontent reads as "a measure to limit the player's progress" rather than a real dilemma. Optimisers treat laws as a spreadsheet. | Delayed consequences that **return as named events** are satisfying ("your EO from Year 1 is now in court"). Avoid one meter that only throttles. |
| **Papers, Please** (Lucas Pope) | An end-of-day ledger ritual: income, rent, food and heat. Failure escalates in stages (hungry → sick → dead), so it is telegraphed and recoverable until late. | Harsh early economy while players are still learning. | The turn report card is the game's ritual. Problems should escalate in visible stages and never jump to a fail in one step. Be gentle in Year 1. |
| **iCivics Executive Command / Win the White House** | A full 4-year term in a classroom-sized session. The primary doubles as the tutorial. Polling shows which issues resonate. Electoral map endgame. | "Unclear what the effects of some choices are" (running mate, home state). "Very simplified." | Unlock-as-you-go (already in UX-2) is the proven civics tutorial pattern. Never offer a choice with no visible effect. |
| **Hidden Agenda** (1988) | You govern a fictional post-dictatorship country by consulting advisers and factions. You can be ousted by the military, foreign powers or your own cabinet. Used to train State Department officers. | n/a (dated) | Adviser framing for options works and is the ancestor of the Chief of Staff "advisor plays". |
| **Into the Breach** (Subset) | Every enemy attack is **telegraphed** a turn ahead with no hit-chance RNG, so "every death feels like the player's fault". | n/a | Big threats get a countdown. Randomness lives in *whether* an event happens, never in a hidden roll after you commit. |
| **RimWorld** (Cassandra storyteller) | Threats run on a **fixed on/off cycle with guaranteed breaks**. Players can plan around the quiet windows. "Randy Random" exists for players who want chaos. | Pure-random pacing produces long droughts or pile-ups. | Use a paced crisis director with quiet windows and caps, not independent per-quarter dice. |
| **Crusader Kings III** | Rich event content. | **Event spam**: "a small set of 20 or 30 random events… recycling", travel pop-ups with no off switch, notification clutter, players stop reading after the 9th repeat. | Use per-type cooldowns, never repeat a variant in one game, cap modals per turn, and batch minor news into the briefing (already UX-2). |
| **Sid Meier (Civ Revolution, GDC 2010)** | Design for player psychology rather than raw math. | Players reject losing at displayed 3:1 odds. Firaxis adjusted the odds to protect suspension of disbelief. | Precise percentages invite "the game lied". Show **qualitative bands** ("Likely upheld") and make the luck visible and neutral. Do not use hidden rubber-banding, which would break the honest-model promise. |
| **Civilization** "Your place in history" | An end screen ranks you against historical leaders (the infamous bottom rank). Memorable and shareable. | Rank steps feel uneven or unexplained. | The historian verdict is a strong differentiator, but use **tiers, not real presidents** (neutrality, E4/E5), and explain the tier thresholds. |

### The ten fun and fairness rules (derived; apply to every v0.2 feature)

1. **Every number has a why.** Any indicator change on any screen can be traced to at most 3 named causes plus "luck" (Democracy's top complaint).
2. **One currency per cost, shown before commit.** Costs are always clout, approval points, $bn per year or index points. Never invent a unit (Suzerain complaint). This is already the Expert forecast rule (UX-3).
3. **Telegraph threats at least 1 turn ahead. Calendar threats get a countdown of at least 2 turns.** Surprises are allowed only for *opportunities* (Supreme Court vacancy) and *luck* (disasters), and luck is shared with autopilot (Into the Breach, Frostpunk's storm warnings).
4. **Luck is neutral and visible.** Autopilot faces the same exogenous crises, so the headline score already cancels bad luck. Say so on every bad-luck card: "Autopilot got this hurricane too." This replaces Civ- or XCOM-style hidden odds fudging, which would break the "honest model" core value.
5. **Paced crisis director, not independent dice.** Use quiet windows, per-type cooldowns, at most 1 blocking decision per turn, and no repeated variant in a game (RimWorld, CK3).
6. **Recoverable by default.** No single event or choice costs more than ~4 index points of the gap to autopilot. Shocks decay over 2–6 quarters. Hard fails (debt crisis, removal, losing reelection) come only after at least 2 turns of visible warnings (Papers, Please escalation; already UX-3).
7. **2–3 real options plus a visible "do nothing" choice**, and no dominant option. The balance harness gets event-response strategies (Reigns speed without Reigns meter-dancing).
8. **Delayed consequences come back by name.** A court ruling on your EO, recovery after a disaster and the election result each link back to the decision that caused them (Frostpunk).
9. **A ritual close to every turn.** The report card is short, ordered the same way every turn and skippable (Papers, Please).
10. **Session targets.** A quiet turn takes at most 60–90 s and a crisis turn at most 3 min. **First term about 30–45 min**, which fits one class period (iCivics-style classroom use, E6). Full game about 60–90 min. Autosave every turn, so one sitting is never required. Contrast: Suzerain runs 10–15 h, Political Machine praised for "much shorter games".

---

## Part B: Feature Landscape

### Table Stakes (users expect these; a missing one makes the game feel incomplete)

| Feature | Why Expected | Complexity | Notes / dependencies |
|---|---|---|---|
| **Seeded crisis deck, identical for autopilot** | The score compares you with autopilot, which is only fair if both face the same bad luck. | MEDIUM | `game.ts` uses **one RNG stream** for macro shocks. Events must come from a **separate stream derived from the seed** (pre-rolled schedule at `newGame`) so that player decisions never change which exogenous crises occur. |
| **Crisis decision modal** (left: what happened, right: 2–3 options plus "do nothing", primary stamp) | Every comparable game puts a framed choice on a crisis. The overlay grammar is already specified in UX-4. | MEDIUM | Each option maps to an engine `Decisions` payload, so `Decisions` must grow an `events` or response field. Each event declares `autopilotChoice`, the hands-off default. The modal is editable until Next turn (free drafting) and sits in the pending-decisions tray. |
| **Event effects flow through the macro model** | Otherwise crises feel like flavour text. | MEDIUM | Add per-event shock profiles to `step()`: additive terms on gap, inflation, approval, debt and regional (state) approval, each with a decay over N quarters. Cap the size per balance rule 6. |
| **Calendar deadlines with countdowns** (shutdown deadline at the fiscal-year start on Oct 1; debt-ceiling "X-date") | These are real, scheduled events. Springing them as surprises would be both inaccurate and unfair. | LOW–MEDIUM | Deterministic from the calendar and data, not random. The resolution path goes through the existing Congress screen (deal or vote). *Verify the current debt-limit headroom in `us-2026.json` before scheduling; the 2025 reconciliation law raised the limit, so a standoff may not fall due until later in the term.* |
| **Turn report card**: 8 prosperity indicators plus approval and clout, each with value + unit + arrow + word + one-line why | Design UX-3. Also the antidote to Democracy-style opacity. | HIGH | **Biggest engine dependency.** `step()` must return a **contribution breakdown** per indicator (your budget, Fed rates, event X, momentum, luck). The simplest honest attribution is **you vs autopilot**: same seed, so the difference *is* your decisions. Then split the shared part into named causes. |
| **Events this turn listed on the report** (including "Autopilot faced this too") | The fairness signal, rule 4. | LOW | Needs the event log stored in game state. |
| **Economy screen**: you vs autopilot line charts for all 8 scores, Fed rate, a "why" panel | Players need to see trajectory and the counterfactual. This is the core score made visible. | MEDIUM | Needs **per-turn history for both runs** (snapshot arrays). LayerChart is already chosen. Table fallback and colour-blind-safe series are required (G10). The "why" panel reuses the report-card attribution, so build attribution once. |
| **Fed rate explainer** ("The Fed raised rates because inflation is 3.4%, above the 2% target") | "Set interest rates" is a myth lever. The game has to show the Fed acting independently. | LOW | The Taylor-rule terms already exist in `step()`. Expose the target components. |
| **Voters screen**: state map shaded by projected margin, state panel, swing-state list, Electoral College bar to 270 | Every election game (Political Machine, Win the White House) centres the electoral map. | MEDIUM | `us-atlas` and `topojson-client` are chosen. `us-2026.json` already has 2024 margins and electoral votes for 50 states plus DC. Needs a state model: margin = 2024 margin + national swing from approval/economy + state-specific policy and event effects. **Colour-blind-safe diverging palette with numeric labels**, plus a table fallback. |
| **Electoral College rules done right**: 538 total, 270 to win, Maine and Nebraska district splits, 269–269 goes to a House contingent election | It is a civics game, so a wrong EC is a credibility hit. | LOW–MEDIUM | The data has only statewide ME/NE margins. Simplest honest approach: award statewide, add a "Real rule" tooltip, and log it as a known simplification. A 269–269 tie is a great myth-card moment. |
| **Your Powers: about 10 curated executive orders** with clout cost, immediate effect, court-challenge risk band, legal basis cited | Design M1 levers. Executive Command teaches the same split between sign/veto and agenda powers. | MEDIUM | Content table in `src/content/` with citation and an engine effect each (SSOT §10 test). Court model: one entity with a 6–3 lean (already in data). Risk depends on legal footing and alignment. Challenges **resolve 1–3 turns later** as a named event (rule 8). EOs are revocable (true to life; a successor can revoke them). |
| **Fed chair nomination** (only when the seat opens) and **Pressure the Fed** | Design Q18. A key civics lesson: the president does not set rates. | MEDIUM | A nomination needs a vacancy trigger (calendar or event) and a Senate confirmation that reuses the Congress pattern. The chair's dovishness shifts Taylor coefficients slightly. Pressure gives a small short-term rate drift plus a rise in inflation expectations, which the model already has (`expected`). |
| **Give a speech** (bully pulpit) | Design M1. Executive Command has speeches. | LOW | Small approval or whip gain with diminishing returns: at most 1 per turn and a falling effect when repeated. The Congress deal "Speech in swing districts" already exists, so reuse it. |
| **Myth cards** ("Myth?" ticket: lower gas prices, set interest rates, create jobs, ban X by EO, fix the deficit by cutting foreign aid) | Design E2. They are the civics payload. | LOW | Content plus a citation each, balanced across the political spectrum (E4 CI tag). +1 clout on the first visit (UX-3). The court and EO explainers should **verify current law before writing** (for example, the 2025 Supreme Court limits on universal injunctions changed how EO challenges play out). |
| **Election night at turn 16**: state-by-state reveal, running EC tally, "too close to call", result | The emotional peak of the term. Every election game has it. | MEDIUM | Depends on the Voters state model. **Skippable**, with reduced-motion and calm-mode variants (G10). The result must fall inside the range the Voters screen forecast (rule 3). |
| **"Why you won / lost" card plus retry from the start of the turn** | UX-3 hard-fail rule. | LOW | Top 3 factors from the state model (economy, approval trend, event handling). |
| **Second term (turns 17–32)** with the midterm at turn 24, no reelection, game end at turn 32 | Design length is 32 turns. | MEDIUM | `TOTAL_TURNS = 32` exists. Needs a Congress re-roll at the midterms (see the turn-8 note in Dependencies). |
| **End screen**: final score vs autopilot, absolute index, 10-year legacy, historian verdict | Design §2. Already computable via `finalScore` and `legacy`. | LOW–MEDIUM | The verdict text is assembled from tiers and the biggest decisions and crises. A defeat at turn 16 also goes to the end screen, with the legacy projected from turn 16. |
| **Autosave every turn** and a JSON export | Session targets. Classroom interruptions. | LOW | Already in the design (localStorage). |

### Differentiators (where govSim beats the comparable games)

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **"You vs doing nothing" on every surface** (report card, Economy, election night: "Autopilot would have won 251 EVs") | No other political game has a same-seed counterfactual. It separates skill from luck and directly answers "was that me?" | MEDIUM | Autopilot already runs in parallel. Extend it to the state model so autopilot also gets a simulated election result. |
| **Explicit "Luck" line in every why** | It turns RNG frustration into understanding. More honest than Civ's or XCOM's hidden odds adjustment. | LOW (once attribution exists) | The `zGap`, `zInfl` and `zAppr` shocks are already separable in `step()`. |
| **"What you didn't see coming"** section on the report | Design UX-3. The only place hidden effects (voter and behaviour reactions) appear. It rewards replay and teaches second-order effects. | MEDIUM | The engine flags which contributions were *not* in the Expert forecast. Limit it to 1–2 items per turn. |
| **Telegraphed risk meters**: debt stress, hurricane season, "outbreak abroad", recession warning (output gap or inverted-curve style signal) | Into the Breach-style fairness inside a stochastic sim. Players can prepare. | MEDIUM | Each exogenous crisis type has a visible *risk band* for the next quarter. Endogenous risks (financial shock, unrest, debt crisis) show the state variable that drives them. |
| **Delayed consequences that come back by name** (court rulings, disaster recovery, EO effects at the election) | The Frostpunk "repercussions return" satisfaction, in a civics frame. | MEDIUM | The event log stores the `cause` id. Reports link to the original decision. |
| **Badges tied to real policy milestones** (inflation back to 2% ±0.5 for 2 quarters, jobless below 4%, deficit shrinking 4 quarters in a row, beat autopilot through a crisis, EO upheld, first myth card) | Small, frequent, immediate rewards (UX-3) that teach what "good" looks like. | LOW | About 12 badges, logged in history. None for raw meter-gaming. |
| **Historian verdict tiers with stated thresholds**, grounded in the seed distribution | Memorable and shareable like Civ's ranking, but explained and nonpartisan. | LOW–MEDIUM | The balance harness can compute the score distribution per strategy, so tiers become "better than 90% of hands-off presidencies". No real presidents named. |
| **Rally-around-the-flag on well-handled disasters** | A real political-science phenomenon. It makes crises opportunities, not only punishments. | LOW | A small, decaying approval bump if the chosen option beats autopilot's handling. It doubles as the anti-death-spiral valve (UX-3). |
| **Calendar-real deadlines** (fiscal year, debt X-date, midterm and general election dates) | Teaches the actual government calendar. | LOW | Requires fixing the turn labels (see Dependencies). |
| **Swing-state "tipping point" highlight** | Explains the EC better than a bare map. Win the White House teaches the EC exactly this way. | LOW | Sort states by margin, accumulate EVs, and the state that crosses 270 is the tipping point. |

### Anti-Features (seem good, cause problems)

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Independent per-quarter dice for every crisis type | Simple to code. "Realistic." | Pile-ups (3 crises in one turn) and droughts. RimWorld's "Randy" preset exists precisely because pure random is a niche taste. | A paced director with caps, cooldowns and quiet windows (see Part C). |
| Policy-modulated **occurrence** of exogenous crises (design Q28 as written) | "Good policy prevents disasters." | It breaks "identical in autopilot", because the two runs face different crises and the score is no longer luck-neutral. | Exogenous events are **pre-rolled and identical**, and policy changes their *severity* and *recovery*. Endogenous events (unrest, financial shock from debt stress, debt crisis) are state-triggered and labelled "Caused by conditions: autopilot didn't face this." |
| Instant game-over from a random event or one meter (Democracy's assassination, Reigns' meters) | Drama. | It feels arbitrary and violates "hard fails are rare and earned" (UX-3). | Only 3 hard fails, each with at least 2 turns of visible warning. |
| Precise percentage odds on court rulings or the election | "Transparency." | Players misread probabilities and feel cheated when a 75% shot fails (Sid Meier, GDC 2010). | Qualitative bands ("Likely upheld", "Toss-up") plus ranges. Seeded outcomes stay inside the shown range. |
| Hidden luck adjusters or rubber-banding (XCOM-style aim assist, streak breakers) | Smooths frustration. | It is dishonest, which contradicts the core value of an honest, explainable model, and a civics game cannot secretly cook the books. | A luck-neutral score against autopilot plus an explicit "Luck" line. |
| Toasts or pop-ups mid-turn for minor news | Liveliness. | CK3 event-spam complaints. Breaks the three-beat turn. | Batch everything into the briefing and report card. At most 1 blocking modal per turn. |
| Branching narrative trees (Suzerain-style dialogue) | Emotional depth. | Content cost explodes, and every branch needs citations (E7). | Short headline-shaped event cards with 2–3 model-driven options. |
| Comparing the player to real presidents in the historian verdict | Civ did it, and it's funny. | Partisan risk (E4) and the rule of no real people (E5, Q6). | Tiers plus seed-distribution percentiles. |
| Campaign micro (ad buys per state, rallies, polling spend) | The Political Machine loop. | It turns a governing game into a campaign game, doubles scope, and contradicts "reelection is a referendum on your governance". | Speeches can target a region. Otherwise the vote follows the state model. |
| Showing every coefficient inline | "Show your work" (E4). | Democracy-style information overload. | Show the top 3 causes plus luck inline, and keep full coefficients in an on-demand "Show your work" panel. |
| More than about 10 EOs, or EOs that do legally impossible things (set rates, appropriate money, ban by decree) | Player fantasy. | Inaccurate civics. Dilutes choices. | Route these to myth cards that point to the real lever (E2). |
| Debt-ceiling default as an instant loss | High stakes. | Unfair and unrecoverable. | A brutal non-terminal penalty (rates spike, approval hit), consistent with the debt-crisis rule (Q27). |
| Unskippable election-night or crisis animations | Spectacle. | Breaks session targets and reduced-motion. | Always skippable. A calm-mode static summary. |
| Save-scumming within a turn (undo after seeing results) | Player comfort. | It kills the stakes. Suzerain's forced autosave is praised for this. | Free drafting before Next turn, plus "Retry from this turn's start" only on hard fails (already in the design). |

---

## Part C: Concrete pacing and fairness spec for events and crises

These starting values are for the balance harness to tune. They are not sourced constants (LOW confidence on exact numbers, MEDIUM on structure).

**Director rules**
- Turns 1–2: no random crisis. Onboarding uses scripted, low-stakes events (for example a small disaster-aid request) that teach the modal.
- **At most 1 blocking decision modal per turn.** A second event that turn either queues to the next turn (if non-urgent) or auto-resolves with the autopilot default and is reported as news.
- **Target 10–14 decision events per 32-turn game**, of which **3–5 major crises** (recession, financial shock, pandemic, a major disaster, a debt-ceiling standoff). At most 1 major crisis per rolling 4-turn window, unless it is an endogenous cascade the player caused.
- Per-type cooldown of at least 8 turns, except calendar deadlines. No repeated variant text within one game (avoids CK3 recycling).
- Pre-roll the exogenous schedule at `newGame` from `seed`, using a separate stream such as `seed ^ 0x9e3779b9`. Autopilot reads the same schedule.

**Base rates (exogenous, per quarter; sourced where possible)**

| Type | Starting p / trigger | Telegraph | Basis |
|---|---|---|---|
| Recession shock | about 3–4% per quarter, plus the engine's own gap dynamics | Leading-indicator warning 1 turn ahead | NBER: about 12 US recessions since 1945, roughly 1 per 6–7 years |
| Oil-price spike | about 3% | "Tension in oil markets" 1 turn ahead | Judgement |
| Major hurricane | Summer/Fall turns only, about 30–35% | "Hurricane season" risk band every Summer | Seasonality is real. p is judgement |
| Wildfire | Summer/Fall, about 15% | Seasonal band | Judgement |
| Earthquake | about 1–2% | None (true surprise, shared with autopilot) | Judgement |
| Pandemic | about 1% | "Outbreak abroad" 1 turn ahead | Judgement |
| Supreme Court vacancy | about 4–5% (an opportunity, not a threat) | None needed | Historically about one appointment every ~2 years |
| Shutdown deadline | Calendar: each fiscal-year start (Oct 1), when no full-year budget passed | Countdown of at least 2 turns | Appropriations law |
| Debt-ceiling standoff | Calendar: when the projected X-date arrives | Countdown of at least 2 turns | Treasury X-date (verify current headroom) |
| **Endogenous**: financial shock | Rises with debt stress and deregulation | Debt-stress meter | Engine `crisisAt` |
| **Endogenous**: unrest | Rises with low approval, high unemployment and low trust | Visible in the report card | Engine state |

**Option design per event**
- 2–3 options plus "Do what a hands-off president does" (= `autopilotChoice`).
- A common, useful archetype is one cheap-but-risky option, one costly-but-safe option and one long-term or principled option. Each shows the Expert forecast with error bars in standard units.
- Effects are capped and decay over 2–6 quarters. A good response beats autopilot by 1–3 index points. A bad response loses 1–3. None loses more than ~4 (rule 6).

---

## Feature Dependencies

```
[Separate seeded event stream + event schedule]  (engine)
    └──required by──> [Crisis decision modal] ──> [Events listed on report card]
    └──required by──> [Autopilot faces identical crises]

[Engine contribution breakdown in step()]  (engine; build ONCE)
    └──required by──> [Turn report card "why"]
    └──required by──> [Economy screen "why" panel]
    └──required by──> ["What you didn't see coming"]
    └──required by──> ["Why you won/lost" card]

[Per-turn history for player + autopilot]
    └──required by──> [Economy screen charts]
    └──required by──> [End screen / historian verdict]

[State model: 2024 margin + national swing + state effects]  (data exists)
    └──required by──> [Voters screen map + EC bar]
                           └──required by──> [Election night (turn 16)]
                                                  └──required by──> [Second term] ──> [End screen (turn 32)]
    └──enhanced by──> [Regional event effects (hurricane hits Gulf states)]

[Court entity (6–3, in data)] ──required by──> [EO court challenges]
[Vacancy event] ──required by──> [Supreme Court nomination] ──requires──> [Senate confirmation (reuse Congress pattern)]
[Fed chair vacancy (calendar/event)] ──required by──> [Fed chair nomination]

[Calendar labels fixed (see below)] ──required by──> [Shutdown/debt deadlines] + [Midterms turn 8/24] + [Election turn 16]

[Policy-modulated crisis occurrence (design Q28)] ──conflicts──> [Identical crises in autopilot]
```

### Dependency Notes

- **The calendar labels must be fixed first (blocking, small).** `turnLabel` starts at Fall 2026 (`START_QUARTER = 2026*4+3`), so **turn 16 is labelled "Summer 2030" and turn 8 "Summer 2028"**. Neither is a November election quarter, and 2030 is not a presidential-election year. Real elections are in November, and inauguration is in January. Recommendation: label turns **relative to the term** ("Year 1 · Winter" … "Year 4 · Fall"), with turn 1 = Winter, so turn 8 = Fall of Year 2 (midterms) and turn 16 = Fall of Year 4 (election). Keep the 2026 data as the starting state, and put the real date mapping in a tooltip or note. Without this fix, the shutdown (Oct 1) and election deadlines will appear in the wrong seasons, which is a civics accuracy bug.
- **The report card needs the engine contribution breakdown.** This is the hardest new engine work. Build it once in `step()` as a pure return value, and have the report card, Economy screen, election "why" and "didn't see coming" all read it. The "you vs autopilot" difference gives an exact attribution of *your* decisions for free.
- **Events need a separate RNG stream.** Today `step()` draws 3 normals from `state.rng`. Adding event draws to that stream is safe only while the player and autopilot consume identical draws. A pre-rolled schedule removes that fragility.
- **The midterms (turn 8) fall inside the first term but are not in the v0.2 target list.** The design (Q2, Q16) says the midterms re-roll Congress from approval and the economy. A "full first term" with no midterm will feel wrong to civics-literate players. Recommend at least a minimal midterm: re-roll the House group seat counts from approval, shown as a short results card on the election-night component. The current Congress model is a fixed 5-group placeholder (`congress.ts` "ponytail" note), so the re-roll must touch it.
- **Election night requires the Voters state model.** Build Voters before election night, and put both in the same phase or adjacent phases.
- **Your Powers court challenges need delayed-event plumbing.** A ruling 1–3 turns later is a scheduled event, so it reuses the event system. Build events before Your Powers.
- **A Supreme Court vacancy needs Senate confirmation.** Reuse the Congress whip pattern against the Senate (51 votes after the 2017 rules change, so no filibuster). The current Congress code is House-only (218).
- **Policy-modulated occurrence conflicts with identical autopilot crises.** Resolve it as in the anti-features table: exogenous occurrence is identical, while severity, recovery and endogenous events differ and are labelled.

---

## MVP Definition (for v0.2)

### Launch With (v0.2)

- [ ] Calendar label fix (term-relative, turn 16 = Fall of Year 4). Every deadline and election depends on it.
- [ ] Separate seeded event schedule plus a paced director (caps, cooldowns, quiet turns 1–2), identical for autopilot.
- [ ] The crisis deck: 11 types, each with 1–2 variants, a 2–3 option modal plus the autopilot default, effects in the macro model with decay.
- [ ] Calendar deadlines (shutdown, debt ceiling) with countdowns, resolved through Congress.
- [ ] Engine contribution breakdown (your decisions vs autopilot, named causes, luck).
- [ ] Turn report card: indicators with unit, arrow, word and why; events, including "Autopilot faced this too"; badges; "What you didn't see coming" (1–2 items).
- [ ] Economy screen: you vs autopilot charts for the 8 scores, Fed rate with Taylor explanation, why panel, table fallback.
- [ ] Voters screen: state model, map, swing states, EC bar to 270, tipping-point state, table fallback.
- [ ] Your Powers: about 10 EOs with cost, effect, court band, delayed ruling, revoke; Give a speech; Pressure the Fed; myth cards (5, spectrum-balanced, cited).
- [ ] Fed chair and Supreme Court nominations, triggered by vacancies (the Supreme Court via a vacancy event; the Fed chair when the seat opens).
- [ ] Minimal midterms at turn 8 (and 24): re-roll House groups from approval.
- [ ] Election night at turn 16 (skippable reveal, EC tally, why card, autopilot comparison), second term, end screen at turn 32 with legacy and historian verdict tiers.
- [ ] Balance harness extended: event-response strategies (always the cheapest option, always do nothing, random), asserting no dominant option and that pacing caps hold across 40 seeds.

### Add After Validation (v0.2.x)

- [ ] Regional event effects on state approval (a Gulf hurricane, farm-state tariff pain). Add once the state model is stable.
- [ ] Maine and Nebraska district electoral votes. Add when district data is sourced.
- [ ] Historian-tier thresholds from the harness seed distribution (start with fixed thresholds).
- [ ] Event variant pool expansion (more text variants per type). Add when playtesters report repetition.
- [ ] Speech targeting by region. Add once regional effects exist.

### Future Consideration (M2+)

- [ ] The Your Household card (E5): design M1, but not in the v0.2 target list.
- [ ] Filibuster nuclear option and the full Senate bloc model.
- [ ] Impeachment and removal flow. Not needed in v0.2 unless abuse-of-power EOs exist.
- [ ] Foreign or international crises (M3).

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| Calendar label fix | HIGH (accuracy) | LOW | P1 |
| Seeded event schedule + director | HIGH | MEDIUM | P1 |
| Crisis modals + macro effects | HIGH | MEDIUM | P1 |
| Engine contribution breakdown | HIGH | HIGH | P1 |
| Turn report card | HIGH | MEDIUM | P1 |
| Voters screen + state model | HIGH | MEDIUM | P1 |
| Election night + second term + end screen | HIGH | MEDIUM | P1 |
| Economy screen | MEDIUM–HIGH | MEDIUM | P1 |
| Your Powers (EOs, court, speech, myth cards) | HIGH | MEDIUM | P1 |
| Fed chair / Supreme Court nominations | MEDIUM | MEDIUM | P1 (minimal) |
| Minimal midterms | MEDIUM | LOW–MEDIUM | P1 |
| Badges | MEDIUM | LOW | P2 |
| "What you didn't see coming" | MEDIUM | MEDIUM | P2 |
| Telegraphed risk bands for every exogenous type | MEDIUM | LOW–MEDIUM | P2 |
| Rally-around-the-flag | MEDIUM | LOW | P2 |
| Regional event effects | MEDIUM | MEDIUM | P3 |
| Maine/Nebraska districts | LOW | LOW | P3 |

## Competitor Feature Analysis

| Feature | Democracy 4 | Suzerain | Political Machine / Win the White House | Reigns / Frostpunk | Our Approach |
|---|---|---|---|---|---|
| Events and crises | Passive events, blocking dilemmas, ongoing situations. Long cooldowns. | Scripted narrative beats | Campaign events, action cards | Card stream (Reigns). Telegraphed storm (Frostpunk) | Paced, seeded director. Blocking modal for crises. Identical exogenous luck for autopilot. |
| Cause → effect explanation | Visible web, but outcomes are hard to trace | Mostly hidden | Polls show which issues resonate | Meter deltas (Reigns). Law tooltips with short/medium/long-term effects (Frostpunk) | Top 3 causes plus luck per indicator, and you vs autopilot attribution. |
| Electoral map | Abstract voter groups | n/a | State-by-state map is the core | n/a | State model from real 2024 margins, EC to 270, tipping point. |
| Executive powers and courts | Policies; judge appointment as a dilemma | Constitutional reform, courts in story | Sign or veto (Executive Command) | Laws are irreversible (Frostpunk) | About 10 EOs, court-challenge band vs a 6–3 court, delayed rulings, revocable. |
| Failure | Assassination, losing the vote | Narrative endings | Losing the election | Meter death (Reigns). Hope/Discontent (Frostpunk) | Three earned hard fails, each with a why card and retry. |
| End of game | Election result | 9 endings | Election result | New monarch (Reigns) | Score vs autopilot, legacy, historian tier. |
| Session length | Long, open-ended | 10–15 h | Short, accessible | Minutes (Reigns) | First term 30–45 min. Full game 60–90 min. |

## Sources

Confidence tiers come from the GSD `classify-confidence` seam: a single web source is LOW, a cross-checked web finding is MEDIUM.

- Democracy 4 complexity and opacity: [Common Sense Media review](https://www.commonsensemedia.org/game-reviews/democracy-4), [TheXboxHub console review](https://www.thexboxhub.com/democracy-4-console-edition-review/), [Janneke Parrish review](https://jannekeparrish.com/game/democracy-4/), [Positech forum: Steam negative reviews](https://forums.positech.co.uk/t/steam-negative-reviews/17528/5), [Cliff Harris blog 2023-02](https://www.positech.co.uk/cliffsblog/2023/02/): MEDIUM
- Democracy events, dilemmas, situations and cooldowns: [Positech dilemma modding docs](https://positech.co.uk/democracy4/mod_dilemmas.html), [Cliff's blog 2021-01](https://positech.co.uk/cliffsblog/2021/01), [Democracy (video game), Wikipedia](https://en.wikipedia.org/wiki/Democracy_(video_game)), [Event Pack listing](https://store.epicgames.com/p/democracy-4--event-pack): MEDIUM (the 32-turn cooldown is from D3 files)
- Suzerain: [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)), [Stackup review](https://www.stackup.org/post/review-suzerain-for-nintendo-switch), [Gaming Trend review](https://gamingtrend.com/youve-got-my-vote-suzerain-review/), [dante.cool review](https://blog.dante.cool/review-suzerain/), [Steam opacity thread](https://steamcommunity.com/app/1207650/discussions/0/4358995119363747661), [Steam playtime thread](https://steamcommunity.com/app/1207650/discussions/0/2962769352275120395), [Matchstick Eyes](https://www.matchstickeyes.com/series/suzerain/): MEDIUM
- The Political Machine: [Wikipedia (2024)](https://en.wikipedia.org/wiki/The_Political_Machine_2024), [Steam discussion](https://steamcommunity.com/app/2512090/discussions/0/3957035999332664290), [Jerz review (original)](https://jerz.setonhill.edu/?p=2144): LOW
- Reigns: [Wikipedia](https://en.wikipedia.org/wiki/Reigns_(video_game)), [GDC: The Casual (but Regal) Swipe](https://gdcvault.com/play/1028689/The-Casual-(but-Regal)-Swipe), [Gaming Trend review](https://gamingtrend.com/reviews/well-never-be-royals-reigns-review/), [EIP Three Kingdoms review](https://eip.gg/reviews/reigns-three-kingdoms-review/): MEDIUM
- Frostpunk Book of Laws: [Frostpunk wiki: Administration](https://frostpunk.gamepedia.com/Administration), [Unwinnable](https://unwinnable.com/2021/12/10/authoritarianism_in_frostpunk/), [indienova critical play report](https://lab.indienova.com/indie-game-review/critical-play-report-frostpunk/), [A Most Agreeable Pastime review](https://amostagreeablepastime.com/2018/05/08/review-frostpunk-pc/): MEDIUM
- Papers, Please: [PopMatters](https://www.popmatters.com/?p=503047), [Gamecloud review](https://gamecloud.net.au/reviews/papers-please-makes-you-feel), [Ashlander analysis](https://ashlanderanalysis.substack.com/p/papers-please-a-modern-classic): MEDIUM
- iCivics: [Executive Command (App Store)](https://apps.apple.com/us/app/-/id1084786851), [BrainPOP lesson plan](https://educators.brainpop.com/?p=21344), [Win the White House, Common Sense Education](https://www.commonsense.org/education/reviews/win-the-white-house), [School Library Journal](https://www.schoollibraryjournal.com/story/icivics-upgrades-win-the-white-house-game), [Filament Games](https://www.filamentgames.com/project/win-the-white-house): MEDIUM. The class-period session target is my inference, LOW.
- Hidden Agenda: [Wikipedia](https://en.wikipedia.org/wiki/Hidden_Agenda_(1988_video_game)), [textfiles review](https://mirror.cyberbits.eu/textfiles.com/games/REVIEWS/hidden.rev): MEDIUM
- Into the Breach telegraphing: [Game Developer, Road to the IGF](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-), [Prototypr UX analysis](https://blog.prototypr.io/into-the-breachs-ux-makes-you-feel-smart-a9cb03210757), [Destructoid review](https://www.destructoid.com/reviews/review-into-the-breach/): MEDIUM
- RimWorld storytellers: [Cassandra Classic wiki](https://rimworldwiki.com/wiki/Cassandra), [AI Storytellers wiki](https://rimworldwiki.com/wiki/AI_storytellers): MEDIUM (community wiki)
- CK3 event spam: [Steam thread 1](https://steamcommunity.com/app/1158310/discussions/0/7529517132617872129), [Steam thread 2](https://steamcommunity.com/app/1158310/discussions/0/3808407060884649786): LOW–MEDIUM (player forums)
- Probability psychology: [GDC Vault: Sid Meier, The Psychology of Game Design](https://gdcvault.com/play/1012186/The-Psychology-of-Game-Design), [GameDev.net summary](https://www.gamedev.net/blogs/entry/2111213-the-psychology-of-game-design-sid-meier), [Soren Johnson, "Our Cheatin' Hearts"](https://www.designer-notes.com/?p=132): MEDIUM. XCOM 2 hidden aim assist: [Nexus "Shows Aim Assist" mod](https://www.nexusmods.com/xcom2/mods/212), [Steam thread](https://steamcommunity.com/app/268500/discussions/0/2944746708998250511): LOW (community-reported, conflicting numbers)
- Civ end-game ranking: [Civ1 Hall of Fame wiki](https://civilization.fandom.com/wiki/Hall_of_Fame_(Civ1)), [CivFanatics scoring thread](https://forums.civfanatics.com/threads/scoring-system.200893): LOW–MEDIUM
- Recession base rate: NBER business-cycle dating (about 12 postwar recessions). From training knowledge, not fetched in this session; verify before citing in-game.
- govSim internals: `docs/design.md` (§2, §3, §7b–7d), `src/engine/game.ts` (`step`, `turnLabel`, `START_QUARTER`, single `rng` stream), `src/engine/congress.ts` (fixed House groups), `data/us-2026.json` (state margins, electoral votes, 6–3 court): HIGH

---
*Feature research for: civics / political strategy game (govSim v0.2 Playable First Term)*
*Researched: 2026-10-09*
