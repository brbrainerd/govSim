// Pure deterministic Policy Doctrine Synergy & Chain-Reaction Engine (Phases 45-46, SYN-01, SYN-02, HEIST-01).
// Zero bare numeric literals outside 0/1; all thresholds and weights come from units.ts and coefficients.ts.

import {
  DOCTRINE_FAMILIES,
  getPerk,
  type DoctrineTag,
} from '../content/perks';
import { baseline, type BudgetDraft } from './budget';
import { C } from './coefficients';
import type { GameState, LogEntry } from './game';
import {
  SYNERGY_THRESHOLD_1,
  SYNERGY_THRESHOLD_2,
  SYNERGY_THRESHOLD_3,
} from './units';

const BASE_POLICY = baseline();
function leverDev(policy: BudgetDraft, key: keyof BudgetDraft): number {
  return (policy[key] ?? BASE_POLICY[key] ?? 0) - (BASE_POLICY[key] ?? 0);
}

export type SynergyTier = 0 | 2 | 4 | 6;

export interface ActiveFamilySynergy {
  readonly tag: DoctrineTag;
  readonly count: number;
  readonly tier: SynergyTier;
  readonly nextThreshold: number | null;
}

export interface SynergyChainTrigger {
  readonly id: string;
  readonly tag: DoctrineTag;
  readonly tier: SynergyTier;
  readonly actionLabel: string;
  readonly bonusSummary: string;
  readonly cloutBonus: number;
  readonly gapDelta: number;
  readonly infDelta: number;
  readonly trustDelta: number;
  readonly approvalDelta: number;
  readonly stashBonusBn: number;
  readonly heatDelta: number;
}

export interface SynergyResolutionResult {
  readonly families: readonly ActiveFamilySynergy[];
  readonly triggers: readonly SynergyChainTrigger[];
  readonly passiveGapDelta: number;
  readonly passiveInfDelta: number;
  readonly passiveTrustDelta: number;
  readonly passiveApprovalDelta: number;
  readonly passiveCloutDelta: number;
  readonly passiveStashBonusBn: number;
  readonly passiveHeatDelta: number;
  readonly chainGapDelta: number;
  readonly chainInfDelta: number;
  readonly chainTrustDelta: number;
  readonly chainApprovalDelta: number;
  readonly chainCloutDelta: number;
  readonly chainStashBonusBn: number;
  readonly chainHeatDelta: number;
  readonly log: readonly LogEntry[];
}

/** Doctrine tag mapping for Executive Orders, Trade Pacts, Sector Tariffs, Reforms, Amendments & Evil Levers (SYN-01, HEIST-01). */
export const ACTION_DOCTRINE_TAGS: Readonly<Record<string, readonly DoctrineTag[]>> = {
  // Executive Orders
  eo_tariff_review: ['industrial', 'security'],
  eo_hiring_freeze: ['institutionalist'],
  eo_border_patrol: ['security'],
  eo_federal_lands: ['industrial'],
  eo_agency_deregulation: ['industrial', 'main_street'],
  eo_drug_pricing: ['main_street'],
  eo_student_repayment: ['main_street'],
  eo_buy_american: ['industrial', 'main_street'],
  eo_clean_fleet: ['green', 'industrial'],
  eo_antitrust_review: ['main_street', 'institutionalist'],
  // Trade Agreements
  eu: ['globalist', 'green'],
  indoPacific: ['globalist', 'industrial'],
  americas: ['globalist', 'main_street'],
  // Strategic Sector Tariffs
  chips: ['industrial', 'security'],
  minerals: ['security', 'green'],
  cleanEnergy: ['industrial', 'green'],
  // Judicial & Electoral Reforms
  scotus_term_limits: ['institutionalist'],
  statutory_ethics_code: ['institutionalist'],
  court_expansion: ['institutionalist'],
  rcv_incentives: ['institutionalist', 'main_street'],
  independent_redistricting: ['institutionalist'],
  small_dollar_matching: ['institutionalist', 'main_street'],
  // Constitutional Amendments
  amendment_judicial_terms: ['institutionalist'],
  amendment_campaign_finance: ['institutionalist', 'main_street'],
  amendment_equal_rights: ['main_street', 'institutionalist'],
  amendment_balanced_budget: ['institutionalist'],
  // Evil Mode Corrupt Levers (HEIST-01)
  crony_contracts: ['shell_network', 'captured_regulators'],
  auction_public_lands: ['captured_regulators', 'shell_network'],
  sell_tariff_exemptions: ['shell_network', 'captured_regulators'],
  solicit_library_donations: ['shell_network', 'fixer_ring'],
  fire_inspectors_general: ['fixer_ring', 'captured_regulators'],
  pressure_justice_department: ['fixer_ring'],
};

