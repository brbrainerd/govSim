// The engine is the single source of "why" (FND-04): every indicator change is a sum of named terms.
// Only `clamp` and `rounding` may be residuals, each bounded by the guards in trace.test.ts. There is
// deliberately no catch-all source (no `residual`, `other`, `misc`) that could absorb a modelling error.

export interface Term { readonly source: string; readonly amount: number }

export const TRACE_KEYS = [
  'gap', 'growth', 'unemployment', 'inflation', 'expected', 'fedRate', 'debtPct', 'income',
  'empPop', 'lifeExp', 'gini', 'crime', 'trust', 'approval', 'clout',
] as const;
export type TraceKey = (typeof TRACE_KEYS)[number];
/** Level keys: the terms sum to the value itself, not to the change since last turn. */
export const LEVEL_KEYS: ReadonlySet<TraceKey> = new Set<TraceKey>(['growth']);

/** Ordered named terms, merged by source id; zero amounts are skipped. */
export class Ledger {
  readonly terms: Term[] = [];

  add(source: string, amount: number): void {
    if (amount === 0) return;
    const i = this.terms.findIndex((x) => x.source === source);
    if (i >= 0) this.terms[i] = { source, amount: this.terms[i]!.amount + amount }; else this.terms.push({ source, amount });
  }

  get sum(): number {
    let s = 0;
    for (const t of this.terms) s += t.amount;
    return s;
  }

  /** Clamps v into [lo, hi]; the cut is recorded as `clamp`. */
  clamp(v: number, lo: number, hi: number): number {
    const c = Math.min(hi, Math.max(lo, v));
    this.add('clamp', c - v);
    return c;
  }

  /** Rounds v to the nearest multiple of q; the difference is recorded as `rounding`. */
  round(v: number, q: number): number {
    const r = Math.round(v / q) * q;
    this.add('rounding', r - v);
    return r;
  }

  /** For level-defined indicators: the carry that makes before + terms equal the stored value. */
  settleTo(before: number, value: number): number {
    this.add('clamp', value - (before + this.sum));
    return value;
  }

  /** A copy with every amount times k (growth and employment reuse the gap and unemployment terms). */
  scaled(k: number): Ledger {
    const l = new Ledger();
    for (const t of this.terms) l.add(t.source, k * t.amount);
    return l;
  }
}

// ---- source ids ---------------------------------------------------------------------------
// Pitfall 10: `luck` appears under the same id in several keys (gap, growth, unemployment, empPop and
// the inflation and approval shocks). A total-luck line must sum per indicator, never across keys.
export const SOURCES: Record<string, { kind: string }> = {
  momentum: { kind: 'structure' },
  budget: { kind: 'policy' },
  'debt:stress': { kind: 'debt' },
  'fed:drag': { kind: 'fed' },
  luck: { kind: 'luck' },
  clamp: { kind: 'residual' },
  rounding: { kind: 'residual' },
  'potential:base': { kind: 'structure' },
  'potential:policy': { kind: 'policy' },
  'potential:crowding': { kind: 'debt' },
  expectations: { kind: 'prices' },
  demand: { kind: 'structure' },
  tariffs: { kind: 'policy' },
  prices: { kind: 'prices' },
  'fed:neutral': { kind: 'fed' },
  'fed:inflationGap': { kind: 'fed' },
  'fed:outputGap': { kind: 'fed' },
  'deficit:base': { kind: 'debt' },
  'deficit:budget': { kind: 'policy' },
  'deficit:interest': { kind: 'debt' },
  'gdp:growth': { kind: 'structure' },
  growth: { kind: 'structure' },
  'budget:family': { kind: 'policy' },
  'health:trend': { kind: 'structure' },
  'health:spending': { kind: 'policy' },
  'health:reversion': { kind: 'structure' },
  'tax:income': { kind: 'policy' },
  'spend:medicaid': { kind: 'policy' },
  'gini:reversion': { kind: 'structure' },
  'crime:jobs': { kind: 'structure' },
  'crime:trend': { kind: 'structure' },
  'trust:reversion': { kind: 'structure' },
  'trust:approval': { kind: 'structure' },
  'approval:reversion': { kind: 'structure' },
  'approval:honeymoon': { kind: 'structure' },
  'approval:jobs': { kind: 'structure' },
  'approval:prices': { kind: 'structure' },
  'approval:growth': { kind: 'structure' },
  'clout:income': { kind: 'structure' },
  'clout:deals': { kind: 'policy' },
  'clout:crisis': { kind: 'policy' },
  'clout:powers': { kind: 'policy' },
  'clout:reward': { kind: 'policy' },
  'clout:refund': { kind: 'policy' },
  'fed:credibility': { kind: 'fed' },
  'social:budget': { kind: 'policy' },
  'social:family': { kind: 'policy' },
  'social:health': { kind: 'policy' },
  'social:energy': { kind: 'policy' },
  'social:labor': { kind: 'policy' },
  'social:productivity': { kind: 'policy' },
  'social:aca': { kind: 'policy' },
  'social:pharma': { kind: 'policy' },
  'social:puboption': { kind: 'policy' },
  'social:border': { kind: 'policy' },
  'social:visas': { kind: 'policy' },
  'social:legalization': { kind: 'policy' },
  'social:clean_energy': { kind: 'policy' },
  'social:fossil_leasing': { kind: 'policy' },
  'social:carbon_std': { kind: 'policy' },
  'social:title_i': { kind: 'policy' },
  'social:student_debt': { kind: 'policy' },
  'social:prek': { kind: 'policy' },
  'clout:reform': { kind: 'policy' },
  'trust:reform': { kind: 'policy' },
  'approval:reform': { kind: 'policy' },
};
/** Open families added by later phases (events, executive orders, laws, social policies, reforms, foreign policy, geopolitical). */
export const SOURCE_PREFIXES = ['event:', 'eo:', 'law:', 'social:', 'reform:', 'forpol:', 'geopolitical:'] as const;

export const isKnownSource = (id: string): boolean =>
  Object.hasOwn(SOURCES, id) || SOURCE_PREFIXES.some((p) => id.startsWith(p));
