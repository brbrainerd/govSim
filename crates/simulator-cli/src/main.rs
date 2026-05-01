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
        /// Optional IG 2.0 JSON statement (with structured `computation`).
        /// Lowered to UGS-Catala and enacted exactly as `--law` would be.
        /// Mutually exclusive with `--law`.
        #[arg(long, conflicts_with = "law")]
        law_ig2: Option<PathBuf>,
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
        file: Option<PathBuf>,
        /// Write the IG 2.0 JSON Schema to data/grammars/ig2_schema.json.
        #[arg(long)]
        schema: bool,
    },
}

fn main() -> Result<()> {
    simulator_telemetry::init();
    match Cli::parse().cmd {
        Cmd::Run { scenario, ticks, law, law_ig2 } => run(scenario, ticks, law, law_ig2),
        Cmd::Replay { snapshot } => {
            tracing::warn!(?snapshot, "replay: not yet implemented (Phase 1)");
            Ok(())
        }
        Cmd::Bench { ticks } => bench(ticks),
        Cmd::LawCompile { file, schema } => law_compile(file, schema),
    }
}

fn run(
    path: PathBuf,
    override_ticks: Option<u64>,
    law_path: Option<PathBuf>,
    law_ig2_path: Option<PathBuf>,
) -> Result<()> {
    use simulator_law::{
        dsl::{parse_program, typecheck_program},
        ig2::IgStatement,
        lower::lower_statement,
        register_law_dispatcher, Cadence, LawHandle, LawId, LawRegistry,
    };
    use simulator_law::registry::LawEffect;
    use std::sync::Arc;

    let scenario = Scenario::load(&path)?;
    tracing::info!(name = %scenario.name, "loaded scenario");

    let total = override_ticks.unwrap_or(scenario.ticks);
    let mut sim = Sim::new(scenario.seed);

    enum CompiledLaw {
        Direct {
            program: simulator_law::dsl::Program,
            cadence: Cadence,
            effect: LawEffect,
        },
    }

    let compiled = if let Some(p) = law_path.as_ref() {
        let src = std::fs::read_to_string(p)?;
        let program = parse_program(&src).map_err(|e| anyhow::anyhow!("parse: {e}"))?;
        typecheck_program(&program).map_err(|e| anyhow::anyhow!("typecheck: {e}"))?;
        Some(CompiledLaw::Direct {
            program,
            cadence: Cadence::Yearly,
            effect: LawEffect::PerCitizenIncomeTax {
                scope: "IncomeTax",
                owed_def: "tax_owed",
            },
        })
    } else if let Some(p) = law_ig2_path.as_ref() {
        let json = std::fs::read_to_string(p)?;
        let stmt: IgStatement = serde_json::from_str(&json)?;
        let lowered = lower_statement(&stmt).map_err(|e| anyhow::anyhow!("lower: {e}"))?;
        typecheck_program(&lowered.program).map_err(|e| anyhow::anyhow!("typecheck: {e}"))?;
        Some(CompiledLaw::Direct {
            program: lowered.program,
            cadence: lowered.cadence,
            effect: lowered.effect,
        })
    } else {
        None
    };

    if let Some(CompiledLaw::Direct { program, cadence, effect }) = compiled {
        register_law_dispatcher(&mut sim);
        let registry = sim.world.resource::<LawRegistry>().clone();
        let id = registry.enact(LawHandle {
            id: LawId(0),
            version: 1,
            program: Arc::new(program),
            cadence,
            effective_from_tick: 0,
            effective_until_tick: None,
            effect,
        });
        tracing::info!(?id, "enacted law");
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

fn law_compile(file: Option<PathBuf>, schema: bool) -> Result<()> {
    if schema {
        let json = simulator_law::ig2_json_schema();
        let out = std::path::Path::new("data/grammars/ig2_schema.json");
        std::fs::create_dir_all(out.parent().unwrap())?;
        std::fs::write(out, &json)?;
        println!("wrote {}", out.display());
        // Sanity-check: the existing fixture must round-trip against the schema.
        let fixture = std::path::Path::new("scenarios/income_tax_2026.ig2.json");
        if fixture.exists() {
            let raw = std::fs::read_to_string(fixture)?;
            let _: simulator_law::ig2::IgStatement = serde_json::from_str(&raw)
                .map_err(|e| anyhow::anyhow!("fixture round-trip failed: {e}"))?;
            println!("fixture round-trip ok");
        }
        return Ok(());
    }
    if let Some(f) = file {
        tracing::warn!(?f, "law compile: not yet implemented (Phase 4)");
    } else {
        eprintln!("law-compile: pass --file or --schema");
    }
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
