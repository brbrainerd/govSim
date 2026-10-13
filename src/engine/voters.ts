// Pure, deterministic Electoral College and voter simulation model (VOT-01..VOT-06).
// No UI imports. Neutral: uses player side ('D' | 'R') and player-relative metrics.
// Every constant comes from coefficients.ts or units.ts (exempt from literal scan).

import { DISTRICTS, getStateExposure, type StateDemographicExposure } from '../data/electoral';
import { us } from '../data/us';
import { C, RULES } from './coefficients';
import { abs, clamp, round, sqrt } from './detmath';
import type { GameState } from './game';
import { normal } from './rng';
import { isSocialBaseline, socialDev, type SocialDraft } from './social';
import { calculateRetaliatoryRate } from './trade';
import {
  BASE_PERCENT,
  DISTRICT_EV,
  ELECTION_TURN_1,
  FAMILY_RELIEF_UNIT_DOLLARS,
  HALF_DIVISOR,
  MAX_SUPPORT_PCT,
  ME_AT_LARGE_EV,
  MIN_SUPPORT_PCT,
  NAT_CHILD_POVERTY_BASELINE,
  NAT_CLEAN_ENERGY_BASELINE,
  NAT_FOSSIL_ENERGY_BASELINE,
  NAT_IMMIGRANT_LABOR_BASELINE,
  NAT_SENIOR_BASELINE,
  NAT_STUDENT_DEBT_BASELINE,
  NAT_UNINSURED_BASELINE,
  NAT_YOUNG_FAMILY_BASELINE,
  NE_AT_LARGE_EV,
  PROJECTION_START_TURN,
  REASON_IMPACT_THRESHOLD,
  REASON_NATIONAL_THRESHOLD,
  RPP_BASE_INDEX,
  SOCIAL_INDEX_STEP,
  SOCIAL_INDEX_STEP_FINE,
  SOCIAL_MAX_DEV,
  SOCIAL_NARROW_MAX_DEV,
  SOCIAL_PERCENT_MAX,
  SOCIAL_PERCENT_STEP,
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
  readonly familyReliefMonthly?: number;
  readonly rppIndex?: number;
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

export interface PolicyShifts {
  readonly farmShift: number;
  readonly mfgShift: number;
  readonly energyShift: number;
  readonly natShift: number;
  readonly drugShift: number;
  readonly acaShift: number;
  readonly bdrShift: number;
  readonly immLaborShift: number;
  readonly clnShift: number;
  readonly fosShift: number;
  readonly crbShift: number;
  readonly prekShift: number;
  readonly sdrShift: number;
  readonly k12Shift: number;
  readonly retaliatoryShift?: number;
}

export function deriveReasons(shifts: PolicyShifts): string[] {
  const out: string[] = [];

  // Social policy drivers (Phase 10, SOC-05)
  if (shifts.drugShift > REASON_IMPACT_THRESHOLD) out.push('Seniors benefit from Medicare drug price caps');
  if (shifts.acaShift > REASON_IMPACT_THRESHOLD) out.push('Families gain from expanded ACA health subsidies');
  if (shifts.bdrShift > REASON_IMPACT_THRESHOLD) out.push('Border communities supported by enforcement resources');
  if (shifts.immLaborShift > REASON_IMPACT_THRESHOLD) out.push('Regional labor stabilized by visa and worker reforms');
  if (shifts.clnShift > REASON_IMPACT_THRESHOLD) out.push('Clean energy investments expand local employment');
  if (shifts.fosShift > REASON_IMPACT_THRESHOLD) out.push('Energy sector boosted by federal leasing permits');
  if (shifts.crbShift < -REASON_IMPACT_THRESHOLD) out.push('Utility bills rise under carbon standards');
  if (shifts.prekShift > REASON_IMPACT_THRESHOLD) out.push('Parents relieved by universal pre-K grants');
  if (shifts.sdrShift > REASON_IMPACT_THRESHOLD) out.push('Young professionals benefit from student debt relief');
  if (shifts.k12Shift > REASON_IMPACT_THRESHOLD) out.push('Schools supported by Title I poverty grants');

  // Macroeconomic and trade drivers
  if (shifts.farmShift < -REASON_IMPACT_THRESHOLD) out.push('Farmers upset by tariffs');
  else if (shifts.farmShift > REASON_IMPACT_THRESHOLD) out.push('Farm export conditions favorable');

  if (shifts.mfgShift > REASON_IMPACT_THRESHOLD) out.push('Strong manufacturing growth');
  else if (shifts.mfgShift < -REASON_IMPACT_THRESHOLD) out.push('Industrial output slowdown');

  if (shifts.energyShift < -REASON_IMPACT_THRESHOLD) out.push('High inflation impacts energy');
  else if (shifts.energyShift > REASON_IMPACT_THRESHOLD) out.push('Energy sector steady');

  if (shifts.retaliatoryShift !== undefined && shifts.retaliatoryShift < -REASON_IMPACT_THRESHOLD) {
    out.push('Exporters hurt by foreign retaliatory tariffs');
  }

  if (shifts.natShift > REASON_NATIONAL_THRESHOLD) out.push('Lifted by national popularity');
  else if (shifts.natShift < -REASON_NATIONAL_THRESHOLD) out.push('Dragged by national approval');

  if (out.length === 0) out.push('Local voter conditions steady');
  return out;
}

/**
 * Computes state-specific monthly family financial impact ($/month)
 * adjusting national social relief by state exposure and regional price parity (SOC-05).
 */
export function calculateStateFamilyRelief(
  stateCode: string,
  draft?: SocialDraft
): number {
  if (!draft || isSocialBaseline(draft)) return 0;
  const exp = getStateExposure(stateCode);
  if (!exp) return 0;

  const acaRelief = (socialDev(draft, 'aca') / SOCIAL_INDEX_STEP_FINE) * C.acaFamilyRelief * (exp.uninsuredRate / NAT_UNINSURED_BASELINE);
  const drugRelief = (socialDev(draft, 'drg') / SOCIAL_PERCENT_STEP) * C.drugFamilySavings * (exp.seniorShare / NAT_SENIOR_BASELINE);
  const pubRelief = socialDev(draft, 'pub') * C.publicOptionPremiumRelief * (exp.uninsuredRate / NAT_UNINSURED_BASELINE);
  const visaBenefit = (socialDev(draft, 'vis') / SOCIAL_INDEX_STEP) * C.visaFamilyBenefit * (exp.immigrantLaborShare / NAT_IMMIGRANT_LABOR_BASELINE);
  const regBenefit = socialDev(draft, 'reg') * C.regularizationFamilyRelief * (exp.immigrantLaborShare / NAT_IMMIGRANT_LABOR_BASELINE);
  const cleanBenefit = (socialDev(draft, 'cln') / SOCIAL_INDEX_STEP) * C.cleanEnergyFamilyRelief * exp.cleanEnergyGrowth;
  const fossilBenefit = (socialDev(draft, 'fos') / SOCIAL_INDEX_STEP) * C.fossilPermittingFamilyRelief * (exp.energy / NAT_FOSSIL_ENERGY_BASELINE);
  const carbonCost = (socialDev(draft, 'crb') / SOCIAL_PERCENT_STEP) * C.carbonStandardCost * exp.carbonIntensity;
  const titleIBenefit = (socialDev(draft, 'k12') / SOCIAL_INDEX_STEP_FINE) * C.titleIFamilyRelief * (exp.childPovertyRate / NAT_CHILD_POVERTY_BASELINE);
  const debtRelief = (socialDev(draft, 'sdr') / SOCIAL_PERCENT_STEP) * C.studentDebtMonthlyRelief * (exp.studentDebtShare / NAT_STUDENT_DEBT_BASELINE);
  const prekRelief = socialDev(draft, 'prek') * C.universalPreKFamilyRelief * (exp.youngFamilyShare / NAT_YOUNG_FAMILY_BASELINE);

  const rawRelief = acaRelief + drugRelief + pubRelief + visaBenefit + regBenefit +
                    cleanBenefit + fossilBenefit - carbonCost + titleIBenefit + debtRelief + prekRelief;

  const rppFactor = (exp.rpp ?? RPP_BASE_INDEX) / RPP_BASE_INDEX;
  return round(rawRelief / rppFactor);
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

  // 3. Compute regional social shifts centered around national average (SOC-05)
  let meanSocialShift = 0;
  const rawSocialShifts: number[] = [];

  if (!isUnadjusted && state.socialPolicy && !isSocialBaseline(state.socialPolicy)) {
    const draft = state.socialPolicy;
    let sumSocial = 0;
    for (const raw of RAW_UNITS) {
      const exp = getStateExposure(raw.code) ?? getStateExposure(raw.stateCode) ?? {
        farm: 0,
        manufacturing: 0,
        energy: 0,
        fossilEnergy: 0,
        seniorShare: 0,
        uninsuredRate: 0,
        borderState: false,
        immigrantLaborShare: 0,
        cleanEnergyGrowth: 0,
        carbonIntensity: 1,
        childPovertyRate: 0,
        studentDebtShare: 0,
        youngFamilyShare: 0,
        rpp: RPP_BASE_INDEX,
      };
      const aca = (socialDev(draft, 'aca') / SOCIAL_MAX_DEV) * (exp.uninsuredRate / NAT_UNINSURED_BASELINE) * C.voterAcaSensitivity;
      const drg = (socialDev(draft, 'drg') / SOCIAL_PERCENT_MAX) * (exp.seniorShare / NAT_SENIOR_BASELINE) * C.voterDrugPriceSensitivity;
      const pub = socialDev(draft, 'pub') * (exp.uninsuredRate / NAT_UNINSURED_BASELINE) * C.voterPublicOptionSensitivity;
      const bdrDev = socialDev(draft, 'bdr') / SOCIAL_NARROW_MAX_DEV;
      const bdr = exp.borderState ? bdrDev * C.voterBorderSecuritySensitivity : 0;
      const vis = (socialDev(draft, 'vis') / SOCIAL_MAX_DEV) * (exp.immigrantLaborShare / NAT_IMMIGRANT_LABOR_BASELINE) * C.voterVisaLaborSensitivity;
      const reg = socialDev(draft, 'reg') * (exp.immigrantLaborShare / NAT_IMMIGRANT_LABOR_BASELINE) * C.voterRegularizationSensitivity;
      const cln = (socialDev(draft, 'cln') / SOCIAL_MAX_DEV) * (exp.cleanEnergyGrowth / NAT_CLEAN_ENERGY_BASELINE) * C.voterCleanEnergySensitivity;
      const fos = (socialDev(draft, 'fos') / SOCIAL_MAX_DEV) * (exp.energy / NAT_FOSSIL_ENERGY_BASELINE) * C.voterFossilPermittingSensitivity;
      const crb = -(socialDev(draft, 'crb') / SOCIAL_PERCENT_MAX) * exp.carbonIntensity * C.voterCarbonStandardPenalty;
      const k12 = (socialDev(draft, 'k12') / SOCIAL_NARROW_MAX_DEV) * (exp.childPovertyRate / NAT_CHILD_POVERTY_BASELINE) * C.voterTitleIEducationSensitivity;
      const sdr = (socialDev(draft, 'sdr') / SOCIAL_PERCENT_MAX) * (exp.studentDebtShare / NAT_STUDENT_DEBT_BASELINE) * C.voterStudentDebtSensitivity;
      const prek = socialDev(draft, 'prek') * (exp.youngFamilyShare / NAT_YOUNG_FAMILY_BASELINE) * C.voterUniversalPreKSensitivity;
      const famRelief = calculateStateFamilyRelief(raw.code, draft);
      const relief = (famRelief / FAMILY_RELIEF_UNIT_DOLLARS) * C.voterFamilyReliefElasticity;
      const totalShift = aca + drg + pub + bdr + vis + reg + cln + fos + crb + k12 + sdr + prek + relief;
      rawSocialShifts.push(totalShift);
      sumSocial += totalShift;
    }
    meanSocialShift = sumSocial / rawSocialShifts.length;
  }

  // 4. First pass: compute margins and candidate vote tallies
  interface ComputedUnit {
    readonly raw: RawUnit;
    readonly baselineMargin: number;
    readonly currentMargin: number;
    readonly supportPct: number;
    readonly supportDelta: number;
    readonly leaning: VoterLeaning;
    readonly reasons: readonly string[];
    readonly familyReliefMonthly?: number;
    readonly rppIndex?: number;
  }

  const computed: ComputedUnit[] = [];

  for (let unitIdx = 0; unitIdx < RAW_UNITS.length; unitIdx++) {
    const raw = RAW_UNITS[unitIdx]!;
    const unadjustedBase = unadjustedPlayerMargin(raw, side);
    const baselineMargin = unadjustedBase - tipOffset;

    const exp = getStateExposure(raw.code) ?? getStateExposure(raw.stateCode) ?? {
      farm: 0,
      manufacturing: 0,
      energy: 0,
      fossilEnergy: 0,
      seniorShare: 0,
      uninsuredRate: 0,
      borderState: false,
      immigrantLaborShare: 0,
      cleanEnergyGrowth: 0,
      carbonIntensity: 1,
      childPovertyRate: 0,
      studentDebtShare: 0,
      youngFamilyShare: 0,
      rpp: RPP_BASE_INDEX,
    };
    const farmShift = isUnadjusted ? 0 : -tariffDev * exp.farm * C.voterFarmTariffSensitivity;
    const mfgShift = isUnadjusted ? 0 : growthDev * exp.manufacturing * C.voterMfgGrowthSensitivity;
    const energyShift = isUnadjusted ? 0 : -inflDev * exp.energy * C.voterEnergyInflationSensitivity;
    const retaliatoryRate =
      !isUnadjusted && state.trade
        ? calculateRetaliatoryRate(state.policy.tar ?? state.start.tariff, state.trade.sectorTariffs, state.trade.agreements)
        : 0;
    const retaliatoryShift =
      retaliatoryRate > 0
        ? -retaliatoryRate * (exp.farm * C.retaliatoryAgWeight + exp.manufacturing * C.retaliatoryMfgWeight) * C.retaliatoryVoterSwing
        : 0;
    let totalExposureShift = farmShift + mfgShift + energyShift + retaliatoryShift;

    let drugShift = 0;
    let acaShift = 0;
    let bdrShift = 0;
    let immLaborShift = 0;
    let clnShift = 0;
    let fosShift = 0;
    let crbShift = 0;
    let prekShift = 0;
    let sdrShift = 0;
    let k12Shift = 0;
    let familyReliefMonthly = 0;

    if (!isUnadjusted && state.socialPolicy && !isSocialBaseline(state.socialPolicy)) {
      const draft = state.socialPolicy;

      // 1. Healthcare
      acaShift = (socialDev(draft, 'aca') / SOCIAL_MAX_DEV) * (exp.uninsuredRate / NAT_UNINSURED_BASELINE) * C.voterAcaSensitivity;
      drugShift = (socialDev(draft, 'drg') / SOCIAL_PERCENT_MAX) * (exp.seniorShare / NAT_SENIOR_BASELINE) * C.voterDrugPriceSensitivity;
      const pubShift = socialDev(draft, 'pub') * (exp.uninsuredRate / NAT_UNINSURED_BASELINE) * C.voterPublicOptionSensitivity;

      // 2. Immigration
      const bdrDev = socialDev(draft, 'bdr') / SOCIAL_NARROW_MAX_DEV;
      bdrShift = exp.borderState ? bdrDev * C.voterBorderSecuritySensitivity : 0;
      const visShift = (socialDev(draft, 'vis') / SOCIAL_MAX_DEV) * (exp.immigrantLaborShare / NAT_IMMIGRANT_LABOR_BASELINE) * C.voterVisaLaborSensitivity;
      const regShift = socialDev(draft, 'reg') * (exp.immigrantLaborShare / NAT_IMMIGRANT_LABOR_BASELINE) * C.voterRegularizationSensitivity;
      immLaborShift = visShift + regShift;

      // 3. Energy
      clnShift = (socialDev(draft, 'cln') / SOCIAL_MAX_DEV) * (exp.cleanEnergyGrowth / NAT_CLEAN_ENERGY_BASELINE) * C.voterCleanEnergySensitivity;
      fosShift = (socialDev(draft, 'fos') / SOCIAL_MAX_DEV) * (exp.energy / NAT_FOSSIL_ENERGY_BASELINE) * C.voterFossilPermittingSensitivity;
      crbShift = -(socialDev(draft, 'crb') / SOCIAL_PERCENT_MAX) * exp.carbonIntensity * C.voterCarbonStandardPenalty;

      // 4. Education
      k12Shift = (socialDev(draft, 'k12') / SOCIAL_NARROW_MAX_DEV) * (exp.childPovertyRate / NAT_CHILD_POVERTY_BASELINE) * C.voterTitleIEducationSensitivity;
      sdrShift = (socialDev(draft, 'sdr') / SOCIAL_PERCENT_MAX) * (exp.studentDebtShare / NAT_STUDENT_DEBT_BASELINE) * C.voterStudentDebtSensitivity;
      prekShift = socialDev(draft, 'prek') * (exp.youngFamilyShare / NAT_YOUNG_FAMILY_BASELINE) * C.voterUniversalPreKSensitivity;

      // 5. Cost of living / family relief
      familyReliefMonthly = calculateStateFamilyRelief(raw.code, draft);

      const rawShift = rawSocialShifts[unitIdx] ?? 0;
      const totalSocialShift = rawShift - meanSocialShift;
      totalExposureShift += totalSocialShift;
    }

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
    const reasons = deriveReasons({
      farmShift,
      mfgShift,
      energyShift,
      natShift,
      drugShift,
      acaShift,
      bdrShift,
      immLaborShift,
      clnShift,
      fosShift,
      crbShift,
      prekShift,
      sdrShift,
      k12Shift,
      retaliatoryShift,
    });

    computed.push({
      raw,
      baselineMargin,
      currentMargin,
      supportPct,
      supportDelta,
      leaning,
      reasons,
      familyReliefMonthly,
      rppIndex: exp.rpp,
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
    const isSwing = abs(item.currentMargin) <= C.swingThreshold;

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
      familyReliefMonthly: item.familyReliefMonthly,
      rppIndex: item.rppIndex,
    };

    if (raw.isDistrict) {
      districtsMap[raw.code] = stateObj;
      unitsMap[raw.code] = stateObj;
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
      unitsMap[raw.code] = stateObj;
    }

    if (isSwing && !raw.isDistrict) {
      swingStates.push(statesMap[raw.stateCode] ?? stateObj);
    }
  }

  // 6. Compute honest projection range from Year 3 onward (turn >= 9) (VOT-03)
  let projectionRange: ProjectionRange | undefined = undefined;
  if (!isUnadjusted && state.turn >= PROJECTION_START_TURN) {
    const rawTurns = ELECTION_TURN_1 - state.turn;
    const turnsRemaining = rawTurns < 1 ? 1 : rawTurns;
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
