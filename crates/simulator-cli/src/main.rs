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
    /// Save a snapshot mid-run and resume from it.
    Replay {
        #[arg(long)]
        scenario: PathBuf,
        /// Tick at which to snapshot, then resume and run to this total.
        #[arg(long, default_value_t = 100)]
        ticks: u64,
        /// Snapshot tick (must be < ticks).
        #[arg(long, default_value_t = 50)]
        snapshot_at: u64,
        /// Path to write/read the snapshot file.
        #[arg(long, default_value = "snapshot.bin")]
        out: PathBuf,
    },
    /// Benchmark tick rate (Phase 1).
    Bench {
        #[arg(long, default_value_t = 10_000)]
        ticks: u64,
    },
    /// Run a scenario twice with the same seed; assert state hashes match.
    Determinism {
        #[arg(long)]
        scenario: PathBuf,
        #[arg(long, default_value_t = 100)]
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
    /// Extract IG 2.0 JSON from natural-language policy text via local LLM.
    LlmExtract {
        /// Free-text policy description.
        text: String,
        /// Pretty-print the JSON output.
        #[arg(long)]
        pretty: bool,
    },
    /// Look up a CountryProfile from V-Dem v16.
    Calibrate {
        /// ISO 3-letter country code (e.g. AUS, USA, DEU).
        #[arg(long)]
        country: String,
        /// Year to look up (uses most-recent available if absent).
        #[arg(long, default_value_t = 2022)]
        year: i32,
    },
}

