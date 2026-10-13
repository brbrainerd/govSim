// Model coefficient registry (FND-07): every model number has a citation or judgement tag, a unit,
// a note and an allowed range. No imports; plain data plus a validator the tests run over it.
// 'citation' means the source was opened and supports the note; anything else is 'judgement'.
// 'judgement' means a hand-set round number chosen for plausible direction and size.

export type Basis = 'citation' | 'judgement';
export interface Source { text: string; url: string } // https only
export interface Coeff { value: number; unit: string; basis: Basis; range: readonly [number, number]; note: string; sources?: readonly Source[] }
export interface Limit { bounds: readonly [number, number]; unit: string; basis: Basis; note: string; sources?: readonly Source[] }

/** Human-readable problems with one registry entry; [] when it is valid. */
export function problems(name: string, entry: Coeff | Limit): string[] {
  const out: string[] = [];
  const bad = (m: string) => out.push(`${name}: ${m}`);
  const [lo, hi] = 'value' in entry ? entry.range : entry.bounds;
  if (!(lo < hi)) bad(`range must have lo < hi, got [${lo}, ${hi}]`);
  else if ('value' in entry && !(lo <= entry.value && entry.value <= hi)) bad(`value ${entry.value} outside [${lo}, ${hi}]`);
  if (!entry.unit.trim()) bad('unit is empty');
  if (!entry.note.trim()) bad('note is empty');
  if (entry.basis !== 'citation' && entry.basis !== 'judgement') bad(`basis must be citation or judgement, got ${String(entry.basis)}`);
  if (entry.basis === 'citation' && !entry.sources?.length) bad('citation needs at least one source');
  for (const s of entry.sources ?? []) {
    if (!s.text.trim()) bad('source text is empty');
    if (!s.url.startsWith('https://')) bad(`source url must start with https://, got ${s.url}`);
  }
  return out;
}

// ---- sources ------------------------------------------------------------------------------
// Opened and confirmed (fetched while writing this file) unless the text says "Not confirmed".
const TAYLOR = {
  text: 'Taylor (1993), Discretion versus Policy Rules in Practice: r = p + 0.5y + 0.5(p - 2) + 2 (opened; equation 1)',
  url: 'https://web.stanford.edu/~johntayl/Onlinepaperscombinedbyyear/1993/Discretion_versus_Policy_Rules_in_Practice.pdf',
} as const;
const FOMC_GOALS = {
  text: 'FOMC Statement on Longer-Run Goals and Monetary Policy Strategy: inflation of 2 percent (PCE) is most consistent with the mandate (opened)',
  url: 'https://www.federalreserve.gov/monetarypolicy/files/FOMC_LongerRunGoals.pdf',
} as const;
const OKUN = {
  text: 'Ball, Leigh, Loungani, Okun\'s Law: Fit at 50? (NBER WP 18668): US estimates of the unemployment response to output are about 0.38 to 0.49 (opened)',
  url: 'https://www.nber.org/system/files/working_papers/w18668/w18668.pdf',
} as const;
const PHILLIPS = {
  text: 'Hazell, Herreno, Nakamura, Steinsson, The Slope of the Phillips Curve: Evidence from U.S. States (NBER WP 28005): the slope is small (opened; units differ from this model, not directly comparable)',
  url: 'https://nber.org/papers/w28005',
} as const;
const FOMC_SEP = {
  text: 'FOMC calendars (links to the Summary of Economic Projections). Not confirmed: the page opened but does not itself state the longer-run funds rate',
  url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
} as const;
const YALE_TARIFFS = {
  text: 'Yale Budget Lab, The State of U.S. Tariffs (opened, 24 Aug 2026 edition): average statutory tariff rate 11.0% and an ultimate consumer price impact of about 0.7%. Not confirmed: the per-point ratio is this model\'s own reading',
  url: 'https://budgetlab.yale.edu/research/state-us-tariffs-november-17-2025',
} as const;
const CBO_MULTIPLIER = {
  text: 'CBO analysis of the 2009 stimulus act, multiplier ranges. Not confirmed: page returned 403 to the fetcher',
  url: 'https://www.cbo.gov/publication/24874',
} as const;
const CBO_RATES = {
  text: 'CBO Working Paper 2019-01, The Effect of Government Debt on Interest Rates. Not confirmed: page returned 403 to the fetcher',
  url: 'https://www.cbo.gov/publication/55018',
} as const;

