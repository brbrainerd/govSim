import { describe, expect, it } from 'vitest';
import { START } from '../engine/fixture';
import { newGame } from '../engine/game';
import { defaultEvilState } from '../engine/evil';
import { pickChyron, CHYRON_POOL } from './chyrons';

describe('satirical news chyrons (JUICE-02)', () => {
  it('selects default pool headline under baseline conditions', () => {
    const base = newGame(1, START);
    const chyron = pickChyron({ current: base, isEvilMode: false });
    expect(CHYRON_POOL.default).toContain(chyron);
  });

  it('selects high inflation headline when inflation exceeds threshold', () => {
    const base = newGame(1, START);
    const state = { ...base, econ: { ...base.econ, inflation: 5.5 } };
    const chyron = pickChyron({ current: state, isEvilMode: false });
    expect(CHYRON_POOL.high_inflation).toContain(chyron);
  });

  it('selects low approval headline when approval drops below 40', () => {
    const base = newGame(1, START);
    const state = { ...base, approval: 32 };
    const chyron = pickChyron({ current: state, isEvilMode: false });
    expect(CHYRON_POOL.low_approval).toContain(chyron);
  });

  it('selects high debt headline when debt-to-GDP exceeds 120%', () => {
    const base = newGame(1, START);
    const state = { ...base, econ: { ...base.econ, debt: 35, gdp: 25 } };
    const chyron = pickChyron({ current: state, isEvilMode: false });
    expect(CHYRON_POOL.high_debt).toContain(chyron);
  });

  it('selects evil default headline in Evil Mode with moderate heat', () => {
    const base = newGame(1, START);
    const state = { ...base, evil: { ...defaultEvilState(), heat: 20 } };
    const chyron = pickChyron({ current: state, isEvilMode: true });
    expect(CHYRON_POOL.evil_default).toContain(chyron);
  });

  it('selects evil high heat headline in Evil Mode when heat > 50', () => {
    const base = newGame(1, START);
    const state = { ...base, evil: { ...defaultEvilState(), heat: 75 } };
    const chyron = pickChyron({ current: state, isEvilMode: true });
    expect(CHYRON_POOL.evil_high_heat).toContain(chyron);
  });

  it('picks deterministically across turns', () => {
    const base1 = newGame(1, START);
    const base2 = { ...base1, turn: 2 };
    const chyron1 = pickChyron({ current: base1, isEvilMode: false });
    const chyron2 = pickChyron({ current: base2, isEvilMode: false });
    expect(chyron1).not.toBe(chyron2);
  });
});
