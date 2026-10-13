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
export const SOCIAL_MAX_DEV = 50;
export const SOCIAL_NARROW_MAX_DEV = 40;

export const RPP_BASE_INDEX = 100;
export const FAMILY_RELIEF_UNIT_DOLLARS = 10;

export const NAT_UNINSURED_BASELINE = 0.08;
export const NAT_SENIOR_BASELINE = 0.175;
export const NAT_IMMIGRANT_LABOR_BASELINE = 0.185;
export const NAT_CLEAN_ENERGY_BASELINE = 0.15;
export const NAT_FOSSIL_ENERGY_BASELINE = 0.03;
export const NAT_CHILD_POVERTY_BASELINE = 0.16;
export const NAT_STUDENT_DEBT_BASELINE = 0.20;
export const NAT_YOUNG_FAMILY_BASELINE = 0.095;

export const SENIOR_COHORT_SHARE = 20;
export const WORKING_CLASS_COHORT_SHARE = 26;
export const YOUNG_FAMILY_COHORT_SHARE = 22;
export const COLLEGE_COHORT_SHARE = 24;
export const IMMIGRANT_COHORT_SHARE = 15;
export const ENERGY_AG_COHORT_SHARE = 8;

// Senate Cloture & Filibuster Thresholds (REF-01)
export const SENATE_CLOTURE_60 = 60;
export const SENATE_CLOTURE_55 = 55;
export const SENATE_SIMPLE_MAJORITY = 51;
export const SENATE_TOTAL_SEATS = 100;
export const SENATE_BASE_SEATS = 50;

// Judicial & Electoral Reform Constants (REF-02, REF-03)
export const BENCH_EXPANSION_SEATS = 2;
export const RCV_GRANT_BN = 2.5;
export const REDISTRICTING_GRANT_BN = 0.5;
export const MATCHING_GRANT_BN = 4.5;
export const BENCH_STARTING_CONSERVATIVE = 6;
export const BENCH_STARTING_LIBERAL = 3;

export const REFORM_CLOUT_TERM_LIMITS = 25;
export const REFORM_CLOUT_ETHICS = 20;
export const REFORM_CLOUT_EXPANSION = 40;
export const REFORM_CLOUT_RCV = 15;
export const REFORM_CLOUT_REDISTRICTING = 20;
export const REFORM_CLOUT_MATCHING = 25;

export const COURT_UPHOLD_FLOOR = 0.05;
export const COURT_UPHOLD_CEIL = 0.95;

// Article V Constitutional Amendments (Phase 11, REF-04)
export const AMENDMENT_HOUSE_THRESHOLD = 290;
export const AMENDMENT_SENATE_THRESHOLD = 67;
export const AMENDMENT_STATES_TO_RATIFY = 38;
export const AMENDMENT_TOTAL_STATES = 50;
export const AMENDMENT_EXPIRY_TURNS = 28;
export const AMENDMENT_DIVIDED_APPROVAL_MIN = 55;
export const AMENDMENT_OPPOSED_APPROVAL_MIN = 65;
export const AMENDMENT_ALIGNED_RATIFY_BASE_CHANCE = 0.6;
export const AMENDMENT_DIVIDED_RATIFY_BASE_CHANCE = 0.25;
export const AMENDMENT_OPPOSED_RATIFY_BASE_CHANCE = 0.08;

export const AMENDMENT_APPEAL_JUDICIAL_TERMS = 0.8;
export const AMENDMENT_APPEAL_CAMPAIGN_FINANCE = 0.85;
export const AMENDMENT_APPEAL_EQUAL_RIGHTS = 0.4;
export const AMENDMENT_APPEAL_BALANCED_BUDGET = 0.45;

export const AMENDMENT_HOUSE_BASE_JUDICIAL = 295;
export const AMENDMENT_HOUSE_BASE_CAMPAIGN = 290;
export const AMENDMENT_HOUSE_BASE_PARTISAN = 225;
export const AMENDMENT_APPROVAL_SLOPE = 0.5;
export const AMENDMENT_SENATE_CROSSOVER_SCALE = 20;

// Household Impact Card (Phase 12, HOU-01, HOU-02)
export const INCOME_TIER_LOW = 35_000;
export const INCOME_TIER_SERVICE = 42_000;
export const INCOME_TIER_MEDIAN = 65_000;
export const INCOME_TIER_UPPER_MIDDLE = 105_000;
export const INCOME_TIER_HIGH = 160_000;
export const PAYROLL_TAX_CAP = 184_500;
export const ESSENTIALS_BASKET_BASE = 1400; // $/mo base groceries/goods basket
export const LOW_INCOME_BASKET_SHARE_BOOST = 0.20;
export const BASKET_SCALE_SINGLE = 0.7;
export const BASKET_SCALE_COUPLE = 1.0;
export const BASKET_SCALE_SENIOR = 0.8;
export const BASKET_SCALE_CHILD = 0.15;
export const DEFAULT_RPP_FACTOR = 1.0;
export const DEFAULT_CARBON_INTENSITY = 1.0;
export const DEFAULT_CLEAN_ENERGY_GROWTH = 1.0;

// Geopolitical Crises (Phase 13, CRISIS-01, CRISIS-02, CRISIS-03)
export const GEOPOLITICAL_COUNTDOWN_TURNS = 2;
export const GEOPOLITICAL_FIRST_TURN_MIN = 3;
export const GEOPOLITICAL_MIN_SPACING = 3;
export const GEOPOLITICAL_TARGET_TERM1_MIN = 1;
export const GEOPOLITICAL_TARGET_TERM1_MAX = 2;
export const GEOPOLITICAL_TERM1_MAX_TURN = 15;
export const GEOPOLITICAL_TERM2_START_TURN = 18;
export const GEOPOLITICAL_TERM2_MAX_TURN = 30;

// Foreign Policy & Sanctions (Phase 14, FORPOL-01, FORPOL-02, FORPOL-03)
export const FOREIGN_ASSISTANCE_BASE = 100;
export const FOREIGN_ASSISTANCE_MIN = 0;
export const FOREIGN_ASSISTANCE_MAX = 200;
export const FOREIGN_ASSISTANCE_STEP = 5;

// International Trade & Tariffs (Phase 16, TRADE-01, TRADE-02, TRADE-03)
export const EXPORT_GDP_SHARE = 0.11;
export const IMPORT_GDP_SHARE = 0.14;
export const TARIFF_IMPORT_ELASTICITY = 0.005;
export const ROUND_TENTHS = 10;
export const ROUND_HUNDREDTHS = 100;
export const DEFAULT_GDP_ESTIMATE = 28000;
export const DEFAULT_TARIFF_RATE = 11;

// Evil Mode & Corrupt Governance Constants (Phase 17, EVIL-01, EVIL-02, EVIL-03)
export const MAX_HEAT = 100;
export const MIN_HEAT = 0;
export const HEAT_SPECIAL_COUNSEL_THRESHOLD = 60;
export const HEAT_IMPEACHMENT_THRESHOLD = 80;
export const HEAT_CONVICTION_THRESHOLD = 90;
export const SENATE_CONVICTION_THRESHOLD = 67;
export const HOUSE_IMPEACHMENT_THRESHOLD = 218;

// Corrupt Executive Levers Constants (Phase 18, LEVER-01, LEVER-02, LEVER-03)
export const EVIL_LEVER_IDS = [
  'crony_contracts',
  'auction_public_lands',
  'sell_tariff_exemptions',
  'solicit_library_donations',
  'fire_inspectors_general',
  'pressure_justice_department',
] as const;

export type EvilLeverId = (typeof EVIL_LEVER_IDS)[number];



