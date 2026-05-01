//! Build orchestration for UGS. Pure Rust: works the same on every OS.
//!
//! See `cargo xtask --help` for the command list. The full set described in
//! the blueprint (§11.2) is stubbed here; commands print TODO until their
//! corresponding phase lands.

use std::process::{Command, ExitCode};

use anyhow::Result;
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
    /// Download + verify a GGUF, write SHA to lockfile
    Pull { model: String },
}

#[derive(Subcommand)]
enum VdemCmd {
    /// Download V-Dem v16 → parquet
    Ingest,
}

fn main() -> ExitCode {
    let r: Result<()> = match Cli::parse().cmd {
        Cmd::Bootstrap => stub("bootstrap"),
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
        Cmd::Llm(LlmCmd::Pull { model }) => {
            eprintln!("TODO: pull model {model}");
            Ok(())
        }
        Cmd::Law { file, schema } => {
            if schema {
                // Delegate to the CLI which links simulator-law.
                run_cargo(&["run", "-p", "simulator-cli", "--", "law-compile", "--schema"])
            } else if let Some(f) = file {
                eprintln!("TODO: compile law {f}");
                Ok(())
            } else {
                eprintln!("law: pass a file or --schema");
                Ok(())
            }
        }
        Cmd::Vdem(VdemCmd::Ingest) => stub("vdem ingest"),
    };
    match r {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("xtask error: {e:?}");
            ExitCode::FAILURE
        }
    }
}

fn stub(name: &str) -> Result<()> {
    eprintln!("xtask {name}: not yet implemented");
    Ok(())
}

fn run_cargo(args: &[&str]) -> Result<()> {
    let status = Command::new(env!("CARGO")).args(args).status()?;
    if !status.success() {
        anyhow::bail!("cargo {:?} failed: {status}", args);
    }
    Ok(())
}
