// Trace attribution: extracts top causal mover and directional change for each indicator (RPT-01, GR-06).
import { whyText } from '../content/text/why';
import type { GameState } from '../engine/game';
import type { Term } from '../engine/trace';

export type Direction = 'up' | 'down' | 'flat';

export interface IndicatorAttribution {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  unit: string;
  delta: number;
  formattedDelta: string;
  direction: Direction;
  isPositive: boolean; // whether "up" is desirable for this indicator
  topCauseId: string;
  topCauseText: string;
}

/** Formats a numeric value with its civics unit. */
export function formatValueWithUnit(id: string, value: number): string {
  switch (id) {
    case 'income':
      return `$${Math.round(value).toLocaleString('en-US')}`;
    case 'empPop':
    case 'unemployment':
    case 'inflation':
    case 'debtPct':
    case 'trust':
    case 'approval':
      return `${(Math.round(value * 10) / 10).toFixed(1)}%`;
    case 'lifeExp':
      return `${(Math.round(value * 10) / 10).toFixed(1)} yrs`;
    case 'gini':
      return (Math.round(value * 1000) / 1000).toFixed(3);
    case 'crime':
      return `${Math.round(value)}`;
    case 'clout':
      return `${Math.round(value)}`;
    default:
      return `${Math.round(value * 10) / 10}`;
  }
}

/** Determines whether an increase is considered favorable for the player/nation. */
export function isFavorableDirection(id: string, direction: Direction): boolean {
  if (direction === 'flat') return true;
  // Lower is better for inflation, debt, crime, gini, unemployment
  const lowerIsBetter = ['inflation', 'debtPct', 'crime', 'gini', 'unemployment'];
  const wantsLower = lowerIsBetter.includes(id);
  return wantsLower ? direction === 'down' : direction === 'up';
}

/** Evaluates top causal attribution from a list of trace terms (GR-06). */
export function attributeTerms(
  terms: readonly Term[] | undefined,
  delta: number,
  tolerance = 1e-6,
): { topCauseId: string; topCauseText: string; direction: Direction } {
  const direction: Direction = delta > tolerance ? 'up' : delta < -tolerance ? 'down' : 'flat';

  if (!terms || terms.length === 0) {
    return { topCauseId: 'none', topCauseText: 'No change this quarter', direction };
  }

  // Filter out tiny residuals and rounding terms (< 1e-9)
  const validTerms = terms.filter(
    (t) => Math.abs(t.amount) >= 1e-9 && t.source !== 'rounding' && t.source !== 'clamp',
  );

  if (validTerms.length === 0) {
    return { topCauseId: 'none', topCauseText: 'Several small factors', direction };
  }

  // Find the largest single absolute mover
  let topTerm = validTerms[0]!;
  let totalMagnitude = 0;
  for (const t of validTerms) {
    totalMagnitude += Math.abs(t.amount);
    if (Math.abs(t.amount) > Math.abs(topTerm.amount)) {
      topTerm = t;
    }
  }

  // If the top mover accounts for at least 35% of total movement magnitude, cite it; else "Several small factors"
  if (totalMagnitude > 0 && Math.abs(topTerm.amount) / totalMagnitude >= 0.35) {
    return {
      topCauseId: topTerm.source,
      topCauseText: whyText(topTerm.source),
      direction,
    };
  }

  return {
    topCauseId: 'mixed',
    topCauseText: 'Several small factors',
    direction,
  };
}

export interface TurnAttributions {
  indicators: IndicatorAttribution[];
  approval: IndicatorAttribution;
  clout: IndicatorAttribution;
}

/**
 * Extracts all 8 core prosperity indicators plus approval and clout with their attributions (RPT-01).
 */
