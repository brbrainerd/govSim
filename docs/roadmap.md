# Roadmap — what UGS is becoming, and what it's not

This document is the canonical aspiration for UGS. It supersedes the architectural claims in older versions of the README. It is paired with [methodology.md](methodology.md), which is the canonical statement of what works *today*.

The principle: **aspiration must be defensible to a peer reviewer**. Every kept item has a research question it answers; every dropped item has a reason it was dropped.

## What we are building

### 1. PsychSim sidecar for key actors

**Goal.** Recursive theory-of-mind for the ~10 elite agents (executive, legislators, party leaders, judiciary heads). Each holds beliefs over world state and nested models of other elites at depth 1–2.

**Why.** Simulating elite strategic behavior with rule-based logic or vanilla LLM prompts cannot answer questions like *"how does adding 2nd-order ToM to the opposition leader change the equilibrium of a polarization scenario?"* PsychSim is a 20-year-old decision-theoretic POMDP framework, actively maintained at USC ICT, pip-installable, with deployments in IARPA's ReSCIND program (2024) and hurricane evacuation modeling. It earns peer-review legitimacy on belief-dynamics questions.

**Integration shape.** Python sidecar. The existing `simulator-ipc` Arrow Flight scaffold ([crates/simulator-ipc/](../crates/simulator-ipc/)) provides a one-way macro-indicators schema and a stub client; this is a starting point, not a finished IPC. The real work is non-trivial: define a *bidirectional* protocol (Rust→Python observation batches, Python→Rust elite decisions) on top of the existing schema, stand up a long-lived Python service with health/lifecycle handling, and wire a tick-loop hook into `Phase::Cognitive`. Smaller than building from scratch; larger than a one-day plumbing job.

**Scope discipline.** Elites only. Not citizens. Not surface rhetoric (LLM prompts handle that). Belief depth capped at 2 (deeper is computationally exponential and rarely reviewer-defensible).

**Research questions unlocked.** Misperception cascades; signaling under uncertainty; second-order belief shifts after policy announcements; conditions under which leaders expect miscalibrated public reaction.

### 2. PIANO-lite cognitive controller for key actors

**Goal.** A stripped-down version of Altera's PIANO architecture (Project Sid, 2024) — concurrent goal / social-awareness / action-awareness modules with a coherence checker — wrapping each of the ~10 key actors.

**Why.** Sequential ReAct-style LLM loops stall and contradict themselves when an agent must simultaneously plan, communicate, and react to fast-moving events. PIANO addresses this. Pairing PIANO-lite (real-time coherence) with PsychSim (formal ToM) gives elite agents both surface plausibility and defensible internal structure.

**Integration shape.** Rust-side controller in `simulator-agents` ([crates/simulator-agents/](../crates/simulator-agents/) — currently empty). Hooks into the reserved `Phase::Cognitive` slot in [simulator-core/src/schedule.rs](../crates/simulator-core/src/schedule.rs). LLM calls go through `simulator-llm`'s existing llama.cpp client.

**Scope discipline.** Key actors only — never citizens. Project Sid hit ~1000 agents in Minecraft; UGS has 5,000 citizens, and per-agent LLM calls would dominate cost by orders of magnitude. Citizens remain rule-based.

**What we are NOT promising.** Full Altera PIANO — that codebase is paper-companion, not a framework. We are lifting the architectural pattern, not adopting an upstream project.

### 3. Multi-source initial-state grounding (10–20 country-years)

**Goal.** Documented mappings from V-Dem (political indices) + World Bank WDI (unemployment, GDP per capita) — and possibly Penn World Table (labor share) — to UGS scenario state, with ~10–20 country-year fixtures (e.g., Tunisia 2011, Hungary 2010, Brazil 2014, Australia 2022).

**Why V-Dem alone is insufficient.** Direct verification against the V-Dem v16 codebook and CSV established two facts that kill a V-Dem-only grounding for the economic fields:
- `e_gdppc` data ends in **2019** (codebook §10.3.4: "Years: 1789–2019"). Any post-2019 country-year scenario gets `gdp_per_capita = 0`, which floors `monthly_income_mean` at the $200 minimum.
- `e_gdppc` is a Fariss et al. (2021) latent-variable estimate, not raw USD per capita, so even where populated it's the wrong unit for the simulator's `income_mean_monthly` parameter.
- V-Dem has no unemployment series at all; the existing `baseline_unemployment` heuristic invents a relationship from `egal_dem` that has no empirical basis.

V-Dem remains the right source for political indices (polyarchy, libdem, rule of law, corruption). For economic fields, World Bank WDI is required for both correctness and coverage of recent years.

**Why grounding at all.** Today's "V-Dem calibrated" tag is marketing copy. The smallest credible step beyond this is a *transparent multi-source initial-state grounding* — not validation, not trajectory matching, but "this scenario starts from country X year Y on these K indices, with documented index-to-state mappings cited per source."

**Integration shape.** Per-source modules in `simulator-calibration`. V-Dem loader works ([simulator-calibration/src/vdem.rs](../crates/simulator-calibration/src/vdem.rs)) for political indices. Add a WDI loader (or equivalent World Bank source) for unemployment and GDP per capita. Scenario YAML already accepts `income_mean_monthly`, `unemployment_rate`, `corruption_level` ([simulator-scenario/src/lib.rs:73](../crates/simulator-scenario/src/lib.rs)); expand to add political-index fields once needed. New `ugs scenario from-grounding --country AUS --year 2022` path that joins sources and emits a YAML.

**Scope discipline.** *Initial-state grounding only.* Not "validated against V-Dem" or "validated against WDI." Trajectory validation is a separate, much larger effort (months) and is explicitly out of scope for this milestone.

