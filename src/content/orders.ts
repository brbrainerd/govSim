// Sourced catalog of executive orders (PWR-01, OBS-05, D5).
// Each order features a statutory basis, qualitative court risk band, and engine effect.
// All copy is strictly nonpartisan, plain language, reading grade <= 9.0.

import type { Channel } from '../engine/modifiers';

export type CourtRiskBand = 'Low' | 'Moderate' | 'High';

export interface OrderEffect {
  readonly channel: Channel;
  readonly amount: number;
}

export interface ExecutiveOrder {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly legalBasis: string;
  readonly cloutCost: number;
  readonly courtRisk: CourtRiskBand;
  readonly riskProbability: number; // probability of legal challenge
  readonly preview: string;
  readonly effects: readonly OrderEffect[];
  readonly citation: {
    readonly title: string;
    readonly url: string;
    readonly confirmed: boolean;
  };
}

export const ORDERS_CATALOG: readonly ExecutiveOrder[] = [
  {
    id: 'eo_tariff_review',
    name: 'Targeted trade reviews',
    description: 'Orders reviews of foreign steel and factory parts.',
    legalBasis: 'Trade Expansion Act of 1962, 19 U.S.C. § 1862',
    cloutCost: 25,
    courtRisk: 'Low',
    riskProbability: 0.10,
    preview: 'Helps home steel mills but risks new tariffs abroad.',
    effects: [
      { channel: 'gap', amount: 0.1 },
      { channel: 'inflation', amount: 0.1 },
    ],
    citation: {
      title: 'Congressional Research Service (R45249)',
      url: 'https://crsreports.congress.gov/product/pdf/R/R45249',
      confirmed: false,
    },
  },
  {
    id: 'eo_hiring_freeze',
    name: 'Federal hiring freeze',
    description: 'Pauses hiring for most federal desk jobs.',
    legalBasis: 'Civil Service Reform, 5 U.S.C. § 3301',
    cloutCost: 15,
    courtRisk: 'Low',
    riskProbability: 0.15,
    preview: 'Trims public spending but slows permit wait times.',
    effects: [
      { channel: 'debtBn', amount: -4 },
      { channel: 'trust', amount: -1 },
    ],
    citation: {
      title: 'GAO Federal Civilian Hiring Freezes (GAO-82-21)',
      url: 'https://www.gao.gov/products/gao-82-21',
      confirmed: false,
    },
  },
  {
    id: 'eo_border_patrol',
    name: 'Border surveillance surge',
    description: 'Sends extra gear and officers to border stations.',
    legalBasis: 'Immigration and Nationality Act, 8 U.S.C. § 1182(f)',
    cloutCost: 20,
    courtRisk: 'Moderate',
    riskProbability: 0.35,
    preview: 'Strengthens border checks but costs extra money to run.',
    effects: [
      { channel: 'approval', amount: 2 },
      { channel: 'debtBn', amount: 5 },
    ],
    citation: {
      title: 'CRS Presidential Authority Under Section 212(f) (LSB10145)',
      url: 'https://crsreports.congress.gov/product/pdf/LSB/LSB10145',
      confirmed: false,
    },
  },
  {
    id: 'eo_federal_lands',
    name: 'Energy permits on public lands',
    description: 'Speeds up permits for oil and gas on public lands.',
    legalBasis: 'Mineral Leasing Act, 30 U.S.C. § 226',
    cloutCost: 20,
    courtRisk: 'Moderate',
    riskProbability: 0.30,
    preview: 'Helps lower gas prices but brings green group lawsuits.',
    effects: [
      { channel: 'inflation', amount: -0.2 },
      { channel: 'approval', amount: -1 },
    ],
    citation: {
      title: 'CRS Mineral Leasing on Federal Lands (R46201)',
      url: 'https://crsreports.congress.gov/product/pdf/R/R46201',
      confirmed: false,
    },
  },
  {
    id: 'eo_agency_deregulation',
    name: 'Regulatory budget caps',
    description: 'Tells agencies to cut two old rules for each new rule.',
    legalBasis: 'Take Care Clause and Executive Order 13771 precedent',
    cloutCost: 25,
    courtRisk: 'Moderate',
    riskProbability: 0.25,
    preview: 'Cuts red tape for business but trims safety rules.',
    effects: [
      { channel: 'potential', amount: 0.1 },
      { channel: 'trust', amount: -1 },
    ],
    citation: {
      title: 'CRS Analysis of Two-for-One Rulemaking (R44505)',
      url: 'https://crsreports.congress.gov/product/pdf/R/R44505',
      confirmed: false,
    },
  },
  {
    id: 'eo_drug_pricing',
    name: 'Prescription drug pricing rule',
    description: 'Ties federal drug pay rates to lower prices overseas.',
    legalBasis: 'Social Security Act Center for Innovation, 42 U.S.C. § 1315a',
    cloutCost: 25,
    courtRisk: 'High',
    riskProbability: 0.50,
    preview: 'Lowers medicine costs for seniors but faces court fights.',
    effects: [
      { channel: 'debtBn', amount: -6 },
      { channel: 'approval', amount: 3 },
    ],
    citation: {
      title: 'HHS International Pricing Model (85 FR 76180)',
      url: 'https://www.federalregister.gov/documents/2020/11/27/2020-26069/most-favored-nation-mfn-model',
      confirmed: false,
    },
  },
  {
    id: 'eo_student_repayment',
    name: 'Student loan repayment adjustments',
    description: 'Caps monthly college loan bills for lower earners.',
    legalBasis: 'Higher Education Act, 20 U.S.C. § 1087e',
    cloutCost: 30,
    courtRisk: 'High',
    riskProbability: 0.60,
    preview: 'Helps young grads but adds new federal debt.',
    effects: [
      { channel: 'gap', amount: 0.2 },
      { channel: 'debtBn', amount: 8 },
    ],
    citation: {
      title: 'Congressional Budget Office Cost of SAVE Plan',
      url: 'https://www.cbo.gov/publication/59654',
      confirmed: false,
    },
  },
  {
    id: 'eo_buy_american',
    name: 'Buy American federal contracts',
    description: 'Orders federal agencies to buy home made goods.',
    legalBasis: 'Buy American Act, 41 U.S.C. § 8301',
    cloutCost: 15,
    courtRisk: 'Low',
    riskProbability: 0.10,
    preview: 'Helps local plants but costs slightly more to buy.',
    effects: [
      { channel: 'potential', amount: 0.1 },
      { channel: 'debtBn', amount: 3 },
    ],
    citation: {
      title: 'Federal Acquisition Regulation Domestic Content Rule (87 FR 12780)',
      url: 'https://www.federalregister.gov/documents/2022/03/07/2022-04173/federal-acquisition-regulation-amendments-to-the-far-buy-american-act-requirements',
      confirmed: false,
    },
  },
  {
    id: 'eo_clean_fleet',
    name: 'Clean federal fleet transition',
    description: 'Tells agencies to buy electric cars made in home plants.',
    legalBasis: 'Energy Policy Act, 42 U.S.C. § 13212',
    cloutCost: 18,
    courtRisk: 'Low',
    riskProbability: 0.15,
    preview: 'Cuts fuel use and helps plants but needs upfront cash.',
    effects: [
      { channel: 'debtBn', amount: 2 },
      { channel: 'approval', amount: 1 },
    ],
    citation: {
      title: 'CRS Federal Fleet Management Guidelines (R46723)',
      url: 'https://crsreports.congress.gov/product/pdf/R/R46723',
      confirmed: false,
    },
  },
  {
    id: 'eo_antitrust_review',
    name: 'Supply chain antitrust review',
    description: 'Tells trust-busters to review food and shipping prices.',
    legalBasis: 'Sherman Antitrust Act, 15 U.S.C. § 1',
    cloutCost: 20,
    courtRisk: 'Moderate',
    riskProbability: 0.25,
    preview: 'Targets high price markups but faces big business pushback.',
    effects: [
      { channel: 'inflation', amount: -0.1 },
      { channel: 'trust', amount: 1 },
    ],
    citation: {
      title: 'Executive Order on Promoting Competition in the American Economy',
      url: 'https://www.federalregister.gov/documents/2021/07/14/2021-15069/promoting-competition-in-the-american-economy',
      confirmed: false,
    },
  },
] as const;

export function getOrder(id: string): ExecutiveOrder | undefined {
  return ORDERS_CATALOG.find((o) => o.id === id);
}
