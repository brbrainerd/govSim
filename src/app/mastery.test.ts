import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import {
  evaluateRunMastery,
  formatMasteryStars,
  loadMastery,
  recordRunMastery,
} from './mastery';
import type { SimpleStorage } from './save';
import NewGame from '../screens/NewGame.svelte';
import EndScreen from '../screens/EndScreen.svelte';
import { Session } from './session.svelte';
import { fromData, us } from '../data/us';

function createMemoryStorage(): SimpleStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

describe('Silver & Gold Mastery Stars and Heist Syndicate Breakdown (ARCH-02, HEIST-02)', () => {
  it('evaluates Silver and Gold mastery criteria for Standard and Evil Mode runs', () => {
    expect(
      evaluateRunMastery({
        isEvilMode: false,
        convicted: false,
        reelectionWon: false,
        scoreVsAutopilot: 8.0,
        offshoreStashBn: 0,
      }),
    ).toBe('none');

    expect(
      evaluateRunMastery({
        isEvilMode: false,
        convicted: false,
        reelectionWon: true,
        scoreVsAutopilot: 2.5,
        offshoreStashBn: 0,
      }),
    ).toBe('silver');

    expect(
      evaluateRunMastery({
        isEvilMode: false,
        convicted: false,
        reelectionWon: true,
        scoreVsAutopilot: 5.5,
        offshoreStashBn: 0,
      }),
    ).toBe('gold');

    expect(
      evaluateRunMastery({
        isEvilMode: true,
        convicted: false,
        reelectionWon: false,
        scoreVsAutopilot: -4.0,
        offshoreStashBn: 22.0,
      }),
    ).toBe('gold');

    expect(
      evaluateRunMastery({
        isEvilMode: true,
        convicted: true,
        reelectionWon: false,
        scoreVsAutopilot: -4.0,
        offshoreStashBn: 40.0,
      }),
    ).toBe('none');
  });

  it('persists mastery upgrades without downgrading existing Gold mastery', () => {
    const store = createMemoryStorage();
    const res1 = recordRunMastery(
      {
        archetype: 'dealmaker',
        scenario: 'stagflation_shock',
        isEvilMode: false,
        convicted: false,
        reelectionWon: true,
        scoreVsAutopilot: 6.2,
        offshoreStashBn: 0,
      },
      store,
    );
    expect(res1.earnedTier).toBe('gold');
    expect(loadMastery(store).archetypes.dealmaker).toBe('gold');
    expect(loadMastery(store).scenarios.stagflation_shock).toBe('gold');

    // Subsequent silver run does not downgrade gold
    recordRunMastery(
      {
        archetype: 'dealmaker',
        scenario: 'stagflation_shock',
        isEvilMode: false,
        convicted: false,
        reelectionWon: true,
        scoreVsAutopilot: 1.5,
        offshoreStashBn: 0,
      },
      store,
    );
    expect(loadMastery(store).archetypes.dealmaker).toBe('gold');
    expect(formatMasteryStars('gold')).toBe('★★');
  });

  it('renders Archetype selector and Mastery Stars on NewGame and Syndicate summary on EndScreen', () => {
    const ng = render(NewGame, {
      props: {
        onStart: () => {},
      },
    });
    expect(ng.html).toContain('data-testid="archetype-selector"');
    expect(ng.html).toContain('data-testid="archetype-card-dealmaker"');
    expect(ng.html).toContain('data-testid="mastery-stars-dealmaker"');
    expect(ng.html).toContain('data-testid="scenario-mastery-standard_2026"');

    const evilSession = new Session(
      99,
      fromData(us),
      { party: 'R', evilMode: true, archetype: 'insider' },
      { skipAutosave: true },
    );
    const end = render(EndScreen, {
      props: {
        session: evilSession,
      },
    });
    expect(end.html).toContain('data-testid="endscreen-mastery-badge"');
    expect(end.html).toContain('data-testid="end-archetype-badge"');
  });
});
