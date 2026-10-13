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

describe('Session persistence and save restore (OBS-01, OBS-02)', () => {
  it('records decision history in inputs and restores via fromSave', async () => {
    const s = new Session(101, START, { party: 'D' });
    expect(s.inputs).toEqual([]);

    // Turn 1
    s.pickPackage('Infrastructure push');
    s.makeDeal('mod');
    s.callVote();
    s.nextTurn();

    // Turn 2
    s.nextTurn();

    // Turn 3
    s.setLever('bus', 28);
    s.sendToCongress();
    s.nextTurn();

    expect(s.inputs).toHaveLength(3);
    expect(s.history).toHaveLength(4);
    expect(s.current.turn).toBe(4);

    const { parseSave, serializeSave } = await import('./save');
    const json = serializeSave(s);
    const save = parseSave(json);

    const restored = Session.fromSave(save);
    expect(restored.current.turn).toBe(4);
    expect(restored.inputs).toEqual(s.inputs);
    expect(restored.history).toEqual(s.history);
    expect(restored.autopilot).toEqual(s.autopilot);
  });

  it('drafts and commits presidential power actions (PWR-01, PWR-06)', () => {
    const s = new Session(42, START, { party: 'D' });
    const initialClout = s.clout;

    // View a civics myth card
    s.viewMythCard('gas_prices');
    expect(s.draft.viewMyth).toBe('gas_prices');
    expect(s.clout).toBe(initialClout + 5);

    // Sign an executive order
    s.toggleSignOrder('eo_hiring_freeze');
    expect(s.draft.signedOrders).toContain('eo_hiring_freeze');
    expect(s.clout).toBe(initialClout + 5 - 15);

    // Turn resolution commits powers
    s.nextTurn();
    expect(s.current.activeOrders).toContain('eo_hiring_freeze');
    expect(s.current.viewedMyths).toContain('gas_prices');

    // Revoke the order in the next turn
    s.toggleSignOrder('eo_hiring_freeze');
    expect(s.draft.revokedOrders).toContain('eo_hiring_freeze');
    s.nextTurn();
    expect(s.current.activeOrders).not.toContain('eo_hiring_freeze');
  });
});

describe('Session reelection and end of term (ELC-01, ELC-03, ELC-04)', () => {
  it('triggers election outcome at turn 16 and snapshots state for retry', () => {
    const s = new Session(42, START, { party: 'D' });
    for (let i = 1; i < 16; i++) s.nextTurn();
    expect(s.current.turn).toBe(16);
    expect(s.turn16Snapshot).toBeDefined();
    expect(s.turn16Snapshot?.turn).toBe(16);

    // Advance through election
    s.nextTurn();
    expect(s.showingElectionNight).toBe(true);
    expect(s.activeElectionOutcome).toBeDefined();
    expect(s.activeAutopilotElectionOutcome).toBeDefined();
    expect(s.electionReasons.length).toBeGreaterThan(0);

    // Can retry turn 16
    s.retryTurn16();
    expect(s.current.turn).toBe(16);
    expect(s.showingElectionNight).toBe(false);
    expect(s.activeElectionOutcome).toBeNull();
  });

  it('finalizes term on loss via continueAfterElection', () => {
    const s = new Session(7, START, { party: 'D' });
    for (let i = 1; i < 16; i++) s.nextTurn();
    s.nextTurn();
    expect(s.showingElectionNight).toBe(true);
    expect(s.reelectionWon).toBe(false);

    s.continueAfterElection();
    expect(s.showingElectionNight).toBe(false);
    expect(s.termEnded).toBe(true);
    expect(s.current.turn).toBe(16);
    expect(s.over).toBe(true);
  });

  it('tracks unlocked and newly unlocked badges across turns (RPT-03)', () => {
    const s = new Session(7, START, { party: 'D' });
    expect(s.unlockedBadges).toBeDefined();
    expect(Array.isArray(s.unlockedBadges)).toBe(true);

    // Initial state has some badges based on start
    const initialCount = s.unlockedBadges.length;

    // Advance turn
    s.nextTurn();
    expect(Array.isArray(s.newlyUnlockedBadges)).toBe(true);
    expect(s.unlockedBadges.length).toBeGreaterThanOrEqual(initialCount);
  });
});

describe('Session social policy drafting (SOC-01..04)', () => {
  it('allows drafting, resetting, and enacting social policies', () => {
    const s = new Session(7, START, { party: 'D' });
    expect(s.socialDraft).toBeDefined();
    expect(s.socialDraft.aca).toBe(100);

    // Modify a lever
    s.setSocialLever('aca', 120);
    expect(s.socialDraft.aca).toBe(120);

    // Reset draft
    s.resetSocialDraft();
    expect(s.socialDraft.aca).toBe(100);

    // Draft compromise and call vote
    s.setSocialLever('cln', 120);
    s.setSocialLever('fos', 120);
    s.makeDeal('mod');
    s.makeDeal('cen');
    s.enactSocial();
    expect(s.bill).not.toBeNull();
    expect(s.bill?.social?.cln).toBe(120);
    expect(s.preview?.valid).toBe(true);

    // Advance turn and verify enactment
    s.nextTurn();
    expect(s.current.socialPolicy?.cln).toBe(120);
    expect(s.current.socialPolicy?.fos).toBe(120);
    expect(s.socialDraft.cln).toBe(120);
  });
});

describe('Session household persona and impact (HOU-01, HOU-02)', () => {
  it('initializes with default persona and updates dynamically with draft changes', () => {
    const s = new Session(7, START, { party: 'D' });
    expect(s.selectedHouseholdPersona.id).toBe('rust_belt_manufacturing');
    expect(s.householdImpact.netMonthlyDelta).toBe(0);

    // Draft a tariff increase -> groceries increase, net impact drops
    s.setLever('tar', 25);
    expect(s.householdImpact.groceriesDelta).toBeGreaterThan(0);
    expect(s.householdImpact.netMonthlyDelta).toBeLessThan(0);

    // Switch persona to retiree
    const retiree = { ...s.selectedHouseholdPersona, id: 'retiree', composition: 'senior' as const };
    s.setHouseholdPersona(retiree);
    expect(s.selectedHouseholdPersona.id).toBe('retiree');

    // Reset draft
    s.resetDraft();
    expect(s.householdImpact.netMonthlyDelta).toBe(0);
  });
});

