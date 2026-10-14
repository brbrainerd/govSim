# Phase 29 UI Design Contract — Free AI Director, OpenRouter `:free` Auto-Routing & Living World Variance

**Phase:** 29
**Requirements:** `AI-01`, `AI-02`, `AI-03`, `AI-04`
**Target Visuals:** `.design-targets/g-newgame.png`, `.design-targets/g-home.png`, `.design-targets/g-crisis.png`

## 1. Living World Non-Deterministic Toggle (`AI-01`)

- On `NewGame.svelte`, add a `"Living World Mode (Non-Deterministic Shocks)"` toggle (`data-testid="living-world-toggle"`).
- When active (`options.livingWorld === true`), `Session.nextTurn()` generates fresh turn-level entropy (`turnEntropy`) via `crypto.getRandomValues` in the app layer (`src/app/session.svelte.ts`) and records it in `Decisions.turnEntropy` so:
  1. `src/engine/` remains 100% pure arithmetic (zero `crypto` or `Math.random` imports in `src/engine/`).
  2. Standard seeded runs (`livingWorld: false`) remain 100% bit-for-bit deterministic (`pnpm determinism` 8/8 green).
  3. Saved Living World runs still replay deterministically from `inputs[]` (`parseSave` hash check stays valid).

## 2. Opt-In Free AI Settings Modal (`AI-02`)

- Accessible from `Rail.svelte` via `"AI Director (Free)"` button (`data-testid="nav-ai-settings-btn"`) and from `NewGame.svelte`.
- Opens `src/ui/AiSettingsModal.svelte` inside `Overlay.svelte`:
  - **Left Column**: Explains how the Hybrid AI Director works (engine math stays grounded in `coefficients.ts`; AI generates adaptive briefings, satirical chyrons, and bounded crisis dilemmas; 100% opt-in, keys stored only in browser `localStorage`).
  - **Right Column**:
    - Provider selector (`data-testid="ai-provider-select"`):
      - `Off (Built-in Deterministic Engine)` — default, zero network egress
      - `OpenRouter Free Router (openrouter/free + :free auto-discovery)`
      - `Browser Built-In AI (window.ai / Gemini Nano — Zero Key)`
      - `Google Gemini Free Tier (gemini-2.5-flash)`
      - `Groq Free Tier (llama-3.3-70b-versatile)`
      - `Custom / Local Ollama (OpenAI-compatible)`
    - For OpenRouter:
      - `"Connect Free OpenRouter (1-Click OAuth PKCE)"` button (`data-testid="openrouter-pkce-btn"`)
      - `"Discover Live :free Models"` button (`data-testid="discover-free-models-btn"`) and model dropdown (`data-testid="ai-model-select"`) defaulting to `openrouter/free` with automatic `:free` cascade on `429`.
      - API Key input (`data-testid="ai-api-key-input"`).
    - `"Test AI Connection"` button (`data-testid="test-ai-btn"`) and `"Save AI Settings"` stamp button (`data-testid="save-ai-settings-btn"`).

## 3. Generative Briefings, Chyrons & Bounded Dynamic Crises (`AI-03`, `AI-04`)

- When AI Director is enabled, `OvalOffice.svelte` displays an `"AI DIRECTOR LIVE"` badge (`data-testid="ai-director-badge"`) and a `"Synthesize AI Situation / Crisis"` button (`data-testid="trigger-ai-crisis-btn"`), plus automatic turn-start AI briefing/chyron generation with instant offline fallback if offline or rate-limited.
- Choosing an option on an AI-generated dynamic crisis stages `Decisions.dynamicCrisisDelta` (clamped within strict `coefficients.ts` limits) so the choice genuinely alters GDP, inflation, approval, and institutional trust on the next turn report.
