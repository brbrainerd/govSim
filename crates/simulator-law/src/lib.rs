//! NL → IG 2.0 → UGS-Catala → LawSystem pipeline.
//!
//! Phase 4 vertical slice (May 2026):
//! - IG 2.0 AST + serde
//! - UGS-Catala parser (chumsky), typechecker, tree-walking evaluator
//! - `LawRegistry` resource + a single `LawDispatcher` System
//!
//! Backends gated behind features:
//! - `jit`  → Cranelift JIT (Phase-4 stretch)
//! - `wasm` → wasmtime sandboxed (Phase-4 stretch)
//! - `llm`  → NL → IG 2.0 extractor via local llama.cpp (depends on Phase 3)

pub mod ig2;
pub mod dsl;
pub mod eval;
pub mod lower;
pub mod registry;
pub mod system;

pub use registry::{LawHandle, LawId, LawRegistry};
pub use system::{law_dispatcher_system, register_law_dispatcher, Cadence};
