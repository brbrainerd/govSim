//! Multi-agent communication and influence graph.
//!
//! Phase 1 slice: sparse CSR influence graph over CitizenIds with random
//! Erdős–Rényi wiring. Weights are f32 in [-1, 1]. The
//! `OpinionPropagationSystem` in `simulator-systems` reads this resource
//! each Cognitive phase tick to nudge `IdeologyVector`.

pub mod graph;
pub mod csr;
pub mod messages {}
pub mod anomaly {}

pub use graph::InfluenceGraph;
