// Content catalog and empirical citations for domestic social policy levers (Phase 9, SOC-01..04).
// Plain-language summaries and neutral civics trade-offs for each policy option.

import type { SocialDomain } from '../engine/social';

export interface SocialCitation {
  readonly text: string;
  readonly url: string;
}

export interface SocialContent {
  readonly id: string;
  readonly domain: SocialDomain;
  readonly title: string;
  readonly description: string;
  readonly tradeoffPro: string;
  readonly tradeoffCon: string;
  readonly citation: SocialCitation;
}

export const SOCIAL_CATALOG: readonly SocialContent[] = [
  // Healthcare (SOC-01)
  {
    id: 'aca',
    domain: 'healthcare',
    title: 'ACA Marketplace Health Subsidies',
    description: 'Federal premium tax credits lowering out-of-pocket health insurance costs for individuals buying through state and federal marketplaces.',
    tradeoffPro: 'Expands health insurance coverage, lowering the uninsured rate and protecting families against catastrophic medical debt.',
    tradeoffCon: 'Increases mandatory federal budget outlays and deficit spending.',
    citation: {
      text: 'CBO, Health Insurance Coverage and the Affordable Care Act',
      url: 'https://www.cbo.gov/publication/59273',
    },
  },
  {
    id: 'drg',
    domain: 'healthcare',
    title: 'Medicare Prescription Drug Price Negotiations',
    description: 'Direct federal statutory authority allowing the Secretary of Health and Human Services to negotiate maximum fair prices for high-expenditure drugs.',
    tradeoffPro: 'Generates significant federal Medicare savings and reduces copays for seniors taking expensive medications.',
    tradeoffCon: 'Pharmaceutical industry groups warn reduced revenues could modestly constrain capital investment in long-term drug discovery.',
    citation: {
      text: 'CBO, How CBO Estimated the Budgetary Impact of Key Prescription Drug Provisions',
      url: 'https://www.cbo.gov/publication/58850',
    },
  },
  {
    id: 'pub',
    domain: 'healthcare',
    title: 'Public Health Insurance Option',
    description: 'A federally managed insurance plan offered on exchanges alongside private commercial plans, using Medicare provider network rates.',
    tradeoffPro: 'Increases consumer choice and exerts downward competitive pricing pressure on private health insurance premiums.',
    tradeoffCon: 'Private hospitals and insurers argue lower public reimbursement rates strain rural medical center finances.',
    citation: {
      text: 'Commonwealth Fund, Public Plan Options: Expanding Coverage and Lowering Premiums',
      url: 'https://www.commonwealthfund.org/publications/issue-briefs/2021/mar/public-plan-options-expanding-coverage',
    },
  },

  // Immigration (SOC-02)
  {
    id: 'bdr',
    domain: 'immigration',
    title: 'Border Security & Port Enforcement',
    description: 'Federal appropriations for Customs and Border Protection personnel, physical fencing, surveillance towers, and inspection ports of entry.',
    tradeoffPro: 'Enhances border enforcement, deters unauthorized crossings, and strengthens contraband detection at commercial ports.',
    tradeoffCon: 'Requires substantial annual federal spending without addressing underlying economic drivers of regional migration.',
    citation: {
      text: 'CRS, Border Security: Overview of Infrastructure and Personnel',
      url: 'https://crsreports.congress.gov/product/pdf/R/R42138',
    },
  },
  {
    id: 'vis',
    domain: 'immigration',
    title: 'High-Skilled & Seasonal Employment Visas',
    description: 'Expansion of statutory caps for employment-based legal migration, including H-1B specialty workers and agricultural seasonal labor.',
    tradeoffPro: 'Addresses critical labor shortages in agriculture and technology, boosting national innovation and gross economic output.',
    tradeoffCon: 'Critics argue large influxes of temporary worker programs can depress entry-level wage gains in specialized domestic fields.',
    citation: {
      text: 'CBO, The Budgetary and Economic Effects of Immigration Policies',
      url: 'https://www.cbo.gov/publication/59697',
    },
  },
  {
    id: 'reg',
    domain: 'immigration',
    title: 'Worker Status Regularization',
    description: 'Legal pathways for established undocumented workers to register, undergo background checks, obtain work permits, and pay formal income taxes.',
    tradeoffPro: 'Brings millions of informal workers onto formal tax rolls, raising payroll revenue and boosting wages through labor market mobility.',
    tradeoffCon: 'Opponents contend legal status without border certainty creates moral hazard and incentives for future unauthorized entry.',
    citation: {
      text: 'White House Council of Economic Advisers, Economic Benefits of Immigration Reform',
      url: 'https://www.whitehouse.gov/briefing-room/statements-releases/2021/09/17/economic-benefits-of-immigration-reform/',
    },
  },

  // Energy & Climate (SOC-03)
  {
    id: 'cln',
    domain: 'energy',
    title: 'Clean Energy Production Tax Credits',
    description: 'Federal tax credits incentivizing private investment in solar, wind, advanced nuclear, geothermal, and utility-scale battery storage.',
    tradeoffPro: 'Accelerates the transition toward low-emission generation and fosters domestic clean technology manufacturing ecosystems.',
    tradeoffCon: 'Expands the federal deficit through uncapped corporate tax expenditures.',
    citation: {
      text: 'JCT, Estimated Budgetary Effects of the Clean Energy Provisions',
      url: 'https://www.jct.gov/publications/2022/jcx-18-22/',
    },
  },
  {
    id: 'fos',
    domain: 'energy',
    title: 'Federal Public Lands Leasing & Permitting',
    description: 'Streamlined environmental reviews and accelerated lease auctions for oil, natural gas, and mineral extraction on federal lands.',
    tradeoffPro: 'Expands domestic energy supply, lowers consumer fuel prices, and generates billions in federal royalty receipts.',
    tradeoffCon: 'Increases carbon dioxide and methane emissions, slowing progress on long-term climate reduction targets.',
    citation: {
      text: 'CRS, Oil and Gas Leasing on Federal Lands: Authority and Overview',
      url: 'https://crsreports.congress.gov/product/pdf/R/R46777',
    },
  },
  {
    id: 'crb',
    domain: 'energy',
    title: 'Clean Power Carbon Standards',
    description: 'Regulatory emission rate caps on electricity generating stations and heavy industrial emitters under the Clean Air Act.',
    tradeoffPro: 'Significantly reduces airborne particulate pollution and industrial greenhouse gas emissions, improving public health.',
    tradeoffCon: 'Compliance and carbon capture retrofit costs are passed along to consumers and manufacturers via higher electric utility bills.',
    citation: {
      text: 'EPA, Regulatory Impact Analysis for Clean Air Standards for Power Plants',
      url: 'https://www.epa.gov/clean-air-act-overview',
    },
  },

  // Education (SOC-04)
  {
    id: 'k12',
    domain: 'education',
    title: 'Title I K-12 Disadvantaged School Grants',
    description: 'Federal funding formula providing financial assistance to local educational agencies and schools with high percentages of children from low-income families.',
    tradeoffPro: 'Reduces school resource disparities, improving graduation rates and long-term workforce productivity.',
    tradeoffCon: 'Increases federal education appropriations without direct federal authority over state curriculum or administrative staffing.',
    citation: {
      text: 'Department of Education, Title I Improving the Academic Achievement of the Disadvantaged',
      url: 'https://www2.ed.gov/programs/titleiparta/index.html',
    },
  },
  {
    id: 'sdr',
    domain: 'education',
    title: 'Income-Driven Student Loan Relief',
    description: 'Reforms capping federal undergraduate student loan monthly payments to a set percentage of discretionary income with balance forgiveness after 10-20 years.',
    tradeoffPro: 'Directly lowers monthly debt burdens for millions of young college graduates, enabling household savings and home purchases.',
    tradeoffCon: 'Shifts billions in student debt obligations onto federal taxpayers and may incentivize colleges to raise tuition rates.',
    citation: {
      text: 'CBO, Budgetary Costs of Changes to the Federal Student Loan Income-Driven Repayment Plans',
      url: 'https://www.cbo.gov/publication/58983',
    },
  },
  {
    id: 'prek',
    domain: 'education',
    title: 'Universal Pre-Kindergarten Grants',
    description: 'Federal-state partnership grants providing tuition-free preschool education to 3- and 4-year-old children nationwide.',
    tradeoffPro: 'Lifts maternal and parental labor force participation in the short run and enhances cognitive and social development in the long run.',
    tradeoffCon: 'Substantial multi-billion dollar annual federal outlays requiring state legislative co-funding cooperation.',
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
