/**
 * Free AI Provider adapter, OpenRouter :free model discovery, automatic 429 cascade failover,
 * and OAuth PKCE integration (AI-02).
 *
 * Guarantees zero network egress when provider === 'off' (default).
 */

export type AiProviderId =
  | 'off'
  | 'openrouter_free'
  | 'browser_ai'
  | 'gemini_free'
  | 'groq_free'
  | 'custom_openai';

export interface AiProviderDef {
  id: AiProviderId;
  name: string;
  tagline: string;
  freeTierNote: string;
  requiresApiKey: boolean;
  defaultModel: string;
}

export const AI_PROVIDERS: readonly AiProviderDef[] = [
  {
    id: 'off',
    name: 'Off (Zero Network Egress)',
    tagline: 'Pure simulation with zero AI API requests.',
    freeTierNote: 'Recommended default. 100% offline.',
    requiresApiKey: false,
    defaultModel: '',
  },
  {
    id: 'openrouter_free',
    name: 'OpenRouter :free Auto-Router',
    tagline: 'Dynamic free models with automatic 429 rate-limit cascade failover.',
    freeTierNote: '100% Free. Connect via 1-click OAuth or enter a free API key.',
    requiresApiKey: false,
    defaultModel: 'openrouter/free',
  },
  {
    id: 'browser_ai',
    name: 'Browser Built-in AI (window.ai)',
    tagline: 'Runs entirely on your device via Chrome built-in Gemini Nano.',
    freeTierNote: 'Zero cost, zero egress, 100% on-device.',
    requiresApiKey: false,
    defaultModel: 'gemini-nano',
  },
  {
    id: 'gemini_free',
    name: 'Google Gemini (Free Tier)',
    tagline: 'Generous free tier via Google AI Studio API key.',
    freeTierNote: 'Free tier includes Gemini 2.5 Flash.',
    requiresApiKey: true,
    defaultModel: 'gemini-2.5-flash',
  },
  {
    id: 'groq_free',
    name: 'Groq Cloud (Free Tier)',
    tagline: 'Ultra-fast LPU inference on open models with free developer key.',
    freeTierNote: 'Free tier includes Llama 3.3 70B.',
    requiresApiKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
  },
  {
    id: 'custom_openai',
    name: 'Local / Self-Hosted (Ollama / vLLM)',
    tagline: 'OpenAI-compatible local endpoint (e.g. http://localhost:11434/v1).',
    freeTierNote: 'Run local LLMs with zero cloud dependencies.',
    requiresApiKey: false,
    defaultModel: 'llama3.2',
  },
];

export const DEFAULT_OPENROUTER_FREE_MODELS: readonly string[] = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'qwen/qwen3-32b:free',
  'deepseek/deepseek-chat-v3-0324:free',
];

export interface AiConfig {
  provider: AiProviderId;
  apiKey: string;
  model: string;
  customEndpoint: string;
  freeModelFallbacks: string[];
}

export const AI_CONFIG_STORAGE_KEY = 'govsim_ai_config';

export function defaultAiConfig(): AiConfig {
  return {
    provider: 'off',
    apiKey: '',
    model: 'openrouter/free',
    customEndpoint: 'http://localhost:11434/v1',
    freeModelFallbacks: [...DEFAULT_OPENROUTER_FREE_MODELS],
  };
}

export function loadAiConfig(): AiConfig {
  try {
    if (typeof localStorage === 'undefined') return defaultAiConfig();
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (!raw) return defaultAiConfig();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultAiConfig();
    const defaults = defaultAiConfig();
    return {
      provider: AI_PROVIDERS.some((p) => p.id === parsed.provider) ? parsed.provider : defaults.provider,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : defaults.apiKey,
      model: typeof parsed.model === 'string' ? parsed.model : defaults.model,
      customEndpoint: typeof parsed.customEndpoint === 'string' ? parsed.customEndpoint : defaults.customEndpoint,
      freeModelFallbacks: Array.isArray(parsed.freeModelFallbacks) && parsed.freeModelFallbacks.every((m: unknown) => typeof m === 'string')
        ? parsed.freeModelFallbacks
        : defaults.freeModelFallbacks,
    };
  } catch {
    return defaultAiConfig();
  }
}

export function saveAiConfig(config: AiConfig): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors in private browsing
  }
}

/**
 * Discovers live :free models from OpenRouter's model catalog.
 * Filters for models whose id ends with :free or whose prompt & completion pricing is '0'.
 */
