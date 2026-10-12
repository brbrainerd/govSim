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