// ---- dynamics -----------------------------------------------------------------------------
export const COEFF = {
  potentialGrowth: {
    value: 1.8, unit: '% real potential growth per year', basis: 'judgement', range: [1.5, 2.2],
    note: 'A model assumption, not a data field: CBO long-run potential growth is roughly 1.8 to 2%.',
  },
  gapPersistence: {
    value: 0.85, unit: 'share of last quarter\'s output gap that carries over', basis: 'judgement', range: [0.6, 0.95],
    note: 'Gaps close slowly over a few years; 0.85 a quarter leaves about half after four quarters.',
  },
  fiscalMultiplier: {
    value: 0.6, unit: 'output gap pts per 1% of GDP of extra yearly deficit', basis: 'judgement', range: [0.3, 1.2],
    note: 'Published multiplier estimates vary widely (roughly 0.5 to 2, not confirmed from the cited page); this is a first-quarter response and persistence builds it up, so a lowish value keeps the total near 1.',
    sources: [CBO_MULTIPLIER],
  },
  rateDrag: {
    value: 0.15, unit: 'output gap pts per 1 pt of real rate above neutral', basis: 'judgement', range: [0.05, 0.4],
    note: 'Tighter money slows the economy gradually; 0.15 a quarter gives a visible but not violent response.',
  },
  neutralReal: {
    value: 1.0, unit: '% real policy rate', basis: 'judgement', range: [0, 2],
    note: 'Fed projections are commonly read as a longer-run policy rate near 3% against a 2% goal, so about 1% real; that figure was not confirmed from the cited page.',
    sources: [FOMC_SEP],
  },
  okun: {
    value: 0.5, unit: 'unemployment pts per 1% output gap', basis: 'citation', range: [0.3, 0.6],
    note: 'US estimates in the cited paper run from about 0.38 to 0.49; 0.5 sits at the top of that band.',
    sources: [OKUN],
  },
  empPerU: {
    value: 0.6, unit: 'employment-population pts per unemployment pt', basis: 'judgement', range: [0.3, 0.9],
    note: 'Fewer jobs also pull some people out of the labour force, so the ratio moves less than one for one.',
  },
  phillips: {
    value: 0.15, unit: 'inflation pts per quarter per 1% output gap', basis: 'judgement', range: [0.03, 0.3],
    note: 'The literature finds a small, flat slope; units differ from this model so it is not directly comparable.',
    sources: [PHILLIPS],
  },
  expectPull: {
    value: 0.25, unit: 'share of the gap between expected and actual inflation closed per quarter', basis: 'judgement', range: [0.1, 0.5],
    note: 'Inflation drifts back toward what people expect, over a year or so.',
  },
  expectAdapt: {
    value: 0.1, unit: 'share of new inflation absorbed into expectations per quarter', basis: 'judgement', range: [0.05, 0.3],
    note: 'Expectations adapt slowly, so a burst of inflation fades over years not months.',
  },
  tariffPass: {
    value: 0.1, unit: 'one-off inflation pts per tariff pt of change', basis: 'judgement', range: [0.05, 0.2],
    note: 'Roughly 0.1 price points per average tariff point is the right order of magnitude against Budget Lab estimates; the exact ratio is not stated by the source.',
    sources: [YALE_TARIFFS],
  },
  taylorInfl: {
    value: 0.5, unit: 'extra policy rate pts per inflation pt above target', basis: 'citation', range: [0.25, 1.0],
    note: 'The weight on the inflation gap in Taylor\'s 1993 rule is 0.5.',
    sources: [TAYLOR],
  },
  taylorGap: {
    value: 0.5, unit: 'policy rate pts per 1% output gap', basis: 'citation', range: [0.25, 1.0],
    note: 'The weight on the output gap in Taylor\'s 1993 rule is 0.5; later variants use 1.0.',
    sources: [TAYLOR],
  },
  fedSmooth: {
    value: 0.4, unit: 'share of the distance to the rule rate covered per quarter', basis: 'judgement', range: [0.1, 0.8],
    note: 'The Fed moves toward its rule gradually rather than all at once.',
  },
  potentialMax: {
    value: 0.25, unit: 'max potential-growth gain from policy, % per year', basis: 'judgement', range: [0.1, 0.5],
    note: 'Good policy can lift long-run growth a little; a quarter point caps the upside (diminishing returns).',
  },
  crowdOut: {
    value: 0.012, unit: 'potential growth pts lost per 1 pt of debt/GDP above start', basis: 'judgement', range: [0.004, 0.03],
    note: 'Debt crowds out private investment; CBO is reported to size the effect at about a third of each borrowed dollar (not confirmed), and this model\'s mapping to growth is its own simplification.',
  },
  crisisAt: {
    value: 130, unit: '% debt/GDP', basis: 'judgement', range: [100, 160],
    note: 'No consensus debt threshold exists; the design sets 130% as the point where bond markets start to revolt.',
  },
  termPremium: {
    value: 0.02, unit: 'borrowing cost pts per 1 pt of debt/GDP above start', basis: 'judgement', range: [0.01, 0.05],
    note: 'CBO is reported to find about 2 to 3 basis points per point of debt/GDP (not confirmed, source blocked); 0.02 is 2 basis points.',
    sources: [CBO_RATES],
  },
  approvalPull: {
    value: 0.35, unit: 'share of the distance to target approval closed per quarter', basis: 'judgement', range: [0.15, 0.6],
    note: 'Approval follows conditions within a few quarters but not instantly.',
  },
  honeymoon: {
    value: 8, unit: 'approval pts at the start of the term', basis: 'judgement', range: [0, 15],
    note: 'New presidents start with a bump that fades over a year.',
  },
  shockGap: {
    value: 0.3, unit: 'output gap pts per standard deviation of luck', basis: 'judgement', range: [0.1, 0.6],
    note: 'Outside shocks move the economy a few tenths of a point a quarter, enough to matter, not enough to decide a term.',
  },
  shockInfl: {
    value: 0.12, unit: 'inflation pts per standard deviation of luck', basis: 'judgement', range: [0.05, 0.3],
    note: 'Price surprises of a tenth or so of a point a quarter.',
  },
  shockApproval: {
    value: 1.0, unit: 'approval pts per standard deviation of luck', basis: 'judgement', range: [0.5, 2],
    note: 'Opinion has random noise of about a point a quarter.',
  },
  // ---- inline literals that used to sit inside game.ts step() ----
  inflTarget: {
    value: 2, unit: '% inflation', basis: 'citation', range: [1.5, 3],
    note: 'The Fed\'s longer-run goal is 2 percent, and Taylor\'s rule uses the same target; the score also measures inflation distance from it.',
    sources: [FOMC_GOALS, TAYLOR],
  },
  fedStep: {
    value: 0.25, unit: 'policy rate pts per step', basis: 'judgement', range: [0.125, 0.5],
    note: 'The Fed moves its target range in quarter-point steps.',
  },
  debtStressGap: {
    value: 0.4, unit: 'output gap pts per stress unit of debt above crisisAt', basis: 'judgement', range: [0.1, 1],
    note: 'Past the crisis line, each 10 points of extra debt costs a visible slice of growth.',
  },
  debtStressUnit: {
    value: 10, unit: 'debt/GDP pts per stress unit', basis: 'judgement', range: [5, 20],
    note: 'Stress is counted in 10-point bands of debt above crisisAt.',
  },
  fedPassThrough: {
    value: 0.5, unit: 'share of a policy rate change passed into average borrowing cost', basis: 'judgement', range: [0.2, 1],
    note: 'Debt is refinanced gradually, so only part of a rate move reaches the average interest rate each year.',
  },
  stressPremium: {
    value: 1.5, unit: 'borrowing cost pts per stress unit', basis: 'judgement', range: [0.5, 3],
    note: 'Markets demand much more when debt is past the line; a point and a half per band makes a crisis hurt.',
  },
  incomeGrowthShare: {
    value: 0.8, unit: 'share of GDP growth that reaches median income', basis: 'judgement', range: [0.4, 1],
    note: 'Median households capture most but not all of aggregate growth.',
  },
  lifeTrend: {
    value: 0.01, unit: 'years of life expectancy gained per quarter', basis: 'judgement', range: [0, 0.03],
    note: 'A slow upward trend of about 0.04 years a year.',
  },
  lifeSpending: {
    value: 0.015, unit: 'years of life expectancy per point of health spending change', basis: 'judgement', range: [0.005, 0.04],
    note: 'Medicare, Social Security and Medicaid spending shift long-run health a little.',
  },
  lifeAdjust: {
    value: 0.1, unit: 'share of the distance to the life expectancy target closed per quarter', basis: 'judgement', range: [0.03, 0.3],
    note: 'Health outcomes move slowly toward a policy-set level instead of drifting forever.',
  },
  giniIncomeTax: {
    value: 0.0015, unit: 'Gini pts per income tax pt', basis: 'judgement', range: [0.0005, 0.004],
    note: 'A higher top-line income tax trims inequality a little.',
  },
  giniMedicaid: {
    value: 0.0005, unit: 'Gini pts per Medicaid spending pt', basis: 'judgement', range: [0.0001, 0.002],
    note: 'More Medicaid spending trims inequality a little.',
  },
  giniAdjust: {
    value: 0.05, unit: 'share of the distance to the Gini target closed per quarter', basis: 'judgement', range: [0.02, 0.2],
    note: 'Inequality moves slowly toward a policy-set level.',
  },
  crimeJobs: {
    value: 0.004, unit: 'share change in crime per unemployment pt', basis: 'judgement', range: [0.001, 0.01],
    note: 'More joblessness nudges crime up by under half a percent per point.',
  },
  crimeTrend: {
    value: 0.001, unit: 'share change in crime per quarter', basis: 'judgement', range: [0, 0.003],
    note: 'Crime drifts down slowly absent other pressure.',
  },
  honeymoonQuarters: {
    value: 4, unit: 'quarters', basis: 'judgement', range: [2, 8],
    note: 'The honeymoon bump fades to nothing over a year.',
  },
  approvalNeutral: {
    value: 50, unit: 'approval pts', basis: 'judgement', range: [45, 55],
    note: 'Approval where conditions are unchanged from the start; also the neutral point for trust.',
  },
  approvalJobs: {
    value: 2.5, unit: 'approval pts per unemployment pt above start', basis: 'judgement', range: [1, 5],
    note: 'Jobs weigh more on approval than prices do in this model.',
  },
  approvalPrices: {
    value: 2, unit: 'approval pts per inflation pt above the floor', basis: 'judgement', range: [0.5, 4],
    note: 'Rising prices cost approval, but less than lost jobs.',
  },
  approvalPriceFloor: {
    value: 2.5, unit: '% inflation', basis: 'judgement', range: [2, 4],
    note: 'Inflation slightly above target goes unnoticed; voters react beyond about 2.5%.',
  },
  approvalGrowth: {
    value: 1.5, unit: 'approval pts per growth pt above potential', basis: 'judgement', range: [0.5, 3],
    note: 'A booming economy lifts approval a little.',
  },
  trustAdjust: {
    value: 0.1, unit: 'share of the distance to the trust target closed per quarter', basis: 'judgement', range: [0.03, 0.3],
    note: 'Trust in government moves slowly.',
  },
  trustApproval: {
    value: 0.4, unit: 'trust pts per approval pt above neutral', basis: 'judgement', range: [0.1, 0.8],
    note: 'A popular government is slightly more trusted, but trust is stickier than approval.',
  },
  cloutPerApproval: {
    value: 10, unit: 'approval pts per clout earned each quarter', basis: 'judgement', range: [5, 20],
    note: 'Each quarter you earn approval divided by ten in clout (52% approval earns 5).',
  },
  // ---- crisis pacing & option coefficients (Phase 4, EVT-01..07) ----
  crisisCloutLow: {
    value: 10, unit: 'clout', basis: 'judgement', range: [5, 15],
    note: 'Clout cost for standard minor emergency or targeted response.',
  },
  crisisCloutMedium: {
    value: 20, unit: 'clout', basis: 'judgement', range: [15, 25],
    note: 'Clout cost for moderate legislative or mobilization action.',
  },
  crisisCloutHigh: {
    value: 30, unit: 'clout', basis: 'judgement', range: [20, 40],
    note: 'Clout cost for major comprehensive mobilization or partisan battle.',
  },
  crisisMinPerTerm: {
    value: 4, unit: 'crises per 16 turns', basis: 'judgement', range: [3, 5],
    note: 'Minimum number of crises occurring during a 16-turn first term.',
  },
  crisisMaxPerTerm: {
    value: 9, unit: 'crises per 16 turns', basis: 'judgement', range: [7, 10],
    note: 'Maximum number of crises occurring during a 16-turn first term.',
  },
  crisisFirstTurnMin: {
    value: 3, unit: 'turn number', basis: 'judgement', range: [3, 4],
    note: 'Earliest turn a crisis can fire (grace period on turns 1-2).',
  },
  crisisFirstTurnMax: {
    value: 5, unit: 'turn number', basis: 'judgement', range: [4, 6],
    note: 'Latest turn the first crisis must arrive by.',
  },
  crisisCooldown: {
    value: 1, unit: 'turns', basis: 'judgement', range: [1, 2],
    note: 'Minimum turns of quiet required after a major crisis.',
  },
  disasterAidSpend: {
    value: 15, unit: '$bn', basis: 'judgement', range: [5, 30],
    note: 'FEMA disaster relief immediate federal outlay.',
  },
  disasterReconSpend: {
    value: 40, unit: '$bn', basis: 'judgement', range: [25, 60],
    note: 'Comprehensive long-term infrastructure and reconstruction grant.',
  },
  disasterRallyApproval: {
    value: 3, unit: '% approval', basis: 'judgement', range: [1, 5],
    note: 'Temporary rally in public support for effective disaster management (EVT-06).',
  },
  disasterRallyDuration: {
    value: 2, unit: 'quarters', basis: 'judgement', range: [1, 4],
    note: 'Number of quarters a disaster response approval rally persists.',
  },
  disasterNeglectApprovalHit: {
    value: 4, unit: '% approval', basis: 'judgement', range: [2, 8],
    note: 'Voter punishment for refusing emergency aid during a natural disaster.',
  },
  disasterNeglectTrustHit: {
    value: 3, unit: '% trust', basis: 'judgement', range: [1, 6],
    note: 'Loss in social trust when the federal government fails to aid victims.',
  },
  oilReserveRelief: {
    value: 0.4, unit: '% inflation', basis: 'judgement', range: [0.1, 1.0],
    note: 'Cooling effect on CPI from releasing Strategic Petroleum Reserve crude.',
  },
  oilTransitSpend: {
    value: 20, unit: '$bn', basis: 'judgement', range: [10, 35],
    note: 'Direct consumer transit relief and fuel subsidy outlays.',
  },
  oilNeglectSpike: {
    value: 0.8, unit: '% inflation', basis: 'judgement', range: [0.3, 1.5],
    note: 'Inflationary surge when energy price spikes pass directly to consumers.',
  },
  epidemicMobilizeSpend: {
    value: 25, unit: '$bn', basis: 'judgement', range: [10, 50],
    note: 'Emergency federal public health manufacturing and vaccination program.',
  },
  epidemicTargetedSpend: {
    value: 5, unit: '$bn', basis: 'judgement', range: [2, 15],
    note: 'Targeted CDC regional public health advisory and surveillance.',
  },
  epidemicNeglectLifeHit: {
    value: 0.3, unit: 'years of life expectancy', basis: 'judgement', range: [0.1, 0.6],
    note: 'Decline in average life expectancy from uncontained viral epidemic.',
  },
  scotusSwiftTrustGain: {
    value: 2, unit: '% trust', basis: 'judgement', range: [1, 4],
    note: 'Institutional trust gain from swift bipartisan Supreme Court confirmation.',
  },
  scotusBoldApprovalRally: {
    value: 4, unit: '% approval', basis: 'judgement', range: [2, 7],
    note: 'Base enthusiasm rally from appointing a principled ideological justice.',
  },
  scotusDelayTrustHit: {
    value: 3, unit: '% trust', basis: 'judgement', range: [1, 5],
    note: 'Erosion in institutional legitimacy from leaving high court seats vacant.',
  },
  unrestPackageSpend: {
    value: 30, unit: '$bn', basis: 'judgement', range: [15, 60],
    note: 'Community grants and urban revitalization investment.',
  },
  unrestSurgeTrustHit: {
    value: 2, unit: '% trust', basis: 'judgement', range: [1, 5],
    note: 'Increased polarization and trust friction from federal law enforcement surge.',
  },
  unrestNeglectGrowthHit: {
    value: 0.5, unit: '% GDP growth', basis: 'judgement', range: [0.2, 1.0],
    note: 'Economic drag from prolonged civil unrest and commerce disruption.',
  },
  disasterPotentialBoost: {
    value: 0.1, unit: '% potential GDP', basis: 'judgement', range: [0.05, 0.3],
    note: 'Minor infrastructure boost from long-term reconstruction investment.',
  },
  debtStressThreshold: {
    value: 1.25, unit: 'debt/gdp ratio', basis: 'judgement', range: [1.1, 1.5],
    note: 'Threshold where debt stress triggers a sovereign debt crisis event.',
  },
  unrestGiniThreshold: {
    value: 0.495, unit: 'Gini coefficient', basis: 'judgement', range: [0.45, 0.55],
    note: 'Inequality threshold triggering civil demonstrations.',
  },
  unrestApprovalThreshold: {
    value: 28, unit: '% approval', basis: 'judgement', range: [20, 35],
    note: 'Approval threshold triggering civil unrest.',
  },
  crisisPoolSize: {
    value: 12, unit: 'archetypes', basis: 'judgement', range: [10, 16],
    note: 'Number of distinct exogenous crisis archetypes in the game catalog.',
  },
  marketPanicTariffDrag: {
    value: 0.6, unit: '% output gap', basis: 'judgement', range: [0.2, 1.2],
    note: 'Output gap contraction resulting from credit freeze during financial panic.',
  },
  deadlineWarningTurns: {
    value: 2, unit: 'turns', basis: 'judgement', range: [1, 4],
    note: 'Turns ahead of a deadline when the warning countdown begins.',
  },
  debtLimitRiskThreshold: {
    value: 1.2, unit: 'debt/gdp ratio', basis: 'judgement', range: [1.1, 1.4],
    note: 'Debt to GDP ratio that elevates fiscal standoff risk.',
  },
  cloutCap: {
    value: 200, unit: 'clout pts', basis: 'judgement', range: [150, 300],
    note: 'Maximum political capital a president can hold to stop hoarding strategies.',
  },
  speechBaseCost: {
    value: 10, unit: 'clout pts', basis: 'judgement', range: [5, 20],
    note: 'Base clout cost to deliver a major presidential speech.',
  },
  speechApprovalBoost: {
    value: 2, unit: '% approval', basis: 'judgement', range: [1, 5],
    note: 'Base public approval lift from addressing the nation.',
  },
  fedPressureCredibilityHit: {
    value: 0.2, unit: '% inflation expectations', basis: 'judgement', range: [0.1, 0.5],
    note: 'Increase in inflation expectations when presidential pressure erodes Fed independence.',
  },
  fedRatePressureRelief: {
    value: 0.25, unit: '% policy rate', basis: 'judgement', range: [0.1, 0.5],
    note: 'Temporary rate reduction resulting from presidential pressure on the central bank.',
  },
  mythRewardClout: {
    value: 5, unit: 'clout pts', basis: 'judgement', range: [2, 10],
    note: 'One-time political capital reward for reading a civics myth card.',
  },
  speechDiminishingFactor: {
    value: 0.5, unit: 'factor', basis: 'judgement', range: [0.2, 0.8],
    note: 'Diminishing returns rate for presidential speeches.',
  },
  speechBusinessGapBoost: {
    value: 0.1, unit: '% output gap', basis: 'judgement', range: [0.05, 0.3],
    note: 'Output gap lift from presidential address to business leaders.',
  },
  courtUpholdLow: {
    value: 0.8, unit: 'probability', basis: 'judgement', range: [0.6, 0.95],
    note: 'Chance Supreme Court upholds a low-risk executive order.',
  },
  courtUpholdModerate: {
    value: 0.5, unit: 'probability', basis: 'judgement', range: [0.3, 0.7],
    note: 'Chance Supreme Court upholds a moderate-risk executive order.',
  },
  courtUpholdHigh: {
    value: 0.25, unit: 'probability', basis: 'judgement', range: [0.1, 0.4],
    note: 'Chance Supreme Court upholds a high-risk executive order.',
  },
  courtStrikeCloutPenalty: {
    value: 5, unit: 'clout pts', basis: 'judgement', range: [2, 15],
    note: 'Clout penalty when an executive order is struck down by the Supreme Court.',
  },
  courtReviewDelayTurns: {
    value: 2, unit: 'turns', basis: 'judgement', range: [1, 4],
    note: 'Quarters until Supreme Court ruling on challenged order.',
  },
  fedPressureCost: {
    value: 15, unit: 'clout pts', basis: 'judgement', range: [5, 30],
    note: 'Political capital cost to publicly pressure the Federal Reserve.',
  },
  fedPressureLingeringTurns: {
    value: 3, unit: 'turns', basis: 'judgement', range: [1, 6],
    note: 'Quarters inflation expectations remain elevated after Fed pressure.',
  },
  fedChairHawkInflationCut: {
    value: 0.2, unit: '% inflation', basis: 'judgement', range: [0.1, 0.4],
    note: 'Inflation reduction from appointing a hawk Fed chair.',
  },
  fedChairDoveGapBoost: {
    value: 0.15, unit: '% output gap', basis: 'judgement', range: [0.05, 0.3],
    note: 'Output gap expansion from appointing a dove Fed chair.',
  },
  voterApprovalElasticity: { value: 1.0, unit: 'pp state margin per pp national approval', basis: 'judgement', range: [0.5, 2.0], note: 'Sensitivity of state margin to national approval shift.' },
  voterFarmTariffSensitivity: { value: 1.5, unit: 'pp margin loss per pp tariff change per unit exposure', basis: 'judgement', range: [0.5, 3.0], note: 'Vulnerability of agricultural states to tariff disputes.' },
  voterMfgGrowthSensitivity: { value: 2.0, unit: 'pp margin gain per pp GDP growth per unit exposure', basis: 'judgement', range: [0.5, 4.0], note: 'Responsiveness of manufacturing states to industrial growth.' },
  voterEnergyInflationSensitivity: { value: 1.0, unit: 'pp margin loss per pp inflation per unit exposure', basis: 'judgement', range: [0.2, 3.0], note: 'Responsiveness of energy states to inflation volatility.' },
  voterStateVolatility: { value: 0.8, unit: 'std dev in pp margin', basis: 'judgement', range: [0.2, 2.0], note: 'State-specific idiosyncratic margin shock standard deviation.' },
  voterAcaSensitivity: { value: 0.8, unit: 'pp margin per ACA point per uninsured exposure', basis: 'judgement', range: [0.2, 2.0], note: 'Electoral responsiveness in high-uninsured states to Affordable Care Act subsidy adjustments.' },
  voterDrugPriceSensitivity: { value: 0.9, unit: 'pp margin per drug point per senior exposure', basis: 'judgement', range: [0.3, 3.0], note: 'Electoral responsiveness in senior-heavy states to prescription drug price negotiation.' },
  voterPublicOptionSensitivity: { value: 1.0, unit: 'pp margin per public option in high-uninsured states', basis: 'judgement', range: [0.2, 2.5], note: 'Electoral responsiveness in high-uninsured states to public healthcare option enactment.' },
  voterBorderSecuritySensitivity: { value: 1.5, unit: 'pp margin per border point in border states', basis: 'judgement', range: [0.4, 3.5], note: 'Electoral responsiveness in southern border states to border security and enforcement funding.' },
  voterVisaLaborSensitivity: { value: 0.4, unit: 'pp margin per visa point in immigrant labor states', basis: 'judgement', range: [0.1, 1.8], note: 'Electoral responsiveness in high immigrant workforce states to visa program expansion.' },
  voterRegularizationSensitivity: { value: 1.2, unit: 'pp margin per regularization in high-immigrant states', basis: 'judgement', range: [0.3, 3.0], note: 'Electoral responsiveness in high immigrant share states to undocumented resident regularization.' },
  voterCleanEnergySensitivity: { value: 0.6, unit: 'pp margin per clean credit point in renewable states', basis: 'judgement', range: [0.2, 2.5], note: 'Electoral responsiveness in renewable-rich states to clean energy credits and investment.' },
  voterFossilPermittingSensitivity: { value: 1.4, unit: 'pp margin per leasing point in extraction states', basis: 'judgement', range: [0.3, 3.5], note: 'Electoral responsiveness in fossil fuel producing states to streamlined federal energy leasing.' },
  voterCarbonStandardPenalty: { value: 1.5, unit: 'pp margin loss per carbon standard point in carbon-heavy grids', basis: 'judgement', range: [0.3, 3.5], note: 'Electoral margin penalty in carbon-intensive grid states from industrial emissions standards.' },
  voterTitleIEducationSensitivity: { value: 0.7, unit: 'pp margin per Title I point in high child poverty states', basis: 'judgement', range: [0.2, 2.0], note: 'Electoral responsiveness in high child-poverty states to Title I K-12 education aid.' },
  voterStudentDebtSensitivity: { value: 1.1, unit: 'pp margin per debt relief point in high student debt states', basis: 'judgement', range: [0.3, 2.8], note: 'Electoral responsiveness in high student-loan borrower states to income-driven debt cancellation.' },
  voterUniversalPreKSensitivity: { value: 1.3, unit: 'pp margin per universal Pre-K in working family states', basis: 'judgement', range: [0.3, 3.0], note: 'Electoral responsiveness in states with high young-child families to universal pre-K childcare.' },
  voterFamilyReliefElasticity: { value: 0.01, unit: 'pp margin per $10/mo local family budget relief', basis: 'judgement', range: [0.01, 0.15], note: 'State voter margin elasticity to cost-of-living adjusted monthly family budget relief.' },
  midtermHistoricalPenalty: { value: 20, unit: 'House seats', basis: 'judgement', range: [10, 30], note: 'Average historical midterm seat loss penalty for the executive coalition (D3).' },
  midtermApprovalSlope: { value: 1.2, unit: 'House seats per pp approval from 50', basis: 'judgement', range: [0.5, 2.5], note: 'Responsiveness of midterm House seat change to presidential approval.' },
  midtermMaxHouseLoss: { value: 35, unit: 'House seats', basis: 'judgement', range: [25, 50], note: 'Maximum House seats the executive can lose in midterms to prevent death spiral (GR-18, GR-19).' },
  midtermMaxHouseGain: { value: 15, unit: 'House seats', basis: 'judgement', range: [5, 25], note: 'Maximum House seats the executive can gain in a wave midterm.' },
  midtermMaxSenateLoss: { value: 6, unit: 'Senate seats', basis: 'judgement', range: [3, 10], note: 'Maximum Senate seats lost in midterms across contested class.' },
  midtermMaxSenateGain: { value: 4, unit: 'Senate seats', basis: 'judgement', range: [2, 8], note: 'Maximum Senate seats gained in midterms across contested class.' },
  projectionZScore: { value: 1.28, unit: 'z-score multiplier', basis: 'judgement', range: [1.0, 2.0], note: 'Normal distribution z-score for 10th/90th percentile projection intervals (VOT-03).' },
  projectionVolatilityQuarterly: { value: 1.5, unit: 'variance rate per quarter', basis: 'judgement', range: [0.5, 3.0], note: 'Remaining quarterly election variance for projection ranges.' },
  swingThreshold: { value: 5.0, unit: 'pp margin', basis: 'judgement', range: [2.0, 10.0], note: 'Margin threshold within which a state is considered a battleground.' },
  tossupThreshold: { value: 1.5, unit: 'pp margin', basis: 'judgement', range: [0.5, 3.0], note: 'Margin threshold for tossup classification.' },
  likelyThreshold: { value: 5.0, unit: 'pp margin', basis: 'judgement', range: [3.0, 8.0], note: 'Margin threshold for likely classification.' },
  safeThreshold: { value: 10.0, unit: 'pp margin', basis: 'judgement', range: [8.0, 15.0], note: 'Margin threshold for safe classification.' },
  // ---- social policy levers (Phase 9, SOC-01..04) ----
  acaSubsidyDeficit: { value: 25, unit: '$bn/yr', basis: 'judgement', range: [10, 50], note: 'Deficit outlay per ACA subsidy enhancement point.' },
  acaCoverageGain: { value: 0.15, unit: 'life expectancy multiplier', basis: 'judgement', range: [0.05, 0.4], note: 'Life expectancy gain from expanded health coverage.' },
  drugNegotiationSavings: { value: 18, unit: '$bn/yr', basis: 'judgement', range: [5, 40], note: 'Federal Medicare outlay savings from prescription drug price negotiation.' },
  drugFamilySavings: { value: 15, unit: '$/month', basis: 'judgement', range: [5, 30], note: 'Average family prescription out-of-pocket savings.' },
  publicOptionDeficit: { value: 12, unit: '$bn/yr', basis: 'judgement', range: [5, 30], note: 'Federal startup and reinsurance costs for public health insurance option.' },
  publicOptionPremiumRelief: { value: 10, unit: '$/month', basis: 'judgement', range: [3, 25], note: 'Family monthly premium relief from exchange competition.' },
  borderSecurityCost: { value: 10, unit: '$bn/yr', basis: 'judgement', range: [5, 25], note: 'Federal border enforcement and personnel funding per point.' },
  visaLaborExpansion: { value: 0.08, unit: '% empPop', basis: 'judgement', range: [0.02, 0.2], note: 'Employment-population ratio boost from high-skilled and agricultural visa quota expansions.' },
  visaPotentialGrowth: { value: 0.04, unit: '% potential growth', basis: 'judgement', range: [0.01, 0.1], note: 'Annual potential output growth boost from expanded skilled immigrant labor.' },
  regularizationWageGain: { value: 150, unit: '$/yr', basis: 'judgement', range: [50, 400], note: 'Median income increase from formalization of worker status.' },
  regularizationPayrollBoost: { value: 14, unit: '$bn/yr', basis: 'judgement', range: [5, 30], note: 'Payroll tax revenue gain from legal status regularization.' },
  cleanEnergyCreditCost: { value: 30, unit: '$bn/yr', basis: 'judgement', range: [15, 60], note: 'Clean energy investment and production tax expenditure.' },
  fossilPermittingRevenue: { value: 12, unit: '$bn/yr', basis: 'judgement', range: [4, 25], note: 'Federal royalty and lease revenues from public lands oil and gas permitting.' },
  fossilPermittingEnergyRelief: { value: 0.06, unit: '% inflation', basis: 'judgement', range: [0.02, 0.15], note: 'Short-term energy CPI deflation from expanded domestic fossil fuel production.' },
  carbonStandardCost: { value: 8, unit: '$/month', basis: 'judgement', range: [2, 20], note: 'Consumer utility rate passthrough from industrial carbon compliance standards.' },
  titleIFundingCost: { value: 15, unit: '$bn/yr', basis: 'judgement', range: [5, 35], note: 'Title I federal aid to high-poverty school districts.' },
  titleIProductivityGain: { value: 0.03, unit: '% potential growth', basis: 'judgement', range: [0.01, 0.08], note: 'Long-term labor productivity and potential growth gain from K-12 education investment.' },
  studentDebtReliefCost: { value: 20, unit: '$bn/yr', basis: 'judgement', range: [8, 50], note: 'Federal outlays for income-driven student debt relief.' },
  studentDebtMonthlyRelief: { value: 25, unit: '$/month', basis: 'judgement', range: [10, 60], note: 'Average monthly disposable income relief from student loan payment reductions.' },
  universalPreKCost: { value: 22, unit: '$bn/yr', basis: 'judgement', range: [10, 45], note: 'Federal matching grants for universal early childhood education.' },
  universalPreKEmpPop: { value: 0.12, unit: '% empPop', basis: 'judgement', range: [0.04, 0.25], note: 'Parental labor force participation increase enabled by subsidized childcare.' },
  acaFamilyRelief: { value: 30, unit: '$/month', basis: 'judgement', range: [10, 60], note: 'Monthly family health premium savings from enhanced ACA subsidies.' },
  visaDeficitSavings: { value: 8, unit: '$bn/yr', basis: 'judgement', range: [2, 20], note: 'Net federal revenue gain from skilled worker visa fees and taxes.' },
  visaFamilyBenefit: { value: 5, unit: '$/month', basis: 'judgement', range: [1, 15], note: 'Household benefit from lower service costs and agricultural efficiency.' },
  regularizationFamilyRelief: { value: 10, unit: '$/month', basis: 'judgement', range: [2, 25], note: 'Household income and purchasing power boost from normalized legal wages.' },
  cleanEnergyFamilyRelief: { value: 10, unit: '$/month', basis: 'judgement', range: [2, 25], note: 'Household savings from subsidized clean energy tax credits.' },
  fossilPermittingFamilyRelief: { value: 8, unit: '$/month', basis: 'judgement', range: [2, 20], note: 'Household utility and fuel savings from expanded oil and gas supply.' },
  titleIFamilyRelief: { value: 5, unit: '$/month', basis: 'judgement', range: [1, 15], note: 'Household educational support value from Title I grants.' },
  universalPreKFamilyRelief: { value: 45, unit: '$/month', basis: 'judgement', range: [20, 100], note: 'Monthly household childcare expense savings from universal pre-K.' },
  // ---- filibuster reform coefficients (Phase 11, REF-01) ----
  filibusterTalkingApprovalSlope: { value: 0.4, unit: 'cloture reduction per approval pt', basis: 'judgement', range: [0.1, 0.8], note: 'Higher public approval lowers minority obstruction capacity under talking filibuster.' },
  filibusterTalkingMinThreshold: { value: 51, unit: 'votes', basis: 'judgement', range: [51, 60], note: 'Talking filibuster cannot reduce cloture below simple majority.' },
  filibusterNuclearTrustPenalty: { value: 5, unit: 'index pts', basis: 'judgement', range: [1, 15], note: 'Public trust loss from abolishing the Senate filibuster.' },
  filibusterNuclearApprovalPenalty: { value: 3, unit: '% approval', basis: 'judgement', range: [1, 10], note: 'Immediate political backlash from simple-majority nuclear option.' },
  filibusterFiftyFiveTrustPenalty: { value: 2, unit: 'index pts', basis: 'judgement', range: [0, 8], note: 'Trust impact from lowering cloture to 55 votes.' },
  filibusterTalkingTrustPenalty: { value: 1, unit: 'index pts', basis: 'judgement', range: [0, 5], note: 'Trust impact from instituting talking filibuster.' },
  filibusterNuclearCloutCost: { value: 35, unit: 'clout', basis: 'judgement', range: [15, 60], note: 'Clout cost to invoke nuclear option.' },
  filibusterFiftyFiveCloutCost: { value: 20, unit: 'clout', basis: 'judgement', range: [10, 40], note: 'Clout cost to pass 55-vote threshold reform.' },
  filibusterTalkingCloutCost: { value: 15, unit: 'clout', basis: 'judgement', range: [5, 30], note: 'Clout cost to restore talking filibuster.' },
  // ---- judicial reform coefficients (Phase 11, REF-02) ----
  courtTermLimitChallengeRisk: { value: 0.65, unit: 'probability', basis: 'judgement', range: [0.3, 0.9], note: 'Risk of conservative bench striking down statutory judicial term limits under Article III.' },
  courtEthicsTrustGain: { value: 3, unit: 'index pts', basis: 'judgement', range: [1, 8], note: 'Public trust gain from binding statutory judicial code of conduct.' },
  courtExpansionTrustPenalty: { value: 6, unit: 'index pts', basis: 'judgement', range: [2, 15], note: 'Public trust loss from expanding Supreme Court bench size.' },
  courtJusticeUpholdSlope: { value: 0.08, unit: 'probability shift per net justice', basis: 'judgement', range: [0.03, 0.15], note: 'Executive order uphold probability change per net justice ideological balance.' },
  // ---- electoral reform coefficients (Phase 11, REF-03) ----
  rcvTurnoutBonus: { value: 1.5, unit: '% turnout', basis: 'judgement', range: [0.5, 4], note: 'Voter turnout increase from ranked choice voting adoption.' },
  rcvCentristBonus: { value: 3.0, unit: '% margin shift', basis: 'judgement', range: [1, 6], note: 'Centrist candidate viability boost under ranked choice voting.' },
  rcvTrustGain: { value: 1.5, unit: 'index pts', basis: 'judgement', range: [0.5, 5], note: 'Civic trust increase from ranked choice voting.' },
  independentRedistrictingCompetitiveDistricts: { value: 35, unit: 'seats', basis: 'judgement', range: [15, 60], note: 'Increase in competitive battleground House districts under independent redistricting.' },
  smallDollarMatchingTurnoutBonus: { value: 2.0, unit: '% turnout', basis: 'judgement', range: [0.5, 5], note: 'Voter participation increase from public campaign matching funds.' },
  smallDollarMatchingTrustGain: { value: 2.5, unit: 'index pts', basis: 'judgement', range: [1, 7], note: 'Institutional trust gain from reducing mega-donor dependency.' },
  smallDollarMatchingApprovalGain: { value: 1.0, unit: '% approval', basis: 'judgement', range: [0.2, 3], note: 'Presidential approval boost from championing clean campaign finance.' },
  // ---- Article V amendment coefficients (Phase 11, REF-04) ----
  amendmentProposalCloutCost: { value: 50, unit: 'clout', basis: 'judgement', range: [20, 100], note: 'Clout required to whip Article V proposal through Congress.' },
  amendmentCampaignCloutCost: { value: 15, unit: 'clout', basis: 'judgement', range: [5, 30], note: 'Clout per turn invested to lobby state legislatures for ratification.' },
  amendmentJudicialTrustGain: { value: 4, unit: 'index pts', basis: 'judgement', range: [1, 10], note: 'Trust gain from constitutional codification of judicial term limits.' },
  amendmentCampaignFinanceTrustGain: { value: 6, unit: 'index pts', basis: 'judgement', range: [2, 12], note: 'Trust gain from constitutional campaign finance reform.' },
  amendmentEraGrowthBonus: { value: 0.2, unit: 'pp', basis: 'judgement', range: [0.05, 0.5], note: 'Economic productivity dividend from Equal Rights Amendment codification.' },
  amendmentEraGiniReduction: { value: 0.01, unit: 'index pts', basis: 'judgement', range: [0.002, 0.03], note: 'Inequality reduction from Equal Rights Amendment codification.' },
  amendmentEraTrustGain: { value: 3, unit: 'index pts', basis: 'judgement', range: [1, 8], note: 'Trust gain from Equal Rights Amendment codification.' },
  amendmentBalancedBudgetBondYieldReduction: { value: 0.25, unit: 'pp', basis: 'judgement', range: [0.05, 0.6], note: 'Bond yield spread reduction from constitutional fiscal constraint credibility.' },
  // ---- Household transmission coefficients (Phase 12, HOU-01, HOU-02) ----
  householdWageGrowthFactor: { value: 0.65, unit: 'share of macro wage growth reaching household', basis: 'judgement', range: [0.3, 1.0], note: 'Share of aggregate real wage growth passed through to take-home pay.' },
  householdTariffPassthrough: { value: 8.0, unit: '$/mo consumer basket cost per 1% tariff', basis: 'judgement', range: [2.0, 20.0], note: 'Monthly goods inflation cost per tariff percentage point.' },
  householdCarbonUtilityRate: { value: 0.8, unit: '$/mo electricity/fuel per carbon index pt', basis: 'judgement', range: [0.2, 2.5], note: 'Monthly energy utility increase per unit of carbon intensity index.' },
  householdCleanEnergyUtilitySavings: { value: 1.0, unit: '$/mo utility reduction per clean energy pt', basis: 'judgement', range: [0.2, 3.0], note: 'Monthly clean energy tax credit utility bill savings.' },
  householdFossilPermittingSavings: { value: 0.8, unit: '$/mo pump/fuel relief per leasing pt', basis: 'judgement', range: [0.2, 2.5], note: 'Monthly pump and fuel price relief from domestic energy permitting.' },
  householdAcaSubsidyRelief: { value: 30.0, unit: '$/mo premium relief per ACA subsidy pt', basis: 'judgement', range: [10.0, 60.0], note: 'Monthly premium subsidy savings for marketplace participants.' },
  householdDrugPriceSeniorSavings: { value: 25.0, unit: '$/mo out-of-pocket savings per Medicare negotiation pt', basis: 'judgement', range: [5.0, 50.0], note: 'Monthly prescription drug savings for seniors under Medicare negotiation.' },
  householdPublicOptionRelief: { value: 15.0, unit: '$/mo premium relief per public option pt', basis: 'judgement', range: [5.0, 40.0], note: 'Monthly premium competition savings for marketplace/uninsured families.' },
  householdUniversalPreKRelief: { value: 45.0, unit: '$/mo childcare savings per child under 6', basis: 'judgement', range: [15.0, 100.0], note: 'Monthly childcare relief per pre-K child from federal universal pre-K.' },
  householdTitleIEducationRelief: { value: 10.0, unit: '$/mo school fee relief per school child', basis: 'judgement', range: [2.0, 30.0], note: 'Monthly public school activity and materials savings per school child.' },
  householdStudentDebtRelief: { value: 25.0, unit: '$/mo loan payment relief per cancellation pt', basis: 'judgement', range: [5.0, 60.0], note: 'Monthly federal student loan payment savings for debt-bearing households.' },
  householdTaxProgressivityLow: { value: 0.35, unit: 'tax rate elasticity factor', basis: 'judgement', range: [0.1, 0.7], note: 'Effective tax rate sensitivity for low-income tier.' },
  householdTaxProgressivityMedian: { value: 0.85, unit: 'tax rate elasticity factor', basis: 'judgement', range: [0.5, 1.2], note: 'Effective tax rate sensitivity for median-income tier.' },
  householdTaxProgressivityUpper: { value: 1.25, unit: 'tax rate elasticity factor', basis: 'judgement', range: [0.8, 1.6], note: 'Effective tax rate sensitivity for upper-middle-income tier.' },
  householdTaxProgressivityHigh: { value: 1.65, unit: 'tax rate elasticity factor', basis: 'judgement', range: [1.0, 2.2], note: 'Effective tax rate sensitivity for high-income tier.' },
  // ---- Geopolitical crisis coefficients (Phase 13, CRISIS-01, CRISIS-02) ----
  crisisCloutDiplomatic: { value: 15, unit: 'clout', basis: 'judgement', range: [5, 30], note: 'Clout cost for presidential diplomatic accords and crisis envoy mediation.' },
  crisisCloutMilitary: { value: 25, unit: 'clout', basis: 'judgement', range: [10, 50], note: 'Clout cost for emergency military deployment or naval escort.' },
  oilEmbargoInflation: { value: 1.2, unit: '% inflation', basis: 'judgement', range: [0.5, 2.5], note: 'Quarterly inflation spike from uncontained global oil supply embargo.' },
  oilEmbargoSprRelief: { value: 0.8, unit: '% inflation', basis: 'judgement', range: [0.3, 1.5], note: 'Inflation relief from Strategic Petroleum Reserve release.' },
  straitBlockadeExportHit: { value: 0.5, unit: '% output gap', basis: 'judgement', range: [0.1, 1.2], note: 'Output gap contraction from maritime shipping bottleneck.' },
  straitEscortCostBn: { value: 15, unit: '$bn/yr', basis: 'judgement', range: [5, 35], note: 'Defense expenditure for naval convoy escorts through critical shipping straits.' },
  debtContagionGdpHit: { value: 0.6, unit: '% output gap', basis: 'judgement', range: [0.2, 1.5], note: 'Macro drag from foreign sovereign debt contagion and credit crunch.' },
  debtContagionBailoutBn: { value: 20, unit: '$bn/yr', basis: 'judgement', range: [5, 45], note: 'Federal funding contribution for international debt restructuring and IMF facilities.' },
  borderClashDefenseSpendBn: { value: 18, unit: '$bn/yr', basis: 'judgement', range: [5, 40], note: 'Emergency security assistance and munitions replenishment for regional border clashes.' },
  borderClashDiplomaticRally: { value: 2, unit: '% approval', basis: 'judgement', range: [1, 5], note: 'Public approval rally from successful diplomatic ceasefire mediation.' },
  geopoliticalEscalationPenalty: { value: 4, unit: '% approval', basis: 'judgement', range: [1, 10], note: 'Public approval penalty when an international crisis expires unaddressed.' },
  geopoliticalEscalationTrust: { value: 3, unit: 'index pts', basis: 'judgement', range: [1, 8], note: 'Public trust loss when an international crisis escalates unmanaged.' },
  defenseSurgeCostBn: { value: 35, unit: '$bn/yr deficit', basis: 'judgement', range: [15, 60], note: 'Annual operations and personnel readiness surcharge for heightened forward defense surge posture (CBO).' },
  defensePeacetimeSavingsBn: { value: 25, unit: '$bn/yr deficit savings', basis: 'judgement', range: [10, 50], note: 'Annual deficit reduction from strategic peacetime troop consolidation and readiness drawdown (CBO).' },
  foreignAssistancePerPoint: { value: 0.45, unit: '$bn/yr per point deviation', basis: 'judgement', range: [0.2, 0.8], note: 'Annual budget impact per point deviation from baseline foreign assistance (base 100 = ~$45B/yr, CRS R43838).' },
  sanctionAssetFreezeInflation: { value: 0.05, unit: '% inflation', basis: 'judgement', range: [0.01, 0.15], note: 'Marginal domestic CPI inflation from targeted financial asset freezes and compliance frictions.' },
  sanctionAssetFreezeOutput: { value: 0.03, unit: '% output gap drag', basis: 'judgement', range: [0.01, 0.1], note: 'Slight output gap drag from targeted banking capital restrictions.' },
  sanctionExportControlsInflation: { value: 0.1, unit: '% inflation', basis: 'judgement', range: [0.02, 0.25], note: 'CPI inflation impact from high-tech export controls and retaliatory supply constraints.' },
  sanctionExportControlsOutput: { value: 0.08, unit: '% output gap drag', basis: 'judgement', range: [0.02, 0.2], note: 'Output gap contraction from export restrictions on aerospace, chips, and dual-use equipment.' },
  sanctionEnergyEmbargoInflation: { value: 0.25, unit: '% inflation', basis: 'judgement', range: [0.05, 0.5], note: 'CPI inflation surge from unilateral energy shipping and transaction prohibitions.' },
  sanctionEnergyEmbargoOutput: { value: 0.15, unit: '% output gap drag', basis: 'judgement', range: [0.05, 0.4], note: 'Domestic output contraction from energy sanctions blowback and reduced trade volumes.' },
  sanctionCloutCost: { value: 10, unit: 'clout', basis: 'judgement', range: [5, 25], note: 'Clout cost to diplomatic and national security apparatus to enact or maintain unilateral targeted sanctions.' },
  // ---- Security index & macro feedback coefficients (Phase 15, SEC-01, SEC-02, SEC-03) ----
  securityBaseline: { value: 50.0, unit: 'index pts', basis: 'judgement', range: [40.0, 60.0], note: 'Neutral baseline value for the 0-100 Security Index at game inception.' },
  securityDefenseSurgeBonus: { value: 8.0, unit: 'index pts', basis: 'judgement', range: [3.0, 15.0], note: 'Security index boost from forward military surge readiness posture.' },
  securityDefensePeacetimePenalty: { value: 10.0, unit: 'index pts', basis: 'judgement', range: [4.0, 18.0], note: 'Security index deduction from peacetime troop drawdown.' },
  securityForeignAidScale: { value: 0.05, unit: 'index pts per aid pt deviation', basis: 'judgement', range: [0.01, 0.15], note: 'Security index effect per point deviation from baseline foreign assistance (100 base).' },
  securityActiveCrisisPenalty: { value: 12.0, unit: 'index pts per active crisis', basis: 'judgement', range: [5.0, 25.0], note: 'Security index penalty per uncontained international crisis.' },
  securitySanctionBonus: { value: 2.5, unit: 'index pts per sanction', basis: 'judgement', range: [1.0, 6.0], note: 'Deterrence credibility added to security index per active targeted sanction.' },
  securityCrimeScale: { value: 25.0, unit: 'index pts per 100% crime deviation', basis: 'judgement', range: [10.0, 50.0], note: 'Domestic public safety contribution to the overall Security Index.' },
  geopoliticalEnergyInflation: { value: 0.25, unit: '% quarterly inflation', basis: 'judgement', range: [0.05, 0.6], note: 'Cost-push CPI inflation from active international energy supply disruptions (SEC-03).' },
  geopoliticalShippingInflation: { value: 0.15, unit: '% quarterly inflation', basis: 'judgement', range: [0.03, 0.4], note: 'Cost-push CPI inflation from active shipping strait choke points (SEC-03).' },
  geopoliticalSupplyOutputDrag: { value: 0.20, unit: '% output gap drag', basis: 'judgement', range: [0.05, 0.5], note: 'Output gap contraction from active geopolitical supply chain bottlenecks (SEC-03).' },
} as const satisfies Record<string, Coeff>;

