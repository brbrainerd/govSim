import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ImpeachmentModal from './ImpeachmentModal.svelte';
import type { EvilState } from '../engine/evil';

describe('ImpeachmentModal component (IMPEACH-02, IMPEACH-03)', () => {
  it('renders conviction verdict when Senate votes reach supermajority', () => {
    const convictedEvil: EvilState = {
      offshoreStashBn: 0,
      heat: 96,
      investigationsActive: true,
      specialCounselAppointed: true,
      articlesOfImpeachmentVoted: true,
      convicted: true,
      houseImpeachmentVotes: 236,
      senateConvictionVotes: 72,
      termEnded: true,
    };

    const { html } = render(ImpeachmentModal, {
      props: {
        evilState: convictedEvil,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="impeachment-modal"');
    expect(html).toContain('CONSTITUTIONAL REMOVAL');
    expect(html).toContain('Convicted by the Senate');
    expect(html).toContain('236');
    expect(html).toContain('Yeas');
    expect(html).toContain('72');
    expect(html).toContain('Guilty');
    expect(html).toContain('EXECUTIVE POWERS STRIPPED');
    expect(html).toContain('All offshore accounts frozen by federal decree ($0.0B recovered)');
    expect(html).toContain('data-testid="impeachment-term-over-btn"');
    expect(html).toContain('Accept Verdict · Term Over');
  });

  it('renders acquittal verdict when Senate votes fail to reach supermajority', () => {
    const acquittedEvil: EvilState = {
      offshoreStashBn: 25.0,
      heat: 84,
      investigationsActive: true,
      specialCounselAppointed: true,
      articlesOfImpeachmentVoted: true,
      convicted: false,
      houseImpeachmentVotes: 221,
      senateConvictionVotes: 54,
      termEnded: false,
    };

    const { html } = render(ImpeachmentModal, {
      props: {
        evilState: acquittedEvil,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="impeachment-modal"');
    expect(html).toContain('SENATE TRIAL ACQUITTAL');
    expect(html).toContain('Acquitted by the Senate');
    expect(html).toContain('221');
    expect(html).toContain('54');
    expect(html).toContain('Not Guilty');
    expect(html).toContain('EXECUTIVE AUTHORITY PRESERVED');
    expect(html).toContain('Acquitted by narrow minority: Heat burns hot but power remains intact');
    expect(html).toContain('data-testid="impeachment-continue-btn"');
    expect(html).toContain('Return to Oval Office');
  });
});
