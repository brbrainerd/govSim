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

describe('review fixes (01-REVIEW WR-02, WR-03, WR-06)', () => {
  it('"Keep as is" keeps the policy in force; a package changes only its own levers', () => {
    const s = new Session(7, START, { party: 'D' });
    s.pickPackage('Infrastructure push');
    s.makeDeal('mod'); s.makeDeal('cen'); s.makeDeal('spc');
    s.callVote();
    s.nextTurn();
    const enacted = s.current.policy;
    s.pickPackage('Keep as is');
    expect(s.draft.budget).toEqual(enacted);
    s.pickPackage('Tax cut');
    expect(s.draft.budget.rds).toBe(enacted.rds);
  });

  it('a budget sent to Congress with no deals is still voted at Next turn', () => {
    const s = new Session(7, START, { party: 'D' });
    s.pickPackage('Tax cut');
    s.sendToCongress();
    expect(s.bill).not.toBeNull();
  });

  it('every action is a no-op once the term is over', () => {
    const s = new Session(7, START, { party: 'D' });
    for (let i = 1; i < TOTAL_TURNS; i++) s.nextTurn();
    expect(s.over).toBe(true);
    const before = JSON.parse(JSON.stringify(s.draft));
    s.pickPackage('Tax cut'); s.setLever('inc', 30); s.makeDeal('mod'); s.sendToCongress(); s.callVote();
    expect(JSON.parse(JSON.stringify(s.draft))).toEqual(before);
    expect(s.clout).toBe(s.current.clout);
  });
});
