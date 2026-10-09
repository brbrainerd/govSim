// Shape of data/us-2026.json — the real starting state (design.md Q19).
// Every number carries its source and as-of date so the "present" can be refreshed.

export interface Sourced<T = number> {
  value: T;
  unit: string;
  asOf: string; // ISO date or period, e.g. "2026-Q2", "2026-08"
  source: string; // publisher + series name
  url: string;
  note?: string;
}

export interface StateRow {
  code: string; // "OH"
  name: string;
  electoralVotes: number;
  population: number;
  margin2024: number; // R minus D, percentage points, 2024 presidential popular vote
}

export interface USData {
  retrieved: string; // date the file was compiled
  economy: {
    gdpNominal: Sourced; // $ trillions, annualized
    realGdpGrowth: Sourced; // % annualized, latest quarter
    unemployment: Sourced; // %
    employmentPopRatio: Sourced; // %
    cpiInflation: Sourced; // % year over year
    fedFundsUpper: Sourced; // %
    tenYearYield: Sourced; // %
    medianHouseholdIncome: Sourced; // $
    gini: Sourced; // 0..1
    lifeExpectancy: Sourced; // years
    population: Sourced; // millions
  };
  fiscal: {
    receipts: Sourced; // $ trillions, fiscal year
    outlays: Sourced;
    deficit: Sourced;
    debtHeldByPublicPctGdp: Sourced; // %
    outlaysByCategory: {
      defense: Sourced; // $ billions
      socialSecurity: Sourced;
      medicare: Sourced;
      medicaid: Sourced;
      nondefenseDiscretionary: Sourced<number | null>; // null until CBO dollar tables are filled in
      netInterest: Sourced;
    };
  };
  taxes: {
    topIncomeRate: Sourced;
    corporateRate: Sourced;
    capitalGainsTopRate: Sourced;
    payrollRate: Sourced; // combined employer + employee, %
    socialSecurityWageBase: Sourced; // $
    effectiveTariffRate: Sourced; // %
  };
  society: {
    trustInGovernment: Sourced; // % who trust federal government most of the time
    violentCrimeRate: Sourced; // per 100k
  };
  politics: {
    house: Sourced<{ republican: number; democrat: number; independent: number; vacant: number }>;
    senate: Sourced<{ republican: number; democrat: number; independent: number }>;
    supremeCourt: Sourced<{ conservative: number; liberal: number }>;
  };
  states: { asOf: string; sources: string[]; rows: StateRow[] };
}
