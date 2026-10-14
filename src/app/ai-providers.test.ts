import { describe, expect, it, vi } from 'vitest';
import {
  discoverOpenRouterFreeModels,
  generateAiCompletion,
  generatePkcePair,
  startOpenRouterPkceAuth,
  completeOpenRouterPkceAuth,
  type AiConfig,
} from './ai-providers';

describe('Free AI Providers & OpenRouter Integration (AI-02)', () => {
  it('generateAiCompletion makes zero network requests when provider is off', async () => {
    const fetchMock = vi.fn();
    const config: AiConfig = {
      provider: 'off',
      apiKey: '',
      model: 'openrouter/free',
      customEndpoint: '',
      freeModelFallbacks: [],
    };

    const res = await generateAiCompletion('sys', 'user', config, fetchMock as unknown as typeof fetch);
    expect(res).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('discoverOpenRouterFreeModels filters :free and 0-cost pricing models from OpenRouter catalog', async () => {
    const mockCatalog = {
      data: [
        { id: 'openai/gpt-4o', pricing: { prompt: '0.005', completion: '0.015' } },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', pricing: { prompt: '0', completion: '0' } },
        { id: 'google/gemma-2-9b-it:free', pricing: { prompt: 0, completion: 0 } },
        { id: 'anthropic/claude-3.5-sonnet', pricing: { prompt: '0.003', completion: '0.015' } },
        { id: 'qwen/qwen-2.5-72b-instruct:free', pricing: { prompt: '0', completion: '0' } },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCatalog,
    });

    const models = await discoverOpenRouterFreeModels(fetchMock as unknown as typeof fetch);
    expect(fetchMock).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
    expect(models).toContain('openrouter/free');
    expect(models).toContain('meta-llama/llama-3.3-70b-instruct:free');
    expect(models).toContain('google/gemma-2-9b-it:free');
    expect(models).toContain('qwen/qwen-2.5-72b-instruct:free');
    expect(models).not.toContain('openai/gpt-4o');
    expect(models).not.toContain('anthropic/claude-3.5-sonnet');
  });

  it('generateAiCompletion cascades to fallback model on 429 rate limit', async () => {
    const fetchMock = vi
      .fn()
      // First attempt with primary model hits 429 rate limit
      .mockResolvedValueOnce({
        status: 429,
        ok: false,
        text: async () => 'Rate limit exceeded',
      })
      // Second attempt with fallback model succeeds
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Fallback model response.' } }],
        }),
      });

    const config: AiConfig = {
      provider: 'openrouter_free',
      apiKey: 'sk-test',
      model: 'primary/model:free',
      customEndpoint: '',
      freeModelFallbacks: ['primary/model:free', 'secondary/model:free'],
    };

    const res = await generateAiCompletion('sys', 'user', config, fetchMock as unknown as typeof fetch);
    expect(res).toBe('Fallback model response.');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstCallBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(firstCallBody.model).toBe('primary/model:free');

    const secondCallBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(secondCallBody.model).toBe('secondary/model:free');
  });

  it('generatePkcePair generates high-entropy verifier and sha256 challenge', async () => {
    const { verifier, challenge } = await generatePkcePair();
    expect(verifier.length).toBeGreaterThan(30);
    expect(challenge.length).toBeGreaterThan(30);
    expect(verifier).not.toBe(challenge);
  });

  it('startOpenRouterPkceAuth stores verifier and produces valid auth url', async () => {
    const mockStorage: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      setItem: (k: string, v: string) => {
        mockStorage[k] = v;
      },
      getItem: (k: string) => mockStorage[k] ?? null,
      removeItem: (k: string) => {
        delete mockStorage[k];
      },
    });

    const url = await startOpenRouterPkceAuth('https://govsim.app/play');
    expect(url).toContain('https://openrouter.ai/auth?callback_url=');
    expect(url).toContain('code_challenge=');
    expect(mockStorage['openrouter_pkce_verifier']).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it('completeOpenRouterPkceAuth exchanges authorization code for API key', async () => {
    const mockStorage: Record<string, string> = {
      openrouter_pkce_verifier: 'test_verifier_string',
    };
    vi.stubGlobal('sessionStorage', {
      setItem: (k: string, v: string) => {
        mockStorage[k] = v;
      },
      getItem: (k: string) => mockStorage[k] ?? null,
      removeItem: (k: string) => {
        delete mockStorage[k];
      },
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ key: 'sk-or-v1-mock-api-key' }),
    });

    const key = await completeOpenRouterPkceAuth('auth_code_123', fetchMock as unknown as typeof fetch);
    expect(key).toBe('sk-or-v1-mock-api-key');
    expect(fetchMock).toHaveBeenCalledWith('https://openrouter.ai/api/v1/auth/keys', expect.any(Object));
    expect(mockStorage['openrouter_pkce_verifier']).toBeUndefined();

    vi.unstubAllGlobals();
  });
});
