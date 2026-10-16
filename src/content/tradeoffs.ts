// Unified Plain-Talk & Trade-Off Metadata Catalog (Phase 35, COPY-01..03).
// Provides dual-layer (Plain Talk vs Policy Wonk) labels, emojis, witty advisor "Why click this?" notes,
// and explicit 👍 Upside / ⚠️ The Catch pairs for engine levers without mutating pure GameState hashes.

import type { PackageName } from '../engine/budget';
import type { DealId, FilibusterRule, GroupId } from '../engine/congress';
import type { CrisisEffect } from '../engine/crises';
import type { DefensePosture, SanctionType } from '../engine/foreign';
import type { ReformId } from '../engine/reforms';
import type { AmendmentId } from '../engine/amendments';

export interface LeverDirectionTradeoff {
  readonly id: string;
  readonly emoji: string;
  readonly plainLabel: string;
  readonly wonkLabel: string;
  readonly statutoryBasis: string;
  readonly whyClick: string;
  readonly raiseUpside: string;
  readonly raiseCatch: string;
  readonly cutUpside: string;
  readonly cutCatch: string;
}

export interface ActionTradeoffMeta {
  readonly emoji: string;
  readonly plainLabel: string;
  readonly wonkLabel: string;
  readonly plainDescription: string;
  readonly whyClick: string;
  readonly upside: string;
  readonly catchText: string;
  readonly statutoryBasis: string;
}

