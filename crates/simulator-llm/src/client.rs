//! Drives the `llama-cli` (llama.cpp) binary with GBNF grammar constraints to
//! extract a structured IgStatement JSON from free-text policy input.
//!
//! Looks for the binary in PATH, then in `$LLAMA_CPP_BIN`, then under the
//! repo-local `vendor/llama.cpp/build/bin/` directory.

use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, thiserror::Error)]
pub enum LlmError {
    #[error("llama-cli not found — set LLAMA_CPP_BIN or add it to PATH")]
    BinaryNotFound,
    #[error("model GGUF not found at {0} — run `cargo xtask llm pull`")]
    ModelNotFound(PathBuf),
    #[error("grammar file not found at {0}")]
    GrammarNotFound(PathBuf),
    #[error("llama-cli failed: {0}")]
    ProcessFailed(String),
    #[error("JSON parse failed: {0}")]
    ParseFailed(String),
}

const SYSTEM_PROMPT_PATH: &str = "data/prompts/ig2_extraction.md";
const GRAMMAR_PATH: &str = "data/grammars/ig2.gbnf";
const LOCK_PATH: &str = "data/models/model.lock";

pub struct IgExtractor {
    binary: PathBuf,
    model: PathBuf,
    grammar: PathBuf,
    system_prompt: String,
    /// Max tokens for the LLM output (one IG 2.0 JSON fits well under 512).
    n_predict: u32,
    /// Number of GPU layers to offload (0 = CPU-only).
    n_gpu_layers: u32,
}

impl IgExtractor {
    pub fn new() -> Result<Self, LlmError> {
        let binary = find_llama_binary()?;
        let model = model_from_lockfile()?;
        let grammar = PathBuf::from(GRAMMAR_PATH);
        if !grammar.exists() {
            return Err(LlmError::GrammarNotFound(grammar));
        }
        let system_prompt = std::fs::read_to_string(SYSTEM_PROMPT_PATH)
            .unwrap_or_else(|_| DEFAULT_SYSTEM_PROMPT.to_string());

        // Auto-detect GPU: if nvidia-smi reports any VRAM, offload all layers.
        let n_gpu_layers = detect_gpu_layers();

        Ok(Self {
            binary,
            model,
            grammar,
            system_prompt,
            n_predict: 512,
            n_gpu_layers,
        })
    }

    /// Extract an IG 2.0 JSON string from `policy_text`.
    /// Callers with `simulator-law` can deserialize with `serde_json::from_str::<IgStatement>`.
    pub fn extract_raw(&self, policy_text: &str) -> Result<String, LlmError> {
        let prompt = format!(
            "{}\n\n## Policy text to convert\n\n{}",
            self.system_prompt.trim(),
            policy_text.trim(),
        );

        let output = Command::new(&self.binary)
            .args([
                "--model",       self.model.to_str().unwrap_or(""),
                "--grammar-file",self.grammar.to_str().unwrap_or(""),
                "--n-predict",   &self.n_predict.to_string(),
                "--n-gpu-layers",&self.n_gpu_layers.to_string(),
                "--temp",        "0.0",
                "--prompt",      &prompt,
                "--log-disable",
                "--no-display-prompt",
            ])
            .output()
            .map_err(|e| LlmError::ProcessFailed(e.to_string()))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(LlmError::ProcessFailed(stderr.into_owned()));
        }

        let raw = String::from_utf8_lossy(&output.stdout);
        let json = extract_json(&raw)
            .ok_or_else(|| LlmError::ParseFailed(format!("no JSON found in: {raw}")))?;

        // Validate it's parseable JSON (not the specific type — avoid the dep cycle).
        serde_json::from_str::<serde_json::Value>(json)
            .map_err(|e| LlmError::ParseFailed(e.to_string()))?;

        Ok(json.to_string())
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn find_llama_binary() -> Result<PathBuf, LlmError> {
    // 1. Environment override.
    if let Ok(p) = std::env::var("LLAMA_CPP_BIN") {
        let pb = PathBuf::from(&p);
        if pb.exists() { return Ok(pb); }
    }
    // 2. PATH lookup.
    for candidate in ["llama-cli", "llama-cli.exe", "main", "main.exe"] {
        if which_binary(candidate) { return Ok(PathBuf::from(candidate)); }
    }
    // 3. Repo-local vendor build.
    let local = PathBuf::from("vendor/llama.cpp/build/bin/llama-cli");
    if local.exists() { return Ok(local); }
    let local_exe = PathBuf::from("vendor/llama.cpp/build/bin/llama-cli.exe");
    if local_exe.exists() { return Ok(local_exe); }

    Err(LlmError::BinaryNotFound)
}

fn which_binary(name: &str) -> bool {
    Command::new(if cfg!(windows) { "where" } else { "which" })
        .arg(name)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn model_from_lockfile() -> Result<PathBuf, LlmError> {
    // Parse data/models/model.lock
    if let Ok(content) = std::fs::read_to_string(LOCK_PATH) {
        for line in content.lines() {
            if let Some(rest) = line.strip_prefix("path=") {
                let p = PathBuf::from(rest.trim());
                if p.exists() { return Ok(p); }
                return Err(LlmError::ModelNotFound(p));
            }
        }
    }
    // Fallback: scan data/models/ for any .gguf
    let dir = Path::new("data/models");
    if dir.is_dir() {
        for entry in std::fs::read_dir(dir).into_iter().flatten().flatten() {
            let p = entry.path();
            if p.extension().and_then(|e| e.to_str()) == Some("gguf") {
                return Ok(p);
            }
        }
    }
    Err(LlmError::ModelNotFound(PathBuf::from("data/models/*.gguf")))
}

fn detect_gpu_layers() -> u32 {
    let ok = Command::new("nvidia-smi")
        .args(["--query-gpu=memory.total", "--format=csv,noheader,nounits"])
        .output()
        .map(|o| o.status.success() && !o.stdout.is_empty())
        .unwrap_or(false);
    if ok { 9999 } else { 0 }
}

/// Find the first `{...}` block in `s` that looks like complete JSON.
fn extract_json(s: &str) -> Option<&str> {
    let start = s.find('{')?;
    let mut depth = 0u32;
    let mut in_string = false;
    let mut escape = false;
    for (i, c) in s[start..].char_indices() {
        if escape { escape = false; continue; }
        match c {
            '\\' if in_string => escape = true,
            '"' => in_string = !in_string,
            '{' if !in_string => depth += 1,
            '}' if !in_string => {
                depth -= 1;
                if depth == 0 { return Some(&s[start..start + i + 1]); }
            }
            _ => {}
        }
    }
    None
}

const DEFAULT_SYSTEM_PROMPT: &str = "\
You are a policy analysis assistant. Convert the given policy text into IG 2.0 JSON.
Output ONLY a single valid JSON object. No explanation.";
