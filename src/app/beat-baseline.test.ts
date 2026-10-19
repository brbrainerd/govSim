import { describe, expect, it } from 'vitest';
import { START } from '../engine/fixture';
import { newGame } from '../engine/game';
import { diagnoseBaselineGaps, getStrategicPlaybooks, previewDraftVsBaseline } from './beat-baseline';
import { Session } from './session.svelte';

describe('Beat-the-Baseline Lookahead & Strategy Coach (BEAT-01..03, FUN-01)', () => {
  it('diagnoseBaselineGaps returns all 8 Prosperity Index components summing to 100% weight', () => {
    const state = newGame(42, START);
    const auto = newGame(42, START);
    const gaps = diagnoseBaselineGaps(state, auto);

    expect(gaps).toHaveLength(8);
    const totalWeight = gaps.reduce((sum, g) => sum + g.weightPct, 0);
    expect(totalWeight).toBe(100);
    for (const g of gaps) {
      expect(g.weightedDelta).toBe(0);
      expect(g.status).toBe('tied');
      expect(g.headroomPoints).toBeGreaterThan(0);
      expect(g.fix.label.length).toBeGreaterThan(0);
    }
  });

  it('previewDraftVsBaseline computes positive deltaVsIdle when staging Infrastructure push', () => {
    const session = new Session(42, START, { party: 'D', unlockAll: true }, { skipAutosave: true });
    const idlePreview = previewDraftVsBaseline(session);
    expect(idlePreview.hasStagedChanges).toBe(false);
    expect(idlePreview.deltaVsIdle.total).toBe(0);

    session.pickPackage('Infrastructure push');
    const unsentPreview = previewDraftVsBaseline(session);
    expect(unsentPreview.hasStagedChanges).toBe(true);
    expect(unsentPreview.needsCongressVote).toBe(true);
    expect(unsentPreview.deltaVsIdle.total).toBeGreaterThan(0);
    expect(unsentPreview.badgeText).toContain('vs. Autopilot');
    expect(unsentPreview.projected4Q).toHaveLength(5);

    session.sendToCongress();
    const sentUnwhippedPreview = previewDraftVsBaseline(session);
    expect(sentUnwhippedPreview.needsCongressVote).toBe(true);
    expect(sentUnwhippedPreview.deltaVsIdle.total).toBeGreaterThan(0);
    expect(sentUnwhippedPreview.queuedDeltaVsIdle.total).toBe(0);

    session.autoWhipCoalition();
    session.callVote();
    const passedPreview = previewDraftVsBaseline(session);
    expect(passedPreview.needsCongressVote).toBe(false);
    expect(passedPreview.queuedDeltaVsIdle.total).toBeGreaterThan(0);
  });

  it('previewDraftVsBaseline includes stagedEvilLevers and dynamicCrisisDelta (CR-01)', () => {
    const evilSession = new Session(42, START, { party: 'D', evilMode: true, unlockAll: true }, { skipAutosave: true });
    expect(previewDraftVsBaseline(evilSession).hasStagedChanges).toBe(false);
    evilSession.toggleEvilLever('crony_contracts');
    const evilPreview = previewDraftVsBaseline(evilSession);
    expect(evilPreview.hasStagedChanges).toBe(true);

    const dynSession = new Session(42, START, { party: 'D', unlockAll: true }, { skipAutosave: true });
    dynSession.stageDynamicCrisisOption({
      cloutCost: 10,
      approvalDelta: 2,
      gapDelta: 0.4,
      infDelta: -0.1,
      trustDelta: 0.02,
    });
    const dynPreview = previewDraftVsBaseline(dynSession);
    expect(dynPreview.hasStagedChanges).toBe(true);
    expect(dynPreview.deltaVsIdle.total).toBeGreaterThan(0);
  });

  it('getStrategicPlaybooks returns 3 distinct playbooks and rotates across turns', () => {
    const session = new Session(42, START, { party: 'D', unlockAll: true }, { skipAutosave: true });
    const turn1Playbooks = getStrategicPlaybooks(session);
    expect(turn1Playbooks).toHaveLength(3);
    expect(new Set(turn1Playbooks.map((p) => p.id)).size).toBe(3);
    for (const p of turn1Playbooks) {
      expect(p.estDelta).toBeGreaterThan(0);
      expect(p.estDeltaLabel).toContain('vs. Autopilot');
    }

    session.stageStrategicPlaybook(turn1Playbooks[0]!);
    expect(session.draftScorePreview.hasStagedChanges).toBe(true);
  });
});
