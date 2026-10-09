// House vote model (design.md §3 Congress, UX-2 auto-whip, UX-3 rewards).
// ponytail: fixed groups and three deals for one bill; the bloc model replaces this in M1.

export const HOUSE_SEATS = 435;
export const TO_PASS = 218;

export const groups = [
  { id: 'pro', name: 'Progressives', seats: 95, yes: 95, color: 'sky', wants: 'Bigger, greener' },
  { id: 'mod', name: 'Moderates', seats: 100, yes: 80, color: 'sage', wants: 'Money for home' },
  { id: 'cen', name: 'Centrists', seats: 45, yes: 20, color: 'gold', wants: 'Lower price tag' },
  { id: 'con', name: 'Conservatives', seats: 140, yes: 8, color: 'alert', wants: 'Cut the deficit' },
  { id: 'fre', name: 'Freedom Caucus', seats: 55, yes: 0, color: 'ink', wants: 'No new spending' },
] as const;
export type GroupId = (typeof groups)[number]['id'];

export const deals = [
  { id: 'mod', title: 'Deal with Moderates', detail: 'Road money for their states', cost: 20, gain: { mod: 12 } },
  { id: 'cen', title: 'Deal with Centrists', detail: 'Trim the price tag 10%', cost: 15, gain: { cen: 9 } },
  { id: 'spc', title: 'Speech in swing districts', detail: 'Pressure from home', cost: 10, gain: { cen: 4, con: 2 } },
] as const satisfies readonly { id: string; title: string; detail: string; cost: number; gain: Partial<Record<GroupId, number>> }[];
export type DealId = (typeof deals)[number]['id'];

export function tally(done: readonly DealId[]) {
  const byGroup = {} as Record<GroupId, number>;
  let total = 0;
  for (const g of groups) {
    let y: number = g.yes;
    for (const d of deals) if (done.includes(d.id)) y += (d.gain as Partial<Record<GroupId, number>>)[g.id] ?? 0;
    byGroup[g.id] = Math.min(y, g.seats);
    total += byGroup[g.id];
  }
  return { byGroup, total, short: Math.max(0, TO_PASS - total) };
}

/** Reward/punish rule (UX-3): pass → +10 clout; fail → half the clout spent comes back. */
export function voteOutcome(total: number, spent: number) {
  const passed = total >= TO_PASS;
  return { passed, cloutBack: passed ? 10 : Math.floor(spent / 2) };
}
