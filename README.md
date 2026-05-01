# Universal Government Simulator (UGS)

A single-workstation, GPU-accelerated policy laboratory modeling a synthetic
polity at three resolutions: a differentiable macro-tensor population
(AgentTorch), a mid-tier discrete ECS substrate, and a small set of
LLM-driven key actors with PIANO-style cognition and PsychSim Theory of Mind.
Includes a natural-language legislative engine that compiles English law
through IG 2.0 to a Catala-inspired DSL, JIT-compiled into hot-loaded
ECS systems within a single tick.

## Architecture

See [docs/blueprint.md](docs/blueprint.md) for the full locked architecture.
High-level layering:

- **Tauri 2 desktop shell** — minimal TS/Svelte chrome
- **UGS Rust core** (one process)
  - Cognitive layer: `simulator-agents`, `simulator-llm` + PsychSim sidecar
  - Legislative engine: `simulator-law` (NL → IG 2.0 → UGS-Catala → Cranelift)
  - ECS core: `simulator-core` (bevy_ecs 0.15 standalone) + `simulator-systems`
  - Behavioral layer: `simulator-ipc` ↔ AgentTorch sidecar
  - Validation: `simulator-calibration`, `simulator-rl`

## Quickstart (Phase 0)

```bash
# Build everything
cargo build

# Run hello-world tick
cargo run -p simulator-cli -- run --scenario scenarios/hello.yaml

# xtask runner
cargo xtask --help
```

## Workspace layout

See `Cargo.toml` for the complete crate list; a high-level summary:

| Crate                    | Purpose                                              |
|--------------------------|------------------------------------------------------|
| `simulator-types`        | Shared primitives, fixed-point money, typed IDs      |
| `simulator-core`         | World, Schedule, deterministic RNG, tick clock       |
| `simulator-systems`      | Built-in ECS Systems (tax, employment, opinion, …)   |
| `simulator-econ`         | Behavioral economics, corruption, contagion          |
| `simulator-net`          | Influence/transaction/message graph                  |
| `simulator-llm`          | llama.cpp client, batching, grammar-constrained      |
| `simulator-agents`       | PIANO modules + Plan-then-Execute executor           |
| `simulator-law`          | NL → IG 2.0 → UGS-Catala → JIT pipeline              |
| `simulator-ipc`          | Arrow Flight + Cap'n Proto sidecar bridges           |
| `simulator-calibration`  | V-Dem ingestion (Polars), IRT, scenario calibration  |
| `simulator-snapshot`     | Deterministic replay, columnar snapshot              |
| `simulator-rl`           | Adversarial RL harness (Rust side)                   |
| `simulator-scenario`     | YAML scenario format + runner                        |
| `simulator-cli`          | `ugs` headless binary                                |
| `simulator-telemetry`    | Tracing spans, perf counters                         |

## License

Apache-2.0.
