import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import FilibusterModal from './FilibusterModal.svelte';

describe('FilibusterModal component (REF-01)', () => {
  it('renders filibuster modal with all four procedural rules and thresholds', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(FilibusterModal, {
      props: {
        session,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="filibuster-modal"');
    expect(html).toContain('Senate Filibuster &amp; Cloture Rules');
    expect(html).toContain('data-testid="filibuster-rule-sixty_vote"');
    expect(html).toContain('data-testid="filibuster-rule-talking_filibuster"');
    expect(html).toContain('data-testid="filibuster-rule-fifty_five_vote"');
    expect(html).toContain('data-testid="filibuster-rule-simple_majority"');
    expect(html).toContain('Current Law');
    expect(html).toContain('60 Votes');
    expect(html).toContain('55 Votes');
    expect(html).toContain('51 Votes');
  });
});
