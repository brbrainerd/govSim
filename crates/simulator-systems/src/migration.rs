//! MigrationSystem — Phase::Mutate, monthly (30 ticks).
//!
//! Citizens in high-unemployment regions have a small probability of relocating
//! to a region with lower unemployment (economic migration).
//!
//! Algorithm:
//!   1. Compute per-region unemployment rate from live citizen data.
//!   2. Compute the global mean unemployment.
//!   3. Citizens in regions where unemployment > mean + THRESHOLD have a
//!      MIGRATE_PROB chance of moving to a region drawn proportionally to
//!      (1 - region_unemployment) — prefer low-unemployment destinations.
//!
//! This keeps the system O(n) and produces realistic urbanisation dynamics.

use std::collections::HashMap;

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Citizen, EmploymentStatus, Location},
    Phase, Sim, SimClock, SimRng,
};
use simulator_types::RegionId;
use rand::Rng;

const MIGRATION_PERIOD: u64 = 30;
/// Citizens whose region unemployment exceeds mean + this threshold may migrate.
const THRESHOLD: f32 = 0.05;
/// Probability that an eligible citizen moves in any given month.
const MIGRATE_PROB: f32 = 0.002;

pub fn migration_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    mut q: Query<(&Citizen, &EmploymentStatus, &mut Location)>,
) {
    if !clock.tick.is_multiple_of(MIGRATION_PERIOD) || clock.tick == 0 { return; }

    // Pass 1: collect per-region employment counts.
    let mut region_employed: HashMap<u32, u64> = HashMap::new();
    let mut region_total:    HashMap<u32, u64> = HashMap::new();
    for (_c, emp, loc) in q.iter() {
        let r = loc.0.0;
        *region_total.entry(r).or_insert(0) += 1;
        if !matches!(emp, EmploymentStatus::Unemployed) {
            *region_employed.entry(r).or_insert(0) += 1;
        }
    }

    let region_unemp: HashMap<u32, f32> = region_total
        .iter()
        .map(|(&r, &total)| {
            let employed = *region_employed.get(&r).unwrap_or(&0);
            (r, 1.0 - employed as f32 / total as f32)
        })
        .collect();

    if region_unemp.is_empty() { return; }

    let mean_unemp: f32 = region_unemp.values().copied().sum::<f32>() / region_unemp.len() as f32;
    let high_threshold = mean_unemp + THRESHOLD;

    // Build destination weights: regions below the mean are migration targets.
    let destinations: Vec<(u32, f32)> = region_unemp
        .iter()
        .map(|(&r, &u)| (r, (1.0 - u).max(0.0)))
        .collect();
    let dest_total: f32 = destinations.iter().map(|(_, w)| w).sum();
    if dest_total <= 0.0 { return; }

    let mut rng = rng_res.derive("migration", clock.tick);

    // Pass 2: relocate eligible citizens.
    for (_c, _emp, mut loc) in q.iter_mut() {
        let r = loc.0.0;
        let region_u = *region_unemp.get(&r).unwrap_or(&0.0);

        if region_u <= high_threshold { continue; }
        if rng.random::<f32>() >= MIGRATE_PROB { continue; }

        // Weighted random destination (excluding current region if possible).
        let mut target = r;
        let pick: f32 = rng.random::<f32>() * dest_total;
        let mut acc = 0.0_f32;
        for &(dest_r, w) in &destinations {
            acc += w;
            if acc >= pick {
                target = dest_r;
                break;
            }
        }
        if target != r {
            loc.0 = RegionId(target);
        }
    }
}

pub fn register_migration_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(migration_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_core::components::{
        Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus, Health,
        IdeologyVector, Income, LegalStatuses, Location, Productivity, Sex, Wealth,
    };
    use simulator_types::{CitizenId, Money, Score};

    fn spawn(world: &mut World, id: u64, region: u32, emp: EmploymentStatus) {
        world.spawn((
            Citizen(CitizenId(id)),
            Age(30), Sex::Male, Location(RegionId(region)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(3000_i32)),
            Wealth(Money::from_num(5000_i32)),
            emp,
            Productivity(Score::from_num(0.5_f32)),
            IdeologyVector([0.0; 5]),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
        ));
    }

    #[test]
    fn high_unemployment_region_loses_citizens() {
        let mut sim = Sim::new([77u8; 32]);
        register_migration_system(&mut sim);

        // Region 0: all unemployed (high unemployment → source)
        // Region 1: all employed (low unemployment → destination)
        for i in 0..50 { spawn(&mut sim.world, i, 0, EmploymentStatus::Unemployed); }
        for i in 50..100 { spawn(&mut sim.world, i, 1, EmploymentStatus::Employed); }

        // Run 24 months.
        for _ in 0..720 { sim.step(); }

        let in_region_0 = sim.world
            .query::<(&Citizen, &Location)>()
            .iter(&sim.world)
            .filter(|(_, l)| l.0.0 == 0)
            .count();

        assert!(in_region_0 < 50,
            "some citizens should have migrated out of high-unemployment region 0, got {in_region_0}");
    }
}
