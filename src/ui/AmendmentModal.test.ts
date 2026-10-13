import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import AmendmentModal from './AmendmentModal.svelte';

describe('AmendmentModal component (REF-04)', () => {
  it('renders candidate constitutional amendments with 2/3 House and Senate thresholds', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(AmendmentModal, {
      props: {
        session,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="amendment-modal"');
    expect(html).toContain('Article V Constitutional Amendments');
    expect(html).toContain('2/3 House (290), 2/3 Senate (67), and 3/4 State Legislatures (38 of 50)');
    expect(html).toContain('data-testid="amendment-card-amendment_judicial_terms"');
    expect(html).toContain('data-testid="amendment-card-amendment_campaign_finance"');
    expect(html).toContain('data-testid="amendment-card-amendment_equal_rights"');
    expect(html).toContain('data-testid="amendment-card-amendment_balanced_budget"');
    expect(html).toContain('House (2/3 Needed)');
    expect(html).toContain('Senate (2/3 Needed)');
  });

  it('renders active amendment tracker when an amendment is proposed', () => {
    const session = new Session(1, START, { party: 'D' });
    session.history = [
      {
        ...session.current,
        activeAmendment: {
          id: 'amendment_campaign_finance',
          proposedTurn: 1,
          ratifiedStates: ['CA', 'NY', 'WA'],
          isRatified: false,
          isExpired: false,
        },
      },
    ];

    const { html } = render(AmendmentModal, {
      props: {
        session,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="active-amendment-tracker"');
    expect(html).toContain('PENDING STATE RATIFICATION');
    expect(html).toContain('3 / 38 states');
    expect(html).toContain('CA');
    expect(html).toContain('NY');
    expect(html).toContain('WA');
    expect(html).toContain('Lobby State Legislatures');
  });
});