export const BUDGET_LEVER_TRADEOFFS: Readonly<Record<string, LeverDirectionTradeoff>> = {
  inc: {
    id: 'inc',
    emoji: '🧾',
    plainLabel: 'Income tax',
    wonkLabel: 'Individual Income Tax Effective Rate (IRC § 1)',
    statutoryBasis: 'Internal Revenue Code 26 U.S.C. § 1',
    whyClick: 'Your biggest tax lever: moves trillions in debt and monthly family paychecks.',
    raiseUpside: 'Slashes the deficit by $1.2T per point',
    raiseCatch: 'Costs families $40/mo per point and slows growth',
    cutUpside: 'Adds +$40/mo per point to family paychecks',
    cutCatch: 'Adds $1.2T per point to the 10-year debt',
  },
  bus: {
    id: 'bus',
    emoji: '🏢',
    plainLabel: 'Business tax',
    wonkLabel: 'Corporate Income Tax Statutory Rate (IRC § 11)',
    statutoryBasis: 'Internal Revenue Code 26 U.S.C. § 11',
    whyClick: 'Raise revenue from big firms with very little hit to family wallets.',
    raiseUpside: 'Cuts the deficit $210B/pt with tiny family hit',
    raiseCatch: 'Trims business hiring and growth speed',
    cutUpside: 'Spurs faster business hiring and growth',
    cutCatch: 'Adds $210B/pt to the 10-year deficit',
  },
  inv: {
    id: 'inv',
    emoji: '📈',
    plainLabel: 'Investment tax',
    wonkLabel: 'Long-Term Capital Gains & Dividend Rate (IRC § 1(h))',
    statutoryBasis: 'Internal Revenue Code 26 U.S.C. § 1(h)',
    whyClick: 'Tax stock market gains to narrow the wealth gap and trim debt.',
    raiseUpside: 'Narrows the wealth gap and trims $100B/pt in debt',
    raiseCatch: 'Slightly cools stock market investment',
    cutUpside: 'Boosts capital investment and market mood',
    cutCatch: 'Widens the wealth gap and adds $100B/pt debt',
  },
  pay: {
    id: 'pay',
    emoji: '👷',
    plainLabel: 'Payroll tax',
    wonkLabel: 'FICA Social Security & Medicare Payroll Tax (IRC § 3101)',
    statutoryBasis: 'Federal Insurance Contributions Act, 26 U.S.C. § 3101',
    whyClick: 'Every tenth of a point moves huge cash, but hits every worker stub.',
    raiseUpside: 'Raises huge cash to shore up trust funds',
    raiseCatch: 'Shrinks every worker paycheck right away',
    cutUpside: 'Boosts take-home pay for every working family',
    cutCatch: 'Drains trust funds and adds fast debt',
  },
  tar: {
    id: 'tar',
    emoji: '🚢',
    plainLabel: 'Tariffs on imports',
    wonkLabel: 'Effective Customs Duty Rate on Imported Goods',
    statutoryBasis: 'Tariff Act of 1930 & Trade Act of 1974',
    whyClick: 'Raises customs cash, but high tariffs spike store prices and hurt growth.',
    raiseUpside: 'Brings in $180B/pt in customs cash',
    raiseCatch: 'Raises store prices and invites foreign pushback',
    cutUpside: 'Lowers store prices and boosts trade growth',
    cutCatch: 'Gives up customs cash and upsets tariff hawks',
  },
  def: {
    id: 'def',
    emoji: '🛡️',
    plainLabel: 'Defense budget',
    wonkLabel: 'National Defense Discretionary Budget Authority (050)',
    statutoryBasis: 'Annual National Defense Authorization Act (NDAA)',
    whyClick: 'Wins defence hawks in Congress or frees up $100B per point when cut.',
    raiseUpside: 'Boosts defense plant jobs and wins hawks',
    raiseCatch: 'Adds $100B/pt to the 10-year deficit',
    cutUpside: 'Saves $100B/pt to fund home priorities',
    cutCatch: 'Slows defense plants and upsets security hawks',
  },
  ssm: {
    id: 'ssm',
    emoji: '👵',
    plainLabel: 'Social Security & Medicare',
    wonkLabel: 'OASDI & HI Mandatory Benefit Formula Outlays',
    statutoryBasis: 'Social Security Act Titles II & XVIII',
    whyClick: 'The "third rail" of politics: seniors love boosts and punish cuts.',
    raiseUpside: 'Lifts senior income, health, and voter goodwill',
    raiseCatch: 'Very costly: adds $250B/pt to the deficit',
    cutUpside: 'Saves $250B/pt on the biggest budget line',
    cutCatch: 'Hurts senior wallets and sparks voter anger',
  },
  mcd: {
    id: 'mcd',
    emoji: '🏥',
    plainLabel: 'Medicaid health aid',
    wonkLabel: 'Title XIX Federal-State Medicaid Matching Grants',
    statutoryBasis: 'Social Security Act Title XIX, 42 U.S.C. § 1396',
    whyClick: 'Helps low-income families see a doctor and narrows the wealth gap for a fair cost.',
    raiseUpside: 'Lifts family health, life span, and fairness',
    raiseCatch: 'Adds $60B/pt to the 10-year deficit',
    cutUpside: 'Trims $60B/pt from federal health spending',
    cutCatch: 'Leaves more families with unpaid hospital bills',
  },
  rds: {
    id: 'rds',
    emoji: '🌉',
    plainLabel: 'Roads & bridges',
    wonkLabel: 'Federal-Aid Highway & Transit Capital Outlays',
    statutoryBasis: '23 U.S.C. § 101 (Surface Transportation)',
    whyClick: 'High bang for the buck: builds real growth for only $12B per point.',
    raiseUpside: 'High growth boost (+0.03/pt) for low debt cost',
    raiseCatch: 'Adds $12B/pt to borrowing and takes time',
    cutUpside: 'Saves $12B/pt in construction spending',
    cutCatch: 'Potholes and slow freight drag down growth',
  },
  rnd: {
    id: 'rnd',
    emoji: '🔬',
    plainLabel: 'Science & research',
    wonkLabel: 'Federal R&D Discretionary Outlays (NSF, NIH, DOE)',
    statutoryBasis: '42 U.S.C. § 1861 (National Science Foundation Act)',
    whyClick: 'Plants the seeds for long-term economic speed at a bargain price.',
    raiseUpside: 'Strong long-run growth boost (+0.03/pt)',
    raiseCatch: 'Costs $20B/pt now; payoff takes a few years',
    cutUpside: 'Saves $20B/pt in lab and grant funding',
    cutCatch: 'Slows future tech and productivity growth',
  },
  oth: {
    id: 'oth',
    emoji: '🏛️',
    plainLabel: 'Other agencies',
    wonkLabel: 'Non-Defense Discretionary Domestic Agency Operations',
    statutoryBasis: 'Annual Omnibus Appropriations Acts',
    whyClick: 'Funds parks, courts, food inspectors, and weather forecasts.',
    raiseUpside: 'Helps public parks, courts, and agency speed',
    raiseCatch: 'Adds $70B/pt to the 10-year deficit',
    cutUpside: 'Saves $70B/pt and pleases fiscal hawks',
    cutCatch: 'Slows agency services and trims growth',
  },
};

