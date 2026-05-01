//! `InfluenceGraph` — bevy_ecs Resource wrapping a CSR influence matrix.
//!
//! Construction: `InfluenceGraph::erdos_renyi(n, p, rng)` wires a random
//! directed graph with Erdős–Rényi edge probability `p`. Weights drawn
//! uniformly from [-1, 1]; positive = reinforcing, negative = contrarian.
//!
//! The mapping citizen_ordinal → CitizenId is positional (ordinal i maps to
//! the i-th citizen spawned, i.e. CitizenId(i)). This is maintained by the
//! spawn loop in simulator-scenario.

use bevy_ecs::prelude::Resource;
use rand::Rng;

use crate::csr::CsrMatrix;

#[derive(Resource, Clone)]
pub struct InfluenceGraph {
    /// CSR adjacency. Row i = outgoing influence from citizen ordinal i.
    pub csr: CsrMatrix,
}

impl InfluenceGraph {
    /// Build an Erdős–Rényi directed influence graph using the geometric-skip
    /// algorithm (Batagelj & Brandes 2005). O(n + E) time and memory.
    ///
    /// - `n`: number of citizens
    /// - `p`: edge probability per ordered pair (excluding self-loops)
    /// - `rng`: any `rand::Rng`
    ///
    /// Expected edges ≈ p * n * (n-1). At p=0.002, n=100K → ~20M edges,
    /// which is ~80 MB. The caller should choose p to stay in budget.
    /// Typical production value: p=0.0001 (→ ~1M edges for 100K citizens).
    pub fn erdos_renyi<R: Rng>(n: usize, p: f32, rng: &mut R) -> Self {
        if n == 0 || p <= 0.0 {
            return InfluenceGraph {
                csr: CsrMatrix {
                    row_ptr: vec![0; n + 1],
                    col_ind: vec![],
                    weights: vec![],
                    n_rows: n,
                    n_cols: n,
                },
            };
        }

        // Geometric skip: skip = floor(log(U) / log(1-p)) positions in the
        // linearised edge list (length n*(n-1), row-major, self-loops excluded).
        let log1mp = (1.0 - p as f64).ln();

        // Collect (row, col) pairs first, then convert to CSR.
        let expected_edges = (p as f64 * n as f64 * (n as f64 - 1.0)) as usize;
        let mut edges: Vec<(u32, u32)> = Vec::with_capacity(expected_edges.min(1 << 24));
        let mut weights: Vec<f32> = Vec::with_capacity(edges.capacity());

        // Linear index in directed graph without self-loops.
        // Position `pos` in [0, n*(n-1)) maps to:
        //   row = pos / (n-1)
        //   raw_col = pos % (n-1)   (0..n-1, skip self-loop at raw_col==row)
        let total = n as u64 * (n as u64 - 1);
        let mut pos: u64 = {
            let u: f64 = rng.random::<f64>().max(f64::MIN_POSITIVE);
            let skip = (u.ln() / log1mp).floor() as u64;
            skip
        };
        while pos < total {
            let row = (pos / (n as u64 - 1)) as usize;
            let raw = (pos % (n as u64 - 1)) as usize;
            let col = if raw < row { raw } else { raw + 1 };
            edges.push((row as u32, col as u32));
            weights.push(rng.random::<f32>() * 2.0 - 1.0);
            // Advance by next geometric skip.
            let u: f64 = rng.random::<f64>().max(f64::MIN_POSITIVE);
            let skip = (u.ln() / log1mp).floor() as u64 + 1;
            pos = pos.saturating_add(skip);
        }

        // Build CSR from sorted (row, col) pairs.
        // edges are already in row-major order by construction.
        let mut row_ptr = vec![0u32; n + 1];
        for &(r, _) in &edges {
            row_ptr[r as usize + 1] += 1;
        }
        for i in 1..=n {
            row_ptr[i] += row_ptr[i - 1];
        }
        let col_ind: Vec<u32> = edges.iter().map(|&(_, c)| c).collect();

        InfluenceGraph {
            csr: CsrMatrix {
                row_ptr,
                col_ind,
                weights,
                n_rows: n,
                n_cols: n,
            },
        }
    }

    pub fn n_citizens(&self) -> usize { self.csr.n_rows }

    pub fn edge_count(&self) -> usize { self.csr.col_ind.len() }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand_chacha::ChaCha20Rng;

    #[test]
    fn erdos_renyi_no_self_loops() {
        let mut rng = ChaCha20Rng::from_seed([42u8; 32]);
        let g = InfluenceGraph::erdos_renyi(100, 0.05, &mut rng);
        for i in 0..100 {
            for (j, _) in g.csr.row(i) {
                assert_ne!(i as u32, j, "self-loop at {i}");
            }
        }
    }

    #[test]
    fn erdos_renyi_edge_density_approx() {
        let mut rng = ChaCha20Rng::from_seed([7u8; 32]);
        let n = 500;
        let p = 0.05_f32;
        let g = InfluenceGraph::erdos_renyi(n, p, &mut rng);
        let expected = p as f64 * n as f64 * (n as f64 - 1.0);
        let actual = g.edge_count() as f64;
        // Allow 10% deviation (very conservative for n=500).
        assert!(
            (actual - expected).abs() / expected < 0.10,
            "expected ~{expected:.0} edges, got {actual}"
        );
    }

    #[test]
    fn erdos_renyi_row_ptr_monotone() {
        let mut rng = ChaCha20Rng::from_seed([1u8; 32]);
        let g = InfluenceGraph::erdos_renyi(200, 0.02, &mut rng);
        for i in 0..g.csr.n_rows {
            assert!(g.csr.row_ptr[i] <= g.csr.row_ptr[i + 1]);
        }
    }

    #[test]
    fn erdos_renyi_deterministic() {
        let make = || {
            let mut rng = ChaCha20Rng::from_seed([99u8; 32]);
            InfluenceGraph::erdos_renyi(300, 0.01, &mut rng)
        };
        let g1 = make();
        let g2 = make();
        assert_eq!(g1.edge_count(), g2.edge_count());
        assert_eq!(g1.csr.col_ind, g2.csr.col_ind);
    }
}
