// Single source of truth for screens and navigation (design.md §7d, §10).
// The rail, routing and unlock rules are all derived from this list.

export const groups = [
  { id: 'home', label: 'Home' },
  { id: 'see', label: 'See' },
  { id: 'act', label: 'Act' },
] as const;

export type GroupId = (typeof groups)[number]['id'];

export const screens = [
  { id: 'oval', label: 'Oval Office', group: 'home', unlockTurn: 1, question: 'What needs you this turn?' },
  { id: 'economy', label: 'Economy', group: 'see', unlockTurn: 1, question: 'How is the economy doing?' },
  { id: 'voters', label: 'Voters', group: 'see', unlockTurn: 4, question: 'Who supports you?' },
  { id: 'budget', label: 'Budget', group: 'act', unlockTurn: 1, question: 'How should we tax and spend?' },
  { id: 'congress', label: 'Congress', group: 'act', unlockTurn: 2, question: 'Can we pass it?' },
  { id: 'powers', label: 'Your Powers', group: 'act', unlockTurn: 3, question: 'What can you do without Congress?' },
] as const satisfies readonly { id: string; label: string; group: GroupId; unlockTurn: number; question: string }[];

export type Screen = (typeof screens)[number];
export type ScreenId = Screen['id'];

export const screenById = (id: ScreenId): Screen => screens.find((s) => s.id === id)!;

/** Rail model: groups in fixed order, each with its screens and lock state for this turn. */
export function navFor(turn: number, unlockAll = false) {
  return groups.map((g) => ({
    ...g,
    screens: screens
      .filter((s) => s.group === g.id)
      .map((s) => ({ ...s, locked: !unlockAll && turn < s.unlockTurn })),
  }));
}