export function getBudgetLeverTradeoff(
  id: string,
  currentVal: number,
  baseVal: number,
): {
  emoji: string;
  plainLabel: string;
  wonkLabel: string;
  statutoryBasis: string;
  whyClick: string;
  upside: string;
  catchText: string;
  impactScore: number;
} {
  const meta = BUDGET_LEVER_TRADEOFFS[id] ?? BUDGET_LEVER_TRADEOFFS.inc!;
  const diff = currentVal - baseVal;
  if (diff > 0) {
    return {
      emoji: meta.emoji,
      plainLabel: `${meta.plainLabel} (Raised)`,
      wonkLabel: meta.wonkLabel,
      statutoryBasis: meta.statutoryBasis,
      whyClick: meta.whyClick,
      upside: meta.raiseUpside,
      catchText: meta.raiseCatch,
      impactScore: 1,
    };
  }
  if (diff < 0) {
    return {
      emoji: meta.emoji,
      plainLabel: `${meta.plainLabel} (Cut)`,
      wonkLabel: meta.wonkLabel,
      statutoryBasis: meta.statutoryBasis,
      whyClick: meta.whyClick,
      upside: meta.cutUpside,
      catchText: meta.cutCatch,
      impactScore: -1,
    };
  }
  return {
    emoji: meta.emoji,
    plainLabel: `${meta.plainLabel} (Unchanged)`,
    wonkLabel: meta.wonkLabel,
    statutoryBasis: meta.statutoryBasis,
    whyClick: meta.whyClick,
    upside: `Raise: ${meta.raiseUpside}`,
    catchText: `Cut: ${meta.cutCatch}`,
    impactScore: 0,
  };
}

export const BUDGET_PACKAGE_TRADEOFFS: Readonly<Record<PackageName, ActionTradeoffMeta>> = {
  'Keep as is': {
    emoji: '⚓',
    plainLabel: 'Keep as is',
    wonkLabel: 'Current Law Baseline (CBO Current-Law Projection)',
    plainDescription: 'Keep current tax rates and agency budgets unchanged.',
    whyClick: 'Hold steady when the economy is calm or you want to save Clout for other fights.',
    upside: 'Zero new deficit shock or tax hike anger',
    catchText: 'Leaves existing growth or debt trends untouched',
    statutoryBasis: 'Congressional Budget Act of 1974 Baseline',
  },
  'Tax cut': {
    emoji: '💵',
    plainLabel: 'Tax cut',
    wonkLabel: 'Broad Rate Reduction Reconciliation Package',
    plainDescription: 'Cuts income, business, and stock taxes to boost family wallets now.',
    whyClick: 'Gives families +$134/mo and juices short-term growth, but piles on debt.',
    upside: 'Adds +$134/mo to family wallets & boosts growth',
    catchText: 'Adds $4.7T to the 10-year deficit & heats inflation',
    statutoryBasis: '2 U.S.C. § 641 (Budget Reconciliation)',
  },
  'Infrastructure push': {
    emoji: '🏗️',
    plainLabel: 'Infrastructure push',
    wonkLabel: 'Public Capital & R&D Investment Package',
    plainDescription: 'Boosts roads, bridges, and science labs by 5% to 15%.',
    whyClick: 'Best long-run growth builder (+0.60 growth) with a tiny deficit tag.',
    upside: 'Lifts economy speed (+0.60) and family pay (+$5/mo)',
    catchText: 'Adds $0.3T to 10-year borrowing',
    statutoryBasis: 'Surface Transportation & R&D Authorizations',
  },
  'Balance the budget': {
    emoji: '⚖️',
    plainLabel: 'Balance the budget',
    wonkLabel: 'Deficit Reduction & Fiscal Consolidation Act',
    plainDescription: 'Raises income taxes 3 pts and trims agency and defense spending.',
    whyClick: 'Slashes $5.2T off the national debt to calm bond markets and inflation.',
    upside: 'Cuts 10-year deficit by $5.2T and cools inflation',
    catchText: 'Costs families $122/mo and slows short-term growth',
    statutoryBasis: '2 U.S.C. § 641 (Deficit Reduction Reconciliation)',
  },
};

