import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { DISTRICT_CHIPS, STATE_PATHS } from '../../data/us-states-paths';
import type { StateVoterState } from '../../engine/voters';
import USMap from './USMap.svelte';

function makeMockVoterState(code: string, leaning: StateVoterState['leaning'], isSwing = false, isTippingPoint = false): StateVoterState {
  return {
    code,
    name: STATE_PATHS[code]?.name ?? code,
    electoralVotes: 10,
    baselineMargin: 2.5,
    currentMargin: 3.1,
    supportPct: 51.5,
    supportDelta: 1.5,
    leaning,
    winner: leaning.includes('them') ? 'them' : 'you',
    isSwing,
    isTippingPoint,
    reasons: ['Strong state economy', 'National approval'],
  };
}

describe('USMap component (VOT-01, GR-23)', () => {
  it('has pre-projected path definitions for all 50 states + DC', () => {
    const codes = Object.keys(STATE_PATHS);
    expect(codes).toHaveLength(51);
    expect(codes).toContain('AK');
    expect(codes).toContain('HI');
    expect(codes).toContain('DC');

    for (const code of codes) {
      const p = STATE_PATHS[code]!;
      expect(p.d.length).toBeGreaterThan(20);
      expect(p.center[0]).toBeGreaterThan(0);
      expect(p.center[1]).toBeGreaterThan(0);
    }
  });

  it('renders all 51 state paths, district chips, and defs patterns', () => {
    const mockStates: Record<string, StateVoterState> = {};
    for (const code of Object.keys(STATE_PATHS)) {
      mockStates[code] = makeMockVoterState(code, 'safe-you');
    }

    const { html } = render(USMap, {
      props: {
        states: mockStates,
        districts: {},
        selectedCode: 'PA',
      },
    });

    // Contains SVG defs for pattern encoding (GR-23)
    expect(html).toContain('id="pattern-hatch"');
    expect(html).toContain('id="pattern-dots"');

    // Contains all state paths
    for (const code of Object.keys(STATE_PATHS)) {
      expect(html).toContain(`id="state-${code}"`);
      expect(html).toContain(`data-map-code="${code}"`);
    }

    // Contains all district chips
    for (const chip of DISTRICT_CHIPS) {
      expect(html).toContain(`${chip.id} (${chip.electoralVotes} EV)`);
    }

    // Selected state indicator
    expect(html).toContain('selected-glow');
  });

  it('encodes opponent states with hatching and tossup with dot stipple (GR-23)', () => {
    const mockStates: Record<string, StateVoterState> = {
      CA: makeMockVoterState('CA', 'safe-you'),
      TX: makeMockVoterState('TX', 'safe-them'),
      PA: makeMockVoterState('PA', 'tossup', true, true),
    };

    const { html } = render(USMap, {
      props: {
        states: mockStates,
        districts: {},
        selectedCode: null,
      },
    });

    // Check pattern overlays
    expect(html).toContain('fill="url(#pattern-hatch)"');
    expect(html).toContain('fill="url(#pattern-dots)"');

    // Tipping point star marker is rendered for PA
    expect(html).toContain('class="tipping-point-marker"');
    expect(html).toContain('★');
  });

  it('provides ARIA attributes with state name, EV, support, and leaning (VOT-01)', () => {
    const mockStates: Record<string, StateVoterState> = {
      PA: makeMockVoterState('PA', 'lean-you', true, true),
    };

    const { html } = render(USMap, {
      props: {
        states: mockStates,
        districts: {},
        selectedCode: 'PA',
      },
    });

    // Should include comprehensive aria-label on the interactive element
    expect(html).toContain('aria-label="Pennsylvania, 10 electoral votes, 51.5% support, lean you, Swing state, Tipping-point state"');
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-pressed="true"');
  });
});