export function extractTurnAttributions(current: GameState, previous: GameState): TurnAttributions {
  const trace = current.report.trace ?? {};
  const c = current.econ;
  const p = previous.econ;

  const specs: Array<{
    id: string;
    name: string;
    traceKey: keyof typeof trace;
    currVal: number;
    prevVal: number;
    unit: string;
    higherIsBetter: boolean;
  }> = [
    { id: 'income', name: 'Typical Family Income', traceKey: 'income', currVal: c.realIncome, prevVal: p.realIncome, unit: '$', higherIsBetter: true },
    { id: 'empPop', name: 'People Working', traceKey: 'empPop', currVal: c.empPop, prevVal: p.empPop, unit: '%', higherIsBetter: true },
    { id: 'inflation', name: 'Inflation Rate', traceKey: 'inflation', currVal: c.inflation, prevVal: p.inflation, unit: '%', higherIsBetter: false },
    { id: 'debtPct', name: 'National Debt', traceKey: 'debtPct', currVal: (c.debt / c.gdp) * 100, prevVal: (p.debt / p.gdp) * 100, unit: '%', higherIsBetter: false },
    { id: 'lifeExp', name: 'Life Expectancy', traceKey: 'lifeExp', currVal: c.lifeExp, prevVal: p.lifeExp, unit: 'yrs', higherIsBetter: true },
    { id: 'gini', name: 'Inequality', traceKey: 'gini', currVal: c.gini, prevVal: p.gini, unit: '', higherIsBetter: false },
    { id: 'crime', name: 'Public Safety', traceKey: 'crime', currVal: c.crime, prevVal: p.crime, unit: '', higherIsBetter: false },
    { id: 'trust', name: 'Social Trust', traceKey: 'trust', currVal: c.trust, prevVal: p.trust, unit: '%', higherIsBetter: true },
  ];

  const indicators: IndicatorAttribution[] = specs.map((spec) => {
    const delta = spec.currVal - spec.prevVal;
    const terms = trace[spec.traceKey] as readonly Term[] | undefined;
    const { topCauseId, topCauseText, direction } = attributeTerms(terms, delta);
    const isPositive = direction === 'flat' ? true : spec.higherIsBetter ? direction === 'up' : direction === 'down';
    const sign = delta > 0 ? '+' : '';
    const formattedDelta = `${sign}${formatValueWithUnit(spec.id, delta)}`;

    return {
      id: spec.id,
      name: spec.name,
      value: spec.currVal,
      formattedValue: formatValueWithUnit(spec.id, spec.currVal),
      unit: spec.unit,
      delta,
      formattedDelta,
      direction,
      isPositive,
      topCauseId,
      topCauseText,
    };
  });

  // Approval attribution
  const apprDelta = current.approval - previous.approval;
  const apprAttr = attributeTerms(trace.approval as readonly Term[] | undefined, apprDelta);
  const approval: IndicatorAttribution = {
    id: 'approval',
    name: 'Voter Support',
    value: current.approval,
    formattedValue: `${current.approval}%`,
    unit: '%',
    delta: apprDelta,
    formattedDelta: `${apprDelta > 0 ? '+' : ''}${apprDelta}%`,
    direction: apprAttr.direction,
    isPositive: apprAttr.direction !== 'down',
    topCauseId: apprAttr.topCauseId,
    topCauseText: apprAttr.topCauseText,
  };

  // Clout attribution
  const cloutDelta = current.clout - previous.clout;
  const cloutAttr = attributeTerms(trace.clout as readonly Term[] | undefined, cloutDelta);
  const clout: IndicatorAttribution = {
    id: 'clout',
    name: 'Political Capital',
    value: current.clout,
    formattedValue: `${current.clout}`,
    unit: '',
    delta: cloutDelta,
    formattedDelta: `${cloutDelta > 0 ? '+' : ''}${cloutDelta}`,
    direction: cloutAttr.direction,
    isPositive: cloutDelta >= 0,
    topCauseId: cloutAttr.topCauseId,
    topCauseText: cloutAttr.topCauseText,
  };

  return {
    indicators,
    approval,
    clout,
  };
}
