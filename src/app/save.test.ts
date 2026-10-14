import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fromData, us } from '../data/us';
import { endTurn, newGame, type Decisions } from '../engine/game';
import { stableHash } from '../engine/hash';
import {
  clearAutosave,
  loadAutosave,
  MAX_SAVE_SIZE_CHARS,
  parseSave,
  replaySave,
  serializeSave,
  storeAutosave,
  validateDecisions,
  type SaveFile,
} from './save';

describe('save system and trust boundary (OBS-01, OBS-02, GR-31, GR-34)', () => {
  const start = fromData(us);
  const seed = 42;

  // Polyfill/mock localStorage for node testing environment
  const mockStorage = new Map<string, string>();
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    mockStorage.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => mockStorage.get(k) ?? null,
        setItem: (k: string, v: string) => mockStorage.set(k, String(v)),
        removeItem: (k: string) => mockStorage.delete(k),
        clear: () => mockStorage.clear(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('validates individual decisions', () => {
    expect(validateDecisions({})).toEqual({});
    expect(
      validateDecisions({
        bill: {
          budget: { bus: 25 },
          deals: ['mod'],
        },
      }),
    ).toEqual({
      bill: {
        budget: { bus: 25 },
        deals: ['mod'],
      },
    });

    expect(() => validateDecisions({ unknownProp: 123 })).toThrow('Unknown decision property');
    expect(() => validateDecisions({ bill: { unknownProp: 123 } })).toThrow('Unknown bill property');
    expect(() => validateDecisions({ bill: { budget: { unknown_lever: 10 }, deals: [] } })).toThrow(
      'Unknown budget lever',
    );
    expect(() => validateDecisions({ bill: { budget: { bus: 9999 }, deals: [] } })).toThrow('out of range');
    expect(() => validateDecisions({ bill: { budget: {}, deals: ['fake_deal'] } })).toThrow('Unknown deal ID');
    expect(() => validateDecisions({ bill: { budget: {}, deals: ['mod', 'mod'] } })).toThrow('Duplicate deal ID');
    expect(() => validateDecisions({ powers: { viewMyth: 'nonexistent_myth' } })).toThrow(
      'Unknown myth or explainer ID',
    );
    expect(() => validateDecisions({ powers: { viewMyth: 'explainer:fake' } })).toThrow(
      'Unknown myth or explainer ID',
    );
    expect(validateDecisions({ powers: { viewMyth: 'explainer:economy' } })).toEqual({
      powers: { viewMyth: 'explainer:economy' },
    });
  });

  it('serializes and parses a game roundtrip with foreignPolicy, trade, evil, and explainer decisions', () => {
    let state = newGame(seed, start);
    const inputs: Decisions[] = [
      {
        bill: { budget: { bus: 23 }, deals: [] },
        foreignPolicy: {
          defensePosture: 'surge',
          foreignAssistance: 120,
          activeSanctions: ['asset_freeze'],
        },
        trade: {
          sectorTariffs: ['chips'],
          agreements: ['indoPacific'],
        },
        powers: {
          viewMyth: 'explainer:economy',
        },
      },
      {
        evil: {
          enactedLevers: ['crony_contracts'],
        },
      },
      { bill: { budget: { bus: 23, rds: 120 }, deals: ['mod'] } },
    ];
    for (const input of inputs) {
      state = endTurn(state, input);
    }

    const sessionLike = {
      current: state,
      options: { party: 'D' as const, evilMode: true, scenario: 'stagflation_shock' as const },
      inputs,
    };

    const json = serializeSave(sessionLike);
    const parsed = parseSave(json);

    expect(parsed.format).toBe('govsim');
    expect(parsed.v).toBe(1);
    expect(parsed.engine).toBe('0.2');
    expect(parsed.seed).toBe(seed);
    expect(parsed.options.evilMode).toBe(true);
    expect(parsed.options.scenario).toBe('stagflation_shock');
    expect(parsed.inputs.length).toBe(3);
    expect(parsed.check).toBe(stableHash(state));

    const replayed = replaySave(parsed);
    expect(stableHash(replayed)).toBe(stableHash(state));
  });

  it('rejects oversized save payloads (>1MB)', () => {
    const huge = ' '.repeat(MAX_SAVE_SIZE_CHARS + 1);
    expect(() => parseSave(huge)).toThrow('exceeds maximum allowed size');
  });

  it('rejects invalid JSON syntax', () => {
    expect(() => parseSave('{ not valid json')).toThrow('Invalid JSON syntax');
  });

  it('rejects tampered or mismatched hash', () => {
    const state = newGame(seed, start);
    const save: SaveFile = {
      format: 'govsim',
      v: 1,
      engine: '0.2',
      seed,
      start,
      options: { party: 'R' },
      inputs: [],
      check: 'deadbeef000000',
    };
    expect(() => parseSave(JSON.stringify(save))).toThrow('Save verification failed: hash mismatch');
  });

  it('rejects tampered start data', () => {
    const state = newGame(seed, start);
    const hash = stableHash(state);
    const save = {
      format: 'govsim',
      v: 1,
      engine: '0.2',
      seed,
      start: { ...start, gdp: -50 }, // negative GDP
      options: { party: 'D' },
      inputs: [],
      check: hash,
    };
    expect(() => parseSave(JSON.stringify(save))).toThrow();
  });

  it('rejects invalid options or party', () => {
    const state = newGame(seed, start);
    const hash = stableHash(state);
    const save = {
      format: 'govsim',
      v: 1,
      engine: '0.2',
      seed,
      start,
      options: { party: 'Independent' },
      inputs: [],
      check: hash,
    };
    expect(() => parseSave(JSON.stringify(save))).toThrow('Invalid party option');
  });

  it('stores and loads autosave via localStorage', () => {
    const storage = {
      getItem: (k: string) => mockStorage.get(k) ?? null,
      setItem: (k: string, v: string) => mockStorage.set(k, String(v)),
      removeItem: (k: string) => mockStorage.delete(k),
    };

    const state = newGame(seed, start);
    const sessionLike = {
      current: state,
      options: { party: 'D' as const },
      inputs: [],
    };

    storeAutosave(sessionLike, storage);
    const loaded = loadAutosave(storage);
    expect(loaded).not.toBeNull();
    expect(loaded?.seed).toBe(seed);
    expect(loaded?.check).toBe(stableHash(state));

    clearAutosave(storage);
    expect(loadAutosave(storage)).toBeNull();
  });

  it('validates v: 1 frozen compatibility fixture (GR-33)', () => {
    let state = newGame(seed, start);
    const inputs: Decisions[] = [
      { bill: { budget: { bus: 23 }, deals: [] } },
      {},
      { bill: { budget: { bus: 23, rds: 120 }, deals: ['mod'] } },
    ];
    for (const input of inputs) {
      state = endTurn(state, input);
    }
    const sessionLike = {
      current: state,
      options: { party: 'D' as const },
      inputs,
    };
    const json = serializeSave(sessionLike);
    const fixturePath = 'tests/fixtures/v1-save.json';
    if (!existsSync(fixturePath)) {
      writeFileSync(fixturePath, json, 'utf8');
    }
    const fixtureContent = readFileSync(fixturePath, 'utf8');
    const parsed = parseSave(fixtureContent);
    expect(parsed.format).toBe('govsim');
    expect(parsed.v).toBe(1);
    expect(parsed.engine).toBe('0.2');
    const replayed = replaySave(parsed);
    expect(stableHash(replayed)).toBe(parsed.check);
  });
});
