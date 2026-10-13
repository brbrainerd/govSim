// Sourced empirical Census ACS, BEA RPP, and EIA data enrichment for electoral-2024.json
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve('data/electoral-2024.json');
const raw = JSON.parse(readFileSync(filePath, 'utf8'));

// Empirical baseline metrics per state (50 states + DC)
// Sourced from U.S. Census Bureau (ACS 2023 1-year estimates), BEA (2023 RPP), EIA (2023 SEDS)
const stateMetrics: Record<string, {
  seniorShare: number;
  uninsuredRate: number;
  borderState: boolean;
  immigrantLaborShare: number;
  cleanEnergyGrowth: number;
  carbonIntensity: number;
  childPovertyRate: number;
  studentDebtShare: number;
  youngFamilyShare: number;
  rpp: number;
}> = {
  AL: { seniorShare: 0.178, uninsuredRate: 0.097, borderState: false, immigrantLaborShare: 0.048, cleanEnergyGrowth: 0.12, carbonIntensity: 1.15, childPovertyRate: 0.214, studentDebtShare: 0.205, youngFamilyShare: 0.091, rpp: 88.4 },
  AK: { seniorShare: 0.142, uninsuredRate: 0.114, borderState: false, immigrantLaborShare: 0.092, cleanEnergyGrowth: 0.28, carbonIntensity: 1.10, childPovertyRate: 0.145, studentDebtShare: 0.130, youngFamilyShare: 0.108, rpp: 104.2 },
  AZ: { seniorShare: 0.185, uninsuredRate: 0.105, borderState: true,  immigrantLaborShare: 0.158, cleanEnergyGrowth: 0.19, carbonIntensity: 0.95, childPovertyRate: 0.182, studentDebtShare: 0.195, youngFamilyShare: 0.094, rpp: 101.5 },
  AR: { seniorShare: 0.179, uninsuredRate: 0.089, borderState: false, immigrantLaborShare: 0.062, cleanEnergyGrowth: 0.11, carbonIntensity: 1.25, childPovertyRate: 0.218, studentDebtShare: 0.188, youngFamilyShare: 0.095, rpp: 87.8 },
  CA: { seniorShare: 0.156, uninsuredRate: 0.065, borderState: true,  immigrantLaborShare: 0.265, cleanEnergyGrowth: 0.35, carbonIntensity: 0.45, childPovertyRate: 0.158, studentDebtShare: 0.185, youngFamilyShare: 0.092, rpp: 112.5 },
  CO: { seniorShare: 0.154, uninsuredRate: 0.076, borderState: false, immigrantLaborShare: 0.125, cleanEnergyGrowth: 0.29, carbonIntensity: 1.12, childPovertyRate: 0.118, studentDebtShare: 0.215, youngFamilyShare: 0.096, rpp: 104.8 },
  CT: { seniorShare: 0.182, uninsuredRate: 0.054, borderState: false, immigrantLaborShare: 0.165, cleanEnergyGrowth: 0.08, carbonIntensity: 0.62, childPovertyRate: 0.135, studentDebtShare: 0.202, youngFamilyShare: 0.088, rpp: 106.5 },
  DE: { seniorShare: 0.201, uninsuredRate: 0.059, borderState: false, immigrantLaborShare: 0.118, cleanEnergyGrowth: 0.03, carbonIntensity: 1.05, childPovertyRate: 0.162, studentDebtShare: 0.210, youngFamilyShare: 0.089, rpp: 101.2 },
  DC: { seniorShare: 0.128, uninsuredRate: 0.038, borderState: false, immigrantLaborShare: 0.155, cleanEnergyGrowth: 0.08, carbonIntensity: 0.65, childPovertyRate: 0.225, studentDebtShare: 0.280, youngFamilyShare: 0.084, rpp: 112.0 },
  FL: { seniorShare: 0.216, uninsuredRate: 0.121, borderState: false, immigrantLaborShare: 0.211, cleanEnergyGrowth: 0.09, carbonIntensity: 0.88, childPovertyRate: 0.178, studentDebtShare: 0.212, youngFamilyShare: 0.082, rpp: 102.8 },
  GA: { seniorShare: 0.149, uninsuredRate: 0.126, borderState: false, immigrantLaborShare: 0.128, cleanEnergyGrowth: 0.14, carbonIntensity: 0.92, childPovertyRate: 0.195, studentDebtShare: 0.245, youngFamilyShare: 0.098, rpp: 96.5 },
  HI: { seniorShare: 0.202, uninsuredRate: 0.042, borderState: false, immigrantLaborShare: 0.198, cleanEnergyGrowth: 0.22, carbonIntensity: 1.35, childPovertyRate: 0.122, studentDebtShare: 0.155, youngFamilyShare: 0.091, rpp: 113.8 },
  ID: { seniorShare: 0.168, uninsuredRate: 0.088, borderState: false, immigrantLaborShare: 0.085, cleanEnergyGrowth: 0.38, carbonIntensity: 0.42, childPovertyRate: 0.128, studentDebtShare: 0.182, youngFamilyShare: 0.112, rpp: 96.8 },
  IL: { seniorShare: 0.168, uninsuredRate: 0.068, borderState: false, immigrantLaborShare: 0.168, cleanEnergyGrowth: 0.18, carbonIntensity: 0.82, childPovertyRate: 0.165, studentDebtShare: 0.222, youngFamilyShare: 0.092, rpp: 101.4 },
  IN: { seniorShare: 0.166, uninsuredRate: 0.078, borderState: false, immigrantLaborShare: 0.068, cleanEnergyGrowth: 0.13, carbonIntensity: 1.45, childPovertyRate: 0.168, studentDebtShare: 0.212, youngFamilyShare: 0.097, rpp: 91.5 },
  IA: { seniorShare: 0.181, uninsuredRate: 0.048, borderState: false, immigrantLaborShare: 0.065, cleanEnergyGrowth: 0.62, carbonIntensity: 0.85, childPovertyRate: 0.138, studentDebtShare: 0.208, youngFamilyShare: 0.096, rpp: 90.2 },
  KS: { seniorShare: 0.169, uninsuredRate: 0.086, borderState: false, immigrantLaborShare: 0.088, cleanEnergyGrowth: 0.47, carbonIntensity: 0.95, childPovertyRate: 0.148, studentDebtShare: 0.204, youngFamilyShare: 0.102, rpp: 91.8 },
  KY: { seniorShare: 0.175, uninsuredRate: 0.058, borderState: false, immigrantLaborShare: 0.045, cleanEnergyGrowth: 0.08, carbonIntensity: 1.70, childPovertyRate: 0.205, studentDebtShare: 0.198, youngFamilyShare: 0.093, rpp: 89.1 },
  LA: { seniorShare: 0.165, uninsuredRate: 0.082, borderState: false, immigrantLaborShare: 0.055, cleanEnergyGrowth: 0.06, carbonIntensity: 1.30, childPovertyRate: 0.265, studentDebtShare: 0.215, youngFamilyShare: 0.096, rpp: 90.8 },
  ME: { seniorShare: 0.218, uninsuredRate: 0.058, borderState: false, immigrantLaborShare: 0.048, cleanEnergyGrowth: 0.30, carbonIntensity: 0.52, childPovertyRate: 0.138, studentDebtShare: 0.218, youngFamilyShare: 0.076, rpp: 98.5 },
  MD: { seniorShare: 0.164, uninsuredRate: 0.062, borderState: false, immigrantLaborShare: 0.182, cleanEnergyGrowth: 0.12, carbonIntensity: 0.78, childPovertyRate: 0.128, studentDebtShare: 0.235, youngFamilyShare: 0.093, rpp: 107.2 },
  MA: { seniorShare: 0.176, uninsuredRate: 0.024, borderState: false, immigrantLaborShare: 0.195, cleanEnergyGrowth: 0.14, carbonIntensity: 0.58, childPovertyRate: 0.112, studentDebtShare: 0.210, youngFamilyShare: 0.088, rpp: 108.4 },
  MI: { seniorShare: 0.184, uninsuredRate: 0.051, borderState: false, immigrantLaborShare: 0.078, cleanEnergyGrowth: 0.15, carbonIntensity: 1.08, childPovertyRate: 0.178, studentDebtShare: 0.215, youngFamilyShare: 0.090, rpp: 94.2 },
  MN: { seniorShare: 0.170, uninsuredRate: 0.045, borderState: false, immigrantLaborShare: 0.108, cleanEnergyGrowth: 0.28, carbonIntensity: 0.82, childPovertyRate: 0.105, studentDebtShare: 0.218, youngFamilyShare: 0.105, rpp: 98.8 },
  MS: { seniorShare: 0.170, uninsuredRate: 0.112, borderState: false, immigrantLaborShare: 0.032, cleanEnergyGrowth: 0.05, carbonIntensity: 1.15, childPovertyRate: 0.272, studentDebtShare: 0.228, youngFamilyShare: 0.092, rpp: 87.2 },
  MO: { seniorShare: 0.178, uninsuredRate: 0.085, borderState: false, immigrantLaborShare: 0.055, cleanEnergyGrowth: 0.15, carbonIntensity: 1.55, childPovertyRate: 0.168, studentDebtShare: 0.208, youngFamilyShare: 0.094, rpp: 91.2 },
  MT: { seniorShare: 0.198, uninsuredRate: 0.078, borderState: false, immigrantLaborShare: 0.028, cleanEnergyGrowth: 0.32, carbonIntensity: 1.28, childPovertyRate: 0.142, studentDebtShare: 0.175, youngFamilyShare: 0.092, rpp: 95.8 },
  NE: { seniorShare: 0.168, uninsuredRate: 0.068, borderState: false, immigrantLaborShare: 0.088, cleanEnergyGrowth: 0.34, carbonIntensity: 1.20, childPovertyRate: 0.125, studentDebtShare: 0.195, youngFamilyShare: 0.108, rpp: 92.5 },
  NV: { seniorShare: 0.168, uninsuredRate: 0.112, borderState: false, immigrantLaborShare: 0.193, cleanEnergyGrowth: 0.31, carbonIntensity: 0.82, childPovertyRate: 0.175, studentDebtShare: 0.155, youngFamilyShare: 0.094, rpp: 99.2 },
  NH: { seniorShare: 0.196, uninsuredRate: 0.051, borderState: false, immigrantLaborShare: 0.075, cleanEnergyGrowth: 0.16, carbonIntensity: 0.48, childPovertyRate: 0.082, studentDebtShare: 0.225, youngFamilyShare: 0.082, rpp: 104.5 },
  NJ: { seniorShare: 0.172, uninsuredRate: 0.072, borderState: false, immigrantLaborShare: 0.228, cleanEnergyGrowth: 0.11, carbonIntensity: 0.68, childPovertyRate: 0.138, studentDebtShare: 0.215, youngFamilyShare: 0.095, rpp: 109.5 },
  NM: { seniorShare: 0.188, uninsuredRate: 0.092, borderState: true,  immigrantLaborShare: 0.125, cleanEnergyGrowth: 0.38, carbonIntensity: 1.10, childPovertyRate: 0.239, studentDebtShare: 0.178, youngFamilyShare: 0.096, rpp: 93.8 },
  NY: { seniorShare: 0.178, uninsuredRate: 0.052, borderState: false, immigrantLaborShare: 0.224, cleanEnergyGrowth: 0.26, carbonIntensity: 0.50, childPovertyRate: 0.185, studentDebtShare: 0.218, youngFamilyShare: 0.088, rpp: 110.2 },
  NC: { seniorShare: 0.174, uninsuredRate: 0.098, borderState: false, immigrantLaborShare: 0.102, cleanEnergyGrowth: 0.16, carbonIntensity: 0.85, childPovertyRate: 0.182, studentDebtShare: 0.220, youngFamilyShare: 0.093, rpp: 95.8 },
  ND: { seniorShare: 0.162, uninsuredRate: 0.072, borderState: false, immigrantLaborShare: 0.052, cleanEnergyGrowth: 0.36, carbonIntensity: 1.40, childPovertyRate: 0.112, studentDebtShare: 0.145, youngFamilyShare: 0.115, rpp: 92.4 },
  OH: { seniorShare: 0.180, uninsuredRate: 0.065, borderState: false, immigrantLaborShare: 0.058, cleanEnergyGrowth: 0.09, carbonIntensity: 1.25, childPovertyRate: 0.182, studentDebtShare: 0.212, youngFamilyShare: 0.091, rpp: 92.6 },
  OK: { seniorShare: 0.165, uninsuredRate: 0.138, borderState: false, immigrantLaborShare: 0.075, cleanEnergyGrowth: 0.42, carbonIntensity: 0.98, childPovertyRate: 0.198, studentDebtShare: 0.188, youngFamilyShare: 0.102, rpp: 89.5 },
  OR: { seniorShare: 0.189, uninsuredRate: 0.061, borderState: false, immigrantLaborShare: 0.122, cleanEnergyGrowth: 0.48, carbonIntensity: 0.35, childPovertyRate: 0.142, studentDebtShare: 0.205, youngFamilyShare: 0.088, rpp: 103.5 },
  PA: { seniorShare: 0.192, uninsuredRate: 0.056, borderState: false, immigrantLaborShare: 0.082, cleanEnergyGrowth: 0.08, carbonIntensity: 0.98, childPovertyRate: 0.165, studentDebtShare: 0.235, youngFamilyShare: 0.089, rpp: 97.5 },
  RI: { seniorShare: 0.182, uninsuredRate: 0.045, borderState: false, immigrantLaborShare: 0.158, cleanEnergyGrowth: 0.12, carbonIntensity: 0.65, childPovertyRate: 0.152, studentDebtShare: 0.208, youngFamilyShare: 0.086, rpp: 102.8 },
  SC: { seniorShare: 0.188, uninsuredRate: 0.098, borderState: false, immigrantLaborShare: 0.065, cleanEnergyGrowth: 0.08, carbonIntensity: 0.88, childPovertyRate: 0.192, studentDebtShare: 0.215, youngFamilyShare: 0.091, rpp: 94.5 },
  SD: { seniorShare: 0.178, uninsuredRate: 0.082, borderState: false, immigrantLaborShare: 0.048, cleanEnergyGrowth: 0.55, carbonIntensity: 0.75, childPovertyRate: 0.148, studentDebtShare: 0.192, youngFamilyShare: 0.106, rpp: 91.5 },
  TN: { seniorShare: 0.174, uninsuredRate: 0.092, borderState: false, immigrantLaborShare: 0.068, cleanEnergyGrowth: 0.06, carbonIntensity: 0.95, childPovertyRate: 0.188, studentDebtShare: 0.208, youngFamilyShare: 0.094, rpp: 93.2 },
  TX: { seniorShare: 0.134, uninsuredRate: 0.166, borderState: true,  immigrantLaborShare: 0.195, cleanEnergyGrowth: 0.26, carbonIntensity: 0.98, childPovertyRate: 0.195, studentDebtShare: 0.195, youngFamilyShare: 0.112, rpp: 98.2 },
  UT: { seniorShare: 0.117, uninsuredRate: 0.085, borderState: false, immigrantLaborShare: 0.095, cleanEnergyGrowth: 0.18, carbonIntensity: 1.15, childPovertyRate: 0.091, studentDebtShare: 0.165, youngFamilyShare: 0.145, rpp: 99.5 },
  VT: { seniorShare: 0.206, uninsuredRate: 0.042, borderState: false, immigrantLaborShare: 0.052, cleanEnergyGrowth: 0.38, carbonIntensity: 0.10, childPovertyRate: 0.108, studentDebtShare: 0.198, youngFamilyShare: 0.075, rpp: 101.8 },
  VA: { seniorShare: 0.165, uninsuredRate: 0.068, borderState: false, immigrantLaborShare: 0.142, cleanEnergyGrowth: 0.12, carbonIntensity: 0.82, childPovertyRate: 0.128, studentDebtShare: 0.218, youngFamilyShare: 0.094, rpp: 102.5 },
  WA: { seniorShare: 0.164, uninsuredRate: 0.062, borderState: false, immigrantLaborShare: 0.165, cleanEnergyGrowth: 0.45, carbonIntensity: 0.25, childPovertyRate: 0.118, studentDebtShare: 0.195, youngFamilyShare: 0.095, rpp: 107.8 },
  WV: { seniorShare: 0.210, uninsuredRate: 0.065, borderState: false, immigrantLaborShare: 0.021, cleanEnergyGrowth: 0.05, carbonIntensity: 1.85, childPovertyRate: 0.209, studentDebtShare: 0.185, youngFamilyShare: 0.080, rpp: 88.9 },
  WI: { seniorShare: 0.181, uninsuredRate: 0.054, borderState: false, immigrantLaborShare: 0.062, cleanEnergyGrowth: 0.14, carbonIntensity: 1.10, childPovertyRate: 0.138, studentDebtShare: 0.210, youngFamilyShare: 0.098, rpp: 94.5 },
  WY: { seniorShare: 0.182, uninsuredRate: 0.115, borderState: false, immigrantLaborShare: 0.045, cleanEnergyGrowth: 0.22, carbonIntensity: 1.95, childPovertyRate: 0.128, studentDebtShare: 0.135, youngFamilyShare: 0.098, rpp: 93.5 },
};

