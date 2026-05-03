# Universal Government Simulator (UGS)

A single-workstation deterministic policy laboratory for synthetic-polity research. UGS pairs a Rust ECS substrate (~5,000 citizens with rule-based dynamics) with a legislative engine that compiles natural-language policies through IG 2.0 to a Catala-inspired DSL, evaluated by a tree-walk interpreter inside the tick loop. Counterfactual difference-in-differences with bootstrap confidence intervals is the primary causal-inference primitive.

UGS is a **research instrument**, not a forecasting tool. All quantitative dynamics today rest on hardcoded constants chosen by inspection, not estimated from data. See [docs/methodology.md](docs/methodology.md) for the truthful current state and [docs/roadmap.md](docs/roadmap.md) for what we are building next.

## Read this before using UGS for research

- [docs/methodology.md](docs/methodology.md) — what runs today, per-crate, with named limitations a paper using UGS would need to disclose.
- [docs/blueprint.md](docs/blueprint.md) — the architecture as it is intended to exist when the roadmap is complete.
- [docs/roadmap.md](docs/roadmap.md) — what we are building, what we explicitly dropped, and why.

## What works today

- **Deterministic ECS tick loop.** Same seed + same scenario + same law set ⇒ byte-identical snapshot hashes (asserted by `ugs determinism`).
- **Citizen-level systems.** Taxation, employment, income, approval, opinion (over a static Erdős–Rényi influence graph), elections.
- **Legislative engine.** Natural language → IG 2.0 → UGS-Catala DSL → tree-walk interpreter. Tax / benefit / fine / rights effects; Monthly / Quarterly / Yearly cadences.
- **Counterfactual harness.** DiD pair/triple comparisons with Monte Carlo bootstrap CIs over post-enactment seeds.
- **Snapshot / replay.** Columnar zstd-bincode snapshots, blake3 hashing.
- **CLI.** `ugs run`, `ugs replay`, `ugs determinism`, `ugs law-compile`, `ugs llm-extract`, `ugs calibrate`. The CLI is the primary research interface.
- **Tauri desktop UI.** Form-based law proposal, dashboards, intra-scenario law-vs-law comparison, CSV export. Secondary to the CLI for serious research use.

## What is planned (not yet built)

Tracked in detail in [docs/roadmap.md](docs/roadmap.md):

1. **PsychSim sidecar** for theory-of-mind reasoning over ~10 key actors (executive, legislators, party leaders, judiciary heads).
2. **PIANO-lite cognitive controller** for those same key actors. *Citizens stay rule-based.*
3. **V-Dem initial-state grounding** for ~10–20 country-year fixtures (initial state only — not trajectory validation).
4. **Behavioral microfoundations in `simulator-econ`**: bounded rationality + corruption.
5. **Sweep + Sobol sensitivity tooling** on the existing CLI.

## What was considered and dropped

These were in earlier architecture sketches and are now off the roadmap with stated reasons (see [docs/roadmap.md](docs/roadmap.md) for details):

- **AgentTorch differentiable sidecar.** Replaced by sweep + Sobol tooling. Gradients buy nothing at N=5K that overnight CLI sweeps don't already give us.
- **Cranelift JIT for laws.** Tree-walk interpreter is not a measured bottleneck; revisit only if profiling shows otherwise.
- **Adversarial RL harness.** Niche, no measured demand.
- **PIANO on the citizenry.** Per-agent LLM calls at 5K agents would dominate cost by orders of magnitude.

## Quickstart

```bash
# Build everything
cargo build

# Run hello-world tick
cargo run -p simulator-cli -- run --scenario scenarios/hello.yaml

# Verify determinism
cargo run -p simulator-cli -- determinism --scenario scenarios/hello.yaml

# Extract a law from natural-language text
cargo run -p simulator-cli -- llm-extract --text "Tax incomes above $100k at 35%."

# xtask runner
cargo xtask --help
```

## Workspace layout

See `Cargo.toml` for the complete crate list. Status column reflects what runs today, per [docs/methodology.md](docs/methodology.md):

| Crate                    | Status   | Purpose                                              |
|--------------------------|----------|------------------------------------------------------|
| `simulator-types`        | live     | Shared primitives, fixed-point money, typed IDs      |
| `simulator-core`         | live     | World, Schedule, deterministic RNG, tick clock       |
| `simulator-systems`      | live     | Built-in ECS systems (tax, employment, opinion, …)   |
| `simulator-econ`         | planned  | Bounded rationality + corruption (roadmap item 4)    |
| `simulator-net`          | live     | Influence graph (CSR Erdős–Rényi); opinion           |
| `simulator-llm`          | live     | llama.cpp client, grammar-constrained extraction     |
| `simulator-agents`       | planned  | PIANO-lite controller for key actors (roadmap item 2)|
| `simulator-law`          | live     | NL → IG 2.0 → UGS-Catala → tree-walk interpreter     |
| `simulator-ipc`          | scaffold | Arrow Flight schema; PsychSim sidecar (roadmap item 1)|
| `simulator-calibration`  | scaffold | V-Dem loader; initial-state grounding (roadmap item 3)|
| `simulator-snapshot`     | live     | Deterministic columnar snapshot                      |
| `simulator-rl`           | dropped  | Adversarial RL harness — see roadmap "Dropped"       |
| `simulator-counterfactual`| live    | DiD pair/triple, Monte Carlo bootstrap CIs           |
| `simulator-scenario`     | live     | YAML scenario format + spawn                         |
| `simulator-cli`          | live     | `ugs` headless binary                                |
| `simulator-telemetry`    | live     | Tracing spans, perf counters                         |

"live" = working code, exercised by tests. "scaffold" = non-empty but not wired into the tick loop. "planned" = empty modules with a roadmap entry. "dropped" = empty modules with no planned work; see roadmap for the reason.

## License

Apache-2.0.
