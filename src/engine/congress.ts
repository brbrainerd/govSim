// House vote model (design.md §3 Congress, UX-2 auto-whip, UX-3 rewards).
// ponytail: fixed groups and three deals for one bill; the bloc model replaces this in M1.

import { C, RULES } from './coefficients';

export const HOUSE_SEATS = 435;
export const TO_PASS = 218;

export const SENATE_SEATS = 100;
export const SENATE_CONFIRMATION_THRESHOLD = 51;
export const SENATE_CONFIRMATION = {
  centrist: 68,
  hawk: 54,
  dove: 47,
} as const;

export interface CongressGroup {
  readonly id: GroupId;
  readonly name: string;
  readonly seats: number;
  readonly yes: number;
  readonly color: string;
  readonly wants: string;
}

export const groups = [
  { id: 'pro', name: 'Progressives', seats: 95, yes: 95, color: 'sky', wants: 'Bigger, greener' },
  { id: 'mod', name: 'Moderates', seats: 100, yes: 80, color: 'sage', wants: 'Money for home' },
  { id: 'cen', name: 'Centrists', seats: 45, yes: 20, color: 'gold', wants: 'Lower price tag' },
  { id: 'con', name: 'Conservatives', seats: 140, yes: 8, color: 'alert', wants: 'Cut the deficit' },
  { id: 'fre', name: 'Freedom Caucus', seats: 55, yes: 0, color: 'ink', wants: 'No new spending' },
] as const;
export type GroupId = (typeof groups)[number]['id'];

export interface MidtermShift {
  readonly houseShift: number;
  readonly senateShift: number;
}

/**
 * Midterm seat change derived from national approval (D3, VOT-05, GR-18, GR-19).
 * Losses are strictly bounded to prevent death spirals.
 */
export function calculateMidtermShift(approval: number): MidtermShift {
  const approvalDelta = approval - 50;
  const rawHouse = Math.round(approvalDelta * C.midtermApprovalSlope - C.midtermHistoricalPenalty);
  const houseShift = Math.max(-C.midtermMaxHouseLoss, Math.min(C.midtermMaxHouseGain, rawHouse));

  const rawSenate = Math.round(approvalDelta * 0.2 - 2);
  const senateShift = Math.max(-C.midtermMaxSenateLoss, Math.min(C.midtermMaxSenateGain, rawSenate));

  return { houseShift, senateShift };
}

/**
 * Derives dynamic House group seating based on midterm seat changes.
 * Conserves total seats at HOUSE_SEATS (435).
 */
export function groupsFor(houseDelta = 0): readonly CongressGroup[] {
  if (houseDelta === 0) return groups;

  const modShift = Math.round(houseDelta * 0.65);
  const cenShift = houseDelta - modShift;
  const conShift = -Math.round(houseDelta * 0.7);
  const freShift = -houseDelta - conShift;

  const res: CongressGroup[] = [
    { ...groups[0] },
    {
      ...groups[1],
      seats: Math.max(40, groups[1].seats + modShift),
      yes: Math.max(30, groups[1].yes + modShift),
    },
    {
      ...groups[2],
      seats: Math.max(20, groups[2].seats + cenShift),
      yes: Math.max(10, groups[2].yes + Math.round(cenShift * 0.5)),
    },
    {
      ...groups[3],
      seats: Math.max(80, groups[3].seats + conShift),
      yes: groups[3].yes,
    },
    {
      ...groups[4],
      seats: Math.max(30, groups[4].seats + freShift),
      yes: groups[4].yes,
    },
  ];

  const currentTotal = res.reduce((acc, g) => acc + g.seats, 0);
  const diff = HOUSE_SEATS - currentTotal;
  const targetGroup = res[3];
  if (diff !== 0 && targetGroup) {
    res[3] = { ...targetGroup, seats: targetGroup.seats + diff };
  }

  return res;
}

export const deals = [
  { id: 'mod', title: 'Deal with Moderates', detail: 'Road money for their states', cost: 20, gain: { mod: 12 } },
  { id: 'cen', title: 'Deal with Centrists', detail: 'Trim the price tag 10%', cost: 15, gain: { cen: 9 } },
  { id: 'spc', title: 'Speech in swing districts', detail: 'Pressure from home', cost: 10, gain: { cen: 4, con: 2 } },
] as const satisfies readonly { id: string; title: string; detail: string; cost: number; gain: Partial<Record<GroupId, number>> }[];
export type DealId = (typeof deals)[number]['id'];

export function tally(done: readonly DealId[], houseDelta = 0) {
  const activeGroups = groupsFor(houseDelta);
  const byGroup = {} as Record<GroupId, number>;
  let total = 0;
  for (const g of activeGroups) {
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
  return { passed, cloutBack: passed ? RULES.voteReward.value : Math.floor(spent / RULES.refundDivisor.value) };
}
