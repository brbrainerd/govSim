// Dynamic Oval Office briefing generator (EVT-07, LEARN-03, ADVISOR-01, OBS-05).
// Evaluates active crises, impending legislative deadlines, and macro conditions.
// All copy is strictly nonpartisan, plain language, reading grade <= 9.0.

import type { ScreenId } from '../app/screens';
import type { PackageName } from '../engine/budget';
import { getImminentDeadlines } from '../engine/deadlines';
import type { GameState } from '../engine/game';

export interface AdvisorPlay {
  readonly pack?: PackageName;
  readonly autoWhip?: boolean;
  readonly sendToCongress?: boolean;
}

export interface Suggestion {
  readonly title: string;
  readonly cta: string;
  readonly target: ScreenId | null;
  readonly mythId?: string;
  readonly openCrisis?: boolean;
  readonly play?: AdvisorPlay;
}

export interface BriefingInfo {
  readonly bubble: string;
  readonly thisTurn: {
    readonly title: string;
    readonly detail: string;
  };
  readonly suggestions: readonly Suggestion[];
}

export interface SessionContext {
  readonly current: GameState;
  readonly previous?: GameState;
  readonly isEvilMode?: boolean;
}

/**
 * Generates dynamic Oval Office briefing text, thisTurn alert, and suggestions (EVT-07, LEARN-03, ADVISOR-01).
 */
