//! `ugs` — UGS headless CLI.
//!
//! Phase 0: implements `run` (load scenario → tick N times → print clock)
//! and stubs out `replay`, `bench`, `law compile`.

use std::path::PathBuf;
use std::time::Instant;

use anyhow::Result;
use clap::{Parser, Subcommand};

use simulator_core::Sim;
use simulator_scenario::Scenario;

#[derive(Parser)]
#[command(name = "ugs", version, about = "Universal Government Simulator")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Run a scenario.
    Run {
        #[arg(long)]
        scenario: PathBuf,
        /// Override the scenario tick count.
        #[arg(long)]
        ticks: Option<u64>,
    },
    /// Replay from a snapshot (Phase 1).
    Replay {
        #[arg(long)]
        snapshot: PathBuf,
    },
    /// Benchmark tick rate (Phase 1).
    Bench {
        #[arg(long, default_value_t = 10_000)]
        ticks: u64,
    },
    /// Standalone NL→IG→DSL→Cranelift dry run (Phase 4).
    LawCompile {
        #[arg(long)]
        file: PathBuf,
    },
}

fn main() -> Result<()> {
    simulator_telemetry::init();
    match Cli::parse().cmd {
        Cmd::Run { scenario, ticks } => run(scenario, ticks),
        Cmd::Replay { snapshot } => {
            tracing::warn!(?snapshot, "replay: not yet implemented (Phase 1)");
            Ok(())
        }
        Cmd::Bench { ticks } => bench(ticks),
        Cmd::LawCompile { file } => {
            tracing::warn!(?file, "law compile: not yet implemented (Phase 4)");
            Ok(())
        }
    }
}

fn run(path: PathBuf, override_ticks: Option<u64>) -> Result<()> {
    let scenario = Scenario::load(&path)?;
    tracing::info!(name = %scenario.name, "loaded scenario");

    let total = override_ticks.unwrap_or(scenario.ticks);
    let mut sim = Sim::new(scenario.seed);

    let start = Instant::now();
    for _ in 0..total {
        sim.step();
    }
    let elapsed = start.elapsed();

    let rate = total as f64 / elapsed.as_secs_f64();
    println!(
        "scenario={} ticks={} elapsed={:.3}s rate={:.0} ticks/s final_tick={}",
        scenario.name,
        total,
        elapsed.as_secs_f64(),
        rate,
        sim.tick(),
    );
    Ok(())
}

fn bench(ticks: u64) -> Result<()> {
    let mut sim = Sim::new([0u8; 32]);
    let start = Instant::now();
    for _ in 0..ticks {
        sim.step();
    }
    let elapsed = start.elapsed();
    println!(
        "bench: {} ticks in {:.3}s = {:.0} ticks/s",
        ticks,
        elapsed.as_secs_f64(),
        ticks as f64 / elapsed.as_secs_f64(),
    );
    Ok(())
}
