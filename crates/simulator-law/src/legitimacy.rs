//! `legitimacy_update_system` — Phase::Mutate, monthly.
//!
//! Drains accumulated repeal-debt from the LawRegistry into the global
//! `LegitimacyDebt` resource and applies the configured monthly decay.
//! Together with the approval system's reading of LegitimacyDebt, this
//! implements the policy-ratchet dynamic: removing entrenched programs
//! has a lasting political cost that fades over months, not instantly.

use simulator_core::{
    bevy_ecs::prelude::*,
    LegitimacyDebt, Phase, Sim, SimClock,
};

use crate::registry::LawRegistry;

const LEGITIMACY_PERIOD: u64 = 30;

pub fn legitimacy_update_system(
    clock: Res<SimClock>,
    registry: Res<LawRegistry>,
    mut debt: ResMut<LegitimacyDebt>,
) {
    if !clock.tick.is_multiple_of(LEGITIMACY_PERIOD) || clock.tick == 0 { return; }

    let new_debt = registry.drain_repeal_debt();
    debt.stock = (debt.stock + new_debt) * debt.decay;
}

pub fn register_legitimacy_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(legitimacy_update_system.in_set(Phase::Mutate));
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dsl::ast::{Program, Scope};
    use crate::registry::{LawEffect, LawHandle, LawId, LawRegistry};
    use crate::system::Cadence;
    use simulator_core::Sim;
    use std::sync::Arc;

    fn make_dummy_benefit_law(id: u64) -> LawHandle {
        LawHandle {
            id: LawId(id),
            version: 1,
            program: Arc::new(Program {
                scopes: vec![Scope { name: "X".into(), params: vec![], items: vec![] }],
            }),
            cadence: Cadence::Yearly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::PerCitizenBenefit { scope: "X", amount_def: "amount" },
        }
    }

    #[test]
    fn benefit_repeal_increases_debt_then_decays() {
        let mut sim = Sim::new([3u8; 32]);
        sim.world.insert_resource(LawRegistry::default());
        register_legitimacy_system(&mut sim);

        let registry = sim.world.resource::<LawRegistry>().clone();
        let id = registry.enact(make_dummy_benefit_law(0));
        registry.repeal(id, 0);

        // Step until the monthly tick fires (tick 30 → step 31).
        for _ in 0..31 { sim.step(); }
        let after_first = sim.world.resource::<LegitimacyDebt>().stock;
        assert!(after_first > 0.0, "debt should be > 0 after monthly drain, got {after_first}");

        // Run another month with no repeals — debt should decay.
        for _ in 0..30 { sim.step(); }
        let after_second = sim.world.resource::<LegitimacyDebt>().stock;
        assert!(
            after_second < after_first,
            "debt should decay with no new repeals: {after_first} -> {after_second}"
        );
    }
}
