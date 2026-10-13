// Trace attribution: extracts top causal mover and directional change for each indicator (RPT-01, GR-06).
import { whyText } from '../content/text/why';
import type { GameState } from '../engine/game';
import { calculateSecurityBreakdown } from '../engine/security';
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
    case 'security':
      return `${(Math.round(value * 10) / 10).toFixed(1)}`;
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

function attributeSecurity(
  curr: ReturnType<typeof calculateSecurityBreakdown>,
  prev: ReturnType<typeof calculateSecurityBreakdown>,
  delta: number,
): { topCauseId: string; topCauseText: string; direction: Direction } {
  const direction: Direction = delta > 1e-6 ? 'up' : delta < -1e-6 ? 'down' : 'flat';
  if (direction === 'flat') {
    return { topCauseId: 'none', topCauseText: 'No change this quarter', direction };
  }
  const diffs = [
    { id: 'crises', name: 'International crisis containment', diff: curr.crises - prev.crises },
    { id: 'defense', name: 'Defense readiness posture change', diff: curr.defense - prev.defense },
    { id: 'sanctions', name: 'Targeted economic sanctions', diff: curr.sanctions - prev.sanctions },
    { id: 'alliances', name: 'Foreign aid and alliance shifts', diff: curr.alliances - prev.alliances },
    { id: 'domestic', name: 'Domestic crime trends', diff: curr.domestic - prev.domestic },
  ];
  let top = diffs[0]!;
  for (const d of diffs) {
    if (Math.abs(d.diff) > Math.abs(top.diff)) top = d;
  }
  if (Math.abs(top.diff) > 0.01) {
    return { topCauseId: top.id, topCauseText: top.name, direction };
  }
  return { topCauseId: 'mixed', topCauseText: 'Several small factors', direction };
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
  const currSec = calculateSecurityBreakdown(current);
  const prevSec = calculateSecurityBreakdown(previous);

  const specs: Array<{
    id: string;
    name: string;
    traceKey?: keyof typeof trace;
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
    { id: 'security', name: 'National Security', currVal: currSec.total, prevVal: prevSec.total, unit: 'pts', higherIsBetter: true },
    { id: 'trust', name: 'Social Trust', traceKey: 'trust', currVal: c.trust, prevVal: p.trust, unit: '%', higherIsBetter: true },
  ];

  const indicators: IndicatorAttribution[] = specs.map((spec) => {
    const delta = spec.currVal - spec.prevVal;
    let topCauseId: string;
    let topCauseText: string;
    let direction: Direction;

    if (spec.id === 'security') {
      const secAttr = attributeSecurity(currSec, prevSec, delta);
      topCauseId = secAttr.topCauseId;
      topCauseText = secAttr.topCauseText;
      direction = secAttr.direction;
    } else {
      const terms = spec.traceKey ? (trace[spec.traceKey] as readonly Term[] | undefined) : undefined;
      const attr = attributeTerms(terms, delta);
      topCauseId = attr.topCauseId;
      topCauseText = attr.topCauseText;
      direction = attr.direction;
    }
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

export interface UnforeseenRipple {
  readonly title: string;
  readonly description: string;
  readonly cause: string;
}

/**
 * Extracts 1-2 surprise effects or delayed event consequences the player didn't foresee (RPT-04, EVT-06).
 */
export function extractUnforeseenRipples(
  current: GameState,
  previous: GameState,
): UnforeseenRipple[] {
  const ripples: UnforeseenRipple[] = [];
  const log = current.report.log;

  // 1. Disaster rally subsided
  if (log.some((l) => l.kind === 'event' && l.id === 'disaster_rally_ended')) {
    ripples.push({
      title: 'Approval rally subsided',
      description: 'The public rally following your disaster response has faded back to baseline.',
      cause: 'Disaster response fading',
    });
  }

  // 2. Disaster response rally triggered
  if (log.some((l) => l.kind === 'crisis' && (l.detail === 'emergency' || l.detail === 'reconstruction'))) {
    ripples.push({
      title: 'Disaster response approval rally',
      description: 'Swift emergency relief bolstered public morale across affected communities.',
      cause: 'Emergency disaster aid',
    });
  }

  // 3. Oil shock reserve release
  if (log.some((l) => l.kind === 'crisis' && l.id === 'oil_shock' && l.detail === 'reserve')) {
    ripples.push({
      title: 'Strategic fuel buffer',
      description: 'Emergency fuel releases protected supply chains from broader price spikes.',
      cause: 'Oil reserve release',
    });
  }

  // 4. Cyber attack disruption
  if (log.some((l) => l.kind === 'crisis' && l.id === 'cyber_grid')) {
    ripples.push({
      title: 'Supply chain friction',
      description: 'Targeted logistics delays created unexpected drag on quarterly shipments.',
      cause: 'Power grid disruptions',
    });
  }

  // 5. High debt crowding
  if (ripples.length < 2 && current.econ.debt / current.econ.gdp >= 1.20) {
    ripples.push({
      title: 'Rising debt service costs',
      description: 'Higher sovereign debt has begun crowding out private capital investment.',
      cause: 'High debt burden',
    });
  }

  // 6. Inflation shock
  if (ripples.length < 2 && current.econ.inflation - previous.econ.inflation >= 0.25) {
    ripples.push({
      title: 'Inflationary pressure',
      description: 'Higher consumer price momentum is resisting Federal Reserve policy.',
      cause: 'Supply chain costs',
    });
  }

  // 7. Unemployment shift
  if (ripples.length < 2 && current.econ.unemployment - previous.econ.unemployment <= -0.15) {
    ripples.push({
      title: 'Tightening labor market',
      description: 'Lower unemployment increased worker bargaining power for wages.',
      cause: 'Labor demand',
    });
  }

  // 8. Early term honeymoon default fallback
  if (ripples.length < 2 && current.turn <= 2) {
    ripples.push({
      title: 'Early presidential honeymoon',
      description: 'Voters grant early patience while your legislative program takes shape.',
      cause: 'Inaugural goodwill',
    });
  }

  // 9. Natural drift baseline fallback if still under 1
  if (ripples.length === 0) {
    ripples.push({
      title: 'Quiet economic momentum',
      description: 'Underlying productivity gains cushioned the quarter against unexpected shocks.',
      cause: 'Structural productivity',
    });
  }

  return ripples.slice(0, 2);
}

