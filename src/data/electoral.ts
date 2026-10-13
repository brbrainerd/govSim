// Typed accessors and validation for 2024 electoral district margins,
// 119th Congress House delegations, and state industry exposures (VOT-06, GR-13, GR-15).
import raw from '../../data/electoral-2024.json' with { type: 'json' };

export interface ElectoralDistrict {
  id: string;
  name: string;
  state: 'ME' | 'NE';
  electoralVotes: number;
  margin2024: number; // R minus D (percentage points)
  winner2024: 'D' | 'R';
  source: string;
  url: string;
}

export interface HouseDelegation {
  democrat: number;
  republican: number;
  total: number;
  majority: 'D' | 'R' | 'split';
}

export interface StateDemographicExposure {
  farm: number; // share of state GDP (0..1)
  manufacturing: number;
  energy: number;
  fossilEnergy: number; // alias/retained from energy
  seniorShare: number; // 65+ population share (0..1)
  uninsuredRate: number; // non-elderly uninsured rate (0..1)
  borderState: boolean; // southern border proximity flag
  immigrantLaborShare: number; // foreign-born share of workforce (0..1)
  cleanEnergyGrowth: number; // renewable electricity generation potential & investment (0..1)
  carbonIntensity: number; // grid emission intensity relative to nat avg (e.g. 0.25..2.0)
  childPovertyRate: number; // school-age child poverty rate (0..1)
  studentDebtShare: number; // adults 20-39 with federal student loans (0..1)
  youngFamilyShare: number; // households with children under 6 (0..1)
  rpp: number; // BEA Regional Price Parity index (US avg = 100.0)
}

export type StateExposure = StateDemographicExposure;

export interface StateLegislature {
  state: string;
  chamberMajority: 'D' | 'R' | 'split';
  senateMajority: 'D' | 'R' | 'split';
  control: 'D' | 'R' | 'split';
}

interface ElectoralDataset {
  retrieved: string;
  citations: Record<string, string>;
  districts: Record<string, ElectoralDistrict>;
  houseDelegations: Record<string, HouseDelegation>;
  exposures: Record<string, StateDemographicExposure>;
  stateLegislatures: Record<string, StateLegislature>;
}

const data = raw as unknown as ElectoralDataset;

export const DISTRICTS: Readonly<Record<string, ElectoralDistrict>> = data.districts;
export const HOUSE_DELEGATIONS: Readonly<Record<string, HouseDelegation>> = data.houseDelegations;
export const STATE_EXPOSURES: Readonly<Record<string, StateDemographicExposure>> = data.exposures;
export const STATE_LEGISLATURES: Readonly<Record<string, StateLegislature>> = data.stateLegislatures;
export const ELECTORAL_CITATIONS: Readonly<Record<string, string>> = data.citations;

export function getDistrict(id: string): ElectoralDistrict | undefined {
  return DISTRICTS[id];
}

export function getHouseDelegation(stateCode: string): HouseDelegation | undefined {
  return HOUSE_DELEGATIONS[stateCode];
}

export function getStateLegislature(stateCode: string): StateLegislature | undefined {
  return STATE_LEGISLATURES[stateCode];
}

export function getStateExposure(stateCode: string): StateDemographicExposure | undefined {
  if (STATE_EXPOSURES[stateCode]) {
    return STATE_EXPOSURES[stateCode];
  }
  const base = stateCode.split('-')[0];
  return base ? STATE_EXPOSURES[base] : undefined;
}
