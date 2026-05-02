//! ElectionSystem — Phase::Commit, every 360 ticks (one election per year).
//!
//! Two-party model:
//!   Party A ("Progressive")  — appeals to citizens with economic_axis < 0
//!   Party B ("Conservative") — appeals to citizens with economic_axis > 0
//!
//! Each citizen casts a weighted vote based on:
//!   - Partisan lean: ideology.0[0] (economic axis, [-1, 1])
//!   - Satisfaction bonus: (approval - 0.5) * 2.0 biases toward incumbent
//!
//! vote_a = lean_a_score + incumbent_bonus_a
//! vote_b = lean_b_score + incumbent_bonus_b
//!
//! Aggregate totals determine the winner. Result is stored in `ElectionOutcome`.

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{ApprovalRating, IdeologyVector, LegalStatusFlags, LegalStatuses},
    CrisisKind, CrisisState, LegitimacyDebt, MacroIndicators, Phase, Sim, SimClock,
};

#[derive(Resource, Default, Debug, Clone)]
pub struct ElectionOutcome {
    /// 0 = no election yet, 1 = Party A (Progressive), 2 = Party B (Conservative)
    pub incumbent: u8,
    /// Tick of the last election.
    pub last_election_tick: u64,
    /// Margin of victory: (winner_share - loser_share) in [-1, 1].
    pub margin: f32,
    /// Consecutive terms the incumbent has won (resets on party flip).
    pub consecutive_terms: u32,
}

/// Ticks between elections (one simulated year = 360 ticks).
pub const ELECTION_PERIOD: u64 = 360;

pub fn election_system(
    clock: Res<SimClock>,
    mut outcome: ResMut<ElectionOutcome>,
    mut indicators: ResMut<MacroIndicators>,
    debt: Res<LegitimacyDebt>,
    crisis: Res<CrisisState>,
    q: Query<(&LegalStatuses, &IdeologyVector, &ApprovalRating)>,
) {
    if !clock.tick.is_multiple_of(ELECTION_PERIOD) || clock.tick == 0 { return; }

    let mut vote_a: f64 = 0.0;
    let mut vote_b: f64 = 0.0;
    let mut n: u64 = 0;

    for (legal, ideology, approval) in q.iter() {
        // Only registered voters participate.
        if !legal.0.contains(LegalStatusFlags::REGISTERED_VOTER) { continue; }

        let econ = ideology.0[0] as f64; // [-1, 1]: negative = left/progressive
        let satisfaction = (approval.0.to_num::<f64>() - 0.5) * 2.0; // [-1, 1]

        // Base lean: left citizens lean toward A, right toward B.
        let lean_a =  (-econ + 1.0) * 0.5; // maps [-1,1] → [1, 0]
        let lean_b =  ( econ + 1.0) * 0.5; // maps [-1,1] → [0, 1]

        // Satisfaction bonus to incumbent: satisfied citizens re-elect, dissatisfied oust.
        let incum_bonus = if outcome.incumbent == 1 {
            satisfaction * 0.2
        } else if outcome.incumbent == 2 {
            -satisfaction * 0.2
        } else {
            0.0
        };

        vote_a += lean_a + incum_bonus;
        vote_b += lean_b - incum_bonus;
        n += 1;
    }

    if n == 0 { return; }

    // Legitimacy debt drag: each unit of accumulated debt reduces the incumbent's
    // vote share proportionally — people punish a government that has eroded norms.
    let legitimacy_drag = debt.stock as f64 * 0.05 * n as f64;
    if outcome.incumbent == 1 {
        vote_a = (vote_a - legitimacy_drag).max(0.0);
    } else if outcome.incumbent == 2 {
        vote_b = (vote_b - legitimacy_drag).max(0.0);
    }

    // Crisis modifiers: rally effect for War/NaturalDisaster, penalty for Recession/Pandemic.
    let crisis_bonus: f64 = match crisis.kind {
        CrisisKind::War             =>  0.05 * n as f64,
        CrisisKind::NaturalDisaster =>  0.02 * n as f64,
        CrisisKind::Recession       => -0.10 * n as f64,
        CrisisKind::Pandemic        => -0.03 * n as f64,
        CrisisKind::None            =>  0.0,
    };
    if outcome.incumbent == 1 {
        vote_a = (vote_a + crisis_bonus).max(0.0);
    } else if outcome.incumbent == 2 {
        vote_b = (vote_b + crisis_bonus).max(0.0);
    }

    // Incumbency fatigue: each term beyond 2 applies a drag on the incumbent's
    // total equal to 5% of the registered electorate, making long rule less sticky.
    if outcome.consecutive_terms >= 3 {
        let drag = 0.05 * (outcome.consecutive_terms - 2) as f64 * n as f64;
        if outcome.incumbent == 1 {
            vote_a = (vote_a - drag).max(0.0);
        } else if outcome.incumbent == 2 {
            vote_b = (vote_b - drag).max(0.0);
        }
    }

    let total = vote_a + vote_b;
    let share_a = vote_a / total;
    let winner = if share_a >= 0.5 { 1u8 } else { 2u8 };
    let margin = ((share_a - 0.5) * 2.0).abs() as f32;

    let same_party = winner == outcome.incumbent;
    let consecutive = if same_party { outcome.consecutive_terms + 1 } else { 1 };

    tracing::info!(
        tick = clock.tick,
        winner = if winner == 1 { "Progressive (A)" } else { "Conservative (B)" },
        share_a = format!("{:.1}%", share_a * 100.0),
        margin = format!("{:.3}", margin),
        consecutive_terms = consecutive,
        "election result"
    );

    *outcome = ElectionOutcome {
        incumbent: winner,
        last_election_tick: clock.tick,
        margin,
        consecutive_terms: consecutive,
    };

    // Mirror into MacroIndicators so telemetry and IPC see it without
    // depending on simulator-systems.
    indicators.incumbent_party    = winner;
    indicators.last_election_tick = clock.tick;
    indicators.election_margin    = margin;
    indicators.consecutive_terms  = consecutive;
}