fn main() -> Result<()> {
    simulator_telemetry::init();
    match Cli::parse().cmd {
        Cmd::Run { scenario, ticks, law, law_ig2 } => run(scenario, ticks, law, law_ig2),
        Cmd::Replay { scenario, ticks, snapshot_at, out } => {
            replay(scenario, ticks, snapshot_at, out)
        }
        Cmd::Bench { ticks } => bench(ticks),
        Cmd::Determinism { scenario, ticks } => determinism(scenario, ticks),
        Cmd::LawCompile { file, schema } => law_compile(file, schema),
        Cmd::LlmExtract { text, pretty } => llm_extract(text, pretty),
        Cmd::Calibrate { country, year } => calibrate(country, year),
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

    let use_phase1 = compiled.is_none();

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

    if use_phase1 {
        // Build the influence graph after spawn so we know n_citizens.
        // p=0.002 → ~200 neighbours per citizen for 100K population.
        simulator_systems::build_influence_graph(
            &mut sim,
            scenario.population.citizens as usize,
            0.0001,
        );
    }

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

fn determinism(path: PathBuf, ticks: u64) -> Result<()> {
    use simulator_law::{
        dsl::typecheck_program,
        ig2::IgStatement,
        lower::lower_statement,
        register_law_dispatcher, LawHandle, LawId, LawRegistry,
    };
    
    use simulator_snapshot::state_hash;
    use std::sync::Arc;

    // ---- Phase-1 path (no law) ----
    let run_phase1 = |path: &PathBuf, ticks: u64| -> Result<[u8; 32]> {
        let scenario = Scenario::load(path)?;
        let mut sim = Sim::new(scenario.seed);
        simulator_systems::register_phase1_systems(&mut sim);
        scenario.spawn_population(&mut sim);
        simulator_systems::build_influence_graph(
            &mut sim,
            scenario.population.citizens as usize,
            0.0001,
        );
        for _ in 0..ticks { sim.step(); }
        Ok(state_hash(&mut sim.world))
    };

    // ---- Law-dispatcher path (IG 2.0 bracketed tax) ----
    let run_law = |path: &PathBuf, ticks: u64| -> Result<[u8; 32]> {
        let scenario = Scenario::load(path)?;
        let mut sim = Sim::new(scenario.seed);
        register_law_dispatcher(&mut sim);
        // Enact the bracketed income tax from the IG 2.0 fixture.
        let ig2_path = std::path::Path::new("scenarios/income_tax_2026.ig2.json");
        if ig2_path.exists() {
            let json = std::fs::read_to_string(ig2_path)?;
            let stmt: IgStatement = serde_json::from_str(&json)?;
            let lowered = lower_statement(&stmt).map_err(|e| anyhow::anyhow!("{e}"))?;
            typecheck_program(&lowered.program).map_err(|e| anyhow::anyhow!("{e}"))?;
            let registry = sim.world.resource::<LawRegistry>().clone();
            registry.enact(LawHandle {
                id: LawId(0),
                version: 1,
                program: Arc::new(lowered.program),
                cadence: lowered.cadence,
                effective_from_tick: 0,
                effective_until_tick: None,
                effect: lowered.effect,
            });
        }
        scenario.spawn_population(&mut sim);
        for _ in 0..ticks { sim.step(); }
        Ok(state_hash(&mut sim.world))
    };

    let h1 = run_phase1(&path, ticks)?;
    let h2 = run_phase1(&path, ticks)?;
    let h3 = run_law(&path, ticks)?;
    let h4 = run_law(&path, ticks)?;

    let hex = |b: &[u8; 32]| b.iter().map(|x| format!("{x:02x}")).collect::<String>();
    println!("phase1 run1: {}", hex(&h1));
    println!("phase1 run2: {}", hex(&h2));
    println!("law    run1: {}", hex(&h3));
    println!("law    run2: {}", hex(&h4));

    let mut ok = true;
    if h1 != h2 { eprintln!("FAIL: phase1 runs differ"); ok = false; }
    if h3 != h4 { eprintln!("FAIL: law runs differ"); ok = false; }
    if ok { println!("determinism: OK (both paths)"); Ok(()) }
    else   { anyhow::bail!("determinism FAIL") }
}

fn replay(
    path: PathBuf,
    total_ticks: u64,
    snapshot_at: u64,
    out: PathBuf,
) -> Result<()> {
    use simulator_snapshot::{save_snapshot, load_snapshot, state_hash};

    anyhow::ensure!(snapshot_at < total_ticks, "--snapshot-at must be < --ticks");

    // Phase A: run to snapshot_at, save, record hash.
    let hash_a = {
        let scenario = Scenario::load(&path)?;
        let mut sim = Sim::new(scenario.seed);
        simulator_systems::register_phase1_systems(&mut sim);
        scenario.spawn_population(&mut sim);
        simulator_systems::build_influence_graph(
            &mut sim,
            scenario.population.citizens as usize,
            0.0001,
        );
        for _ in 0..snapshot_at { sim.step(); }

        let blob = save_snapshot(&mut sim.world)?;
        std::fs::write(&out, &blob)?;
        tracing::info!(tick = snapshot_at, bytes = blob.len(), "snapshot saved");

        // Continue to total in same run.
        for _ in snapshot_at..total_ticks { sim.step(); }
        state_hash(&mut sim.world)
    };

    // Phase B: restore snapshot, continue to total_ticks, record hash.
    let hash_b = {
        let scenario = Scenario::load(&path)?;
        let mut sim = Sim::new(scenario.seed);
        simulator_systems::register_phase1_systems(&mut sim);
        // No population spawn — loaded from snapshot.
        let blob = std::fs::read(&out)?;
        let (n, init_pop) = load_snapshot(&mut sim.world, &blob)?;
        tracing::info!(tick = snapshot_at, citizens = n, "snapshot loaded");

        // InfluenceGraph is now embedded in the snapshot; only rebuild if absent
        // (e.g. old-format snapshot or empty-world bench).
        use simulator_net::graph::InfluenceGraph;
        if sim.world.get_resource::<InfluenceGraph>().is_none() && init_pop > 0 {
            simulator_systems::build_influence_graph(&mut sim, init_pop as usize, 0.0001);
        }

        for _ in snapshot_at..total_ticks { sim.step(); }
        state_hash(&mut sim.world)
    };

    let hex = |b: &[u8; 32]| b.iter().map(|x| format!("{x:02x}")).collect::<String>();
    println!("continuous:  {}", hex(&hash_a));
    println!("from-replay: {}", hex(&hash_b));

    if hash_a == hash_b {
        println!("replay: OK");
    } else {
        anyhow::bail!("replay: hashes differ — snapshot round-trip is broken");
    }
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

fn llm_extract(text: String, pretty: bool) -> Result<()> {
    use simulator_llm::IgExtractor;
    use simulator_law::ig2::IgStatement;

    let extractor = IgExtractor::new().map_err(|e| anyhow::anyhow!("{e}"))?;
    let raw = extractor.extract_raw(&text).map_err(|e| anyhow::anyhow!("{e}"))?;

    if pretty {
        let stmt: IgStatement = serde_json::from_str(&raw)
            .map_err(|e| anyhow::anyhow!("parse: {e}"))?;
        println!("{}", serde_json::to_string_pretty(&stmt)?);
    } else {
        println!("{raw}");
    }
    Ok(())
}

fn calibrate(country: String, year: i32) -> Result<()> {
    use simulator_calibration::VdemLoader;
    let loader = VdemLoader::new();
    match loader.load(&country, year) {
        Ok(profile) => {
            println!("{}", serde_json::to_string_pretty(&profile)?);
            println!();
            println!("# Paste into your scenario YAML under `population:`:");
            println!("  income_mean_monthly: {:.1}", profile.monthly_income_mean());
            println!("  unemployment_rate: {:.4}", profile.baseline_unemployment());
            println!("  corruption_level: {:.4}", profile.corruption);
        }
        Err(e) => {
            eprintln!("calibrate error: {e}");
            std::process::exit(1);
        }
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
