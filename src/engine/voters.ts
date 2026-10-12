// Pure, deterministic Electoral College and voter simulation model (VOT-01..VOT-06).
// No UI imports. Neutral: uses player side ('D' | 'R') and player-relative metrics.
// Every constant comes from coefficients.ts or units.ts (exempt from literal scan).

import { DISTRICTS, STATE_EXPOSURES } from '../data/electoral';
import { us } from '../data/us';
import { C, RULES } from './coefficients';
import { clamp, sqrt } from './detmath';
import type { GameState } from './game';
import { normal } from './rng';
import {
  BASE_PERCENT,
  DISTRICT_EV,
  ELECTION_TURN_1,
  HALF_DIVISOR,
  MAX_SUPPORT_PCT,
  ME_AT_LARGE_EV,
  MIN_SUPPORT_PCT,
  NE_AT_LARGE_EV,
  PROJECTION_START_TURN,
  REASON_IMPACT_THRESHOLD,
  REASON_NATIONAL_THRESHOLD,
  TOTAL_ELECTORAL_VOTES,
  TO_WIN_ELECTORAL_VOTES,
} from './units';

export type VoterLeaning =
  | 'safe-you'
  | 'likely-you'
  | 'lean-you'
  | 'tossup'
  | 'lean-them'
  | 'likely-them'
  | 'safe-them';

export interface StateVoterState {
  readonly code: string;
  readonly name: string;
  readonly electoralVotes: number;
  readonly baselineMargin: number; // player advantage in pp (positive = player lead)
  readonly currentMargin: number; // current simulated margin in pp
  readonly supportPct: number; // estimated popular support percentage (15..85)
  readonly supportDelta: number; // change from baseline support
  readonly leaning: VoterLeaning;
  readonly winner: 'you' | 'them';
  readonly isSwing: boolean;
  readonly isTippingPoint: boolean;
  readonly reasons: readonly string[];
}

export interface ProjectionRange {
  readonly low: number;
  readonly high: number;
}

export interface ElectoralSummary {
  readonly playerVotes: number;
  readonly opponentVotes: number;
  readonly tossupVotes: number;
  readonly tippingPointCode: string;
  readonly swingStates: readonly StateVoterState[];
  readonly states: Readonly<Record<string, StateVoterState>>;
  readonly districts: Readonly<Record<string, StateVoterState>>;
  readonly units: Readonly<Record<string, StateVoterState>>;
  readonly projectionRange?: ProjectionRange;
}

interface RawUnit {
  readonly code: string;
  readonly name: string;
  readonly stateCode: string;
  readonly electoralVotes: number;
  readonly mapVotes: number;
  readonly isDistrict: boolean;
  readonly margin2024: number; // R minus D in pp
}

/** Builds the complete list of 56 voting units that allocate the 538 electoral votes. */
function buildRawUnits(): readonly RawUnit[] {
  const list: RawUnit[] = [];

  for (const row of us.states.rows) {
    if (row.code === 'ME') {
      list.push({
        code: 'ME-AL',
        name: 'Maine (At-Large)',
        stateCode: 'ME',
        electoralVotes: ME_AT_LARGE_EV,
        mapVotes: row.electoralVotes,
        isDistrict: false,
        margin2024: row.margin2024,
      });
    } else if (row.code === 'NE') {
      list.push({
        code: 'NE-AL',
        name: 'Nebraska (At-Large)',
        stateCode: 'NE',
        electoralVotes: NE_AT_LARGE_EV,
        mapVotes: row.electoralVotes,
        isDistrict: false,
        margin2024: row.margin2024,
      });
    } else {
      list.push({
        code: row.code,
        name: row.name,
        stateCode: row.code,
        electoralVotes: row.electoralVotes,
        mapVotes: row.electoralVotes,
        isDistrict: false,
        margin2024: row.margin2024,
      });
    }
  }

  for (const d of Object.values(DISTRICTS)) {
    list.push({
      code: d.id,
      name: d.name,
      stateCode: d.state,
      electoralVotes: DISTRICT_EV,
      mapVotes: DISTRICT_EV,
      isDistrict: true,
      margin2024: d.margin2024,
    });
  }

  return list;
}

const RAW_UNITS = buildRawUnits();

/**
 * Calculates the unadjusted player margin for a unit based on chosen orientation ('R' or 'D').
 * Positive means player lead.
 */
function unadjustedPlayerMargin(raw: RawUnit, side: 'D' | 'R'): number {
  return side === 'R' ? raw.margin2024 : -raw.margin2024;
}

