// Save file serialization, parsing, trust boundary validation, and replay (OBS-01, OBS-02, GR-31, GR-34).
import { spendLevers, taxLevers, type BudgetDraft } from '../engine/budget';
import { deals as DEALS, FILIBUSTER_RULES_CATALOG, type DealId, type FilibusterRule } from '../engine/congress';
import { AMENDMENTS_CATALOG, type AmendmentId } from '../engine/amendments';
import { REFORMS_CATALOG, type ReformId } from '../engine/reforms';
import type { PowerDecisions } from '../engine/powers';
import type { CrisisDecision, Decisions } from '../engine/decisions';
import { endTurn, newGame, type GameState, type Start } from '../engine/game';
import { stableHash } from '../engine/hash';
import { getSocialLever, type SocialDraft } from '../engine/social';
import type { GameOptions } from './session.svelte';

export const MAX_SAVE_SIZE_CHARS = 1_000_000;
export const AUTOSAVE_STORAGE_KEY = 'govsim_autosave';

export interface SaveFile {
  format: 'govsim';
  v: 1;
  engine: '0.2';
  seed: number;
  start: Start;
  options: GameOptions;
  inputs: Decisions[];
  check: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

const START_FIELDS: (keyof Start)[] = [
  'gdp',
  'potential',
  'unemployment',
  'empPop',
  'inflation',
  'fedRate',
  'medianIncome',
  'gini',
  'lifeExp',
  'debtPct',
  'deficitPct',
  'tariff',
  'trust',
  'crime',
];

const KNOWN_LEVERS = new Map([...taxLevers, ...spendLevers].map((l) => [l.id, l]));
const KNOWN_DEAL_IDS = new Set(DEALS.map((d) => d.id));

const VALID_DECISION_KEYS = new Set([
  'bill',
  'crisis',
  'powers',
  'social',
  'filibusterRule',
  'reform',
  'amendmentProposal',
  'amendmentCampaign',
  'presidentialSide',
]);

/**
 * Validates a single Decisions input record.
 * Throws an Error with a descriptive explanation if any field is invalid, unknown, or out of range.
 */
export function validateDecisions(d: unknown): Decisions {
  if (!isRecord(d)) throw new Error('Decision must be a plain object');

  const keys = Object.keys(d);
  for (const k of keys) {
    if (!VALID_DECISION_KEYS.has(k)) throw new Error(`Unknown decision property: "${k}"`);
  }

  const result: Decisions = {};

  if (d.bill !== undefined) {
    const b = d.bill;
    if (!isRecord(b)) throw new Error('Bill must be a plain object');

    const billKeys = Object.keys(b);
    for (const k of billKeys) {
      if (k !== 'budget' && k !== 'deals' && k !== 'social') throw new Error(`Unknown bill property: "${k}"`);
    }

    if (!isRecord(b.budget)) throw new Error('Bill budget must be a plain object');
    const budget: BudgetDraft = {};
    for (const [leverId, val] of Object.entries(b.budget)) {
      const lever = KNOWN_LEVERS.get(leverId);
      if (!lever) throw new Error(`Unknown budget lever: "${leverId}"`);
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        throw new Error(`Budget lever "${leverId}" must be a finite number`);
      }
      if (val < lever.min || val > lever.max) {
        throw new Error(`Budget lever "${leverId}" value ${val} out of range [${lever.min}, ${lever.max}]`);
      }
      budget[leverId] = val;
    }

    let social: SocialDraft | undefined;
    if (b.social !== undefined) {
      if (!isRecord(b.social)) throw new Error('Bill social must be a plain object');
      social = {};
      for (const [leverId, val] of Object.entries(b.social)) {
        const lever = getSocialLever(leverId);
        if (!lever) throw new Error(`Unknown social lever: "${leverId}"`);
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          throw new Error(`Social lever "${leverId}" must be a finite number`);
        }
        if (val < lever.min || val > lever.max) {
          throw new Error(`Social lever "${leverId}" value ${val} out of range [${lever.min}, ${lever.max}]`);
        }
        social[leverId] = val;
      }
    }

    if (!Array.isArray(b.deals)) throw new Error('Bill deals must be an array');
    const deals: DealId[] = [];
    const seenDeals = new Set<string>();
    for (const dealId of b.deals) {
      if (typeof dealId !== 'string' || !KNOWN_DEAL_IDS.has(dealId as DealId)) {
        throw new Error(`Unknown deal ID: "${String(dealId)}"`);
      }
      if (seenDeals.has(dealId)) {
        throw new Error(`Duplicate deal ID: "${dealId}"`);
      }
      seenDeals.add(dealId);
      deals.push(dealId as DealId);
    }