pub fn register_election_system(sim: &mut Sim) {
    sim.world.insert_resource(ElectionOutcome::default());
    sim.schedule_mut()
        .add_systems(election_system.in_set(Phase::Commit));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_core::components::{
        Age, ApprovalRating, AuditFlags, Citizen, EmploymentStatus, IdeologyVector,
        Income, LegalStatuses, Location, Productivity, Sex, Wealth, Health,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn(world: &mut World, id: u64, econ_ideology: f32, approval: f32) {
        use simulator_core::components::LegalStatusFlags;
        world.spawn((
            Citizen(CitizenId(id)),
            Age(35), Sex::Male, Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(3000_i32)),
            Wealth(Money::from_num(10000_i32)),
            EmploymentStatus::Employed,
            Productivity(Score::from_num(0.5_f32)),
            IdeologyVector([econ_ideology, 0.0, 0.0, 0.0, 0.0]),
            ApprovalRating(Score::from_num(approval)),
            LegalStatuses(LegalStatusFlags::REGISTERED_VOTER | LegalStatusFlags::CITIZEN),
            AuditFlags(Default::default()),
        ));
    }

    #[test]
    fn left_leaning_electorate_elects_progressive() {
        let mut sim = Sim::new([1u8; 32]);
        register_election_system(&mut sim);

        // 8 progressive-leaning + 2 conservative-leaning citizens.
        for i in 0..8 { spawn(&mut sim.world, i, -0.8, 0.5); }
        for i in 8..10 { spawn(&mut sim.world, i, 0.8, 0.5); }

        // Step 361 times: schedule processes ticks 0..360; election fires at tick 360.
        for _ in 0..=360 { sim.step(); }

        let outcome = sim.world.resource::<ElectionOutcome>();
        assert_eq!(outcome.incumbent, 1, "progressive should win with left-leaning electorate");
        assert!(outcome.margin > 0.0);
    }

    #[test]
    fn high_legitimacy_debt_hurts_incumbent() {
        use simulator_core::LegitimacyDebt;
        // Balanced electorate (5 left, 5 right, neutral approval) with Party A incumbent.
        // High legitimacy debt should drag Party A's votes and flip the outcome.
        let mut sim_clean = Sim::new([3u8; 32]);
        let mut sim_debt  = Sim::new([3u8; 32]);
        register_election_system(&mut sim_clean);
        register_election_system(&mut sim_debt);

        sim_clean.world.resource_mut::<ElectionOutcome>().incumbent = 1;
        sim_debt.world.resource_mut::<ElectionOutcome>().incumbent  = 1;

        // Inject high legitimacy debt only in sim_debt.
        sim_debt.world.resource_mut::<LegitimacyDebt>().stock = 3.0;

        // Balanced ideology, neutral approval — without debt both should stay at A.
        for i in 0..5 { spawn(&mut sim_clean.world, i, -0.05, 0.5); }
        for i in 5..10 { spawn(&mut sim_clean.world, i, 0.05, 0.5); }
        for i in 0..5 { spawn(&mut sim_debt.world, i, -0.05, 0.5); }
        for i in 5..10 { spawn(&mut sim_debt.world, i, 0.05, 0.5); }

        for _ in 0..=360 { sim_clean.step(); }
        for _ in 0..=360 { sim_debt.step(); }

        let clean_margin = sim_clean.world.resource::<ElectionOutcome>().margin;
        let debt_margin  = sim_debt.world.resource::<ElectionOutcome>().margin;

        // Debt should reduce Party A's margin (possibly flipping to B).
        assert!(
            debt_margin < clean_margin || sim_debt.world.resource::<ElectionOutcome>().incumbent == 2,
            "legitimacy debt should reduce or flip incumbent's margin (clean={clean_margin:.3}, debt={debt_margin:.3})"
        );
    }

    #[test]
    fn dissatisfied_electorate_ousts_incumbent() {
        let mut sim = Sim::new([2u8; 32]);
        register_election_system(&mut sim);

        sim.world.resource_mut::<ElectionOutcome>().incumbent = 1; // Party A incumbent
        for i in 0..5 { spawn(&mut sim.world, i, -0.1, 0.1); } // slightly left, very dissatisfied
        for i in 5..10 { spawn(&mut sim.world, i, 0.1, 0.1); } // slightly right, very dissatisfied

        for _ in 0..=360 { sim.step(); }

        let outcome = sim.world.resource::<ElectionOutcome>();
        // Dissatisfied citizens with Party A incumbent → satisfaction bonus flips to B.
        assert_eq!(outcome.incumbent, 2, "dissatisfied electorate should oust incumbent (A→B)");
    }

    #[test]
    fn same_party_re_election_increments_consecutive_terms() {
        // Start with Party A incumbent (terms=1). Strongly left-leaning electorate
        // should re-elect A → consecutive_terms becomes 2.
        let mut sim = Sim::new([9u8; 32]);
        register_election_system(&mut sim);

        {
            let mut o = sim.world.resource_mut::<ElectionOutcome>();
            o.incumbent = 1;
            o.consecutive_terms = 1;
        }

        // 10 strongly left-leaning, high approval → Party A wins comfortably.
        for i in 0..10 { spawn(&mut sim.world, i, -0.9, 0.8); }

        for _ in 0..=360 { sim.step(); }

        let outcome = sim.world.resource::<ElectionOutcome>();
        assert_eq!(outcome.incumbent, 1, "strongly left electorate should re-elect Party A");
        assert_eq!(outcome.consecutive_terms, 2,
            "second consecutive win should give consecutive_terms=2, got {}",
            outcome.consecutive_terms);
    }

    #[test]
    fn recession_crisis_hurts_incumbent_margin() {
        // Two identical balanced sims: one has an active Recession crisis, one is clean.
        // Recession penalty should reduce or flip incumbent's margin.
        let mut sim_clean = Sim::new([20u8; 32]);
        let mut sim_rec   = Sim::new([20u8; 32]);
        register_election_system(&mut sim_clean);
        register_election_system(&mut sim_rec);

        // Party A incumbent in both.
        sim_clean.world.resource_mut::<ElectionOutcome>().incumbent = 1;
        sim_rec.world.resource_mut::<ElectionOutcome>().incumbent   = 1;

        // Inject a Recession crisis into sim_rec.
        {
            let mut cs = sim_rec.world.resource_mut::<CrisisState>();
            cs.kind = CrisisKind::Recession;
            cs.remaining_ticks = 9_999; // still active at election time
        }

        // Neutral electorate (half left, half right, neutral approval).
        for i in 0..5  { spawn(&mut sim_clean.world, i, -0.05, 0.5); }
        for i in 5..10 { spawn(&mut sim_clean.world, i,  0.05, 0.5); }
        for i in 0..5  { spawn(&mut sim_rec.world,   i, -0.05, 0.5); }
        for i in 5..10 { spawn(&mut sim_rec.world,   i,  0.05, 0.5); }

        for _ in 0..=360 { sim_clean.step(); }
        for _ in 0..=360 { sim_rec.step(); }

        let clean_a = sim_clean.world.resource::<ElectionOutcome>().incumbent;
        let rec_outcome = sim_rec.world.resource::<ElectionOutcome>();
        let clean_margin = sim_clean.world.resource::<ElectionOutcome>().margin;

        // During a recession the incumbent (Party A) should lose margin or be ousted.
        assert!(
            rec_outcome.incumbent != clean_a || rec_outcome.margin < clean_margin,
            "recession crisis should hurt incumbent: clean={{party={clean_a}, margin={clean_margin:.3}}}, \
             recession={{party={}, margin={:.3}}}",
            rec_outcome.incumbent, rec_outcome.margin
        );
    }
}
