# Milestones

## v0.8 Interactive Myth-Busting, Mirage Levers & Intrinsic Civic Pedagogy (Shipped: 2026-10-14)

**Phases completed:** 4 phases, 4 plans, 0 tasks

- Expanded 12-card spectrum-balanced Myth catalog (`4 left`, `4 right`, `4 both`), structured 2-option causal bottleneck predictions, tempting `mirageLabel` copy, and typed `realLeverActions` pivot targets (`DECK-01`, `DECK-02`, `PIVOT-01`).
- Interactive Reality-Check `MythModal.svelte` with 1-click prediction challenges, tactile `MYTH BUSTED` stamp-slam animation, zero-friction skip/dismiss, and 1-click tactical pivots to real policy levers (`MYTH-03`, `MYTH-04`, `PIVOT-02`).
- Tempting "Mirage Levers" across `Economy`, `Budget`, `Congress`, `Powers`, `Trade`, and `Voters` plus contextual Chief of Staff blame/myth suggestions in `OvalOffice` (`MYTH-01`, `MYTH-02`).
- Pure-engine `"Debunk vs. Spin"` mechanic (`spinMyth` in `PowerDecisions`, registered coefficients, causal trace copy, and `EndScreen.svelte` Civic Mastery Dossier) (`SPIN-01`, `SPIN-02`).

---

## v0.7 Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director (Shipped: 2026-10-14)

**Phases completed:** 5 phases, 9 plans, 0 tasks

- Dramatic SVG art overhaul & state-reactive scenes: replaced simple geometric pill characters and static backdrops with layered Americana editorial-poster illustrations (`Character.svelte`, `OvalOfficeScene.svelte`, `ReporterScene.svelte`, `CourtBench.svelte`, `FedPortrait.svelte`), 5 reactive facial expressions (`confident`, `stressed`, `scheming`, `panicked`, `triumphant`), dynamic window sky/weather, desk prop density, and Evil Mode visual tells (document shredder, offshore ledger).
- Tactile visual flair, satirical wit & Calm Mode: added stamp-slam signing animations (`Congress.svelte`, `Powers.svelte`), Congress hemicycle seat-flip pulses (`Hemicycle.svelte`), a persistent `"Calm mode"` accessibility toggle in `StatusBar.svelte` (respecting `prefers-reduced-motion`), and 40+ ironic, party-blind news-ticker chyrons (`src/content/chyrons.ts`) passing the Flesch-Kincaid grade $\le 9.0$ gate.
- Year-1 progressive onboarding & Unlock All control: guided new players through Year 1 (`docs/design.md` §7b: Turn 1 Oval/Budget/Congress, Turn 2 Your Powers, Turn 3+ Voters/Social/Trade/Reforms) with contextual callouts, `NEW` rail badges, and an `"Unlock all screens immediately"` toggle on `NewGame.svelte` and `Rail.svelte`.
- "Show Your Work" Model Inspector & citation audit: built an interactive Model Inspector (`src/content/model-inspector.ts`, `ModelInspectorModal.svelte`) accessible from Economy and AboutModal, surfacing 100% of `COEFF`, `SCORE`, `LIMITS`, and `RULES` parameters (`138` total) plus 6 core macroeconomic equations with live search, domain filters, range indicator bars, and verified institutional citations.
- Living World variance & opt-in Free AI Game Director: implemented non-deterministic Living World mode (`turnEntropy` on stream 19/20 with player/autopilot shock parity and 100% deterministic replayability), a multi-provider Free AI client (`src/app/ai-providers.ts`: OpenRouter `:free` live model discovery + 429 cascade failover, 1-click OAuth PKCE, Chrome `window.ai`, Gemini/Groq/Ollama BYOK) with zero default network egress, and a context-aware AI Director (`src/app/ai-director.ts`, `DynamicCrisisModal.svelte`) generating party-blind briefings and schema-clamped dynamic crisis dilemmas.

---

## v0.6 Completeness, Advisor Agency & Scenarios (Shipped: 2026-10-14)

**Phases completed:** 4 phases, 8 plans, 0 tasks

- Interactive civic explainers & Learn loop: replaced all disabled "Coming soon" buttons with step-by-step interactive "How it works" civic explainer modals across Oval Office, Economy, Budget, and Trade screens, awarding a one-time +1 Clout curiosity bonus, expanded the Myth card deck with 3 cited institutional entries, and wired Oval Office Chief of Staff suggestion modals.
- Smart Advisor plays & Congress Auto-Whip: converted Chief of Staff recommendations into actionable one-click "Advisor Plays" that navigate and pre-fill recommended policy packages, implemented a pure-function findCheapestCoalition solver that determines the lowest-Clout deal combination to reach 218 House votes, bound the Budget impact card to the active Household Persona, and displayed slider changes against both current in-force policy and the 2026 baseline.
- Pacing controls & staged decisions tray: live top-bar Staged Decisions indicator with jump buttons and unsent warnings summarizing pending budget, deal, and executive actions, paired with a safe "Skip to Next Event" fast-forward loop advancing quiet quarters with automatic interrupts on active crises, annual budget deadlines, midterms, impeachment milestones, and reelection night.
- Replayable starting scenarios: curated Starting Scenario selector at New Game offering 4 historically grounded starting scenarios (2026 Standard Baseline, 70s Stagflation Shock, Debt Ceiling Brinkmanship, Global Trade War) with deterministic macro/fiscal overrides, inauguration briefing objectives, and persistent legacy badges on the EndScreen and URL replay hash.

