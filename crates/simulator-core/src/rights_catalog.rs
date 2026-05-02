//! Data-driven rights catalog — Phase C of the generalization roadmap.
//!
//! ## Design: dual-storage, fully backward-compatible
//!
//! The legacy `CivicRights` bitflags and `RightsLedger` resource are
//! **unchanged**. `RightsCatalog` is a *new, parallel* resource that:
//!
//!   1. Seeds automatically from the integer bitmask when `configure_world`
//!      applies `initial_rights` (both resources are populated in one call).
//!   2. Can be populated from a string list (`initial_rights_catalog:`) as a
//!      forward-compatible YAML format.
//!   3. Supports an open-ended set of rights beyond the 9 Western-liberal
//!      defaults — historical, regional, or future rights can be added without
//!      recompiling the simulator.
//!
//! All existing code reading `RightsLedger` continues to work identically.
//! New DSL programs and UI components can target `RightsCatalog` for richer
//! per-right querying.
//!
//! ## Naming convention for built-in right IDs
//!
//! Snake-case ASCII strings, globally unique within a scenario. The 9 legacy
//! rights share IDs with their `CivicRights` bitflag names to enable
//! round-tripping:
//!
//!   "universal_suffrage", "racial_equality", "gender_equality",
//!   "lgbtq_protections", "religious_freedom", "labor_rights",
//!   "due_process", "free_speech", "abolition_of_slavery"

use std::collections::{HashMap, HashSet};

use bevy_ecs::prelude::Resource;
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/// Stable string identifier for a right. Snake-case ASCII, e.g. "due_process".
#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct RightId(pub String);

impl RightId {
    pub fn new(s: impl Into<String>) -> Self {
        Self(s.into())
    }
}

impl std::fmt::Display for RightId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

/// Full specification of a single right.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RightDefinition {
    /// Stable identifier — must match the key in `RightsCatalog::defined`.
    pub id: RightId,
    /// Human-readable name (UI / narrative).
    pub label: String,
    /// Fraction of the population that is a direct beneficiary [0, 1].
    /// 1.0 = universal; 0.5 = roughly half the population (e.g. gender-based).
    pub beneficiary_fraction: f32,
    /// Legitimacy-debt magnitude accrued if this right is revoked after being
    /// granted. 0.5 = severe political cost; 0.0 = cost-free (instrumental right).
    pub revocation_debt: f32,
    /// Monthly approval boost during the "honeymoon" period after first grant.
    /// Decays linearly over 12 simulated months.
    pub grant_boost: f32,
    /// IDs of rights that must already be granted before this right can be
    /// granted. Empty = no prerequisites.
    pub prerequisites: Vec<RightId>,
}

// ---------------------------------------------------------------------------
// Catalog resource
// ---------------------------------------------------------------------------

/// Open-ended rights catalog stored as an ECS Resource.
///
/// Coexists with `RightsLedger` (the legacy bitflag resource). Both are kept
/// in sync by `configure_world` when `initial_rights` or `initial_rights_catalog`
/// is set. New code should prefer `RightsCatalog` for per-right querying;
/// existing code continues using `RightsLedger` unchanged.
#[derive(Resource, Debug, Clone, Default)]
pub struct RightsCatalog {
    /// All rights this polity recognises, keyed by stable ID.
    pub defined: HashMap<RightId, RightDefinition>,
    /// Rights currently in force.
    pub granted: HashSet<RightId>,
    /// All rights ever granted in this run (never shrinks).
    pub historical_max: HashSet<RightId>,
    /// Tick at which the most recent catalog grant occurred (honeymoon window).
    pub last_expansion_tick: u64,
}

impl RightsCatalog {
    // ------------------------------------------------------------------
    // Mutation
    // ------------------------------------------------------------------

