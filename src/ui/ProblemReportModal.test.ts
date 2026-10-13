import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { Session } from '../app/session.svelte';
import { START } from '../engine/fixture';
import ProblemReportModal from './ProblemReportModal.svelte';

describe('ProblemReportModal component (REL-04, OBS-04)', () => {
  it('renders pre-copy reviewable diagnostic bundle with platform, turn, and run code', () => {
    const session = new Session(42, START, { party: 'D' });
    const { html } = render(ProblemReportModal, {
      props: {
        session,
        onClose: () => {},
      },
    });

    expect(html).toContain('data-testid="problem-modal"');
    expect(html).toContain('Diagnostic Problem Report');
    expect(html).toContain('REVIEW BEFORE COPYING:');
    expect(html).toContain('data-testid="diagnostic-pre"');
    expect(html).toContain('"app": "govSim"');
    expect(html).toContain('"version": "0.2.0"');
    expect(html).toContain('"seed": 42');
    expect(html).toContain('"party": "D"');
    expect(html).toContain('data-testid="copy-bundle-btn"');
    expect(html).toContain('COPY DIAGNOSTIC BUNDLE');
    expect(html).toContain('data-testid="github-issue-link"');
    expect(html).toContain('https://github.com/brbrainerd/govSim/issues/new');
  });

  it('guarantees zero network egress during bundle rendering (OBS-04)', () => {
    const fetchSpy = vi.fn();
    // @ts-ignore
    globalThis.fetch = fetchSpy;

    const session = new Session(42, START, { party: 'D' });
    render(ProblemReportModal, {
      props: {
        session,
        onClose: () => {},
      },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
