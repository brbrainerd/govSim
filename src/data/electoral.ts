// Typed accessors and validation for 2024 electoral district margins,
// 119th Congress House delegations, and state industry exposures (VOT-06, GR-13, GR-15).
import raw from '../../data/electoral-2024.json';

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

export interface StateExposure {
  farm: number; // share of state GDP (0..1)
  manufacturing: number;
  energy: number;
}

interface ElectoralDataset {
  retrieved: string;
  citations: Record<string, string>;
  districts: Record<string, ElectoralDistrict>;
  houseDelegations: Record<string, HouseDelegation>;
  exposures: Record<string, StateExposure>;
}

const data = raw as unknown as ElectoralDataset;

export const DISTRICTS: Readonly<Record<string, ElectoralDistrict>> = data.districts;
export const HOUSE_DELEGATIONS: Readonly<Record<string, HouseDelegation>> = data.houseDelegations;
export const STATE_EXPOSURES: Readonly<Record<string, StateExposure>> = data.exposures;
export const ELECTORAL_CITATIONS: Readonly<Record<string, string>> = data.citations;

export function getDistrict(id: string): ElectoralDistrict | undefined {
  return DISTRICTS[id];
}

export function getHouseDelegation(stateCode: string): HouseDelegation | undefined {
  return HOUSE_DELEGATIONS[stateCode];
}

export function getStateExposure(stateCode: string): StateExposure | undefined {
  return STATE_EXPOSURES[stateCode];
}
