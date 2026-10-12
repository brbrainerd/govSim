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
  'clout:reward': 'Passed legislation reward',
  'clout:refund': 'Failed bill clout refund',
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
  return 'Several small factors';
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
