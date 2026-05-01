//! ApprovalRatingSystem — Phase::Mutate, monthly.
//!
//! Each citizen's approval of the current government is updated based on their
//! employment status, fiscal policy, and economic ideology alignment.
//!
//! Model:
//!   Δapproval = employment_shock + tax_shock + spend_shock + reversion + ideology_nudge + noise
//!
//! - employment_shock: +0.002 if employed, -0.004 if unemployed, else 0
//! - tax_shock: ideology-weighted penalty from effective tax rate;
//!   right-leaning citizens (ideology[0] < 0) react more negatively to high taxes
//! - spend_shock: ideology-weighted boost from government spending ratio;
//!   left-leaning citizens (ideology[0] > 0) react more positively to high spending
//! - reversion: (0.5 - approval) * 0.02 (slow mean-reversion to neutral)
//! - ideology_nudge: econ_axis * 0.001
//! - noise: ±0.001 random walk
//! - Clamped to [0.0, 1.0]
//!
//! MacroIndicators.approval is set to the population mean in macro_indicators_system.
//!
//! Fiscal convention: ideology[0] in [-1,1] where +1 = left (pro-spending), -1 = right (anti-tax).
//!
//! Per-citizen fiscal shocks (Phase 22): if MonthlyTaxPaid / MonthlyBenefitReceived
//! are present, the individual effective tax rate and benefit ratio replace the
//! macro-level proxy for more accurate, heterogeneous responses. Citizens without
//! those components fall back to the aggregate macro signal.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{
        ApprovalRating, Citizen, EmploymentStatus, IdeologyVector,
        MonthlyBenefitReceived, MonthlyTaxPaid,
    },
    LegitimacyDebt, MacroIndicators, Phase, Sim, SimClock, SimRng,
};
use simulator_types::Score;
use rand::Rng;

const APPROVAL_PERIOD: u64 = 30;

