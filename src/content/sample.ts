// Placeholder numbers until data/us-2026.json and the macro model land (M1).
// Shape matches what the engine will provide; nothing here is sourced.

export interface Indicator {
  label: string;
  value: string;
  unit?: string;
  direction: 'up' | 'down';
  good: boolean;
  trend: number[];
}

export const headline: Indicator[] = [
  { label: 'Typical family income', value: '$80,600', direction: 'up', good: true, trend: [4, 5, 5, 6, 7, 7, 8, 10] },
  { label: 'People working', value: '59.9%', direction: 'up', good: true, trend: [5, 5, 6, 6, 7, 7, 8, 8] },
  { label: 'Prices rising', value: '2.9%', unit: 'a year', direction: 'down', good: true, trend: [10, 9, 9, 8, 7, 7, 6, 5] },
  { label: 'Debt', value: '100%', unit: 'of economy', direction: 'up', good: false, trend: [3, 4, 5, 5, 6, 7, 8, 10] },
];

export const prosperity = { score: 61, change: 2, vsNothing: 4.2 };

export const briefing = 'Prices are cooling. Congress wants a budget in 3 weeks.';

export const thisTurn = { title: 'Budget due in 3 weeks', detail: 'Miss it and the government shuts down.' };

export const suggestions = [
  { title: 'Pass a budget', cta: 'Open Budget', target: 'budget' },
  { title: 'Win over Moderates', cta: 'Open Congress', target: 'congress' },
  { title: 'Myth? Lower gas prices', cta: 'Find out', target: null },
] as const;