    result.bill = { budget, deals, ...(social !== undefined ? { social } : {}) };
  }

  if (d.crisis !== undefined) {
    if (!isRecord(d.crisis)) throw new Error('Crisis decision must be a plain object');
    if (typeof d.crisis.crisisId !== 'string' || typeof d.crisis.optionId !== 'string') {
      throw new Error('Crisis decision must contain crisisId and optionId');
    }
    result.crisis = { crisisId: d.crisis.crisisId, optionId: d.crisis.optionId };
  }

  if (d.powers !== undefined) {
    if (!isRecord(d.powers)) throw new Error('Powers decision must be a plain object');
    const powers: PowerDecisions = {
      ...(Array.isArray(d.powers.signOrders) ? { signOrders: d.powers.signOrders.map(String) } : {}),
      ...(Array.isArray(d.powers.revokeOrders) ? { revokeOrders: d.powers.revokeOrders.map(String) } : {}),
      ...(typeof d.powers.pressureFed === 'boolean' ? { pressureFed: d.powers.pressureFed } : {}),
      ...(typeof d.powers.viewMyth === 'string' ? { viewMyth: d.powers.viewMyth } : {}),
      ...(isRecord(d.powers.speech) && typeof d.powers.speech.audience === 'string'
        ? { speech: { audience: d.powers.speech.audience as 'general' | 'congress' | 'business' } }
        : {}),
    };
    result.powers = powers;
  }

  if (d.social !== undefined) {
    if (!isRecord(d.social)) throw new Error('Social decision must be a plain object');
    const social: SocialDraft = {};
    for (const [leverId, val] of Object.entries(d.social)) {
      const lever = getSocialLever(leverId);
      if (!lever) throw new Error(`Unknown social lever: "${leverId}"`);
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        throw new Error(`Social lever "${leverId}" must be a finite number`);
      }
      if (val < lever.min || val > lever.max) {
        throw new Error(`Social lever "${leverId}" value ${val} out of range [${lever.min}, ${lever.max}]`);
      }
      social[leverId] = val;
    }
    result.social = social;
  }

  if (d.filibusterRule !== undefined) {
    if (typeof d.filibusterRule !== 'string' || !Object.hasOwn(FILIBUSTER_RULES_CATALOG, d.filibusterRule)) {
      throw new Error(`Unknown filibuster rule: "${String(d.filibusterRule)}"`);
    }
    result.filibusterRule = d.filibusterRule as FilibusterRule;
  }

  if (d.reform !== undefined) {
    if (typeof d.reform !== 'string' || !Object.hasOwn(REFORMS_CATALOG, d.reform)) {
      throw new Error(`Unknown reform: "${String(d.reform)}"`);
    }
    result.reform = d.reform as ReformId;
  }

  if (d.amendmentProposal !== undefined) {
    if (typeof d.amendmentProposal !== 'string' || !Object.hasOwn(AMENDMENTS_CATALOG, d.amendmentProposal)) {
      throw new Error(`Unknown amendment proposal: "${String(d.amendmentProposal)}"`);
    }
    result.amendmentProposal = d.amendmentProposal as AmendmentId;
  }

  if (d.amendmentCampaign !== undefined) {
    if (typeof d.amendmentCampaign !== 'boolean') {
      throw new Error('amendmentCampaign must be a boolean');
    }
    result.amendmentCampaign = d.amendmentCampaign;
  }

  if (d.presidentialSide !== undefined) {
    if (d.presidentialSide !== 'D' && d.presidentialSide !== 'R') {
      throw new Error(`Invalid presidential side: "${String(d.presidentialSide)}"`);
    }
    result.presidentialSide = d.presidentialSide;
  }

  return result;
}

/** Replays the input log from the initial start data and returns the final GameState. */
export function replaySave(save: Pick<SaveFile, 'seed' | 'start' | 'inputs'>): GameState {
  let state = newGame(save.seed, save.start);
  for (const input of save.inputs) {
    state = endTurn(state, input);
  }
  return state;
}

/**
 * Strict parser & trust boundary validator (GR-34).
 * Rejects oversized, invalid JSON, corrupted values, unknown properties, or hash mismatches.
 */
