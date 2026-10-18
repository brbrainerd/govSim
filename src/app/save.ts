// Save file serialization, parsing, trust boundary validation, and replay (OBS-01, OBS-02, GR-31, GR-34).
import { spendLevers, taxLevers, type BudgetDraft } from '../engine/budget';
import { C } from '../engine/coefficients';
import { deals as DEALS, FILIBUSTER_RULES_CATALOG, type DealId, type FilibusterRule } from '../engine/congress';
import { AMENDMENTS_CATALOG, type AmendmentId } from '../engine/amendments';
import { REFORMS_CATALOG, type ReformId } from '../engine/reforms';
import type { PowerDecisions } from '../engine/powers';
import type { CrisisDecision, Decisions, DynamicCrisisDelta, EvilDecision } from '../engine/decisions';
import { SANCTIONS_CATALOG, type DefensePosture, type ForeignPolicyDraft, type SanctionType } from '../engine/foreign';
import {
  SECTOR_TARIFFS_CATALOG,
  TRADE_AGREEMENTS_CATALOG,
  type SectorTariffId,
  type TradeAgreementId,
  type TradeDraft,
} from '../engine/trade';
import { isEvilLeverId } from '../data/evil';
import type { EvilLeverId } from '../engine/units';
import { getMyth } from '../content/myths';
import { getExplainer } from '../content/explainers';
import { endTurn, newGame, type GameState, type Start } from '../engine/game';
import { stableHash } from '../engine/hash';
import { getSocialLever, type SocialDraft } from '../engine/social';
import { isValidScenarioId } from '../content/scenarios';
import type { GameOptions } from './session.svelte';

export const MAX_SAVE_SIZE_CHARS = 1_000_000;
export const AUTOSAVE_STORAGE_KEY = 'govsim_autosave';
export const ACTIVE_PROFILE_STORAGE_KEY = 'govsim_active_profile';
export const PROFILES_STORAGE_KEY = 'govsim_profiles';

export interface BrowserProfile {
  id: string;
  name: string;
  updatedAt: number;
}


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
const KNOWN_SANCTION_IDS = new Set<SanctionType>(SANCTIONS_CATALOG.map((s) => s.id));
const KNOWN_SECTOR_TARIFF_IDS = new Set<SectorTariffId>(SECTOR_TARIFFS_CATALOG.map((s) => s.id));
const KNOWN_TRADE_AGREEMENT_IDS = new Set<TradeAgreementId>(TRADE_AGREEMENTS_CATALOG.map((a) => a.id));

const VALID_DECISION_KEYS = new Set([
  'bill',
  'crisis',
  'geopoliticalCrisis',
  'powers',
  'social',
  'foreignPolicy',
  'trade',
  'filibusterRule',
  'reform',
  'amendmentProposal',
  'amendmentCampaign',
  'presidentialSide',
  'evil',
  'turnEntropy',
  'dynamicCrisisDelta',
]);

