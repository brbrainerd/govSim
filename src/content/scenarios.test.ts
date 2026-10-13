import { describe, expect, it } from 'vitest';
import { Session } from '../app/session.svelte';
import { parseSave, serializeSave } from '../app/save';
import { decodeRunCode, encodeRunCode } from '../app/share';
import { START } from '../engine/fixture';
import { SCENARIOS, applyScenarioStart, getScenario } from './scenarios';

describe('Replayable Starting Scenarios (SCEN-01, SCEN-02)', () => {
  it('defines 4 curated scenarios and applies deterministic idempotent Start overrides', () => {
    expect(SCENARIOS).toHaveLength(4);
    expect(SCENARIOS.map((s) => s.id)).toEqual([
      'standard_2026',
      'stagflation_shock',
      'debt_brinkmanship',
      'global_trade_war',
    ]);

    const stag = applyScenarioStart(START, 'stagflation_shock');
    expect(stag.inflation).toBe(6.2);
    expect(stag.unemployment).toBe(6.4);
    expect(stag.fedRate).toBe(5.5);

    // Idempotent when applied again
    expect(applyScenarioStart(stag, 'stagflation_shock')).toEqual(stag);
  });

  it('configures Session initial state and autopilot identically and round-trips through SaveFile and Share URL', async () => {
    const session = new Session(42, START, { party: 'D', scenario: 'global_trade_war' });
    expect(session.activeScenario).toEqual(getScenario('global_trade_war'));
    expect(session.current.econ.inflation).toBe(4.6);
    expect(session.current.start.tariff).toBe(24);
    // Autopilot starts on identical scenario baseline so scoreVsAutopilot starts at 0
    expect(session.score.total).toBe(0);

    // Round-trip through SaveFile
    const json = serializeSave(session);
    const parsed = parseSave(json);
    expect(parsed.options.scenario).toBe('global_trade_war');
    const restored = Session.fromSave(parsed);
    expect(restored.activeScenario.id).toBe('global_trade_war');
    expect(restored.current.start.tariff).toBe(24);

    // Round-trip through Share URL code
    const code = await encodeRunCode(session);
    const decoded = await decodeRunCode(code);
    expect(decoded?.scenario).toBe('global_trade_war');
    const sharedSession = Session.fromRun(decoded!, START);
    expect(sharedSession.activeScenario.id).toBe('global_trade_war');
    expect(sharedSession.current.start.tariff).toBe(24);
  });
});
