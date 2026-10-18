// Curated catalog of White House Task Forces, Institutional Mandates (PERK-03),
// Policy Doctrine Tags (SYN-01), and Evil Mode Heist Relics (HEIST-01).
// All copy is strictly nonpartisan, plain language, reading grade <= 9.0, sentences <= 20 words.

import type { Channel } from '../engine/modifiers';

export type StandardDoctrineTag =
  | 'industrial'
  | 'green'
  | 'security'
  | 'main_street'
  | 'institutionalist'
  | 'globalist';

export type EvilSyndicateTag =
  | 'shell_network'
  | 'fixer_ring'
  | 'captured_regulators';

export type DoctrineTag = StandardDoctrineTag | EvilSyndicateTag;

export type PerkTier = 1 | 2 | 3 | 4;

export interface DoctrineFamilyInfo {
  readonly id: DoctrineTag;
  readonly emoji: string;
  readonly label: string;
  readonly wonkLabel: string;
  readonly evilOnly: boolean;
  readonly summary: string;
}

export const DOCTRINE_FAMILIES: Readonly<Record<DoctrineTag, DoctrineFamilyInfo>> = {
  industrial: {
    id: 'industrial',
    emoji: '🏗️',
    label: 'Industrial',
    wonkLabel: 'Supply-Side Industrial Policy',
    evilOnly: false,
    summary: 'Builds home factories, freight lines, and chip plants.',
  },
  green: {
    id: 'green',
    emoji: '🌱',
    label: 'Green Transition',
    wonkLabel: 'Decarbonization & Grid Modernization',
    evilOnly: false,
    summary: 'Cuts power bills and expands clean grid capacity.',
  },
  security: {
    id: 'security',
    emoji: '🛡️',
    label: 'National Security',
    wonkLabel: 'Strategic Deterrence & Border Readiness',
    evilOnly: false,
    summary: 'Boosts deterrence, cyber shields, and border order.',
  },
  main_street: {
    id: 'main_street',
    emoji: '📈',
    label: 'Main Street',
    wonkLabel: 'Household Purchasing Power & Labor',
    evilOnly: false,
    summary: 'Lifts family paychecks, job growth, and local shops.',
  },
  institutionalist: {
    id: 'institutionalist',
    emoji: '⚖️',
    label: 'Institutionalist',
    wonkLabel: 'Constitutional Norms & Civic Trust',
    evilOnly: false,
    summary: 'Strengthens courts, oversight, and public trust.',
  },
  globalist: {
    id: 'globalist',
    emoji: '🌐',
    label: 'Globalist',
    wonkLabel: 'Multilateral Trade & Alliance Integration',
    evilOnly: false,
    summary: 'Opens export markets and cools import prices.',
  },
  shell_network: {
    id: 'shell_network',
    emoji: '🏝️',
    label: 'Shell Network',
    wonkLabel: 'Offshore Sovereign Layering Syndicate',
    evilOnly: true,
    summary: 'Multiplies offshore kickbacks through island trusts.',
  },
  fixer_ring: {
    id: 'fixer_ring',
    emoji: '🕵️',
    label: 'Fixer Ring',
    wonkLabel: 'Bagman & Witness Suppression Operative Ring',
    evilOnly: true,
    summary: 'Buries ethics tips and speeds up backroom deals.',
  },
  captured_regulators: {
    id: 'captured_regulators',
    emoji: '🏛️',
    label: 'Captured Regulators',
    wonkLabel: 'Agency Watchdog Capture & Carve-Out Cartel',
    evilOnly: true,
    summary: 'Turns agency watchdogs into private toll collectors.',
  },
};

export const PERK_TIER_LABELS: Readonly<Record<PerkTier, { label: string; wonk: string }>> = {
  1: { label: 'Tier I • Routine', wonk: 'Tier I • Interagency Working Group' },
  2: { label: 'Tier II • Priority', wonk: 'Tier II • Presidential Task Force' },
  3: { label: 'Tier III • Strategic', wonk: 'Tier III • Cabinet Council Directive' },
  4: { label: 'Tier IV • Historic Mandate', wonk: 'Tier IV • Landmark Institutional Doctrine' },
};

