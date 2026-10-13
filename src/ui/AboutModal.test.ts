import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import AboutModal from './AboutModal.svelte';

describe('AboutModal component (REL-02)', () => {
  it('renders modal with mission, sourced model attribution, zero telemetry disclosure, and credits', () => {
    const { html } = render(AboutModal, {
      props: {
        onClose: () => {},
        onOpenReport: () => {},
      },
    });

    expect(html).toContain('data-testid="about-modal"');
    expect(html).toContain('About govSim');
    expect(html).toContain('Nonpartisan, Educational, Institutional Strategy Simulation');
    expect(html).toContain('Congressional Budget Office (CBO)');
    expect(html).toContain('ZERO TELEMETRY · ZERO TRACKING');
    expect(html).toContain('Atkinson Hyperlegible');
    expect(html).toContain('SIL Open Font License 1.1');
    expect(html).toContain('data-testid="about-report-btn"');
    expect(html).toContain('Report a Problem');
    expect(html).toContain('data-testid="about-github-link"');
    expect(html).toContain('https://github.com/brbrainerd/govSim');
    expect(html).toContain('data-testid="about-close-btn"');
    expect(html).toContain('CLOSE');
  });
});
