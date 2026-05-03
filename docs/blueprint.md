# UGS Blueprint

This document describes the system as it is intended to exist when the [roadmap](roadmap.md) is complete. For the system as it is **today**, see [methodology.md](methodology.md). For what we explicitly chose **not** to build and why, see the "What we explicitly dropped" section of the roadmap.

## Summary

UGS is a single-workstation deterministic policy laboratory. It models a synthetic polity at **two resolutions**:

1. **A discrete ECS substrate** (Rust, `bevy_ecs`) holding ~5,000 citizens with property-bag components — income, wealth, ideology, employment, health — advanced each tick by a small set of system rules (taxation, employment, opinion, approval, election).
2. **A small set of LLM-driven key actors** (~10: executive, legislators, party leaders, judiciary heads) modeled with a PIANO-lite cognitive controller for real-time concurrent reasoning and a PsychSim sidecar for recursive theory of mind at belief depth 1–2.

Laws enter the system as either a parameterized form (UI) or natural-language text (CLI via `ugs llm-extract`), are compiled through IG 2.0 to a Catala-inspired DSL, and are evaluated by a tree-walk interpreter inside the tick loop. Snapshots are deterministic and replayable; counterfactual difference-in-differences is the primary causal-inference primitive, with bootstrap confidence intervals.

## What this is not

- **Not multi-resolution in the AgentTorch sense.** An earlier blueprint described a third tier — a differentiable macro-tensor population running as a Python sidecar. This was dropped (see roadmap "Dropped"). The architecture is two tiers, not three.
- **Not empirically validated.** Scenarios may be initial-state-grounded against V-Dem (planned, item 3 in the roadmap), but no claim is made that simulator trajectories reproduce real-world political dynamics.
- **Not a forecast tool.** UGS is a structured-thought sandbox for evaluating the directional effect of stylized policies under a transparent rule set.

## Architecture

```
                        ┌──────────────────────────────────┐
                        │  Tauri 2 desktop UI (Svelte/TS)  │
                        │  - Scenario picker                │
                        │  - Form-based law proposal        │
                        │  - Counterfactual visualization   │
                        └────────────┬─────────────────────┘
                                     │  Tauri IPC
                                     ▼
                        ┌──────────────────────────────────┐
                        │       UGS Rust core (one process) │
                        │                                   │
                        │  ┌─────────────────────────────┐  │
                        │  │  ECS substrate              │  │
                        │  │  - simulator-core           │  │
                        │  │  - simulator-systems        │  │
                        │  │  - simulator-net (graph)    │  │
                        │  │  - simulator-econ           │  │
                        │  │    (bounded rationality,    │  │
                        │  │     corruption — planned)   │  │
                        │  └─────────────────────────────┘  │
                        │                                   │
                        │  ┌─────────────────────────────┐  │
                        │  │  Cognitive layer (planned)  │  │
                        │  │  - simulator-agents         │  │
                        │  │    (PIANO-lite controller)  │  │
                        │  │  - simulator-llm            │  │
                        │  │    (llama.cpp client)       │  │
                        │  └────────────┬────────────────┘  │
                        │               │                   │
                        │  ┌────────────▼────────────────┐  │
                        │  │  Legislative engine         │  │
                        │  │  - simulator-law            │  │
                        │  │    NL → IG 2.0 → Catala     │  │
                        │  │    → tree-walk interpreter  │  │
                        │  └─────────────────────────────┘  │
                        │                                   │
                        │  ┌─────────────────────────────┐  │
                        │  │  Causal & infra             │  │
                        │  │  - simulator-counterfactual │  │
                        │  │  - simulator-snapshot       │  │
                        │  │  - simulator-calibration    │  │
                        │  │    (V-Dem starting state)   │  │
                        │  │  - simulator-telemetry      │  │
                        │  └─────────────────────────────┘  │
                        └────────────┬─────────────────────┘
                                     │  Arrow Flight
                                     ▼
                        ┌──────────────────────────────────┐
                        │  PsychSim sidecar (Python)        │
                        │  Theory-of-mind for ~10 elites    │
                        │  - planned, see roadmap item 1    │
                        └──────────────────────────────────┘
```

Crates marked "planned" are tracked in [roadmap.md](roadmap.md). Crates not marked are working today; see [methodology.md](methodology.md) for the truthful per-crate status.

## Tick phases

The schedule is phase-ordered. Each tick advances:

1. **Mutate** — Citizen-level systems update wealth, employment, income, health from the previous tick's state.
2. **Cognitive** — *(currently empty; reserved for the PIANO-lite controller and PsychSim integration.)* Elite agents observe macro state, update beliefs, and emit decisions.
3. **Commit** — Law dispatcher fires laws on cadence; tax/benefit/fine/rights effects apply; legitimacy debt accumulates.
4. **Telemetry** — Metric store records the tick; opinion graph propagates on its 7-tick subcadence.

Determinism: same seed + same scenario + same law set ⇒ byte-identical snapshot hashes. Asserted by `ugs determinism` in CI.

## Interfaces a researcher uses

- **`ugs` CLI** — primary research interface. Scenario load, parameter sweep (via shell/Python orchestration), determinism check, snapshot/replay, NL→IG law extraction.
- **Tauri UI** — secondary; for interactive exploration, scenario inspection, and form-based law proposal. Does not surface seed control or sweep tooling today (see roadmap item 5).
- **Arrow Flight schema** ([`simulator-ipc/src/arrow_schema.rs`](../crates/simulator-ipc/src/arrow_schema.rs)) — for the planned PsychSim sidecar; also usable from Python notebooks for ad-hoc analysis.

## Crate layout

| Crate | Status | Purpose |
|---|---|---|
| `simulator-types` | live | Shared primitives, fixed-point money, typed IDs |
| `simulator-core` | live | World, Schedule, deterministic RNG, tick clock |
| `simulator-systems` | live | Built-in ECS systems (tax, employment, opinion, approval, election) |
| `simulator-econ` | **planned** | Behavioral microfoundations: bounded rationality + corruption (roadmap item 4) |
| `simulator-net` | live | Influence graph (CSR Erdős–Rényi); opinion propagation |
| `simulator-llm` | live | llama.cpp client, grammar-constrained extraction |
| `simulator-agents` | **planned** | PIANO-lite cognitive controller for key actors (roadmap item 2) |
| `simulator-law` | live | NL → IG 2.0 → UGS-Catala → tree-walk interpreter |
| `simulator-ipc` | scaffold | Arrow Flight schema; PsychSim sidecar wire-up planned (roadmap item 1) |
| `simulator-calibration` | scaffold | V-Dem CSV loader live; initial-state grounding planned (roadmap item 3) |
| `simulator-snapshot` | live | Deterministic columnar snapshot, blake3 hashing |
| `simulator-rl` | **dropped** | Adversarial RL harness — see roadmap "Dropped" |
| `simulator-counterfactual` | live | DiD pair/triple, Monte Carlo bootstrap CIs |
| `simulator-scenario` | live | YAML scenario format + spawn |
| `simulator-cli` | live | `ugs` headless binary |
| `simulator-telemetry` | live | Tracing spans, perf counters |

"live" = working code, exercised by tests. "scaffold" = non-empty but not wired into the tick loop. "planned" = empty modules with a roadmap entry. "dropped" = empty modules with no planned work; see roadmap for the reason.

## Where to read more

- [methodology.md](methodology.md) — truthful current state, per-crate.
- [roadmap.md](roadmap.md) — what we are building, what we dropped, and why.
