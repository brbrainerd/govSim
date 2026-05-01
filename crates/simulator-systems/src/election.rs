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
    MacroIndicators, Phase, Sim, SimClock,
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

const ELECTION_PERIOD: u64 = 360;

pub fn election_system(
    clock: Res<SimClock>,
    mut outcome: ResMut<ElectionOutcome>,
    mut indicators: ResMut<MacroIndicators>,
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
}
