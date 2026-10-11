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
} as const satisfies Record<string, Coeff>;

// ---- clamp bounds ---------------------------------------------------------------------------
export const LIMITS = {
  unemployment: { bounds: [2.5, 15], unit: '% unemployment', basis: 'judgement', note: 'Floor near full employment, ceiling at a deep recession.' },
  inflation: { bounds: [-2, 15], unit: '% inflation', basis: 'judgement', note: 'Allows mild deflation and a 1970s style spike, not hyperinflation.' },
  fedRate: { bounds: [0, 10], unit: '% policy rate', basis: 'judgement', note: 'Zero lower bound; 10% is above any recent peak.' },
  gini: { bounds: [0.3, 0.6], unit: 'Gini index', basis: 'judgement', note: 'Wide enough for any plausible US path; hand-set.' },
  approval: { bounds: [5, 95], unit: '% approval', basis: 'judgement', note: 'No leader is loved or hated by everyone.' },
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
} as const satisfies Record<string, Coeff>;

/** The values view the engine reads. */
export const C = Object.fromEntries(Object.entries(COEFF).map(([k, v]) => [k, v.value])) as { readonly [K in keyof typeof COEFF]: number };
export type Coefficients = typeof C;