// ---- clamp bounds ---------------------------------------------------------------------------
export const LIMITS = {
  unemployment: { bounds: [2.5, 15], unit: '% unemployment', basis: 'judgement', note: 'Floor near full employment, ceiling at a deep recession.' },
  inflation: { bounds: [-2, 15], unit: '% inflation', basis: 'judgement', note: 'Allows mild deflation and a 1970s style spike, not hyperinflation.' },
  fedRate: { bounds: [0, 10], unit: '% policy rate', basis: 'judgement', note: 'Zero lower bound; 10% is above any recent peak.' },
  gini: { bounds: [0.3, 0.6], unit: 'Gini index', basis: 'judgement', note: 'Wide enough for any plausible US path; hand-set.' },
  approval: { bounds: [5, 95], unit: '% approval', basis: 'judgement', note: 'No leader is loved or hated by everyone.' },
  income: { bounds: [0.25, 4], unit: 'multiple of starting median income', basis: 'judgement', note: 'Keeps a collapsed economy finite: median income never falls below a quarter or rises above four times its start.' },
  trust: { bounds: [5, 80], unit: '% trust in government', basis: 'judgement', note: 'Wide enough for any plausible path; hand-set.' },
  score: { bounds: [0, 100], unit: 'index pts', basis: 'judgement', note: 'Each score component is capped to the 0 to 100 index scale.' },
} as const satisfies Record<string, Limit>;