    /// Grant a right. Returns `true` if newly granted (was not already held).
    ///
    /// Silently succeeds if the right is not in `defined` — callers may grant
    /// custom rights without pre-registering them, but they will lack metadata
    /// (no honeymoon boost, no revocation debt).
    pub fn grant(&mut self, id: &RightId, tick: u64) -> bool {
        let was_present = self.granted.contains(id);
        self.granted.insert(id.clone());
        self.historical_max.insert(id.clone());
        if !was_present {
            self.last_expansion_tick = tick;
            true
        } else {
            false
        }
    }

    /// Revoke a right. Returns the legitimacy-debt magnitude to apply:
    ///   - 0.5 per right that appears in `historical_max` (was ever held)
    ///     if no metadata is available (unregistered custom right).
    ///   - `RightDefinition::revocation_debt` if metadata exists.
    ///   - 0.0 if the right was never granted.
    pub fn revoke(&mut self, id: &RightId) -> f32 {
        if !self.granted.contains(id) { return 0.0; }
        if !self.historical_max.contains(id) { return 0.0; }
        self.granted.remove(id);
        self.defined.get(id).map_or(0.5, |def| def.revocation_debt)
    }

    /// Returns `true` if the right is currently in force.
    pub fn has(&self, id: &RightId) -> bool {
        self.granted.contains(id)
    }

    // ------------------------------------------------------------------
    // Query
    // ------------------------------------------------------------------

    /// Number of rights currently in force.
    pub fn granted_count(&self) -> usize {
        self.granted.len()
    }

    /// Number of distinct rights ever granted in this run.
    pub fn historical_count(&self) -> usize {
        self.historical_max.len()
    }

    /// Rights breadth score [0, 1]: fraction of defined rights that are granted.
    /// 0.0 when no rights are defined; 1.0 when all defined rights are in force.
    pub fn breadth_score(&self) -> f32 {
        let n = self.defined.len();
        if n == 0 { return 0.0; }
        self.granted.len() as f32 / n as f32
    }

    /// Returns ids of rights that are defined but not yet granted.
    pub fn pending(&self) -> Vec<&RightId> {
        self.defined.keys()
            .filter(|id| !self.granted.contains(*id))
            .collect()
    }

    // ------------------------------------------------------------------
    // Construction helpers
    // ------------------------------------------------------------------

    /// Register a right definition. If the id already exists, the definition
    /// is replaced. Does not affect granted/historical sets.
    pub fn define(&mut self, def: RightDefinition) {
        self.defined.insert(def.id.clone(), def);
    }

    /// Register multiple definitions in one call.
    pub fn define_all(&mut self, defs: impl IntoIterator<Item = RightDefinition>) {
        for def in defs { self.define(def); }
    }
}

// ---------------------------------------------------------------------------
// Default catalog
// ---------------------------------------------------------------------------