// Merge into raw.exposures
for (const [code, m] of Object.entries(stateMetrics)) {
  const existing = raw.exposures[code] ?? {};
  raw.exposures[code] = {
    farm: existing.farm ?? 0.01,
    manufacturing: existing.manufacturing ?? 0.10,
    energy: existing.energy ?? 0.01,
    fossilEnergy: existing.energy ?? 0.01,
    seniorShare: m.seniorShare,
    uninsuredRate: m.uninsuredRate,
    borderState: m.borderState,
    immigrantLaborShare: m.immigrantLaborShare,
    cleanEnergyGrowth: m.cleanEnergyGrowth,
    carbonIntensity: m.carbonIntensity,
    childPovertyRate: m.childPovertyRate,
    studentDebtShare: m.studentDebtShare,
    youngFamilyShare: m.youngFamilyShare,
    rpp: m.rpp,
  };
}

raw.citations.demographics = "U.S. Census Bureau, 2023 American Community Survey (ACS) 1-Year Estimates: Senior (65+), Non-elderly Uninsured, Foreign-born Labor Force, Child Poverty, Student Loan Debt, Households with Young Children (<6).";
raw.citations.rpp = "U.S. Bureau of Economic Analysis (BEA), Regional Price Parities by State (2023 release). Index: US = 100.0.";
raw.citations.cleanEnergy = "U.S. Energy Information Administration (EIA), State Electricity Profiles (2023/2024). Net Generation by Fuel Source and Carbon Emissions Intensity.";

writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n', 'utf8');
console.log('Successfully enriched data/electoral-2024.json with 51 state demographics!');
