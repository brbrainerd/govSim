// Generates balance-report.json across 100 seeds and 4 standard benchmark strategies (OBS-06, GR-35, GR-36).
// Run with: node scripts/balance-report.ts
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';

interface Quantiles {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

interface StrategySummary {
  meanScore: number;
  nowScore: number;
  laterScore: number;
  diffVsAutopilot: number;
  quantiles: Quantiles;
  indicators: {
    unemployment: number;
    inflation: number;
    debtPct: number;
    realIncome: number;
    approval: number;
  };
}

export interface BalanceReport {
  version: '0.2';
  seeds: number;
  strategies: Record<string, StrategySummary>;
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base]! + rest * (sorted[base + 1]! - sorted[base]!);
  }
  return sorted[base]!;
}

export async function generateBalanceReport(seedCount = 100): Promise<BalanceReport> {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });

  try {
    const { newGame, endTurn, finalScore, TOTAL_TURNS } = await server.ssrLoadModule('./src/engine/game.ts');
    const { baseline } = await server.ssrLoadModule('./src/engine/budget.ts');
    const { enact, START } = await server.ssrLoadModule('./src/engine/fixture.ts');

    const base = baseline();
    const benchmarkStrategies: Record<string, any> = {
      autopilot: null,
      sensible: { ...base, inc: 24, bus: 22, rds: 115, rnd: 110, oth: 95 },
      maxDeficit: { ...base, inc: 10, bus: 10, inv: 10, pay: 10, tar: 0, def: 120, ssm: 110, mcd: 120, rds: 130, rnd: 130, oth: 120 },
      maxAusterity: { ...base, inc: 35, bus: 30, inv: 30, def: 80, ssm: 90, mcd: 80, rds: 80, rnd: 80, oth: 80 },
    };

    function runStrategy(seed: number, draft: any) {
      let s = newGame(seed, START);
      for (let t = 1; t < TOTAL_TURNS; t++) {
        s = endTurn(s, t === 1 && draft ? enact(draft) : {});
      }
      return s;
    }

    const rawResults: Record<string, { scores: number[]; nows: number[]; laters: number[]; endStates: any[] }> = {};
    for (const key of Object.keys(benchmarkStrategies)) {
      rawResults[key] = { scores: [], nows: [], laters: [], endStates: [] };
    }

    for (let seed = 1; seed <= seedCount; seed++) {
      for (const [name, draft] of Object.entries(benchmarkStrategies)) {
        const endState = runStrategy(seed, draft);
        const score = finalScore(endState);
        rawResults[name]!.scores.push(score.total);
        rawResults[name]!.nows.push(score.now);
        rawResults[name]!.laters.push(score.later);
        rawResults[name]!.endStates.push(endState);
      }
    }

    const autoMean = rawResults['autopilot']!.scores.reduce((a, b) => a + b, 0) / seedCount;
    const strategiesOut: Record<string, StrategySummary> = {};

    for (const [name, res] of Object.entries(rawResults)) {
      const sorted = [...res.scores].sort((a, b) => a - b);
      const mean = res.scores.reduce((a, b) => a + b, 0) / seedCount;
      const nowMean = res.nows.reduce((a, b) => a + b, 0) / seedCount;
      const laterMean = res.laters.reduce((a, b) => a + b, 0) / seedCount;

      const unempMean = res.endStates.reduce((a, s) => a + s.econ.unemployment, 0) / seedCount;
      const inflMean = res.endStates.reduce((a, s) => a + s.econ.inflation, 0) / seedCount;
      const debtMean = res.endStates.reduce((a, s) => a + (s.econ.debt / s.econ.gdp) * 100, 0) / seedCount;
      const incMean = res.endStates.reduce((a, s) => a + s.econ.realIncome, 0) / seedCount;
      const appMean = res.endStates.reduce((a, s) => a + s.approval, 0) / seedCount;

      strategiesOut[name] = {
        meanScore: Math.round(mean * 1000) / 1000,
        nowScore: Math.round(nowMean * 1000) / 1000,
        laterScore: Math.round(laterMean * 1000) / 1000,
        diffVsAutopilot: Math.round((mean - autoMean) * 1000) / 1000,
        quantiles: {
          min: Math.round(sorted[0]! * 1000) / 1000,
          p25: Math.round(quantile(sorted, 0.25) * 1000) / 1000,
          median: Math.round(quantile(sorted, 0.5) * 1000) / 1000,
          p75: Math.round(quantile(sorted, 0.75) * 1000) / 1000,
          max: Math.round(sorted.at(-1)! * 1000) / 1000,
        },
        indicators: {
          unemployment: Math.round(unempMean * 100) / 100,
          inflation: Math.round(inflMean * 100) / 100,
          debtPct: Math.round(debtMean * 100) / 100,
          realIncome: Math.round(incMean),
          approval: Math.round(appMean * 10) / 10,
        },
      };
    }

    return {
      version: '0.2',
      seeds: seedCount,
      strategies: strategiesOut,
    };
  } finally {
    await server.close();
  }
}

// CLI runner
if (process.argv[1] && resolve(process.argv[1]) === resolve('scripts/balance-report.ts')) {
  const report = await generateBalanceReport(100);
  const outPath = resolve('balance-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`Balance report written to ${outPath}`);
  console.log(`Sensible diff vs autopilot: +${report.strategies['sensible']!.diffVsAutopilot} index points`);
}
