import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { getMyth } from '../content/myths';
import MythModal from './MythModal.svelte';

const gasMyth = getMyth('gas_prices')!;

describe('MythModal (MYTH-03, MYTH-04, PIVOT-02)', () => {
  it('renders prediction challenge when isFirstView is true', () => {
    const { html } = render(MythModal, {
      props: {
        myth: gasMyth,
        isFirstView: true,
        onClose: () => {},
        onGotIt: () => {},
      },
    });

    expect(html).toContain('data-testid="myth-challenge"');
    expect(html).toContain(gasMyth.predictionPrompt.question);
    expect(html).toContain('data-testid="myth-pred-opt-0"');
    expect(html).toContain('data-testid="myth-pred-opt-1"');
    expect(html).toContain('data-testid="myth-skip-btn"');
    expect(html).toContain('Skip straight to reality');
    expect(html).toContain('CIVIC CLAIM');
  });

  it('renders full institutional reality and tactical pivot buttons when already viewed', () => {
    const { html } = render(MythModal, {
      props: {
        myth: gasMyth,
        isFirstView: false,
        onClose: () => {},
        onGotIt: () => {},
      },
    });

    expect(html).not.toContain('data-testid="myth-challenge"');
    expect(html).toContain('MYTH BUSTED');
    expect(html).toContain('REALITY');
    expect(html).toContain(gasMyth.realitySummary);
    expect(html).toContain('data-testid="lever-pivot-btn"');
    expect(html).toContain('Energy permits');
    expect(html).toContain('Release oil reserve');
  });

  it('suppresses stamp slam class when calmMode is active', () => {
    const { html } = render(MythModal, {
      props: {
        myth: gasMyth,
        isFirstView: false,
        calmMode: true,
        onClose: () => {},
        onGotIt: () => {},
      },
    });

    expect(html).not.toContain('slam');
  });

  it('renders Debunk and Spin buttons when isFirstView is true and onSpin is provided (SPIN-01, SPIN-02)', () => {
    const { html } = render(MythModal, {
      props: {
        myth: gasMyth,
        isFirstView: true,
        onClose: () => {},
        onGotIt: () => {},
        onSpin: () => {},
      },
    });

    expect(html).toContain('data-testid="spin-myth-btn"');
    expect(html).toContain('SPIN THIS MYTH');
    expect(html).toContain('data-testid="debunk-myth-btn"');
    expect(html).toContain('DEBUNK MYTH (+5 CLOUT)');
  });
});
