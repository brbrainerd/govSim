# Requirements: govSim

**Defined:** 2026-10-09
**Core Value:** A player can make real presidential tradeoffs against an honest, explainable model of the current US, and always understand *why* the country got better or worse.

Decisions applied (research/SUMMARY.md): D1 term-relative calendar · D2 exogenous crises identical, endogenous labelled · D3 minimal midterms · D4 tipping-point centring + party pick · D5 EOs expire in legacy · D6 axe dev-only exception · D7 MIT + CC BY 4.0 · D8 public title deferred · D9 subdomain of an owned domain, private until public link · D10 bit-reproducible engine math · D11 one projected-final headline. Deploy: Coolify (Docker) on Hetzner, GHCR, auto-promote on push to main, Cloudflare R2 for assets.

## v0.2 Requirements

### Engine foundations

- [x] **FND-01**: A player who makes no decisions faces exactly the same outside crises and shocks as autopilot on the same seed, whatever else they do (keyed RNG streams; GR-01/02)
- [x] **FND-02**: A saved game replays to identical results in Chromium, WebKit and Firefox (no transcendental `Math` in the engine; GR-32)
- [x] **FND-03**: Player sees turns as "Year N · Season" of their term, with the real-world date in a tooltip; midterms fall in Year 2 Fall, reelection in Year 4 Fall
- [x] **FND-04**: Every indicator change is explained by named causes that add up exactly to the change, including a "luck" line (engine trace; GR-05)
- [x] **FND-05**: Clout costs are charged by the engine from the player's raw choices, so the preview and the result always match
- [x] **FND-06**: The 10-year legacy projection runs with no new events, and executive orders do not carry into it
- [x] **FND-07**: Every model coefficient has a citation or an explicit "judgement" tag and an allowed range (GR-22)
- [x] **FND-08**: Player picks a party at New Game; the engine stays party-blind

### Saves & enforced guardrails

- [x] **OBS-01**: Game autosaves every turn and resumes after reload; player can export and import a save file that is validated before use
- [x] **OBS-02**: Replaying any save reproduces the same game exactly (golden replays in CI)
- [x] **OBS-03**: Property tests over random seeds and decision sequences hold the engine invariants (no NaN, ranges, determinism)
- [x] **OBS-04**: The production site makes no network requests beyond its own origin and asset host, proven by CSP, an end-to-end egress test and a source scan; no telemetry
- [x] **OBS-05**: All player-facing text passes content gates: reading grade ≤ 9, sentences ≤ 20 words, jargon only as a "real term", no party or real-person names, citations on civic claims
- [x] **OBS-06**: A committed balance report changes only with an explanation; sensible play beats doing nothing by 2–10 index points and every lever moves the score
- [x] **OBS-07**: Every screen and overlay passes axe accessibility checks, is playable keyboard-only and has a screenshot baseline
- [x] **OBS-08**: CI runs check / unit / build / e2e jobs with bundle and performance budgets, a license allowlist and exact pins, as required checks on main

### Turn report & Economy

- [x] **RPT-01**: After each turn the player sees a report card: 8 indicators plus approval and clout, each with value, unit, arrow, word and top cause, plus luck and "vs doing nothing"
- [x] **RPT-02**: The headline score everywhere is the projected final score (same function as the end screen), with "Now" and "In 10 years" underneath
- [ ] **RPT-03**: Player earns about 12 badges for reaching real policy milestones
- [x] **RPT-04**: The report card names 1–2 effects the player didn't see coming, with their causes
- [x] **ECO-01**: Economy screen charts you vs doing nothing for growth, jobs, prices and debt plus all 8 scores, each with a table fallback
- [x] **ECO-02**: Economy screen shows the Fed rate with a plain explanation of why the Fed moved and a "why it's happening" panel from the engine trace

### Events & crises

