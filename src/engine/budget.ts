// Budget levers + the Expert forecast (design.md §3 M1 levers, G4).
// ponytail: linear per-unit effects; 10-yr costs sized from ~2026 revenue/outlay magnitudes (1pt or 1%
// of each line), not CBO scores. Replace with sourced scores when data/us-2026.json lands.

export interface Lever {
  id: string;
  label: string; // plain language (UX-1)
  base: number;
  min: number;
  max: number;
  step: number;
  deficitBn: number; // 10-yr deficit change per unit, $bn (+ = more borrowing)
  family: number; // typical family $/month per unit
  growth: number; // growth index per unit
}

export const taxLevers: Lever[] = [
  { id: 'inc', label: 'Income tax', base: 22, min: 10, max: 40, step: 1, deficitBn: -1200, family: -40, growth: -0.02 },
  { id: 'bus', label: 'Business tax', base: 21, min: 10, max: 35, step: 1, deficitBn: -210, family: -3, growth: -0.02 },
  { id: 'inv', label: 'Investment tax', base: 20, min: 10, max: 40, step: 1, deficitBn: -100, family: -1, growth: -0.01 },
  { id: 'pay', label: 'Payroll tax', base: 15.3, min: 10, max: 20, step: 0.1, deficitBn: -1180, family: -25, growth: -0.02 },
  { id: 'tar', label: 'Tariffs', base: 11, min: 0, max: 40, step: 1, deficitBn: -180, family: -10, growth: -0.06 },
];

/** Spending levers are % of this year's level (100 = unchanged). */
export const spendLevers: Lever[] = [
  { id: 'def', label: 'Defense', base: 100, min: 80, max: 120, step: 1, deficitBn: 100, family: 0, growth: 0.005 },
  { id: 'ssm', label: 'Social Security & Medicare', base: 100, min: 90, max: 110, step: 1, deficitBn: 250, family: 1, growth: 0.005 },
  { id: 'mcd', label: 'Medicaid', base: 100, min: 80, max: 120, step: 1, deficitBn: 60, family: 1, growth: 0.005 },
  { id: 'rds', label: 'Roads & bridges', base: 100, min: 80, max: 130, step: 1, deficitBn: 12, family: 0.3, growth: 0.03 },
  { id: 'rnd', label: 'Research', base: 100, min: 80, max: 130, step: 1, deficitBn: 20, family: 0, growth: 0.03 },
  { id: 'oth', label: 'Other agencies', base: 100, min: 80, max: 120, step: 1, deficitBn: 70, family: 0, growth: 0.005 },
];

const all = [...taxLevers, ...spendLevers];
export type BudgetDraft = Record<string, number>;

export const packages = {
  'Keep as is': {},
  'Tax cut': { inc: 19, bus: 18, inv: 15 },
  'Infrastructure push': { rds: 115, rnd: 105 },
  'Balance the budget': { inc: 25, def: 95, oth: 92, ssm: 98 },
} satisfies Record<string, BudgetDraft>;
export type PackageName = keyof typeof packages;

export const baseline = (): BudgetDraft => Object.fromEntries(all.map((l) => [l.id, l.base]));
export const fromPackage = (p: PackageName): BudgetDraft => ({ ...baseline(), ...packages[p] });

export interface Forecast {
  deficitBn: number;
  growth: number;
  familyMonthly: number;
}

export function estimate(draft: BudgetDraft): Forecast {
  let deficitBn = 0, growth = 0, familyMonthly = 0;
  for (const l of all) {
    const d = (draft[l.id] ?? l.base) - l.base;
    deficitBn += d * l.deficitBn;
    growth += d * l.growth;
    familyMonthly += d * l.family;
  }
  return { deficitBn, growth, familyMonthly: Math.round(familyMonthly) };
}

/** Plain-language forecast lines (UX-1). */
export function describe(f: Forecast) {
  const t = Math.abs(f.deficitBn) / 1000;
  return {
    deficit: t < 0.05 ? 'Deficit: about the same' : `Deficit: $${t.toFixed(1)} trillion ${f.deficitBn < 0 ? 'less' : 'more'} over 10 years`,
    deficitGood: f.deficitBn <= 0,
    economy: f.growth > 0.15 ? 'Economy: a bit faster' : f.growth < -0.15 ? 'Economy: a bit slower' : 'Economy: about the same',
    family: `${f.familyMonthly >= 0 ? '+' : '−'}$${Math.abs(f.familyMonthly)} a month`,
    familyGood: f.familyMonthly >= 0,
  };
}