const ALL_DOCTRINE_TAGS: readonly DoctrineTag[] = [
  'industrial',
  'green',
  'security',
  'main_street',
  'institutionalist',
  'globalist',
  'shell_network',
  'fixer_ring',
  'captured_regulators',
];

export function getActionDoctrineTags(id: string): readonly DoctrineTag[] {
  const mapped = ACTION_DOCTRINE_TAGS[id];
  if (mapped) return mapped;
  const perk = getPerk(id);
  return perk ? perk.tags : [];
}

export function getSynergyTier(count: number): SynergyTier {
  if (count >= SYNERGY_THRESHOLD_3) return SYNERGY_THRESHOLD_3 as SynergyTier;
  if (count >= SYNERGY_THRESHOLD_2) return SYNERGY_THRESHOLD_2 as SynergyTier;
  if (count >= SYNERGY_THRESHOLD_1) return SYNERGY_THRESHOLD_1 as SynergyTier;
  return 0;
}

export function getNextSynergyThreshold(count: number): number | null {
  if (count < SYNERGY_THRESHOLD_1) return SYNERGY_THRESHOLD_1;
  if (count < SYNERGY_THRESHOLD_2) return SYNERGY_THRESHOLD_2;
  if (count < SYNERGY_THRESHOLD_3) return SYNERGY_THRESHOLD_3;
  return null;
}

function tierBonusScale(tier: SynergyTier): number {
  if (tier === SYNERGY_THRESHOLD_3) return C.synergyTier6BonusScale;
  if (tier === SYNERGY_THRESHOLD_2) return C.synergyTier4BonusScale;
  if (tier === SYNERGY_THRESHOLD_1) return C.synergyTier2BonusScale;
  return 0;
}

/**
 * Computes active Policy Doctrine & Fixer Syndicate counts across the administration's
 * enacted Task Forces, Executive Orders, Trade Pacts/Tariffs, Reforms, Budget & Social levers.
 */
export function computeDoctrineCounts(
  state: GameState,
  activePerksOverride?: readonly string[],
  activeOrdersOverride?: readonly string[],
): Readonly<Record<DoctrineTag, number>> {
  const counts: Record<DoctrineTag, number> = {
    industrial: 0,
    green: 0,
    security: 0,
    main_street: 0,
    institutionalist: 0,
    globalist: 0,
    shell_network: 0,
    fixer_ring: 0,
    captured_regulators: 0,
  };

  const addTags = (tags: readonly DoctrineTag[]) => {
    for (const t of tags) {
      counts[t] += 1;
    }
  };

  const perks = activePerksOverride ?? state.activePerks ?? [];
  for (const perkId of perks) {
    const def = getPerk(perkId);
    if (def) addTags(def.tags);
  }

  const orders = activeOrdersOverride ?? state.activeOrders ?? [];
  for (const eoId of orders) {
    addTags(getActionDoctrineTags(eoId));
  }

  for (const agId of state.trade?.agreements ?? []) {
    addTags(getActionDoctrineTags(agId));
  }
  for (const stId of state.trade?.sectorTariffs ?? []) {
    addTags(getActionDoctrineTags(stId));
  }
  for (const refId of state.activeReforms ?? []) {
    addTags(getActionDoctrineTags(refId));
  }
  for (const amId of state.ratifiedAmendments ?? []) {
    addTags(getActionDoctrineTags(amId));
  }

  // Budget policy alignment
  if (leverDev(state.policy, 'inf') > 0) counts.industrial += 1;
  if (leverDev(state.policy, 'rd') > 0) {
    counts.industrial += 1;
    counts.green += 1;
  }
  if (leverDev(state.policy, 'ed') > 0 || leverDev(state.policy, 'mcd') > 0) {
    counts.main_street += 1;
  }
  if (leverDev(state.policy, 'mil') > 0) counts.security += 1;

  // Social policy alignment
  const soc = state.socialPolicy;
  if (soc) {
    if ((soc.cleanEnergyCredits ?? 0) > 0) counts.green += 1;
    if ((soc.universalPreK ?? 0) > 0 || (soc.drugPriceNegotiation ?? 0) > 0) counts.main_street += 1;
    if ((soc.borderSecurity ?? 0) > 0) counts.security += 1;
    if ((soc.skilledVisas ?? 0) > 0) counts.globalist += 1;
  }

  return counts;
}