/**
 * Calculates the baseline tipping-point margin across the 56 units.
 * The unit that pushes cumulative electoral votes past 270 defines the baseline offset (D4, GR-16).
 */
export function calculateTippingPointOffset(side: 'D' | 'R'): number {
  const sorted = [...RAW_UNITS].sort(
    (a, b) => unadjustedPlayerMargin(b, side) - unadjustedPlayerMargin(a, side)
  );

  let cum = 0;
  for (const u of sorted) {
    cum += u.electoralVotes;
    if (cum >= TO_WIN_ELECTORAL_VOTES) {
      return unadjustedPlayerMargin(u, side);
    }
  }
  return 0;
}

function classifyLeaning(margin: number): VoterLeaning {
  if (margin >= C.safeThreshold) return 'safe-you';
  if (margin >= C.likelyThreshold) return 'likely-you';
  if (margin >= C.tossupThreshold) return 'lean-you';
  if (margin > -C.tossupThreshold) return 'tossup';
  if (margin > -C.likelyThreshold) return 'lean-them';
  if (margin > -C.safeThreshold) return 'likely-them';
  return 'safe-them';
}

function deriveReasons(
  farmShift: number,
  mfgShift: number,
  energyShift: number,
  natShift: number
): string[] {
  const out: string[] = [];

  if (farmShift < -REASON_IMPACT_THRESHOLD) out.push('Farmers upset by tariffs');
  else if (farmShift > REASON_IMPACT_THRESHOLD) out.push('Farm export conditions favorable');

  if (mfgShift > REASON_IMPACT_THRESHOLD) out.push('Strong manufacturing growth');
  else if (mfgShift < -REASON_IMPACT_THRESHOLD) out.push('Industrial output slowdown');

  if (energyShift < -REASON_IMPACT_THRESHOLD) out.push('High inflation impacts energy');
  else if (energyShift > REASON_IMPACT_THRESHOLD) out.push('Energy sector steady');

  if (natShift > REASON_NATIONAL_THRESHOLD) out.push('Lifted by national popularity');
  else if (natShift < -REASON_NATIONAL_THRESHOLD) out.push('Dragged by national approval');

  if (out.length === 0) out.push('Local voter conditions steady');
  return out;
}

/**
 * Pure calculation of the state-by-state voter landscape and Electoral College standing.
 */
