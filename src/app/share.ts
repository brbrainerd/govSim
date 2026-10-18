// Native deflate-raw URL hash run encoding, decoding, and replay (REL-03, GR-33, GR-34).
import type { Decisions } from '../engine/decisions';
import { isValidScenarioId, type ScenarioId } from '../content/scenarios';
import { isValidArchetypeId, type ArchetypeId } from '../content/archetypes';
import { MAX_SAVE_SIZE_CHARS, validateDecisions } from './save';

export interface RunDescriptor {
  readonly v: 1;
  readonly seed: number;
  readonly party: 'D' | 'R';
  readonly scenario?: ScenarioId;
  readonly archetype?: ArchetypeId;
  readonly evilMode?: boolean;
  readonly unlockAll?: boolean;
  readonly livingWorld?: boolean;
  readonly classicSim?: boolean;
  readonly inputs: readonly Decisions[];
}

const MAX_RUN_CODE_LENGTH = 64_000;

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface RunSource {
  seed?: number;
  current?: { seed: number };
  options: {
    party: string;
    scenario?: ScenarioId;
    archetype?: ArchetypeId;
    evilMode?: boolean;
    unlockAll?: boolean;
    livingWorld?: boolean;
    classicSim?: boolean;
  };
  inputs: readonly Decisions[];
}

/** Compresses game run inputs into a URL-safe base64 string using deflate-raw. */
export async function encodeRunCode(run: RunSource): Promise<string> {
  const seed = run.seed ?? run.current?.seed ?? 0;
  const payload = JSON.stringify({
    v: 1,
    s: seed,
    p: run.options.party === 'R' ? 'R' : 'D',
    ...(run.options.scenario && run.options.scenario !== 'standard_2026'
      ? { sc: run.options.scenario }
      : {}),
    ...(run.options.archetype ? { ar: run.options.archetype } : {}),
    ...(run.options.evilMode ? { e: 1 } : {}),
    ...(run.options.unlockAll ? { ua: 1 } : {}),
    ...(run.options.livingWorld ? { lw: 1 } : {}),
    ...(run.options.classicSim ? { cs: 1 } : {}),
    i: run.inputs,
  });

  const cs = new CompressionStream('deflate-raw');
  const stream = new Blob([new TextEncoder().encode(payload)]).stream().pipeThrough(cs);
  const buf = await new Response(stream).arrayBuffer();
  return uint8ArrayToBase64Url(new Uint8Array(buf));
}

/** Decompresses and validates a share-your-run code. Returns null on any error or corruption. */
export async function decodeRunCode(code: string): Promise<RunDescriptor | null> {
  if (!code || typeof code !== 'string' || code.length > MAX_RUN_CODE_LENGTH) {
    return null;
  }

  try {
    const bytes = base64UrlToUint8Array(code);
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(ds);
    const text = await new Response(stream).text();
    if (text.length > MAX_SAVE_SIZE_CHARS) {
      return null;
    }
    const parsed = JSON.parse(text);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.v !== 1 ||
      typeof parsed.s !== 'number' ||
      !Number.isFinite(parsed.s) ||
      (parsed.p !== 'D' && parsed.p !== 'R') ||
      !Array.isArray(parsed.i) ||
      parsed.i.length > 32
    ) {
      return null;
    }

    const validatedInputs: Decisions[] = [];
    for (const item of parsed.i) {
      validatedInputs.push(validateDecisions(item));
    }

    return {
      v: 1,
      seed: parsed.s,
      party: parsed.p,
      ...(isValidScenarioId(parsed.sc) ? { scenario: parsed.sc } : {}),
      ...(isValidArchetypeId(parsed.ar) ? { archetype: parsed.ar } : {}),
      ...(parsed.e === 1 || parsed.e === true ? { evilMode: true } : {}),
      ...(parsed.ua === 1 || parsed.ua === true ? { unlockAll: true } : {}),
      ...(parsed.lw === 1 || parsed.lw === true ? { livingWorld: true } : {}),
      ...(parsed.cs === 1 || parsed.cs === true ? { classicSim: true } : {}),
      inputs: validatedInputs,
    };
  } catch {
    return null;
  }
}

/** Constructs a complete shareable URL with the #run= hash. */
export async function createShareUrl(run: RunSource): Promise<string> {
  const code = await encodeRunCode(run);
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#run=${code}`;
  }
  return `#run=${code}`;
}
