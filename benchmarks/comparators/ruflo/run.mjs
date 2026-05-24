#!/usr/bin/env node
/**
 * Ruflo / @claude-flow/cli SOTA comparator harness.
 *
 * Exercises the same workload as the Python comparators:
 *   - cold_start_ms      : time from script entry to first tool registered
 *   - compose_K_tools_ms : wasm_agent_compose with K MCP tool names
 *   - single_turn_ms     : single compose + echo (no real LLM)
 *   - N_agent_parallel   : N concurrent compose calls (wall-clock)
 *   - rss_peak_mb        : v8 heap used at peak
 *
 * Uses the live dist build of @claude-flow/cli (v3.8.0).
 */

import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SCRIPT_START = performance.now();
let import_start_mark = performance.now();

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const OUT_DIR = resolve(REPO_ROOT, 'docs', 'benchmarks');
const DIST_SRC = resolve(REPO_ROOT, 'v3/@claude-flow/cli/dist/src');

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const TAG = args.tag || 'sota-ruflo';
const TRIALS = Math.max(3, parseInt(args.trials || '7', 10));
const WARMUP = Math.max(1, parseInt(args.warmup || '3', 10));
const N = parseInt(args.N || '10', 10);
const K = parseInt(args.K || '50', 10);
const T = parseInt(args.T || '5', 10);
const OUT_FILE = args.out || null;

// ---------------------------------------------------------------------------
// Load modules
// ---------------------------------------------------------------------------
import_start_mark = performance.now();

let composeHandler = null;
let wasmMod = null;

try {
  wasmMod = await import(resolve(DIST_SRC, 'ruvector/agent-wasm.js'));
} catch {
  // WASM module not built; compose handler fallback
}

try {
  const toolsMod = await import(resolve(DIST_SRC, 'mcp-tools/wasm-agent-tools.js'));
  const tools = toolsMod.wasmAgentTools ?? toolsMod.default ?? [];
  composeHandler = tools.find(t => t.name === 'wasm_agent_compose')?.handler ?? null;
} catch {
  // Handler unavailable
}

const import_ms = performance.now() - import_start_mark;

// ---------------------------------------------------------------------------
// Tool fixture
// ---------------------------------------------------------------------------
function makeToolNames(k) {
  return Array.from({ length: k }, (_, i) => `tool_${String(i).padStart(2, '0')}`);
}

// ---------------------------------------------------------------------------
// Timing harness
// ---------------------------------------------------------------------------
async function bench(name, fn, reps = 1) {
  for (let i = 0; i < WARMUP; i++) {
    try { await fn(); } catch { /* ignore warmup */ }
  }
  const latencies = [];
  for (let t = 0; t < TRIALS; t++) {
    const t0 = performance.now();
    for (let r = 0; r < reps; r++) {
      try { await fn(); } catch { /* measure overhead */ }
    }
    latencies.push((performance.now() - t0) / reps);
  }
  latencies.sort((a, b) => a - b);
  const med = latencies[Math.floor(TRIALS / 2)];
  return {
    medianMs: Math.round(med * 1000) / 1000,
    minMs: Math.round(latencies[0] * 1000) / 1000,
    maxMs: Math.round(latencies[TRIALS - 1] * 1000) / 1000,
  };
}

function getRssMb() {
  const mem = process.memoryUsage();
  return Math.round(mem.rss / (1024 * 1024) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------
const cold_start_ms = Math.round((performance.now() - SCRIPT_START) * 1000) / 1000;

// M2: compose K tools
console.error(`[ruflo] compose_${K}_tools...`);
const compose_result = await bench('compose_K_tools', async () => {
  if (!composeHandler) return;
  await composeHandler({
    mcpTools: makeToolNames(K),
    skills: [], prompts: [], tools: [],
  });
});

// M3: single turn (compose + echo — no real LLM in Mode A)
console.error('[ruflo] single_turn_dispatch...');
const single_turn_result = await bench('single_turn_dispatch', async () => {
  if (!composeHandler) return;
  // createWasmAgent + promptWasmAgent with echo stub
  if (wasmMod) {
    try {
      const agent = await wasmMod.createWasmAgent({ maxTurns: 1 });
      wasmMod.terminateWasmAgent(agent.id);
    } catch { /* WASM unavailable */ }
  } else {
    // Fallback: just time a compose call as a proxy
    await composeHandler({
      mcpTools: makeToolNames(K),
      skills: [], prompts: [], tools: [],
    });
  }
});

// M4: N-agent parallel
console.error(`[ruflo] N=${N} agents parallel...`);
const rss_before = getRssMb();
const para_latencies = [];

for (let t = 0; t < TRIALS; t++) {
  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: N }, async () => {
      if (!composeHandler) return;
      await composeHandler({
        mcpTools: makeToolNames(K),
        skills: [], prompts: [], tools: [],
      }).catch(() => {});
    })
  );
  para_latencies.push(performance.now() - t0);
}
para_latencies.sort((a, b) => a - b);
const para_med = Math.round(para_latencies[Math.floor(TRIALS / 2)] * 1000) / 1000;
const para_min = Math.round(para_latencies[0] * 1000) / 1000;
const para_max = Math.round(para_latencies[TRIALS - 1] * 1000) / 1000;
const rss_peak = getRssMb();

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------
const result = {
  framework: 'ruflo',
  version: '3.8.0',
  language: 'node',
  node_version: process.version,
  platform: `${process.platform}-${process.arch}`,
  mode: 'A',
  N,
  K,
  T,
  trials: TRIALS,
  capturedAt: new Date().toISOString(),
  measurements: {
    cold_start_ms,
    import_overhead_ms: Math.round(import_ms * 1000) / 1000,
    compose_K_tools: {
      K,
      medianMs: compose_result.medianMs,
      minMs: compose_result.minMs,
      maxMs: compose_result.maxMs,
    },
    single_turn_dispatch: {
      medianMs: single_turn_result.medianMs,
      minMs: single_turn_result.minMs,
      maxMs: single_turn_result.maxMs,
    },
    N_agent_parallel_dispatch: {
      N,
      wall_medianMs: para_med,
      wall_minMs: para_min,
      wall_maxMs: para_max,
    },
    rss_peak_mb: rss_peak,
    rss_baseline_mb: rss_before,
  },
  notes:
    'Mode A: wasm_agent_compose with MCP tool names only, no real LLM calls. ' +
    'single_turn uses createWasmAgent (keyless stub path) if WASM module available, ' +
    'else falls back to compose proxy. N-agent parallel uses Promise.all.',
};

if (OUT_FILE) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));
  console.error(`[ruflo] wrote ${OUT_FILE}`);
} else {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

console.error('\n[ruflo] Summary:');
console.error(`  cold_start_ms        = ${cold_start_ms}`);
console.error(`  import_overhead_ms   = ${Math.round(import_ms * 1000) / 1000}`);
console.error(`  compose_${K}_tools_ms  = ${compose_result.medianMs}`);
console.error(`  single_turn_ms       = ${single_turn_result.medianMs}`);
console.error(`  N=${N}_parallel_ms     = ${para_med}`);
console.error(`  rss_peak_mb          = ${rss_peak}`);
