#!/usr/bin/env python3
"""
LangGraph SOTA comparator harness.

Workload: N agents (StateGraph), K tools, T turns with a stub LLM.
Measures:
  - cold_start_ms      : time from script entry to first graph compiled
  - compose_K_tools_ms : time to create K langchain @tool-decorated functions
  - single_turn_ms     : one graph.invoke() with T stub turns
  - N_agent_parallel_ms: N concurrent graph.invoke() calls (ThreadPool)
  - rss_peak_mb        : peak RSS during N-agent parallel run

Framework: langgraph==1.2.1 (installed), langchain-core (installed)
"""

import argparse
import json
import sys
import time
import statistics
import resource
import concurrent.futures
from pathlib import Path

SCRIPT_START = time.perf_counter()

parser = argparse.ArgumentParser()
parser.add_argument("--mode", default="A")
parser.add_argument("--trials", type=int, default=7)
parser.add_argument("--warmup", type=int, default=3)
parser.add_argument("--N", type=int, default=10)
parser.add_argument("--K", type=int, default=50)
parser.add_argument("--T", type=int, default=5)
parser.add_argument("--out", default=None)
args = parser.parse_args()

TRIALS = args.trials
WARMUP = args.warmup
N = args.N
K = args.K
T = args.T

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
import_start = time.perf_counter()

try:
    from langchain_core.messages import AIMessage, ToolMessage, HumanMessage
    from langchain_core.tools import tool as lc_tool
    from langgraph.graph import StateGraph, END
    from langgraph.graph.message import add_messages
    from typing import Annotated, TypedDict
    import platform
    HAS_LANGGRAPH = True
except ImportError as e:
    print(f"[warn] LangGraph not available: {e}", file=sys.stderr)
    HAS_LANGGRAPH = False
    platform = __import__("platform")

import_end = time.perf_counter()
import_ms = (import_end - import_start) * 1000

# ---------------------------------------------------------------------------
# Tool fixture (K tools)
# ---------------------------------------------------------------------------
def make_tools(k: int):
    """Create K @lc_tool-decorated functions."""
    tool_list = []
    for i in range(k):
        name = f"tool_{i:02d}"
        def make_fn(n):
            def fn(input: str) -> str:
                """Benchmark tool — echoes its input."""
                return f"{n}:{input}"
            fn.__name__ = n
            fn.__qualname__ = n
            return fn
        decorated = lc_tool(make_fn(name))
        tool_list.append(decorated)
    return tool_list

# ---------------------------------------------------------------------------
# Build a minimal ReAct graph with pure-Python stub node
# (no bind_tools, no FakeListChatModel — just a closure with a counter)
# ---------------------------------------------------------------------------
def build_graph(tools, t_turns=5):
    """Build a StateGraph with a stub agent node and inline tool dispatch."""
    if not HAS_LANGGRAPH:
        return None

    # Build a tool lookup
    tool_map = {t.name: t for t in tools}

    class State(TypedDict):
        messages: Annotated[list, add_messages]

    def agent_node(state: State):
        # Count how many AIMessages already in history
        ai_count = sum(1 for m in state["messages"] if isinstance(m, AIMessage))
        if ai_count < t_turns:
            # Emit a tool call to tool_00
            msg = AIMessage(
                content="",
                tool_calls=[{
                    "name": "tool_00",
                    "args": {"input": "bench"},
                    "id": f"call_{ai_count}",
                    "type": "tool_call",
                }],
            )
        else:
            msg = AIMessage(content="done")
        return {"messages": [msg]}

    def tool_node(state: State):
        last = state["messages"][-1]
        results = []
        for tc in last.tool_calls:
            t = tool_map.get(tc["name"])
            if t:
                out = t.invoke({"input": tc["args"]["input"]})
                results.append(ToolMessage(content=str(out), tool_call_id=tc["id"]))
        return {"messages": results}

    def router(state: State):
        last = state["messages"][-1]
        if isinstance(last, AIMessage) and last.tool_calls:
            return "tools"
        return END

    g = StateGraph(State)
    g.add_node("agent", agent_node)
    g.add_node("tools", tool_node)
    g.set_entry_point("agent")
    g.add_conditional_edges("agent", router)
    g.add_edge("tools", "agent")
    return g.compile()

