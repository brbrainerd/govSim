//! NL → IG 2.0 → UGS-Catala → Cranelift JIT pipeline. Phase 4.
pub mod ig2 {
    pub mod ast {}
    pub mod parser {}
    pub mod nl_extractor {}
}
pub mod dsl {
    pub mod ast {}
    pub mod grammar {}
    pub mod typecheck {}
    pub mod lower {}
}
pub mod compile {
    pub mod cranelift {}
    pub mod wasmtime {}
}
pub mod registry {}
pub mod versioning {}
