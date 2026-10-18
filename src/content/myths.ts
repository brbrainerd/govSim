// Sourced catalog of civics myth cards (PWR-06, LEARN-02, DECK-01, DECK-02, PIVOT-01, OBS-05, GR-20, GR-21, Pitfall 17).
// Focuses strictly on institutional mechanics and constitutional powers, never political values.
// Spectrum-balanced with |count(challenges=left) - count(challenges=right)| <= 1.

import type { ScreenId } from '../app/screens';
import type { GameState } from '../engine/game';
import { draw } from '../engine/rng';

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
  readonly title: string;
  readonly mythStatement: string;
  readonly tvSoundbite: string;
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
    tvSoundbite: 'Late-night TV host: "Turn the big desk dial marked CHEAP GAS to the left!"',
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
    title: 'Can you set interest rates',
    mythStatement: 'The President sets interest rates.',
    tvSoundbite: 'Angry caller: "Why did the White House raise my home loan rate this morning?"',
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
    title: 'Do presidents create jobs',
    mythStatement: 'The President creates private sector jobs.',
    tvSoundbite: 'Pundit: "The President built three hundred thousand jobs with his own hands in May!"',
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
    title: 'Can you ban anything by order',
    mythStatement: 'Presidents can change any law with an executive order.',
    tvSoundbite: 'Talk radio: "Just grab a fancy pen and sign a new law before lunch!"',
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
    title: 'Does foreign aid cause the deficit',
    mythStatement: 'Cutting foreign aid would balance the federal budget.',
    tvSoundbite: 'Town hall guest: "We send half the budget overseas! Cut aid and we are rich!"',
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
    title: 'Do tax cuts pay for themselves',
    mythStatement: 'Cutting tax rates always grows the economy enough to raise tax cash.',
    tvSoundbite: 'Cable guest: "Cut taxes to zero and the government will swim in bonus cash!"',
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
    title: 'Does the debt limit add spending',
    mythStatement: 'Raising the debt limit approves new government spending.',
    tvSoundbite: 'Floor speech: "Refusing to pay last month’s diners bill counts as a diet!"',
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
    title: 'Do foreign nations pay tariffs',
    mythStatement: 'Foreign states pay the tariffs placed on their goods.',
    tvSoundbite: 'Rally cheer: "Foreign treasuries will mail us giant gold checks at customs!"',
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
    title: 'Can you veto single budget lines',
    mythStatement: 'Presidents can cross out wasteful budget items before signing a law.',
    tvSoundbite: 'Op-ed column: "Take a black marker and cross out the pork lines before signing!"',
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
    title: 'Does popular vote grant a total mandate',
    mythStatement: 'Winning the total vote lets a President pass any bill.',
    tvSoundbite: 'Press host: "Half the vote plus one means Congress must rubber-stamp every bill!"',
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
    title: 'Does border closure balance the budget',
    mythStatement: 'Sealing the border wipes out the budget gap.',
    tvSoundbite: 'Rally flyer: "Shut every border gate and our whole debt is gone by Friday!"',
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
    title: 'Can one court pick reverse past rulings',
    mythStatement: 'A new court pick can reverse past rulings right away.',
    tvSoundbite: 'Panelist: "Swear in the new judge at noon and overturn five old laws by one!"',
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
    title: 'Can we print cash to pay off debt',
    mythStatement: 'The Treasury can print cash to pay off the whole national debt.',
    tvSoundbite: 'Web meme: "Mint one giant gold coin, hand it to the Fed, and we are debt free!"',
    realitySummary: 'Printing cash to pay debt floods banks with money and sparks big price spikes.',
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
    title: 'Can an order cap private CEO pay',
    mythStatement: 'The President can cap private firm paychecks with an order.',
    tvSoundbite: 'Viral post: "Sign a one-page order tonight so no boss makes more than fifty grand!"',
    realitySummary: 'Private pay is set by company boards unless Congress changes tax laws.',
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
    title: 'Does firing tax clerks end taxes',
    mythStatement: 'Shutting the tax office means people do not owe taxes.',
    tvSoundbite: 'Bumper sticker: "Fire the tax clerks and every paycheck is tax free forever!"',
    realitySummary: 'Congress writes tax laws, and firing auditors mostly helps rich tax cheats.',
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
    title: 'Can you ban stock buybacks by order',
    mythStatement: 'A White House order can ban stock buybacks right away.',
    tvSoundbite: 'TV panel: "Outlaw Wall Street stock buybacks by Friday and force firms to build plants!"',
    realitySummary: 'Only Congress can ban or tax stock buybacks across private markets.',
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
    title: 'Can you fire the Fed Chair over rates',
    mythStatement: 'The President can fire the central bank chief whenever loan rates rise.',
    tvSoundbite: 'Talk show: "If the Fed Chair will not cut rates by two points, pack their boxes!"',
    realitySummary: 'Law shields Fed chiefs from being fired over rate choices.',
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
    title: 'Can you dock lawmaker pay in a shutdown',
    mythStatement: 'The President can freeze lawmakers’ paychecks until they pass a budget.',
    tvSoundbite: 'Diner table: "Lock the Capitol doors and stop their paychecks until they agree!"',
    realitySummary: 'Basic law bars changing House and Senate pay until the next vote.',
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
] as const;

export function getMyth(id: string): MythCard | undefined {
  return MYTHS_CATALOG.find((m) => m.id === id);
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
      if (tariff > 12 || (state.trade?.sectorTariffs.length ?? 0) > 0 || screen === 'trade') score += 6;
      break;
    case 'rule_by_decree':
    case 'scotus_instant_reversal':
      if ((state.activeOrders?.length ?? 0) > 0 || screen === 'powers') score += 5;
      break;
    case 'veto_line_item':
    case 'congress_pay_stop':
      if (screen === 'congress' || state.turn % 4 === 2) score += 5;
      break;
    case 'popular_vote_mandate':
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