export function computeActiveSynergies(
  state: GameState,
  evilMode = false,
  activePerksOverride?: readonly string[],
  activeOrdersOverride?: readonly string[],
): readonly ActiveFamilySynergy[] {
  const counts = computeDoctrineCounts(state, activePerksOverride, activeOrdersOverride);
  const result: ActiveFamilySynergy[] = [];
  for (const tag of ALL_DOCTRINE_TAGS) {
    const fam = DOCTRINE_FAMILIES[tag];
    if (fam.evilOnly && !evilMode) continue;
    const count = counts[tag];
    result.push({
      tag,
      count,
      tier: getSynergyTier(count),
      nextThreshold: getNextSynergyThreshold(count),
    });
  }
  return result;
}

/**
 * Resolves quarterly 2/4/6 set bonuses and How Many Dudes?-style chain-reaction triggers
 * when the administration has at least one active Task Force / Heist Relic.
 */
export function resolveDoctrineSynergies(
  state: GameState,
  activePerks: readonly string[],
  activeOrders: readonly string[],
  triggeredActionIds: readonly string[],
  evilMode = false,
): SynergyResolutionResult {
  const empty: SynergyResolutionResult = {
    families: [],
    triggers: [],
    passiveGapDelta: 0,
    passiveInfDelta: 0,
    passiveTrustDelta: 0,
    passiveApprovalDelta: 0,
    passiveCloutDelta: 0,
    passiveStashBonusBn: 0,
    passiveHeatDelta: 0,
    chainGapDelta: 0,
    chainInfDelta: 0,
    chainTrustDelta: 0,
    chainApprovalDelta: 0,
    chainCloutDelta: 0,
    chainStashBonusBn: 0,
    chainHeatDelta: 0,
    log: [],
  };

  if (activePerks.length === 0) return empty;

  const families = computeActiveSynergies(state, evilMode, activePerks, activeOrders);
  let passiveGapDelta = 0;
  let passiveInfDelta = 0;
  let passiveTrustDelta = 0;
  let passiveApprovalDelta = 0;
  let passiveCloutDelta = 0;
  let passiveStashBonusBn = 0;
  let passiveHeatDelta = 0;

  for (const fam of families) {
    if (fam.tier === 0) continue;
    const scale = tierBonusScale(fam.tier);
    if (fam.tag === 'industrial') {
      passiveGapDelta += C.synergyChainGapBonus * scale;
    } else if (fam.tag === 'green') {
      passiveInfDelta -= C.synergyChainInfRelief * scale;
    } else if (fam.tag === 'security') {
      passiveApprovalDelta += C.synergyChainApprovalBonus * scale;
    } else if (fam.tag === 'main_street') {
      passiveGapDelta += C.synergyChainGapBonus * scale;
      passiveApprovalDelta += C.synergyChainApprovalBonus * scale;
    } else if (fam.tag === 'institutionalist') {
      passiveTrustDelta += C.synergyChainTrustBonus * scale;
    } else if (fam.tag === 'globalist') {
      passiveInfDelta -= C.synergyChainInfRelief * scale;
    } else if (fam.tag === 'shell_network') {
      passiveStashBonusBn += C.heistChainStashBonusBn * scale;
    } else if (fam.tag === 'fixer_ring') {
      passiveHeatDelta -= C.heistChainHeatLaunder * scale;
    } else if (fam.tag === 'captured_regulators') {
      passiveStashBonusBn += C.heistChainStashBonusBn * scale;
      passiveHeatDelta -= C.heistChainHeatLaunder;
    }
  }

  // Chain-reaction triggers: when an action enacted this turn shares a Doctrine tag at tier >= 2
  const triggeredTags = new Set<DoctrineTag>();
  for (const actId of triggeredActionIds) {
    for (const t of getActionDoctrineTags(actId)) {
      triggeredTags.add(t);
    }
  }

  const triggers: SynergyChainTrigger[] = [];
  const log: LogEntry[] = [];
  let chainGapDelta = 0;
  let chainInfDelta = 0;
  let chainTrustDelta = 0;
  let chainApprovalDelta = 0;
  let chainCloutDelta = 0;
  let chainStashBonusBn = 0;
  let chainHeatDelta = 0;

  for (const fam of families) {
    if (fam.tier === 0 || !triggeredTags.has(fam.tag)) continue;
    const info = DOCTRINE_FAMILIES[fam.tag];
    let cloutBonus = 0;
    let gapDelta = 0;
    let infDelta = 0;
    let trustDelta = 0;
    let approvalDelta = 0;
    let stashBonusBn = 0;
    let heatDelta = 0;
    let bonusSummary = '';

    if (fam.tag === 'industrial') {
      gapDelta = C.synergyChainGapBonus;
      cloutBonus = C.synergyChainCloutBonus;
      bonusSummary = `+${C.synergyChainCloutBonus} Clout & +${C.synergyChainGapBonus}% Factory Output`;
    } else if (fam.tag === 'green') {
      infDelta = -C.synergyChainInfRelief;
      cloutBonus = C.synergyChainCloutBonus;
      bonusSummary = `-${C.synergyChainInfRelief}% Energy Inflation & +${C.synergyChainCloutBonus} Clout`;
    } else if (fam.tag === 'security') {
      approvalDelta = C.synergyChainApprovalBonus;
      cloutBonus = C.synergyChainCloutBonus;
      bonusSummary = `+${C.synergyChainApprovalBonus} Approval & +${C.synergyChainCloutBonus} Clout`;
    } else if (fam.tag === 'main_street') {
      approvalDelta = C.synergyChainApprovalBonus;
      gapDelta = C.synergyChainGapBonus;
      bonusSummary = `+${C.synergyChainApprovalBonus} Approval & +${C.synergyChainGapBonus}% Main Street Demand`;
    } else if (fam.tag === 'institutionalist') {
      trustDelta = C.synergyChainTrustBonus;
      cloutBonus = C.synergyChainCloutBonus;
      bonusSummary = `+${C.synergyChainTrustBonus} Public Trust & +${C.synergyChainCloutBonus} Clout`;
    } else if (fam.tag === 'globalist') {
      infDelta = -C.synergyChainInfRelief;
      gapDelta = C.synergyChainGapBonus;
      bonusSummary = `-${C.synergyChainInfRelief}% Import Inflation & +${C.synergyChainGapBonus}% Export Output`;
    } else if (fam.tag === 'shell_network') {
      stashBonusBn = C.heistChainStashBonusBn;
      bonusSummary = `+$${C.heistChainStashBonusBn}B Offshore Syndicate Dividend`;
    } else if (fam.tag === 'fixer_ring') {
      heatDelta = -C.heistChainHeatLaunder;
      cloutBonus = C.synergyChainCloutBonus;
      bonusSummary = `-${C.heistChainHeatLaunder} Heat Laundered & +${C.synergyChainCloutBonus} Clout`;
    } else if (fam.tag === 'captured_regulators') {
      stashBonusBn = C.heistChainStashBonusBn;
      heatDelta = -C.heistChainHeatLaunder;
      bonusSummary = `+$${C.heistChainStashBonusBn}B Stash & -${C.heistChainHeatLaunder} Heat`;
    }

    chainGapDelta += gapDelta;
    chainInfDelta += infDelta;
    chainTrustDelta += trustDelta;
    chainApprovalDelta += approvalDelta;
    chainCloutDelta += cloutBonus;
    chainStashBonusBn += stashBonusBn;
    chainHeatDelta += heatDelta;

    triggers.push({
      id: `chain_${fam.tag}_t${state.turn}`,
      tag: fam.tag,
      tier: fam.tier,
      actionLabel: `${info.emoji} ${info.label} (${fam.tier}-Piece Chain)`,
      bonusSummary,
      cloutBonus,
      gapDelta,
      infDelta,
      trustDelta,
      approvalDelta,
      stashBonusBn,
      heatDelta,
    });

    log.push({
      kind: 'perk',
      id: `synergy_${fam.tag}`,
      detail: `${info.emoji} ${info.label} (${fam.tier}-Piece Chain): ${bonusSummary}`,
      amount: cloutBonus,
    });
  }

  return {
    families,
    triggers,
    passiveGapDelta,
    passiveInfDelta,
    passiveTrustDelta,
    passiveApprovalDelta,
    passiveCloutDelta,
    passiveStashBonusBn,
    passiveHeatDelta,
    chainGapDelta,
    chainInfDelta,
    chainTrustDelta,
    chainApprovalDelta,
    chainCloutDelta,
    chainStashBonusBn,
    chainHeatDelta,
    log,
  };
}
