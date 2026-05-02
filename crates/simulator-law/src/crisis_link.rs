//! `crisis_link_system` — Phase::Sense.
//!
//! Reads the current `CrisisState` and propagates its `cost_multiplier` into
//! `LawRegistry`, so that `supersede()` and `repeal()` calls during Phase::Mutate
//! automatically scale their legitimacy-debt charges without needing direct
//! access to `CrisisState` at the call site.

use simulator_core::{bevy_ecs::prelude::*, CrisisState, Phase, Sim};
use crate::registry::LawRegistry;

pub fn crisis_link_system(
    crisis: Res<CrisisState>,
    registry: Res<LawRegistry>,
) {
    registry.set_crisis_cost_multiplier(crisis.cost_multiplier);
}

pub fn register_crisis_link_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(crisis_link_system.in_set(Phase::Sense));
}

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::{CrisisKind, CrisisState, Sim};
    use crate::registry::LawRegistry;

    #[test]
    fn crisis_cost_multiplier_propagates_to_registry() {
        let mut sim = Sim::new([1u8; 32]);
        sim.world.insert_resource(LawRegistry::default());
        register_crisis_link_system(&mut sim);

        // Inject an active War crisis (cost_multiplier = 0.50).
        {
            let mut cs = sim.world.resource_mut::<CrisisState>();
            cs.kind = CrisisKind::War;
            cs.cost_multiplier = 0.50;
            cs.remaining_ticks = 360;
        }

        // Step once — crisis_link fires at every tick (Phase::Sense).
        sim.step();

        // Verify the multiplier reached the registry by enacting + repealing
        // a benefit law and checking that debt is halved.
        let reg = sim.world.resource::<LawRegistry>().clone();

        use crate::dsl::ast::{Program, Scope};
        use crate::system::Cadence;
        use crate::registry::{LawEffect, LawHandle, LawId};
        use std::sync::Arc;

        let stub = Arc::new(Program { scopes: vec![Scope { name: "B".into(), params: vec![], items: vec![] }] });
        let id = reg.enact(LawHandle {
            source: None, id: LawId(0), version: 1, program: stub,
            cadence: Cadence::Monthly, effective_from_tick: 0, effective_until_tick: None,
            effect: LawEffect::PerCitizenBenefit { scope: "B", amount_def: "a" },
        });
        reg.repeal(id, 0);

        let debt = reg.drain_repeal_debt();
        // crisis cost_multiplier=0.50 → 0.10 × 0.50 = 0.05
        assert!(
            (debt - 0.05).abs() < 1e-5,
            "with War crisis multiplier=0.50, repeal debt should be 0.05, got {debt}"
        );
    }

    #[test]
    fn no_crisis_leaves_multiplier_at_default() {
        let mut sim = Sim::new([2u8; 32]);
        sim.world.insert_resource(LawRegistry::default());
        register_crisis_link_system(&mut sim);

        // CrisisState defaults to None / cost_multiplier=1.0.
        sim.step();

        let reg = sim.world.resource::<LawRegistry>().clone();

        use crate::dsl::ast::{Program, Scope};
        use crate::system::Cadence;
        use crate::registry::{LawEffect, LawHandle, LawId};
        use std::sync::Arc;

        let stub = Arc::new(Program { scopes: vec![Scope { name: "B".into(), params: vec![], items: vec![] }] });
        let id = reg.enact(LawHandle {
            source: None, id: LawId(0), version: 1, program: stub,
            cadence: Cadence::Monthly, effective_from_tick: 0, effective_until_tick: None,
            effect: LawEffect::PerCitizenBenefit { scope: "B", amount_def: "a" },
        });
        reg.repeal(id, 0);

        let debt = reg.drain_repeal_debt();
        // No crisis → multiplier is 1.0 (default CrisisState.cost_multiplier).
        // Note: RegistryInner.crisis_cost_multiplier starts at 0.0 (which falls back to 1.0 via guard).
        // After one step with no crisis, crisis_link writes crisis.cost_multiplier which is
        // CrisisState::default().cost_multiplier. Let's verify debt ≈ 0.10 (full base rate).
        assert!(
            (debt - 0.10).abs() < 1e-5,
            "without active crisis, repeal debt should be full 0.10, got {debt}"
        );
    }
}
