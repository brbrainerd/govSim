// Plain-language dictionary mapping engine trace source IDs to user-facing copy (GR-06, GR-07, OBS-05).
// All text must pass reading grade <= 9 and sentence length <= 20 words. No real politicians, nonpartisan.

export const WHY_COPY: Record<string, string> = {
  momentum: 'Economic momentum',
  budget: 'Enacted budget changes',
  'debt:stress': 'High national debt drag',
  'fed:drag': 'High interest rate drag',
  luck: 'Unplanned economic luck',
  clamp: 'Natural limits',
  rounding: 'Small rounding adjustment',
  'potential:base': 'Normal baseline growth',
  'potential:policy': 'Investment from policy',
  'potential:crowding': 'Debt crowding out growth',
  expectations: 'Inflation expectations',
  demand: 'Strong consumer demand',
  tariffs: 'Tariffs on imports',
  prices: 'Market price changes',
  'fed:neutral': 'Fed neutral rate target',
  'fed:inflationGap': 'Fed fighting inflation',
  'fed:outputGap': 'Fed responding to growth',
  'deficit:base': 'Baseline fiscal deficit',
  'deficit:budget': 'New budget spending',
  'deficit:interest': 'Interest on national debt',
  'gdp:growth': 'Economy expansion',
  growth: 'Economic growth',
  'budget:family': 'Tax and wage changes',
  'health:trend': 'Public health progress',
  'health:spending': 'Healthcare funding changes',
  'health:reversion': 'Gradual health baseline drift',
  'tax:income': 'Income tax changes',
  'spend:medicaid': 'Medicaid funding changes',
  'gini:reversion': 'Market forces on wages',
  'crime:jobs': 'Job market conditions',
  'crime:trend': 'Broader crime trends',
  'trust:reversion': 'Gradual social trust drift',
  'trust:approval': 'Public approval momentum',
  'approval:reversion': 'Natural drift toward baseline',
  'approval:honeymoon': 'Early term honeymoon effect',
  'approval:jobs': 'Reaction to job numbers',
  'approval:prices': 'Frustration over high prices',
  'approval:growth': 'Reaction to economic growth',
  'clout:income': 'Political capital from approval',
  'clout:deals': 'Deals negotiated in Congress',
  'clout:crisis': 'Clout spent on crises',
  'clout:powers': 'Executive powers and actions',
  'clout:reward': 'Passed legislation reward',
  'clout:refund': 'Failed bill clout refund',
  'fed:credibility': 'Loss of central bank trust',
  'social:budget': 'Social program budget changes',
  'social:family': 'Family cost savings',
  'social:health': 'Health coverage policy changes',
  'social:energy': 'Energy policy shifts',
  'social:labor': 'Workforce policy shifts',
  'social:productivity': 'Education and skills boost',
  'social:aca': 'Health subsidy level changes',
  'social:pharma': 'Prescription drug price rules',
  'social:puboption': 'Public health plan choice',
  'social:border': 'Border security funding changes',
  'social:visas': 'Worker visa limit adjustments',
  'social:legalization': 'Worker legal status rules',
  'social:clean_energy': 'Clean energy tax credits',
  'social:fossil_leasing': 'Oil and gas permits',
  'social:carbon_std': 'Clean energy rules',
  'social:title_i': 'School grant funding',
  'social:student_debt': 'Student loan debt relief',
  'social:prek': 'Early childhood education grants',
  'clout:reform': 'Effort spent on reform rules',
  'trust:reform': 'Public trust from rule changes',
  'approval:reform': 'Voter views on rule changes',
  'forpol:sanctions': 'Trade sanctions on foreign targets',
  'forpol:budget': 'Defense and foreign aid funding',
  'geopolitical:energy': 'Global oil and energy shock',
  'geopolitical:shipping': 'Shipping lane trade block',
  'geopolitical:supply': 'Foreign supply chain delay',
  'trade:sectors': 'Tariffs on foreign tech and goods',
  'trade:retaliation': 'Foreign trade counter tariffs',
  'trade:pacts': 'New trade accord export boost',
  'approval:evil': 'Public backlash from corrupt conduct',
  'trust:evil': 'Scandal and ethics investigations',
  'clout:evil_levers': 'Influence spent on corrupt deals',
  'approval:evil_levers': 'Voter anger from corrupt deals',
  'trust:evil_levers': 'Public trust lost from corrupt deals',
  'clout:special_counsel': 'Influence drained by special counsel probe',
  'event:living_world_variance': 'Dynamic market variance',
  'event:ai_dynamic_crisis': 'Unfolding dynamic event',
  'event:myth_spin': 'TV spin on common myths',
  'clout:perks': 'Task force draft choices',
  'clout:synergy': 'Policy doctrine combo bonus',
  'clout:archetype': 'Presidential style bonus',
};

