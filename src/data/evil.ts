// Corrupt Executive Levers Catalog (Phase 18, LEVER-01, LEVER-02, LEVER-03)
// Satirical executive actions for kleptocratic siphoning and oversight suppression.

import { C } from '../engine/coefficients';
import { EVIL_LEVER_IDS, type EvilLeverId } from '../engine/units';

export type EvilLeverCategory = 'siphon' | 'suppression';

export interface EvilLever {
  readonly id: EvilLeverId;
  readonly name: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly flavorQuote: string;
  readonly category: EvilLeverCategory;
  readonly cloutCost: number;
  readonly kickbackBn: number;
  readonly heatDelta: number;
  readonly trustPenalty: number;
  readonly approvalPenalty: number;
  readonly budgetCostBn?: number;
}

export const EVIL_LEVERS_CATALOG: readonly EvilLever[] = [
  {
    id: 'crony_contracts',
    name: 'No-Bid Crony Procurement Contracts',
    shortTitle: 'No-Bid Contracts',
    description: 'Award lucrative sole-source defense and infrastructure contracts to major political donors and shell companies.',
    flavorQuote: '"Competition is inefficient. True loyalty requires guaranteed margin."',
    category: 'siphon',
    cloutCost: C.evilCronyCloutCost,
    kickbackBn: C.evilCronyKickbackBn,
    heatDelta: C.evilCronyHeatDelta,
    trustPenalty: C.evilCronyTrustCost,
    approvalPenalty: C.evilCronyApprovalCost,
    budgetCostBn: C.evilCronyBudgetCostBn,
  },
  {
    id: 'auction_public_lands',
    name: 'Fire-Sale Auction of Federal Lands',
    shortTitle: 'Public Lands Auction',
    description: 'Sell off federal mineral rights, national monuments, and wildlife refuges to energy consortiums at cut-rate prices.',
    flavorQuote: '"A scenic vista generates zero quarterly yield. Drill it, pave it, monetize it."',
    category: 'siphon',
    cloutCost: C.evilLandCloutCost,
    kickbackBn: C.evilLandKickbackBn,
    heatDelta: C.evilLandHeatDelta,
    trustPenalty: C.evilLandTrustCost,
    approvalPenalty: C.evilLandApprovalCost,
  },
  {
    id: 'sell_tariff_exemptions',
    name: 'Targeted Tariff Exemption Carve-Outs',
    shortTitle: 'Tariff Exemptions',
    description: 'Grant discretionary executive waivers exempting select corporate benefactors from punishing import tariffs.',
    flavorQuote: '"Tariffs protect the homeland. Tariff exemptions protect the family trust."',
    category: 'siphon',
    cloutCost: C.evilTariffCloutCost,
    kickbackBn: C.evilTariffKickbackBn,
    heatDelta: C.evilTariffHeatDelta,
    trustPenalty: C.evilTariffTrustCost,
    approvalPenalty: C.evilTariffApprovalCost,
  },
  {
    id: 'solicit_library_donations',
    name: 'Presidential Library Slush Foundation',
    shortTitle: 'Library Slush Fund',
    description: 'Solicit multimillion-dollar anonymous endowments from foreign oligarchs and domestic monopolies.',
    flavorQuote: '"Preserving our historic legacy requires unvetted wire transfers to our Zurich annex."',
    category: 'siphon',
    cloutCost: C.evilLibraryCloutCost,
    kickbackBn: C.evilLibraryKickbackBn,
    heatDelta: C.evilLibraryHeatDelta,
    trustPenalty: C.evilLibraryTrustCost,
    approvalPenalty: C.evilLibraryApprovalCost,
  },
  {
    id: 'fire_inspectors_general',
    name: 'Purge Independent Inspectors General',
    shortTitle: 'Fire Watchdogs',
    description: 'Summarily dismiss statutory agency inspectors general who launch audits into presidential procurement and kickbacks.',
    flavorQuote: '"An audit is merely an unconstitutional lack of enthusiasm."',
    category: 'suppression',
    cloutCost: C.evilFireIgCloutCost,
    kickbackBn: 0,
    heatDelta: -C.evilFireIgHeatSuppression,
    trustPenalty: C.evilFireIgTrustCost,
    approvalPenalty: C.evilFireIgApprovalCost,
  },
  {
    id: 'pressure_justice_department',
    name: 'Order DOJ to Quash Subpoenas',
    shortTitle: 'Subpoena Suppression',
    description: 'Direct the Department of Justice and FBI leadership to indefinitely delay corruption inquiries and ignore congressional subpoenas.',
    flavorQuote: '"The law is an instrument of the state, and I am the head of state."',
    category: 'suppression',
    cloutCost: C.evilDojCloutCost,
    kickbackBn: 0,
    heatDelta: -C.evilDojHeatSuppression,
    trustPenalty: C.evilDojTrustCost,
    approvalPenalty: C.evilDojApprovalCost,
  },
];

const LEVERS_BY_ID = new Map<EvilLeverId, EvilLever>(
  EVIL_LEVERS_CATALOG.map((lever) => [lever.id, lever]),
);

export function getEvilLever(id: string): EvilLever | undefined {
  return LEVERS_BY_ID.get(id as EvilLeverId);
}

export function isEvilLeverId(id: string): id is EvilLeverId {
  return EVIL_LEVER_IDS.includes(id as EvilLeverId);
}