export function parseSave(json: string): SaveFile {
  if (typeof json !== 'string') {
    throw new Error('Save content must be a string');
  }
  if (json.length > MAX_SAVE_SIZE_CHARS) {
    throw new Error(`Save file exceeds maximum allowed size (${MAX_SAVE_SIZE_CHARS} bytes)`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`Invalid JSON syntax in save file: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!isRecord(parsed)) {
    throw new Error('Save file root must be a JSON object');
  }

  if (parsed.format !== 'govsim') {
    throw new Error(`Invalid save format "${String(parsed.format)}", expected "govsim"`);
  }
  if (parsed.v !== 1) {
    throw new Error(`Unsupported save version ${String(parsed.v)}, expected 1`);
  }
  if (parsed.engine !== '0.2') {
    throw new Error(`Incompatible engine version "${String(parsed.engine)}", expected "0.2"`);
  }

  if (typeof parsed.seed !== 'number' || !Number.isSafeInteger(parsed.seed)) {
    throw new Error('Save seed must be a safe integer');
  }

  if (!isRecord(parsed.start)) {
    throw new Error('Save start data must be a plain object');
  }
  for (const field of START_FIELDS) {
    const val = parsed.start[field];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Invalid or missing start field "${field}"`);
    }
  }
  const start = parsed.start as unknown as Start;

  if (!isRecord(parsed.options)) {
    throw new Error('Save options must be a plain object');
  }
  if (parsed.options.party !== 'D' && parsed.options.party !== 'R') {
    throw new Error(`Invalid party option "${String(parsed.options.party)}", expected "D" or "R"`);
  }
  const options: GameOptions = { party: parsed.options.party };

  if (!Array.isArray(parsed.inputs)) {
    throw new Error('Save inputs must be an array');
  }
  if (parsed.inputs.length > 32) {
    throw new Error(`Too many turns in save inputs (${parsed.inputs.length} > 32)`);
  }

  const inputs: Decisions[] = [];
  for (let i = 0; i < parsed.inputs.length; i++) {
    try {
      inputs.push(validateDecisions(parsed.inputs[i]));
    } catch (err) {
      throw new Error(`Invalid decision at turn ${i + 1}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (typeof parsed.check !== 'string' || !/^[0-9a-f]{14}$/.test(parsed.check)) {
    throw new Error('Save check hash must be a 14-character hexadecimal string');
  }

  const endState = replaySave({ seed: parsed.seed, start, inputs });
  const actualCheck = stableHash(endState);
  if (actualCheck !== parsed.check) {
    throw new Error(`Save verification failed: hash mismatch (expected ${parsed.check}, replayed ${actualCheck})`);
  }

  return {
    format: 'govsim',
    v: 1,
    engine: '0.2',
    seed: parsed.seed,
    start,
    options,
    inputs,
    check: parsed.check,
  };
}

export interface SessionLike {
  current: GameState;
  options: GameOptions;
  inputs: readonly Decisions[];
}

export interface SimpleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function resolveStorage(custom?: SimpleStorage): SimpleStorage | null {
  if (custom) return custom;
  try {
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
      return localStorage;
    }
  } catch {}
  return null;
}

/** Serializes a live Session into a verified SaveFile JSON string. */
export function serializeSave(session: SessionLike): string {
  const save: SaveFile = {
    format: 'govsim',
    v: 1,
    engine: '0.2',
    seed: session.current.seed,
    start: session.current.start,
    options: session.options,
    inputs: [...session.inputs],
    check: stableHash(session.current),
  };
  return JSON.stringify(save, null, 2);
}

/** Saves the session to browser localStorage and requests persistence if supported. */
export function storeAutosave(session: SessionLike, storage?: SimpleStorage): void {
  try {
    const s = resolveStorage(storage);
    if (!s) return;
    const json = serializeSave(session);
    s.setItem(AUTOSAVE_STORAGE_KEY, json);
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }
  } catch {
    // Gracefully handle storage quota or private-browsing restrictions
  }
}

/** Loads and validates the autosave from localStorage. Returns null if none or corrupted. */
export function loadAutosave(storage?: SimpleStorage): SaveFile | null {
  try {
    const s = resolveStorage(storage);
    if (!s) return null;
    const raw = s.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return null;
    return parseSave(raw);
  } catch {
    return null;
  }
}

/** Clears the autosave key from localStorage. */
export function clearAutosave(storage?: SimpleStorage): void {
  try {
    const s = resolveStorage(storage);
    if (s) {
      s.removeItem(AUTOSAVE_STORAGE_KEY);
    }
  } catch {}
}

/** Triggers a browser download of the current session save file. */
export function downloadSave(session: SessionLike): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const json = serializeSave(session);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `govsim-save-turn${session.current.turn}-${session.current.seed}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
