import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import JudicialReformModal from './JudicialReformModal.svelte';

describe('JudicialReformModal component (REF-02)', () => {
  it('renders judicial reform options with bench composition and tradeoffs', () => {
    const session = new Session(1, START, { party: 'D' });
    const { html } = render(JudicialReformModal, {
      props: {
        session,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="judicial-reform-modal"');
    expect(html).toContain('Supreme Court &amp; Judicial Reform');
    expect(html).toContain('Current Bench: 6 Conservative · 3 Liberal');
    expect(html).toContain('data-testid="judicial-card-scotus_term_limits"');
    expect(html).toContain('data-testid="judicial-card-statutory_ethics_code"');
    expect(html).toContain('data-testid="judicial-card-court_expansion"');
    expect(html).toContain('18-Year Supreme Court Term Limits');
    expect(html).toContain('Statutory Judicial Code of Conduct');
    expect(html).toContain('Judiciary Act Bench Expansion (+2 Seats)');
  });
});
