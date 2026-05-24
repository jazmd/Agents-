#!/usr/bin/env node
/**
 * SOTA Comparator Matrix Runner
 *
 * Runs all four framework harnesses and assembles results into
 * docs/benchmarks/sota-matrix.json.
 *
 * Usage:
 *   node benchmarks/run-sota-matrix.mjs [--trials=7] [--N=10] [--K=50] [--T=5]
 *
 * Requires:
 *   Python 3.12+ with langgraph, autogen-agentchat, crewai installed.
 *   Node 22+ with @claude-flow/cli built (v3/@claude-flow/cli/dist/).
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(REPO_ROOT, 'docs', 'benchmarks');

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const TRIALS = args.trials || '7';
const N = args.N || '10';
const K = args.K || '50';
const T = args.T || '5';
const PYTHON = args.python || 'python3';

const COMMON_PY_ARGS = ['--mode=A', `--trials=${TRIALS}`, `--N=${N}`, `--K=${K}`, `--T=${T}`];
const COMMON_MJS_ARGS = [`--trials=${TRIALS}`, `--N=${N}`, `--K=${K}`, `--T=${T}`];

const comparators = [
  {
    id: 'ruflo',
    cmd: 'node',
    script: resolve(__dirname, 'comparators/ruflo/run.mjs'),
    extraArgs: COMMON_MJS_ARGS,
  },
  {
    id: 'langgraph',
    cmd: PYTHON,
    script: resolve(__dirname, 'comparators/langgraph/run.py'),
    extraArgs: COMMON_PY_ARGS,
  },
  {
    id: 'autogen',
    cmd: PYTHON,
    script: resolve(__dirname, 'comparators/autogen/run.py'),
    extraArgs: COMMON_PY_ARGS,
  },
  {
    id: 'crewai',
    cmd: PYTHON,
    script: resolve(__dirname, 'comparators/crewai/run.py'),
    extraArgs: COMMON_PY_ARGS,
  },
];

console.log('SOTA Comparator Matrix');
console.log('======================');
console.log(`trials=${TRIALS}  N=${N}  K=${K}  T=${T}`);
console.log('');

const results = [];
const errors = [];

for (const c of comparators) {
  const tmpOut = join(tmpdir(), `sota-${c.id}-${Date.now()}.json`);
  console.log(`Running ${c.id}...`);
  const t0 = performance.now();

  const r = spawnSync(c.cmd, [c.script, `--out=${tmpOut}`, ...c.extraArgs], {
    encoding: 'utf8',
    timeout: 300_000, // 5 min per harness
    maxBuffer: 10 * 1024 * 1024,
  });

  const elapsed = Math.round(performance.now() - t0);
  if (r.stderr) {
    process.stderr.write(r.stderr);
  }

  if (r.status !== 0) {
    console.log(`  [FAIL] ${c.id} exited ${r.status} (${elapsed}ms)`);
    errors.push({ framework: c.id, error: r.stderr?.slice(-500) || 'unknown error', exit: r.status });
    continue;
  }

  let data;
  try {
    const raw = readFileSync(tmpOut, 'utf8');
    data = JSON.parse(raw);
    console.log(`  [OK] ${c.id} (${elapsed}ms)`);
    results.push(data);
  } catch (e) {
    // Try parsing stdout as JSON
    try {
      data = JSON.parse(r.stdout);
      results.push(data);
      console.log(`  [OK] ${c.id} stdout (${elapsed}ms)`);
    } catch {
      console.log(`  [FAIL] ${c.id} could not parse output (${elapsed}ms): ${e.message}`);
      errors.push({ framework: c.id, error: `parse error: ${e.message}` });
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Build comparison table
// ---------------------------------------------------------------------------
function dim(result, path) {
  const parts = path.split('.');
  let v = result?.measurements;
  for (const p of parts) {
    v = v?.[p];
  }
  return v ?? null;
}

const DIMS = [
  { key: 'cold_start_ms', label: 'Cold start (ms)', path: 'cold_start_ms' },
  { key: 'compose_50_tools_ms', label: 'Compose 50 tools (ms)', path: 'compose_K_tools.medianMs' },
  { key: 'single_turn_ms', label: 'Single turn dispatch (ms)', path: 'single_turn_dispatch.medianMs' },
  { key: 'N10_parallel_ms', label: 'N=10 parallel wall (ms)', path: 'N_agent_parallel_dispatch.wall_medianMs' },
  { key: 'rss_peak_mb', label: 'RSS peak (MB)', path: 'rss_peak_mb' },
];

const matrix = {
  tag: 'sota-matrix',
  capturedAt: new Date().toISOString(),
  workload: { N: parseInt(N), K: parseInt(K), T: parseInt(T), trials: parseInt(TRIALS) },
  frameworks: results,
  errors,
  comparison: {},
  winner_by_dimension: {},
};

for (const d of DIMS) {
  const row = {};
  for (const r of results) {
    const v = dim(r, d.path);
    row[r.framework] = v;
  }
  matrix.comparison[d.key] = row;

  // Find winner (lowest value) — skip null
  const valid = Object.entries(row).filter(([, v]) => v !== null && v > 0);
  if (valid.length > 0) {
    valid.sort((a, b) => a[1] - b[1]);
    matrix.winner_by_dimension[d.key] = {
      winner: valid[0][0],
      value: valid[0][1],
      runners_up: valid.slice(1).map(([fw, v]) => ({ fw, v, ratio: Math.round((v / valid[0][1]) * 100) / 100 })),
    };
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const outPath = resolve(OUT_DIR, 'sota-matrix.json');
writeFileSync(outPath, JSON.stringify(matrix, null, 2));
console.log(`\nWrote ${outPath}`);

// ---------------------------------------------------------------------------
// Print table
// ---------------------------------------------------------------------------
const FW_COL = 12;
const VAL_COL = 12;
const fws = results.map(r => r.framework);

if (fws.length > 0) {
  console.log('\n--- SOTA Comparison Matrix ---');
  const header = `| ${'Dimension'.padEnd(28)} | ${fws.map(f => f.padEnd(FW_COL)).join(' | ')} |`;
  console.log(header);
  console.log('|' + '-'.repeat(30) + '|' + fws.map(() => '-'.repeat(FW_COL + 2)).join('|') + '|');

  for (const d of DIMS) {
    const row = matrix.comparison[d.key];
    const winner = matrix.winner_by_dimension[d.key]?.winner;
    const cells = fws.map(f => {
      const v = row[f];
      if (v === null || v === undefined) return 'N/A'.padEnd(FW_COL);
      const s = String(v);
      return (f === winner ? `*${s}` : s).padEnd(FW_COL);
    });
    console.log(`| ${d.label.padEnd(28)} | ${cells.join(' | ')} |`);
  }
  console.log('\n* = fastest on this dimension\n');

  console.log('Winners by dimension:');
  for (const d of DIMS) {
    const w = matrix.winner_by_dimension[d.key];
    if (w) {
      const ratios = w.runners_up.map(r => `${r.fw} ${r.ratio}x`).join(', ');
      console.log(`  ${d.label}: ${w.winner} (${w.value}ms)${ratios ? ` — vs ${ratios}` : ''}`);
    }
  }
}

if (errors.length > 0) {
  console.log(`\nErrors (${errors.length}):`);
  for (const e of errors) {
    console.log(`  ${e.framework}: ${e.error?.slice(0, 200)}`);
  }
}
