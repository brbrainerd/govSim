<script lang="ts">
  import Overlay from './Overlay.svelte';
  import {
    AI_PROVIDERS,
    DEFAULT_OPENROUTER_FREE_MODELS,
    discoverOpenRouterFreeModels,
    generateAiCompletion,
    loadAiConfig,
    saveAiConfig,
    startOpenRouterPkceAuth,
    type AiConfig,
  } from '../app/ai-providers';

  import type { Session } from '../app/session.svelte';

  let {
    session,
    onClose,
  }: {
    session?: Session;
    onClose: () => void;
  } = $props();

  let config = $state<AiConfig>(loadAiConfig());
  let freeModels = $state<string[]>([...DEFAULT_OPENROUTER_FREE_MODELS]);
  let isDiscovering = $state(false);
  let isTesting = $state(false);
  let testResult = $state<{ ok: boolean; message: string } | null>(null);
  let isStartingPkce = $state(false);
  let saveSuccess = $state(false);

  const activeProvider = $derived(AI_PROVIDERS.find((p) => p.id === config.provider) ?? AI_PROVIDERS[0]!);

  async function handleDiscoverModels() {
    isDiscovering = true;
    try {
      const models = await discoverOpenRouterFreeModels();
      freeModels = models;
      if (!freeModels.includes(config.model) && freeModels.length > 0) {
        config.model = freeModels[0] ?? 'openrouter/free';
      }
      config.freeModelFallbacks = [...freeModels];
    } finally {
      isDiscovering = false;
    }
  }

  async function handlePkceAuth() {
    isStartingPkce = true;
    try {
      const url = await startOpenRouterPkceAuth();
      window.location.href = url;
    } catch (err) {
      testResult = {
        ok: false,
        message: `Failed to initiate OpenRouter PKCE: ${err instanceof Error ? err.message : String(err)}`,
      };
      isStartingPkce = false;
    }
  }

  async function handleTestConnection() {
    isTesting = true;
    testResult = null;
    try {
      if (config.provider === 'off') {
        testResult = { ok: true, message: 'Provider is off. Simulation operates in pure deterministic mode.' };
        return;
      }
      const response = await generateAiCompletion(
        'You are the satirical game director of govSim.',
        'Respond in exactly 4 words about presidential leadership.',
        config,
      );
      if (response && response.trim().length > 0) {
        testResult = { ok: true, message: `Success! Model replied: "${response.trim()}"` };
      } else {
        testResult = { ok: false, message: 'Connection failed or returned empty response. Check provider and key.' };
      }
    } catch (err) {
      testResult = { ok: false, message: `Test failed: ${err instanceof Error ? err.message : String(err)}` };
    } finally {
      isTesting = false;
    }
  }

  function handleClearKey() {
    config.apiKey = '';
    if (session) {
      session.updateAiConfig(config);
    } else {
      saveAiConfig(config);
    }
    testResult = { ok: true, message: 'Saved API key cleared from browser storage.' };
  }

  function handleSave() {
    if (session) {
      session.updateAiConfig(config);
    } else {
      saveAiConfig(config);
    }
    saveSuccess = true;
    setTimeout(() => {
      saveSuccess = false;
      onClose();
    }, 400);
  }
</script>

