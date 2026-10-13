# Phase 24 Context: Replayable Starting Scenarios

## Goal
Multiply replayability by adding a Starting Scenario selector at New Game with 4 curated, historically grounded scenarios (*2026 Standard Baseline*, *70s Stagflation Shock*, *Debt Ceiling Brinkmanship*, *Global Trade War*) that deterministically configure initial conditions, display inauguration briefing objectives on the Oval Office, and record scenario badges on the EndScreen and URL replay hash.

## Scenarios (`src/content/scenarios.ts`)
1. `standard_2026` — **2026 Standard Baseline**:
   - Subtitle: `Steady growth, moderate inflation, and rising long-term debt.`
   - Briefing: `Steady growth gives you room to pass a first-year budget.`
   - Overrides: `{}` (uses `us-2026.json` directly).
2. `stagflation_shock` — **70s Stagflation Shock**:
   - Subtitle: `High consumer prices paired with rising job losses.`
   - Briefing: `High inflation and weak hiring squeeze families on day one.`
   - Overrides: `{ inflation: 6.2, unemployment: 6.4, fedRate: 5.5, trust: 32 }`.
3. `debt_brinkmanship` — **Debt Ceiling Brinkmanship**:
   - Subtitle: `Treasury debt nears the statutory limit with high deficits.`
   - Briefing: `National debt is near the limit and borrowing costs are high.`
   - Overrides: `{ debtPct: 128, deficitPct: 7.8, fedRate: 4.9, trust: 34 }`.
4. `global_trade_war` — **Global Trade War**:
   - Subtitle: `Steep border tariffs, supply chain strain, and price spikes.`
   - Briefing: `Retaliatory tariffs are raising store prices and slowing trade.`
   - Overrides: `{ tariff: 24, inflation: 4.6, unemployment: 5.1, trust: 35 }`.

All strings in `src/content/scenarios.ts` must pass the Flesch-Kincaid reading grade `<= 9.0` and sentence length `<= 20` words gates.
