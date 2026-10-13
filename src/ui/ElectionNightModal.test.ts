import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { fromData, us } from '../data/us';
import {
  extractElectionReasons,
  resolveContingentElection,
  resolveReelection,
} from '../engine/election';
import { newGame } from '../engine/game';
import { calculateElectoralCollege, type ElectoralSummary } from '../engine/voters';
import ContingentElectionModal from './ContingentElectionModal.svelte';
import ElectionNightModal from './ElectionNightModal.svelte';
import ElectionResultCard from './ElectionResultCard.svelte';

describe('ElectionNightModal component (ELC-01..ELC-03)', () => {
  const game = newGame(42, fromData(us));
  const outcome = resolveReelection(game, 'D');
  const autopilotOutcome = resolveReelection(game, 'D');
  const reasons = extractElectionReasons(game, outcome, 'D');

  it('renders election night modal with live 270 tracker and broadcast ribbon', () => {
    const { html } = render(ElectionNightModal, {
      props: {
        outcome,
        autopilotOutcome,
        reasons,
        oncontinue: () => {},
        onretry: () => {},
      },
    });

    expect(html).toContain('data-testid="election-night-modal"');
    expect(html).toContain('PRESIDENTIAL ELECTION DECISION NIGHT');
    expect(html).toContain('data-testid="live-player-ev"');
    expect(html).toContain('data-testid="live-opponent-ev"');
    expect(html).toContain('270 TO WIN');
    expect(html).toContain('Skip to Final Result [Space]');
  });

  it('renders ElectionResultCard with certified result and attribution reasons', () => {
    const { html } = render(ElectionResultCard, {
      props: {
        outcome,
        autopilotOutcome,
        reasons,
        oncontinue: () => {},
        onretry: () => {},
      },
    });

    expect(html).toContain('data-testid="election-result-card"');
    expect(html).toContain('OFFICIAL CERTIFIED RESULT');
    expect(html).toContain('Autopilot (Doing Nothing):');
    expect(html).toContain('WHY THE ELECTION TURNED OUT THIS WAY');
    expect(html).toContain('data-testid="retry-turn16-btn"');
    expect(html).toContain('data-testid="election-continue-btn"');

    for (const r of reasons) {
      expect(html).toContain(r);
    }
  });

  it('renders ContingentElectionModal with 12th Amendment explanation and 50 state roll call', () => {
    const contingentResult = resolveContingentElection('D');
    const { html } = render(ContingentElectionModal, {
      props: {
        contingentResult,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="contingent-election-modal"');
    expect(html).toContain('12th Amendment House Contingent Election');
    expect(html).toContain('26 TO WIN');
    expect(html).toContain('STATE DELEGATION ROLL CALL (50 STATES)');
    expect(html).toContain('data-testid="contingent-close-btn"');

    // Verify presence of sample state chips
    expect(html).toContain('PA');
    expect(html).toContain('CA');
    expect(html).toContain('TX');
    expect(html).toContain('WY');
  });
});
