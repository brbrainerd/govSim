//! Build orchestration for UGS. Pure Rust: works the same on every OS.
//!
//! See `cargo xtask --help` for the command list.

use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode};

use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "xtask", about = "UGS build & dev orchestration")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// uv sync sidecars, fetch GGUF, build llama.cpp
    Bootstrap,
    /// cargo build + tauri build + sidecar pyinstaller
    Build,
    /// spin up sidecars + tauri dev with hot reload
    Dev,
    /// criterion + scenario tick-rate benchmarks
    Bench,
    /// unit + integration + scenario snapshot tests
    Test,
    /// 100-tick × 2 runs, blake3 equality assertion
    Determinism,
    /// LLM model utilities
    #[command(subcommand)]
    Llm(LlmCmd),
    /// Standalone NL→IG→DSL→Cranelift dry run
    Law {
        /// .ugscat or .ig2.json file to compile (dry run).
        file: Option<String>,
        /// Emit the IG 2.0 JSON Schema to data/grammars/ig2_schema.json.
        #[arg(long)]
        schema: bool,
    },
    /// V-Dem dataset utilities
    #[command(subcommand)]
    Vdem(VdemCmd),
}

#[derive(Subcommand)]
enum LlmCmd {
    /// Auto-detect GPU VRAM, select appropriate GGUF tier, download + verify.
    /// Pass an explicit model name to override tier selection.
    Pull {
        /// Override: exact HuggingFace model slug, e.g. "Qwen/Qwen2.5-7B-Instruct-GGUF"
        #[arg(long)]
        model: Option<String>,
        /// Override: exact GGUF filename inside the repo
        #[arg(long)]
        file: Option<String>,
    },
    /// Print which tier would be selected for the current machine.
    Detect,
}

#[derive(Subcommand)]
enum VdemCmd {
    /// Download V-Dem v16 CSV (~500 MB) → data/calibration/vdem_v16.csv
    Ingest,
}

// ---------------------------------------------------------------------------
// Model tier table
// ---------------------------------------------------------------------------

struct ModelTier {
    name: &'static str,
    repo: &'static str,
    filename: &'static str,
    sha256: &'static str, // empty = skip verify
    min_vram_mb: u64,
}

const TIERS: &[ModelTier] = &[
    ModelTier {
        name: "Qwen2.5-7B-Instruct Q4_K_M",
        repo: "Qwen/Qwen2.5-7B-Instruct-GGUF",
        filename: "qwen2.5-7b-instruct-q4_k_m.gguf",
        sha256: "",
        min_vram_mb: 8_000,
    },
    ModelTier {
        name: "Phi-4-mini Q4_K_M",
        repo: "microsoft/Phi-4-mini-instruct-gguf",
        filename: "Phi-4-mini-instruct-Q4_K_M.gguf",
        sha256: "",
        min_vram_mb: 4_000,
    },
    ModelTier {
        name: "SmolLM2-1.7B Q4_K_M",
        repo: "HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF",
        filename: "smollm2-1.7b-instruct-q4_k_m.gguf",
        sha256: "",
        min_vram_mb: 0,
    },
];

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

fn main() -> ExitCode {
    let r: Result<()> = match Cli::parse().cmd {
        Cmd::Bootstrap => bootstrap(),
        Cmd::Build => run_cargo(&["build", "--workspace"]),
        Cmd::Dev => stub("dev"),
        Cmd::Bench => run_cargo(&["bench", "--workspace"]),
        Cmd::Test => run_cargo(&["test", "--workspace"]),
        Cmd::Determinism => run_cargo(&[
            "run", "-p", "simulator-cli", "--",
            "determinism",
            "--scenario", "scenarios/smoke_100k.yaml",
            "--ticks", "100",
        ]),
        Cmd::Llm(LlmCmd::Pull { model, file }) => llm_pull(model, file),
        Cmd::Llm(LlmCmd::Detect) => llm_detect(),
        Cmd::Law { file, schema } => {
            if schema {
                run_cargo(&["run", "-p", "simulator-cli", "--", "law-compile", "--schema"])
            } else if let Some(f) = file {
                eprintln!("TODO: compile law {f}");
                Ok(())
            } else {
                eprintln!("law: pass a file or --schema");
                Ok(())
            }
        }
        Cmd::Vdem(VdemCmd::Ingest) => vdem_ingest(),
    };
    match r {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("xtask error: {e:?}");
            ExitCode::FAILURE
        }
    }
}

// ---------------------------------------------------------------------------
// GPU detection
// ---------------------------------------------------------------------------

/// Returns available VRAM in MiB, or 0 if no NVIDIA GPU / nvidia-smi absent.
fn detect_nvidia_vram_mb() -> u64 {
    let out = Command::new("nvidia-smi")
        .args(["--query-gpu=memory.total", "--format=csv,noheader,nounits"])
        .output();
    match out {
        Ok(o) if o.status.success() => {
            // May have multiple GPUs — take the first.
            let s = String::from_utf8_lossy(&o.stdout);
            s.lines()
                .filter_map(|l| l.trim().parse::<u64>().ok())
                .next()
                .unwrap_or(0)
        }
        _ => 0,
    }
}

fn select_tier(vram_mb: u64) -> &'static ModelTier {
    // TIERS is sorted best-first; pick the first tier the machine can run.
    TIERS.iter().find(|t| vram_mb >= t.min_vram_mb).unwrap_or(&TIERS[2])
}

fn llm_detect() -> Result<()> {
    let vram = detect_nvidia_vram_mb();
    if vram == 0 {
        println!("GPU: none detected (CPU-only mode)");
    } else {
        println!("GPU: {vram} MiB VRAM");
    }
    let tier = select_tier(vram);
    println!("Selected tier: {} ({}/{})", tier.name, tier.repo, tier.filename);
    Ok(())
}