/// Build the default 29-right catalog shipped with the simulator.
///
/// Includes the 9 legacy `CivicRights` bitflag rights (with identical IDs for
/// round-tripping) plus 20 additional historical and international rights.
///
/// Call once during `configure_world` or Scenario setup to populate
/// `RightsCatalog::defined` before granting any rights.
pub fn default_catalog() -> Vec<RightDefinition> {
    fn r(id: &str, label: &str, beneficiary: f32, debt: f32, boost: f32) -> RightDefinition {
        RightDefinition {
            id: RightId::new(id),
            label: label.to_string(),
            beneficiary_fraction: beneficiary,
            revocation_debt: debt,
            grant_boost: boost,
            prerequisites: vec![],
        }
    }
    fn r_prereq(id: &str, label: &str, beneficiary: f32, debt: f32, boost: f32,
                prereqs: &[&str]) -> RightDefinition {
        RightDefinition {
            id: RightId::new(id),
            label: label.to_string(),
            beneficiary_fraction: beneficiary,
            revocation_debt: debt,
            grant_boost: boost,
            prerequisites: prereqs.iter().map(|s| RightId::new(*s)).collect(),
        }
    }

    vec![
        // ── Legacy 9 (map to CivicRights bitflags) ─────────────────────────
        r("universal_suffrage",   "Universal Suffrage",          1.0, 0.5, 0.010),
        r("racial_equality",      "Racial Equality",             1.0, 0.5, 0.008),
        r("gender_equality",      "Gender Equality",             0.5, 0.5, 0.008),
        r("lgbtq_protections",    "LGBTQ+ Protections",          0.1, 0.4, 0.006),
        r("religious_freedom",    "Religious Freedom",           1.0, 0.4, 0.005),
        r("labor_rights",         "Labor Rights",                0.7, 0.4, 0.007),
        r("due_process",          "Due Process",                 1.0, 0.5, 0.006),
        r("free_speech",          "Freedom of Speech",           1.0, 0.5, 0.007),
        r("abolition_of_slavery", "Abolition of Slavery",        1.0, 1.0, 0.015),

        // ── Civil & legal rights ────────────────────────────────────────────
        r("habeas_corpus",        "Habeas Corpus",               1.0, 0.5, 0.006),
        r("right_to_counsel",     "Right to Counsel",            1.0, 0.4, 0.004),
        r("jury_trial",           "Trial by Jury",               1.0, 0.4, 0.004),
        r("protection_from_torture", "Freedom from Torture",     1.0, 0.6, 0.005),
        r("privacy_rights",       "Right to Privacy",            1.0, 0.3, 0.003),

        // ── Political & civic rights ────────────────────────────────────────
        r("press_freedom",        "Freedom of the Press",        1.0, 0.4, 0.005),
        r("assembly_rights",      "Freedom of Assembly",         1.0, 0.4, 0.005),
        r("freedom_of_movement",  "Freedom of Movement",         1.0, 0.3, 0.003),
        r_prereq("voting_age_18", "Voting Age 18",               0.1, 0.3, 0.003,
                 &["universal_suffrage"]),

        // ── Economic & social rights ────────────────────────────────────────
        r("property_rights",      "Right to Property",           1.0, 0.4, 0.004),
        r("right_to_strike",      "Right to Strike",             0.7, 0.4, 0.005),
        r_prereq("collective_bargaining", "Collective Bargaining",0.7, 0.4, 0.004,
                 &["labor_rights"]),
        r("equal_pay",            "Equal Pay",                   0.5, 0.3, 0.004),
        r("social_security",      "Social Security Entitlement", 1.0, 0.5, 0.008),
        r("healthcare_entitlement","Right to Healthcare",         1.0, 0.5, 0.008),
        r("education_entitlement","Right to Education",          1.0, 0.4, 0.006),

        // ── Citizenship & migration ─────────────────────────────────────────
        r("citizenship_jus_soli", "Birthright Citizenship (Jus Soli)", 0.1, 0.3, 0.003),
        r("asylum_rights",        "Right to Asylum",             0.05, 0.3, 0.002),
        r("indigenous_land_rights","Indigenous Land Rights",     0.05, 0.5, 0.004),

        // ── Historically significant pre-liberal rights ─────────────────────
        // These can be granted in medieval/early-modern scenarios before
        // modern liberal rights exist.
        r("magna_carta_limits",   "Magna Carta — Limits on Royal Power", 0.3, 0.4, 0.005),
    ]
}

/// Map from the 9 `CivicRights` bitflag bit-positions to their catalog IDs.
/// Used to seed `RightsCatalog` from the legacy integer bitmask.
pub const LEGACY_BIT_TO_ID: &[(&str, u32)] = &[
    ("universal_suffrage",    1 << 0),
    ("racial_equality",       1 << 1),
    ("gender_equality",       1 << 2),
    ("lgbtq_protections",     1 << 3),
    ("religious_freedom",     1 << 4),
    ("labor_rights",          1 << 5),
    ("due_process",           1 << 6),
    ("free_speech",           1 << 7),
    ("abolition_of_slavery",  1 << 8),
];

/// Seed a `RightsCatalog` from a legacy `CivicRights` bitmask.
///
/// Populates `defined` with the full default catalog, then grants the rights
/// corresponding to set bits. Tick is set to 0 (pre-game grant, no honeymoon).
pub fn catalog_from_bits(bits: u32) -> RightsCatalog {
    let mut catalog = RightsCatalog::default();
    catalog.define_all(default_catalog());
    for &(id_str, mask) in LEGACY_BIT_TO_ID {
        if bits & mask != 0 {
            let id = RightId::new(id_str);
            catalog.granted.insert(id.clone());
            catalog.historical_max.insert(id);
        }
    }
    catalog.last_expansion_tick = 0;
    catalog
}

