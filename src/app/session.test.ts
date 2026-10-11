import { describe, expect, it } from 'vitest';
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
