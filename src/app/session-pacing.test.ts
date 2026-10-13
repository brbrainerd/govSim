import { describe, expect, it } from 'vitest';
import { START } from '../engine/fixture';
import { Session } from './session.svelte';

describe('Session Pacing & Staged Decisions (PACE-01, PACE-02)', () => {
  it('PACE-01: tracks unsent budget drafts with warning and updates to bill-queued once sent', () => {
    const session = new Session(42, START, { party: 'D' });
    expect(session.stagedActionsSummary).toEqual([]);

    // Pick a budget package without sending to Congress
    session.pickPackage('Infrastructure push');
    expect(session.stagedActionsSummary).toEqual([
      {
        id: 'budget-unsent',
        label: 'Budget draft (unsent)',
        screen: 'budget',
        warning: true,
      },
    ]);

    // Send to Congress -> warning clears, becomes bill-queued
    session.sendToCongress();
    expect(session.stagedActionsSummary).toEqual([
      {
        id: 'bill-queued',
        label: 'Bill sent to Congress',
        screen: 'congress',
      },
    ]);

    // Auto-whip adds 2 deals
    session.autoWhipCoalition();
    expect(session.stagedActionsSummary).toEqual([
      {
        id: 'bill-queued',
        label: 'Bill sent to Congress (2 deals)',
        screen: 'congress',
      },
    ]);

    // Sign an executive order and pressure the Fed
    session.toggleSignOrder('clean_energy_permitting');
    session.setFedPressure(true);
    expect(session.stagedActionsSummary.map((i) => i.id)).toEqual([
      'bill-queued',
      'orders',
      'fed',
    ]);
  });

  it('PACE-02: fastForwardToNextEvent advances quiet quarters and halts on crisis or critical deadline', () => {
    const session = new Session(42, START, { party: 'D' });
    expect(session.current.turn).toBe(1);
    expect(session.canFastForward).toBe(true);

    const steps = session.fastForwardToNextEvent();
    expect(steps).toBeGreaterThanOrEqual(1);
    expect(steps).toBeLessThanOrEqual(3);
    expect(session.current.turn).toBe(1 + steps);

    // Must halt because of either an active crisis or a critical funding deadline (Turn 3 has 1 turn left to Turn 4 shutdown)
    const hasCrisis =
      Boolean(session.current.activeCrisis) ||
      Boolean(session.current.activeGeopoliticalCrises && session.current.activeGeopoliticalCrises.length > 0);
    const isCriticalTurn = session.current.turn >= 3;
    expect(hasCrisis || isCriticalTurn).toBe(true);
  });
});
