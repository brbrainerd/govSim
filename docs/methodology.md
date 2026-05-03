# Methodology — what UGS actually does today

This page is for researchers evaluating whether to use UGS for serious work. It is deliberately blunt about what runs today. Anything not stated here as "implemented" should be treated as not-yet-real.

Companion documents:
- [blueprint.md](blueprint.md) — the architecture as it is intended to exist when the roadmap is complete.
- [roadmap.md](roadmap.md) — what we are building, what we explicitly dropped, and why.

Last verified against commit `91ee094` on the `claude/nervous-lumiere-2bb56f` branch.

## TL;DR

UGS today is a **deterministic agent-based macro simulator** with a working **legislative DSL** and **counterfactual difference-in-differences** harness. The cognitive layer (PIANO-lite, PsychSim ToM), V-Dem initial-state grounding, and the behavioral microfoundations in `simulator-econ` are **planned but not implemented** — they exist as empty module declarations and are tracked in [roadmap.md](roadmap.md). The differentiable AgentTorch sidecar, Cranelift JIT for laws, and the adversarial RL harness were considered and **explicitly dropped** — see the roadmap for the reasoning. All quantitative dynamics today rest on hardcoded constants chosen by inspection, not estimated from data.

If you need a model with empirical calibration, learned agent behavior, or theory-of-mind reasoning, **UGS is not that tool yet** (some of these are on the roadmap; others were dropped). If you need a deterministic, snapshot-replayable sandbox for evaluating the directional effect of stylized policies under a transparent rule set, it is fit for that purpose.

## What is implemented

### Tick loop and ECS core
A phase-ordered schedule (Mutate → Cognitive → Commit → Telemetry) over a `bevy_ecs` 0.15 world, with a deterministic seeded RNG and snapshot/replay infrastructure ([crates/simulator-core/](../crates/simulator-core/), [crates/simulator-snapshot/](../crates/simulator-snapshot/)). Snapshots are zstd-compressed columnar bincode hashed with blake3; the same seed and scenario produce byte-identical hashes across runs (asserted by `ugs determinism`).

### Citizen-level systems ([crates/simulator-systems/](../crates/simulator-systems/))
Implemented and running every tick:

- **Taxation.** Flat 20% income tax, monthly cadence, scaled by a `tax_collection_efficiency` term from StateCapacity. No progressive brackets, no evasion, no informal economy.
- **Employment.** Two-state Markov chain with hardcoded transition rates (Employed→Unemployed 0.5%, Unemployed→Employed 5%), giving ~10% steady-state unemployment. No wage bargaining, no labor-supply elasticity.
- **Income.** Quarterly update with productivity drift (±2%), wage scarring (−0.5% while unemployed), on-the-job learning (+0.1%). Hard floors and caps: minimum $1,500/month, productivity capped at 0.98.
- **Approval.** Multi-factor function of employment shock, tax shock, spend shock, and reversion to a neutral baseline; pollution drag saturates at 0.008. Ideology-weighted left/right tax preference. Coefficients are tuned by inspection to avoid degenerate equilibria, not estimated.
- **Opinion dynamics.** A static Erdős–Rényi influence graph (CSR-encoded, weights uniform in [−1, 1]) drives 5-axis ideology drift on a 7-tick cadence with damping 0.02 ([crates/simulator-net/](../crates/simulator-net/)). The graph does not rewire in response to behavior.
- **Elections.** First-past-the-post, monthly cycle every 360 ticks, ballot-majority wins.
- **Inflation, health, education, migration, birth/death.** Present but skeletal — random-walk processes without endogenous drivers.

### Legislative engine ([crates/simulator-law/](../crates/simulator-law/))
The most complete subsystem outside the tick loop.

- **IG 2.0 AST** with serde JSON serialization.
- **UGS-Catala parser** (chumsky PEG) supporting default rules, exceptions, field access, arithmetic, and Boolean logic.
- **Tree-walk interpreter** in `eval.rs`. O(n_citizens) per law per firing.
- **LawDispatcher** runs active laws on EveryTick / Monthly / Quarterly / Yearly cadences and applies tax, benefit, fine, and rights modifications.
- **Legitimacy debt and crisis linkage** are implemented as a binary threshold trigger.

What does **not** exist: Cranelift JIT compilation (`pub mod jit {}` is empty — **dropped from roadmap**, tree-walk is fast enough), wasmtime sandboxing (`pub mod wasm {}` is empty — **dropped**), retroactive application, and amendment history.

### Counterfactual estimation ([crates/simulator-counterfactual/](../crates/simulator-counterfactual/))
Genuinely working end-to-end.

- `CounterfactualPair` forks a snapshot, applies a law to the treatment arm only, steps both forward, and computes a difference-in-differences estimate.
- `MonteCarloRunner` sweeps post-enactment seeds to produce a distribution of estimates with bootstrap 95% confidence intervals.
- `CounterfactualTriple` supports three-arm comparisons (two treatments + control).

Researchers should note: the "uncertainty" surfaced by the Monte Carlo CI reflects only **stochastic variation in the simulator under varied seeds**, not parameter uncertainty, model uncertainty, or empirical sampling error. It is not a confidence interval over a real-world quantity.

### Headless CLI ([crates/simulator-cli/](../crates/simulator-cli/))
The `ugs` binary exposes `run`, `replay`, `bench`, `determinism`, `law-compile`, `llm-extract`, and `calibrate` subcommands. For programmatic experiments — parameter sweeps, batch runs, reproducibility checks — the CLI is the primary research interface, not the Tauri UI.

### LLM policy extraction ([crates/simulator-llm/](../crates/simulator-llm/))
A llama.cpp subprocess wrapper (`IgExtractor`) converts natural-language policy text into IG 2.0 JSON via grammar-constrained decoding (n_predict=512, temp=0.0). It is called offline by the CLI's `llm-extract` subcommand. **It is not wired into the tick loop**, and it is not exposed in the Tauri UI today.

