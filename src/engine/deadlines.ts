// Pure, deterministic legislative deadlines and qualitative risk bands (EVT-04, EVT-05).
import { termParts } from './calendar';
import { C } from './coefficients';
import type { GameState } from './game';
import { QUARTERS_PER_YEAR } from './units';

export type DeadlineType = 'shutdown' | 'debt_limit' | 'geopolitical_crisis';

export interface DeadlineStatus {
  readonly type: DeadlineType;
  readonly title: string;
  readonly turnsRemaining: number;
  readonly targetTurn: number;
  readonly critical: boolean;
  readonly description: string;
  readonly actionText: string;
}

export type RiskLevel = 'Low' | 'Elevated' | 'High';

export interface RiskBand {
  readonly category: string;
  readonly level: RiskLevel;
  readonly context: string;
}

/**
 * Calculates imminent congressional deadlines (EVT-04).
 * Deadlines telegraph a countdown of at least 2 turns before expiration.
 */
export function getImminentDeadlines(turn: number, state: GameState): DeadlineStatus[] {
  const deadlines: DeadlineStatus[] = [];

  // 1. Annual federal funding deadline: arrives in Fall (turn 4, 8, 12, 16...)
  const cycleIndex = Math.floor((turn - 1) / QUARTERS_PER_YEAR);
  const fallTurn = (cycleIndex + 1) * QUARTERS_PER_YEAR;
  const turnsToFunding = fallTurn - turn;

  if (turnsToFunding <= C.deadlineWarningTurns && turnsToFunding >= 0) {
    deadlines.push({
      type: 'shutdown',
      title: 'Government Funding Deadline',
      turnsRemaining: turnsToFunding,
      targetTurn: fallTurn,
      critical: turnsToFunding <= 1,
      description: 'Annual federal appropriations lapse at the end of the fiscal year.',
      actionText: 'Pass federal budget or continuing resolution in Congress',
    });
  }

  // 2. Debt ceiling statutory limit: triggers when debt exceeds statutory warning threshold
  const debtRatio = state.econ.debt / state.econ.gdp;
  if (debtRatio >= C.debtLimitRiskThreshold) {
    const turnsToDebtCeiling = debtRatio >= C.debtStressThreshold ? 1 : Math.round(C.deadlineWarningTurns);
    deadlines.push({
      type: 'debt_limit',
      title: 'Statutory Debt Limit',
      turnsRemaining: turnsToDebtCeiling,
      targetTurn: turn + turnsToDebtCeiling,
      critical: turnsToDebtCeiling <= 1,
      description: 'Treasury extraordinary measures are approaching technical depletion.',
      actionText: 'Authorize statutory debt limit increase in Congress',
    });
  }

  // 3. Active geopolitical crisis deadlines (CRISIS-01)
  if (state.activeGeopoliticalCrises && state.activeGeopoliticalCrises.length > 0) {
    for (const crisis of state.activeGeopoliticalCrises) {
      const turnsRemaining = crisis.turnsRemaining ?? 1;
      deadlines.push({
        type: 'geopolitical_crisis',
        title: crisis.name,
        turnsRemaining,
        targetTurn: turn + turnsRemaining,
        critical: turnsRemaining <= 1,
        description: crisis.headline,
        actionText: 'Resolve crisis diplomatic, economic or military options in Oval Office or Crisis Drawer',
      });
    }
  }

  return deadlines;
}

/**
 * Evaluates qualitative risk bands across seasonal and economic categories (EVT-05).
 * Guaranteed to contain strictly qualitative labels (Low / Elevated / High) with zero percentages.
 */
export function getRiskBands(turn: number, state: GameState): RiskBand[] {
  const { season } = termParts(turn);

  // 1. Seasonal weather risk
  let weatherLevel: RiskLevel = 'Low';
  let weatherContext = 'Standard seasonal storm patterns across all regions.';
  if (season === 'Summer' || season === 'Fall') {
    weatherLevel = 'High';
    weatherContext = 'Elevated coastal storm activity and heightened wildfire conditions.';
  } else if (season === 'Spring') {
    weatherLevel = 'Elevated';
    weatherContext = 'Seasonal snowmelt flood risks along major river basins.';
  }

  // 2. Fiscal pressure
  const debtRatio = state.econ.debt / state.econ.gdp;
  let fiscalLevel: RiskLevel = 'Low';
  let fiscalContext = 'Sovereign borrowing costs and auctions remain orderly.';
  if (debtRatio >= C.debtStressThreshold) {
    fiscalLevel = 'High';
    fiscalContext = 'Bond markets signaling acute sovereign borrowing strain.';
  } else if (debtRatio >= C.debtLimitRiskThreshold) {
    fiscalLevel = 'Elevated';
    fiscalContext = 'Debt growth trajectory testing historical debt ceiling limits.';
  }

  // 3. Price stability
  let priceLevel: RiskLevel = 'Low';
  let priceContext = 'Consumer price indexes hovering close to long-run target.';
  if (state.econ.inflation >= C.approvalPriceFloor + 1) {
    priceLevel = 'High';
    priceContext = 'Broad-based price growth eroding household real purchasing power.';
  } else if (state.econ.inflation >= C.approvalPriceFloor) {
    priceLevel = 'Elevated';
    priceContext = 'Upward price momentum visible in energy and grocery markets.';
  }

  return [
    { category: 'Seasonal Weather Hazards', level: weatherLevel, context: weatherContext },
    { category: 'Fiscal & Debt Pressures', level: fiscalLevel, context: fiscalContext },
    { category: 'Price & Inflation Stability', level: priceLevel, context: priceContext },
  ];
}
