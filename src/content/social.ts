// Content catalog and empirical citations for domestic social policy levers (Phase 9, SOC-01..04, COPY-02).
// Plain-language summaries, friendly emojis, advisor why-click notes, and neutral civics trade-offs.

import type { SocialDomain } from '../engine/social';

export interface SocialCitation {
  readonly text: string;
  readonly url: string;
}

export interface SocialContent {
  readonly id: string;
  readonly domain: SocialDomain;
  readonly emoji: string;
  readonly title: string;
  readonly wonkLabel: string;
  readonly statutoryBasis: string;
  readonly description: string;
  readonly whyClick: string;
  readonly tradeoffPro: string;
  readonly tradeoffCon: string;
  readonly citation: SocialCitation;
}

export const SOCIAL_CATALOG: readonly SocialContent[] = [
  // Healthcare (SOC-01)
  {
    id: 'aca',
    domain: 'healthcare',
    emoji: '🏥',
    title: 'Health Plan Tax Credits',
    wonkLabel: 'ACA Section 36B Premium Tax Credits',
    statutoryBasis: '26 U.S.C. § 36B (Affordable Care Act)',
    description: 'Helps families pay monthly bills for health plans bought on state exchanges.',
    whyClick: 'Lowers family health bills right away and boosts life expectancy over time.',
    tradeoffPro: 'Cuts monthly health bills for families and covers more people.',
    tradeoffCon: 'Adds to the national debt each year.',
    citation: {
      text: 'CBO, Health Insurance Coverage and the Affordable Care Act',
      url: 'https://www.cbo.gov/publication/59273',
    },
  },
  {
    id: 'drg',
    domain: 'healthcare',
    emoji: '💊',
    title: 'Medicare Drug Price Deals',
    wonkLabel: 'Title XI Medicare Part D Price Negotiation',
    statutoryBasis: '42 U.S.C. § 1320f (Social Security Act)',
    description: 'Lets Medicare bargain with drug firms for lower prices on costly pills.',
    whyClick: 'A rare win that saves taxpayers money AND cuts senior pharmacy bills.',
    tradeoffPro: 'Cuts drug costs for seniors and trims the budget gap.',
    tradeoffCon: 'Drug makers warn lower profits may slow down new lab research.',
    citation: {
      text: 'CBO, How CBO Estimated the Budgetary Impact of Key Prescription Drug Provisions',
      url: 'https://www.cbo.gov/publication/58850',
    },
  },
  {
    id: 'pub',
    domain: 'healthcare',
    emoji: '🩺',
    title: 'Public Health Plan Option',
    wonkLabel: 'Federal Exchange Medicare-Rate Public Option',
    statutoryBasis: 'Public Health Service Act Title XXVII',
    description: 'Lets anyone buy into a public health plan that competes with private insurers.',
    whyClick: 'Forces private insurers to compete on price, firing up your base.',
    tradeoffPro: 'Gives shoppers a cheaper health plan choice and lowers premiums.',
    tradeoffCon: 'Hospitals and insurers fight it hard in Congress.',
    citation: {
      text: 'Commonwealth Fund, Public Plan Options: Expanding Coverage and Lowering Premiums',
      url: 'https://www.commonwealthfund.org/publications/issue-briefs/2021/mar/public-plan-options-expanding-coverage',
    },
  },

  // Immigration (SOC-02)
  {
    id: 'bdr',
    domain: 'immigration',
    emoji: '🛂',
    title: 'Border Patrol & Port Scanners',
    wonkLabel: 'CBP Border Infrastructure & Port Inspection Appropriations',
    statutoryBasis: '8 U.S.C. § 1103 (Immigration and Nationality Act)',
    description: 'Funds more border agents, smart cameras, and cargo scanners at entry ports.',
    whyClick: 'Wins conservative and moderate votes in Congress to help pass your bill.',
    tradeoffPro: 'Tightens border checks and wins key swing votes in Congress.',
    tradeoffCon: 'Costs billions each year without adding new workers to the workforce.',
    citation: {
      text: 'CRS, Border Security: Overview of Infrastructure and Personnel',
      url: 'https://crsreports.congress.gov/product/pdf/R/R42138',
    },
  },
  {
    id: 'vis',
    domain: 'immigration',
    emoji: '🧑‍🌾',
    title: 'Skilled & Farm Worker Visas',
    wonkLabel: 'H-1B & H-2A Statutory Employment Visa Cap Expansion',
    statutoryBasis: '8 U.S.C. § 1184(g) (INA Employment Visas)',
    description: 'Raises the yearly cap on legal work visas for tech engineers and farm hands.',
    whyClick: 'Fills open jobs fast, which cools food prices and lifts long-run growth.',
    tradeoffPro: 'Eases worker shortages, cools food prices, and lifts growth.',
    tradeoffCon: 'Can draw pushback from voters worried about job competition.',
    citation: {
      text: 'CBO, The Budgetary and Economic Effects of Immigration Policies',
      url: 'https://www.cbo.gov/publication/59697',
    },
  },
  {
    id: 'reg',
    domain: 'immigration',
    emoji: '📋',
    title: 'Legal Work Permits & Tax Rolls',
    wonkLabel: 'Earned Registry & Adjustment of Status Pathway',
    statutoryBasis: '8 U.S.C. § 1259 (Registry & Legalization)',
    description: 'Lets long-term workers pass a check, get a work permit, and pay taxes.',
    whyClick: 'Brings millions of workers onto the tax rolls and trims the debt.',
    tradeoffPro: 'Raises payroll tax revenue and lifts worker wages.',
    tradeoffCon: 'Draws fierce pushback from border hawks unless paired with border funding.',
    citation: {
      text: 'White House Council of Economic Advisers, Economic Benefits of Immigration Reform',
      url: 'https://www.whitehouse.gov/briefing-room/statements-releases/2021/09/17/economic-benefits-of-immigration-reform/',
    },
  },

  // Energy & Climate (SOC-03)
  {
    id: 'cln',
    domain: 'energy',
    emoji: '☀️',
    title: 'Clean Energy Tax Credits',
    wonkLabel: 'IRC Section 45Y/48E Clean Electricity Tax Credits',
    statutoryBasis: '26 U.S.C. § 45Y & § 48E',
    description: 'Gives tax breaks to companies building solar, wind, nuclear, and battery plants.',
    whyClick: 'Builds new domestic power plants and lowers electric bills over the decade.',
    tradeoffPro: 'Spurs clean factory jobs and cuts pollution over time.',
    tradeoffCon: 'Tax breaks add to the federal budget deficit up front.',
    citation: {
      text: 'JCT, Estimated Budgetary Effects of the Clean Energy Provisions',
      url: 'https://www.jct.gov/publications/2022/jcx-18-22/',
    },
  },
  {
    id: 'fos',
    domain: 'energy',
    emoji: '🛢️',
    title: 'Oil & Gas Drilling Leases',
    wonkLabel: 'Onshore & Offshore Federal Mineral Leasing Expansion',
    statutoryBasis: '30 U.S.C. § 181 (Mineral Leasing Act)',
    description: 'Opens more public land and offshore waters for oil and natural gas drilling.',
    whyClick: 'Brings down gas prices quickly and wins centrist energy-state votes.',
    tradeoffPro: 'Cuts fuel prices for drivers and brings in lease cash.',
    tradeoffCon: 'Adds more carbon smoke and upsets green voters.',
    citation: {
      text: 'CRS, Oil and Gas Leasing on Federal Lands: Authority and Overview',
      url: 'https://crsreports.congress.gov/product/pdf/R/R46777',
    },
  },
  {
    id: 'crb',
    domain: 'energy',
    emoji: '🏭',
    title: 'Power Plant Pollution Caps',
    wonkLabel: 'Clean Air Act Section 111(d) Carbon Emission Standards',
    statutoryBasis: '42 U.S.C. § 7411 (Clean Air Act)',
    description: 'Sets strict limits on smoke and carbon pollution from big power plants.',
    whyClick: 'Improves public health and clean air without costing the Treasury a dime.',
    tradeoffPro: 'Cleans up the air and improves long-term public health.',
    tradeoffCon: 'Power firms pass plant upgrade costs onto monthly home bills.',
    citation: {
      text: 'EPA, Regulatory Impact Analysis for Clean Air Standards for Power Plants',
      url: 'https://www.epa.gov/clean-air-act-overview',
    },
  },

  // Education (SOC-04)
  {
    id: 'k12',
    domain: 'education',
    emoji: '🏫',
    title: 'Local Public School Grants',
    wonkLabel: 'ESEA Title I-A Disadvantaged K-12 Formula Grants',
    statutoryBasis: '20 U.S.C. § 6301 (Elementary and Secondary Education Act)',
    description: 'Sends extra funds to local public schools in lower-income towns.',
    whyClick: 'Well liked by families and moderates; lifts future worker skills.',
    tradeoffPro: 'Helps local schools hire teachers and lifts future worker pay.',
    tradeoffCon: 'Costs federal budget dollars now while benefits take years to grow.',
    citation: {
      text: 'Department of Education, Title I Improving the Academic Achievement of the Disadvantaged',
      url: 'https://www2.ed.gov/programs/titleiparta/index.html',
    },
  },
  {
    id: 'sdr',
    domain: 'education',
    emoji: '🎓',
    title: 'Student Loan Bill Caps',
    wonkLabel: 'Income-Driven Student Loan Forgiveness & Cap Program',
    statutoryBasis: '20 U.S.C. § 1087e(d) (Higher Education Act)',
    description: 'Caps monthly federal student loan bills based on income and forgives old balances.',
    whyClick: 'Gives young grads quick monthly relief, though budget hawks dislike it.',
    tradeoffPro: 'Frees up monthly cash for young grads to buy homes and goods.',
    tradeoffCon: 'Shifts loan costs onto taxpayers and annoys fiscal centrists.',
    citation: {
      text: 'CBO, Budgetary Costs of Changes to the Federal Student Loan Income-Driven Repayment Plans',
      url: 'https://www.cbo.gov/publication/58983',
    },
  },
  {
    id: 'prek',
    domain: 'education',
    emoji: '🧸',
    title: 'Free Pre-K for 3 & 4 Year Olds',
    wonkLabel: 'Federal-State Universal Pre-Kindergarten Matching Grants',
    statutoryBasis: '42 U.S.C. § 9831 (Head Start & Early Learning)',
    description: 'Partners with states to offer free preschool for three and four year olds.',
    whyClick: 'Saves working parents thousands in childcare and lets more parents work.',
    tradeoffPro: 'Cuts family childcare bills and helps more parents join the workforce.',
    tradeoffCon: 'Adds billions in new federal grant spending each year.',
    citation: {
      text: 'National Institute for Early Education Research, The State of Preschool',
      url: 'https://nieer.org/state-preschool-yearbooks',
    },
  },
];

/** Lookup content for a social lever by ID. */
export function getSocialContent(id: string): SocialContent | undefined {
  return SOCIAL_CATALOG.find((c) => c.id === id);
}