export async function discoverOpenRouterFreeModels(fetchImpl: typeof fetch = fetch): Promise<string[]> {
  try {
    const res = await fetchImpl('https://openrouter.ai/api/v1/models');
    if (!res.ok) {
      return [...DEFAULT_OPENROUTER_FREE_MODELS];
    }
    const data = (await res.json()) as {
      data?: Array<{
        id?: string;
        pricing?: { prompt?: string | number; completion?: string | number };
      }>;
    };
    if (!Array.isArray(data.data)) {
      return [...DEFAULT_OPENROUTER_FREE_MODELS];
    }
    const freeModels: string[] = ['openrouter/free'];
    for (const m of data.data) {
      if (!m.id) continue;
      const isFreeTag = m.id.endsWith(':free');
      const isZeroCost =
        (m.pricing?.prompt === '0' || m.pricing?.prompt === 0) &&
        (m.pricing?.completion === '0' || m.pricing?.completion === 0);
      if (isFreeTag || isZeroCost) {
        if (!freeModels.includes(m.id)) {
          freeModels.push(m.id);
        }
      }
    }
    return freeModels;
  } catch {
    return [...DEFAULT_OPENROUTER_FREE_MODELS];
  }
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const verifier = base64UrlEncode(randomBytes.buffer);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const challenge = base64UrlEncode(hashBuffer);
  return { verifier, challenge };
}

export async function startOpenRouterPkceAuth(
  callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'http://localhost/',
): Promise<string> {
  const { verifier, challenge } = await generatePkcePair();
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('openrouter_pkce_verifier', verifier);
  }
  const withoutHash = callbackUrl.split('#')[0] ?? callbackUrl;
  const cleanCallback = withoutHash.split('?')[0] ?? withoutHash;
  return `https://openrouter.ai/auth?callback_url=${encodeURIComponent(cleanCallback)}&code_challenge=${challenge}&code_challenge_method=S256`;
}

export async function completeOpenRouterPkceAuth(code: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const verifier = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('openrouter_pkce_verifier') : null;
  if (!verifier) throw new Error('Missing PKCE verifier in session storage');
  const res = await fetchImpl('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter key exchange failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { key?: string };
  if (!data.key) throw new Error('OpenRouter response did not contain an API key');
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('openrouter_pkce_verifier');
  }
  return data.key;
}

/**
 * Universal completion function dispatching to configured provider.
 * Guaranteed 0 network egress when config.provider === 'off'.
 */
export async function generateAiCompletion(
  systemPrompt: string,
  userPrompt: string,
  config: AiConfig = loadAiConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  if (config.provider === 'off') {
    return null;
  }

  if (config.provider === 'openrouter_free') {
    const candidateModels = [
      config.model,
      ...config.freeModelFallbacks.filter((m) => m !== config.model),
    ];

    for (const m of candidateModels) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://govsim.app',
          'X-Title': 'govSim',
        };
        if (config.apiKey.trim()) {
          headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
        }
        const res = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: m,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        // Failover on rate limit (429) or upstream error (5xx)
        if (res.status === 429 || res.status >= 500) {
          continue;
        }

        if (!res.ok) {
          continue;
        }

        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = json.choices?.[0]?.message?.content;
        if (typeof text === 'string' && text.trim().length > 0) {
          return text.trim();
        }
      } catch {
        // Continue to next model on network/fetch exception
        continue;
      }
    }
    return null;
  }

  if (config.provider === 'browser_ai') {
    try {
      const g = globalThis as unknown as {
        ai?: { languageModel?: { create: (opts?: { systemPrompt?: string }) => Promise<{ prompt: (p: string) => Promise<string> }> } };
      };
      if (g.ai?.languageModel) {
        const session = await g.ai.languageModel.create({ systemPrompt });
        const result = await session.prompt(userPrompt);
        return typeof result === 'string' ? result.trim() : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  if (config.provider === 'gemini_free') {
    try {
      const model = config.model || 'gemini-2.5-flash';
      const key = encodeURIComponent(config.apiKey.trim());
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
        }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      return typeof text === 'string' ? text.trim() : null;
    } catch {
      return null;
    }
  }

  if (config.provider === 'groq_free') {
    try {
      const model = config.model || 'llama-3.3-70b-versatile';
      const res = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content;
      return typeof text === 'string' ? text.trim() : null;
    } catch {
      return null;
    }
  }

  if (config.provider === 'custom_openai') {
    try {
      const base = config.customEndpoint.replace(/\/+$/, '');
      const url = `${base}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.apiKey.trim()) {
        headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
      }
      const res = await fetchImpl(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model || 'llama3.2',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content;
      return typeof text === 'string' ? text.trim() : null;
    } catch {
      return null;
    }
  }

  return null;
}