- [x] **EVT-01**: Outside crises (disasters, recession, oil shock, pandemic, court vacancy) are scheduled from the seed, identical for autopilot, and paced: none in turns 1–2, at most one per turn, with cooldowns
- [x] **EVT-02**: A crisis opens a modal with 2–3 options plus "do nothing", each with its cost shown; the choice takes effect at Next turn; autopilot takes a stated default
- [x] **EVT-03**: Crises the player causes (financial shock, unrest, debt crisis) arise from conditions and are labelled "autopilot didn't face this"
- [x] **EVT-04**: Shutdown and debt-ceiling deadlines show a countdown of at least 2 turns and are resolved through Congress
- [x] **EVT-05**: Player sees qualitative risk bands ahead of time (hurricane season, debt stress, outbreak abroad)
- [x] **EVT-06**: Handling a disaster well gives a temporary rally in approval
- [x] **EVT-07**: The Oval Office briefing and suggestions come from the turn's real events, not sample text

### Your Powers

- [ ] **PWR-01**: Player can sign or revoke about 10 cited executive orders, each showing clout cost and a court-risk band
- [ ] **PWR-02**: Challenged orders get a named court ruling 1–3 turns later, decided by a keyed draw against a 6–3 court
- [ ] **PWR-03**: Player can nominate a Fed chair when the seat opens (Senate confirmation threshold) and can pressure the Fed at a credibility cost
- [ ] **PWR-04**: Player can nominate a justice when a Supreme Court seat opens
- [ ] **PWR-05**: Player can give a speech to a chosen audience, with diminishing returns
- [ ] **PWR-06**: Player can open 5 spectrum-balanced, cited myth cards; the first visit to each gives a small reward
- [ ] **PWR-07**: Clout has a cap so hoarding is not a strategy

### Voters & Electoral College

- [ ] **VOT-01**: Voters screen shows a map of the 50 states plus DC and the Maine/Nebraska districts in player-relative colours, keyboard-focusable, with a sortable table fallback
- [ ] **VOT-02**: Player can open a state to see support, change, electoral votes and reasons; swing states and the tipping-point state are listed
- [ ] **VOT-03**: An Electoral College bar to 270 shows the current projection, with an honest range from about Year 3
- [ ] **VOT-04**: Both parties start with equal reelection odds (within 5 points over 300 seeds)
- [ ] **VOT-05**: Midterms at Year 2 and Year 6 change House and Senate seats from approval, with a bounded penalty
- [ ] **VOT-06**: Data adds sourced Maine/Nebraska district margins, per-state House delegations and per-state exposure (farm, manufacturing, energy)

### Election & end of term

- [ ] **ELC-01**: Reelection at the end of Year 4 is decided by the Electoral College, including a House contingent election on a tie; autopilot's own result is shown
- [ ] **ELC-02**: Election night reveal is skippable and has a reduced-motion version
- [ ] **ELC-03**: After the result, a why-you-won/lost card from the engine trace, with retry from the start of the turn
- [ ] **ELC-04**: Winning continues to a second term ending at turn 32; losing goes to the end screen
- [ ] **ELC-05**: End screen shows the score vs doing nothing, the 10-year legacy and a historian verdict tier

### Release & distribution

- [x] **REL-01**: Repo has LICENSE (MIT), LICENSE-ASSETS (CC BY 4.0), TRADEMARKS.md, CONTRIBUTING.md with DCO, and generated third-party notices
- [ ] **REL-02**: Player can open an About / Privacy / Credits screen; PRIVACY.md states that nothing is collected and what server logs exist
- [ ] **REL-03**: Player can copy a share-your-run code that replays their game for someone else
- [ ] **REL-04**: Player can copy a "report a problem" bundle (local error log + run code) after seeing its contents; nothing is sent automatically
- [x] **REL-05**: Pushing to main builds a Docker image (static app + `/api/health`) to GHCR and, after CI is green, auto-promotes it to Coolify on Hetzner by SHA with health verification and rollback
- [x] **REL-06**: Large assets are served from Cloudflare R2 and allowed by the CSP; the site lives on a private subdomain until a public link is shared