export const SANCTION_TRADEOFFS: Readonly<Record<SanctionType, ActionTradeoffMeta>> = {
  asset_freeze: {
    emoji: '🏦',
    plainLabel: 'Freeze Foreign Tycoon Bank Accounts',
    wonkLabel: 'Targeted Financial Asset Freezes (IEEPA / OFAC)',
    plainDescription: 'Locks foreign regime leaders and oligarchs out of US banks.',
    whyClick: 'Hits foreign bad actors and lifts safety with almost zero price pain at home.',
    upside: 'Boosts security index (+4) with tiny price impact',
    catchText: 'Costs 10 Clout and nudges inflation +0.05%',
    statutoryBasis: 'International Emergency Economic Powers Act (IEEPA), 50 U.S.C. § 1701',
  },
  export_controls: {
    emoji: '🚫',
    plainLabel: 'Block High-Tech & Chip Sales Abroad',
    wonkLabel: 'Advanced Technology & Defense Export Restrictions (ECRA)',
    plainDescription: 'Bans selling top US computer chips and jet parts to rival militaries.',
    whyClick: 'Slows down rival military tech, though home tech firms lose some foreign sales.',
    upside: 'Slows rival military tech & lifts security (+6)',
    catchText: 'Trims US tech exports (−0.15% output gap)',
    statutoryBasis: 'Export Control Reform Act of 2018 (ECRA), 50 U.S.C. § 4811',
  },
  energy_embargo: {
    emoji: '🛢️',
    plainLabel: 'Block Sanctioned Oil Tankers',
    wonkLabel: 'Maritime Energy Shipping & Secondary Sanctions (CAATSA)',
    plainDescription: 'Fines foreign ships and firms that carry blocked crude oil.',
    whyClick: 'Your toughest sanction to starve a rival war chest, but it spikes gas prices at home.',
    upside: 'Hits rival oil cash hard & lifts security (+8)',
    catchText: 'Spikes gas prices (+0.35% inflation) & slows growth',
    statutoryBasis: "Countering America's Adversaries Through Sanctions Act (CAATSA), 22 U.S.C. § 9401",
  },
};

export const DEFENSE_POSTURE_TRADEOFFS: Readonly<Record<DefensePosture, ActionTradeoffMeta>> = {
  peacetime: {
    emoji: '🕊️',
    plainLabel: 'Peacetime Drawdown',
    wonkLabel: 'Reduced Forward Readiness Posture (−$6B/qtr)',
    plainDescription: 'Brings overseas patrols home to save money during quiet times.',
    whyClick: 'Saves $6B every quarter when the world is calm, but leaves less deterrence.',
    upside: 'Saves $6B/qtr ($24B/yr) in defense costs',
    catchText: 'Lowers global deterrence if a crisis hits',
    statutoryBasis: 'Title 10 U.S.C. Armed Forces Force Posture',
  },
  standard: {
    emoji: '⚓',
    plainLabel: 'Standard Deterrence',
    wonkLabel: 'Baseline Forward Deterrence Posture ($0/qtr delta)',
    plainDescription: 'Keeps normal carrier patrols and allied base staffing.',
    whyClick: 'Steady fleet patrols that keep allies calm without new debt.',
    upside: 'Keeps allies safe with zero new debt',
    catchText: 'Does not add extra deterrence during a crisis',
    statutoryBasis: 'Title 10 U.S.C. Armed Forces Force Posture',
  },
  surge: {
    emoji: '🚢',
    plainLabel: 'Global Carrier Surge',
    wonkLabel: 'High-Readiness Forward Surge Deployment (+$12B/qtr)',
    plainDescription: 'Sends extra carrier groups and air wings to global hotspots.',
    whyClick: 'Gives you top defense strength and crisis speed at a steep $12B/qtr cost.',
    upside: 'Top defense shield and fast crisis response',
    catchText: 'Adds $12B every quarter ($48B/yr) to debt',
    statutoryBasis: 'Title 10 U.S.C. Armed Forces Force Posture',
  },
};

