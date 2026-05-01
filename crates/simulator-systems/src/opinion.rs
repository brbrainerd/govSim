//! Opinion propagation along the influence graph.
//!
//! Every `OPINION_PERIOD` ticks each citizen's 5-axis `IdeologyVector` is
//! nudged toward the weighted average of their neighbours' ideologies,
//! scaled by a global `DAMPING` factor that keeps the system from collapsing
//! to consensus. Negative-weight edges are contrarian (nudge away).
//!
//! Algorithm (Phase 1 — O(E) per firing):
//!   1. Snapshot current ideology for all citizens into a Vec (sorted by
//!      CitizenId so indexing matches graph ordinals).
//!   2. For each citizen i, compute weighted sum over neighbours j:
//!      delta[k] += w_ij * (ideology[j][k] - ideology[i][k])
//!   3. Apply delta[k] * DAMPING; clamp to [-1, 1].

use simulator_core::{
    bevy_ecs::prelude::*,
    components::{Citizen, IdeologyVector},
    Phase, Sim, SimClock,
};
use simulator_net::InfluenceGraph;

/// Fire every 7 ticks (weekly). Cheap O(E) pass.
const OPINION_PERIOD: u64 = 7;
/// Fraction of the weighted-neighbour delta applied per firing.
const DAMPING: f32 = 0.02;

pub fn opinion_propagation_system(
    clock: Res<SimClock>,
    graph: Option<Res<InfluenceGraph>>,
    mut q: Query<(&Citizen, &mut IdeologyVector)>,
) {
    if clock.tick % OPINION_PERIOD != 0 || clock.tick == 0 { return; }
    let graph = match graph { Some(g) => g, None => return };

    let n = graph.n_citizens();
    if n == 0 { return; }

    // Snapshot: ideology[i] for citizen ordinal i (CitizenId(i)).
    // Citizens not present in the query get a zero ideology (edge case:
    // shouldn't happen, but safe to skip).
    let mut snapshot = vec![[0.0f32; 5]; n];
    for (citizen, iv) in q.iter() {
        let ord = citizen.0.0 as usize;
        if ord < n {
            snapshot[ord] = iv.0;
        }
    }

    // Compute per-citizen deltas from neighbour influence.
    let mut deltas = vec![[0.0f32; 5]; n];
    for i in 0..n {
        let iv_i = snapshot[i];
        for (j, w) in graph.csr.row(i) {
            let j = j as usize;
            if j >= n { continue; }
            let iv_j = snapshot[j];
            for k in 0..5 {
                deltas[i][k] += w * (iv_j[k] - iv_i[k]);
            }
        }
    }

    // Apply deltas.
    for (citizen, mut iv) in q.iter_mut() {
        let ord = citizen.0.0 as usize;
        if ord >= n { continue; }
        let d = deltas[ord];
        for k in 0..5 {
            iv.0[k] = (iv.0[k] + d[k] * DAMPING).clamp(-1.0, 1.0);
        }
    }
}

/// Register opinion propagation. Requires `InfluenceGraph` resource to
/// already be inserted (done by `build_influence_graph`).
pub fn register_opinion_system(sim: &mut Sim) {
    sim.schedule_mut()
        .add_systems(opinion_propagation_system.in_set(Phase::Cognitive));
}

/// Insert a random Erdős–Rényi influence graph for `n_citizens`.
/// `p` is the edge probability; 0.002 gives ~200 neighbours for 100K citizens.
pub fn build_influence_graph(sim: &mut Sim, n_citizens: usize, p: f32) {
    let mut rng = sim.world.resource::<simulator_core::SimRng>().derive("influence_graph", 0);
    let graph = InfluenceGraph::erdos_renyi(n_citizens, p, &mut rng);
    tracing::info!(
        n = n_citizens,
        edges = graph.edge_count(),
        "influence graph built"
    );
    sim.world.insert_resource(graph);
}