/** Plain-language description of an engine trace source key (GR-06). */
export function whyText(sourceId: string): string {
  if (Object.hasOwn(WHY_COPY, sourceId)) {
    return WHY_COPY[sourceId]!;
  }
  if (sourceId.startsWith('event:')) {
    return 'Recent unexpected event';
  }
  if (sourceId.startsWith('eo:')) {
    return 'Executive action in force';
  }
  if (sourceId.startsWith('law:')) {
    return 'Passed legislation in force';
  }
  if (sourceId.startsWith('forpol:')) {
    return 'Foreign policy decisions';
  }
  if (sourceId.startsWith('geopolitical:')) {
    return 'International crisis disruption';
  }
  if (sourceId.startsWith('trade:')) {
    return 'Trade accords and tariffs';
  }
  if (sourceId.startsWith('evil:')) {
    return 'Scandal and corrupt conduct fallout';
  }
  if (sourceId.startsWith('perk:')) {
    return 'Active White House task force';
  }
  if (sourceId.startsWith('synergy:')) {
    return 'Policy doctrine combo bonus';
  }
  if (sourceId.startsWith('archetype:')) {
    return 'Presidential leadership style';
  }
  return 'Several small factors';
}

export const WHY_WONK_COPY: Readonly<Record<string, string>> = {
  momentum: 'AR(1) Output Gap Persistence',
  budget: 'Enacted Fiscal Multiplier Impulse',
  'debt:stress': 'Sovereign Debt-to-GDP Term Premium Drag',
  'fed:drag': 'Real Federal Funds Rate Monetary Transmission',
  'potential:base': 'CBO Baseline Potential GDP Trend',
  'potential:policy': 'Public Capital Supply-Side Elasticity',
  'potential:crowding': 'Sovereign Borrowing Crowding-Out Effect',
  expectations: 'Anchored CPI Inflation Expectations',
  demand: 'Phillips Curve Output Gap Pass-Through',
  tariffs: 'Effective Tariff Rate CPI Pass-Through',
  'fed:neutral': 'r* Neutral Real Policy Rate Target',
  'fed:inflationGap': 'Taylor Rule Inflation Gap Coefficient',
  'fed:outputGap': 'Taylor Rule Output Gap Coefficient',
  'deficit:base': 'CBO Current-Law Structural Deficit',
  'deficit:budget': 'Enacted Reconciliation Budget Delta',
  'deficit:interest': 'Net Interest Outlays on Federal Debt',
  'gini:reversion': 'Secular Market Income Dispersion Drift',
  'forpol:sanctions': 'IEEPA / ECRA Sanctions Trade Friction',
  'trade:sectors': 'Section 301/232 Sector Tariff Pass-Through',
  'trade:retaliation': 'Foreign Counter-Tariff Export Drag',
  'clout:perks': 'Executive Task Force Mandate Allocation',
  'clout:synergy': 'Institutional Doctrine Flywheel Dividend',
  'clout:archetype': 'Executive Leadership Archetype Modifier',
};

/** Returns either the Plain-Talk or Policy Wonk trace explanation (COPY-03). */
export function whyTextForMode(sourceId: string, mode: 'plain' | 'wonk' = 'plain'): string {
  if (mode === 'wonk' && Object.hasOwn(WHY_WONK_COPY, sourceId)) {
    return WHY_WONK_COPY[sourceId]!;
  }
  return whyText(sourceId);
}

/** Summarize luck effects this quarter in plain language (RPT-01). */
export function formatLuckText(luck: { gap: number; infl: number; appr: number }): string {
  const shocks = [];
  if (Math.abs(luck.infl) > 1.2) {
    shocks.push(luck.infl > 0 ? 'unexpected price spike' : 'unexpected price cooldown');
  }
  if (Math.abs(luck.gap) > 1.2) {
    shocks.push(luck.gap > 0 ? 'surprise growth burst' : 'unexpected economic slowdown');
  }
  if (Math.abs(luck.appr) > 1.2) {
    shocks.push(luck.appr > 0 ? 'favorable news cycle' : 'unfavorable news cycle');
  }
  if (shocks.length === 0) {
    return 'Normal conditions across prices, growth, and news.';
  }
  return `Outside factors brought an ${shocks.join(' and ')}.`;
}
