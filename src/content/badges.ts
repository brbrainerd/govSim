export type BadgeCategory = 'fiscal' | 'crises' | 'powers' | 'electoral' | 'stewardship';

export const BADGE_THRESHOLDS = {
  deficitPct: 1,
  empPopPct: 62,
  minInflation: 1.5,
  maxInflation: 2.5,
  debtReductionPp: 2,
  crisesResolved: 3,
  ordersSigned: 3,
  billsPassed: 3,
  reelectionEV: 300,
  socialTrustPct: 25,
  prosperityScore: 5,
  truthTellerMythsBusted: 6,
  demagogueMythsSpun: 4,
} as const;

export interface Badge {
  readonly id: string;
  readonly title: string;
  readonly category: BadgeCategory;
  readonly description: string;
  readonly criterion: string;
  readonly icon: string;
}

export const BADGES: readonly Badge[] = [
  {
    id: 'balanced_budget',
    title: 'Fiscal Discipline',
    category: 'fiscal',
    description: 'Brought the federal deficit under 1.0% of the economy.',
    criterion: 'Deficit < 1.0% of GDP',
    icon: 'scale',
  },
  {
    id: 'full_employment',
    title: 'Full Employment',
    category: 'fiscal',
    description: 'Raised the share of working-age people with jobs above 62.0%.',
    criterion: 'People working > 62.0%',
    icon: 'briefcase',
  },
  {
    id: 'inflation_tamed',
    title: 'Inflation Tamed',
    category: 'fiscal',
    description: 'Kept price changes steady in the safe target band.',
    criterion: 'Inflation 1.5% to 2.5%',
    icon: 'shield-check',
  },
  {
    id: 'debt_stabilized',
    title: 'Debt Stabilizer',
    category: 'fiscal',
    description: 'Cut the national debt share of the economy by two points.',
    criterion: 'Debt share down 2.0 pp',
    icon: 'trending-down',
  },
  {
    id: 'crisis_pilot',
    title: 'Crisis Pilot',
    category: 'crises',
    description: 'Guided the nation through 3 or more major crises without a panic.',
    criterion: 'Resolved 3+ crises',
    icon: 'anchor',
  },
  {
    id: 'restrained_executive',
    title: 'Executive Restraint',
    category: 'powers',
    description: 'Signed 3 or more executive orders with none struck down by the courts.',
    criterion: '3+ orders, 0 overturned',
    icon: 'feather',
  },
  {
    id: 'judicial_appointment',
    title: 'The Bench',
    category: 'powers',
    description: 'Named a Supreme Court judge confirmed by the Senate.',
    criterion: 'Confirmed Supreme Court justice',
    icon: 'landmark',
  },
  {
    id: 'bipartisan_builder',
    title: 'Coalition Builder',
    category: 'powers',
    description: 'Passed 3 or more laws through Congress.',
    criterion: 'Passed 3+ laws through Congress',
    icon: 'users',
  },
  {
    id: 'master_orator',
    title: 'Bully Pulpit',
    category: 'powers',
    description: 'Gave speeches to citizens, Congress, and business groups.',
    criterion: 'Spoke to all 3 audiences',
    icon: 'mic',
  },
  {
    id: 'electoral_mandate',
    title: 'Electoral Mandate',
    category: 'electoral',
    description: 'Won reelection with 300 or more electoral votes.',
    criterion: 'Won reelection with 300+ EV',
    icon: 'award',
  },
  {
    id: 'social_trust',
    title: 'High Trust',
    category: 'stewardship',
    description: 'Kept social trust at or above 25.0%.',
    criterion: 'Social trust >= 25.0%',
    icon: 'heart-handshake',
  },
  {
    id: 'transformational_legacy',
    title: 'Transformational Presidency',
    category: 'stewardship',
    description: 'Left America +5.0 points or more better off than doing nothing.',
    criterion: 'Score >= +5.0 vs doing nothing',
    icon: 'sparkles',
  },
  {
    id: 'truth_teller',
    title: 'Truth Teller',
    category: 'stewardship',
    description: 'Debunked 6 or more civics myths without spinning any to the public.',
    criterion: 'Busted 6+ myths, 0 spun',
    icon: 'shield-check',
  },
  {
    id: 'demagogue',
    title: 'Demagogue',
    category: 'powers',
    description: 'Spun 4 or more common myths on TV for quick poll gains.',
    criterion: 'Spun 4+ myths',
    icon: 'flame',
  },
] as const;

export function getBadge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}