## Future Requirements

- Your Household card; region-targeted speeches and regional event effects
- Filibuster and full Senate bloc model; impeachment
- Data-driven historian thresholds; expanded event variants
- Public title + USPTO search; public alpha on itch.io; donations under a funding-neutrality policy
- Steam Supporter Edition (Electron + steamworks.js) at v1.0; installable web app
- Social policy & Reform track (M2), foreign policy (M3), evil mode (M4)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Analytics, telemetry, error-reporting services | Minors in the audience; "collect nothing" keeps COPPA / Children's Code out of scope |
| Ads, in-app purchases, loot boxes | Minors, neutrality, trust |
| Accounts or server-side player data | Not needed; saves stay in the browser |
| Policy changing whether outside crises happen | Would make the score depend on luck (D2) |
| Precise % odds, hidden luck adjusters | Players read them as rigged; use qualitative bands |
| Intra-turn undo | Design G7; retry from turn start covers it |
| Mobile app stores | Desktop-first; state age-signal laws |
| Self-hosted CI runners for this repo | Public repo: fork PRs could run code on private machines |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Complete |
| FND-02 | Phase 1 | Complete |
| FND-03 | Phase 1 | Complete |
| FND-04 | Phase 1 | Complete |
| FND-05 | Phase 1 | Complete |
| FND-06 | Phase 1 | Complete |
| FND-07 | Phase 1 | Complete |
| FND-08 | Phase 1 | Complete |
| OBS-01 | Phase 2 | Complete |
| OBS-02 | Phase 2 | Complete |
| OBS-03 | Phase 2 | Complete |
| OBS-04 | Phase 2 | Complete |
| OBS-05 | Phase 2 | Complete |
| OBS-06 | Phase 2 | Complete |
| OBS-07 | Phase 2 | Complete |
| OBS-08 | Phase 2 | Complete |
| RPT-01 | Phase 3 | Pending |
| RPT-02 | Phase 3 | Pending |
| RPT-03 | Phase 8 | Pending |
| RPT-04 | Phase 4 | Pending |
| ECO-01 | Phase 3 | Pending |
| ECO-02 | Phase 3 | Pending |
| EVT-01 | Phase 4 | Pending |
| EVT-02 | Phase 4 | Pending |
| EVT-03 | Phase 4 | Pending |
| EVT-04 | Phase 4 | Pending |
| EVT-05 | Phase 4 | Pending |
| EVT-06 | Phase 4 | Pending |
| EVT-07 | Phase 4 | Pending |
| PWR-01 | Phase 5 | Pending |
| PWR-02 | Phase 5 | Pending |
| PWR-03 | Phase 5 | Pending |
| PWR-04 | Phase 5 | Pending |
| PWR-05 | Phase 5 | Pending |
| PWR-06 | Phase 5 | Pending |
| PWR-07 | Phase 5 | Pending |
| VOT-01 | Phase 6 | Pending |
| VOT-02 | Phase 6 | Pending |
| VOT-03 | Phase 6 | Pending |
| VOT-04 | Phase 6 | Pending |
| VOT-05 | Phase 6 | Pending |
| VOT-06 | Phase 6 | Pending |
| ELC-01 | Phase 7 | Pending |
| ELC-02 | Phase 7 | Pending |
| ELC-03 | Phase 7 | Pending |
| ELC-04 | Phase 7 | Pending |
| ELC-05 | Phase 7 | Pending |
| REL-01 | Phase 1 | Complete |
| REL-02 | Phase 8 | Pending |
| REL-03 | Phase 8 | Pending |
| REL-04 | Phase 8 | Pending |
| REL-05 | Phase 2 | Complete |
| REL-06 | Phase 2 | Complete |

**Coverage:**

- v0.2 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0

---
*Requirements defined: 2026-10-09*
*Last updated: 2026-10-09 after roadmap creation*