**Anti-overclaim.** The methodology page must state plainly: starting state combines V-Dem + WDI per documented mappings; subsequent dynamics are governed by the model's hardcoded rules and reflect the model, not empirical reality.

### 4. simulator-econ: bounded rationality + corruption

**Goal.** Two behavioral mechanisms wired into existing systems:
- **Bounded rationality** — citizens make tax-compliance, labor-supply, and voting decisions under cognitive constraints (satisficing thresholds, salience-weighted information), not as utility-maximizing automata.
- **Corruption** — a state-capacity-conditional friction on tax collection, benefit delivery, and law enforcement, with feedback to legitimacy.

**Why.** Both are first-class research targets in computational political economy. Today's tax/employment/approval systems are stateless Markov chains; adding these turns the model from "stylized macro" into "stylized macro with behavioral microfoundations" — a meaningful upgrade for any paper claiming distributional or compliance results.

**Integration shape.** Design-from-scratch in [crates/simulator-econ/](../crates/simulator-econ/) (currently 6 LoC of empty modules), plus restructuring of [simulator-systems/src/taxation.rs](../crates/simulator-systems/src/) and approval to call behavioral evaluators before mutating wealth. This is the most expensive item on the roadmap.

**Scope discipline.** Two mechanisms, not four. Defer `contagion` and `social_capital` until the first two are validated. Resist the temptation to model everything.

### 5. Better sweep + Sobol sensitivity tooling (replaces AgentTorch aspiration)

**Goal.** Make the existing `ugs` CLI the canonical research interface for parameter exploration: documented recipes for sweeps, Sobol sensitivity analysis on outputs, optional CMA-ES / Optuna driver scripts.

**Why.** AgentTorch was previously the path to "calibrate parameters via gradients." At N=5,000 citizens, gradient-based calibration is overkill — overnight CLI sweeps recover the same posterior modes without giving up Rust semantics or forcing Gumbel-softmax relaxations on discrete decisions. The research-value question reviewers actually ask ("what parameter optimizes Y?") is answerable by sweeps; the question gradients uniquely answer ("what intervention schedule minimizes Y subject to constraints?") rarely arises in polity simulators.

**Integration shape.** Mostly documentation + a thin Python driver (`scripts/sweep.py`, `scripts/sobol.py`). No Rust changes required for the MVP. Optional: a `ugs sweep` subcommand if the driver pattern proves useful enough.

## What we explicitly dropped

These items appeared in earlier README versions and are now off the roadmap. Each has a stated reason; if the reason changes, we revisit.

| Dropped | Reason |
|---|---|
| **AgentTorch differentiable sidecar** | At 5K agents, gradient-based calibration buys nothing over CLI sweeps + Sobol analysis, while requiring Gumbel-softmax relaxations that change the model under study. No Rust↔AgentTorch integration precedent — we'd be inventing it. Replaced by item 5. |
| **Cranelift JIT for law DSL** | No measured evidence the tree-walk interpreter is a bottleneck. AST is JIT-friendly if we ever need to revisit, but adding a JIT before profiling would be premature optimization. Reconsider only if `ugs bench` or production telemetry shows law evaluation dominating tick time. |
| **Adversarial RL harness** (`simulator-rl`) | Design-from-scratch; no measured user demand; niche relative to the legislative-effects core use case. Module stays as an empty placeholder; no work scheduled. |
| **PIANO on the citizenry** | Per-agent LLM calls at 5K agents would dominate compute and dollar cost by orders of magnitude. Citizens stay rule-based. PIANO-lite applies only to ~10 elites (item 2). |
| **Wasmtime law sandboxing** | Dropped for the same reason as JIT — no measured need. The DSL is in-process and trusted; sandboxing matters only if we ever execute untrusted user-supplied laws against shared infra. |
| **"Multi-resolution architecture"** (macro-tensor + ECS + LLM key-actors as three integrated tiers) | The macro-tensor tier (AgentTorch) is dropped. The architecture is now two tiers: ECS substrate + LLM/PsychSim cognitive layer for elites. The pitch is reframed accordingly. |

## Sequencing

Rough dependency order, not a calendar:

1. **V-Dem initial-state grounding** (item 3) — small, unblocks credible scenario claims. Researcher-visible win.
2. **Sweep + Sobol tooling** (item 5) — mostly docs and a driver script. Unblocks parameter-uncertainty claims.
3. **PsychSim sidecar wire-up** (item 1, infrastructure first) — get the IPC channel real, with one trivial PsychSim agent end-to-end before scaling to all 10 elites.
4. **PIANO-lite controller** (item 2) — depends on the LLM client and the Cognitive phase being live; can develop in parallel with item 1 once IPC is real.
5. **simulator-econ: bounded rationality + corruption** (item 4) — last and biggest. Requires restructuring touched-by-everything systems; do it once the elite layer is stable so the two changes don't tangle.

## What "done" looks like for each item

A milestone is done when:

- The mechanism is implemented and unit-tested.
- A regression test asserts the mechanism's effect on at least one observable metric.
- [methodology.md](methodology.md) is updated to move the item from "planned" to "implemented."
- A short methodology note in this `docs/` directory documents assumptions, parameters, and any literature grounding.

A milestone is **not** done when:
- It runs but has no test.
- It's wired in but undocumented.
- The methodology page still calls it "planned."

## Things we will not promise

- A timeline. Calendar commitments are not made in this document.
- Empirical validation against V-Dem trajectories. Initial-state grounding only; trajectory validation is a separate research project.
- Production stability. UGS is a research instrument, not a deployed system.
- Replacement of human policy analysis. UGS is for structured-thought experiments, not forecasting.
