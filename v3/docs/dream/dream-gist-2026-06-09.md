# Swarm Coordination SOTA Report — 2026-06-09

**TL;DR** — In 2026, the hardest unsolved swarm problem isn't topology selection (solved by AdaptOrch) or scale (solved by SWARM+); it's *orchestration policy learning* — specifically, no RL method yet exists for the stopping decision, and Ruflo's orchestration decisions remain hard-coded rather than learned from trace data.

---

## What's New in 2026

| Finding | Source | Confidence |
|---------|--------|------------|
| RL for orchestration traces: 5 sub-decisions (spawn, delegate, communicate, aggregate, stop); no RL method exists for stopping | arXiv:2605.02801, May 2026 | **A** — arXiv preprint with reproducible artifact (84 papers + JSON schema) |
| SGTO-MAS: Security-aware adaptive swarm selection via Gorilla Troops Optimization; consensus 0.8764, risk 0.3000 | arXiv:2606.07940, Jun 2026 | **B** — single arXiv source, not yet cross-checked |
| SPIN: Tensor-network factorized swarm coordination reduces O(n^m) to O(m·n·χ²); targets edge deployment | arXiv:2606.07557, Jun 2026 | **C** — single source (arXiv listing), unverified benchmark |
| Framework latency 2026: LangGraph fastest across 5 tasks in 2K-instance independent benchmark; CrewAI 30-60% faster than AutoGen on simple tasks | Independent benchmark, 2026 | **B** — vendor-adjacent, crosschecked multiple sources |
| No RL stopping-decision method across all surveyed frameworks | arXiv:2605.02801 | **A** |

---

## Ruflo Current Capability

| Swarm Capability | Ruflo v3.6.10 | Status |
|-----------------|--------------|--------|
| Topology selection | Fixed `hierarchical` default; adaptive behind flag | Partial |
| Agent spawning decision | Hard-coded (maxAgents=8) | No RL |
| Delegation routing | 3-tier model routing (Tier 1/2/3) | Rules-based |
| Communication method | SendMessage protocol | Manual |
| Aggregation policy | Task orchestrator collects results | Manual |
| **Stopping decision** | Hard-coded completion checks | **No RL — open gap** |
| Orchestration trace recording | `hooks post-task` → ReasoningBank | Partial (no replay schema) |
| RL training on trace data | SONA trains agent behavior, not orchestration | **Missing** |

---

## Competitor Comparison

| Framework | Stopping Decision | Orchestration RL | Trace Replay | Scale Tested | Notable 2026 Change |
|-----------|------------------|-----------------|-------------|-------------|---------------------|
| **Ruflo (claude-flow)** | Hard-coded completion | SONA (agent-level only) | None | ~8 agents | Federation hub, comms-first |
| **LangGraph v0.4** | Graph terminal node | None | State checkpoints | Production | Fastest latency in 2K-task benchmark (Grade B) |
| **AutoGen AG2 1.0** | ConversationTerminated signal | None | None | Production | Event-driven rearchitecture |
| **CrewAI 0.105** | max_iter + task_output check | None | None | Production | 30-60% faster than AutoGen simple tasks (Grade B) |
| **OpenAI Agents SDK** | Loop exit when no handoff | None | None | Production | Sandbox + approval callbacks |

**No framework surveyed implements RL-trained stopping.**

---

## Benchmarks

| Benchmark | Value | Grade | Source |
|-----------|-------|-------|--------|
| LangGraph latency, 5-task suite, 2K instances | Fastest across all 5 tasks | B | Independent 2026 comparison |
| CrewAI vs AutoGen simple tasks | 30-60% faster | B | Independent 2026 comparison |
| SGTO-MAS consensus score | 0.8764 (avg) | B | arXiv:2606.07940 |
| RuVector (vendor claim) QPS @ 1M vectors | 50K (1-thread), 100K (8-thread) | C | Vendor gist, no peer-reviewed benchmark |
| Ruflo HNSW @ 20K vectors | ~1.9x vs brute force | A | Internal benchmark script |

---

## SOTA Proof & Witness

*[Filled in Step 4 — see below]*

**Session commit:** `cc8830d798152e9ee6647db11eaaf014759ac2ff`
**Report SHA-256:** `e0dbcf415b98968c823c10fbd9c64094603c1d23868db126f06546cd1269f1b7`
**Witness stamp:** `d82a838fcd3f2cfce1bd8cd94d729508e666f4418394b1d8f74f7333ec147526`

Verifier: fetch raw gist → `sha256sum` → concat `cc8830d798152e9ee6647db11eaaf014759ac2ff` → `sha256sum` → must equal `d82a838fcd3f2cfce1bd8cd94d729508e666f4418394b1d8f74f7333ec147526`.

---

## Recommended Next Steps

1. **Implement orchestration trace replay schema** (`v3/@claude-flow/hooks/src/orchestration-trace.ts`): adopt the JSON schema from arXiv:2605.02801 to record the 5 sub-decisions per swarm run. Prerequisite for any future RL training on orchestration policy. ~120 LOC.

2. **Add stopping-signal instrumentation**: wrap `unified-coordinator.ts` completion check to emit a `StoppingDecisionTrace` event captured by `hooks post-task`. Creates the training dataset for the open "stopping RL" gap identified in 2026 SOTA. ~80 LOC.

3. **Gate RuVector backend adoption on independent benchmark**: ADR-153 proposes adding `ruvector` as optional backend in `agentdb-backend.ts` with feature-flag. Before enabling by default, run `scripts/benchmark-intelligence.mjs` extended to 1M-vector corpus and compare Ruflo's RaBitQ+HNSW against RuVector's scalar quantization at p99. Vendor's Grade-C 50K QPS claim needs peer-reviewed validation before architectural commitment.
