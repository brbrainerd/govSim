// Sourced catalog of civics myth cards (PWR-06, LEARN-02, DECK-01, DECK-02, PIVOT-01, OBS-05, GR-20, GR-21, Pitfall 17).
// Focuses strictly on institutional mechanics and constitutional powers, never political values.
// Spectrum-balanced with |count(challenges=left) - count(challenges=right)| <= 1.

import type { ScreenId } from '../app/screens';
import type { GameState } from '../engine/game';
import { draw } from '../engine/rng';

export type MythCategory =
  | 'power_limit'
  | 'budget_math'
  | 'checks_and_balances'
  | 'market_ripple'
  | 'electoral_mechanics';

export interface MythCategoryMeta {
  readonly id: MythCategory;
  readonly label: string;
  readonly emblem: string;
  readonly description: string;
}

export const MYTH_CATEGORIES: Record<MythCategory, MythCategoryMeta> = {
  power_limit: {
    id: 'power_limit',
    label: 'Executive Mirage',
    emblem: 'gavel',
    description: 'Things voters think the President controls with a desk dial.',
  },
  budget_math: {
    id: 'budget_math',
    label: 'Budget Scale',
    emblem: 'treasury',
    description: 'Budget math facts where public guesses are off by ten times.',
  },
  checks_and_balances: {
    id: 'checks_and_balances',
    label: 'Constitutional Check',
    emblem: 'scales',
    description: 'How Congress, courts, and basic law block shortcuts.',
  },
  market_ripple: {
    id: 'market_ripple',
    label: 'Market Ripple',
    emblem: 'chart_up',
    description: 'How price caps, tariffs, and supply shocks ripple through markets.',
  },
  electoral_mechanics: {
    id: 'electoral_mechanics',
    label: 'Federalism & Votes',
    emblem: 'capitol',
    description: 'How state powers, districts, and coalitions shape what passes.',
  },
};

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
  readonly payload?: string;
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
  readonly category: MythCategory;
  readonly title: string;
  readonly mythStatement: string;
  readonly tvSoundbite: string;
  readonly realitySummary: string;
  readonly byTheNumbers: string;
  readonly historicalHook: string;
  readonly whyItMatters: string;
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
    category: 'power_limit',
    title: 'Can you lower gas prices',
    mythStatement: 'The President sets gas prices.',
    tvSoundbite: 'Late-night TV host: "Turn the big desk dial marked CHEAP GAS to the left!"',
    realitySummary: 'Pump prices depend on world crude oil, plant work, and state fuel taxes.',
    byTheNumbers: '60% of pump price comes from world crude oil costs.',
    historicalHook: 'Past oil shocks in the 1970s hit pump prices hard despite White House pleas.',
    whyItMatters: 'Use energy permits, reserve releases, and trade levers to ease fuel shocks over time.',
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
        payload: 'Infrastructure push',
        actionKind: 'budget_package',
      },
      {
        label: 'Release oil reserve',
        screen: 'powers',
        hint: 'Tap the oil reserve to calm big price shocks.',
        payload: 'clean_grid_permitting',
        actionKind: 'sign_order',
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
    category: 'power_limit',
    title: 'Can you set interest rates',
    mythStatement: 'The President sets interest rates.',
    tvSoundbite: 'Angry caller: "Why did the White House raise my home loan rate this morning?"',
    realitySummary: 'The Federal Reserve sets borrowing costs to balance prices and jobs.',
    byTheNumbers: '12 voting Fed members set rates across 8 meetings a year.',
    historicalHook: 'A 1951 accord freed the central bank from White House bond rate caps.',
    whyItMatters: 'Lower deficits to cool bond yields, or pick a new Fed Chair when terms end.',
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
        payload: 'fed',
        actionKind: 'open_modal',
      },
      {
        label: 'Cut federal deficits',
        screen: 'budget',
        hint: 'Lower borrowing to ease stress on bond yields.',
        payload: 'Balance the budget',
        actionKind: 'budget_package',
      },
      {
        label: 'Give economic speech',
        screen: 'oval',
        hint: 'Give speeches to shape how savers think.',
        payload: 'speech',
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
    category: 'power_limit',
    title: 'Do presidents create jobs',
    mythStatement: 'The President creates private sector jobs.',
    tvSoundbite: 'Pundit: "The President built three hundred thousand jobs with his own hands in May!"',
    realitySummary: 'Companies hire based on customer sales, new tech, and economic growth.',
    byTheNumbers: '85% of US workers hold private sector jobs outside federal control.',
    historicalHook: 'Job booms and slumps often start in global tech or credit cycles before votes.',
    whyItMatters: 'Boost hiring over time with road bills, science grants, and tax changes.',
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
        payload: 'Tax cut',
        actionKind: 'budget_package',
      },
      {
        label: 'Infrastructure push',
        screen: 'budget',
        hint: 'Fund roads, bridges, and fast lines to help trade.',
        payload: 'Infrastructure push',
        actionKind: 'budget_package',
      },
      {
        label: 'Research grants',
        screen: 'budget',
        hint: 'Fund science labs to build new tools.',
        payload: 'rd',
        actionKind: 'budget_lever',
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
    category: 'checks_and_balances',
    title: 'Can you ban anything by order',
    mythStatement: 'Presidents can change any law with an executive order.',
    tvSoundbite: 'Talk radio: "Just grab a fancy pen and sign a new law before lunch!"',
    realitySummary: 'Orders cannot spend money or change laws passed by Congress.',
    byTheNumbers: '0 dollars can be spent from the Treasury without a law from Congress.',
    historicalHook: 'In 1952, the Supreme Court blocked a presidential order seizing steel mills.',
    whyItMatters: 'Executive orders are fast and free of Congress, but courts can strike them down.',
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
        payload: 'chips',
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
    category: 'budget_math',
    title: 'Does foreign aid cause the deficit',
    mythStatement: 'Cutting foreign aid would balance the federal budget.',
    tvSoundbite: 'Town hall guest: "We send half the budget overseas! Cut aid and we are rich!"',
    realitySummary: 'Foreign aid makes up less than one percent of total federal spending.',
    byTheNumbers: 'Polls guess 25% of spending is foreign aid; the real share is under 1%.',
    historicalHook: 'Even since the Marshall Plan era, foreign aid has stayed a tiny slice of outlays.',
    whyItMatters: 'To trim the deficit for real, you must adjust tax rates, health care, or defense.',
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
        payload: 'Balance the budget',
        actionKind: 'budget_package',
      },
      {
        label: 'Reform tax rates',
        screen: 'budget',
        hint: 'Fix tax rates to raise cash from top earners.',
        payload: 'inc',
        actionKind: 'budget_lever',
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
    category: 'budget_math',
    title: 'Do tax cuts pay for themselves',
    mythStatement: 'Cutting tax rates always grows the economy enough to raise tax cash.',
    tvSoundbite: 'Cable guest: "Cut taxes to zero and the government will swim in bonus cash!"',
    realitySummary: 'Lower rates boost growth a bit, but they still bring in less tax cash.',
    byTheNumbers: 'Growth offsets roughly 10% to 25% of a typical rate cut, not 100%.',
    historicalHook: 'Major tax cuts in 1981, 2001, and 2017 each lowered yearly tax collections.',
    whyItMatters: 'Pair tax cuts with spending restraint if you want to keep debt and bond rates down.',
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
        payload: 'Tax cut',
        actionKind: 'budget_package',
      },
      {
        label: 'Close tax loopholes',
        screen: 'budget',
        hint: 'End loopholes to protect tax collections.',
        payload: 'Balance the budget',
        actionKind: 'budget_package',
      },
      {
        label: 'Invest in research',
        screen: 'budget',
        hint: 'Fund lab research to boost worker output.',
        payload: 'Infrastructure push',
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
    category: 'checks_and_balances',
    title: 'Does the debt limit add spending',
    mythStatement: 'Raising the debt limit approves new government spending.',
    tvSoundbite: 'Floor speech: "Refusing to pay last month’s diners bill counts as a diet!"',
    realitySummary: 'The debt limit only lets the nation pay bills that Congress already passed.',
    byTheNumbers: 'Congress has raised or paused the debt limit over 100 times since 1940.',
    historicalHook: 'A 2011 debt limit standoff triggered the first downgrade of US credit.',
    whyItMatters: 'Use the Budget screen to cut future deficits, not a debt limit default threat.',
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
        payload: 'Balance the budget',
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
    category: 'market_ripple',
    title: 'Do foreign nations pay tariffs',
    mythStatement: 'Foreign states pay the tariffs placed on their goods.',
    tvSoundbite: 'Rally cheer: "Foreign treasuries will mail us giant gold checks at customs!"',
    realitySummary: 'Home buyers and importers pay the border tax through higher store prices.',
    byTheNumbers: 'US importers pay 100% of customs duties at the port of entry.',
    historicalHook: 'High tariffs in 1930 sparked foreign counter-tariffs that cut farm exports.',
    whyItMatters: 'Pair targeted sector tariffs with trade pacts to shield farm and factory exports.',
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
        payload: 'chips',
        actionKind: 'sector_tariff',
      },
      {
        label: 'Sign trade agreements',
        screen: 'trade',
        hint: 'Sign trade pacts to lower barriers on exports.',
        payload: 'americas',
        actionKind: 'trade_agreement',
      },
      {
        label: 'Domestic R&D credits',
        screen: 'budget',
        hint: 'Fund home plant research through tax credits.',
        payload: 'Infrastructure push',
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
    category: 'checks_and_balances',
    title: 'Can you veto single budget lines',
    mythStatement: 'Presidents can cross out wasteful budget items before signing a law.',
    tvSoundbite: 'Op-ed column: "Take a black marker and cross out the pork lines before signing!"',
    realitySummary: 'The Constitution requires the President to sign or veto an entire bill.',
    byTheNumbers: '43 state governors have a line-item veto, but 0 US Presidents do.',
    historicalHook: 'In 1998, the Supreme Court struck down a brief federal line-item veto law.',
    whyItMatters: 'Shape spending lines in Budget and Congress before the bill reaches your desk.',
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
        payload: 'Balance the budget',
        actionKind: 'budget_package',
      },
      {
        label: 'Give budget speech',
        screen: 'oval',
        hint: 'Give speeches to rally voter pressure on bills.',
        payload: 'speech',
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
    category: 'electoral_mechanics',
    title: 'Does popular vote grant a total mandate',
    mythStatement: 'Winning the total vote lets a President pass any bill.',
    tvSoundbite: 'Press host: "Half the vote plus one means Congress must rubber-stamp every bill!"',
    realitySummary: 'Presidents win through state electors. Congress still writes the laws.',
    byTheNumbers: '435 House districts and 50 states elect lawmakers on separate timelines.',
    historicalHook: 'Midterm voters have flipped House or Senate control in most modern terms.',
    whyItMatters: 'Watch swing state polling and whip House coalitions to turn campaign goals into law.',
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
        payload: 'amendment',
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
    category: 'budget_math',
    title: 'Does border closure balance the budget',
    mythStatement: 'Sealing the border wipes out the budget gap.',
    tvSoundbite: 'Rally flyer: "Shut every border gate and our whole debt is gone by Friday!"',
    realitySummary: 'The deficit stems from care laws, debt interest, and aging workers.',
    byTheNumbers: 'Pensions, health care, and debt interest make up over 73% of spending.',
    historicalHook: 'Border guards and ports make up less than one percent of yearly spending.',
    whyItMatters: 'Balancing the budget over time depends on old age checks, health costs, and taxes.',
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
        payload: 'Balance the budget',
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
        payload: 'pay',
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
    category: 'checks_and_balances',
    title: 'Can one court pick reverse past rulings',
    mythStatement: 'A new court pick can reverse past rulings right away.',
    tvSoundbite: 'Panelist: "Swear in the new judge at noon and overturn five old laws by one!"',
    realitySummary: 'The Supreme Court only rules on live lawsuits that work up on appeal.',
    byTheNumbers: 'The Supreme Court hears roughly 70 cases out of 7,000 petitions each year.',
    historicalHook: 'Since 1793, the high court has refused to give advice without a real lawsuit.',
    whyItMatters: 'Pass clear bills in Congress so your rules hold up when tested in court.',
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
        payload: 'judicial',
        actionKind: 'open_modal',
      },
      {
        label: 'Enact judicial reforms',
        screen: 'powers',
        hint: 'Pass ethics rules and term limits for judges.',
        payload: 'judicial',
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
  {
    id: 'print_money_debt',
    category: 'market_ripple',
    title: 'Can we print cash to pay off debt',
    mythStatement: 'The Treasury can print cash to pay off the whole national debt.',
    tvSoundbite: 'Web meme: "Mint one giant gold coin, hand it to the Fed, and we are debt free!"',
    realitySummary: 'Printing cash to pay debt floods banks with money and sparks big price spikes.',
    byTheNumbers: 'Over $30 trillion in US bonds are held by savers, pensions, and banks.',
    historicalHook: 'Early paper notes in 1779 lost huge value when printed without tax backing.',
    whyItMatters: 'Keep inflation calm and deficits in check so bond buyers trust US credit.',
    mirageLabel: 'Mint $35T Platinum Coin',
    predictionPrompt: {
      question: 'What happens if a nation prints new cash to pay off its debt?',
      options: ['Prices soar as money loses value', 'Debt vanishes with zero price pain'],
      correctIndex: 0,
      refutation: 'Printing trillions in new cash floods banks and drives up store prices fast.',
    },
    flowSteps: ['Treasury borrows', 'Bond auctions', 'Fed guards money supply', 'Runaway inflation risk'],
    realLevers: ['Reduce yearly deficit', 'Grow the tax base', 'Keep inflation steady'],
    realLeverActions: [
      {
        label: 'Balance the budget',
        screen: 'budget',
        hint: 'Trim budget gaps to slow down bond loans.',
        payload: 'Balance the budget',
        actionKind: 'budget_package',
      },
      {
        label: 'Check debt trajectory',
        screen: 'economy',
        hint: 'See how debt stacks up to total output.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Support steady Fed policy',
        screen: 'powers',
        hint: 'Let the central bank keep store prices calm.',
        payload: 'fed',
        actionKind: 'open_modal',
      },
    ],
    challenges: 'both',
    target: 'mechanism',
    citation: {
      title: 'Federal Reserve: Money Supply and Inflation Overview',
      url: 'https://www.federalreserve.gov/faqs/money_12845.htm',
      confirmed: false,
    },
  },
  {
    id: 'ceo_wage_cap',
    category: 'power_limit',
    title: 'Can an order cap private CEO pay',
    mythStatement: 'The President can cap private firm paychecks with an order.',
    tvSoundbite: 'Viral post: "Sign a one-page order tonight so no boss makes more than fifty grand!"',
    realitySummary: 'Private pay is set by company boards unless Congress changes tax laws.',
    byTheNumbers: 'White House wage rules only cover federal work contracts, not all private shops.',
    historicalHook: 'In 1993, Congress capped tax breaks for top pay, shifting pay into stock grants.',
    whyItMatters: 'Use income tax brackets, corporate tax rates, and contractor pay rules to narrow gaps.',
    mirageLabel: 'Cap Private CEO Pay by Order',
    predictionPrompt: {
      question: 'How can the federal government shape private top pay?',
      options: ['Through tax rates passed by Congress', 'By White House private wage decrees'],
      correctIndex: 0,
      refutation: 'You cannot set private pay by decree. Congress can tax high pay or set rules.',
    },
    flowSteps: ['Company boards', 'Private contracts', 'Tax code rules', 'Take-home pay'],
    realLevers: ['Raise top tax rates', 'Raise corporate taxes', 'Set contractor pay rules'],
    realLeverActions: [
      {
        label: 'Adjust top tax rates',
        screen: 'budget',
        hint: 'Raise income or firm tax sliders in Budget.',
        payload: 'inc',
        actionKind: 'budget_lever',
      },
      {
        label: 'Sign contractor wage order',
        screen: 'powers',
        hint: 'Raise pay floors on federal work contracts.',
        payload: 'federal_contractor_wage',
        actionKind: 'sign_order',
      },
      {
        label: 'Check household gap',
        screen: 'economy',
        hint: 'Track home pay and the wealth gap.',
        actionKind: 'navigate_only',
      },
    ],
    challenges: 'left',
    target: 'mechanism',
    citation: {
      title: 'CRS: Executive Compensation Tax Rules (IF12154)',
      url: 'https://crsreports.congress.gov/product/pdf/IF/IF12154',
      confirmed: false,
    },
  },
  {
    id: 'abolish_irs_free',
    category: 'budget_math',
    title: 'Does firing tax clerks end taxes',
    mythStatement: 'Shutting the tax office means people do not owe taxes.',
    tvSoundbite: 'Bumper sticker: "Fire the tax clerks and every paycheck is tax free forever!"',
    realitySummary: 'Congress writes tax laws, and firing auditors mostly helps rich tax cheats.',
    byTheNumbers: 'Each $1 spent on complex tax audits brings back $5 to $9 in owed taxes.',
    historicalHook: 'Paycheck tax rules started in 1943, so workers pay taxes from each check.',
    whyItMatters: 'To lower family taxes fairly, change the tax brackets in a bill through Congress.',
    mirageLabel: 'Abolish Tax Clerks for Free Cash',
    predictionPrompt: {
      question: 'What happens when tax audit staff is cut deeply?',
      options: ['Unpaid taxes rise and deficits grow', 'Regular workers stop owing payroll tax'],
      correctIndex: 0,
      refutation: 'Workers still pay paycheck taxes right away while rich tax cheats skip out.',
    },
    flowSteps: ['Congress sets tax law', 'Paycheck withholding', 'Complex audits drop', 'Deficit widens'],
    realLevers: ['Cut tax rates by law', 'Simplify the tax code', 'Fund fair tax audits'],
    realLeverActions: [
      {
        label: 'Cut tax rates in Budget',
        screen: 'budget',
        hint: 'Send a real tax cut plan to Congress.',
        payload: 'Tax cut',
        actionKind: 'budget_package',
      },
      {
        label: 'Pass tax bill in Congress',
        screen: 'congress',
        hint: 'Win votes in the House and Senate to change tax law.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Review family tax impact',
        screen: 'budget',
        hint: 'See how tax cuts hit a family each month.',
        actionKind: 'navigate_only',
      },
    ],
    challenges: 'right',
    target: 'institution',
    citation: {
      title: 'CBO: Effects of IRS Funding on Federal Revenue',
      url: 'https://www.cbo.gov/publication/57444',
      confirmed: false,
    },
  },
  {
    id: 'ban_stock_buybacks',
    category: 'market_ripple',
    title: 'Can you ban stock buybacks by order',
    mythStatement: 'A White House order can ban stock buybacks right away.',
    tvSoundbite: 'TV panel: "Outlaw Wall Street stock buybacks by Friday and force firms to build plants!"',
    realitySummary: 'Only Congress can ban or tax stock buybacks across private markets.',
    byTheNumbers: 'Congress placed a 1% excise tax on corporate stock buybacks in 2022.',
    historicalHook: 'When buybacks are taxed, firms often shift payouts into cash dividends instead.',
    whyItMatters: 'Use research grants and corporate tax credits to reward firms that build new plants.',
    mirageLabel: 'Ban Wall Street Buybacks',
    predictionPrompt: {
      question: 'Who has legal power to tax or ban corporate stock buybacks?',
      options: ['Congress through tax and market laws', 'The President through a press memo'],
      correctIndex: 0,
      refutation: 'Market rules and buyback taxes come from laws passed by Congress.',
    },
    flowSteps: ['Corporate profits', 'Tax law incentives', 'Plant investment', 'Shareholder payouts'],
    realLevers: ['Corporate tax rates', 'R&D investment grants', 'Antitrust enforcement'],
    realLeverActions: [
      {
        label: 'Enact antitrust order',
        screen: 'powers',
        hint: 'Tell agencies to block big firm mergers.',
        payload: 'antitrust_enforcement',
        actionKind: 'sign_order',
      },
      {
        label: 'Boost R&D incentives',
        screen: 'budget',
        hint: 'Reward firms that build new labs and tools.',
        payload: 'Infrastructure push',
        actionKind: 'budget_package',
      },
      {
        label: 'Adjust corporate tax rate',
        screen: 'budget',
        hint: 'Change firm tax rates in your budget bill.',
        payload: 'corp',
        actionKind: 'budget_lever',
      },
    ],
    challenges: 'left',
    target: 'mechanism',
    citation: {
      title: 'CRS: Stock Buybacks and the Excise Tax (IF12308)',
      url: 'https://crsreports.congress.gov/product/pdf/IF/IF12308',
      confirmed: false,
    },
  },
  {
    id: 'fire_fed_chair',
    category: 'checks_and_balances',
    title: 'Can you fire the Fed Chair over rates',
    mythStatement: 'The President can fire the central bank chief whenever loan rates rise.',
    tvSoundbite: 'Talk show: "If the Fed Chair will not cut rates by two points, pack their boxes!"',
    realitySummary: 'Law shields Fed chiefs from being fired over rate choices.',
    byTheNumbers: 'Fed governors serve 14-year staggered terms to block election pressure.',
    historicalHook: 'In 1935, the Supreme Court upheld legal shields for independent board members.',
    whyItMatters: 'Publicly pressuring the Fed costs Clout and can rattle bond markets if overused.',
    mirageLabel: 'Fire Fed Chair Over Rates',
    predictionPrompt: {
      question: 'Why did Congress shield the Fed Chair from being fired over rate votes?',
      options: ['To stop presidents from goosing rates before votes', 'Because rich banks wrote the rulebook'],
      correctIndex: 0,
      refutation: 'Free rate setting stops short-term election booms that cause bad price spikes.',
    },
    flowSteps: ['Four-year Chair term', 'For-cause protection', 'Steady rate policy', 'Lower inflation risk'],
    realLevers: ['Wait for term to expire', 'Publicly pressure the Fed', 'Lower budget deficits'],
    realLeverActions: [
      {
        label: 'Open Fed relations',
        screen: 'powers',
        hint: 'Weigh the pros and cons of pressuring the Fed.',
        payload: 'fed',
        actionKind: 'open_modal',
      },
      {
        label: 'Cool deficits in Budget',
        screen: 'budget',
        hint: 'Ease price stress by cutting federal loans.',
        payload: 'Balance the budget',
        actionKind: 'budget_package',
      },
      {
        label: 'Check inflation trend',
        screen: 'economy',
        hint: 'Watch how prices and Fed rates move together.',
        actionKind: 'navigate_only',
      },
    ],
    challenges: 'right',
    target: 'institution',
    citation: {
      title: 'CRS: Federal Reserve Chair Removal Protections (LSB10314)',
      url: 'https://crsreports.congress.gov/product/pdf/LSB/LSB10314',
      confirmed: false,
    },
  },
  {
    id: 'congress_pay_stop',
    category: 'checks_and_balances',
    title: 'Can you dock lawmaker pay in a shutdown',
    mythStatement: 'The President can freeze lawmakers’ paychecks until they pass a budget.',
    tvSoundbite: 'Diner table: "Lock the Capitol doors and stop their paychecks until they agree!"',
    realitySummary: 'Basic law bars changing House and Senate pay until the next vote.',
    byTheNumbers: 'The 27th Amendment took 202 years to ratify after it was first proposed in 1789.',
    historicalHook: 'Framers barred mid-term pay changes so a wealthy president could not starve Congress.',
    whyItMatters: 'Use auto-whip deals and public speeches to pass budgets before the clock runs out.',
    mirageLabel: 'Dock Lawmaker Paychecks',
    predictionPrompt: {
      question: 'Who still gets paid by law during a federal government shutdown?',
      options: ['House and Senate members by law', 'National park rangers and food inspectors'],
      correctIndex: 0,
      refutation: 'Basic law protects House and Senate paychecks even when agencies shut down.',
    },
    flowSteps: ['27th Amendment', 'Automatic lawmaker pay', 'Agency workers furloughed', 'Voters punish delay'],
    realLevers: ['Broker bipartisan deals', 'Use the bully pulpit', 'Propose constitutional amendment'],
    realLeverActions: [
      {
        label: 'Broker House deals',
        screen: 'congress',
        hint: 'Use auto-whip to pass the budget before the deadline.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Give pressure speech',
        screen: 'oval',
        hint: 'Rally swing state voters to push lawmakers.',
        payload: 'speech',
        actionKind: 'open_modal',
      },
      {
        label: 'Explore Amendments',
        screen: 'congress',
        hint: 'See how new amendments are put to a vote.',
        payload: 'amendment',
        actionKind: 'open_modal',
      },
    ],
    challenges: 'both',
    target: 'institution',
    citation: {
      title: 'CRS: Member Pay During a Government Shutdown (RL30001)',
      url: 'https://crsreports.congress.gov/product/pdf/RL/RL30001',
      confirmed: false,
    },
  },
  {
    id: 'strategic_oil_reserve',
    category: 'market_ripple',
    title: 'Can the oil reserve fix fuel prices',
    mythStatement: 'Tapping the national oil reserve can keep gas cheap for years.',
    tvSoundbite: 'Morning show: "Open the giant salt caverns in Texas and gas will stay two bucks!"',
    realitySummary: 'The reserve holds emergency crude for short supply shocks, not years of use.',
    byTheNumbers: 'The US uses 20M barrels a day; the reserve maxes out near 700M barrels.',
    historicalHook: 'Congress built the reserve after the 1973 oil shock to cushion sudden shipping stops.',
    whyItMatters: 'Tap reserves to calm sudden crisis spikes while building clean power for the long run.',
    mirageLabel: 'Drain Oil Reserve for $2 Gas',
    predictionPrompt: {
      question: 'How long could the Strategic Petroleum Reserve supply all US fuel needs alone?',
      options: ['Roughly one month of total US demand', 'Four full years of cheap pump gas'],
      correctIndex: 0,
      refutation: 'The reserve holds weeks of supply to blunt sudden shocks, not years of daily use.',
    },
    flowSteps: ['Global oil shock', 'Reserve drawdown', 'Brief price relief', 'Caverns must refill'],
    realLevers: ['Clean grid permitting', 'Infrastructure investment', 'Strategic reserve timing'],
    realLeverActions: [
      {
        label: 'Fast-track grid permits',
        screen: 'powers',
        hint: 'Speed up clean energy lines to cut long-term fuel demand.',
        payload: 'clean_grid_permitting',
        actionKind: 'sign_order',
      },
      {
        label: 'Fund energy infrastructure',
        screen: 'budget',
        hint: 'Back domestic power and transit lines in the budget.',
        payload: 'Infrastructure push',
        actionKind: 'budget_package',
      },
    ],
    challenges: 'both',
    target: 'mechanism',
    citation: {
      title: 'Department of Energy: Strategic Petroleum Reserve Overview',
      url: 'https://www.energy.gov/ceser/strategic-petroleum-reserve',
      confirmed: false,
    },
  },
  {
    id: 'reconciliation_filibuster',
    category: 'checks_and_balances',
    title: 'Can 51 senators pass any bill',
    mythStatement: 'A simple fifty-one vote majority can pass any law in the Senate.',
    tvSoundbite: 'TV host: "You have fifty-one votes in the Senate, so pass the whole wish list tonight!"',
    realitySummary: 'Most Senate bills need sixty votes unless they only change taxes or spending.',
    byTheNumbers: '60 Senate votes end a filibuster, while 51 votes pass a budget bill.',
    historicalHook: 'Since the 1980s, the Byrd Rule has stripped non-budget items from 51-vote bills.',
    whyItMatters: 'You can pass tax and spending bills with slim margins, or spend Clout to change Senate rules.',
    mirageLabel: 'Force All Bills With 51 Votes',
    predictionPrompt: {
      question: 'Which Senate bills can pass with fifty-one votes under standard rules?',
      options: ['Budget bills focused on taxes and spending', 'Any bill that the White House backs'],
      correctIndex: 0,
      refutation: 'Only budget bills that change outlays or taxes qualify for a fifty-one vote pass.',
    },
    flowSteps: ['Bill drafted', 'Senate Byrd Rule check', '60 votes for policy', '51 votes for budget'],
    realLevers: ['Budget reconciliation bills', 'Whip moderate senators', 'Reform filibuster rules'],
    realLeverActions: [
      {
        label: 'Review Senate rules',
        screen: 'congress',
        hint: 'Weigh the Clout cost of changing the Senate filibuster rule.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Send budget package',
        screen: 'budget',
        hint: 'Put tax and spending shifts into your annual budget bill.',
        payload: 'Keep as is',
        actionKind: 'budget_package',
      },
    ],
    challenges: 'both',
    target: 'institution',
    citation: {
      title: 'CRS: The Budget Reconciliation Process and the Byrd Rule (RL30862)',
      url: 'https://crsreports.congress.gov/product/pdf/RL/RL30862',
      confirmed: false,
    },
  },
  {
    id: 'state_police_power',
    category: 'electoral_mechanics',
    title: 'Does the President run local schools',
    mythStatement: 'The White House controls local school lessons and city police forces.',
    tvSoundbite: 'Campaign ad: "Elect me and I will rewrite every town’s math book on day one!"',
    realitySummary: 'States and towns fund and run local schools and police under the Tenth Amendment.',
    byTheNumbers: 'Over 90% of K-12 school funding comes from state and local tax sources.',
    historicalHook: 'Federal law bars Washington from forcing one reading list on local schools.',
    whyItMatters: 'Use federal budget grants to nudge states, since you cannot command local boards directly.',
    mirageLabel: 'Order National School Curriculum',
    predictionPrompt: {
      question: 'Who runs local public schools and city police forces by law?',
      options: ['State and local governments', 'White House cabinet departments'],
      correctIndex: 0,
      refutation: 'States and towns run local schools and police. Washington only sends aid grants.',
    },
    flowSteps: ['10th Amendment', 'State laws & taxes', 'Local school boards', 'Optional federal grants'],
    realLevers: ['Education grant funding', 'Child tax credits', 'Bully pulpit speeches'],
    realLeverActions: [
      {
        label: 'Fund education grants',
        screen: 'budget',
        hint: 'Increase federal grant support for public schools in Budget.',
        payload: 'edu',
        actionKind: 'budget_lever',
      },
      {
        label: 'Check family impact',
        screen: 'voters',
        hint: 'See how school and family grants affect voter groups.',
        actionKind: 'navigate_only',
      },
    ],
    challenges: 'right',
    target: 'institution',
    citation: {
      title: 'Department of Education: Federal Role in Education Overview',
      url: 'https://www.ed.gov/about/ed-overview/federal-role-in-education',
      confirmed: false,
    },
  },
  {
    id: 'price_controls_shortages',
    category: 'market_ripple',
    title: 'Do price freezes stop inflation',
    mythStatement: 'Freezing store prices by law cures inflation without side effects.',
    tvSoundbite: 'Call-in show: "Just pass a law making it illegal to raise grocery prices!"',
    realitySummary: 'Broad price freezes cause empty shelves when makers cannot cover supply costs.',
    byTheNumbers: 'A 90-day price freeze in 1971 was followed by years of high inflation.',
    historicalHook: 'When beef and fuel prices were capped in the 1970s, ranchers and refiners held back supply.',
    whyItMatters: 'Cool inflation by easing supply lines, cutting deficits, and letting the Fed act.',
    mirageLabel: 'Freeze All Store Prices by Law',
    predictionPrompt: {
      question: 'What happens when a law caps store prices below the cost to make goods?',
      options: ['Producers cut supply and shelves empty out', 'Stores sell more goods at lower cost'],
      correctIndex: 0,
      refutation: 'When prices are capped below cost, firms make less and buyers face shortages.',
    },
    flowSteps: ['Price cap ordered', 'Supply costs stay high', 'Firms cut output', 'Shortages & lines'],
    realLevers: ['Cool fiscal deficits', 'Ease supply chains', 'Antitrust enforcement'],
    realLeverActions: [
      {
        label: 'Cool deficits in Budget',
        screen: 'budget',
        hint: 'Reduce deficit spending to ease demand pressure on prices.',
        payload: 'Balance the budget',
        actionKind: 'budget_package',
      },
      {
        label: 'Enforce antitrust rules',
        screen: 'powers',
        hint: 'Challenge big firm mergers without freezing store supply.',
        payload: 'antitrust_enforcement',
        actionKind: 'sign_order',
      },
    ],
    challenges: 'left',
    target: 'mechanism',
    citation: {
      title: 'Federal Reserve History: The Great Inflation and Wage-Price Controls',
      url: 'https://www.federalreservehistory.org/essays/great-inflation',
      confirmed: false,
    },
  },
  {
    id: 'pardon_power_limits',
    category: 'power_limit',
    title: 'Can a President pardon state crimes',
    mythStatement: 'A pardon from the White House wipes out any crime in the nation.',
    tvSoundbite: 'Legal pundit: "One stroke of the pardon pen clears federal, state, and civil court dockets!"',
    realitySummary: 'The President can pardon federal crimes, but never state crimes or civil suits.',
    byTheNumbers: '1 federal pardon power vs. 50 separate state court systems.',
    historicalHook: 'Basic law limits White House pardons to crimes against federal law.',
    whyItMatters: 'Our system splits court power between Washington and the fifty state governors.',
    mirageLabel: 'Blanket Pardon State Convictions',
    predictionPrompt: {
      question: 'Which court cases can a President pardon by law?',
      options: ['Only federal crimes under US law', 'Both federal and state criminal cases'],
      correctIndex: 0,
      refutation: 'White House pardons only cover federal crimes. State governors hold state pardon power.',
    },
    flowSteps: ['Article II clause', 'Federal crimes covered', 'State courts separate', 'Civil suits untouched'],
    realLevers: ['Federal justice directives', 'Appoint federal judges', 'Civil rights enforcement'],
    realLeverActions: [
      {
        label: 'Review executive powers',
        screen: 'powers',
        hint: 'See which legal tools belong to the White House.',
        actionKind: 'navigate_only',
      },
      {
        label: 'Check voter trust',
        screen: 'voters',
        hint: 'Track how your choices shift voter support.',
        actionKind: 'navigate_only',
      },
    ],
    challenges: 'right',
    target: 'institution',
    citation: {
      title: 'CRS: Overview of the Presidential Pardon Power (LSB10194)',
      url: 'https://crsreports.congress.gov/product/pdf/LSB/LSB10194',
      confirmed: false,
    },
  },
  {
    id: 'treaty_executive_agreement',
    category: 'checks_and_balances',
    title: 'Do solo foreign pacts last forever',
    mythStatement: 'A foreign pact signed at the White House binds all future terms.',
    tvSoundbite: 'Summit anchor: "The ink is dry on this accord, so no future president can undo it!"',
    realitySummary: 'Foreign deals signed without the Senate can be dropped by the next president.',
    byTheNumbers: '67 Senate votes lock in a treaty, while 0 votes are needed to leave a solo pact.',
    historicalHook: 'Presidents often sign solo pacts because two-thirds Senate treaty votes are rare.',
    whyItMatters: 'Trade pacts and orders work fast, but lasting laws require votes in Congress.',
    mirageLabel: 'Lock In Permanent Solo Treaty',
    predictionPrompt: {
      question: 'What does it take to make a foreign treaty binding law?',
      options: ['A two-thirds vote of the Senate', 'A solo signature at a foreign summit'],
      correctIndex: 0,
      refutation: 'The Senate must back a treaty by a two-thirds vote to make it binding law.',
    },
    flowSteps: ['Summit negotiation', 'Executive agreement', 'No 67-vote Senate vote', 'Next president can exit'],
    realLevers: ['Bilateral trade agreements', 'Build Senate majorities', 'Targeted sanctions'],
    realLeverActions: [
      {
        label: 'Negotiate trade accords',
        screen: 'trade',
        hint: 'Sign bilateral trade pacts to open foreign export markets.',
        payload: 'americas',
        actionKind: 'trade_agreement',
      },
      {
        label: 'Build Senate support',
        screen: 'congress',
        hint: 'Grow your Senate coalition to pass lasting laws.',
        actionKind: 'navigate_only',
      },
    ],
    challenges: 'left',
    target: 'institution',
    citation: {
      title: 'CRS: International Law and Agreements: Their Effect Upon U.S. Law (RL32528)',
      url: 'https://crsreports.congress.gov/product/pdf/RL/RL32528',
      confirmed: false,
    },
  },
] as const;