<Overlay title="AI Director Settings (Free &amp; Open)" {onClose}>
  <div class="ai-modal" data-testid="ai-settings-modal">
    <header class="modal-header">
      <div class="header-titles">
        <h2 class="modal-title">AI Game Director (Free &amp; Open)</h2>
        <span class="modal-subtitle">Generative Crises &amp; Satirical Chyrons · Free Auto-Routing</span>
      </div>
      <button type="button" class="close-x" onclick={onClose} aria-label="Close dialog">✕</button>
    </header>

    <div class="modal-body">
      <!-- Provider Selection -->
      <section class="config-section">
        <label for="ai-provider-select" class="section-label">AI Engine Provider</label>
        <select
          id="ai-provider-select"
          class="select-input"
          data-testid="ai-provider-select"
          bind:value={config.provider}
          onchange={() => {
            if (activeProvider && activeProvider.defaultModel) {
              config.model = activeProvider.defaultModel;
            }
            testResult = null;
          }}
        >
          {#each AI_PROVIDERS as p (p.id)}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
        <span class="helper-text">{activeProvider.tagline}</span>
        <div class="tier-badge">{activeProvider.freeTierNote}</div>
      </section>

      {#if config.provider !== 'off'}
        <!-- OpenRouter Specific Controls -->
        {#if config.provider === 'openrouter_free'}
          <section class="config-section">
            <div class="section-head-row">
              <label for="ai-model-select" class="section-label">Model Selection (:free auto-cascade)</label>
              <button
                type="button"
                class="pill-btn"
                data-testid="discover-free-models-btn"
                onclick={handleDiscoverModels}
                disabled={isDiscovering}
              >
                {isDiscovering ? 'Discovering...' : 'Discover Live :free Models'}
              </button>
            </div>
            <select
              id="ai-model-select"
              class="select-input"
              data-testid="ai-model-select"
              bind:value={config.model}
            >
              {#each freeModels as m (m)}
                <option value={m}>{m}</option>
              {/each}
            </select>
            <span class="helper-text">
              If your chosen model encounters rate limits (HTTP 429), govSim automatically cascades through the backup free models.
            </span>
          </section>

          <section class="config-section">
            <label for="ai-api-key-input" class="section-label">OpenRouter API Key (Optional for :free)</label>
            <div class="pkce-row">
              <input
                id="ai-api-key-input"
                type="password"
                class="text-input"
                data-testid="ai-api-key-input"
                bind:value={config.apiKey}
                placeholder="sk-or-v1-... (or click 1-Click OAuth)"
              />
              <button
                type="button"
                class="pill-btn oauth-btn"
                data-testid="openrouter-pkce-btn"
                onclick={handlePkceAuth}
                disabled={isStartingPkce}
              >
                {isStartingPkce ? 'Connecting...' : '1-Click OAuth'}
              </button>
            </div>
            <span class="helper-text">
              OpenRouter provides free models. OAuth connects a free key instantly with no manual copy-paste.
            </span>
          </section>
        {/if}

        <!-- Gemini Free Tier -->
        {#if config.provider === 'gemini_free'}
          <section class="config-section">
            <label for="ai-model-select" class="section-label">Gemini Model</label>
            <input
              id="ai-model-select"
              type="text"
              class="text-input"
              data-testid="ai-model-select"
              bind:value={config.model}
              placeholder="gemini-2.5-flash"
            />
          </section>
          <section class="config-section">
            <label for="ai-api-key-input" class="section-label">Google AI Studio API Key</label>
            <input
              id="ai-api-key-input"
              type="password"
              class="text-input"
              data-testid="ai-api-key-input"
              bind:value={config.apiKey}
              placeholder="AIzaSy..."
            />
            <span class="helper-text">Free tier offers 15 requests per minute with zero billing required.</span>
          </section>
        {/if}

        <!-- Groq Free Tier -->
        {#if config.provider === 'groq_free'}
          <section class="config-section">
            <label for="ai-model-select" class="section-label">Groq Model</label>
            <input
              id="ai-model-select"
              type="text"
              class="text-input"
              data-testid="ai-model-select"
              bind:value={config.model}
              placeholder="llama-3.3-70b-versatile"
            />
          </section>
          <section class="config-section">
            <label for="ai-api-key-input" class="section-label">Groq Cloud API Key</label>
            <input
              id="ai-api-key-input"
              type="password"
              class="text-input"
              data-testid="ai-api-key-input"
              bind:value={config.apiKey}
              placeholder="gsk_..."
            />
            <span class="helper-text">Free developer tier provides fast inference on open weights.</span>
          </section>
        {/if}

        <!-- Custom OpenAI / Ollama -->
        {#if config.provider === 'custom_openai'}
          <section class="config-section">
            <label for="ai-custom-endpoint-input" class="section-label">Endpoint URL</label>
            <input
              id="ai-custom-endpoint-input"
              type="text"
              class="text-input"
              data-testid="ai-custom-endpoint-input"
              bind:value={config.customEndpoint}
              placeholder="http://localhost:11434/v1"
            />
            <span class="helper-text">Local Ollama or vLLM server endpoint on localhost / 127.0.0.1 (enforced by strict CSP).</span>
          </section>
          <section class="config-section">
            <label for="ai-model-select" class="section-label">Model Name</label>
            <input
              id="ai-model-select"
              type="text"
              class="text-input"
              data-testid="ai-model-select"
              bind:value={config.model}
              placeholder="llama3.2"
            />
          </section>
          <section class="config-section">
            <label for="ai-api-key-input" class="section-label">API Key (Optional)</label>
            <input
              id="ai-api-key-input"
              type="password"
              class="text-input"
              data-testid="ai-api-key-input"
              bind:value={config.apiKey}
              placeholder="Optional local auth token"
            />
          </section>
        {/if}

        <!-- Browser AI -->
        {#if config.provider === 'browser_ai'}
          <div class="note-box">
            <b>Chrome Built-in AI</b>
            <p>
              Uses Gemini Nano running locally on your hardware. Requires Chrome 128+ with Prompt API enabled in chrome://flags.
            </p>
          </div>
        {/if}
      {/if}

      {#if testResult}
        <div class="test-feedback" class:feedback-ok={testResult.ok} class:feedback-err={!testResult.ok} role="status">
          <b>{testResult.ok ? 'Connection Verified' : 'Connection Warning'}</b>
          <span>{testResult.message}</span>
        </div>
      {/if}
    </div>

    <footer class="modal-footer">
      <button
        type="button"
        class="secondary-btn"
        data-testid="test-ai-btn"
        onclick={handleTestConnection}
        disabled={isTesting}
      >
        {isTesting ? 'Testing...' : 'Test Connection'}
      </button>
      {#if config.apiKey}
        <button
          type="button"
          class="secondary-btn"
          data-testid="clear-ai-key-btn"
          onclick={handleClearKey}
        >
          Clear Saved Key
        </button>
      {/if}
      <div class="footer-spacer"></div>
      <button
        type="button"
        class="stamp"
        data-testid="save-ai-settings-btn"
        onclick={handleSave}
      >
        {saveSuccess ? 'Saved!' : 'Save AI Settings'}
      </button>
    </footer>
  </div>
</Overlay>

<style>
  .ai-modal {
    display: flex;
    flex-direction: column;
    width: min(720px, 92vw);
    max-height: 85vh;
    background: var(--paper);
    border: var(--rule) solid var(--ink);
    border-radius: 4px;
    box-shadow: 6px 6px 0 var(--ink);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: clamp(14px, 1.8vh, 18px) clamp(16px, 2vw, 22px);
    border-bottom: var(--rule) solid var(--ink);
    background: var(--card);
  }

  .modal-title {
    font: 700 clamp(18px, 1.4vw, 22px)/1.2 var(--font-display);
    color: var(--ink);
    margin: 0;
  }

  .modal-subtitle {
    display: block;
    font: 500 12px/1.3 var(--font-ui);
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 2px;
  }

  .close-x {
    background: none;
    border: 1px solid var(--ink-tint);
    border-radius: 4px;
    font: 700 16px/1 var(--font-ui);
    color: var(--ink);
    padding: 6px 10px;
    cursor: pointer;
  }

  .close-x:hover {
    background: var(--ink);
    color: var(--paper);
  }

  .modal-body {
    padding: clamp(14px, 1.8vh, 20px) clamp(16px, 2vw, 22px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-head-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .section-label {
    font: 700 13px/1.2 var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink);
  }

  .select-input,
  .text-input {
    width: 100%;
    padding: 8px 12px;
    border: var(--rule) solid var(--ink);
    background: var(--card);
    font: 500 14px/1.3 var(--font-body);
    color: var(--ink);
    border-radius: 3px;
    box-sizing: border-box;
  }

  .select-input:focus,
  .text-input:focus {
    outline: 2px solid var(--gold);
  }

  .pkce-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .pkce-row input {
    flex: 1;
  }

  .helper-text {
    font: 500 12px/1.3 var(--font-body);
    color: var(--ink-soft);
  }

  .tier-badge {
    align-self: flex-start;
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--gold);
    color: var(--ink);
    border: 1px solid var(--ink);
    padding: 3px 8px;
    border-radius: 3px;
    margin-top: 2px;
  }

  .pill-btn {
    background: var(--card);
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    font: 600 11px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 6px 10px;
    color: var(--ink);
    cursor: pointer;
    white-space: nowrap;
  }

  .pill-btn:hover {
    background: var(--gold);
  }

  .oauth-btn {
    background: var(--ink);
    color: var(--paper);
    padding: 8px 12px;
  }

  .oauth-btn:hover {
    background: var(--ink-soft);
  }

  .note-box {
    background: var(--card);
    border: 1px dashed var(--ink-soft);
    padding: 10px 14px;
    border-radius: 4px;
    font: 500 13px/1.4 var(--font-body);
    color: var(--ink);
  }

  .note-box b {
    display: block;
    margin-bottom: 2px;
  }

  .note-box p {
    margin: 0;
    color: var(--ink-soft);
  }

  .test-feedback {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 14px;
    border-radius: 4px;
    font: 500 13px/1.3 var(--font-body);
  }

  .feedback-ok {
    background: var(--card);
    border: var(--rule) solid var(--ink);
    color: var(--ink);
  }

  .feedback-err {
    background: var(--alert-tint);
    border: var(--rule) solid var(--alert);
    color: var(--ink);
  }

  .modal-footer {
    display: flex;
    align-items: center;
    padding: clamp(12px, 1.5vh, 16px) clamp(16px, 2vw, 22px);
    border-top: var(--rule) solid var(--ink);
    background: var(--card);
  }

  .secondary-btn {
    background: none;
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    font: 600 12px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 8px 14px;
    color: var(--ink);
    cursor: pointer;
  }

  .secondary-btn:hover {
    background: var(--paper);
  }

  .footer-spacer {
    flex: 1;
  }

  .stamp {
    background: var(--ink);
    color: var(--paper);
    border: var(--rule) solid var(--ink);
    font: 700 13px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 10px 18px;
    border-radius: 3px;
    cursor: pointer;
  }

  .stamp:hover {
    background: var(--ink-soft);
  }
</style>
