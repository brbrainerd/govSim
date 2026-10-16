// Sourced catalog of executive orders (PWR-01, OBS-05, D5, COPY-01).
// Each order features a statutory basis, qualitative court risk band, plain-talk trade-offs, and engine effect.
// All copy is strictly nonpartisan, plain language, reading grade <= 9.0.

import type { Channel } from '../engine/modifiers';

export type CourtRiskBand = 'Low' | 'Moderate' | 'High';

export interface OrderEffect {
  readonly channel: Channel;
  readonly amount: number;
}

export interface ExecutiveOrder {
  readonly id: string;
  readonly emoji: string;
  readonly name: string;
  readonly wonkLabel: string;
  readonly description: string;
  readonly whyClick: string;
  readonly upside: string;
  readonly catchText: string;
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
    emoji: '🏗️',
    name: 'Targeted trade reviews',
    wonkLabel: 'Section 232 Steel & Industrial Tariff Probe',
    description: 'Orders reviews of foreign steel and factory parts.',
    whyClick: 'Quickly shield home steel mills without waiting on a slow bill.',
    upside: 'Boosts factory output (+0.1% growth)',
    catchText: 'Nudges store prices up (+0.1% inflation)',
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
    emoji: '🧊',
    name: 'Federal hiring freeze',
    wonkLabel: 'Executive Branch Civilian Attrition Mandate',
    description: 'Pauses hiring for most federal desk jobs.',
    whyClick: 'Show voters you are trimming the budget with one pen stroke.',
    upside: 'Saves $4B a quarter in agency pay',
    catchText: 'Longer phone lines hurt public trust (−1)',
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
    emoji: '🛂',
    name: 'Border surveillance surge',
    wonkLabel: 'INA Section 212(f) Border Enforcement Surge',
    description: 'Sends extra gear and officers to border stations.',
    whyClick: 'Score a fast poll bump when voters worry about border order.',
    upside: 'Lifts approval (+2 pts) right away',
    catchText: 'Costs $5B/qtr and 35% court block risk',
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
    emoji: '⛽',
    name: 'Energy permits on public lands',
    wonkLabel: 'Accelerated Onshore Oil & Gas Leasing Directive',
    description: 'Speeds up permits for oil and gas on public lands.',
    whyClick: 'Cool gas pump prices fast when inflation is biting drivers.',
    upside: 'Cools fuel and price pressure (−0.2% inflation)',
    catchText: 'Sparks green backlash (−1 approval) & lawsuits',
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
    emoji: '✂️',
    name: 'Regulatory budget caps',
    wonkLabel: 'Two-for-One Administrative Deregulation Mandate',
    description: 'Tells agencies to cut two old rules for each new rule.',
    whyClick: 'Give business owners a long-run speed boost by cutting paperwork.',
    upside: 'Lifts long-run growth speed (+0.1% potential)',
    catchText: 'Watchdogs warn of weaker safety rules (−1 trust)',
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
    emoji: '💊',
    name: 'Prescription drug pricing rule',
    wonkLabel: 'CMMI Most-Favored-Nation Drug Pricing Model',
    description: 'Ties federal drug pay rates to lower prices overseas.',
    whyClick: 'Big poll boost with seniors AND saves Medicare cash—if judges allow it.',
    upside: 'Popular (+3 approval) & saves $6B/qtr',
    catchText: '50% chance courts strike it down next year',
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
    emoji: '🎓',
    name: 'Student loan repayment adjustments',
    wonkLabel: 'HEA Income-Driven Repayment Administrative Rule',
    description: 'Caps monthly college loan bills for lower earners.',
    whyClick: 'Put extra cash in young pockets now, though the Supreme Court is skeptical.',
    upside: 'Boosts consumer spending (+0.2% output gap)',
    catchText: 'Costs $8B/qtr and faces 60% court strike risk',
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
    emoji: '🏭',
    name: 'Buy American federal contracts',
    wonkLabel: 'FAR Domestic Content Threshold Escalation',
    description: 'Orders federal agencies to buy home made goods.',
    whyClick: 'Safe, court-proof way to build up local factories over time.',
    upside: 'Helps local plants grow (+0.1% growth speed)',
    catchText: 'Adds $3B/qtr to federal shopping bills',
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
    emoji: '🚐',
    name: 'Clean federal fleet transition',
    wonkLabel: 'EPAct Federal Zero-Emission Vehicle Procurement Directive',
    description: 'Tells agencies to buy electric cars made in home plants.',
    whyClick: 'A low-cost, low-drama nudge that wins a point of approval.',
    upside: 'Steady +1 approval with low court risk',
    catchText: 'Adds $2B/qtr in upfront vehicle costs',
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
    emoji: '🛒',
    name: 'Supply chain antitrust review',
    wonkLabel: 'Sherman Act Grocery & Freight Competition Directive',
    description: 'Tells trust-busters to review food and shipping prices.',
    whyClick: 'Crack down on giant mergers to cool grocery prices and win public trust.',
    upside: 'Trims inflation (−0.1%) and lifts trust (+1)',
    catchText: 'Costs 20 Clout and 25% court delay risk',
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