// ---- score (design.md section 2) --------------------------------------------------------------
export const SCORE = {
  neutral: { value: 50, unit: 'index pts', basis: 'judgement', range: [40, 60], note: 'A component scores 50 where you started.' },
  nowWeight: { value: 0.5, unit: 'share of final score', basis: 'judgement', range: [0.3, 0.7], note: 'The final score averages how you leave the country and how it holds up ten years on.' },
  incomeWeight: { value: 0.25, unit: 'share of index', basis: 'judgement', range: [0.1, 0.4], note: 'Design weight for real median household income.' },
  employmentWeight: { value: 0.15, unit: 'share of index', basis: 'judgement', range: [0.05, 0.3], note: 'Design weight for the employment-population ratio.' },
  inflationWeight: { value: 0.1, unit: 'share of index', basis: 'judgement', range: [0.05, 0.2], note: 'Design weight for inflation distance from target.' },
  debtWeight: { value: 0.15, unit: 'share of index', basis: 'judgement', range: [0.05, 0.3], note: 'Design weight for the debt-to-GDP trajectory.' },
  lifeExpWeight: { value: 0.1, unit: 'share of index', basis: 'judgement', range: [0.05, 0.2], note: 'Design weight for life expectancy.' },
  inequalityWeight: { value: 0.1, unit: 'share of index', basis: 'judgement', range: [0.05, 0.2], note: 'Design weight for the Gini index.' },
  securityWeight: { value: 0.1, unit: 'share of index', basis: 'judgement', range: [0.05, 0.2], note: 'Design weight for the security index.' },
  trustWeight: { value: 0.05, unit: 'share of index', basis: 'judgement', range: [0.02, 0.1], note: 'Design weight for social trust.' },
  incomeScale: { value: 250, unit: 'index pts per 100% income change', basis: 'judgement', range: [100, 500], note: 'A 10% income gain is worth 25 points, so ordinary gains spread across the scale.' },
  employmentScale: { value: 16, unit: 'index pts per employment-population pt', basis: 'judgement', range: [8, 32], note: 'Three points of employment moves the score about 50.' },
  inflationScale: { value: 20, unit: 'index pts per inflation pt from target', basis: 'judgement', range: [10, 40], note: 'Five points off target scores zero.' },
  debtScale: { value: 1.25, unit: 'index pts per debt/GDP pt', basis: 'judgement', range: [0.5, 2.5], note: 'Forty points of extra debt fills the whole scale.' },
  lifeExpScale: { value: 50, unit: 'index pts per year of life expectancy', basis: 'judgement', range: [25, 100], note: 'One year of life is worth 50 points.' },
  inequalityScale: { value: 2500, unit: 'index pts per Gini unit', basis: 'judgement', range: [1000, 5000], note: 'A 0.02 change in Gini moves the score 50 points.' },
  securityScale: { value: 500, unit: 'index pts per 100% change in crime', basis: 'judgement', range: [250, 1000], note: 'A 10% change in crime moves the score 50 points.' },
  trustScale: { value: 5, unit: 'index pts per trust pt', basis: 'judgement', range: [2, 10], note: 'Ten points of trust moves the score 50 points.' },
} as const satisfies Record<string, Coeff>;

// ---- game rules ---------------------------------------------------------------------------------
export const RULES = {
  startApproval: { value: 52, unit: '% approval', basis: 'judgement', range: [40, 60], note: 'You take office with slightly more support than opposition.' },
  startClout: { value: 120, unit: 'clout', basis: 'judgement', range: [60, 200], note: 'Enough for a few deals in the first year, not enough to buy every vote.' },
  voteReward: { value: 10, unit: 'clout', basis: 'judgement', range: [5, 20], note: 'A passed bill earns a modest reward (UX-3).' },
  refundDivisor: { value: 2, unit: 'divisor of clout spent', basis: 'judgement', range: [1, 4], note: 'A failed bill returns half the clout you spent, so trying is not ruinous (UX-3).' },
  approvalStep: { value: 1, unit: '% approval', basis: 'judgement', range: [0.1, 1], note: 'Approval moves in whole points, the way polls report it.' },
} as const satisfies Record<string, Coeff>;

/** The values view the engine reads. */
export const C = Object.fromEntries(Object.entries(COEFF).map(([k, v]) => [k, v.value])) as { readonly [K in keyof typeof COEFF]: number };
export type Coefficients = typeof C;