export interface PerkEffect {
  readonly channel: Channel;
  readonly amount: number;
}

export interface PerkDefinition {
  readonly id: string;
  readonly tier: PerkTier;
  readonly emoji: string;
  readonly name: string;
  readonly wonkLabel: string;
  readonly description: string;
  readonly upside: string;
  readonly catchText: string;
  readonly civicNote: string;
  readonly cloutCost: number;
  readonly tags: readonly DoctrineTag[];
  readonly effects: readonly PerkEffect[];
  readonly evilOnly?: boolean;
  readonly evilStashBonusBn?: number;
  readonly evilHeatDelta?: number;
}

/** 24 nonpartisan standard White House Task Forces & Mandates (PERK-03). */
export const STANDARD_PERKS_CATALOG: readonly PerkDefinition[] = [
  // ---- TIER I: ROUTINE WORKING GROUPS (8 cards) ----
  {
    id: 'tf_port_expediters',
    tier: 1,
    emoji: '🚢',
    name: 'Port Backlog Strike Team',
    wonkLabel: 'Supply Chain Port Bottleneck Working Group',
    description: 'Sends federal mediators to keep docks running day and night.',
    upside: 'Trims store price pressure (-0.08% inflation)',
    catchText: 'Overtime grants add $2B a quarter to debt',
    civicNote: 'Presidents use port task forces to clear freight jams without new laws.',
    cloutCost: 0,
    tags: ['industrial', 'globalist'],
    effects: [
      { channel: 'inflation', amount: -0.08 },
      { channel: 'debtBn', amount: 2 },
    ],
  },
  {
    id: 'tf_rural_broadband',
    tier: 1,
    emoji: '📡',
    name: 'Rural Fiber Fast-Track Desk',
    wonkLabel: 'NTIA Rural Broadband Permitting Desk',
    description: 'Cuts permit wait times for town fiber and cell towers.',
    upside: 'Nudges long-run growth up (+0.05% potential)',
    catchText: 'Adds $2B a quarter in matching grants',
    civicNote: 'Fast permit desks speed up local internet lines using existing agency funds.',
    cloutCost: 0,
    tags: ['industrial', 'main_street'],
    effects: [
      { channel: 'potential', amount: 0.05 },
      { channel: 'debtBn', amount: 2 },
    ],
  },
  {
    id: 'tf_inspector_hotline',
    tier: 1,
    emoji: '🔍',
    name: 'Procurement Waste Audit Team',
    wonkLabel: 'OMB Inspector General Contract Audit Unit',
    description: 'Audits agency vendor bills to catch double charges early.',
    upside: 'Saves $3B a quarter and lifts trust (+0.5)',
    catchText: 'Strict contract rules slow short-term demand (-0.04% gap)',
    civicNote: 'Routine contract audits save money and build public confidence in government.',
    cloutCost: 0,
    tags: ['institutionalist'],
    effects: [
      { channel: 'debtBn', amount: -3 },
      { channel: 'trust', amount: 0.5 },
      { channel: 'gap', amount: -0.04 },
    ],
  },
  {
    id: 'tf_grid_siting',
    tier: 1,
    emoji: '⚡',
    name: 'Power Line Siting Council',
    wonkLabel: 'FERC Interregional Transmission Siting Task Force',
    description: 'Helps states agree on routes for high-voltage power lines.',
    upside: 'Cools power bills (-0.07% inflation)',
    catchText: 'Local route fights cost 0.5 approval',
    civicNote: 'Power grid councils coordinate state utility boards to prevent blackouts.',
    cloutCost: 0,
    tags: ['green', 'industrial'],
    effects: [
      { channel: 'inflation', amount: -0.07 },
      { channel: 'approval', amount: -0.5 },
    ],
  },
  {
    id: 'tf_small_biz_lending',
    tier: 1,
    emoji: '🏪',
    name: 'Main Street Credit Desk',
    wonkLabel: 'SBA Community Bank Liquidity Working Group',
    description: 'Backs small town bank loans for local shops and builders.',
    upside: 'Boosts local hiring (+0.07% output gap)',
    catchText: 'Loan guarantees cost $2B a quarter',
    civicNote: 'Small business credit desks help local shops survive high interest rates.',
    cloutCost: 0,
    tags: ['main_street'],
    effects: [
      { channel: 'gap', amount: 0.07 },
      { channel: 'debtBn', amount: 2 },
    ],
  },
  {
    id: 'tf_cyber_shield',
    tier: 1,
    emoji: '💻',
    name: 'Critical Grid Cyber Cell',
    wonkLabel: 'CISA Infrastructure Cyber Rapid Response Cell',
    description: 'Shares live threat alerts with water plants and hospitals.',
    upside: 'Builds public trust (+0.6) and approval (+0.5)',
    catchText: 'Costs $2B a quarter for cyber gear',
    civicNote: 'Joint cyber cells protect power and water systems from foreign hackers.',
    cloutCost: 0,
    tags: ['security', 'institutionalist'],
    effects: [
      { channel: 'trust', amount: 0.6 },
      { channel: 'approval', amount: 0.5 },
      { channel: 'debtBn', amount: 2 },
    ],
  },
  {
    id: 'tf_export_credit',
    tier: 1,
    emoji: '✈️',
    name: 'Export Promotion Mission',
    wonkLabel: 'ITA Commercial Diplomacy & Export Credit Desk',
    description: 'Helps home farmers and tool makers win buyers abroad.',
    upside: 'Lifts export demand (+0.06% output gap)',
    catchText: 'Trade trips cost $1.5B a quarter',
    civicNote: 'Trade missions connect domestic mid-sized producers with overseas buyers.',
    cloutCost: 0,
    tags: ['globalist', 'main_street'],
    effects: [
      { channel: 'gap', amount: 0.06 },
      { channel: 'debtBn', amount: 1.5 },
    ],
  },
  {
    id: 'tf_weatherization_corps',
    tier: 1,
    emoji: '🏠',
    name: 'Home Weatherization Blitz',
    wonkLabel: 'DOE Residential Energy Efficiency Retrofit Corps',
    description: 'Funds heat pumps and attic seals for older family homes.',
    upside: 'Cuts home fuel bills (-0.06% inflation) and +0.5 approval',
    catchText: 'Grants add $2.5B a quarter to spending',
    civicNote: 'Home insulation grants lower winter heating bills for working families.',
    cloutCost: 0,
    tags: ['green', 'main_street'],
    effects: [
      { channel: 'inflation', amount: -0.06 },
      { channel: 'approval', amount: 0.5 },
      { channel: 'debtBn', amount: 2.5 },
    ],
  },

  // ---- TIER II: PRIORITY TASK FORCES (7 cards) ----
  {
    id: 'tf_semiconductor_fab',
    tier: 2,
    emoji: '🔬',
    name: 'Chip Foundry Task Force',
    wonkLabel: 'CHIPS Program Office Semiconductor Fab Directorate',
    description: 'Coordinates water, power, and training for new chip plants.',
    upside: 'Lifts potential growth (+0.10%) and output (+0.08%)',
    catchText: 'Costs 8 Clout and $4B a quarter in incentives',
    civicNote: 'Dedicated program offices speed up domestic computer chip factories.',
    cloutCost: 8,
    tags: ['industrial', 'security'],
    effects: [
      { channel: 'potential', amount: 0.1 },
      { channel: 'gap', amount: 0.08 },
      { channel: 'debtBn', amount: 4 },
    ],
  },
  {
    id: 'tf_junk_fee_strike',
    tier: 2,
    emoji: '💳',
    name: 'Hidden Fee Strike Force',
    wonkLabel: 'FTC-CFPB Consumer Junk Fee Enforcement Task Force',
    description: 'Bans surprise ticket, hotel, and bank overdraft charges.',
    upside: 'Popular (+1.2 approval) and cools prices (-0.08% inflation)',
    catchText: 'Costs 6 Clout and lobby pushback (-0.04% gap)',
    civicNote: 'Joint agency strike forces target deceptive consumer fees under existing law.',
    cloutCost: 6,
    tags: ['main_street', 'institutionalist'],
    effects: [
      { channel: 'approval', amount: 1.2 },
      { channel: 'inflation', amount: -0.08 },
      { channel: 'gap', amount: -0.04 },
    ],
  },
  {
    id: 'tf_bipartisan_liaison',
    tier: 2,
    emoji: '🤝',
    name: 'Capitol Hill Whip Liaison',
    wonkLabel: 'Office of Legislative Affairs Bipartisan Caucus Desk',
    description: 'Hosts weekly breakfast talks with undecided Hill moderates.',
    upside: 'Generates +4 Clout every quarter and +0.6 trust',
    catchText: 'Costs 8 Clout upfront to staff and launch',
    civicNote: 'Steady outreach to swing lawmakers builds political capital over time.',
    cloutCost: 8,
    tags: ['institutionalist'],
    effects: [
      { channel: 'clout', amount: 4 },
      { channel: 'trust', amount: 0.6 },
    ],
  },
  {
    id: 'tf_clean_hydrogen_hubs',
    tier: 2,
    emoji: '🔋',
    name: 'Regional Clean Energy Hubs',
    wonkLabel: 'Regional Clean Hydrogen & Battery Storage Hubs',
    description: 'Builds battery and clean fuel hubs near old steel towns.',
    upside: 'Lifts potential growth (+0.09%) and cools inflation (-0.07%)',
    catchText: 'Costs 7 Clout and $4B a quarter in hub grants',
    civicNote: 'Regional energy hubs pair clean power research with heavy industry jobs.',
    cloutCost: 7,
    tags: ['green', 'industrial'],
    effects: [
      { channel: 'potential', amount: 0.09 },
      { channel: 'inflation', amount: -0.07 },
      { channel: 'debtBn', amount: 4 },
    ],
  },
  {
    id: 'tf_allied_minerals',
    tier: 2,
    emoji: '⛏️',
    name: 'Allied Critical Minerals Pact',
    wonkLabel: 'Minerals Security Partnership Supply Accord',
    description: 'Shares lithium and copper mines with trusted trade allies.',
    upside: 'Cuts tech supply inflation (-0.10%) and boosts growth (+0.06% gap)',
    catchText: 'Costs 7 Clout and $3B a quarter in loan backing',
    civicNote: 'Executive mineral pacts secure battery metals without new tariff wars.',
    cloutCost: 7,
    tags: ['globalist', 'green', 'security'],
    effects: [
      { channel: 'inflation', amount: -0.1 },
      { channel: 'gap', amount: 0.06 },
      { channel: 'debtBn', amount: 3 },
    ],
  },
  {
    id: 'tf_apprenticeship_corps',
    tier: 2,
    emoji: '🛠️',
    name: 'Skilled Trades Academy Guild',
    wonkLabel: 'DOL Registered Apprenticeship Expansion Task Force',
    description: 'Pays union halls and tech colleges to train welders and nurses.',
    upside: 'Boosts job demand (+0.10% gap) and long-run growth (+0.06%)',
    catchText: 'Costs 6 Clout and $3.5B a quarter in training grants',
    civicNote: 'Earn-and-learn apprenticeships expand the skilled workforce without college debt.',
    cloutCost: 6,
    tags: ['main_street', 'industrial'],
    effects: [
      { channel: 'gap', amount: 0.1 },
      { channel: 'potential', amount: 0.06 },
      { channel: 'debtBn', amount: 3.5 },
    ],
  },
  {
    id: 'tf_customs_fentanyl',
    tier: 2,
    emoji: '🛃',
    name: 'Port Scanner Surge Task Force',
    wonkLabel: 'CBP Non-Intrusive Cargo Inspection Surge',
    description: 'Installs high-speed X-ray scanners at major border crossings.',
    upside: 'Lifts approval (+1.3) and public trust (+0.7)',
    catchText: 'Costs 7 Clout and $3.5B a quarter for scanners',
    civicNote: 'Cargo scanners catch contraband at ports of entry without slowing legal trade.',
    cloutCost: 7,
    tags: ['security'],
    effects: [
      { channel: 'approval', amount: 1.3 },
      { channel: 'trust', amount: 0.7 },
      { channel: 'debtBn', amount: 3.5 },
    ],
  },

  // ---- TIER III: STRATEGIC DIRECTIVES (5 cards) ----
  {
    id: 'tf_darpa_moonshot',
    tier: 3,
    emoji: '🚀',
    name: 'National Lab Moonshot Council',
    wonkLabel: 'ARPA-E & DARPA Dual-Use Innovation Directorate',
    description: 'Pushes top science labs to build clean fusion, AI, and new drugs.',
    upside: 'Surges long-run potential growth (+0.16%/yr)',
    catchText: 'Costs 14 Clout and $6B a quarter in lab funding',
    civicNote: 'Defense and energy research agencies seeded the internet, GPS, and microchips.',
    cloutCost: 14,
    tags: ['industrial', 'security', 'green'],
    effects: [
      { channel: 'potential', amount: 0.16 },
      { channel: 'debtBn', amount: 6 },
    ],
  },
  {
    id: 'tf_ethics_ombudsman',
    tier: 3,
    emoji: '⚖️',
    name: 'Independent Ethics Watchdog Charter',
    wonkLabel: 'Unified Executive Branch Ethics & Transparency Charter',
    description: 'Opens all White House visitor logs and lobbying talks to the public.',
    upside: 'Boosts trust (+1.6) and generates +5 Clout a quarter',
    catchText: 'Costs 12 Clout upfront and limits backroom favors',
    civicNote: 'Binding disclosure charters raise institutional trust across party lines.',
    cloutCost: 12,
    tags: ['institutionalist'],
    effects: [
      { channel: 'trust', amount: 1.6 },
      { channel: 'clout', amount: 5 },
    ],
  },
  {
    id: 'tf_indo_pacific_corridor',
    tier: 3,
    emoji: '🌊',
    name: 'Allied Maritime Trade Corridor',
    wonkLabel: 'Indo-Pacific & Atlantic Digital Freight Accord',
    description: 'Links allied ports with paperless customs and naval escorts.',
    upside: 'Cools inflation (-0.14%) and lifts output (+0.10% gap)',
    catchText: 'Costs 14 Clout and $4B a quarter in naval patrols',
    civicNote: 'Safe sea lanes and digital customs cut shipping costs for consumers.',
    cloutCost: 14,
    tags: ['globalist', 'security'],
    effects: [
      { channel: 'inflation', amount: -0.14 },
      { channel: 'gap', amount: 0.1 },
      { channel: 'debtBn', amount: 4 },
    ],
  },
  {
    id: 'tf_housing_supply_compact',
    tier: 3,
    emoji: '🏘️',
    name: 'Starter Home Zoning Compact',
    wonkLabel: 'HUD Pro-Housing Transit Zoning Incentive Compact',
    description: 'Rewards cities that legalize starter homes and duplexes near transit.',
    upside: 'Cools rent inflation (-0.13%) and boosts building jobs (+0.11% gap)',
    catchText: 'Costs 13 Clout and $5B a quarter in city infrastructure grants',
    civicNote: 'Federal transit grants can nudge local towns to allow more starter homes.',
    cloutCost: 13,
    tags: ['main_street', 'green'],
    effects: [
      { channel: 'inflation', amount: -0.13 },
      { channel: 'gap', amount: 0.11 },
      { channel: 'debtBn', amount: 5 },
    ],
  },
  {
    id: 'tf_fiscal_commission',
    tier: 3,
    emoji: '📉',
    name: 'Bipartisan Debt Reduction Board',
    wonkLabel: 'BRAC-Style Fiscal Solvency & Program Consolidation Board',
    description: 'Merges duplicate offices and sells off empty buildings.',
    upside: 'Cuts deficit by $9B a quarter and lifts trust (+1.0)',
    catchText: 'Costs 13 Clout and trims approval (-0.8) from office closures',
    civicNote: 'Independent base-closing boards help lawmakers cut waste without local blame.',
    cloutCost: 13,
    tags: ['institutionalist', 'main_street'],
    effects: [
      { channel: 'debtBn', amount: -9 },
      { channel: 'trust', amount: 1.0 },
      { channel: 'approval', amount: -0.8 },
    ],
  },

  // ---- TIER IV: HISTORIC MANDATES (4 cards) ----
  {
    id: 'tf_american_arsenal_compact',
    tier: 4,
    emoji: '🦅',
    name: 'Arsenal of Innovation Doctrine',
    wonkLabel: 'Defense Production Act Title III Industrial Mobilization',
    description: 'Mobilizes home factories to lead the world in chips, ships, and clean steel.',
    upside: 'Surges potential (+0.22%), output (+0.14% gap), and approval (+1.5)',
    catchText: 'Costs 20 Clout and adds $8B a quarter in mobilization outlays',
    civicNote: 'Title III of the Defense Production Act lets presidents fund critical home industries.',
    cloutCost: 20,
    tags: ['industrial', 'security', 'green'],
    effects: [
      { channel: 'potential', amount: 0.22 },
      { channel: 'gap', amount: 0.14 },
      { channel: 'approval', amount: 1.5 },
      { channel: 'debtBn', amount: 8 },
    ],
  },
  {
    id: 'tf_second_bill_of_rights',
    tier: 4,
    emoji: '🏛️',
    name: 'Working Family Prosperity Charter',
    wonkLabel: 'National Household Wage & Cost-of-Living Compact',
    description: 'Combines hospital price caps, overtime pay rules, and child care hubs.',
    upside: 'Lifts approval (+2.0), output (+0.15% gap), and cools prices (-0.12%)',
    catchText: 'Costs 22 Clout and $9B a quarter in family support',
    civicNote: 'Broad working-family charters unite urban and rural voters around kitchen-table pay.',
    cloutCost: 22,
    tags: ['main_street', 'institutionalist'],
    effects: [
      { channel: 'approval', amount: 2.0 },
      { channel: 'gap', amount: 0.15 },
      { channel: 'inflation', amount: -0.12 },
      { channel: 'debtBn', amount: 9 },
    ],
  },
  {
    id: 'tf_bretton_woods_renewal',
    tier: 4,
    emoji: '🌍',
    name: 'Free World Trade & Monetary Accord',
    wonkLabel: 'Modernized Atlantic-Pacific Commercial & Reserve Accord',
    description: 'Sets fair trade and stable money rules with thirty friendly nations.',
    upside: 'Cools inflation (-0.18%), lifts potential (+0.15%), and +4 Clout/qtr',
    catchText: 'Costs 20 Clout and sparks tariff-hawk pushback (-0.5 approval)',
    civicNote: 'Grand trade accords lower consumer prices and cement long-term alliance leadership.',
    cloutCost: 20,
    tags: ['globalist', 'institutionalist', 'green'],
    effects: [
      { channel: 'inflation', amount: -0.18 },
      { channel: 'potential', amount: 0.15 },
      { channel: 'clout', amount: 4 },
      { channel: 'approval', amount: -0.5 },
    ],
  },
  {
    id: 'tf_Madisonian_renewal',
    tier: 4,
    emoji: '📜',
    name: 'Constitutional Renewal Mandate',
    wonkLabel: 'Article I-II Institutional Equilibrium & Civic Renewal Compact',
    description: 'Brings back on-time budgets, fast court dates, and fair audits.',
    upside: 'Surges trust (+2.4), generates +7 Clout/qtr, and saves $6B/qtr',
    catchText: 'Costs 20 Clout upfront to bind executive agencies',
    civicNote: 'Lasting constitutional norms earn deep public trust and steady legislative clout.',
    cloutCost: 20,
    tags: ['institutionalist', 'security'],
    effects: [
      { channel: 'trust', amount: 2.4 },
      { channel: 'clout', amount: 7 },
      { channel: 'debtBn', amount: -6 },
    ],
  },
] as const;