# ---------------------------------------------------------------------------
# Timing harness
# ---------------------------------------------------------------------------
def bench(fn, trials=TRIALS, warmup=WARMUP):
    for _ in range(warmup):
        try:
            fn()
        except Exception:
            pass
    times = []
    for _ in range(trials):
        t0 = time.perf_counter()
        try:
            fn()
        except Exception:
            pass
        times.append((time.perf_counter() - t0) * 1000)
    times.sort()
    med = statistics.median(times)
    return round(med, 3), round(times[0], 3), round(times[-1], 3)

def get_rss_mb():
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    if sys.platform == "darwin":
        return round(usage / (1024 * 1024), 2)
    return round(usage / 1024, 2)

# ---------------------------------------------------------------------------
# Measurements
# ---------------------------------------------------------------------------
cold_start_ms = round((time.perf_counter() - SCRIPT_START) * 1000, 3)

# Compile one reference graph to capture graph_compile_ms
compile_start = time.perf_counter()
ref_tools = make_tools(K)
ref_graph = build_graph(ref_tools, T) if HAS_LANGGRAPH else None
compile_end = time.perf_counter()
graph_compile_ms = round((compile_end - compile_start) * 1000, 3)

# M2: compose K tools
print(f"[langgraph] compose_{K}_tools...", file=sys.stderr)
compose_med, compose_min, compose_max = bench(lambda: make_tools(K))

# M3: single turn dispatch
print("[langgraph] single_turn_dispatch...", file=sys.stderr)
if ref_graph is not None:
    def single_turn():
        g = build_graph(make_tools(K), T)
        g.invoke({"messages": [HumanMessage(content="bench")]})
    turn_med, turn_min, turn_max = bench(single_turn)
else:
    turn_med = turn_min = turn_max = -1.0

# M4: N-agent parallel dispatch
print(f"[langgraph] N={N} agents parallel...", file=sys.stderr)
rss_before = get_rss_mb()
para_times = []

def run_one_agent(_):
    g = build_graph(make_tools(K), T)
    g.invoke({"messages": [HumanMessage(content="bench")]})

for _ in range(TRIALS):
    t0 = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=N) as ex:
        list(ex.map(run_one_agent, range(N)))
    para_times.append((time.perf_counter() - t0) * 1000)
para_times.sort()
para_med = round(statistics.median(para_times), 3)
para_min = round(para_times[0], 3)
para_max = round(para_times[-1], 3)
rss_peak = get_rss_mb()

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
result = {
    "framework": "langgraph",
    "version": "1.2.1",
    "language": "python",
    "python_version": platform.python_version(),
    "platform": f"{sys.platform}-{platform.machine()}",
    "mode": "A",
    "N": N,
    "K": K,
    "T": T,
    "trials": TRIALS,
    "capturedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
    "measurements": {
        "cold_start_ms": cold_start_ms,
        "graph_compile_ms": graph_compile_ms,
        "import_overhead_ms": round(import_ms, 3),
        "compose_K_tools": {
            "K": K,
            "medianMs": compose_med,
            "minMs": compose_min,
            "maxMs": compose_max,
        },
        "single_turn_dispatch": {
            "medianMs": turn_med,
            "minMs": turn_min,
            "maxMs": turn_max,
        },
        "N_agent_parallel_dispatch": {
            "N": N,
            "wall_medianMs": para_med,
            "wall_minMs": para_min,
            "wall_maxMs": para_max,
        },
        "rss_peak_mb": rss_peak,
        "rss_baseline_mb": rss_before,
    },
    "notes": (
        "Mode A: pure-Python stub agent node (no LLM API calls). "
        "Uses StateGraph with stateless node that counts AIMessages in history. "
        "N-agent parallel uses ThreadPoolExecutor."
    ),
}

out_json = json.dumps(result, indent=2)
if args.out:
    Path(args.out).write_text(out_json)
    print(f"[langgraph] wrote {args.out}", file=sys.stderr)
else:
    print(out_json)

print(f"\n[langgraph] Summary:", file=sys.stderr)
print(f"  cold_start_ms        = {cold_start_ms}", file=sys.stderr)
print(f"  graph_compile_ms     = {graph_compile_ms}", file=sys.stderr)
print(f"  import_overhead_ms   = {round(import_ms, 3)}", file=sys.stderr)
print(f"  compose_{K}_tools_ms  = {compose_med}", file=sys.stderr)
print(f"  single_turn_ms       = {turn_med}", file=sys.stderr)
print(f"  N={N}_parallel_ms     = {para_med}", file=sys.stderr)
print(f"  rss_peak_mb          = {rss_peak}", file=sys.stderr)