export function getMyth(id: string): MythCard | undefined {
  return MYTHS_CATALOG.find((m) => m.id === id);
}

/**
 * Returns a short, human-readable explanation of why this myth card surfaced in the current context.
 */
export function getContextualTriggerReason(card: MythCard, state: GameState, screen?: ScreenId): string {
  const econ = state.econ;
  const inflation = econ ? (econ.inflation > 1 ? econ.inflation : econ.inflation * 100) : 2.2;
  const fedRate = econ ? (econ.fedRate > 1 ? econ.fedRate : econ.fedRate * 100) : 4.0;
  const unemployment = econ ? (econ.unemployment > 1 ? econ.unemployment : econ.unemployment * 100) : 4.1;
  const debtPct = econ && econ.gdp > 0 ? (econ.debt / econ.gdp) * 100 : 120;
  const tariff = state.policy?.tar ?? 11;

  if (inflation >= 3.2 && ['gas_prices', 'price_controls_shortages', 'strategic_oil_reserve'].includes(card.id)) {
    return `Surfaced because inflation is elevated (${inflation.toFixed(1)}%)`;
  }
  if (fedRate >= 4.4 && ['interest_rates', 'fire_fed_chair'].includes(card.id)) {
    return `Surfaced because Fed rates are high (${fedRate.toFixed(1)}%)`;
  }
  if (unemployment >= 4.6 && card.id === 'presidential_jobs') {
    return `Surfaced because unemployment is elevated (${unemployment.toFixed(1)}%)`;
  }
  if (debtPct >= 121 && ['debt_ceiling_default', 'print_money_debt', 'foreign_aid_deficit'].includes(card.id)) {
    return `Surfaced because federal debt is ${Math.round(debtPct)}% of GDP`;
  }
  if (tariff > 12 && ['trade_deficits', 'treaty_executive_agreement'].includes(card.id)) {
    return `Surfaced because tariffs are at ${tariff}%`;
  }
  if (screen === 'budget') return 'Context: Federal Budget & Tax Scale';
  if (screen === 'economy') return 'Context: Markets & Central Bank';
  if (screen === 'congress') return 'Context: House & Senate Procedure';
  if (screen === 'powers') return 'Context: Article II Executive Limits';
  if (screen === 'trade') return 'Context: Customs, Tariffs & Pacts';
  if (screen === 'voters') return 'Context: Federalism & Electoral Map';
  return 'Context: Presidential Institutional Check';
}