export const DEAL_TRADEOFFS: Readonly<Record<DealId, ActionTradeoffMeta>> = {
  mod: {
    emoji: '🛣️',
    plainLabel: 'Local Projects for Moderates',
    wonkLabel: 'Surface Transportation & District Earmark Concession',
    plainDescription: 'Add local bridge and clinic projects in moderate districts.',
    whyClick: 'Our biggest vote-getter: locks in +12 House votes and +3 Senate votes.',
    upside: '+12 House votes & +3 Senate crossover votes',
    catchText: 'Costs 20 Clout from your political bank',
    statutoryBasis: 'House Rule XXI Earmark & Community Project Funding',
  },
  cen: {
    emoji: '✂️',
    plainLabel: 'Deficit Trim for Centrists',
    wonkLabel: 'Bipartisan PAYGO Offset & Sunset Concession',
    plainDescription: 'Trim the bill price tag by 10% to win deficit-conscious centrists.',
    whyClick: 'Best value for the Senate: adds +4 Senate votes and +9 House votes for 15 Clout.',
    upside: '+9 House votes & +4 Senate crossover votes',
    catchText: 'Costs 15 Clout to negotiate',
    statutoryBasis: 'Statutory Pay-As-You-Go Act (PAYGO)',
  },
  spc: {
    emoji: '🎙️',
    plainLabel: 'Barnstorm Swing Districts',
    wonkLabel: 'Presidential Bully Pulpit Swing-District Whip Tour',
    plainDescription: 'Hold town halls in purple districts to pressure wavering lawmakers.',
    whyClick: 'Cheapest deal (10 Clout) when you just need 6 last-minute votes to pass.',
    upside: '+6 House votes & +3 Senate votes for 10 Clout',
    catchText: 'Smaller vote haul than full policy deals',
    statutoryBasis: 'Article II Bully Pulpit & Public Persuasion',
  },
};

export const BLOC_EXPLAINERS: Readonly<Record<GroupId, { emoji: string; plainNote: string; wonkNote: string }>> = {
  pro: {
    emoji: '🌱',
    plainNote: 'Loves health aid, clean power, and schools; dislikes oil leases.',
    wonkNote: 'Progressive Caucus (95 seats): High elasticity to social outlays and decarbonization.',
  },
  mod: {
    emoji: '🏡',
    plainNote: 'Wants practical help for local schools, clinics, and roads.',
    wonkNote: 'Mainstream Coalition (100 seats): Swing bloc responsive to district capital grants.',
  },
  cen: {
    emoji: '⚖️',
    plainNote: 'Rewards balanced bills that pair border or energy steps with reform.',
    wonkNote: 'Problem Solvers / Pivot Bloc (45 seats): Pivotal for Senate cloture crossover.',
  },
  con: {
    emoji: '🦅',
    plainNote: 'Backs border checks, oil drilling, and lower spending.',
    wonkNote: 'Study Committee (140 seats): Favors supply-side leasing and border enforcement.',
  },
  fre: {
    emoji: '🔥',
    plainNote: 'Hardline deficit hawks who vote no on almost any new spending.',
    wonkNote: 'Hardline Fiscal Bloc (55 seats): Opposes mandatory or discretionary expansion.',
  },
};