#[allow(clippy::type_complexity)]
pub fn approval_system(
    clock: Res<SimClock>,
    rng_res: Res<SimRng>,
    macro_: Res<MacroIndicators>,
    debt: Res<LegitimacyDebt>,
    mut q: Query<(
        &Citizen,
        &EmploymentStatus,
        &IdeologyVector,
        &mut ApprovalRating,
        Option<&MonthlyTaxPaid>,
        Option<&MonthlyBenefitReceived>,
    )>,
) {
    if !clock.tick.is_multiple_of(APPROVAL_PERIOD) || clock.tick == 0 { return; }

    // Legitimacy debt is felt by every citizen as a uniform negative shock.
    let legitimacy_shock = -debt.stock * 0.10;

    let gdp = macro_.gdp.to_num::<f64>().max(1.0);
    let macro_tax_rate   = (macro_.government_revenue.to_num::<f64>()     / gdp).clamp(0.0, 1.0) as f32;
    let macro_spend_rate = (macro_.government_expenditure.to_num::<f64>() / gdp).clamp(0.0, 1.0) as f32;

    for (citizen, emp, ideology, mut approval, tax_opt, benefit_opt) in q.iter_mut() {
        let a = approval.0.to_num::<f32>();

        let employment_shock = match emp {
            EmploymentStatus::Employed        =>  0.002_f32,
            EmploymentStatus::Unemployed      => -0.004_f32,
            EmploymentStatus::Student         =>  0.001_f32,
            EmploymentStatus::Retired         =>  0.000_f32,
            EmploymentStatus::OutOfLaborForce => -0.001_f32,
        };

        let econ = ideology.0[0]; // [-1, 1], +1 = left, -1 = right

        // Per-citizen effective tax rate: tax paid / (income proxy via monthly cycle).
        // Falls back to macro aggregate when not tracked.
        let citizen_tax_rate = tax_opt
            .map(|t| {
                let monthly = macro_.gdp.to_num::<f64>() / macro_.population.max(1) as f64 / 12.0;
                (t.0.to_num::<f64>() / monthly.max(1.0)).clamp(0.0, 1.0) as f32
            })
            .unwrap_or(macro_tax_rate);

        let citizen_benefit_rate = benefit_opt
            .map(|b| {
                let monthly = macro_.gdp.to_num::<f64>() / macro_.population.max(1) as f64 / 12.0;
                (b.0.to_num::<f64>() / monthly.max(1.0)).clamp(0.0, 1.0) as f32
            })
            .unwrap_or(macro_spend_rate);

        let tax_shock   = -citizen_tax_rate   * (1.0 - econ) * 0.01;
        let spend_shock =  citizen_benefit_rate * (1.0 + econ) * 0.005;

        let reversion     = (0.5 - a) * 0.02;
        let ideology_nudge = econ * 0.001;

        let mut rng = rng_res.derive_citizen("approval", clock.tick, citizen.0.0);
        let noise: f32 = (rng.random::<f32>() - 0.5) * 0.002;

        let new_a = (a + employment_shock + tax_shock + spend_shock + legitimacy_shock + reversion + ideology_nudge + noise)
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
    use simulator_core::{MacroIndicators, Sim};
    use simulator_core::components::{
        Age, Citizen, EmploymentStatus, IdeologyVector, Income, Location,
        LegalStatuses, AuditFlags, Productivity, Sex, Wealth, Health,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn_citizen_ideology(
        world: &mut bevy_ecs::world::World,
        id: u64,
        emp: EmploymentStatus,
        approval: f32,
        ideology_econ: f32,
    ) {
        let mut iv = [0.0f32; 5];
        iv[0] = ideology_econ;
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
            IdeologyVector(iv),
            ApprovalRating(Score::from_num(approval)),
            LegalStatuses(Default::default()),
            AuditFlags(Default::default()),
        ));
    }

    fn spawn_citizen(world: &mut bevy_ecs::world::World, id: u64, emp: EmploymentStatus, approval: f32) {
        spawn_citizen_ideology(world, id, emp, approval, 0.0);
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

    #[test]
    fn right_leaning_loses_more_approval_under_high_taxes() {
        // High tax burden: government collects 40% of GDP.
        // Right-leaning citizen (ideology=-1) should lose more approval than left-leaning (+1).
        let mut sim_right = Sim::new([7u8; 32]);
        let mut sim_left  = Sim::new([7u8; 32]);
        register_approval_system(&mut sim_right);
        register_approval_system(&mut sim_left);

        let gdp = Money::from_num(1_000_000_i64);
        let revenue = Money::from_num(400_000_i64); // 40% effective tax rate

        {
            let mut m = sim_right.world.resource_mut::<MacroIndicators>();
            m.gdp = gdp;
            m.government_revenue = revenue;
        }
        {
            let mut m = sim_left.world.resource_mut::<MacroIndicators>();
            m.gdp = gdp;
            m.government_revenue = revenue;
        }

        // Both start at 0.5 approval, employed, same seed — only ideology differs.
        spawn_citizen_ideology(&mut sim_right.world, 0, EmploymentStatus::Employed, 0.5, -1.0);
        spawn_citizen_ideology(&mut sim_left.world,  0, EmploymentStatus::Employed, 0.5,  1.0);

        // 31 steps: schedule runs at tick=30 (step 31), triggering the monthly system.
        for _ in 0..31 { sim_right.step(); }
        for _ in 0..31 { sim_left.step(); }

        let right_a: f32 = sim_right.world
            .query::<&ApprovalRating>()
            .single(&sim_right.world)
            .unwrap().0.to_num();
        let left_a: f32 = sim_left.world
            .query::<&ApprovalRating>()
            .single(&sim_left.world)
            .unwrap().0.to_num();

        assert!(
            right_a < left_a,
            "right-leaning ({right_a}) should have lower approval than left-leaning ({left_a}) under high tax burden"
        );
    }

    #[test]
    fn legitimacy_debt_drags_approval_down() {
        use simulator_core::LegitimacyDebt;
        // Two identical sims, one with elevated LegitimacyDebt — its approval
        // should fall faster.
        let mut sim_clean = Sim::new([55u8; 32]);
        let mut sim_debt  = Sim::new([55u8; 32]);
        register_approval_system(&mut sim_clean);
        register_approval_system(&mut sim_debt);

        // Inject a sizable legitimacy debt into sim_debt before stepping.
        sim_debt.world.resource_mut::<LegitimacyDebt>().stock = 1.0;

        spawn_citizen(&mut sim_clean.world, 0, EmploymentStatus::Employed, 0.5);
        spawn_citizen(&mut sim_debt.world,  0, EmploymentStatus::Employed, 0.5);

        for _ in 0..31 { sim_clean.step(); }
        for _ in 0..31 { sim_debt.step(); }

        let clean_a: f32 = sim_clean.world
            .query::<&ApprovalRating>().single(&sim_clean.world).unwrap().0.to_num();
        let debt_a:  f32 = sim_debt.world
            .query::<&ApprovalRating>().single(&sim_debt.world).unwrap().0.to_num();

        assert!(
            debt_a < clean_a,
            "high-debt sim ({debt_a}) should have lower approval than clean ({clean_a})"
        );
    }

    #[test]
    fn left_leaning_gains_more_approval_from_high_spending() {
        // High government spending: 50% of GDP.
        // Left-leaning citizen should gain more approval than right-leaning.
        let mut sim_right = Sim::new([11u8; 32]);
        let mut sim_left  = Sim::new([11u8; 32]);
        register_approval_system(&mut sim_right);
        register_approval_system(&mut sim_left);

        let gdp = Money::from_num(1_000_000_i64);
        let expenditure = Money::from_num(500_000_i64); // 50% spending ratio

        {
            let mut m = sim_right.world.resource_mut::<MacroIndicators>();
            m.gdp = gdp;
            m.government_expenditure = expenditure;
        }
        {
            let mut m = sim_left.world.resource_mut::<MacroIndicators>();
            m.gdp = gdp;
            m.government_expenditure = expenditure;
        }

        spawn_citizen_ideology(&mut sim_right.world, 0, EmploymentStatus::Employed, 0.5, -1.0);
        spawn_citizen_ideology(&mut sim_left.world,  0, EmploymentStatus::Employed, 0.5,  1.0);

        for _ in 0..31 { sim_right.step(); }
        for _ in 0..31 { sim_left.step(); }

        let right_a: f32 = sim_right.world
            .query::<&ApprovalRating>()
            .single(&sim_right.world)
            .unwrap().0.to_num();
        let left_a: f32 = sim_left.world
            .query::<&ApprovalRating>()
            .single(&sim_left.world)
            .unwrap().0.to_num();

        assert!(
            left_a > right_a,
            "left-leaning ({left_a}) should have higher approval than right-leaning ({right_a}) under high spending"
        );
    }
}
