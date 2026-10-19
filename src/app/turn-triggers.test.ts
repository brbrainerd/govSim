import { describe, expect, it } from 'vitest';
import { START } from '../engine/fixture';
import { Session } from './session.svelte';
import {
  buildTurnChecklist,
  describeStagedItem,
  isMandateDraftSpotlightTurn,
  resolveTurnTrigger,
} from './turn-triggers';

describe('Civ-Style Turn Triggers & Clearing Statuses (TRIG-01..03, CLEAR-01..03)', () => {
  it('TRIG-01 & TRIG-02: defers Mandate Draft off Turn 1 and prioritizes unsent budget / failing bill / ready clearing', () => {
    const session = new Session(42, START, { party: 'D' });

    // Turn 1: Mandate Draft is NOT spotlighted on Turn 1 so the player focuses on their first agenda move
    expect(session.current.turn).toBe(1);
    expect(isMandateDraftSpotlightTurn(session)).toBe(false);

    const t1Trigger = resolveTurnTrigger(session, [
      {
        title: 'Pass the Infrastructure Push',
        cta: 'Open Budget',
        target: 'budget',
        play: { pack: 'Infrastructure push', autoWhip: true, sendToCongress: true },
      },
    ]);
    expect(t1Trigger.kind).toBe('agenda');
    expect(t1Trigger.blocker).toBe(false);
    expect(t1Trigger.label).toBe('Pass the Infrastructure Push');

    // Pick a budget package without sending -> unsent_budget blocker trigger
    session.pickPackage('Infrastructure push');
    const unsentTrigger = resolveTurnTrigger(session);
    expect(unsentTrigger.kind).toBe('unsent_budget');
    expect(unsentTrigger.blocker).toBe(true);

    // Send to Congress without enough votes -> failing_bill blocker trigger (or ready if >=218)
    session.sendToCongress();
    const afterSendTrigger = resolveTurnTrigger(session);
    if (session.whip.total < 218) {
      expect(afterSendTrigger.kind).toBe('failing_bill');
      expect(afterSendTrigger.blocker).toBe(true);
      session.autoWhipCoalition();
    }

    const readyTrigger = resolveTurnTrigger(session);
    expect(readyTrigger.kind).toBe('ready');
    expect(readyTrigger.blocker).toBe(false);
    expect(readyTrigger.badge).toContain('CLEARING');
  });

  it('CLEAR-01 & CLEAR-02: describeStagedItem reports explicit clearing statuses and buildTurnChecklist builds 3-item checklist', () => {
    const session = new Session(42, START, { party: 'D' });

    session.pickPackage('Infrastructure push');
    const unsentItem = session.stagedActionsSummary[0]!;
    const unsentDesc = describeStagedItem(session, unsentItem);
    expect(unsentDesc.status).toBe('unsent');
    expect(unsentDesc.statusBadge).toBe('DRAFT UNSENT !');

    session.sendToCongress();
    session.autoWhipCoalition();
    session.toggleSignOrder('clean_energy_permitting');

    const billItem = session.stagedActionsSummary.find((i) => i.id === 'bill-queued')!;
    const billDesc = describeStagedItem(session, billItem);
    expect(billDesc.status).toBe('will_clear');
    expect(billDesc.statusBadge).toContain('PASSES');

    const eoItem = session.stagedActionsSummary.find((i) => i.id === 'orders')!;
    const eoDesc = describeStagedItem(session, eoItem);
    expect(eoDesc.status).toBe('will_clear');
    expect(eoDesc.statusBadge).toBe('CLEARS THIS TURN ✓');

    const checklist = buildTurnChecklist(session, [
      {
        title: 'Review Voters Map',
        cta: 'Open Voters',
        target: 'voters',
      },
    ]);
    expect(checklist.length).toBe(3);
    expect(checklist[0]!.checked).toBe(true);
    expect(checklist[1]!.checked).toBe(true);
    expect(checklist[2]!.checked).toBe(false);
  });
});
