# Requirements: govSim v0.7 — Dramatic Visuals, Satirical Wit, Progressive Onboarding, Model Inspector & Free AI Director

**Defined:** 2026-10-14
**Core Value:** A player can make real presidential tradeoffs (or play the satirical "Evil Mode" kleptocracy) against an honest, explainable model of the current US, and always understand *why* the country got better or worse — now with dramatic Americana editorial-poster illustrations, satirical wit, progressive Year-1 onboarding, an interactive Model Inspector, and an optional Free AI Director & Living World mode.

## v0.7 Requirements

### Dramatic SVG Art Overhaul & Reactive Scenes (Phase 25)

- [x] **ART-01**: Upgrade `src/ui/art/Character.svelte` from basic geometric pills into layered Americana editorial-poster illustrations with contoured anatomy (hairstyles, ears, noses, eyebrows, expressive eyes, collars, suit lapels, ties/pearls, shading) and 5 reactive mood states (`confident`, `stressed`, `scheming`, `panicked`, `triumphant`) using CSS custom properties from `src/design/tokens.ts`.
- [x] **ART-02**: Upgrade `src/ui/art/OvalOfficeScene.svelte` to dynamically react to live `GameState` — changing window weather/sky with economic health, desk props (bill stacks, coffee mugs, flashing red crisis phone), character poses/expressions, and satirical Evil Mode visual tells (document shredder, offshore ledger, nervous sweat).
- [x] **ART-03**: Upgrade `src/ui/art/ReporterScene.svelte`, `src/ui/art/CourtBench.svelte`, and `src/ui/art/FedPortrait.svelte` with detailed editorial-poster props (microphones, cameras, scales of justice, gavel, marble pillars, yield-curve ticker board) and state-reactive expressions.

### Visual Flair, Micro-Interactions, Satirical Wit & Calm Mode (Phase 26)

- [x] **JUICE-01**: Add tactile policy micro-interactions including a stamp-slam animation when signing bills or Executive Orders, Congress hemicycle seat-flip pulse animations when whipping coalitions, and animated indicator delta badges.
- [x] **JUICE-02**: Expand ironic, dryly humorous news-ticker chyrons, advisor quips, and satirical institutional flavor across `src/content/` while remaining strictly party-blind and passing the automated Flesch-Kincaid reading grade ≤ 9.0 and ≤ 20 words/sentence gates.
- [x] **JUICE-03**: Add an explicit in-game `"Calm mode"` toggle in `StatusBar.svelte` (persisted in preferences and respecting `prefers-reduced-motion`) that disables decorative animations, ticker marquees, and stamp-slam motion on demand.

### Year-1 Progressive Onboarding & Guided Turn Flow (Phase 27)

- [x] **ONBOARD-01**: Implement Year-1 progressive onboarding per `docs/design.md` §7b — guiding new runs through Turn 1 (Oval Office, Budget, Congress), Turn 2 (Your Powers), and Turn 3+ (Voters, Social, Trade, Reforms) with contextual stage callouts and step badges.
- [x] **ONBOARD-02**: Provide an `"Unlock all screens immediately"` toggle on `NewGame.svelte` and in-game navigation so experienced players and automated tests can access any screen on Turn 1 without friction.

### "Show Your Work" Model Inspector & Citation Audit (Phase 28)

- [ ] **MODEL-01**: Build an interactive `"Show your work"` Model Inspector modal/drawer accessible from the Economy screen and About modal that renders live `src/engine/coefficients.ts` parameters, equations, valid ranges, and literature citations grouped by policy domain.
- [ ] **MODEL-02**: Audit and upgrade remaining `judgement` coefficient citations in `src/engine/coefficients.ts` with verified institutional/academic source references and plain-language notes.

### Free AI Director, OpenRouter `:free` Auto-Routing & Living World Variance (Phase 29)

- [ ] **AI-01**: Implement a Living World non-deterministic mode toggle (`livingWorld`) that injects fresh turn-level entropy via `Decisions` / app-layer seed mixing (preserving `src/engine/` purity and seeded determinism when off) and triggers emergent multi-condition shock chains.
- [ ] **AI-02**: Build a client-side Free AI Provider adapter (`src/app/ai-providers.ts`) supporting OpenRouter `:free` model auto-discovery (`GET /api/v1/models` filtered for `:free` + `openrouter/free` fallback with automatic 429 failover), 1-click OpenRouter OAuth PKCE key exchange, browser-native local AI (`window.ai`), and BYOK free tiers (Gemini Flash, Groq, custom local Ollama/OpenAI endpoint), strictly opt-in so default zero-egress CSP tests remain green.
- [ ] **AI-03**: Build the generative AI Director (`src/app/ai-director.ts`) that consumes a compact `GameState` digest each turn to generate bespoke Oval Office advisor briefings, satirical breaking-news chyrons, and year-end press questions, filtered through the party-blind/banned-name sanitizer with instant offline fallback.
- [ ] **AI-04**: Enable AI-generated dynamic crisis & dilemma cards with schema-validated, strictly clamped numeric effect vectors (bounded within safe `coefficients.ts` limits) so the AI Director can synthesize realistic situational dilemmas that affect gameplay without breaking engine balance.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ART-01 | Phase 25 | Complete |
| ART-02 | Phase 25 | Complete |
| ART-03 | Phase 25 | Complete |
| JUICE-01 | Phase 26 | Complete |
| JUICE-02 | Phase 26 | Complete |
| JUICE-03 | Phase 26 | Complete |
| ONBOARD-01 | Phase 27 | Complete |
| ONBOARD-02 | Phase 27 | Complete |
| MODEL-01 | Phase 28 | Pending |
| MODEL-02 | Phase 28 | Pending |
| AI-01 | Phase 29 | Pending |
| AI-02 | Phase 29 | Pending |
| AI-03 | Phase 29 | Pending |
| AI-04 | Phase 29 | Pending |
