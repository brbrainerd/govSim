import { describe, expect, it } from 'vitest';
import { C } from '../engine/coefficients';
import { START } from '../engine/fixture';
import { TOTAL_TURNS } from '../engine/game';
import type { PartyId } from '../content/parties';
import { Session } from './session.svelte';

const play = (party: PartyId) => {
  const s = new Session(7, START, { party });
  s.pickPackage('Infrastructure push');
  s.makeDeal('mod');
  s.makeDeal('cen');
  s.makeDeal('spc');
  s.callVote();
  for (let i = 1; i < TOTAL_TURNS; i++) s.nextTurn();
  return s;
};

describe('Session options (FND-08)', () => {
  it('stores the party it was given', () => {
    expect(new Session(1, START, { party: 'R' }).options.party).toBe('R');
  });

  it('plays identically whichever party leads', () => {
    const d = play('D');
    const r = play('R');
    expect(d.history).toHaveLength(TOTAL_TURNS);
    expect(r.history).toHaveLength(TOTAL_TURNS);
    expect(r.history).toEqual(d.history);
    expect(r.autopilot).toEqual(d.autopilot);
  });
});

describe('Session preview equals the engine charge (FND-05)', () => {
  const income = (s: Session, shown: number) => {
    s.nextTurn();
    return shown + Math.round(s.current.approval / C.cloutPerApproval);
  };

  it('after deals and a called vote', () => {
    const s = new Session(7, START, { party: 'D' });
    s.pickPackage('Infrastructure push');
    for (const d of ['mod', 'cen', 'spc'] as const) s.makeDeal(d);
    s.callVote();
    const shown = s.clout;
    expect(income(s, shown)).toBe(s.current.clout);
  });

  it('after deals with no called vote: voted and charged at Next turn (A8)', () => {
    const s = new Session(7, START, { party: 'D' });
    s.makeDeal('mod');
    const shown = s.clout;
    expect(income(s, shown)).toBe(s.current.clout);
  });

  it('canDeal uses the engine cost function', () => {
    const s = new Session(7, START, { party: 'D' });
    expect(s.canDeal('mod')).toBe(true);
    s.makeDeal('mod');
    expect(s.canDeal('mod')).toBe(false);
    s.callVote();
    expect(s.canDeal('cen')).toBe(false);
  });
});
