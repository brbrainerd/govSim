// Single source of truth for screens and navigation (design.md §7d, §10).
// The rail, routing and unlock rules are all derived from this list.
import type { IconName } from '../design/icons';

export const groups = [
  { id: 'home', label: 'Home' },
  { id: 'see', label: 'See' },
  { id: 'act', label: 'Act' },
] as const;

export type GroupId = (typeof groups)[number]['id'];

export const screens = [
  { id: 'oval', label: 'Oval Office', icon: 'star', group: 'home', unlockTurn: 1, question: 'What needs you this turn?' },
  { id: 'economy', label: 'Economy', icon: 'trend', group: 'see', unlockTurn: 1, question: 'How is the economy doing?' },
  { id: 'voters', label: 'Voters', icon: 'users', group: 'see', unlockTurn: 3, question: 'Who supports you?' },
  { id: 'budget', label: 'Budget', icon: 'money', group: 'act', unlockTurn: 1, question: 'How should we tax and spend?' },
  { id: 'congress', label: 'Congress', icon: 'capitol', group: 'act', unlockTurn: 1, question: 'Can we pass the bill?' },
  { id: 'powers', label: 'Your Powers', icon: 'pen', group: 'act', unlockTurn: 2, question: 'What can you do without Congress?' },
  { id: 'trade', label: 'Trade & Tariffs', icon: 'globe', group: 'act', unlockTurn: 2, question: 'How should America trade with the world?' },
] as const satisfies readonly { id: string; label: string; icon: IconName; group: GroupId; unlockTurn: number; question: string }[];

export type Screen = (typeof screens)[number];
export type ScreenId = Screen['id'];

export const screenById = (id: ScreenId): Screen => screens.find((s) => s.id === id)!;

export function navFor(turn: number, unlockAll = false, isEvilMode = false) {
  return groups.map((g) => ({
    ...g,
    screens: screens
      .filter((s) => s.group === g.id)
      .map((s) => {
        const locked = !unlockAll && (isEvilMode && s.id === 'powers' ? false : turn < s.unlockTurn);
        const newlyUnlocked = !unlockAll && s.unlockTurn > 1 && turn === s.unlockTurn;
        return {
          ...s,
          locked,
          newlyUnlocked,
        };
      }),
  }));
}

export function year1GuideFor(turn: number): { step: string; detail: string } | null {
  if (turn === 1) {
    return {
      step: 'Year 1 · Step 1 of 3',
      detail: 'Draft your first Budget, then whip 218 votes in Congress.',
    };
  }
  if (turn === 2) {
    return {
      step: 'Year 1 · Step 2 of 3',
      detail: 'Unlocked: Your Powers & Trade. Issue an Executive Order or adjust tariffs.',
    };
  }
  if (turn === 3) {
    return {
      step: 'Year 1 · Step 3 of 3',
      detail: 'Unlocked: Voters map. Check your 270 Electoral College path before Year 2.',
    };
  }
  return null;
}