function isValidMythOrExplainerId(id: string): boolean {
  if (getMyth(id) !== undefined) return true;
  if (id.startsWith('explainer:')) {
    return getExplainer(id.slice('explainer:'.length)) !== undefined;
  }
  return false;
}

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

  if (d.geopoliticalCrisis !== undefined) {
    if (!isRecord(d.geopoliticalCrisis)) throw new Error('Geopolitical crisis decision must be a plain object');
    if (
      typeof d.geopoliticalCrisis.crisisId !== 'string' ||
      typeof d.geopoliticalCrisis.optionId !== 'string'
    ) {
      throw new Error('Geopolitical crisis decision must contain crisisId and optionId');
    }
    result.geopoliticalCrisis = {
      crisisId: d.geopoliticalCrisis.crisisId,
      optionId: d.geopoliticalCrisis.optionId,
    };
  }

  if (d.powers !== undefined) {
    if (!isRecord(d.powers)) throw new Error('Powers decision must be a plain object');
    if (typeof d.powers.viewMyth === 'string' && !isValidMythOrExplainerId(d.powers.viewMyth)) {
      throw new Error(`Unknown myth or explainer ID: "${d.powers.viewMyth}"`);
    }
    if (typeof d.powers.spinMyth === 'string' && getMyth(d.powers.spinMyth) === undefined) {
      throw new Error(`Unknown myth ID for spin: "${d.powers.spinMyth}"`);
    }
    const nominateFed =
      d.powers.nominateFed === 'hawk' || d.powers.nominateFed === 'centrist' || d.powers.nominateFed === 'dove'
        ? d.powers.nominateFed
        : undefined;
    const nominateScotus: PowerDecisions['nominateScotus'] =
      isRecord(d.powers.nominateScotus) &&
      typeof d.powers.nominateScotus.name === 'string' &&
      (d.powers.nominateScotus.lean === 'liberal' ||
        d.powers.nominateScotus.lean === 'conservative' ||
        d.powers.nominateScotus.lean === 'moderate')
        ? { name: d.powers.nominateScotus.name, lean: d.powers.nominateScotus.lean }
        : undefined;
    const powers: PowerDecisions = {
      ...(Array.isArray(d.powers.signOrders) ? { signOrders: d.powers.signOrders.map(String) } : {}),
      ...(Array.isArray(d.powers.revokeOrders) ? { revokeOrders: d.powers.revokeOrders.map(String) } : {}),
      ...(typeof d.powers.pressureFed === 'boolean' ? { pressureFed: d.powers.pressureFed } : {}),
      ...(nominateFed ? { nominateFed } : {}),
      ...(nominateScotus ? { nominateScotus } : {}),
      ...(typeof d.powers.viewMyth === 'string' ? { viewMyth: d.powers.viewMyth } : {}),
      ...(typeof d.powers.spinMyth === 'string' ? { spinMyth: d.powers.spinMyth } : {}),
      ...(isRecord(d.powers.speech) &&
      (d.powers.speech.audience === 'general' ||
        d.powers.speech.audience === 'congress' ||
        d.powers.speech.audience === 'business')
        ? { speech: { audience: d.powers.speech.audience } }
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

  if (d.foreignPolicy !== undefined) {
    if (!isRecord(d.foreignPolicy)) throw new Error('Foreign policy decision must be a plain object');
    const fp: {
      defensePosture?: DefensePosture;
      foreignAssistance?: number;
      activeSanctions?: SanctionType[];
    } = {};
    if (d.foreignPolicy.defensePosture !== undefined) {
      if (
        d.foreignPolicy.defensePosture !== 'peacetime' &&
        d.foreignPolicy.defensePosture !== 'standard' &&
        d.foreignPolicy.defensePosture !== 'surge'
      ) {
        throw new Error(`Invalid defense posture: "${String(d.foreignPolicy.defensePosture)}"`);
      }
      fp.defensePosture = d.foreignPolicy.defensePosture;
    }
    if (d.foreignPolicy.foreignAssistance !== undefined) {
      if (
        typeof d.foreignPolicy.foreignAssistance !== 'number' ||
        !Number.isFinite(d.foreignPolicy.foreignAssistance) ||
        d.foreignPolicy.foreignAssistance < 0 ||
        d.foreignPolicy.foreignAssistance > 200
      ) {
        throw new Error(`Invalid foreignAssistance: "${String(d.foreignPolicy.foreignAssistance)}"`);
      }
      fp.foreignAssistance = d.foreignPolicy.foreignAssistance;
    }
    if (d.foreignPolicy.activeSanctions !== undefined) {
      if (!Array.isArray(d.foreignPolicy.activeSanctions)) {
        throw new Error('activeSanctions must be an array');
      }
      const sanctions: SanctionType[] = [];
      for (const s of d.foreignPolicy.activeSanctions) {
        if (typeof s !== 'string' || !KNOWN_SANCTION_IDS.has(s as SanctionType)) {
          throw new Error(`Unknown sanction ID: "${String(s)}"`);
        }
        sanctions.push(s as SanctionType);
      }
      fp.activeSanctions = sanctions;
    }
    result.foreignPolicy = fp as ForeignPolicyDraft;
  }

  if (d.trade !== undefined) {
    if (!isRecord(d.trade)) throw new Error('Trade decision must be a plain object');
    const tr: {
      sectorTariffs?: SectorTariffId[];
      agreements?: TradeAgreementId[];
    } = {};
    if (d.trade.sectorTariffs !== undefined) {
      if (!Array.isArray(d.trade.sectorTariffs)) {
        throw new Error('sectorTariffs must be an array');
      }
      const tariffs: SectorTariffId[] = [];
      for (const st of d.trade.sectorTariffs) {
        if (typeof st !== 'string' || !KNOWN_SECTOR_TARIFF_IDS.has(st as SectorTariffId)) {
          throw new Error(`Unknown sector tariff ID: "${String(st)}"`);
        }
        tariffs.push(st as SectorTariffId);
      }
      tr.sectorTariffs = tariffs;
    }
    if (d.trade.agreements !== undefined) {
      if (!Array.isArray(d.trade.agreements)) {
        throw new Error('agreements must be an array');
      }
      const agreements: TradeAgreementId[] = [];
      for (const ag of d.trade.agreements) {
        if (typeof ag !== 'string' || !KNOWN_TRADE_AGREEMENT_IDS.has(ag as TradeAgreementId)) {
          throw new Error(`Unknown trade agreement ID: "${String(ag)}"`);
        }
        agreements.push(ag as TradeAgreementId);
      }
      tr.agreements = agreements;
    }
    result.trade = tr as TradeDraft;
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

  if (d.evil !== undefined) {
    if (!isRecord(d.evil)) throw new Error('Evil decision must be a plain object');
    const evil: {
      siphonBn?: number;
      heatDelta?: number;
      enactedLevers?: EvilLeverId[];
    } = {};
    if (d.evil.siphonBn !== undefined) {
      if (typeof d.evil.siphonBn !== 'number' || !Number.isFinite(d.evil.siphonBn)) {
        throw new Error('evil.siphonBn must be a finite number');
      }
      evil.siphonBn = d.evil.siphonBn;
    }
    if (d.evil.heatDelta !== undefined) {
      if (typeof d.evil.heatDelta !== 'number' || !Number.isFinite(d.evil.heatDelta)) {
        throw new Error('evil.heatDelta must be a finite number');
      }
      evil.heatDelta = d.evil.heatDelta;
    }
    if (d.evil.enactedLevers !== undefined) {
      if (!Array.isArray(d.evil.enactedLevers)) {
        throw new Error('evil.enactedLevers must be an array');
      }
      const levers: EvilLeverId[] = [];
      for (const lv of d.evil.enactedLevers) {
        if (!isEvilLeverId(lv)) {
          throw new Error(`Unknown evil lever ID: "${String(lv)}"`);
        }
        levers.push(lv);
      }
      evil.enactedLevers = levers;
    }
    result.evil = evil as EvilDecision;
  }

  if (d.turnEntropy !== undefined) {
    if (typeof d.turnEntropy !== 'number' || !Number.isInteger(d.turnEntropy) || d.turnEntropy < 0 || d.turnEntropy > 0x7fffffff) {
      throw new Error(`turnEntropy must be an integer in [0, 0x7fffffff], got ${String(d.turnEntropy)}`);
    }
    result.turnEntropy = d.turnEntropy;
  }

  if (d.dynamicCrisisDelta !== undefined) {
    const cd = d.dynamicCrisisDelta;
    if (!isRecord(cd)) throw new Error('dynamicCrisisDelta must be a plain object');
    for (const k of Object.keys(cd)) {
      if (k !== 'gapDelta' && k !== 'infDelta' && k !== 'approvalDelta' && k !== 'trustDelta' && k !== 'cloutCost') {
        throw new Error(`Unknown dynamicCrisisDelta property: "${k}"`);
      }
    }
    if (typeof cd.gapDelta !== 'number' || !Number.isFinite(cd.gapDelta) || Math.abs(cd.gapDelta) > C.dynamicCrisisGapCap) {
      throw new Error(`dynamicCrisisDelta.gapDelta out of range [-${C.dynamicCrisisGapCap}, ${C.dynamicCrisisGapCap}]`);
    }
    if (typeof cd.infDelta !== 'number' || !Number.isFinite(cd.infDelta) || Math.abs(cd.infDelta) > C.dynamicCrisisInfCap) {
      throw new Error(`dynamicCrisisDelta.infDelta out of range [-${C.dynamicCrisisInfCap}, ${C.dynamicCrisisInfCap}]`);
    }
    if (typeof cd.approvalDelta !== 'number' || !Number.isFinite(cd.approvalDelta) || Math.abs(cd.approvalDelta) > C.dynamicCrisisApprovalCap) {
      throw new Error(`dynamicCrisisDelta.approvalDelta out of range [-${C.dynamicCrisisApprovalCap}, ${C.dynamicCrisisApprovalCap}]`);
    }
    if (typeof cd.trustDelta !== 'number' || !Number.isFinite(cd.trustDelta) || Math.abs(cd.trustDelta) > C.dynamicCrisisTrustCap) {
      throw new Error(`dynamicCrisisDelta.trustDelta out of range [-${C.dynamicCrisisTrustCap}, ${C.dynamicCrisisTrustCap}]`);
    }
    let cloutCost: number | undefined;
    if (cd.cloutCost !== undefined) {
      if (typeof cd.cloutCost !== 'number' || !Number.isInteger(cd.cloutCost) || cd.cloutCost < 0 || cd.cloutCost > 50) {
        throw new Error('dynamicCrisisDelta.cloutCost must be an integer in [0, 50]');
      }
      cloutCost = cd.cloutCost;
    }
    result.dynamicCrisisDelta = {
      gapDelta: cd.gapDelta,
      infDelta: cd.infDelta,
      approvalDelta: cd.approvalDelta,
      trustDelta: cd.trustDelta,
      ...(cloutCost !== undefined ? { cloutCost } : {}),
    };
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
  const options: GameOptions = {
    party: parsed.options.party,
    ...(typeof parsed.options.evilMode === 'boolean' ? { evilMode: parsed.options.evilMode } : {}),
    ...(isValidScenarioId(parsed.options.scenario) ? { scenario: parsed.options.scenario } : {}),
    ...(typeof parsed.options.unlockAll === 'boolean' ? { unlockAll: parsed.options.unlockAll } : {}),
    ...(typeof parsed.options.livingWorld === 'boolean' ? { livingWorld: parsed.options.livingWorld } : {}),
    ...(parsed.options.vocabMode === 'plain' || parsed.options.vocabMode === 'wonk'
      ? { vocabMode: parsed.options.vocabMode }
      : {}),
    ...(parsed.options.presidentLook === 0 ||
    parsed.options.presidentLook === 1 ||
    parsed.options.presidentLook === 2 ||
    parsed.options.presidentLook === 3
      ? { presidentLook: parsed.options.presidentLook }
      : {}),
  };

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

const DEFAULT_PROFILES: readonly BrowserProfile[] = [
  { id: 'default', name: 'Slot 1', updatedAt: 0 },
  { id: 'slot_2', name: 'Slot 2', updatedAt: 0 },
  { id: 'slot_3', name: 'Slot 3', updatedAt: 0 },
];

export function getProfileAutosaveKey(profileId: string): string {
  return profileId === 'default' ? AUTOSAVE_STORAGE_KEY : `${AUTOSAVE_STORAGE_KEY}:${profileId}`;
}

export function getActiveProfileId(storage?: SimpleStorage): string {
  try {
    const s = resolveStorage(storage);
    const id = s?.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    if (id && /^[a-zA-Z0-9_-]{1,32}$/.test(id)) {
      return id;
    }
  } catch {}
  return 'default';
}

export function listBrowserProfiles(storage?: SimpleStorage): BrowserProfile[] {
  try {
    const s = resolveStorage(storage);
    if (!s) return [...DEFAULT_PROFILES];
    const raw = s.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_PROFILES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_PROFILES];
    const valid = parsed.filter(
      (p): p is BrowserProfile =>
        isRecord(p) &&
        typeof p.id === 'string' &&
        /^[a-zA-Z0-9_-]{1,32}$/.test(p.id) &&
        typeof p.name === 'string' &&
        p.name.trim().length > 0 &&
        typeof p.updatedAt === 'number',
    );
    if (!valid.some((p) => p.id === 'default')) {
      valid.unshift({ id: 'default', name: 'Slot 1', updatedAt: 0 });
    }
    return valid.length > 0 ? valid : [...DEFAULT_PROFILES];
  } catch {
    return [...DEFAULT_PROFILES];
  }
}

export function switchBrowserProfile(profileId: string, storage?: SimpleStorage): SaveFile | null {
  try {
    const s = resolveStorage(storage);
    if (!s || !/^[a-zA-Z0-9_-]{1,32}$/.test(profileId)) return null;
    const prevId = getActiveProfileId(s);
    if (prevId === 'default') {
      const currentDefault = s.getItem(AUTOSAVE_STORAGE_KEY);
      if (currentDefault) {
        s.setItem(`${AUTOSAVE_STORAGE_KEY}:default`, currentDefault);
      }
    }
    s.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
    const profileRaw =
      profileId === 'default'
        ? (s.getItem(`${AUTOSAVE_STORAGE_KEY}:default`) ?? s.getItem(AUTOSAVE_STORAGE_KEY))
        : s.getItem(getProfileAutosaveKey(profileId));
    if (profileRaw) {
      s.setItem(AUTOSAVE_STORAGE_KEY, profileRaw);
      return parseSave(profileRaw);
    } else {
      s.removeItem(AUTOSAVE_STORAGE_KEY);
      return null;
    }
  } catch {
    return null;
  }
}

/** Saves the session to browser localStorage and requests persistence if supported. */
export function storeAutosave(session: SessionLike, storage?: SimpleStorage): void {
  try {
    const s = resolveStorage(storage);
    if (!s) return;
    const json = serializeSave(session);
    const activeId = getActiveProfileId(s);
    s.setItem(AUTOSAVE_STORAGE_KEY, json);
    s.setItem(getProfileAutosaveKey(activeId), json);
    if (activeId === 'default') {
      s.setItem(`${AUTOSAVE_STORAGE_KEY}:default`, json);
    }
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
    const activeId = getActiveProfileId(s);
    const raw =
      activeId === 'default'
        ? (s.getItem(AUTOSAVE_STORAGE_KEY) ?? s.getItem(`${AUTOSAVE_STORAGE_KEY}:default`))
        : (s.getItem(getProfileAutosaveKey(activeId)) ?? s.getItem(AUTOSAVE_STORAGE_KEY));
    if (!raw) return null;
    return parseSave(raw);
  } catch {
    return null;
  }
}

/** Clears the autosave key from localStorage for the active profile. */
export function clearAutosave(storage?: SimpleStorage): void {
  try {
    const s = resolveStorage(storage);
    if (s) {
      const activeId = getActiveProfileId(s);
      s.removeItem(AUTOSAVE_STORAGE_KEY);
      s.removeItem(getProfileAutosaveKey(activeId));
      if (activeId === 'default') {
        s.removeItem(`${AUTOSAVE_STORAGE_KEY}:default`);
      }
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

