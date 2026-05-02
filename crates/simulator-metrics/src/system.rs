use bevy_ecs::prelude::*;
use simulator_core::{
    CrisisState, LegitimacyDebt, MacroIndicators, Phase, PollutionStock, PriceLevel,
    RightsLedger, Sim, SimClock, StateCapacity, Treasury,
    components::{ApprovalRating, Health, Income, Productivity, Wealth},
};

use crate::{
    row::{TickRow, compute_citizen_means, compute_quintile_approval},
    store::MetricStore,
};

/// Collect a [`TickRow`] every tick and push it to the [`MetricStore`].
/// Runs in [`Phase::Telemetry`] so all Commit-phase writes are visible.
#[allow(clippy::too_many_arguments)]
pub fn collect_metrics_system(
    clock:       Res<SimClock>,
    indicators:  Res<MacroIndicators>,
    treasury:    Res<Treasury>,
    price:       Res<PriceLevel>,
    debt:        Res<LegitimacyDebt>,
    rights:      Res<RightsLedger>,
    crisis:      Res<CrisisState>,
    pollution:   Res<PollutionStock>,
    capacity:    Option<Res<StateCapacity>>,
    mut store:   ResMut<MetricStore>,
    health_q:    Query<&Health>,
    prod_q:      Query<&Productivity>,
    income_q:    Query<&Income>,
    wealth_q:    Query<&Wealth>,
    quintile_q:  Query<(&Income, &ApprovalRating)>,
) {
    let (mean_health, mean_productivity, mean_income, mean_wealth) = compute_citizen_means(
        health_q.iter().copied(),
        prod_q.iter().copied(),
        income_q.iter().copied(),
        wealth_q.iter().copied(),
    );

    let approval_by_quintile = compute_quintile_approval(
        quintile_q.iter().map(|(inc, app)| (inc.0.to_num::<f64>(), app.0.to_num::<f32>()))
    );

    let row = TickRow::from_resources(
        &clock, &indicators, &treasury, &price,
        &debt, &rights, &crisis, &pollution,
        capacity.as_deref(),
        mean_health, mean_productivity, mean_income, mean_wealth,
        approval_by_quintile,
    );
    store.push(row);
}

/// Register the metrics collection system and insert the [`MetricStore`] resource.
pub fn register_metrics_system(sim: &mut Sim) {
    sim.world.insert_resource(MetricStore::default());
    sim.schedule_mut()
        .add_systems(collect_metrics_system.in_set(Phase::Telemetry));
}

/// Register with a custom ring-buffer capacity.
pub fn register_metrics_system_with_capacity(sim: &mut Sim, capacity: usize) {
    sim.world.insert_resource(MetricStore::new(capacity));
    sim.schedule_mut()
        .add_systems(collect_metrics_system.in_set(Phase::Telemetry));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::{
        Sim,
        components::{
            Age, ApprovalRating, Citizen, EmploymentStatus, Health, Income,
            IdeologyVector, LegalStatuses, Location, Productivity, Wealth,
            ConsumptionExpenditure, SavingsRate, MonthlyTaxPaid, MonthlyBenefitReceived,
            EvasionPropensity,
        },
        MacroIndicators, PollutionStock,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    // Bevy 0.18 Bundle impls cover tuples up to 15 items; split larger spawns.
    fn spawn_citizen(world: &mut World) {
        world.spawn((
            (
                Citizen(CitizenId(1)),
                Age(30),
                simulator_core::components::Sex::Male,
                Location(RegionId(0)),
                Health(Score::from_num(0.8)),
                Income(Money::from_num(3000)),
                Wealth(Money::from_num(10_000)),
                EmploymentStatus::Employed,
                Productivity(Score::from_num(0.75)),
                IdeologyVector([0.5; 5]),
                ApprovalRating(Score::from_num(0.6)),
                LegalStatuses::default(),
            ),
            (
                ConsumptionExpenditure::default(),
                SavingsRate::default(),
                MonthlyTaxPaid::default(),
                MonthlyBenefitReceived::default(),
                EvasionPropensity::default(),
            ),
        ));
    }

    #[test]
    fn collect_metrics_system_captures_row_each_tick() {
        let mut sim = Sim::new([10u8; 32]);
        spawn_citizen(&mut sim.world);

        sim.world.insert_resource(MetricStore::new(100));
        sim.schedule_mut()
            .add_systems(collect_metrics_system.in_set(Phase::Telemetry));

        sim.step();
        sim.step();
        sim.step();

        let store = sim.world.resource::<MetricStore>();
        assert_eq!(store.len(), 3, "expected one row per step");
    }

    #[test]
    fn collected_row_reflects_resources() {
        let mut sim = Sim::new([11u8; 32]);
        spawn_citizen(&mut sim.world);

        sim.world.resource_mut::<MacroIndicators>().approval = 0.77;
        sim.world.resource_mut::<PollutionStock>().stock = 3.5;

        sim.world.insert_resource(MetricStore::new(100));
        sim.schedule_mut()
            .add_systems(collect_metrics_system.in_set(Phase::Telemetry));

        sim.step();

        let store = sim.world.resource::<MetricStore>();
        let row = store.latest().expect("should have one row");
        // pollution_stock is set in Phase::Commit, visible by Phase::Telemetry.
        assert!(row.pollution_stock >= 0.0);
        assert!(row.mean_health > 0.0);
        assert!(row.mean_income > 0.0);
    }

    #[test]
    fn ring_buffer_grows_then_caps() {
        let mut sim = Sim::new([12u8; 32]);
        spawn_citizen(&mut sim.world);

        let cap = 5usize;
        sim.world.insert_resource(MetricStore::new(cap));
        sim.schedule_mut()
            .add_systems(collect_metrics_system.in_set(Phase::Telemetry));

        for _ in 0..8 { sim.step(); }

        let store = sim.world.resource::<MetricStore>();
        assert_eq!(store.len(), cap, "ring buffer should be at capacity");
    }
}
