//! Opinion propagation along the influence graph.
//!
//! Every `OPINION_PERIOD` ticks each citizen's 5-axis `IdeologyVector` is
//! nudged toward the weighted average of their neighbours' ideologies,
//! scaled by a global `DAMPING` factor that keeps the system from collapsing
//! to consensus. Negative-weight edges are contrarian (nudge away).
//!
//! Algorithm (O(E) per firing, parallel over rows):
//!   1. Snapshot current ideology for all citizens into a Vec (sorted by
//!      CitizenId so indexing matches graph ordinals).
//!   2. For each citizen i (rayon par_iter_mut), compute weighted sum over
//!      neighbours j from the CSR slices:
//!      delta[k] += w_ij * (ideology[j][k] - ideology[i][k])
//!   3. Apply delta[k] * DAMPING; clamp to [-1, 1].
//!
//! Each row's delta is independent — no shared mutable state — so rayon
//! parallelism is safe and preserves bit-exact determinism per row.

use rayon::prelude::*;
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
    if !clock.tick.is_multiple_of(OPINION_PERIOD) || clock.tick == 0 { return; }
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

    // Compute per-citizen deltas from neighbour influence — parallel over rows.
    // Each deltas[i] is written by exactly one thread; snapshot/csr slices are
    // read-only shared references (both are Sync). rayon::for_each is blocking
    // so lifetimes stay valid for the duration of the system call.
    let row_ptr = graph.csr.row_ptr.as_slice();
    let col_ind = graph.csr.col_ind.as_slice();
    let weights = graph.csr.weights.as_slice();
    let snap    = snapshot.as_slice();

    let mut deltas = vec![[0.0f32; 5]; n];
    deltas.par_iter_mut().enumerate().for_each(|(i, delta)| {
        let iv_i  = snap[i];
        let start = row_ptr[i]     as usize;
        let end   = row_ptr[i + 1] as usize;
        for idx in start..end {
            let j = col_ind[idx] as usize;
            if j >= n { continue; }
            let iv_j = snap[j];
            let w    = weights[idx];
            for k in 0..5 {
                delta[k] += w * (iv_j[k] - iv_i[k]);
            }
        }
    });

    // Apply deltas.
    for (citizen, mut iv) in q.iter_mut() {
        let ord = citizen.0.0 as usize;
        if ord >= n { continue; }
        let d = deltas[ord];
        for (v, &di) in iv.0.iter_mut().zip(d.iter()) {
            *v = (*v + di * DAMPING).clamp(-1.0, 1.0);
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
/// `p` is the edge probability; 0.0001 gives ~1M edges for 100K citizens.
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

#[cfg(test)]
mod tests {
    use super::*;
    use simulator_core::Sim;
    use simulator_core::components::{
        Age, ApprovalRating, AuditFlags, EmploymentStatus, Health,
        IdeologyVector, Income, LegalStatuses, Location, Productivity, Sex, Wealth,
    };
    use simulator_types::{CitizenId, Money, RegionId, Score};

    fn spawn_citizen(world: &mut World, id: u64, ideology: [f32; 5]) {
        world.spawn((
            Citizen(CitizenId(id)),
            Age(30), Sex::Male, Location(RegionId(0)),
            Health(Score::from_num(0.8_f32)),
            Income(Money::from_num(3000_i32)),
            Wealth(Money::from_num(5000_i32)),
            EmploymentStatus::Employed,
            Productivity(Score::from_num(0.5_f32)),
            IdeologyVector(ideology),
            ApprovalRating(Score::from_num(0.5_f32)),
            LegalStatuses::default(),
            AuditFlags::default(),
        ));
    }

    /// Two citizens connected by a positive-weight edge: the one starting at
    /// -0.8 should move toward the +0.8 citizen after several firings.
    #[test]
    fn opinion_nudges_toward_positive_neighbour() {
        use simulator_net::{InfluenceGraph, csr::CsrMatrix};

        let mut sim = Sim::new([5u8; 32]);
        register_opinion_system(&mut sim);

        // Citizen 0: ideology axis 0 = -0.8 (left)
        // Citizen 1: ideology axis 0 = +0.8 (right)
        spawn_citizen(&mut sim.world, 0, [-0.8, 0.0, 0.0, 0.0, 0.0]);
        spawn_citizen(&mut sim.world, 1, [ 0.8, 0.0, 0.0, 0.0, 0.0]);

        // Single directed edge 0 → 1 with positive weight 1.0.
        // Citizen 0 is influenced by citizen 1.
        let graph = InfluenceGraph {
            csr: CsrMatrix {
                row_ptr: vec![0, 1, 1], // row 0 has 1 edge, row 1 has 0
                col_ind: vec![1],       // edge from 0 → 1
                weights: vec![1.0],
                n_rows: 2,
                n_cols: 2,
            },
        };
        sim.world.insert_resource(graph);

        // Run for several OPINION_PERIOD cycles (7 × 15 = 105 ticks).
        for _ in 0..105 { sim.step(); }

        let mut q = sim.world.query::<(&Citizen, &IdeologyVector)>();
        let ideologies: std::collections::HashMap<u64, f32> = q
            .iter(&sim.world)
            .map(|(c, iv)| (c.0.0, iv.0[0]))
            .collect();

        let iv0 = ideologies[&0];
        assert!(
            iv0 > -0.8,
            "citizen 0 should have moved toward citizen 1 (right), got {iv0}"
        );
    }

    /// No graph resource → system is a no-op; ideologies should not change.
    #[test]
    fn no_graph_resource_is_noop() {
        let mut sim = Sim::new([6u8; 32]);
        register_opinion_system(&mut sim);
        // Do NOT insert InfluenceGraph — the system returns early.

        spawn_citizen(&mut sim.world, 0, [-0.5, 0.0, 0.0, 0.0, 0.0]);

        for _ in 0..70 { sim.step(); }

        let iv: f32 = sim.world
            .query::<&IdeologyVector>()
            .single(&sim.world)
            .unwrap()
            .0[0];
        assert!(
            (iv - (-0.5)).abs() < 1e-5,
            "ideology should not change without a graph, got {iv}"
        );
    }

    /// Negative-weight edge (contrarian): citizen 0 is influenced away from citizen 1.
    #[test]
    fn contrarian_edge_nudges_ideology_away() {
        use simulator_net::{InfluenceGraph, csr::CsrMatrix};

        let mut sim = Sim::new([7u8; 32]);
        register_opinion_system(&mut sim);

        // Citizen 0: ideology +0.5; citizen 1: ideology +0.9.
        // A negative-weight edge (0 ← 1, w = -1.0) means citizen 0 is
        // nudged AWAY from citizen 1, i.e. toward more negative values.
        spawn_citizen(&mut sim.world, 0, [0.5, 0.0, 0.0, 0.0, 0.0]);
        spawn_citizen(&mut sim.world, 1, [0.9, 0.0, 0.0, 0.0, 0.0]);

        let graph = InfluenceGraph {
            csr: CsrMatrix {
                row_ptr: vec![0, 1, 1],
                col_ind: vec![1],
                weights:  vec![-1.0], // negative = contrarian
                n_rows: 2,
                n_cols: 2,
            },
        };
        sim.world.insert_resource(graph);

        // Run several OPINION_PERIOD cycles.
        for _ in 0..105 { sim.step(); }

        let mut q = sim.world.query::<(&Citizen, &IdeologyVector)>();
        let iv0: f32 = q.iter(&sim.world)
            .find(|(c, _)| c.0.0 == 0)
            .unwrap()
            .1 .0[0];

        assert!(
            iv0 < 0.5,
            "contrarian edge should push citizen 0 below its initial +0.5, got {iv0}"
        );
    }

    /// Ideology values are clamped to [-1, 1] even under extreme influence.
    #[test]
    fn ideology_clamped_to_unit_interval() {
        use simulator_net::{InfluenceGraph, csr::CsrMatrix};

        let mut sim = Sim::new([8u8; 32]);
        register_opinion_system(&mut sim);

        // Citizen 0 at 0.99; citizen 1 at 1.0 with very high weight.
        // After many firings citizen 0 should converge to 1.0 but never exceed it.
        spawn_citizen(&mut sim.world, 0, [0.99, 0.0, 0.0, 0.0, 0.0]);
        spawn_citizen(&mut sim.world, 1, [1.0,  0.0, 0.0, 0.0, 0.0]);

        let graph = InfluenceGraph {
            csr: CsrMatrix {
                row_ptr: vec![0, 1, 1],
                col_ind: vec![1],
                weights:  vec![100.0], // extreme pull
                n_rows: 2,
                n_cols: 2,
            },
        };
        sim.world.insert_resource(graph);

        for _ in 0..700 { sim.step(); }

        let mut q = sim.world.query::<(&Citizen, &IdeologyVector)>();
        for (_, iv) in q.iter(&sim.world) {
            for &v in &iv.0 {
                assert!(
                    v >= -1.0 && v <= 1.0,
                    "ideology must be clamped to [-1, 1], got {v}"
                );
            }
        }
    }

    /// Parallel computation produces the same result as a sequential reference.
    #[test]
    fn parallel_matches_sequential_reference() {
        use rand::SeedableRng;
        use rand_chacha::ChaCha20Rng;
        let mut rng = ChaCha20Rng::from_seed([11u8; 32]);
        let n = 200usize;
        let graph = InfluenceGraph::erdos_renyi(n, 0.05, &mut rng);

        let snapshot: Vec<[f32; 5]> = (0..n)
            .map(|i| [i as f32 / n as f32; 5])
            .collect();

        // Sequential reference.
        let mut seq_deltas = vec![[0.0f32; 5]; n];
        for i in 0..n {
            let iv_i = snapshot[i];
            for (j, w) in graph.csr.row(i) {
                let j = j as usize;
                if j >= n { continue; }
                let iv_j = snapshot[j];
                for k in 0..5 {
                    seq_deltas[i][k] += w * (iv_j[k] - iv_i[k]);
                }
            }
        }

        // Parallel path (same logic as the system).
        let row_ptr = graph.csr.row_ptr.as_slice();
        let col_ind = graph.csr.col_ind.as_slice();
        let weights = graph.csr.weights.as_slice();
        let snap    = snapshot.as_slice();

        let mut par_deltas = vec![[0.0f32; 5]; n];
        par_deltas.par_iter_mut().enumerate().for_each(|(i, delta)| {
            let iv_i  = snap[i];
            let start = row_ptr[i]     as usize;
            let end   = row_ptr[i + 1] as usize;
            for idx in start..end {
                let j = col_ind[idx] as usize;
                if j >= n { continue; }
                let iv_j = snap[j];
                let w    = weights[idx];
                for k in 0..5 {
                    delta[k] += w * (iv_j[k] - iv_i[k]);
                }
            }
        });

        for i in 0..n {
            for k in 0..5 {
                assert_eq!(
                    seq_deltas[i][k], par_deltas[i][k],
                    "delta mismatch at citizen {i} axis {k}"
                );
            }
        }
    }
}
