//! ApprovalRatingSystem — Phase::Mutate, monthly.
//!
//! Each citizen's approval of the current government is updated based on their
//! employment status and economic ideology alignment.
//!
//! Model:
//!   Δapproval = employment_shock + reversion + ideology_nudge + noise
//!
//! - employment_shock: +0.002 if employed, -0.004 if unemployed, else 0
//! - reversion: (0.5 - approval) * 0.02 (slow mean-reversion to neutral)
//! - ideology_nudge: econ_axis * 0.001
//! - noise: ±0.001 random walk
//! - Clamped to [0.0, 1.0]
//!
//! MacroIndicators.approval is set to the population mean in macro_indicators_system.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{ApprovalRating, EmploymentStatus, IdeologyVector},
    Phase, Sim, SimClock, SimRng,
};
use simulator_types::Score;
use rand::Rng;

const APPROVAL_PERIOD: u64 = 30;

pub fn approval_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    mut q: Query<(&EmploymentStatus, &IdeologyVector, &mut ApprovalRating)>,
) {
    if !clock.tick.is_multiple_of(APPROVAL_PERIOD) || clock.tick == 0 { return; }

    let mut rng = rng_res.derive("approval", clock.tick);

    for (emp, ideology, mut approval) in q.iter_mut() {
        let a = approval.0.to_num::<f32>();

        let employment_shock = match emp {
            EmploymentStatus::Employed        =>  0.002_f32,
            EmploymentStatus::Unemployed      => -0.004_f32,
            EmploymentStatus::Student         =>  0.001_f32,
            EmploymentStatus::Retired         =>  0.000_f32,
            EmploymentStatus::OutOfLaborForce => -0.001_f32,
        };

        let reversion = (0.5 - a) * 0.02;

        // ideology.0[0] is the economic axis in [-1, 1].
        let ideology_nudge = ideology.0[0] * 0.001;

        let noise: f32 = (rng.random::<f32>() - 0.5) * 0.002;

        let new_a = (a + employment_shock + reversion + ideology_nudge + noise)
            .clamp(0.0, 1.0);

        approval.0 = Score::from_num(new_a);
    }
}

pub fn register_approval_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(approval_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_core::components::{
        Age, Citizen, EmploymentStatus, IdeologyVector, Income, Location,
        LegalStatuses, AuditFlags, Productivity, Sex, Wealth, Health,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn_citizen(world: &mut bevy_ecs::world::World, id: u64, emp: EmploymentStatus, approval: f32) {
        use bevy_ecs::world::World;
        world.spawn((
            Citizen(CitizenId(id)),
            Age(35),
            Sex::Male,
            Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(3000_i32)),
            Wealth(Money::from_num(10000_i32)),
            emp,
            Productivity(Score::from_num(0.7_f32)),
            IdeologyVector([0.0; 5]),
            ApprovalRating(Score::from_num(approval)),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
        ));
    }

    #[test]
    fn employed_approval_rises_unemployed_falls() {
        let mut sim = Sim::new([42u8; 32]);
        register_approval_system(&mut sim);

        spawn_citizen(&mut sim.world, 0, EmploymentStatus::Employed, 0.5);
        spawn_citizen(&mut sim.world, 1, EmploymentStatus::Unemployed, 0.5);

        // Run 3 months.
        for _ in 0..90 { sim.step(); }

        let mut approvals: Vec<(u64, f32)> = sim.world
            .query::<(&Citizen, &ApprovalRating)>()
            .iter(&sim.world)
            .map(|(c, a)| (c.0.0, a.0.to_num::<f32>()))
            .collect();
        approvals.sort_by_key(|(id, _)| *id);

        let (_, employed_a) = approvals[0];
        let (_, unemployed_a) = approvals[1];
        assert!(employed_a > 0.5, "employed approval should rise above 0.5, got {employed_a}");
        assert!(unemployed_a < 0.5, "unemployed approval should fall below 0.5, got {unemployed_a}");
    }
}
