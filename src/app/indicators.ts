import type { GameState } from '../engine/game';

export interface Indicator {
  label: string;
  value: string;
  unit?: string;
  direction: 'up' | 'down' | 'flat';
  good: boolean;
  trend: number[];
}

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

const defs = [
  { label: 'Typical family income', get: (s: GameState) => s.econ.realIncome, fmt: money, upIsGood: true },
  { label: 'People working', get: (s: GameState) => s.econ.empPop, fmt: (n: number) => `${n.toFixed(1)}%`, upIsGood: true },
  { label: 'Prices rising', get: (s: GameState) => s.econ.inflation, fmt: (n: number) => `${n.toFixed(1)}%`, unit: 'a year', upIsGood: false },
  { label: 'Debt', get: (s: GameState) => (s.econ.debt / s.econ.gdp) * 100, fmt: (n: number) => `${n.toFixed(0)}%`, unit: 'of economy', upIsGood: false },
];

/** Home-screen headline tiles from the snapshot history (last 8 turns for the sparkline). */
export function headline(history: readonly GameState[]): Indicator[] {
  const now = history[history.length - 1]!, prev = history[history.length - 2] ?? now;
  return defs.map((d) => {
    const v = d.get(now), delta = v - d.get(prev);
    const direction = Math.abs(delta) < 1e-6 ? 'flat' : delta > 0 ? 'up' : 'down';
    return {
      label: d.label,
      value: d.fmt(v),
      unit: d.unit,
      direction,
      good: direction === 'flat' || (direction === 'up') === d.upIsGood,
      trend: history.slice(-8).map(d.get),
    };
  });
}