## What is stubbed

These crates contain only module declarations — no functional code. Each is either **planned** (tracked in [roadmap.md](roadmap.md)) or **dropped** (off the roadmap with stated reasoning).

| Crate | LoC | What's there | Status |
|---|---|---|---|
| [simulator-agents](../crates/simulator-agents/src/lib.rs) | 14 | Empty `piano::{controller, perception, ...}`, `arbiter`, `executor`, `actions` | **planned** — PIANO-lite for ~10 key actors only ([roadmap item 2](roadmap.md)) |
| [simulator-econ](../crates/simulator-econ/src/lib.rs) | 6 | Empty `bounded_rationality`, `corruption`, `contagion`, `social_capital` | **partly planned** — bounded rationality + corruption are roadmap item 4; contagion + social capital are deferred |
| [simulator-rl](../crates/simulator-rl/src/lib.rs) | 3 | Empty `env`, `flight` | **dropped** — see roadmap "Dropped" |

## What is partially implemented

### V-Dem calibration ([crates/simulator-calibration/](../crates/simulator-calibration/))
The README's "V-Dem ingestion (Polars), IRT, scenario calibration" is one-third real.

- **Implemented:** A CSV loader (~175 LoC) that reads the Harvard Dataverse V-Dem v16 dump (downloaded via `cargo xtask vdem ingest`) and extracts a 9-column `CountryProfile`. Two heuristic accessors derive a baseline unemployment rate (`(0.20 - egal_dem * 0.15).clamp(0.03, 0.30)`) and a monthly income mean (`gdp_per_capita / 12`, floored at 200). The `ugs calibrate --country AUS --year 2022` subcommand prints these as a YAML snippet for manual paste.
- **Empty stubs:** `pub mod irt {}` and `pub mod mapping {}` contain no code.
- **No validation:** unit tests exercise the heuristic math against synthetic profiles only; no test compares simulator output to V-Dem values.
- **Not wired in:** no built-in scenario currently sources its parameters from `ugs calibrate` output. Scenarios are hand-authored YAML.

The "V-Dem calibrated" tag on the Modern Democracy scenario in the UI is **marketing copy, not a verified property**.

### Snapshot / replay ([crates/simulator-snapshot/](../crates/simulator-snapshot/))
World-state snapshots and deterministic replay work. User-action replay (`pub mod action_log {}`) is stubbed — you cannot record and re-execute a sequence of policy edits.

### IPC sidecars ([crates/simulator-ipc/](../crates/simulator-ipc/))
Arrow Flight schema for `MacroIndicators` is defined and a `MacroFlightClient` exists, but `fetch()` returns a hardcoded zero state. The `agenttorch`, `psychsim`, `shm`, and `capnp` modules are empty. **There is no running PsychSim sidecar today** ([roadmap item 1](roadmap.md) plans to wire one up). **The AgentTorch sidecar was dropped from the roadmap** — see roadmap "Dropped" for the reasoning. The architecture is today a single-resolution ECS simulator.

## Reproducibility notes for researchers

- **Determinism** holds at the engine level: same seed + same scenario + same law DSL ⇒ identical snapshot hashes. `ugs determinism` enforces this in CI.
- **Seed control** is exposed via the scenario YAML (`scenario.seed`) and the CLI. It is **not** currently surfaced in the Tauri UI; UI users get whatever seed the loaded scenario was authored with.
- **Monte Carlo seeds** in the counterfactual runner are not currently enumerated in the CSV exports. To audit which seeds were used, run via the CLI.
- **Tick semantics:** one tick is approximately one day in calendar terms; cadences (Monthly, Quarterly, Yearly) collapse to 30 / 90 / 360 ticks. This is a modeling convention, not a calibrated time unit.
- **No real-world data flows in.** Citizen attributes, network structure, employment dynamics, and approval dynamics are all synthetic. The simulator should be read as a structured-thought sandbox, not a forecast tool.

## Known limitations a paper using UGS would need to disclose

1. **Hardcoded constants** govern all quantitative dynamics. Sensitivity analysis is the responsibility of the user.
2. **No agent learning or adaptation** — the "agents" are property bags advanced by global rules. Calling them agents is generous.
3. **Single-resolution model** — the cognitive layer for key actors is planned ([roadmap items 1–2](roadmap.md)) but not implemented today. The previously-pitched third tier (macro-tensor / AgentTorch) was dropped.
4. **No empirical validation** — no published comparison of simulator output against any real-world dataset exists in this repository.
5. **Counterfactual CIs reflect simulator stochasticity only**, not real-world uncertainty.
6. **Legislative coverage is narrow.** Only the IG 2.0 effect kinds wired into the dispatcher (tax, benefit, fine, rights) take effect; richer legal structures parse but do nothing.

## Where to look in the code

| If you want to understand… | Read |
|---|---|
| What runs each tick | [crates/simulator-core/src/schedule.rs](../crates/simulator-core/src/schedule.rs), [crates/simulator-systems/src/](../crates/simulator-systems/src/) |
| How a law executes | [crates/simulator-law/src/eval.rs](../crates/simulator-law/src/eval.rs), [crates/simulator-law/src/system.rs](../crates/simulator-law/src/system.rs) |
| How counterfactuals are computed | [crates/simulator-counterfactual/src/pair.rs](../crates/simulator-counterfactual/src/pair.rs) |
| What "calibration" actually means | [crates/simulator-calibration/src/vdem.rs](../crates/simulator-calibration/src/vdem.rs) |
| What the CLI can do | [crates/simulator-cli/src/main.rs](../crates/simulator-cli/src/main.rs) |
