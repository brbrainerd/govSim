//! Counterfactual / DiD estimation for UGS.
//!
//! # Core workflow
//!
//! 1. Run the simulation up to the law-enactment tick and save a snapshot.
//! 2. Fork into a `CounterfactualPair` from that blob.
//! 3. Call `pair.apply_treatment(law_handle)` to add the law to the
//!    treatment arm only.
//! 4. Call `pair.step_both(n)` to advance both arms.
//! 5. Call `pair.compute_did(enacted_tick, window)` for the DiD estimate.
//!
//! # Monte Carlo
//!
//! `MonteCarloRunner::run()` repeats the workflow with varied post-enactment
//! RNG seeds to produce a distribution of DiD outcomes.

pub mod estimate;
pub mod pair;
pub mod monte_carlo;
pub mod triple;

pub use estimate::CausalEstimate;
pub use pair::CounterfactualPair;
pub use monte_carlo::MonteCarloRunner;
pub use triple::{CounterfactualTriple, ComparativeEstimate};
