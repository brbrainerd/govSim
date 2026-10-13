import { describe, expect, it } from 'vitest';
import type { Decisions } from '../engine/decisions';
import { createShareUrl, decodeRunCode, encodeRunCode } from './share';

describe('share-your-run code compression & replay (REL-03, GR-33, GR-34)', () => {
  const sampleRun = {
    seed: 98765,
    options: { party: 'D' },
    inputs: [
      { bill: { budget: { bus: 25 }, deals: ['mod'] } } as Decisions,
      {} as Decisions,
      { bill: { budget: { rds: 110, bus: 25 }, deals: ['mod', 'cen'] } } as Decisions,
    ],
  };

  it('round-trips game run through deflate-raw compression and base64url decoding', async () => {
    const code = await encodeRunCode(sampleRun);
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(10);
    // Base64URL characters only (alphanumeric, -, _)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);

    const decoded = await decodeRunCode(code);
    expect(decoded).not.toBeNull();
    expect(decoded?.v).toBe(1);
    expect(decoded?.seed).toBe(sampleRun.seed);
    expect(decoded?.party).toBe('D');
    expect(decoded?.inputs).toEqual(sampleRun.inputs);
  });

  it('creates share URL with #run= hash', async () => {
    const url = await createShareUrl(sampleRun);
    expect(url).toContain('#run=');
  });

  it('returns null on invalid or tampered run codes', async () => {
    expect(await decodeRunCode('')).toBeNull();
    expect(await decodeRunCode('not-valid-base64!@#$%^')).toBeNull();
    expect(await decodeRunCode('YWJjZGVmZw')).toBeNull(); // valid base64, but not deflate data
  });

  it('returns null on oversized input strings (> 64KB)', async () => {
    const huge = 'A'.repeat(70_000);
    expect(await decodeRunCode(huge)).toBeNull();
  });

  it('returns null when payload contains invalid decisions', async () => {
    // Manually craft payload with unknown lever
    const badPayload = JSON.stringify({
      v: 1,
      s: 42,
      p: 'D',
      i: [{ bill: { budget: { hack_money: 9999 }, deals: [] } }],
    });
    const cs = new CompressionStream('deflate-raw');
    const stream = new Blob([new TextEncoder().encode(badPayload)]).stream().pipeThrough(cs);
    const buf = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    const badCode = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const result = await decodeRunCode(badCode);
    expect(result).toBeNull();
  });
});
