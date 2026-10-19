# govSim

## What This Is

A browser strategy game where you play a fictional President of the United States, inaugurated into the
real, present-day country (sourced 2026 data). One goal: leave America as prosperous as possible — scored
against "doing nothing" on the same seed plus a 10-year legacy. A satirical "Evil Mode" offers an alternative
kleptocratic gameplay loop where players maximize their personal offshore stash while managing public heat.
It is also a civics teacher: accurate mechanics, myth cards, plain language, nonpartisan, for teens 14+ and adults.
Open source. Full design: `docs/design.md`.

## Core Value

A player can make real presidential tradeoffs (budget, Congress, executive powers, social policy, structural reforms, foreign policy, or satirical kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

## Requirements

### Validated

- ✓ Static TS + Svelte 5 + Vite app; registry-driven Home/See/Act rail, tokens SSOT, layout grammar — v0.1
- ✓ Pure deterministic engine: quarterly macro model (gap, Okun, Phillips, Taylor Fed, debt, crisis), autopilot comparison, 10-yr legacy score — v0.1
- ✓ Sourced starting data `data/us-2026.json` (economy, budget, taxes, society, Congress, Court, 50 states + DC) — v0.1
- ✓ Oval Office, Budget (packages, sliders, expert forecast) and Congress (435-seat whip, deals, vote, reward/penalty) screens matching approved art — v0.1
- ✓ Balance harness (40 seeds × 5 strategies) guarding against degenerate play — v0.1
- ✓ Keyed stateless RNG streams, arithmetic-only engine, bit-reproducible cross-browser determinism — v0.2
- ✓ Term calendar ("Year N · Season") with real-date tooltip, party pick at New Game with party-blind engine — v0.2
- ✓ Coefficient registry with citations, ranges, and static purity scanner — v0.2
- ✓ Save format v1 freeze, localStorage autosave, schema-validated export/import, deflate-raw URL hash replay — v0.2
- ✓ Zero egress CSP architecture, automated prose grade gate, and strict CI continuous deployment — v0.2
- ✓ Post-turn report card with 8 indicators, causal trace breakdowns, luck lines, and unexpected ripple effects — v0.2
- ✓ Economy screen with charts vs do-nothing, Fed rate explainer, and accessible data table fallbacks — v0.2
- ✓ Paced exogenous & endogenous crisis system with countdown deadlines, trade-off modals, and rally effects — v0.2
- ✓ Your Powers screen: 10 cited executive orders, 6-3 court challenges, Fed/Court appointments, speeches, myth cards — v0.2
- ✓ Voters screen: 50-state + DC + ME/NE map, 270 projection bar with uncertainty bands, and midterms — v0.2
- ✓ Year 4 Fall election night reveal, contingent House tie resolution, causal trace debrief, second term extension — v0.2
- ✓ End screen: score vs do-nothing, 10-year legacy projection, and historian verdict tier — v0.2
- ✓ 12 policy milestone badges, balance harness calibration over 80 seeds, About/Privacy/Credits modal, and zero-egress problem report bundle — v0.2
- ✓ Domestic social policy levers (healthcare, immigration, energy/climate, education) with pure engine deltas and registered coefficients — v0.3
- ✓ Demographic and regional distribution: state-level exposure indices, BEA regional price parity, and voter coalition shifts — v0.3
- ✓ Structural government reform: Senate filibuster options, judicial ethics & 18-year term limits, electoral reforms, and 3/4 state amendment ratifications — v0.3
- ✓ "Your Household" impact card: 7 kitchen-table budget lines, 4 authentic preset personas, and custom family/state builder — v0.3
- ✓ Extended 100-seed Monte Carlo game balance calibration (+3.425 headroom, party neutrality $\le 5$ pp) — v0.3
- ✓ Paced geopolitical crises (oil embargo, shipping blockade, debt contagion, cyber blackout) with cited resolution triads and autopilot streaming — v0.4
- ✓ Presidential foreign policy controls: defense posture slider, foreign assistance adjustments, targeted economic sanctions, and foreign aid myth card — v0.4
- ✓ Pure deterministic 0–100 Security Index driving 10% of the composite Prosperity Index with causal trace line items — v0.4
- ✓ International Trade & Tariffs screen: strategic sector tariffs (chips, minerals, clean energy) citing Sec 301/232, bilateral trade accords, and state export vulnerability matrix — v0.4
- ✓ Satirical Evil Mode opt-in toggle, pure deterministic offshore stash accumulator ($B), and 0–100 Heat meter — v0.5
- ✓ Corrupt executive levers: no-bid crony contracts, land auctions, tariff exemption sales, library foundation slush fund, watchdog purges — v0.5
- ✓ Institutional backlash & impeachment: special counsel appointments/subpoenas, House impeachment floor vote, Senate conviction trial with full asset forfeiture — v0.5
- ✓ Dark Americana visual reskin (oxblood, aged gold, ink), live Oval Office stash rosette/heat gauge, Kleptocratic Heist Review EndScreen, and 6-tier satirical verdicts — v0.5
- ✓ Interactive "How it works" explainers across Oval Office, Economy, Budget, and Trade with +1 Clout curiosity reward — v0.6
- ✓ Trade Learn strip and expanded 3-card Myth deck (`supply_side_taxes`, `debt_ceiling_default`, `trade_deficits`) — v0.6
- ✓ Oval Office Chief of Staff suggestion actions wired to Crisis and Myth modals — v0.6
- ✓ One-click actionable Chief of Staff "Advisor Plays" navigating and pre-filling draft packages — v0.6
- ✓ Congress Auto-Whip cheapest-path coalition solver staging lowest-Clout deal sets to reach 218 House votes — v0.6
- ✓ Live Budget Household Persona binding and in-force vs 2026 baseline dual slider indicators — v0.6
- ✓ Top-bar live Staged Decisions tray with unsent warnings and screen jump buttons — v0.6
- ✓ Safe "Skip to Next Event" fast-forward loop with automatic crisis/deadline interrupts — v0.6
- ✓ 4 curated Starting Scenarios at New Game with deterministic macro/fiscal overrides — v0.6
- ✓ Scenario briefing objectives at inauguration and persistent scenario completion badges — v0.6
- ✓ Layered Americana editorial-poster SVG character anatomy, 5 reactive expressions (`confident`, `stressed`, `scheming`, `panicked`, `triumphant`), and live `GameState`-reactive `OvalOfficeScene`, `ReporterScene`, `CourtBench`, and `FedPortrait` — v0.7
- ✓ Stamp-slam and hemicycle seat-flip micro-animations, ironic party-blind news chyrons and advisor banter, and an in-game `"Calm mode"` toggle — v0.7
- ✓ Year-1 progressive onboarding (`docs/design.md` §7b: Turn 1 Budget/Congress, Turn 2 Your Powers, Turn 3+ all screens) with `"Unlock all screens"` toggle — v0.7
- ✓ Interactive `"Show your work"` Model Inspector modal exposing all 138 live `coefficients.ts` parameters, 6 core equations, ranges, and audited citations — v0.7
- ✓ Optional non-deterministic `"Living World"` shock variance (`turnEntropy`) and opt-in Free AI Director (`openrouter/free` + `:free` auto-discovery, OAuth PKCE, local `window.ai`, Gemini/Groq BYOK) for generative briefings, satirical chyrons, and schema-clamped dynamic crises — v0.7
- ✓ Expanded 12-card spectrum-balanced Myth catalog (`4 left`, `4 right`, `4 both`), tempting "Mirage Levers" across policy screens, and contextual Oval Office macro blame triggers — v0.8
- ✓ Interactive Reality-Check MythModal with 1-click bottleneck prediction, tactile `MYTH BUSTED` stamp-slam animation, zero-friction skip, and 1-click tactical pivots to real policy levers — v0.8
- ✓ Pure-engine `"Debunk vs. Spin"` strategic trade-off (`spinMyth` +Approval rally, −Social Trust, +Evil Heat) and EndScreen Civic Mastery Dossier — v0.8
- ✓ Persistent `"Plain Talk / Policy Wonk"` vocabulary toggle (`vocabMode`) in `Session`, `NewGame`, and `StatusBar`, plus a typed 32-term Civics Glossary & Progressive Disclosure catalog (`VOCAB-01`, `VOCAB-02`) — v0.9
- ✓ Reusable `<TradeoffPill>` progressive-disclosure UI component with `👍 Upside` / `⚠️ The Catch` badges, emoji impact meters, and expandable `"📜 Official Law / Real Term"` details (`VOCAB-03`) — v0.9
- ✓ Dual-layer (`plain` + `wonk`) content overhaul across Orders, Sanctions, Tariffs, Pacts, Social Policies, Reforms, Congress Deals, Crises, and Causal Traces with friendly emojis and explicit `👍 / ⚠️` trade-offs (`COPY-01`, `COPY-02`, `COPY-03`) — v0.9
- ✓ Action-screen trade-off surfacing across `Budget`, `Powers`, `Trade`, `Congress`, and Reform Modals with right-column `"Why click this?"` advisor cards and visual meters (`UI-CLARITY-01`, `UI-CLARITY-02`, `UI-CLARITY-03`) — v0.9
- ✓ Kitchen-table clarity on `OvalOffice`, `Economy`, `Voters`, `TurnReport`, and `CrisisModal` with Plain-Talk indicator headers, emoji health badges, and crisis response trade-offs (`SEE-01`, `SEE-02`) — v0.9
- ✓ Presidential trade-off balance audit & tuning (aligning UI badges with engine math) plus automated readability (grade ≤ 9) and multi-viewport (`1376×768` / `1280×720`) zero-scroll verification (`BAL-01`, `BAL-02`) — v0.9
- ✓ High-craft SVG character anatomy (`Character.svelte`, `FedPortrait.svelte`, `CourtBench.svelte`) matching `.design-targets/cast.png` and `D.png` with continuous 72px-wide finger/thumb-shaped head + 72px-wide torso pawn silhouettes, articulated poses, and occupational outfits (`GFX-01..03`) — v1.0
- ✓ Reusable `<CharacterPortrait>` medallion component (`triumphant` confetti, `facepalm`, `panicked` blue-forehead dread gradient + twin sweat drops, `scheming`, `confident`, `stressed`) and `<CivicEmblem>` multi-layered Americana SVG emblem catalog (`GFX-03`, `SYN-01`) — v1.0
- ✓ Selectable 4-option Presidential Look / Avatar picker and animated White House portico inauguration banner on `NewGame.svelte`, plus `OvalOfficeScene.svelte` with curved wainscot wall, Presidential Eagle carpet seal, Resolute Desk, Evil Mode banker's-lamp cash stacks, and paper shredder (`SCENE-01..02`) — v1.0
- ✓ Live whip-reactive Congressional Bloc Leaders in `Hemicycle.svelte` / `Congress.svelte` and `netMonthlyDelta`-reactive Citizen NPC portraits in `HouseholdCard.svelte` / `HouseholdModal.svelte` / `Budget.svelte` (`NPC-01..02`) — v1.0
- ✓ Animated Presidential Bully Pulpit Podium scene in `SpeechModal.svelte`, Live Broadcast News Anchor + You-vs-Opponent EV medallions in `ElectionNightModal.svelte` / `Voters.svelte`, and Senate Trial / Legacy vignettes in `ImpeachmentModal.svelte`, `TurnReport.svelte`, and `EndScreen.svelte` (`VIGNETTE-01..03`) — v1.0
- ✓ Full-screen UI/UX, layout, and alignment remediation across `App.svelte`, `OvalOffice`, `Congress`, `Budget`, `Powers`, `Trade`, `Voters`, `CrisisModal`, `ElectionNightModal`, and `EndScreen` (`LAYOUT-01..04`) — v1.0
- ✓ *Brotato*-style Quarterly Mandate & Task Force RNG draft (`src/engine/perks.ts` stream 21, `PerkDraftModal.svelte`, 24-card catalog, Reroll/Lock/Skip, Classic Sim toggle) (`PERK-01..03`) — v1.0
- ✓ *How Many Dudes?*-style Policy Doctrine `2/4/6` set bonuses, event-driven chain-reaction triggers (`src/engine/synergies.ts`), and `SynergyBar.svelte` cascading combo popups (`SYN-01..03`) — v1.0
- ✓ Evil Mode Heist Relics & Fixer Syndicate draft pool (`🏝️ Shell Network`, `🕵️ Fixer Ring`, `🏛️ Captured Regulators`), 5 Presidential Playstyle Archetypes (`src/content/archetypes.ts`), and persistent Silver & Gold Mastery Stars (`HEIST-01..02`, `ARCH-01..02`) — v1.0
- ✓ Contextually de-emphasized 24-card Civics Myth catalog (`8 left`, `8 right`, `8 both`) with `By the Numbers`, `Historical Precedent`, `Why the Myth Persists`, and a persistent `showMyths` hide toggle across all surfaces — v1.0
- ✓ 100-seed Monte Carlo balance verification across Standard, Classic Sim, and all 5 Archetypes, plus multi-viewport (`1376×768` / `1280×720`) computer-vision and 77-test Playwright E2E verification (`AUDIT-01..02`) — v1.0
- ✓ Reusable Before/After Screenshot Computer-Vision Flywheel (`scripts/cv-flywheel.ts`, `pnpm cv:flywheel`) with quantitative DOM/pixel telemetry and side-by-side **Before | After | Target** comparison sheets (`CV-01..03`) — v1.1
- ✓ Non-inverted Evil Mode palette (`src/design/tokens.ts`, `StatusBar.svelte`, `Ribbon.svelte`, `OvalOfficeScene.svelte`) matching `.design-targets/g-evil.png` with dark espresso `--canvas` and warm cream parchment `--card` (`EVIL-PAL-01..03`) — v1.1
- ✓ Borderless flat-vector pill-pawn character rig (`Character.svelte`, `CharacterPortrait.svelte`, `FedPortrait.svelte`) with smooth unadorned dome heads and non-overlapping chyron bar (`CHAR-01..03`, `OVAL-01..02`) — v1.1
- ✓ Compact 5×2 Executive Orders grid with above-the-fold `FedPortrait` + `CourtBench` on `Powers.svelte`, enlarged `NewGame.svelte` portico banner, and zero raw Unicode emojis (`GUI-01..03`) — v1.1

- ✓ Layered generated vintage Americana environment plates (`oval-day-bg.jpg`, `oval-evil-bg.jpg`, `newgame-portico-bg.jpg`) + animated weather/lighting midground + dimensional foreground character/desk rigs (`ENV-01..03`) — v1.2
- ✓ Civ-style per-turn trigger cadence (`activeTurnTrigger` — max 1 spotlight trigger per turn) and smart turn-blocker stamp button in `StatusBar.svelte` (`RESOLVE CRISIS !`, `SEND BILL TO CONGRESS →`, `CALL FLOOR VOTE →`, `END QUARTER`) (`TRIG-01..03`) — v1.2
- ✓ `★ PENDING & CLEARING THIS TURN ★` stacked index card (`TurnAgendaCard.svelte` matching `uikit.png` / `hub2.png`) with per-item clearing status (`CLEARS THIS TURN ✓`, `SHORT VOTES ⚠`, `DRAFT UNSENT !`), 1-click staging, and decluttered 3-card `OvalOffice.svelte` right column (`CLEAR-01..03`) — v1.2
- ✓ Progressive disclosure on `Budget.svelte` and `Congress.svelte` (core kitchen-table levers + expandable advanced/institutional drawers matching `g-budget.png` / `g-congress.png`) and Before/After CV Flywheel verification (`PROG-01..03`) — v1.2
- ✓ 8-surface CV Flywheel (`newgame`, `oval-day`, `oval-evil`, `economy`, `voters`, `powers`, `congress`, `budget`), layered Crisis & Quarterly Report environment plates (`crisis-newsroom-bg.jpg`, `report-oval-bg.jpg`), authentic Manila Folder left-rail tabs with halftone dot texture, and Approval Medal ribbon tails (`CV-FULL-01`, `GUI-ART-01..03`) — v1.3
- ✓ Live "Beat the Baseline" Score-Delta Preview Engine (`previewDraftVsBaseline`, `diagnoseBaselineGaps`) + live `Est. +X.X vs. Autopilot` pill on `StatusBar`, `TurnAgendaCard`, `Budget`, and `Congress`, plus an interactive 8-Component **"How to Beat Doing Nothing" Strategy Coach** (`BEAT-01..03`) — v1.3
- ✓ Multi-Path Strategic Playbook Variety (`getStrategicPlaybooks` in `beat-baseline.ts` & `briefing.ts`) with rotating 3-path Chief of Staff playbooks showing projected score deltas (`playbook-variety-strip`), plus tuned early-turn responsiveness (`FUN-01..03`) — v1.3
- ✓ Concept-Art `Economy.svelte` (`g-economy.png`) & `Voters.svelte` (`g-voters.png`) visual and gameplay overhaul (double-line vintage frames, live 4-quarter draft trajectory preview on charts, zero raw Unicode emojis, Americana blue/coral/gold swing-state map, circular `270` bullseye marker, 1-click fix actions) (`ECON-VOT-01..03`) — v1.3

### Active

- None — Milestone v1.3 complete, code-reviewed, audited, and archived. Run `/gsd-new-milestone` to define the next milestone.

### Out of Scope

- Audio, voice narration — decided no audio (A5)
- Live news feed — needs a server, partisan risk (E5)
- Real officeholders — fictional people only (Q6)
- Tactical direct military combat sim — civilian strategy only
- Nuclear war annihilation sandbox — terminal instant-lose without pedagogical value

## Context

- Shipped Milestone v1.3 ("Beat-the-Baseline Strategy Coach, Playbook Variety, Concept-Art Folder/Rosette GUI & Full-Surface CV Flywheel") with 540 unit/property/balance/readability tests across 91 files, 16 side-by-side CV Flywheel comparison sheets across 8 surfaces (`1376×768` and `1280×720`), 0 axe violations, 0 default network egress, and 8/8 cross-browser determinism hashes.
- Pure client application (TypeScript + Svelte 5 runes + Vite), zero backend dependencies, zero telemetry.
- Visual direction C (Americana poster) with dual theme tokens (Day Americana and Dark Espresso/Brass/Cream for Evil Mode).
- Zero outer viewport scrolling across 1376×768 and 1280×720 viewports in both Plain Talk and Policy Wonk modes.
- Determinism verified 8/8 bit-for-bit across Node, Chromium, Firefox, WebKit (minified and unminified).

## Constraints

- **Licensing**: MIT/ISC/Apache/CC0 code and assets, CC BY art with credit — open source (D1)
- **Architecture**: static site, no backend; engine pure and deterministic; screens edit drafts only
- **Tech stack**: Svelte 5.57 runes, Vite 8, TypeScript 6 (svelte-check blocks 7), exact dependency pins
- **Neutrality**: criticize institutions/incentives, never parties; every civic claim cited (E4, E7)
- **Accessibility**: WCAG AA, keyboard, reduced motion, colour-blind-safe

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rewrite in TS, archive Rust | Game needs a fast web UI; Rust sim had no game layer | ✓ Good |
| Score vs autopilot + 10-yr legacy | Separates skill from luck; punishes sugar-high deficits | ✓ Good (harness proves it) |
| Agent-authored SVG characters, not Rive | Agent can author, capture and test end to end | ✓ Good |
| Congress unlocks turn 1 | Budget → Congress is one loop | ✓ Good |
| Keyed stateless RNG streams | Guarantees identical shocks for autopilot regardless of player decisions | ✓ Good |
| Pure arithmetic-only engine (`tanhPade`) | Avoids transcendental Math precision drift across browsers | ✓ Good |
| Native deflate-raw URL hash replay | Shareable runs with zero server storage and zero egress | ✓ Good |
| Regional Price Parity Indexing | Uses authentic BEA RPP indices to ground inflation in state-level costs of living | ✓ Good |
| High-hurdle amendment ratifications | Simulates 2/3 Congress and 3/4 state legislature approvals with realistic pacing | ✓ Good |
| 100-seed party neutrality regression | Ensures symmetric policy yields symmetric reelection odds within 5 pp | ✓ Good |
| Deterministic Geopolitical Crisis Deck | Keyed RNG stream 8 with cited diplomatic/military triads and multi-turn escalation | ✓ Good |
| Security Index Composite | Pure arithmetic 0–100 index driving 10% of Prosperity Index with causal trace explanations | ✓ Good |
| Sector Tariffs & Bilateral Accords | Models Sec 301/232 statutory authorities, inflation pass-through, and trade mitigation | ✓ Good |
| Evil Mode Parallel Game Engine | Pure arithmetic offshore stash and heat tracking while keeping standard mode nonpartisan | ✓ Good |
| Authentic Impeachment Thresholds | 218 House majority and 67 Senate conviction threshold with 100% asset forfeiture | ✓ Good |
| Satirical Kleptocrat Verdict Tiers | 6-tier classification ranking unconvicted plunderers or federal prison downfall | ✓ Good |
| One-click Advisor Plays | Reduces player cognitive friction by letting advisors navigate and pre-fill policy suggestions | ✓ Good |
| Pure-Function Auto-Whip Solver | Uses exhaustive subset search ($2^3 = 8$) to find the cheapest vote coalition without engine impurity | ✓ Good |
| In-Force Policy vs Baseline Dual Indicators | Visually distinguishes current active law from 2026 starting point on budget sliders | ✓ Good |
| Deterministic Starting Scenarios | Deterministic macro/fiscal overrides on top of `us-2026.json` preserving bit-for-bit replay | ✓ Good |
| Living World App-Layer `turnEntropy` | Injects turn-level entropy into `Decisions` (stream 19/20) for both player and autopilot while keeping `src/engine/` 100% pure | ✓ Good |
| Opt-In Free AI Director + Schema Clamping | Supports OpenRouter `:free` cascade failover, OAuth PKCE, and `window.ai` with zero default egress and strict `C.dynamicCrisis*Cap` clamping | ✓ Good |
| Situated Mirage Levers & Debunk-vs-Spin | Places populist "Easy Buttons" at the moment of intent and rewards civic curiosity or cynical TV spin | ✓ Good |
| Progressive Disclosure + Plain Talk / Policy Wonk Toggle | Defaults to friendly kitchen-table English with emoji trade-offs while preserving full statutory/macro terminology on demand | ✓ Good (v0.9) |
| Separated SVG Positioning `<g>` & Inner CSS Animation `<g>` | Prevents CSS keyframe `transform` from overriding SVG `transform="translate(x, y)"` in Chromium | ✓ Good (v1.0) |
| Computer-Vision Screenshot Audit Gate (`1280×720` + `1376×768`) | Catches sub-container clipping, SVG boundary overflows, and speech-bubble collisions that DOM scrollHeight assertions miss | ✓ Good (v1.0) |
| Continuous 72px Thumb-Head Pawn Silhouette + `<CivicEmblem>` SVGs | Matches `.design-targets/D.png` and `cast.png` pawn proportions and replaces raw Unicode emojis with crisp Americana vector art | ✓ Good (v1.0) |
| Contextual De-Emphasized 24-Card Myth Surfacing + `showMyths` Toggle | Surfaces myths only when contextually triggered, auto-hides resolved myths, and lets players hide myth UI across all surfaces | ✓ Good (v1.0) |
| Non-Inverted Evil Mode Palette + Borderless Pill-Pawns | Keeps `--card` warm cream parchment with dark ink inside a dark espresso `--canvas` frame (`g-evil.png`) and removes outer character strokes (`uikit.png`) | ✓ Good (v1.1) |
| Hybrid Layered Generated Environment Plates + Live SVG Foregrounds | Combines painterly Americana architectural room plates (`oval-day-bg.jpg`, `oval-evil-bg.jpg`, `newgame-portico-bg.jpg`) with live animated SVG weather, props, and character rigs | — Pending (v1.2) |
| Civ-Style Turn Trigger Cadence + `TurnAgendaCard` Clearing Checklist | Surfaces at most one spotlight trigger per turn, transforms the Turn Stamp into a smart blocker guide, and displays a `★ PENDING & CLEARING ★` index card | — Pending (v1.2) |

## Completed Milestone: v1.1 Visual Fidelity, Evil Mode Palette & Computer-Vision Flywheel (Shipped 2026-10-18)

**Goal:** Build a reusable before/after Screenshot Computer-Vision Flywheel (`scripts/cv-flywheel.ts`), fix Evil Mode's inverted photo-negative palette to match `.design-targets/g-evil.png`, remove cartoon outer borders on character rigs to match `.design-targets/D.png` and `uikit.png`, and bring `FedPortrait` + `CourtBench` above the fold on `Powers.svelte`.

**Delivered:**
- Reusable before/after Screenshot Computer-Vision Flywheel (`scripts/cv-flywheel.ts`, `pnpm cv:flywheel`, `tests/cv-flywheel.spec.ts`) generating quantitative DOM/pixel telemetry and side-by-side **Before | After | Target** comparison sheets (`CV-01..03`)
- Non-inverted Evil Mode palette (`tokens.ts`, `StatusBar.svelte`, `Ribbon.svelte`, `OvalOfficeScene.svelte`) with dark espresso `--canvas` (`#1A1410`), antique-brass top bar, crimson ribbon, and warm cream parchment `--card` (`#F5EBD6`) (`EVIL-PAL-01..03`)
- Borderless flat-vector pill-pawn rigs (`characterOuterStrokeCount: 15 -> 0`), smooth unadorned male dome heads, wider curtains, and non-overlapping chyron strip (`CHAR-01..03`, `OVAL-01..02`)
- Compact 5×2 Executive Orders grid (`fedPortraitAboveFold: true`, `courtBenchAboveFold: true` at `1280×720`), enlarged `NewGame.svelte` portico banner (`151px -> 223px`), and zero raw Unicode emojis (`rawEmojiCountInCards: 57 -> 0`) (`GUI-01..03`)

## Completed Milestone: v1.0 High-Craft Character Art, Living Animations, UI/UX Alignment & Incremental Mandate Synergies (Shipped 2026-10-18)

**Goal:** Elevate all SVG character models, facial expressions, occupational outfits, articulated poses, reactive NPCs, and animated scene vignettes across `govSim` to match `.design-targets/cast.png`, `D.png`, `g-evil.png`, `g-election.png`, and `g-newgame.png`, remediate every UI/UX, layout, and alignment issue audited across `1280×768` and `1376×768` screenshots, and integrate *Brotato* / *How Many Dudes?*-style Mandate Drafts, Policy Doctrine synergies, Evil Mode Heist Relics, Presidential Archetypes, and contextual de-emphasized Civics Myths.

**Delivered:**
- High-craft SVG character anatomy (`Character.svelte`, `CharacterPortrait.svelte`, `FedPortrait.svelte`, `CourtBench.svelte`) with continuous 72px-wide finger/thumb-shaped head + 72px-wide torso pawn proportions, facial expressions, outfits, and articulated poses (`GFX-01..03`)
- Selectable Presidential Look / Avatar picker + White House inauguration banner on `NewGame.svelte`, `OvalOfficeScene.svelte` with curved wainscot wall, Presidential Eagle carpet seal, Resolute Desk, Evil Mode banker's-lamp cash stacks & shredder, and Advisor NPC portraits (`SCENE-01..02`)
- Live whip-reactive Congressional Bloc Leaders in `Hemicycle.svelte` / `Congress.svelte` and `netMonthlyDelta`-reactive Citizen NPC portraits in `HouseholdCard.svelte` / `HouseholdModal.svelte` / `Budget.svelte` (`NPC-01..02`)
- Animated Bully Pulpit Podium scene in `SpeechModal.svelte`, Live Broadcast Anchor + You-vs-Opponent EV medallions in `ElectionNightModal.svelte` / `Voters.svelte`, and Senate Trial / Legacy vignettes in `ImpeachmentModal.svelte`, `TurnReport.svelte`, and `EndScreen.svelte` (`VIGNETTE-01..03`)
- Full UI/UX, Layout & Alignment Remediation across `App.svelte`, `OvalOffice`, `Congress`, `Budget`, `Powers`, `Trade`, `Voters`, `CrisisModal`, `ElectionNightModal`, and `EndScreen` (`LAYOUT-01..04`)
- *Brotato*-style Quarterly Mandate & Task Force RNG draft (`PERK-01..03`), *How Many Dudes?*-style Policy Doctrine `2/4/6` set bonuses & chain-reaction triggers (`SYN-01..03`), Evil Mode Heist Relics & Fixer Syndicate (`HEIST-01..02`), Presidential Playstyle Archetypes & Mastery Stars (`ARCH-01..02`), and contextual de-emphasized 24-card Myth catalog with `showMyths` hide toggle
- 100-seed Monte Carlo balance verification and computer-vision + 77-test Playwright E2E audit across `1376×768` and `1280×720` viewports (`AUDIT-01..02`)

## Completed Milestone: v0.9 Progressive Disclosure, Plain-Talk Civics, Trade-Off Clarity & Gameplay Balance (Shipped 2026-10-16)

**Goal:** Transform `govSim` from a simulationist policy dashboard into an approachable, witty, kitchen-table strategy game using progressive disclosure, a 1-click `"Plain Talk / Policy Wonk"` vocabulary toggle, scannable `👍 Upside / ⚠️ The Catch` trade-off badges with friendly emojis and visual meters, and audited gameplay trade-offs—while strictly preserving the `1376×768` / `1280×720` zero-scroll layout budget.
**Delivered:**
- Persistent `"Plain Talk / Policy Wonk"` vocabulary toggle (`vocabMode`) in `Session`, `NewGame`, and `StatusBar`, backed by a 32-term Civics Glossary (`VOCAB-01`, `VOCAB-02`)
- Reusable `<TradeoffPill>` progressive-disclosure UI component with `👍 Upside` / `⚠️ The Catch` badges, emoji impact meters, and expandable `"📜 Official Law / Real Term"` details (`VOCAB-03`)
- Dual-layer (`plain` + `wonk`) content overhaul across Executive Orders, Sanctions, Tariffs, Trade Pacts, Social Policies, Reforms, Congress Deals, Crises, and Causal Traces with friendly emojis, institutional humor, and explicit trade-offs (`COPY-01`, `COPY-02`, `COPY-03`)
- Action-screen trade-off surfacing across `Budget`, `Powers`, `Trade`, `Congress`, and Reform Modals with right-column `"Why click this?"` advisor cards and visual meters (`UI-CLARITY-01`, `UI-CLARITY-02`, `UI-CLARITY-03`)
- Kitchen-table clarity on `OvalOffice`, `Economy`, `Voters`, `TurnReport`, and `CrisisModal` with Plain-Talk indicator headers, emoji health badges, and crisis response trade-offs (`SEE-01`, `SEE-02`)
- Presidential trade-off balance audit & tuning plus automated readability (grade ≤ 9) and multi-viewport (`1376×768` / `1280×720`) zero-scroll and axe-core verification (`BAL-01`, `BAL-02`)

## Completed Milestone: v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy (Shipped 2026-10-14)

**Goal:** Transform civics myth cards from static popups into interactive, intrinsically motivating gameplay mechanics featuring tempting "Mirage Levers", prediction-error reality checks, 1-click pivots to real policy levers, and "Debunk vs. Spin" strategic trade-offs.
**Delivered:**
- Expanded 12-card spectrum-balanced Myth catalog (`4 left`, `4 right`, `4 both`), structured 2-option bottleneck predictions, tempting `mirageLabel` copy, and typed `realLeverActions` pivot targets (`DECK-01..02`, `PIVOT-01`)
- Interactive Reality-Check `MythModal.svelte` with 1-click prediction challenges, tactile `MYTH BUSTED` stamp-slam animation, zero-friction skip/dismiss, and 1-click tactical pivots to real policy levers (`MYTH-03..04`, `PIVOT-02`)
- Situated "Mirage Levers" across `Economy`, `Budget`, `Congress`, `Powers`, `Trade`, and `Voters` plus contextual Chief of Staff blame/myth suggestions in `OvalOffice` (`MYTH-01..02`)
- Pure-engine `"Debunk vs. Spin"` mechanic (`spinMyth` in `PowerDecisions`, registered coefficients, causal trace copy, and `EndScreen.svelte` Civic Mastery Dossier) (`SPIN-01..02`)

## Completed Milestone: v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director (Shipped 2026-10-14)

**Goal:** Overhaul character and scene graphics from simple shapes into expressive, state-reactive Americana editorial-poster illustrations, inject tactile micro-interactions and satirical institutional wit (with Calm Mode), add guided Year-1 onboarding and a "Show Your Work" Model Inspector, and introduce an optional Living World variance mode plus a Free AI Director powered by OpenRouter `:free` routes, browser AI, or free-tier keys.
**Delivered:**
- Dramatic SVG art overhaul & state-reactive scenes: layered Americana editorial-poster anatomy, 5 reactive moods, and live `GameState`-reactive Oval Office, Reporter, Court, and Fed scenes (`ART-01..03`)
- Tactile visual flair, satirical wit & Calm Mode: stamp-slam signing animations, hemicycle seat-flip pulses, 40+ readability-gated chyrons, and a persistent `"Calm mode"` toggle (`JUICE-01..03`)
- Year-1 progressive onboarding: Turn 1/2/3+ screen progression with contextual callouts, `NEW` badges, and `"Unlock all screens immediately"` toggle (`ONBOARD-01..02`)
- "Show Your Work" Model Inspector: interactive catalog exposing all 138 parameters and 6 core macroeconomic equations with live search, domain filters, and verified citations (`MODEL-01..02`)
- Living World variance & Free AI Director: app-layer `turnEntropy` shocks, multi-provider Free AI adapter (`openrouter/free` + `:free` discovery, 429 failover, OAuth PKCE, `window.ai`, Gemini/Groq/Ollama BYOK), and party-blind AI Director with schema-clamped dynamic crisis dilemmas (`AI-01..04`)

## Completed Milestone: v0.6 Completeness, Advisor Agency & Scenarios (Shipped 2026-10-14)

**Goal:** Eliminate every remaining "Coming soon" stub and disconnected UI loop, elevate day-to-day gameplay feel with one-click Advisor Plays, Congress Auto-Whip, and Fast-Forward pacing controls from `docs/design.md`, and multiply replayability with selectable starting scenarios.
**Delivered:**
- Interactive civic explainers & Learn loop: step-by-step interactive "How it works" modals across all screens (+1 Clout bonus), Trade Learn strip, 3 new Myth cards, and wired Oval Office Chief of Staff suggestion modals (LEARN-01, LEARN-02, LEARN-03)
- Smart Advisor plays & Congress Auto-Whip: actionable one-click "Advisor Plays" navigating and pre-fill draft packages, pure `findCheapestCoalition` solver for 218 House votes, live Household Persona binding, and dual in-force vs 2026 baseline slider indicators (ADVISOR-01, ADVISOR-02, ADVISOR-03)
- Turn pacing & staged decisions: top-bar live Staged Decisions tray with unsent warnings and screen jump buttons, safe "Skip to Next Event" fast-forward loop with automatic interrupts on crises/deadlines/elections (PACE-01, PACE-02)
- Replayable starting scenarios: curated Starting Scenario selector at New Game with 4 scenarios, inauguration briefings, and persistent EndScreen and URL hash replay badges (SCEN-01, SCEN-02)

## Completed Milestone: v0.5 Satirical "Evil Mode" (Shipped 2026-10-13)

**Goal:** Implement the satirical "Evil Mode" kleptocracy gameplay loop where the objective is to maximize an offshore stash while managing an escalating Heat meter to evade congressional investigations, special counsels, and impeachment trials.
**Delivered:**
- Alternative game mode toggle at New Game, pure deterministic offshore stash accumulator ($B), and dynamic 0–100 Heat meter (EVIL-01, EVIL-02, EVIL-03)
- Corrupt executive levers: no-bid crony contracts, land auctions, tariff exemption sales, library foundation slush funds, and watchdog purges (LEVER-01, LEVER-02, LEVER-03)
- Institutional backlash: special counsel investigations, House impeachment votes, and Senate conviction trials with immediate asset forfeiture (IMPEACH-01, IMPEACH-02, IMPEACH-03)
- Satirical visual reskin: dark Americana theme (oxblood, aged gold, ink), live Oval Office stash rosette/heat gauge, Kleptocratic Heist Review EndScreen, and 6-tier satirical verdicts (UI-01, UI-02, UI-03)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-18 after v1.0 milestone initialization*