export const FILIBUSTER_TRADEOFFS: Readonly<Record<FilibusterRule, ActionTradeoffMeta>> = {
  sixty_vote: {
    emoji: '🏛️',
    plainLabel: '60-Vote Supermajority (Current Rule)',
    wonkLabel: 'Senate Rule XXII 60-Vote Cloture Threshold',
    plainDescription: 'Major bills need 60 out of 100 senators to end debate and vote.',
    whyClick: 'Costs 0 Clout and keeps institutional trust high, but makes big bills hard to pass.',
    upside: 'Costs 0 Clout & protects Senate norms',
    catchText: 'Needs 60 Senate votes to pass major bills',
    statutoryBasis: 'Standing Rules of the Senate, Rule XXII',
  },
  talking_filibuster: {
    emoji: '🗣️',
    plainLabel: 'Talking Filibuster (Mr. Smith Style)',
    wonkLabel: 'Continuous Floor Speech Cloture Reform',
    plainDescription: 'Senators blocking a bill must stay on their feet talking non-stop.',
    whyClick: 'When your approval is above 50%, public pressure lowers the votes needed to pass.',
    upside: 'Lowers vote bar down to 52 when you are popular',
    catchText: 'Costs 25 Clout; stays at 60 if approval is low',
    statutoryBasis: 'Senate Rule XIX Continuous Debate Enforcement',
  },
  fifty_five_vote: {
    emoji: '🤝',
    plainLabel: '55-Vote Compromise Rule',
    wonkLabel: 'Modified 55-Vote Bipartisan Cloture Threshold',
    plainDescription: 'Lowers the Senate hurdle from 60 votes to 55 votes.',
    whyClick: 'Makes bipartisan bills much easier to pass without blowing up the whole Senate.',
    upside: 'Drops Senate bar by 5 full votes (to 55)',
    catchText: 'Costs 35 Clout in Senate arm-twisting',
    statutoryBasis: 'Senate Rule XXII Threshold Modification',
  },
  simple_majority: {
    emoji: '☢️',
    plainLabel: '51-Vote Rule (End the Filibuster)',
    wonkLabel: 'Simple Majority Cloture Precedent (51 Votes)',
    plainDescription: 'Ends the filibuster so 51 senators can pass any bill.',
    whyClick: 'Lets your party pass almost anything with 51 votes, at a steep 50 Clout price.',
    upside: 'Pass any bill with just 51 Senate votes',
    catchText: 'Costs 50 Clout to force through the Senate',
    statutoryBasis: 'Article I, Section 5 Majority Rule Precedent',
  },
};

