// Sourced catalog of civics myth cards (PWR-06, OBS-05, GR-20, GR-21, Pitfall 17).
// Focuses strictly on institutional mechanics and constitutional powers, never political values.
// Spectrum-balanced with |count(challenges=left) - count(challenges=right)| <= 1.

export interface MythCard {
  readonly id: string;
  readonly title: string;
  readonly mythStatement: string;
  readonly realitySummary: string;
  readonly flowSteps: readonly string[];
  readonly realLevers: readonly string[];
  readonly challenges: 'left' | 'right' | 'both';
  readonly target: 'institution' | 'mechanism';
  readonly citation: {
    readonly title: string;
    readonly url: string;
    readonly confirmed: boolean;
  };
}

export const MYTHS_CATALOG: readonly MythCard[] = [
  {
    id: 'gas_prices',
    title: 'Can you lower gas prices',
    mythStatement: 'The President sets gas prices.',
    realitySummary: 'Pump prices depend on world crude oil, plant work, and state fuel taxes.',
    flowSteps: ['World oil price', 'Refiners', 'Taxes', 'Pump price'],
    realLevers: ['Energy permits', 'Ask Congress to use the oil reserve', 'Tariffs'],
    challenges: 'right',
    target: 'mechanism',
    citation: {
      title: 'U.S. Energy Information Administration (EIA)',
      url: 'https://www.eia.gov/petroleum/gasdiesel/',
      confirmed: false,
    },
  },
  {
    id: 'interest_rates',
    title: 'Can you set interest rates',
    mythStatement: 'The President sets interest rates.',
    realitySummary: 'The Federal Reserve sets borrowing costs to balance prices and jobs.',
    flowSteps: ['Economic data', 'Federal Reserve', 'Bank borrowing', 'Mortgages & loans'],
    realLevers: ['Nominate Fed Chair', 'Cut federal deficits', 'Bully pulpit speeches'],
    challenges: 'both',
    target: 'institution',
    citation: {
      title: 'Federal Reserve Act (12 U.S.C. § 225a)',
      url: 'https://www.federalreserve.gov/aboutthefed/fract.htm',
      confirmed: false,
    },
  },
  {
    id: 'presidential_jobs',
    title: 'Do presidents create jobs',
    mythStatement: 'The President creates private sector jobs.',
    realitySummary: 'Companies hire based on customer sales, new tech, and economic growth.',
    flowSteps: ['Consumer demand', 'Business profits', 'Private hiring', 'Total employment'],
    realLevers: ['Tax incentives', 'Infrastructure spending', 'Workforce job grants'],
    challenges: 'both',
    target: 'mechanism',
    citation: {
      title: 'Bureau of Labor Statistics Employment Overview',
      url: 'https://www.bls.gov/news.release/empsit.nr0.htm',
      confirmed: false,
    },
  },
  {
    id: 'rule_by_decree',
    title: 'Can you ban anything by order',
    mythStatement: 'Presidents can change any law with an executive order.',
    realitySummary: 'Orders cannot spend money or change laws passed by Congress.',
    flowSteps: ['Statutory power', 'Executive order', 'Court review', 'Federal agencies'],
    realLevers: ['Agency workforce rules', 'Trade investigations', 'Federal buying standards'],
    challenges: 'left',
    target: 'institution',
    citation: {
      title: 'CRS Executive Orders: Issuance and Modification (RL30840)',
      url: 'https://crsreports.congress.gov/product/pdf/RL/RL30840',
      confirmed: false,
    },
  },
  {
    id: 'foreign_aid_deficit',
    title: 'Does foreign aid cause the deficit',
    mythStatement: 'Cutting foreign aid would balance the federal budget.',
    realitySummary: 'Foreign aid makes up less than one percent of total federal spending.',
    flowSteps: ['Entitlements (60%)', 'Defense (13%)', 'Interest (13%)', 'Foreign aid (<1%)'],
    realLevers: ['Tax code changes', 'Entitlement formulas', 'Discretionary caps'],
    challenges: 'right',
    target: 'mechanism',
    citation: {
      title: 'Congressional Budget Office Federal Budget Overview',
      url: 'https://www.cbo.gov/publication/59767',
      confirmed: false,
    },
  },
] as const;

export function getMyth(id: string): MythCard | undefined {
  return MYTHS_CATALOG.find((m) => m.id === id);
}