/** 9 Evil Mode Heist Relics & Fixer Syndicate cards (HEIST-01). */
export const EVIL_HEIST_RELICS_CATALOG: readonly PerkDefinition[] = [
  {
    id: 'relic_cayman_trust',
    tier: 1,
    emoji: '🏝️',
    name: 'Numbered Cayman Shell Trust',
    wonkLabel: 'Bearer-Share Sovereign Feeder Entity',
    description: 'Routes consulting fees through three island shell companies.',
    upside: 'Skims +$3.5B offshore right away',
    catchText: 'Adds +4 Heat and trims public trust (-0.8)',
    civicNote: 'Opaque offshore trusts hide beneficial ownership from ethics watchdogs.',
    cloutCost: 0,
    tags: ['shell_network'],
    evilOnly: true,
    evilStashBonusBn: 3.5,
    evilHeatDelta: 4,
    effects: [{ channel: 'trust', amount: -0.8 }],
  },
  {
    id: 'relic_bagman_retainer',
    tier: 1,
    emoji: '🕵️',
    name: 'Fixer Law Firm Retainer',
    wonkLabel: 'Privileged Crisis Litigation Shield',
    description: 'Keeps a team of fixers on call to bury ethics tips.',
    upside: 'Launders -5 Heat right away and adds +3 Clout/qtr',
    catchText: 'Costs 4 Clout and trims trust (-0.5)',
    civicNote: 'Nondisclosure retainers stall congressional investigators and whistleblowers.',
    cloutCost: 4,
    tags: ['fixer_ring'],
    evilOnly: true,
    evilStashBonusBn: 1.5,
    evilHeatDelta: -5,
    effects: [
      { channel: 'clout', amount: 3 },
      { channel: 'trust', amount: -0.5 },
    ],
  },
  {
    id: 'relic_acting_directors',
    tier: 1,
    emoji: '🏛️',
    name: 'Permanent Acting Agency Chiefs',
    wonkLabel: 'Vacancies Reform Act Loophole Appointments',
    description: 'Bypasses Senate votes by installing loyalists as acting chiefs.',
    upside: 'Skims +$2.5B and adds +4 Clout/qtr',
    catchText: 'Adds +3 Heat and erodes trust (-1.0)',
    civicNote: 'Overusing acting appointments sidesteps constitutional Senate confirmation.',
    cloutCost: 0,
    tags: ['captured_regulators'],
    evilOnly: true,
    evilStashBonusBn: 2.5,
    evilHeatDelta: 3,
    effects: [
      { channel: 'clout', amount: 4 },
      { channel: 'trust', amount: -1.0 },
    ],
  },
  {
    id: 'relic_crypto_mixer',
    tier: 2,
    emoji: '🪙',
    name: 'Sovereign Token Mixer Desk',
    wonkLabel: 'Unhosted Offshore Liquidity Laundering Pool',
    description: 'Washes donor kickbacks through offshore digital token pools.',
    upside: 'Skims +$6.5B to your offshore stash',
    catchText: 'Costs 6 Clout and adds +6 Heat',
    civicNote: 'Unregulated token mixers obscure cross-border influence payments.',
    cloutCost: 6,
    tags: ['shell_network', 'fixer_ring'],
    evilOnly: true,
    evilStashBonusBn: 6.5,
    evilHeatDelta: 6,
    effects: [{ channel: 'trust', amount: -1.2 }],
  },
  {
    id: 'relic_inspector_gag_order',
    tier: 2,
    emoji: '🤐',
    name: 'Watchdog Gag Rule Directive',
    wonkLabel: 'Pre-Clearance Counsel Review of IG Reports',
    description: 'Forces agency watchdogs to clear all reports with your lawyers first.',
    upside: 'Launders -9 Heat and skims +$3.0B',
    catchText: 'Costs 8 Clout and hurts trust (-1.4)',
    civicNote: 'Gagging inspectors general blinds Congress to waste, fraud, and abuse.',
    cloutCost: 8,
    tags: ['captured_regulators', 'fixer_ring'],
    evilOnly: true,
    evilStashBonusBn: 3.0,
    evilHeatDelta: -9,
    effects: [{ channel: 'trust', amount: -1.4 }],
  },
  {
    id: 'relic_no_bid_clearinghouse',
    tier: 2,
    emoji: '💼',
    name: 'VIP Procurement Tollbooth',
    wonkLabel: 'Sole-Source Emergency Waiver Clearinghouse',
    description: 'Routes all emergency supply contracts through friendly donor firms.',
    upside: 'Skims +$7.5B to offshore accounts',
    catchText: 'Costs 8 Clout, +7 Heat, and $5B/qtr in budget waste',
    civicNote: 'Sole-source waivers let insiders mark up federal contracts without bidding.',
    cloutCost: 8,
    tags: ['captured_regulators', 'shell_network'],
    evilOnly: true,
    evilStashBonusBn: 7.5,
    evilHeatDelta: 7,
    effects: [
      { channel: 'debtBn', amount: 5 },
      { channel: 'trust', amount: -1.2 },
    ],
  },
  {
    id: 'relic_swiss_numbered_vault',
    tier: 3,
    emoji: '🏦',
    name: 'Diplomatic Pouch Bullion Syndicate',
    wonkLabel: 'Extraterritorial Sovereign Courier Pipeline',
    description: 'Moves kickback proceeds through diplomatic pouches beyond customs checks.',
    upside: 'Skims +$11.0B and launders -4 Heat',
    catchText: 'Costs 12 Clout and erodes trust (-1.8)',
    civicNote: 'Abusing diplomatic immunity for private wealth violates international treaties.',
    cloutCost: 12,
    tags: ['shell_network', 'fixer_ring'],
    evilOnly: true,
    evilStashBonusBn: 11.0,
    evilHeatDelta: -4,
    effects: [{ channel: 'trust', amount: -1.8 }],
  },
  {
    id: 'relic_shadow_pardon_desk',
    tier: 3,
    emoji: '🖋️',
    name: 'Backchannel Clemency Broker',
    wonkLabel: 'Parallel White House Clemency & Immunity Desk',
    description: 'Promises secret pardons so aides stay quiet under oath.',
    upside: 'Launders -14 Heat and adds +5 Clout/qtr',
    catchText: 'Costs 14 Clout and sparks public outrage (-1.5 approval)',
    civicNote: 'Trading clemency to block investigations subverts the rule of law.',
    cloutCost: 14,
    tags: ['fixer_ring', 'captured_regulators'],
    evilOnly: true,
    evilStashBonusBn: 4.5,
    evilHeatDelta: -14,
    effects: [
      { channel: 'clout', amount: 5 },
      { channel: 'approval', amount: -1.5 },
      { channel: 'trust', amount: -2.0 },
    ],
  },
  {
    id: 'relic_sovereign_plunder_charter',
    tier: 4,
    emoji: '👑',
    name: 'Shadow Sovereign Wealth Fund',
    wonkLabel: 'Unappropriated Executive Concession Syndicate',
    description: 'Sends oil fees and tariff breaks into a private family fund.',
    upside: 'Skims +$16.0B offshore and launders -6 Heat',
    catchText: 'Costs 18 Clout, $7B/qtr debt, and -2.2 trust',
    civicNote: 'Diverting public revenues into private funds is the hallmark of kleptocracy.',
    cloutCost: 18,
    tags: ['shell_network', 'fixer_ring', 'captured_regulators'],
    evilOnly: true,
    evilStashBonusBn: 16.0,
    evilHeatDelta: -6,
    effects: [
      { channel: 'debtBn', amount: 7 },
      { channel: 'trust', amount: -2.2 },
    ],
  },
] as const;

export const ALL_PERKS_CATALOG: readonly PerkDefinition[] = [
  ...STANDARD_PERKS_CATALOG,
  ...EVIL_HEIST_RELICS_CATALOG,
];

export function getPerk(id: string): PerkDefinition | undefined {
  return ALL_PERKS_CATALOG.find((p) => p.id === id);
}
