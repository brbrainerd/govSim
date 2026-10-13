import { describe, expect, it } from 'vitest';
import { fromData, us } from '../data/us';
import { newGame } from './game';
import { defaultEvilState } from './evil';
import { classifyKleptocratVerdict } from './evil-endgame';

describe('classifyKleptocratVerdict (UI-03)', () => {
  it('classifies convicted president as Disgraced Convict with 0 stash', () => {
    const state = {
      ...newGame(1, fromData(us)),
      evil: {
        ...defaultEvilState(),
        offshoreStashBn: 45.0,
        heat: 92,
        convicted: true,
        termEnded: true,
        articlesOfImpeachmentVoted: true,
        houseImpeachmentVotes: 230,
        senateConvictionVotes: 68,
      },
    };

    const verdict = classifyKleptocratVerdict({ state });
    expect(verdict.tier).toBe('Disgraced Convict');
    expect(verdict.isConvicted).toBe(true);
    expect(verdict.stashBn).toBe(0);
    expect(verdict.title).toBe('Disgraced & Forfeited');
    expect(verdict.summary).toContain('two-thirds Senate supermajority');
  });

  it('classifies unconvicted defeated president as Ousted Grifter with preserved stash', () => {
    const state = {
      ...newGame(1, fromData(us)),
      evil: {
        ...defaultEvilState(),
        offshoreStashBn: 32.5,
        heat: 55,
      },
    };

    const verdict = classifyKleptocratVerdict({ state, reelectionLost: true });
    expect(verdict.tier).toBe('Ousted Grifter');
    expect(verdict.isConvicted).toBe(false);
    expect(verdict.stashBn).toBe(32.5);
    expect(verdict.title).toContain('Electorally Ousted');
  });

  it('classifies full term survival with < 10B stash as Petty Grifter', () => {
    const state = {
      ...newGame(1, fromData(us)),
      evil: {
        ...defaultEvilState(),
        offshoreStashBn: 6.2,
        heat: 20,
      },
    };

    const verdict = classifyKleptocratVerdict({ state });
    expect(verdict.tier).toBe('Petty Grifter');
    expect(verdict.isConvicted).toBe(false);
    expect(verdict.stashBn).toBe(6.2);
  });

  it('classifies full term survival with 10B - 25B stash as Gilded Oligarch', () => {
    const state = {
      ...newGame(1, fromData(us)),
      evil: {
        ...defaultEvilState(),
        offshoreStashBn: 18.0,
        heat: 45,
      },
    };

    const verdict = classifyKleptocratVerdict({ state });
    expect(verdict.tier).toBe('Gilded Oligarch');
    expect(verdict.stashBn).toBe(18.0);
  });

  it('classifies full term survival with 25B - 50B stash as Sovereign Plunderer', () => {
    const state = {
      ...newGame(1, fromData(us)),
      evil: {
        ...defaultEvilState(),
        offshoreStashBn: 35.0,
        heat: 50,
      },
    };

    const verdict = classifyKleptocratVerdict({ state });
    expect(verdict.tier).toBe('Sovereign Plunderer');
    expect(verdict.stashBn).toBe(35.0);
  });

  it('classifies full term survival with >= 50B stash as Transnational Kleptocrat', () => {
    const state = {
      ...newGame(1, fromData(us)),
      evil: {
        ...defaultEvilState(),
        offshoreStashBn: 65.5,
        heat: 30,
      },
    };

    const verdict = classifyKleptocratVerdict({ state });
    expect(verdict.tier).toBe('Transnational Kleptocrat');
    expect(verdict.stashBn).toBe(65.5);
  });
});

