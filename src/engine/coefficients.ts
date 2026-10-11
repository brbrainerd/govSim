// Model coefficient registry (FND-07): every model number has a citation or judgement tag, a unit,
// a note and an allowed range. No imports; plain data plus a validator the tests run over it.

export type Basis = 'citation' | 'judgement';
export interface Source { text: string; url: string } // https only
export interface Coeff { value: number; unit: string; basis: Basis; range: readonly [number, number]; note: string; sources?: readonly Source[] }
export interface Limit { bounds: readonly [number, number]; unit: string; basis: Basis; note: string; sources?: readonly Source[] }

/** Human-readable problems with one registry entry; [] when it is valid. */
export function problems(name: string, entry: Coeff | Limit): string[] {
  const out: string[] = [];
  const bad = (m: string) => out.push(`${name}: ${m}`);
  const [lo, hi] = 'value' in entry ? entry.range : entry.bounds;
  if (!(lo < hi)) bad(`range must have lo < hi, got [${lo}, ${hi}]`);
  else if ('value' in entry && !(lo <= entry.value && entry.value <= hi)) bad(`value ${entry.value} outside [${lo}, ${hi}]`);
  if (!entry.unit.trim()) bad('unit is empty');
  if (!entry.note.trim()) bad('note is empty');
  if (entry.basis !== 'citation' && entry.basis !== 'judgement') bad(`basis must be citation or judgement, got ${String(entry.basis)}`);
  if (entry.basis === 'citation' && !entry.sources?.length) bad('citation needs at least one source');
  for (const s of entry.sources ?? []) {
    if (!s.text.trim()) bad('source text is empty');
    if (!s.url.startsWith('https://')) bad(`source url must start with https://, got ${s.url}`);
  }
  return out;
}

export const COEFF = {
  potentialGrowth: {
    value: 1.8, unit: '% real potential growth per year', basis: 'judgement', range: [1.5, 2.2],
    note: 'A model assumption, not a data field: CBO long-run potential growth is roughly 1.8 to 2%.',
  },
} as const satisfies Record<string, Coeff>;

/** The values view the engine reads. */
export const C = Object.fromEntries(Object.entries(COEFF).map(([k, v]) => [k, v.value])) as { readonly [K in keyof typeof COEFF]: number };
export type Coefficients = typeof C;