/**
 * Computes a contextual relevance weight for a myth card given the current game state and optional screen.
 */
function scoreMythRelevance(card: MythCard, state: GameState, screen?: ScreenId): number {
  let score = 1;
  const econ = state.econ;
  const inflation = econ ? (econ.inflation > 1 ? econ.inflation : econ.inflation * 100) : 2.2;
  const fedRate = econ ? (econ.fedRate > 1 ? econ.fedRate : econ.fedRate * 100) : 4.0;
  const unemployment = econ ? (econ.unemployment > 1 ? econ.unemployment : econ.unemployment * 100) : 4.1;
  const debtPct = econ && econ.gdp > 0 ? (econ.debt / econ.gdp) * 100 : 120;
  const tariff = state.policy?.tar ?? 11;

  if (screen && card.realLeverActions.some((a) => a.screen === screen)) {
    score += 3;
  }

  switch (card.id) {
    case 'gas_prices':
    case 'strategic_oil_reserve':
    case 'price_controls_shortages':
      if (inflation >= 3.2) score += 6;
      break;
    case 'interest_rates':
    case 'fire_fed_chair':
      if (fedRate >= 4.4 || inflation >= 3.0) score += 5;
      break;
    case 'presidential_jobs':
      if (unemployment >= 4.6) score += 6;
      break;
    case 'debt_ceiling_default':
    case 'print_money_debt':
      if (debtPct >= 122) score += 5;
      break;
    case 'foreign_aid_deficit':
    case 'supply_side_taxes':
    case 'abolish_irs_free':
    case 'immigration_crime_budget':
      if (debtPct >= 120 || screen === 'budget') score += 4;
      break;
    case 'trade_deficits':
    case 'treaty_executive_agreement':
      if (tariff > 12 || (state.trade?.sectorTariffs.length ?? 0) > 0 || screen === 'trade') score += 6;
      break;
    case 'rule_by_decree':
    case 'scotus_instant_reversal':
    case 'pardon_power_limits':
      if ((state.activeOrders?.length ?? 0) > 0 || screen === 'powers') score += 5;
      break;
    case 'veto_line_item':
    case 'congress_pay_stop':
    case 'reconciliation_filibuster':
      if (screen === 'congress' || state.turn % 4 === 2) score += 5;
      break;
    case 'popular_vote_mandate':
    case 'state_police_power':
      if (screen === 'voters' || state.approval < 46 || state.approval > 56) score += 5;
      break;
    case 'ceo_wage_cap':
    case 'ban_stock_buybacks':
      if ((econ?.gini ?? 0.41) >= 0.41 || screen === 'economy' || screen === 'powers') score += 4;
      break;
  }

  return score;
}

