// Placeholder briefing copy and suggestions until the event system lands; nothing here is sourced.

export const briefing = 'Prices are cooling. Congress wants a budget in 3 weeks.';

export const thisTurn = { title: 'Budget due in 3 weeks', detail: 'Miss it and the government shuts down.' };

export const suggestions = [
  { title: 'Pass a budget', cta: 'Open Budget', target: 'budget' },
  { title: 'Win over Moderates', cta: 'Open Congress', target: 'congress' },
  { title: 'Myth? Lower gas prices', cta: 'Find out', target: null },
] as const;