export const REFORM_TRADEOFFS: Readonly<Record<ReformId, ActionTradeoffMeta>> = {
  scotus_term_limits: {
    emoji: '⏳',
    plainLabel: '18-Year Supreme Court Term Limits',
    wonkLabel: 'Statutory Active-Appellate Rotation Act (28 U.S.C. § 1)',
    plainDescription: 'Gives each justice an 18-year active term, with a new pick every two years.',
    whyClick: 'Lowers the chance the Court strikes down your orders, if it survives a lawsuit.',
    upside: 'Shifts Court balance & lifts trust (+3)',
    catchText: '30 Clout & 60% risk the Court strikes it down',
    statutoryBasis: 'Article III Good Behavior Clause & 28 U.S.C. § 294',
  },
  statutory_ethics_code: {
    emoji: '📋',
    plainLabel: 'Supreme Court Gift & Ethics Rules',
    wonkLabel: 'Supreme Court Ethics, Recusal & Transparency Act',
    plainDescription: 'Requires justices to report gifts and step aside when they have a conflict.',
    whyClick: 'Safest court reform: boosts public trust (+4) and approval (+1) for only 20 Clout.',
    upside: 'Lifts public trust (+4) with only 10% strike risk',
    catchText: 'Costs 20 Clout; does not change Court seats',
    statutoryBasis: '28 U.S.C. § 455 Judicial Disqualification & Ethics',
  },
  court_expansion: {
    emoji: '⚖️',
    plainLabel: 'Add 2 Seats to the Supreme Court',
    wonkLabel: 'Judiciary Act Bench Expansion (9 to 11 Justices)',
    plainDescription: 'Expands the Supreme Court from 9 to 11 justices so you can fill two seats now.',
    whyClick: 'Protects your boldest executive orders from being struck down, but sparks huge backlash.',
    upside: 'Cuts court strike-down risk by 30% right away',
    catchText: 'Costs 50 Clout, −6 trust, and −3 approval',
    statutoryBasis: 'Article III, Section 1 & Judiciary Act Precedent',
  },
  rcv_incentives: {
    emoji: '🗳️',
    plainLabel: 'Ranked-Choice Voting State Grants',
    wonkLabel: 'Voter Choice & Instant-Runoff Election Administration Grants',
    plainDescription: 'Helps states let voters rank their top choices on the ballot.',
    whyClick: 'Boosts voter turnout (+1.5%) and public trust (+2) for a modest cost.',
    upside: 'Lifts turnout (+1.5%), trust (+2), & approval (+1)',
    catchText: 'Costs 25 Clout and $4B in state grants',
    statutoryBasis: 'Article I, Section 4 Elections Clause Grants',
  },
  independent_redistricting: {
    emoji: '🗺️',
    plainLabel: 'Fair Voting Maps (No Rigged Lines)',
    wonkLabel: 'Independent Citizen Redistricting Commission Grants',
    plainDescription: 'Funds voter map boards so lawmakers cannot rig their own House seats.',
    whyClick: 'Creates 15 fair swing districts and boosts public trust (+3) and turnout (+1%).',
    upside: '+3 trust, +1% turnout, & 15 fair House districts',
    catchText: 'Costs 30 Clout and $6B in state grants',
    statutoryBasis: 'Article I, Section 4 Congressional Districting',
  },
  small_dollar_matching: {
    emoji: '🪙',
    plainLabel: '6-to-1 Small Donor Matching',
    wonkLabel: 'Grassroots Small-Dollar Public Campaign Financing Act',
    plainDescription: 'Matches small $20 gifts 6-to-1 so everyday voters beat big donors.',
    whyClick: 'Big trust (+3) and turnout (+2%) boost before reelection.',
    upside: 'Lifts voter turnout (+2%) and public trust (+3)',
    catchText: 'Costs 20 Clout and $8B in matching funds',
    statutoryBasis: 'Federal Election Campaign Act Public Financing',
  },
};

export const AMENDMENT_TRADEOFFS: Readonly<Record<AmendmentId, ActionTradeoffMeta>> = {
  amendment_judicial_terms: {
    emoji: '📜',
    plainLabel: '18-Year Court Terms Amendment',
    wonkLabel: 'Article V Judicial Tenure & Rotation Amendment',
    plainDescription: 'Writes 18-year Supreme Court terms directly into the Constitution.',
    whyClick: 'Unlike a regular bill, a ratified amendment can never be struck down by the Court.',
    upside: 'Permanent Court term limits (+5 trust when ratified)',
    catchText: 'Needs 2/3 of Congress + 38 states (40 Clout)',
    statutoryBasis: 'U.S. Constitution Article V & Article III',
  },
  amendment_campaign_finance: {
    emoji: '📢',
    plainLabel: 'Get Big Money Out of Politics Amendment',
    wonkLabel: 'Article V Campaign Expenditure Regulation Amendment',
    plainDescription: 'Lets Congress and states cap big donor and Super PAC campaign cash.',
    whyClick: 'Well liked across states; boosts public trust and voter turnout for good.',
    upside: 'Limits Super PAC cash & lifts civic trust',
    catchText: 'Costs 40 Clout to launch state ratification drive',
    statutoryBasis: 'U.S. Constitution Article V & First Amendment',
  },
  amendment_equal_rights: {
    emoji: '🤝',
    plainLabel: 'Equal Rights Amendment (ERA)',
    wonkLabel: 'Article V Equal Rights Guarantee Amendment',
    plainDescription: 'Guarantees equal rights under the law for all people regardless of sex.',
    whyClick: 'Locks in equal rights for good and helps more people join the workforce.',
    upside: 'Locks in equal rights & lifts workforce growth',
    catchText: 'Costs 40 Clout and needs 38 states within 8 turns',
    statutoryBasis: 'U.S. Constitution Article V',
  },
  amendment_balanced_budget: {
    emoji: '🧮',
    plainLabel: 'Balanced Budget Amendment',
    wonkLabel: 'Article V Fiscal Outlay & Receipt Balance Mandate',
    plainDescription: 'Requires Congress to balance the budget every year except during wars.',
    whyClick: 'Calms bond markets and lowers interest rates, though it ties your hands in recessions.',
    upside: 'Cuts debt risk and lowers interest rates',
    catchText: 'Costs 40 Clout; hard to pass divided states',
    statutoryBasis: 'U.S. Constitution Article V & Article I, Section 8',
  },
};

