# Plan 29-02 Summary — Free AI Provider Stack, OpenRouter `:free` Auto-Discovery & AI Settings Modal

**Phase:** 29
**Plan:** 29-02
**Requirements:** `AI-02`
**Completed:** Yes

---

### Key Accomplishments

1. **Client-Side Free AI Provider Stack (`src/app/ai-providers.ts`)**:
   - Implemented multi-provider adapter supporting `'off'` (default), `'openrouter'`, `'window-ai'` (Chrome Built-in Gemini Nano), `'gemini'`, `'groq'`, and `'custom'` (local Ollama / OpenAI-compatible endpoints).
   - Built `discoverOpenRouterFreeModels()` querying `https://openrouter.ai/api/v1/models`, filtering for `:free` models and zero-pricing tiers, and caching results in `localStorage` with `DEFAULT_OPENROUTER_FREE_MODELS` fallback.
   - Implemented automatic 429 rate-limit cascade failover across discovered `:free` models and `openrouter/free`.
   - Added 1-click OpenRouter OAuth PKCE flow (`startOpenRouterOAuthPkce()`, `completeOpenRouterOAuthIfPresent()`) using Web Crypto SHA-256 code challenges.

2. **AI Director Settings Modal (`src/ui/AiSettingsModal.svelte`, `src/ui/Rail.svelte`, `src/screens/Game.svelte`)**:
   - Added accessible AI Settings modal opened from the left navigation rail (`data-testid="rail-ai-settings-btn"`).
   - Provides provider selector, OpenRouter `:free` model discovery refresh (`data-testid="refresh-free-models-btn"`), 1-click OAuth PKCE button, API key input, and connection test (`data-testid="test-ai-btn"`).

3. **Content Security Policy & Zero Default Egress (`index.html`, `vite.config.ts`)**:
   - Updated CSP `connect-src` to permit opt-in connections to OpenRouter, Gemini, Groq, and localhost Ollama while keeping default gameplay 100% offline (`tests/egress.spec.ts` green).
   - Verified with 6 unit tests in `src/app/ai-providers.test.ts`.