// ---------------------------------------------------------------------------
// llm pull
// ---------------------------------------------------------------------------

fn llm_pull(model_override: Option<String>, file_override: Option<String>) -> Result<()> {
    let vram = detect_nvidia_vram_mb();
    let tier = select_tier(vram);

    let repo = model_override.as_deref().unwrap_or(tier.repo);
    let filename = file_override.as_deref().unwrap_or(tier.filename);

    if model_override.is_none() {
        if vram == 0 {
            println!("No GPU detected — using CPU tier: {}", tier.name);
        } else {
            println!("GPU: {vram} MiB — selected tier: {}", tier.name);
        }
    }

    let dest_dir = Path::new("data/models");
    std::fs::create_dir_all(dest_dir)?;
    let dest = dest_dir.join(filename);

    if dest.exists() {
        println!("{} already present, skipping download.", dest.display());
        return write_lockfile(&dest, tier.sha256);
    }

    let url = format!("https://huggingface.co/{repo}/resolve/main/{filename}");
    println!("Downloading {filename}\n  from {url}");

    download_with_progress(&url, &dest)?;

    if !tier.sha256.is_empty() {
        verify_sha256(&dest, tier.sha256)?;
    }

    write_lockfile(&dest, tier.sha256)?;
    println!("Done → {}", dest.display());
    Ok(())
}

fn download_with_progress(url: &str, dest: &Path) -> Result<()> {
    let resp = ureq::get(url)
        .call()
        .with_context(|| format!("GET {url}"))?;

    let total: Option<u64> = resp
        .headers()
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse().ok());

    let tmp = dest.with_extension("part");
    let mut file = std::fs::File::create(&tmp)?;

    let mut reader = resp.into_body().into_reader();
    let mut buf = vec![0u8; 256 * 1024];
    let mut downloaded: u64 = 0;
    let mut last_pct: u64 = 0;

    loop {
        let n = reader.read(&mut buf)?;
        if n == 0 { break; }
        file.write_all(&buf[..n])?;
        downloaded += n as u64;
        if let Some(t) = total {
            let pct = downloaded * 100 / t;
            if pct >= last_pct + 5 {
                print!("\r  {pct}% ({:.1} MB / {:.1} MB)   ",
                    downloaded as f64 / 1e6, t as f64 / 1e6);
                std::io::stdout().flush().ok();
                last_pct = pct;
            }
        } else {
            print!("\r  {:.1} MB downloaded", downloaded as f64 / 1e6);
            std::io::stdout().flush().ok();
        }
    }
    println!();
    std::fs::rename(&tmp, dest)?;
    Ok(())
}

fn verify_sha256(path: &Path, expected: &str) -> Result<()> {
    use sha2::{Digest, Sha256};
    println!("Verifying SHA-256…");
    let mut file = std::fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 256 * 1024];
    loop {
        let n = file.read(&mut buf)?;
        if n == 0 { break; }
        hasher.update(&buf[..n]);
    }
    let got = format!("{:x}", hasher.finalize());
    if got != expected {
        bail!("SHA-256 mismatch: got {got}, expected {expected}");
    }
    println!("SHA-256 OK");
    Ok(())
}

fn write_lockfile(model_path: &Path, sha256: &str) -> Result<()> {
    let lock = Path::new("data/models/model.lock");
    let filename = model_path.file_name().unwrap_or_default().to_string_lossy();
    let content = format!(
        "model={filename}\nsha256={sha256}\npath={}\n",
        model_path.display()
    );
    std::fs::write(lock, content)?;
    Ok(())
}

// ---------------------------------------------------------------------------
// vdem ingest
// ---------------------------------------------------------------------------

// V-Dem v16 is hosted on Harvard Dataverse (stable DOI redirect).
// The direct file URL below resolves to the CSV download.
const VDEM_URL: &str =
    "https://dataverse.harvard.edu/api/access/datafile/10692407";
const VDEM_DEST: &str = "data/calibration/vdem_v16.csv";

fn vdem_ingest() -> Result<()> {
    let dest = PathBuf::from(VDEM_DEST);
    std::fs::create_dir_all(dest.parent().unwrap())?;

    if dest.exists() {
        let meta = std::fs::metadata(&dest)?;
        println!(
            "V-Dem already present ({:.1} MB) → {}",
            meta.len() as f64 / 1e6,
            dest.display()
        );
        return Ok(());
    }

    println!("Downloading V-Dem v16 (~500 MB)…\n  {VDEM_URL}");
    download_with_progress(VDEM_URL, &dest)?;
    let meta = std::fs::metadata(&dest)?;
    println!(
        "V-Dem saved → {} ({:.1} MB)",
        dest.display(),
        meta.len() as f64 / 1e6
    );
    Ok(())
}

// ---------------------------------------------------------------------------
// Bootstrap: pull the right GGUF + V-Dem + run cargo build
// ---------------------------------------------------------------------------

fn bootstrap() -> Result<()> {
    println!("=== UGS Bootstrap ===");
    llm_pull(None, None)?;
    vdem_ingest()?;
    run_cargo(&["build", "--workspace"])?;
    println!("=== Bootstrap complete ===");
    Ok(())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn stub(name: &str) -> Result<()> {
    eprintln!("xtask {name}: not yet implemented");
    Ok(())
}

fn run_cargo(args: &[&str]) -> Result<()> {
    let status = Command::new(env!("CARGO")).args(args).status()?;
    if !status.success() {
        bail!("cargo {:?} failed: {status}", args);
    }
    Ok(())
}
