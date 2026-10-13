// Sourced catalog of interactive "How it works" civic explainers (LEARN-01, OBS-05, design §7c).
// Plain language, reading grade <= 9.0, sentences <= 20 words, strictly nonpartisan.

export type ExplainerId = 'oval_office' | 'economy' | 'budget' | 'trade';

export interface CivicExplainer {
  readonly id: ExplainerId;
  readonly title: string;
  readonly tag: string;
  readonly summary: string;
  readonly flowSteps: readonly string[];
  readonly takeaways: readonly string[];
  readonly citation: {
    readonly title: string;
    readonly url: string;
    readonly confirmed: boolean;
  };
}

export const EXPLAINERS_CATALOG: readonly CivicExplainer[] = [
  {
    id: 'oval_office',
    title: 'How the Presidency works',
    tag: 'ARTICLE II · CHECKS AND BALANCES',
    summary: 'You lead the executive branch, propose laws to Congress, and guide the nation through crises.',
    flowSteps: ['Set priorities', 'Spend Clout', 'Pass laws or orders', 'Compare vs autopilot'],
    takeaways: [
      'Clout is your political capital to strike deals and sign orders.',
      'Your score compares your choices against doing nothing on the same seed.',
      'Half of your final score comes from the ten-year legacy after you leave.',
    ],
    citation: {
      title: 'U.S. Constitution Article II (National Archives)',
      url: 'https://www.archives.gov/founding-docs/constitution-transcript',
      confirmed: false,
    },
  },
  {
    id: 'economy',
    title: 'How the economy works',
    tag: 'MACRO MODEL · JOBS AND PRICES',
    summary: 'Growth, jobs, and prices move together through supply, demand, and interest rates.',
    flowSteps: ['Spending & taxes', 'Demand & jobs', 'Price pressure', 'Fed interest rates'],
    takeaways: [
      'Fast demand creates new jobs but can push prices up.',
      'The Federal Reserve raises rates on its own to cool high prices.',
      'High national debt raises interest costs over the long run.',
    ],
    citation: {
      title: 'Federal Reserve: Monetary Policy and the Economy',
      url: 'https://www.federalreserve.gov/monetarypolicy.htm',
      confirmed: false,
    },
  },
  {
    id: 'budget',
    title: 'How a budget becomes law',
    tag: 'ARTICLE I SECTION 9 · POWER OF THE PURSE',
    summary: 'The President proposes a budget plan, but only Congress can tax and spend public money.',
    flowSteps: ['White House plan', 'House vote (218)', 'Senate vote (51)', 'Signed into law'],
    takeaways: [
      'Budget bills can pass the Senate with 51 votes under fast-track rules.',
      'Tax cuts or new spending add to the deficit unless offset elsewhere.',
      'Passing a budget on time avoids a costly government shutdown.',
    ],
    citation: {
      title: 'Congressional Budget Act of 1974 (CBO Overview)',
      url: 'https://www.cbo.gov/about/founding',
      confirmed: false,
    },
  },
  {
    id: 'trade',
    title: 'How tariffs and trade work',
    tag: 'SECTION 301 & 232 · TRADE LAW',
    summary: 'Trade laws let the President tax imports for national security or unfair foreign trade.',
    flowSteps: ['Import duty set', 'Border tax paid', 'Supply chain shifts', 'Partner response'],
    takeaways: [
      'Tariffs protect home factories but raise prices on imported goods.',
      'Trading partners often hit back with duties on American farm and tech exports.',
      'Trade pacts lower barriers and boost export jobs at the cost of Clout.',
    ],
    citation: {
      title: 'U.S. International Trade Commission: Tariff Overview',
      url: 'https://www.usitc.gov/tariff_affairs.htm',
      confirmed: false,
    },
  },
] as const;

export function getExplainer(id: string): CivicExplainer | undefined {
  return EXPLAINERS_CATALOG.find((e) => e.id === id);
}