---

## v0.5 Satirical 'Evil Mode' (Shipped: 2026-10-13)

**Phases completed:** 4 phases, 16 plans, 0 tasks

- Evil Mode opt-in & pure engine foundations: alternative kleptocracy game mode toggle at New Game, pure deterministic offshore stash accumulator ($B), and dynamic 0–100 Heat meter with natural decay, evidence leaks, and institutional legislative friction.
- Corrupt executive levers: catalog of corrupt presidential directives (awarding no-bid crony contracts, fire-sale land/asset auctions, tariff exemption sales, library foundation slush fund solicitations, and watchdog purges) with direct kickbacks, clout costs, and heat generation.
- Institutional backlash & impeachment: special counsel appointments and congressional subpoenas (>60 heat) draining 25 clout/quarter, House impeachment floor votes (>80 heat, 218 threshold), and Senate conviction trial (2/3 supermajority, 67 threshold) with instantaneous asset forfeiture to $0.0B and term termination.
- Satirical UI reskin & heist end screens: dark Americana poster theme palette (oxblood, aged gold, ink), live Oval Office Offshore Stash rosette and Heat Gauge, Kleptocratic Heist Review EndScreen with Extraction Ledger, 6-tier satirical kleptocrat ranking (or federal penitentiary downfall), and WCAG AA contrast compliance across all viewports.

---

## v0.4 Foreign Policy & International Crises (Shipped: 2026-10-12)

**Phases completed:** 4 phases, 16 plans, 0 tasks

- Geopolitical crises deck: paced international crisis events (oil embargo, shipping strait blockade, debt contagion, cyber infrastructure blackout) with multi-turn countdowns, cited diplomatic/economic/military resolution options, and persistent Oval Office alert banner.
- Foreign policy & sanctions levers: defense readiness posture dials, foreign assistance sliders, targeted economic sanctions with domestic inflation pass-through, and the "Cut Foreign Aid to Fix Deficit" civics myth card.
- Security Index & macro feedback engine: pure deterministic 0–100 Security Index based on readiness, alliances, and crisis containment, driving 10% of the Prosperity Index with transparent causal trace explanations in report cards.
- International trade & tariffs screen: dedicated Trade screen with strategic sector tariffs (chips, minerals, clean energy) citing Section 301 and Section 232, bilateral trade accords mitigating reciprocal retaliation, and an accessible 10-state export vulnerability matrix.

---

## v0.3 Social Policy & Domestic Reform (Shipped: 2026-10-12)

**Phases completed:** 4 phases, 16 plans, 0 tasks

- Domestic social policy levers: pure engine mechanics, registered coefficients, and Congressional voting bloc dynamics for healthcare, immigration, energy/climate, and education policies.
- Demographic & regional distribution: state-level regional exposure indices, BEA regional price parities, dynamic voter coalition shifts, and interactive map/table breakdowns.
- Structural government reform: Senate filibuster options (60-vote, talking, 55-vote, majority), judicial ethics and 18-year term limits, and high-hurdle constitutional amendment ratifications.
- "Your Household" impact card: 7 kitchen-table budget lines, 4 authentic preset personas, customizable family builder, and 100-seed Monte Carlo game balance calibration (+3.425 headroom, <= 5 pp party neutrality).

---

## v0.2 Playable First Term (Shipped: 2026-10-12)

**Phases completed:** 8 phases, 40 plans, 9 tasks

- Engine shocks are keyed stateless draws with bit-reproducible cross-browser determinism under a strict AST purity gate.
- Saves and continuous deployment: autosaves, v1 schema freeze, native deflate-raw shareable URL replays, and zero-egress CSP architecture.
- Turn report card with 8 indicators, approval, clout, full ledger traces, unexpected effects, and Economy screen with Fed rate mechanics.
- Paced exogenous and endogenous crises with countdown deadlines, qualitative risk bands, and rally-around-the-flag effects.
- Executive powers: 10 cited executive orders with 6-3 court challenges, Fed and SCOTUS appointments, bully pulpit speeches, and civics myth cards.
- Voters screen with interactive 50-state + DC + ME/NE map, 270 projection bar with uncertainty intervals, and midterms.
- Full term election night reveal, contingent House election handling, causal trace debrief, second term extension, and 10-year legacy scoring.
- 12 policy milestone badges, balance harness calibration across training/validation seeds, About/Privacy/Credits modal, and zero-egress diagnostic report bundle.

---
