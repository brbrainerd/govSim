import { describe, expect, it } from 'vitest';
import { START } from './fixture';
import { newGame } from './game';
import { getImminentDeadlines, getRiskBands } from './deadlines';
import { C } from './coefficients';

describe('deadlines (EVT-04, EVT-05)', () => {
  it('gives at least 2 turns countdown before government funding expiration (EVT-04)', () => {
    const state = newGame(42, START);

    // Turn 1: 3 turns until turn 4 (Fall funding deadline) -> not yet within warning window (warning is 2 turns)
    const d1 = getImminentDeadlines(1, state);
    expect(d1.filter((d) => d.type === 'shutdown')).toHaveLength(0);

    // Turn 2: 2 turns until turn 4 -> warning is triggered
    const d2 = getImminentDeadlines(2, state);
    const shutdown2 = d2.find((d) => d.type === 'shutdown');
    expect(shutdown2).toBeDefined();
    expect(shutdown2?.turnsRemaining).toBe(2);
    expect(shutdown2?.turnsRemaining).toBeGreaterThanOrEqual(2);
    expect(shutdown2?.critical).toBe(false);

    // Turn 3: 1 turn until turn 4 -> critical warning
    const d3 = getImminentDeadlines(3, state);
    const shutdown3 = d3.find((d) => d.type === 'shutdown');
    expect(shutdown3).toBeDefined();
    expect(shutdown3?.turnsRemaining).toBe(1);
    expect(shutdown3?.critical).toBe(true);

    // Turn 4: 0 turns remaining (due this turn)
    const d4 = getImminentDeadlines(4, state);
    const shutdown4 = d4.find((d) => d.type === 'shutdown');
    expect(shutdown4).toBeDefined();
    expect(shutdown4?.turnsRemaining).toBe(0);
    expect(shutdown4?.critical).toBe(true);
  });

  it('triggers debt limit warning when debt ratio exceeds threshold with >= 2 turns warning (EVT-04)', () => {
    const baseState = newGame(42, START);
    // 1. Approaching threshold (1.21 >= 1.20 but < 1.25): 2 turns countdown
    const stateWarning = {
      ...baseState,
      econ: { ...baseState.econ, debt: baseState.econ.gdp * 1.21 },
    };
    const debtRatioWarning = stateWarning.econ.debt / stateWarning.econ.gdp;
    expect(debtRatioWarning).toBeGreaterThanOrEqual(C.debtLimitRiskThreshold);
    expect(debtRatioWarning).toBeLessThan(C.debtStressThreshold);

    const deadlinesWarning = getImminentDeadlines(1, stateWarning);
    const debtDeadlineWarning = deadlinesWarning.find((d) => d.type === 'debt_limit');
    expect(debtDeadlineWarning).toBeDefined();
    expect(debtDeadlineWarning?.turnsRemaining).toBe(2);
    expect(debtDeadlineWarning?.critical).toBe(false);
    expect(debtDeadlineWarning?.actionText).toMatch(/statutory debt limit/i);

    // 2. Severe debt stress (>= 1.25): 1 turn critical countdown
    const stateCritical = {
      ...baseState,
      econ: { ...baseState.econ, debt: baseState.econ.gdp * 1.26 },
    };
    const deadlinesCritical = getImminentDeadlines(1, stateCritical);
    const debtDeadlineCritical = deadlinesCritical.find((d) => d.type === 'debt_limit');
    expect(debtDeadlineCritical).toBeDefined();
    expect(debtDeadlineCritical?.turnsRemaining).toBe(1);
    expect(debtDeadlineCritical?.critical).toBe(true);
  });

  it('produces strictly qualitative risk bands with 0 percentage characters (EVT-05)', () => {
    const state = newGame(42, START);

    for (let turn = 1; turn <= 16; turn++) {
      const bands = getRiskBands(turn, state);
      expect(bands.length).toBeGreaterThanOrEqual(3);

      for (const band of bands) {
        expect(['Low', 'Elevated', 'High']).toContain(band.level);
        expect(band.context).not.toContain('%');
        expect(band.category).not.toContain('%');
        expect(band.level).not.toContain('%');
        // Grade reading level check / plain language
        expect(band.context.length).toBeGreaterThan(10);
      }
    }
  });
});
