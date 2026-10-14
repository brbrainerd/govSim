// Sourced catalog of civics myth cards (PWR-06, LEARN-02, DECK-01, DECK-02, PIVOT-01, OBS-05, GR-20, GR-21, Pitfall 17).
// Focuses strictly on institutional mechanics and constitutional powers, never political values.
// Spectrum-balanced with |count(challenges=left) - count(challenges=right)| <= 1.

import type { ScreenId } from '../app/screens';

export interface MythPredictionPrompt {
  readonly question: string;
  readonly options: readonly [string, string];
  readonly correctIndex: 0 | 1;
  readonly refutation: string;
}

export interface MythRealLeverAction {
  readonly label: string;
  readonly screen: ScreenId;
  readonly hint?: string;
  readonly actionKind:
    | 'budget_package'
    | 'budget_lever'
    | 'social_lever'
    | 'sign_order'
    | 'sector_tariff'
    | 'trade_agreement'
    | 'open_modal'
    | 'navigate_only';
}

export interface MythCard {
  readonly id: string;
  readonly title: string;
  readonly mythStatement: string;
  readonly realitySummary: string;
  readonly mirageLabel: string;
  readonly predictionPrompt: MythPredictionPrompt;
  readonly flowSteps: readonly string[];
  readonly realLevers: readonly string[];
  readonly realLeverActions: readonly MythRealLeverAction[];
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
    mirageLabel: 'Cap Pump Gas at $2.50',
    predictionPrompt: {
      question: 'What sets local gas station prices?',
      options: ['White House price orders', 'World oil and plant work costs'],
      correctIndex: 1,
      refutation: 'Presidents do not set pump prices. World crude and plant work set fuel costs.',
    },
    flowSteps: ['World oil price', 'Refiners', 'Taxes', 'Pump price'],
    realLevers: ['Energy permits', 'Ask Congress to use the oil reserve', 'Tariffs'],
    realLeverActions: [
      {
        label: 'Energy permits',
        screen: 'budget',
        hint: 'Fund fast permits for clean power lines.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Release oil reserve',
        screen: 'powers',
        hint: 'Tap the oil reserve to calm big price shocks.',
        actionKind: 'open_modal',
      },
      {
        label: 'Adjust fuel tariffs',
        screen: 'trade',
        hint: 'Change tariffs on fuel imports at sea.',
        actionKind: 'navigate_only',
      },
    ],
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
    mirageLabel: 'Order 2% Fed Rate Cut',
    predictionPrompt: {
      question: 'Who sets federal borrowing rates in the nation?',
      options: ['The central bank sets rates', 'The President writes an order'],
      correctIndex: 0,
      refutation: 'The central bank sets loan rates. Congress made it free from short-term votes.',
    },
    flowSteps: ['Economic data', 'Federal Reserve', 'Bank borrowing', 'Mortgages & loans'],
    realLevers: ['Nominate Fed Chair', 'Cut federal deficits', 'Bully pulpit speeches'],
    realLeverActions: [
      {
        label: 'Nominate Fed Chair',
        screen: 'powers',
        hint: 'Pick a new central bank chair when terms end.',
        actionKind: 'open_modal',
      },
      {
        label: 'Cut federal deficits',
        screen: 'budget',
        hint: 'Lower borrowing to ease stress on bond yields.',
        actionKind: 'budget_package',
      },
      {
        label: 'Give economic speech',
        screen: 'oval',
        hint: 'Give speeches to shape how savers think.',
        actionKind: 'open_modal',
      },
    ],
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
    mirageLabel: 'Mandate 500k Private Jobs',
    predictionPrompt: {
      question: 'What leads private firms to hire new staff?',
      options: ['Growing customer sales and demand', 'White House private hiring quotas'],
      correctIndex: 0,
      refutation: 'Firms hire staff when sales grow. Presidents cannot order private shops to hire.',
    },
    flowSteps: ['Consumer demand', 'Business profits', 'Private hiring', 'Total employment'],
    realLevers: ['Tax incentives', 'Infrastructure spending', 'Workforce job grants'],
    realLeverActions: [
      {
        label: 'Tax incentives',
        screen: 'budget',
        hint: 'Change tax rates to back plant tools.',
        actionKind: 'budget_package',
      },
      {
        label: 'Infrastructure push',
        screen: 'budget',
        hint: 'Fund roads, bridges, and fast lines to help trade.',
        actionKind: 'budget_package',
      },
      {
        label: 'Research grants',
        screen: 'budget',
        hint: 'Fund science labs to build new tools.',
        actionKind: 'budget_package',
      },
    ],
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
    mirageLabel: 'Rewrite Law by Decree',
    predictionPrompt: {
      question: 'Can an executive order fund brand new programs without Congress?',
      options: ['No, Congress holds purse strings', 'Yes, emergency rules fund programs'],
      correctIndex: 0,
      refutation: 'Congress holds the purse. Orders cannot spend cash without a bill.',
    },
    flowSteps: ['Statutory power', 'Executive order', 'Court review', 'Federal agencies'],
    realLevers: ['Agency workforce rules', 'Trade investigations', 'Federal buying standards'],
    realLeverActions: [
      {
        label: 'Review executive orders',
        screen: 'powers',
        hint: 'Write rules that fit within existing laws.',
        actionKind: 'sign_order',
      },
      {
        label: 'Launch trade probe',
        screen: 'trade',
        hint: 'Probe trade harm under current trade laws.',
        actionKind: 'sector_tariff',
      },
      {
        label: 'Build congressional coalition',
        screen: 'congress',
        hint: 'Pass new bills through the House and Senate.',
        actionKind: 'navigate_only',
      },
    ],
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
    mirageLabel: 'Zero Out Foreign Aid',
    predictionPrompt: {
      question: 'What share of federal spending goes to foreign aid?',
      options: ['Under one percent', 'Over fifteen percent'],
      correctIndex: 0,
      refutation: 'Foreign aid is under one percent. Care programs and defense form most outlays.',
    },
    flowSteps: ['Entitlements (60%)', 'Defense (13%)', 'Interest (13%)', 'Foreign aid (<1%)'],
    realLevers: ['Tax code changes', 'Entitlement formulas', 'Discretionary caps'],
    realLeverActions: [
      {
        label: 'Adjust spending caps',
        screen: 'budget',
        hint: 'Set spending caps across major agency bills.',
        actionKind: 'budget_package',
      },
      {
        label: 'Reform tax rates',
        screen: 'budget',
        hint: 'Fix tax rates to raise cash from top earners.',
        actionKind: 'budget_package',
      },
      {
        label: 'Adjust foreign aid level',
        screen: 'budget',
        hint: 'Tune aid levels to match global needs.',
        actionKind: 'budget_lever',
      },
    ],
    challenges: 'right',
    target: 'mechanism',
    citation: {
      title: 'Congressional Budget Office Federal Budget Overview',
      url: 'https://www.cbo.gov/publication/59767',
      confirmed: false,
    },
  },
  {
    id: 'supply_side_taxes',
    title: 'Do tax cuts pay for themselves',
    mythStatement: 'Cutting tax rates always grows the economy enough to raise tax cash.',
    realitySummary: 'Lower rates boost growth a bit, but they still bring in less tax cash.',
    mirageLabel: 'Self-Funding Tax Cuts',
    predictionPrompt: {
      question: 'Do deep tax cuts raise total cash collections?',
      options: ['Tax cash drops and debt climbs', 'Fast growth pays for all rate cuts'],
      correctIndex: 0,
      refutation: 'Lower tax rates lift growth a bit. Still, net tax cash drops and debt climbs.',
    },
    flowSteps: ['Tax rate cut', 'Small growth lift', 'Less tax cash', 'Larger debt'],
    realLevers: ['Pair cuts with spending caps', 'Broaden the tax base', 'Fund new research'],
    realLeverActions: [
      {
        label: 'Enact tax cut package',
        screen: 'budget',
        hint: 'Cut tax rates while tracking new debt.',
        actionKind: 'budget_package',
      },
      {
        label: 'Close tax loopholes',
        screen: 'budget',
        hint: 'End loopholes to protect tax collections.',
        actionKind: 'budget_package',
      },
      {
        label: 'Invest in research',
        screen: 'budget',
        hint: 'Fund lab research to boost worker output.',
        actionKind: 'budget_package',
      },
    ],
    challenges: 'right',
    target: 'mechanism',
    citation: {
      title: 'CBO: How Tax Rate Changes Affect Federal Revenue',
      url: 'https://www.cbo.gov/publication/53651',
      confirmed: false,
    },
  },
  {
    id: 'debt_ceiling_default',
    title: 'Does the debt limit add spending',
    mythStatement: 'Raising the debt limit approves new government spending.',
    realitySummary: 'The debt limit only lets the nation pay bills that Congress already passed.',
    mirageLabel: 'Freeze Debt Limit for Savings',
    predictionPrompt: {
      question: 'Does raising the debt limit start new spending?',
      options: ['No, it pays for past laws', 'Yes, it starts brand new programs'],
      correctIndex: 0,
      refutation: 'The debt limit allows borrowing to pay bills that Congress already passed.',
    },
    flowSteps: ['Congress passes laws', 'Bills come due', 'Nation borrows', 'Past bills paid'],
    realLevers: ['Pass annual budget bills', 'Reform spending laws', 'Adjust tax rates'],
    realLeverActions: [
      {
        label: 'Pass annual budget',
        screen: 'budget',
        hint: 'Pass a real budget to slow future loans.',
        actionKind: 'budget_package',
      },
      {
        label: 'Whip debt votes',
        screen: 'congress',
        hint: 'Build a House majority to stop a debt default.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Review debt projection',
        screen: 'economy',
        hint: 'Track debt to economic output over time.',
        actionKind: 'navigate_only',
      },
    ],
    challenges: 'left',
    target: 'institution',
    citation: {
      title: 'U.S. Treasury: Debt Limit Overview',
      url: 'https://home.treasury.gov/policy-issues/financial-markets-financial-institutions-and-fiscal-service/debt-limit',
      confirmed: false,
    },
  },
  {
    id: 'trade_deficits',
    title: 'Do foreign nations pay tariffs',
    mythStatement: 'Foreign states pay the tariffs placed on their goods.',
    realitySummary: 'Home buyers and importers pay the border tax through higher store prices.',
    mirageLabel: 'Bill Foreign Nations for Tariffs',
    predictionPrompt: {
      question: 'Who directly pays the tax when foreign goods arrive at border ports?',
      options: ['Domestic importing businesses', 'Foreign government treasuries'],
      correctIndex: 0,
      refutation: 'Importers pay border taxes at customs. That often lifts store prices for families.',
    },
    flowSteps: ['Goods reach port', 'Buyer pays duty', 'Store prices rise', 'Partners hit back'],
    realLevers: ['Target key supply chains', 'Sign trade pacts', 'Back home plants'],
    realLeverActions: [
      {
        label: 'Strategic sector tariffs',
        screen: 'trade',
        hint: 'Set tariffs on key goods to back home plants.',
        actionKind: 'sector_tariff',
      },
      {
        label: 'Sign trade agreements',
        screen: 'trade',
        hint: 'Sign trade pacts to lower barriers on exports.',
        actionKind: 'trade_agreement',
      },
      {
        label: 'Domestic R&D credits',
        screen: 'budget',
        hint: 'Fund home plant research through tax credits.',
        actionKind: 'budget_package',
      },
    ],
    challenges: 'left',
    target: 'mechanism',
    citation: {
      title: 'Congressional Research Service: U.S. Tariff Policy (IF11030)',
      url: 'https://crsreports.congress.gov/product/pdf/IF/IF11030',
      confirmed: false,
    },
  },
  {
    id: 'veto_line_item',
    title: 'Can you veto single budget lines',
    mythStatement: 'Presidents can cross out wasteful budget items before signing a law.',
    realitySummary: 'The Constitution requires the President to sign or veto an entire bill.',
    mirageLabel: 'Line-Item Veto Waste Lines',
    predictionPrompt: {
      question: 'Can the President cancel specific spending lines in a signed bill?',
      options: ['No, the full bill must pass or fail', 'Yes, presidents can cut single lines'],
      correctIndex: 0,
      refutation: 'The high court struck down line cuts. You must sign or veto a bill in full.',
    },
    flowSteps: ['Congress writes bill', 'Whole bill presented', 'Sign or veto all', 'Courts block partial cuts'],
    realLevers: ['Threaten presidential veto', 'Negotiate with Congress', 'Rescission requests'],
    realLeverActions: [
      {
        label: 'Whip Congressional deals',
        screen: 'congress',
        hint: 'Talk with lawmakers before floor votes take place.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Set budget targets',
        screen: 'budget',
        hint: 'Send a budget plan to House and Senate leaders.',
        actionKind: 'budget_package',
      },
      {
        label: 'Give budget speech',
        screen: 'oval',
        hint: 'Give speeches to rally voter pressure on bills.',
        actionKind: 'open_modal',
      },
    ],
    challenges: 'both',
    target: 'institution',
    citation: {
      title: 'Supreme Court: Line Item Veto Act Case (524 U.S. 417)',
      url: 'https://supreme.justia.com/cases/federal/us/524/417/',
      confirmed: false,
    },
  },
  {
    id: 'popular_vote_mandate',
    title: 'Does popular vote grant a total mandate',
    mythStatement: 'Winning the total vote lets a President pass any bill.',
    realitySummary: 'Presidents win through state electors. Congress still writes the laws.',
    mirageLabel: 'Claim National Mandate Decree',
    predictionPrompt: {
      question: 'Does a total vote win guarantee House bills pass?',
      options: ['No, state districts pick lawmakers', 'Yes, the executive orders new laws'],
      correctIndex: 0,
      refutation: 'Lawmakers answer to their home states. Presidents must build support to pass bills.',
    },
    flowSteps: ['State elections', 'Electoral College result', 'Divided legislative seats', 'Compromise needed'],
    realLevers: ['Build chamber majorities', 'Target swing states', 'Electoral system reforms'],
    realLeverActions: [
      {
        label: 'Review state coalitions',
        screen: 'voters',
        hint: 'Track voter shifts across all key states.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Auto-whip floor votes',
        screen: 'congress',
        hint: 'Find the lowest-cost path to two hundred votes.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Campaign for reforms',
        screen: 'congress',
        hint: 'Back reforms to update election rules.',
        actionKind: 'open_modal',
      },
    ],
    challenges: 'left',
    target: 'institution',
    citation: {
      title: 'CRS: The Electoral College System (RL32611)',
      url: 'https://crsreports.congress.gov/product/pdf/RL/RL32611',
      confirmed: false,
    },
  },
  {
    id: 'immigration_crime_budget',
    title: 'Does border closure balance the budget',
    mythStatement: 'Sealing the border wipes out the budget gap.',
    realitySummary: 'The deficit stems from care laws, debt interest, and aging workers.',
    mirageLabel: 'Seal Border to Balance Budget',
    predictionPrompt: {
      question: 'What drives the largest share of federal deficits?',
      options: ['Aging workers and care bills', 'Border posts and visa offices'],
      correctIndex: 0,
      refutation: 'Care laws, old age checks, and debt interest drive the deficit.',
    },
    flowSteps: ['Aging population', 'Entitlement outlays', 'Debt interest costs', 'Structural deficit'],
    realLevers: ['Entitlement reforms', 'Workforce tax base', 'Discretionary spending caps'],
    realLeverActions: [
      {
        label: 'Entitlement formula review',
        screen: 'budget',
        hint: 'Review old age pension rules and budget gaps.',
        actionKind: 'budget_package',
      },
      {
        label: 'Review family budget impact',
        screen: 'voters',
        hint: 'Track how taxes change home family budgets.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Broaden payroll tax cap',
        screen: 'budget',
        hint: 'Raise payroll tax caps to aid retirement funds.',
        actionKind: 'budget_lever',
      },
    ],
    challenges: 'right',
    target: 'mechanism',
    citation: {
      title: 'Congressional Budget Office Demographic Outlook',
      url: 'https://www.cbo.gov/publication/59697',
      confirmed: false,
    },
  },
  {
    id: 'scotus_instant_reversal',
    title: 'Can one court pick reverse past rulings',
    mythStatement: 'A new court pick can reverse past rulings right away.',
    realitySummary: 'The Supreme Court only rules on live lawsuits that work up on appeal.',
    mirageLabel: 'Overturn Past Court Precedents',
    predictionPrompt: {
      question: 'Can the Supreme Court overturn rulings without a case?',
      options: ['No, an active case must reach the court', 'Yes, justices can vote on past cases anytime'],
      correctIndex: 0,
      refutation: 'Article Three requires an actual legal case brought by real parties on appeal.',
    },
    flowSteps: ['Litigation filed', 'Appeals court rulings', 'Supreme Court review', 'Precedent evaluated'],
    realLevers: ['Appoint federal judges', 'Pass clarifying statutes', 'Judicial ethics reform'],
    realLeverActions: [
      {
        label: 'Nominate Justice',
        screen: 'powers',
        hint: 'Pick judges when court seats open up.',
        actionKind: 'open_modal',
      },
      {
        label: 'Enact judicial reforms',
        screen: 'powers',
        hint: 'Pass ethics rules and term limits for judges.',
        actionKind: 'open_modal',
      },
      {
        label: 'Legislate statutory protections',
        screen: 'congress',
        hint: 'Pass clear laws that fix legal doubts.',
        actionKind: 'navigate_only',
      },
    ],
    challenges: 'both',
    target: 'institution',
    citation: {
      title: 'CRS: Supreme Court Precedent and Overruling (R45319)',
      url: 'https://crsreports.congress.gov/product/pdf/R/R45319',
      confirmed: false,
    },
  },
] as const;

export function getMyth(id: string): MythCard | undefined {
  return MYTHS_CATALOG.find((m) => m.id === id);
}