const CHANNEL_PLAIN: Readonly<Record<string, { pos: string; neg: string; unit: string }>> = {
  approval: { pos: 'Lifts approval', neg: 'Drops approval', unit: 'pts' },
  trust: { pos: 'Builds public trust', neg: 'Hurts public trust', unit: 'pts' },
  gap: { pos: 'Boosts job growth', neg: 'Slows job growth', unit: '%' },
  potential: { pos: 'Lifts long-run growth', neg: 'Slows long-run growth', unit: '%' },
  inflation: { pos: 'Raises store prices', neg: 'Cools store prices', unit: '%' },
  debtBn: { pos: 'Adds federal borrowing', neg: 'Trims federal debt', unit: 'B' },
};

/**
 * Computes a scannable Plain-Talk 👍 Upside and ⚠️ Catch summary for any CrisisOption
 * without mutating the pure engine CrisisDefinition object.
 */
export function describeCrisisOptionTradeoff(
  effects: readonly CrisisEffect[],
  cloutCost: number,
  isGeopolitical = false,
): {
  emoji: string;
  upside: string;
  catchText: string;
  whyClick: string;
} {
  const upsides: string[] = [];
  const catches: string[] = [];

  for (const eff of effects) {
    const info = CHANNEL_PLAIN[eff.channel];
    if (!info) continue;
    const abs = Math.abs(eff.amount);
    const valStr = eff.channel === 'debtBn' ? `$${abs}B` : `${abs}${info.unit === 'pts' ? ' pts' : '%'}`;

    const isGood =
      eff.channel === 'inflation' || eff.channel === 'debtBn' ? eff.amount < 0 : eff.amount > 0;

    if (isGood) {
      const label = eff.channel === 'inflation' || eff.channel === 'debtBn' ? info.neg : info.pos;
      upsides.push(`${label} (${valStr})`);
    } else if (eff.amount !== 0) {
      const label = eff.channel === 'inflation' || eff.channel === 'debtBn' ? info.pos : info.neg;
      catches.push(`${label} (${valStr})`);
    }
  }

  if (cloutCost === 0 && upsides.length === 0) {
    upsides.push('Saves all your Clout (0 cost)');
  } else if (cloutCost > 0) {
    catches.push(`Costs ${cloutCost} Clout`);
  }

  if (upsides.length === 0) {
    upsides.push(isGeopolitical ? 'Resolves standoff without war' : 'Stabilizes the situation');
  }
  if (catches.length === 0) {
    catches.push('Uses your turn crisis response slot');
  }

  const emoji = cloutCost === 0 ? '⏳' : cloutCost >= 25 ? '🚀' : '🛡️';
  const whyClick =
    cloutCost === 0
      ? 'Free in Clout, but voters and markets may punish standing by.'
      : cloutCost >= 25
        ? 'Bold action with the biggest payoff if you have the Clout to spare.'
        : 'Practical middle ground that contains the damage for a modest Clout cost.';

  return {
    emoji,
    upside: upsides.join(' · '),
    catchText: catches.join(' · '),
    whyClick,
  };
}
