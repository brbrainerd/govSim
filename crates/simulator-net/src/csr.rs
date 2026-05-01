//! Compressed Sparse Row adjacency list for the influence graph.
//!
//! Rows = source citizens; columns = target citizens; values = f32 weights.
//! Built once at population spawn time, read-only afterwards.

/// A read-only CSR matrix stored as three parallel vecs.
/// Row i spans `col_ind[row_ptr[i]..row_ptr[i+1]]`.
#[derive(Debug, Clone)]
pub struct CsrMatrix {
    /// Length = n_rows + 1.
    pub row_ptr: Vec<u32>,
    /// Column indices (target citizen ordinal, not CitizenId).
    pub col_ind: Vec<u32>,
    /// Edge weights, parallel to `col_ind`.
    pub weights: Vec<f32>,
    pub n_rows: usize,
    pub n_cols: usize,
}

impl CsrMatrix {
    /// Iterate over (col_ordinal, weight) pairs for row `i`.
    pub fn row(&self, i: usize) -> impl Iterator<Item = (u32, f32)> + '_ {
        let start = self.row_ptr[i] as usize;
        let end = self.row_ptr[i + 1] as usize;
        self.col_ind[start..end]
            .iter()
            .zip(self.weights[start..end].iter())
            .map(|(&c, &w)| (c, w))
    }
}
