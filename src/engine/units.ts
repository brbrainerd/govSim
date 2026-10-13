// Unit conversions and turn counts are definitions, not model coefficients, so they sit outside the
// registry and are exempt from the literal scan (FND-07).
export const QUARTERS_PER_YEAR = 4;
export const PERCENT = 100;
export const BN_PER_TN = 1000;
export const BUDGET_WINDOW_YEARS = 10; // budget lever costs are 10-year totals
export const MONTHS_PER_YEAR = 12;
export const TOTAL_TURNS = 32;
export const LEGACY_QUARTERS = 40;
export const FOREVER = 1_000_000; // finite "never ends" turn: Infinity does not survive JSON

export const TOTAL_ELECTORAL_VOTES = 538;
export const TO_WIN_ELECTORAL_VOTES = 270;
export const MIDTERM_TURN_1 = 8;
export const MIDTERM_TURN_2 = 24;
export const ELECTION_TURN_1 = 16;
export const ELECTION_TURN_2 = 32;
export const PROJECTION_START_TURN = 9;

export const ME_AT_LARGE_EV = 2;
export const NE_AT_LARGE_EV = 2;
export const DISTRICT_EV = 1;
export const BASE_PERCENT = 50;
export const HALF_DIVISOR = 2;
export const MIN_SUPPORT_PCT = 15;
export const MAX_SUPPORT_PCT = 85;
export const REASON_IMPACT_THRESHOLD = 0.5;
export const REASON_NATIONAL_THRESHOLD = 1.0;

export const TOTAL_STATES = 50;
export const TO_WIN_CONTINGENT_STATES = 26;

export const MAX_ELECTION_REASONS = 3;
export const ELECTION_REASON_APPROVAL_DELTA = 3;
export const ELECTION_REASON_INFLATION_HIGH = 1.5;
export const ELECTION_REASON_INFLATION_LOW = 0.5;
export const ELECTION_REASON_UNEMPLOYMENT_LOW = 0.5;
export const ELECTION_REASON_REAL_INCOME_HIGH = 2.0;

export const HISTORIAN_TRANSFORMATIONAL_THRESHOLD = 10.0;
export const HISTORIAN_STABILITY_THRESHOLD = 3.0;
export const HISTORIAN_MIXED_LOW_THRESHOLD = -2.9;
export const HISTORIAN_CRISIS_LOW_THRESHOLD = -9.9;

export const SOCIAL_INDEX_BASE = 100;
export const SOCIAL_INDEX_MIN = 50;
export const SOCIAL_INDEX_MAX = 150;
export const SOCIAL_INDEX_STEP = 10;
export const SOCIAL_INDEX_STEP_FINE = 5;
export const SOCIAL_NARROW_MIN = 70;
export const SOCIAL_NARROW_MAX = 140;
export const SOCIAL_PERCENT_MIN = 0;
export const SOCIAL_PERCENT_MAX = 100;
export const SOCIAL_PERCENT_STEP = 10;
export const SOCIAL_BINARY_BASE = 0;
export const SOCIAL_BINARY_MAX = 1;
export const SOCIAL_BINARY_STEP = 1;

export const RPP_BASE_INDEX = 100;
export const FAMILY_RELIEF_UNIT_DOLLARS = 10;

export const SENIOR_COHORT_SHARE = 0.20;
export const WORKING_CLASS_COHORT_SHARE = 0.26;
export const YOUNG_FAMILY_COHORT_SHARE = 0.22;
export const COLLEGE_COHORT_SHARE = 0.24;
export const IMMIGRANT_COHORT_SHARE = 0.15;
export const ENERGY_AG_COHORT_SHARE = 0.08;

