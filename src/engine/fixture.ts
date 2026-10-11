import type { BudgetDraft } from './budget';
import type { Decisions, Start } from './game';

// Round-number test fixture shaped like the real start; tests must not depend on live data.
export const START: Start = {
  gdp: 31,
  potential: 2,
  unemployment: 4.3,
  empPop: 59.7,
  inflation: 2.9,
  fedRate: 4.25,
  medianIncome: 83000,
  gini: 0.49,
  lifeExp: 79,
  debtPct: 100,
  deficitPct: 6,
  tariff: 17,
  trust: 22,
  crime: 360,
};

// The single place tests turn a budget into this turn's decisions. All three deals reach 230 of 218
// votes for 45 clout, so enacted budgets really pass the House (the starting clout is 120).
export const enact = (budget: BudgetDraft): Decisions => ({ bill: { budget, deals: ['mod', 'cen', 'spc'] } });
