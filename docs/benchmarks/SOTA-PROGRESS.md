# SOTA Comparator Progress

## Current Milestone: M3 Complete (M1+M2+M3 shipped, real verified numbers)

**Branch:** `perf/sota-comparator-benchmarks`
**Last updated:** 2026-05-24

---

## What Landed

### M1 — Workload Spec
- `docs/benchmarks/sota-workload-spec.md` — pinned N=10, K=50, T=5, TRIALS=7, WARMUP=3
- Two modes: Mode A (orchestration-only, stub LLM) and Mode B (end-to-end, real model)
- Single-command repro: `node benchmarks/run-sota-matrix.mjs`

### M2 — Comparators Selected
Three frameworks (plus ruflo itself):
- **LangGraph 1.2.1** — Python StateGraph + LangChain tool nodes
- **AutoGen 0.4.9** — Python AssistantAgent + asyncio.gather
- **CrewAI 0.80.0** — Python Agent/Task/Crew pattern (Mode A partial — dispatch proxied)

### M3 — Harnesses Implemented, Running, Real Numbers Verified
- All harnesses in `benchmarks/comparators/<framework>/run.py` (or `.mjs`)
- **WASM verified:** `isAgentWasmAvailable() = true` on darwin-arm64 M-series
- Fixed path bug: `REPO_ROOT` was resolving 4 dirs up instead of 3 (silently fell back to no-op)
- Matrix runner: `benchmarks/run-sota-matrix.mjs`
- Results: `docs/benchmarks/sota-matrix.json` with `"status": "verified-real-numbers"`

---

## Current Matrix Results (darwin-arm64, 2026-05-24, verified)

N=10 agents, K=50 tools, T=5 turns, 7 trials (stub LLM Mode A)
WASM module loaded and verified active for all ruflo measurements.

| Dimension | ruflo | AutoGen 0.4.9 | LangGraph 1.2.1 | CrewAI 0.80.0 |
|-----------|-------|---------------|-----------------|----------------|
| Cold start (ms) | **3.44** | 186.4 | 508.1 | 2239.7 |
| Compose 50 tools (ms) | 0.294 | 6.52 | 34.8 | 0.115* |
| Single turn dispatch (ms) | **0.023** | 6.73 | 36.4 | 0.113* |
| N=10 parallel wall (ms) | 1.16 | 64.2 | 394.9 | 0.114* |
| RSS peak (MB) | **58.9** | 78.5 | 80.5 | 264.1 |

*CrewAI dispatch numbers are proxied (agent/crew instantiation only, no real dispatch — LLM required). These are LOWER BOUNDS — actual dispatch would be higher.

**ruflo wins (honest, real numbers):**
- Cold start: **54x faster than AutoGen**, **148x faster than LangGraph**, **651x faster than CrewAI**
- Single turn dispatch: **293x faster than AutoGen**, **1,583x faster than LangGraph**
- RSS: **25% less memory than AutoGen/LangGraph**, **4.5x less than CrewAI**

**Where ruflo does NOT win:**
- Compose 50 tools: CrewAI's tool instantiation is faster (proxy — lower bound; also different tool type)
- N=10 parallel: CrewAI's instantiation-only proxy beats ruflo (not a real dispatch comparison)
- Both CrewAI "wins" are lower bounds and explicitly labeled as proxied in the JSON

---

## What's Blocked / Next

- **M4 (Linux platform):** CI workflow stub added at `.github/workflows/sota-bench.yml`. Actual linux numbers will be produced when the PR CI runs.
- **M5 (End-to-end real model):** Mode B — requires ANTHROPIC_API_KEY, ~$0.10 budget. Scheduled.
- **M6 (Concurrency scale N=1/10/100):** Can run locally. Scheduled for next iteration.
- **M7 (v3.7 vs v3.8 delta):** Need npx-install ruflo@3.7.0 side-by-side. Scheduled.
- **M8 (Real plugin enum):** 21 native plugins via includePlugins. Scheduled.
- **M9 (Publish gist + release notes):** Blocked until M4 linux numbers in.
- **M10 (Speedup improvements):** Identify and fix the compose-50-tools path to beat CrewAI's proxy.

---

## Test Baseline
Running `npm test` — verifying ≥ 1999 passing (in progress).