/**
 * Picks a contextually relevant, seeded-random myth card for the current turn and screen.
 * Prioritizes unviewed myths first, using pure keyed RNG (`draw`) to break ties and rotate per seed/turn.
 */
export function pickContextualMyth(state: GameState, screen?: ScreenId): MythCard {
  const viewed = new Set(state.viewedMyths ?? []);
  const unviewed = MYTHS_CATALOG.filter((m) => !viewed.has(m.id));
  const pool = unviewed.length > 0 ? unviewed : MYTHS_CATALOG;

  const seed = Number.isInteger(state.seed) ? state.seed : 1;
  const turn = Number.isInteger(state.turn) ? state.turn : 1;

  let bestCard = pool[0]!;
  let bestScore = -1;

  for (const card of pool) {
    const contextWeight = scoreMythRelevance(card, state, screen);
    const jitter = draw(seed, 'events', turn, `myth:${screen ?? 'any'}:${card.id}`) * 3.5;
    const total = contextWeight + jitter;
    if (total > bestScore) {
      bestScore = total;
      bestCard = card;
    }
  }

  return bestCard;
}

/**
 * Returns the next unviewed myth card (excluding `currentMythId`), weighted by context + seeded RNG.
 */
export function pickNextUnviewedMyth(state: GameState, currentMythId: string, screen?: ScreenId): MythCard | null {
  const viewed = new Set(state.viewedMyths ?? []);
  viewed.add(currentMythId);
  const candidates = MYTHS_CATALOG.filter((m) => !viewed.has(m.id));
  if (candidates.length === 0) return null;

  const seed = Number.isInteger(state.seed) ? state.seed : 1;
  const turn = Number.isInteger(state.turn) ? state.turn : 1;

  let best = candidates[0]!;
  let bestScore = -1;
  for (const card of candidates) {
    const score =
      scoreMythRelevance(card, state, screen) +
      draw(seed, 'events', turn, `next_myth:${currentMythId}:${card.id}`) * 3.0;
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  return best;
}
