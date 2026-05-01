//! Local LLM client — drives llama.cpp CLI for IG 2.0 JSON extraction.
//!
//! Usage:
//!   let extractor = IgExtractor::new()?;
//!   let stmt: IgStatement = extractor.extract("All residents must pay 20% income tax.")?;

pub mod client;
pub mod batcher {}
pub mod cache {}
pub mod personas {}
pub mod grammar {}
pub mod models {}

pub use client::{IgExtractor, LlmError};