export function calculateElectoralCollege(
  state: GameState,
  side: 'D' | 'R',
  options: { unadjusted?: boolean } = {}
): ElectoralSummary {
  const isUnadjusted = options.unadjusted === true;
  const tipOffset = isUnadjusted ? 0 : calculateTippingPointOffset(side);

  // 1. Macro and national mood transmission
  const approvalDelta = state.approval - RULES.startApproval.value;
  const natShift = isUnadjusted ? 0 : approvalDelta * C.voterApprovalElasticity;

  // 2. Policy and economic shocks
  const tariffDev = (state.policy.tar ?? state.start.tariff) - state.start.tariff;
  const growthDev = state.econ.growth - state.start.potential;
  const inflDev = state.econ.inflation - state.start.inflation;

  // 3. First pass: compute margins and candidate vote tallies
  interface ComputedUnit {
    readonly raw: RawUnit;
    readonly baselineMargin: number;
    readonly currentMargin: number;
    readonly supportPct: number;
    readonly supportDelta: number;
    readonly leaning: VoterLeaning;
    readonly reasons: readonly string[];
  }

  const computed: ComputedUnit[] = [];

  for (const raw of RAW_UNITS) {
    const unadjustedBase = unadjustedPlayerMargin(raw, side);
    const baselineMargin = unadjustedBase - tipOffset;

    const exp = STATE_EXPOSURES[raw.stateCode] ?? { farm: 0, manufacturing: 0, energy: 0 };
    const farmShift = isUnadjusted ? 0 : -tariffDev * exp.farm * C.voterFarmTariffSensitivity;
    const mfgShift = isUnadjusted ? 0 : growthDev * exp.manufacturing * C.voterMfgGrowthSensitivity;
    const energyShift = isUnadjusted ? 0 : -inflDev * exp.energy * C.voterEnergyInflationSensitivity;
    const totalExposureShift = farmShift + mfgShift + energyShift;

    const shock = isUnadjusted
      ? 0
      : normal(state.seed, 'voters', state.turn, raw.code) * C.voterStateVolatility;

    const currentMargin = isUnadjusted
      ? unadjustedBase
      : baselineMargin + natShift + totalExposureShift + shock;

    const baselineSupport = clamp(
      BASE_PERCENT + baselineMargin / HALF_DIVISOR,
      MIN_SUPPORT_PCT,
      MAX_SUPPORT_PCT
    );
    const supportPct = clamp(
      BASE_PERCENT + currentMargin / HALF_DIVISOR,
      MIN_SUPPORT_PCT,
      MAX_SUPPORT_PCT
    );
    const supportDelta = supportPct - baselineSupport;
    const leaning = classifyLeaning(currentMargin);
    const reasons = deriveReasons(farmShift, mfgShift, energyShift, natShift);

    computed.push({
      raw,
      baselineMargin,
      currentMargin,
      supportPct,
      supportDelta,
      leaning,
      reasons,
    });
  }

  // 4. Identify tipping point unit in current standing
  const sortedByMargin = [...computed].sort((a, b) => b.currentMargin - a.currentMargin);
  let cumEV = 0;
  let tippingPointCode = sortedByMargin[0]?.raw.code ?? 'PA';
  for (const item of sortedByMargin) {
    cumEV += item.raw.electoralVotes;
    if (cumEV >= TO_WIN_ELECTORAL_VOTES) {
      tippingPointCode = item.raw.code;
      break;
    }
  }

  // 5. Tally votes and assemble records
  let playerVotes = 0;
  let opponentVotes = 0;
  let tossupVotes = 0;

  const unitsMap: Record<string, StateVoterState> = {};
  const statesMap: Record<string, StateVoterState> = {};
  const districtsMap: Record<string, StateVoterState> = {};
  const swingStates: StateVoterState[] = [];

  for (const item of computed) {
    const raw = item.raw;
    const isWin = item.currentMargin >= 0;
    const winner: 'you' | 'them' = isWin ? 'you' : 'them';
    const isTippingPoint = raw.code === tippingPointCode || raw.stateCode === tippingPointCode;
    const isSwing = Math.abs(item.currentMargin) <= C.swingThreshold;

    if (isWin) {
      playerVotes += raw.electoralVotes;
    } else {
      opponentVotes += raw.electoralVotes;
    }

    if (item.leaning === 'tossup') {
      tossupVotes += raw.electoralVotes;
    }

    const stateObj: StateVoterState = {
      code: raw.code,
      name: raw.name,
      electoralVotes: raw.electoralVotes,
      baselineMargin: item.baselineMargin,
      currentMargin: item.currentMargin,
      supportPct: item.supportPct,
      supportDelta: item.supportDelta,
      leaning: item.leaning,
      winner,
      isSwing,
      isTippingPoint,
      reasons: item.reasons,
    };

    unitsMap[raw.code] = stateObj;

    if (raw.isDistrict) {
      districtsMap[raw.code] = stateObj;
    } else if (raw.code === 'ME-AL') {
      // Aggregate Maine statewide representation for 51-state map view
      const meState = us.states.rows.find((r) => r.code === 'ME')!;
      statesMap['ME'] = {
        ...stateObj,
        code: 'ME',
        name: meState.name,
        electoralVotes: meState.electoralVotes,
      };
      unitsMap['ME'] = statesMap['ME'];
    } else if (raw.code === 'NE-AL') {
      // Aggregate Nebraska statewide representation for 51-state map view
      const neState = us.states.rows.find((r) => r.code === 'NE')!;
      statesMap['NE'] = {
        ...stateObj,
        code: 'NE',
        name: neState.name,
        electoralVotes: neState.electoralVotes,
      };
      unitsMap['NE'] = statesMap['NE'];
    } else {
      statesMap[raw.code] = stateObj;
    }

    if (isSwing && !raw.isDistrict) {
      swingStates.push(statesMap[raw.stateCode] ?? stateObj);
    }
  }

  // 6. Compute honest projection range from Year 3 onward (turn >= 9) (VOT-03)
  let projectionRange: ProjectionRange | undefined = undefined;
  if (!isUnadjusted && state.turn >= PROJECTION_START_TURN) {
    const turnsRemaining = Math.max(1, ELECTION_TURN_1 - state.turn);
    const sigma = sqrt(turnsRemaining * C.projectionVolatilityQuarterly);
    const zShift = C.projectionZScore * sigma;

    let lowVotes = 0;
    let highVotes = 0;
    for (const item of computed) {
      if (item.currentMargin - zShift >= 0) lowVotes += item.raw.electoralVotes;
      if (item.currentMargin + zShift >= 0) highVotes += item.raw.electoralVotes;
    }
    projectionRange = { low: lowVotes, high: highVotes };
  }

  return {
    playerVotes,
    opponentVotes,
    tossupVotes,
    tippingPointCode,
    swingStates,
    states: statesMap,
    districts: districtsMap,
    units: unitsMap,
    projectionRange,
  };
}