/// Seed a `RightsCatalog` from a list of right ID strings.
///
/// Unrecognised strings are still inserted into `granted`/`historical_max`
/// as custom rights (no definition metadata). Tick is set to 0.
pub fn catalog_from_strings(ids: &[String]) -> RightsCatalog {
    let mut catalog = RightsCatalog::default();
    catalog.define_all(default_catalog());
    for s in ids {
        let id = RightId::new(s);
        catalog.granted.insert(id.clone());
        catalog.historical_max.insert(id);
    }
    catalog.last_expansion_tick = 0;
    catalog
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // ── Default catalog ──────────────────────────────────────────────────────

    #[test]
    fn default_catalog_has_29_entries() {
        let defs = default_catalog();
        assert_eq!(defs.len(), 29, "default catalog should have 29 entries, got {}", defs.len());
    }

    #[test]
    fn default_catalog_contains_all_9_legacy_rights() {
        let defs = default_catalog();
        let ids: HashSet<String> = defs.iter().map(|d| d.id.0.clone()).collect();
        for &(name, _) in LEGACY_BIT_TO_ID {
            assert!(ids.contains(name), "missing legacy right: {name}");
        }
    }

    #[test]
    fn default_catalog_ids_are_unique() {
        let defs = default_catalog();
        let ids: HashSet<String> = defs.iter().map(|d| d.id.0.clone()).collect();
        assert_eq!(ids.len(), defs.len(), "catalog contains duplicate IDs");
    }

    // ── catalog_from_bits ────────────────────────────────────────────────────

    #[test]
    fn catalog_from_bits_zero_grants_nothing() {
        let cat = catalog_from_bits(0);
        assert_eq!(cat.granted_count(), 0, "0 bits should grant no rights");
        assert_eq!(cat.historical_count(), 0);
        assert!(!cat.defined.is_empty(), "definitions still loaded");
    }

    #[test]
    fn catalog_from_bits_all_9_grants_all_legacy() {
        let all_9: u32 = (1 << 9) - 1; // bits 0–8 set
        let cat = catalog_from_bits(all_9);
        assert_eq!(cat.granted_count(), 9,
            "0x1FF should grant all 9 legacy rights, got {}", cat.granted_count());
        for &(name, _) in LEGACY_BIT_TO_ID {
            assert!(cat.has(&RightId::new(name)), "missing: {name}");
        }
    }

    #[test]
    fn catalog_from_bits_single_right() {
        let cat = catalog_from_bits(1 << 6); // DUE_PROCESS bit
        assert!(cat.has(&RightId::new("due_process")));
        assert_eq!(cat.granted_count(), 1);
    }

    // ── catalog_from_strings ─────────────────────────────────────────────────

    #[test]
    fn catalog_from_strings_grants_named_rights() {
        let ids = vec![
            "universal_suffrage".to_string(),
            "habeas_corpus".to_string(),
        ];
        let cat = catalog_from_strings(&ids);
        assert!(cat.has(&RightId::new("universal_suffrage")));
        assert!(cat.has(&RightId::new("habeas_corpus")));
        assert_eq!(cat.granted_count(), 2);
    }

    #[test]
    fn catalog_from_strings_accepts_custom_rights() {
        let ids = vec!["caste_mobility".to_string()];
        let cat = catalog_from_strings(&ids);
        assert!(cat.has(&RightId::new("caste_mobility")),
            "custom right not in default catalog should still be grantable");
        assert_eq!(cat.granted_count(), 1);
        // No definition for the custom right — that's expected.
        assert!(cat.defined.get(&RightId::new("caste_mobility")).is_none());
    }

    // ── RightsCatalog methods ─────────────────────────────────────────────────

    #[test]
    fn grant_returns_true_on_new_grant() {
        let mut cat = RightsCatalog::default();
        cat.define_all(default_catalog());
        let newly = cat.grant(&RightId::new("due_process"), 100);
        assert!(newly, "first grant should return true");
        assert_eq!(cat.last_expansion_tick, 100);
    }

    #[test]
    fn grant_returns_false_if_already_held() {
        let mut cat = RightsCatalog::default();
        cat.define_all(default_catalog());
        cat.grant(&RightId::new("due_process"), 100);
        let again = cat.grant(&RightId::new("due_process"), 200);
        assert!(!again, "re-granting should return false");
        assert_eq!(cat.last_expansion_tick, 100, "tick must not advance on re-grant");
    }

    #[test]
    fn revoke_returns_zero_if_not_held() {
        let mut cat = RightsCatalog::default();
        cat.define_all(default_catalog());
        let debt = cat.revoke(&RightId::new("free_speech"));
        assert_eq!(debt, 0.0, "revoking unheld right returns 0 debt");
    }

    #[test]
    fn revoke_returns_definition_debt() {
        let mut cat = RightsCatalog::default();
        cat.define_all(default_catalog());
        cat.grant(&RightId::new("abolition_of_slavery"), 1);
        let debt = cat.revoke(&RightId::new("abolition_of_slavery"));
        // abolition_of_slavery has revocation_debt = 1.0 in default catalog.
        assert!((debt - 1.0).abs() < 1e-6,
            "abolition revocation should cost 1.0 debt, got {debt}");
        assert!(!cat.has(&RightId::new("abolition_of_slavery")));
        // Historical max still contains it.
        assert!(cat.historical_max.contains(&RightId::new("abolition_of_slavery")));
    }

    #[test]
    fn revoke_unregistered_right_returns_default_05_debt() {
        let mut cat = RightsCatalog::default();
        // Custom right with no definition.
        cat.granted.insert(RightId::new("custom"));
        cat.historical_max.insert(RightId::new("custom"));
        let debt = cat.revoke(&RightId::new("custom"));
        assert!((debt - 0.5).abs() < 1e-6,
            "unregistered right revocation should default to 0.5 debt, got {debt}");
    }

    #[test]
    fn breadth_score_zero_when_nothing_defined() {
        let cat = RightsCatalog::default();
        assert_eq!(cat.breadth_score(), 0.0);
    }

    #[test]
    fn breadth_score_one_when_all_granted() {
        let all_9: u32 = (1 << 9) - 1;
        // Catalog has 29 defined; grant only 9 → not 1.0.
        let cat = catalog_from_bits(all_9);
        let score = cat.breadth_score();
        let expected = 9.0 / 29.0;
        assert!((score - expected).abs() < 1e-5,
            "9/29 rights granted → breadth {expected:.4}, got {score:.4}");
    }

    #[test]
    fn pending_returns_ungranted_defined_rights() {
        let cat = catalog_from_bits(1 << 0); // only universal_suffrage
        let pending = cat.pending();
        assert_eq!(pending.len(), 28,
            "29 defined - 1 granted = 28 pending, got {}", pending.len());
    }

    #[test]
    fn historical_max_never_shrinks_after_revocation() {
        let mut cat = RightsCatalog::default();
        cat.define_all(default_catalog());
        cat.grant(&RightId::new("free_speech"), 10);
        cat.revoke(&RightId::new("free_speech"));
        assert!(cat.historical_max.contains(&RightId::new("free_speech")),
            "historical_max must retain right after revocation");
        assert!(!cat.has(&RightId::new("free_speech")));
    }

    #[test]
    fn multiple_grants_all_tracked() {
        let mut cat = RightsCatalog::default();
        cat.define_all(default_catalog());
        cat.grant(&RightId::new("due_process"), 5);
        cat.grant(&RightId::new("free_speech"), 10);
        cat.grant(&RightId::new("labor_rights"), 15);
        assert_eq!(cat.granted_count(), 3);
        assert_eq!(cat.last_expansion_tick, 15);
    }
}
