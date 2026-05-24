#!/usr/bin/env python3
"""
AutoGen (autogen-agentchat v0.4.9) SOTA comparator harness.

Workload: N agents, K tools, T turns with a stub model client.
Measures same dimensions as langgraph/run.py.

Framework: autogen-agentchat==0.4.9, autogen-core==0.4.9
"""

import argparse
import json
import sys
import time
import statistics
import resource
import asyncio
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
    from autogen_agentchat.agents import AssistantAgent
    from autogen_core.tools import FunctionTool
    from autogen_core.models import (
        ChatCompletionClient,
        CreateResult,
        RequestUsage,
        ModelInfo,
        ModelCapabilities,
    )
    from autogen_core.models._types import FunctionCall
    from autogen_core import CancellationToken
    import platform
    HAS_AUTOGEN = True
except ImportError as e:
    print(f"[warn] AutoGen not available: {e}", file=sys.stderr)
    HAS_AUTOGEN = False
    platform = __import__("platform")

import_end = time.perf_counter()
import_ms = (import_end - import_start) * 1000

# ---------------------------------------------------------------------------
# Tool fixture
# ---------------------------------------------------------------------------
def make_autogen_tools(k: int):
    if not HAS_AUTOGEN:
        return []
    tools = []
    for i in range(k):
        name = f"tool_{i:02d}"
        def make_fn(n):
            async def fn(input: str) -> str:
                """Benchmark tool — echoes its input."""
                return f"{n}:{input}"
            fn.__name__ = n
            return fn
        tools.append(FunctionTool(make_fn(name), description=f"Benchmark tool {i}", name=name))
    return tools

# ---------------------------------------------------------------------------
# Stub model client
# ---------------------------------------------------------------------------
if HAS_AUTOGEN:
    class StubModelClient(ChatCompletionClient):
        """Returns tool_00 call for T turns then returns 'done'."""

        def __init__(self, max_turns: int = 5):
            self._call_count = 0
            self._max_turns = max_turns

        @property
        def capabilities(self):
            return ModelCapabilities(vision=False, function_calling=True, json_output=False)

        @property
        def model_info(self):
            return ModelInfo(
                vision=False,
                function_calling=True,
                json_output=False,
                family="stub",
                context_window=4096,
            )

        async def create(
            self,
            messages,
            *,
            tools=None,
            json_output=None,
            extra_create_args=None,
            cancellation_token=None,
            **kwargs,
        ):
            self._call_count += 1
            if self._call_count <= self._max_turns and tools:
                content = [FunctionCall(
                    id=f"call_{self._call_count}",
                    name="tool_00",
                    arguments='{"input":"bench"}',
                )]
                finish_reason = "function_calls"
            else:
                content = "done"
                finish_reason = "stop"

            return CreateResult(
                content=content,
                usage=RequestUsage(prompt_tokens=5, completion_tokens=5),
                cached=False,
                finish_reason=finish_reason,
                logprobs=None,
            )

        async def create_stream(self, *args, **kwargs):
            raise NotImplementedError

        async def close(self):
            pass

        def count_tokens(self, messages, *args, **kwargs):
            return 0

        def remaining_tokens(self, messages, *args, **kwargs):
            return 10000

        def actual_usage(self):
            return RequestUsage(prompt_tokens=0, completion_tokens=0)

        def total_usage(self):
            return RequestUsage(prompt_tokens=0, completion_tokens=0)

# ---------------------------------------------------------------------------
# Timing harness
# ---------------------------------------------------------------------------
def bench_sync(fn, trials=TRIALS, warmup=WARMUP):
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
    return round(statistics.median(times), 3), round(times[0], 3), round(times[-1], 3)

async def bench_async(fn, trials=TRIALS, warmup=WARMUP):
    for _ in range(warmup):
        try:
            await fn()
        except Exception:
            pass
    times = []
    for _ in range(trials):
        t0 = time.perf_counter()
        try:
            await fn()
        except Exception:
            pass
        times.append((time.perf_counter() - t0) * 1000)
    times.sort()
    return round(statistics.median(times), 3), round(times[0], 3), round(times[-1], 3)

def get_rss_mb():
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    if sys.platform == "darwin":
        return round(usage / (1024 * 1024), 2)
    return round(usage / 1024, 2)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
cold_start_ms = round((time.perf_counter() - SCRIPT_START) * 1000, 3)

async def main():
    # M2: compose K tools
    print(f"[autogen] compose_{K}_tools...", file=sys.stderr)
    compose_med, compose_min, compose_max = bench_sync(lambda: make_autogen_tools(K))

    # M3: single turn dispatch
    print("[autogen] single_turn_dispatch...", file=sys.stderr)
    if HAS_AUTOGEN:
        async def single_turn():
            model = StubModelClient(max_turns=T)
            tools = make_autogen_tools(K)
            agent = AssistantAgent(
                name="bench_agent",
                model_client=model,
                tools=tools,
            )
            await agent.run(task="bench")

        turn_med, turn_min, turn_max = await bench_async(single_turn)
    else:
        turn_med = turn_min = turn_max = -1.0

    # M4: N-agent parallel dispatch
    print(f"[autogen] N={N} agents parallel...", file=sys.stderr)
    rss_before = get_rss_mb()
    para_times = []

    for _ in range(TRIALS):
        async def run_one():
            model = StubModelClient(max_turns=T)
            tools = make_autogen_tools(K)
            agent = AssistantAgent(
                name="bench_agent",
                model_client=model,
                tools=tools,
            )
            await agent.run(task="bench")

        t0 = time.perf_counter()
        await asyncio.gather(*[run_one() for _ in range(N)])
        para_times.append((time.perf_counter() - t0) * 1000)

    para_times.sort()
    para_med = round(statistics.median(para_times), 3)
    para_min = round(para_times[0], 3)
    para_max = round(para_times[-1], 3)
    rss_peak = get_rss_mb()

    result = {
        "framework": "autogen",
        "version": "0.4.9",
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
            "Mode A: stub model client (0ms delay), no real API calls. "
            "Uses asyncio.gather for parallel N-agent dispatch."
        ),
    }

    out_json = json.dumps(result, indent=2)
    if args.out:
        Path(args.out).write_text(out_json)
        print(f"[autogen] wrote {args.out}", file=sys.stderr)
    else:
        print(out_json)

    print(f"\n[autogen] Summary:", file=sys.stderr)
    print(f"  cold_start_ms        = {cold_start_ms}", file=sys.stderr)
    print(f"  compose_{K}_tools_ms  = {compose_med}", file=sys.stderr)
    print(f"  single_turn_ms       = {turn_med}", file=sys.stderr)
    print(f"  N={N}_parallel_ms     = {para_med}", file=sys.stderr)
    print(f"  rss_peak_mb          = {rss_peak}", file=sys.stderr)

asyncio.run(main())
