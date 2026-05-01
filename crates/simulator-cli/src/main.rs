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
        /// Optional UGS-Catala law file to enact at tick 0. If absent, the
        /// hardcoded 20%-flat `taxation_system` is used instead.
        #[arg(long)]
        law: Option<PathBuf>,
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
        Cmd::Run { scenario, ticks, law } => run(scenario, ticks, law),
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

fn run(path: PathBuf, override_ticks: Option<u64>, law_path: Option<PathBuf>) -> Result<()> {
    use simulator_law::{
        dsl::{parse_program, typecheck_program},
        register_law_dispatcher, Cadence, LawHandle, LawId, LawRegistry,
    };
    use simulator_law::registry::LawEffect;
    use std::sync::Arc;

    let scenario = Scenario::load(&path)?;
    tracing::info!(name = %scenario.name, "loaded scenario");

    let total = override_ticks.unwrap_or(scenario.ticks);
    let mut sim = Sim::new(scenario.seed);

    if let Some(law_path) = law_path.as_ref() {
        // Compile the .ugscat file and enact it via the registry.
        let src = std::fs::read_to_string(law_path)?;
        let program = parse_program(&src).map_err(|e| anyhow::anyhow!("parse: {e}"))?;
        typecheck_program(&program).map_err(|e| anyhow::anyhow!("typecheck: {e}"))?;
        register_law_dispatcher(&mut sim);
        let registry = sim.world.resource::<LawRegistry>().clone();
        let handle = LawHandle {
            id: LawId(0),
            version: 1,
            program: Arc::new(program),
            cadence: Cadence::Yearly,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect: LawEffect::PerCitizenIncomeTax {
                scope: "IncomeTax",
                owed_def: "tax_owed",
            },
        };
        let id = registry.enact(handle);
        tracing::info!(?id, "enacted law from {}", law_path.display());
    } else {
        simulator_systems::register_phase1_systems(&mut sim);
    }

    let spawn_start = Instant::now();
    scenario.spawn_population(&mut sim);
    let spawn_elapsed = spawn_start.elapsed();

    let start = Instant::now();
    for _ in 0..total {
        sim.step();
    }
    let elapsed = start.elapsed();

    let rate = total as f64 / elapsed.as_secs_f64();
    let treasury = sim.world.resource::<simulator_core::Treasury>().balance;
    println!(
        "scenario={} citizens={} ticks={} spawn={:.3}s tick={:.3}s rate={:.0} ticks/s treasury={} final_tick={}",
        scenario.name,
        scenario.population.citizens,
        total,
        spawn_elapsed.as_secs_f64(),
        elapsed.as_secs_f64(),
        rate,
        treasury,
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