export function generateBriefing(session: SessionContext): BriefingInfo {
  const current = session.current;
  const deadlines = getImminentDeadlines(current.turn, current);
  const activeCrisis = current.activeCrisis;

  // 1. Active breaking crisis takes top priority
  if (activeCrisis) {
    return {
      bubble: 'An urgent crisis needs your response right now.',
      thisTurn: {
        title: activeCrisis.name,
        detail: 'Relief teams are ready and waiting for your call.',
      },
      suggestions: [
        { title: 'Respond to crisis', cta: 'Decide now', target: null, openCrisis: true },
        { title: 'Check state of economy', cta: 'Open Economy', target: 'economy' },
        { title: 'Build House coalition', cta: 'Open Congress', target: 'congress', play: { autoWhip: true } },
      ],
    };
  }

  // 2. Satirical Evil Mode kleptocracy priorities
  if (session.isEvilMode) {
    const evil = current.evil;
    const heat = evil?.heat ?? 0;
    if (heat >= 80) {
      return {
        bubble: 'Impeachment looms. House leaders want you out.',
        thisTurn: {
          title: 'Impeachment threat',
          detail: 'Public outrage is at peak levels. Purge watchdogs or face a vote.',
        },
        suggestions: [
          { title: 'Suppress watchdogs', cta: 'Open Powers', target: 'powers' },
          { title: 'Rally House votes', cta: 'Open Congress', target: 'congress', play: { autoWhip: true } },
          { title: 'Review your loot', cta: 'Open Economy', target: 'economy' },
        ],
      };
    }
    if (evil?.specialCounselAppointed || heat >= 60) {
      return {
        bubble: 'A special counsel is digging in. Clout is draining.',
        thisTurn: {
          title: 'Special counsel active',
          detail: 'Probes drain 25 clout each turn. Deflect or stop them.',
        },
        suggestions: [
          { title: 'Fire investigators', cta: 'Open Powers', target: 'powers' },
          { title: 'Sell exemptions', cta: 'Open Powers', target: 'powers' },
          { title: 'Track trade deals', cta: 'Open Trade', target: 'trade' },
        ],
      };
    }
    if (heat >= 35) {
      return {
        bubble: 'Watchdogs are snooping. Secret deals are leaking.',
        thisTurn: {
          title: 'Scandal simmering',
          detail: 'Leaks are driving up heat. Choose your next moves with care.',
        },
        suggestions: [
          { title: 'Enact corrupt levers', cta: 'Open Powers', target: 'powers' },
          { title: 'Auction public assets', cta: 'Open Powers', target: 'powers' },
          { title: 'Set budget outlays', cta: 'Open Budget', target: 'budget', play: { pack: 'Tax cut' } },
        ],
      };
    }
    return {
      bubble: 'Who can we squeeze this turn? The vault is open.',
      thisTurn: {
        title: 'Corrupt deals underway',
        detail: 'Send public cash to secret bank vaults.',
      },
      suggestions: [
        { title: 'Award no-bid contracts', cta: 'Open Powers', target: 'powers' },
        { title: 'Auction public assets', cta: 'Open Powers', target: 'powers' },
        { title: 'Review budget funds', cta: 'Open Budget', target: 'budget', play: { pack: 'Tax cut' } },
      ],
    };
  }

  // 2. Imminent legislative deadlines (<= 2 turns)
  if (deadlines.length > 0) {
    const top = deadlines[0]!;
    if (top.type === 'shutdown') {
      const turnsText = top.turnsRemaining === 1 ? '1 turn' : `${top.turnsRemaining} turns`;
      return {
        bubble: 'Congress is nearing a funding deadline. We need a vote.',
        thisTurn: {
          title: `Government funding due in ${turnsText}`,
          detail: 'Pass a federal budget before funds run out.',
        },
        suggestions: [
          { title: 'Pass federal budget', cta: 'Open Congress', target: 'congress', play: { autoWhip: true } },
          { title: 'Set budget priorities', cta: 'Open Budget', target: 'budget', play: { pack: 'Keep as is' } },
          { title: 'Myth? Shutdown costs', cta: 'Find out', target: null, mythId: 'foreign_aid_deficit' },
        ],
      };
    }

    if (top.type === 'debt_limit') {
      const turnsText = top.turnsRemaining === 1 ? '1 turn' : `${top.turnsRemaining} turns`;
      return {
        bubble: 'The national debt limit is near. Congress must act.',
        thisTurn: {
          title: `Debt limit due in ${turnsText}`,
          detail: 'Raise the debt limit to avoid a default.',
        },
        suggestions: [
          { title: 'Raise debt limit', cta: 'Open Congress', target: 'congress', play: { autoWhip: true } },
          { title: 'Review fiscal outlays', cta: 'Open Budget', target: 'budget', play: { pack: 'Balance the budget' } },
          { title: 'Myth? The debt ceiling', cta: 'Find out', target: null, mythId: 'debt_ceiling_default' },
        ],
      };
    }
  }

  // 3. Post-crisis disaster recovery / approval rally
  const hasActiveRally = current.modifiers.some((m) => m.tag === 'event' && m.channel === 'approval');
  if (hasActiveRally) {
    return {
      bubble: 'Public support is steady after your quick disaster relief.',
      thisTurn: {
        title: 'Disaster recovery underway',
        detail: 'Federal aid is helping damaged towns rebuild and repair roads.',
      },
      suggestions: [
        { title: 'Track economic recovery', cta: 'Open Economy', target: 'economy' },
        { title: 'Build coalition for reform', cta: 'Open Congress', target: 'congress', play: { autoWhip: true } },
        { title: 'Myth? Disaster relief waste', cta: 'Find out', target: null, mythId: 'rule_by_decree' },
      ],
    };
  }

  // 4. Macroeconomic strain: high inflation
  if (current.econ.inflation >= 3.5) {
    return {
      bubble: 'Consumer prices are high. Families are feeling the squeeze.',
      thisTurn: {
        title: 'High living costs',
        detail: 'Prices are up and hitting family budgets.',
      },
      suggestions: [
        { title: 'Check price pressures', cta: 'Open Economy', target: 'economy' },
        { title: 'Trim federal spending', cta: 'Open Budget', target: 'budget', play: { pack: 'Balance the budget' } },
        { title: 'Myth? Lower gas prices', cta: 'Find out', target: null, mythId: 'gas_prices' },
      ],
    };
  }

  // 5. Macroeconomic strain: softening jobs
  if (current.econ.unemployment >= 4.8) {
    return {
      bubble: 'Job growth has slowed down. Businesses are hiring less.',
      thisTurn: {
        title: 'Cooling job market',
        detail: 'Hiring has softened and more workers are seeking jobs.',
      },
      suggestions: [
        { title: 'Review employment trends', cta: 'Open Economy', target: 'economy' },
        { title: 'Fund job training programs', cta: 'Open Budget', target: 'budget', play: { pack: 'Infrastructure push' } },
        { title: 'Myth? Presidents create jobs', cta: 'Find out', target: null, mythId: 'presidential_jobs' },
      ],
    };
  }

  // 6. Default steady conditions
  return {
    bubble: 'The economy is steady. Congress awaits your budget plan.',
    thisTurn: {
      title: 'Pass a federal budget',
      detail: 'Work with leaders in Congress to fund your plans.',
    },
    suggestions: [
      { title: 'Pass a budget', cta: 'Open Budget', target: 'budget', play: { pack: 'Infrastructure push' } },
      { title: 'Win over Moderates', cta: 'Open Congress', target: 'congress', play: { autoWhip: true } },
      { title: 'Myth? Lower gas prices', cta: 'Find out', target: null, mythId: 'gas_prices' },
    ],
  };
}
