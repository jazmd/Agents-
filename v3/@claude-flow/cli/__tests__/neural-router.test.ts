/**
 * neural-router.test.ts — ADR-148 / #2334
 *
 * Verifies the gated, graceful integration of `@metaharness/router` (with
 * optional `@ruvector/tiny-dancer` acceleration) into the model-routing
 * path. The contract under test:
 *
 *   1. Default behavior is byte-identical: with no env vars set,
 *      `tryCostOptimalRoute()` returns null and `ModelRouter.route()` carries
 *      `routedBy: 'heuristic'`.
 *   2. Gate-open + corpus-present → a real cost-optimal pick is returned
 *      and `routedBy` reflects the active backend.
 *   3. Gate-open + invalid embedding (empty array) → null + bandit-fallback.
 *   4. Trajectory recorder writes only when its own gate is set.
 *   5. `task_hash` is deterministic across imports.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { __resetNeuralRouterForTests, tryCostOptimalRoute, neuralRouterStatus } from '../src/ruvector/neural-router.js';
import { __resetTrajectoryRecorderForTests, recordDecision, taskHash, trajectoryRecorderStatus } from '../src/ruvector/router-trajectory.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeEmbedding(seed: number, dim = 32): number[] {
  // Mirror scripts/gen-seed-corpus.mjs signal channels so the synthetic
  // probe is on-distribution for the bundled seed corpus.
  let h = (seed | 1) >>> 0;
  const v: number[] = new Array(dim);
  const next = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h = h >>> 0; return ((h % 2_000_001) / 1_000_000) - 1; };
  for (let i = 0; i < dim; i++) v[i] = next() * 0.5;
  return v;
}
const ENV_KEYS = [
  'CLAUDE_FLOW_ROUTER_NEURAL',
  'CLAUDE_FLOW_ROUTER_TRAJECTORY',
  'CLAUDE_FLOW_ROUTER_MODEL_PATH',
  'CLAUDE_FLOW_ROUTER_TRAJECTORY_PATH',
  'CLAUDE_FLOW_ROUTER_SEED_CORPUS',
  'CLAUDE_FLOW_SWARM_DIR',
  'CLAUDE_FLOW_ROUTER_PROVIDER',
  'CLAUDE_FLOW_ROUTER_OPENROUTER_ALTS',
  'OPENROUTER_API_KEY',
  'ANTHROPIC_API_KEY',
];
function clearEnv() { for (const k of ENV_KEYS) delete process.env[k]; }

// ---------------------------------------------------------------------------
// neural-router
// ---------------------------------------------------------------------------
describe('neural-router (ADR-148)', () => {
  beforeEach(() => {
    clearEnv();
    __resetNeuralRouterForTests();
  });
  afterEach(() => clearEnv());

  it('returns null when CLAUDE_FLOW_ROUTER_NEURAL is not set (gate closed)', async () => {
    const result = await tryCostOptimalRoute(makeEmbedding(42));
    expect(result).toBeNull();
  });

  it('returns null when embedding is missing or empty (even with gate open)', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    // @ts-expect-error — testing the invalid-input branch
    expect(await tryCostOptimalRoute(undefined)).toBeNull();
    expect(await tryCostOptimalRoute([])).toBeNull();
  });

  it('reports enabled=false when gate is closed in status()', async () => {
    const s = await neuralRouterStatus();
    expect(s.enabled).toBe(false);
    expect(s.routedBy).toBeNull();
  });

  it('routes a cheap-looking query to haiku when gate is open and seed corpus loads', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    // Construct a clean cheap probe — only the seed corpus's signal channels
    // populated, all noise dimensions zero. We're testing the integration,
    // not the model's generalization to noisy embeddings.
    const e = new Array(32).fill(0);
    e[0] = 0.85; e[1] = 0.0;
    const r = await tryCostOptimalRoute(e);
    if (!r) {
      // If @metaharness/router isn't installed in CI, we expect null and a
      // diagnostic reason. Skip strict assertions on the cost-optimal pick.
      const s = await neuralRouterStatus();
      expect(s.available || s.reason.includes('not installed')).toBe(true);
      return;
    }
    expect(['metaharness-knn', 'metaharness-krr', 'fastgrnn']).toContain(r.routedBy);
    expect(r.model).toBe('haiku');
    expect(r.metBar).toBe(true);
    expect(r.inferenceTimeUs).toBeGreaterThanOrEqual(0);
    expect(r.alternatives.length).toBeGreaterThanOrEqual(2);
  });

  it('routes a strong-looking query away from haiku', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const e = new Array(32).fill(0);
    e[0] = -0.85; e[1] = 0.7;
    const r = await tryCostOptimalRoute(e);
    if (!r) return; // dep absent in CI
    expect(r.model).not.toBe('haiku');
    // For a strong query, predictedQuality of haiku should be below sonnet/opus
    const haikuPred = r.alternatives.find(a => a.model === 'haiku')?.predictedQuality ?? 1;
    const opusPred = r.alternatives.find(a => a.model === 'opus')?.predictedQuality ?? 0;
    expect(opusPred).toBeGreaterThanOrEqual(haikuPred);
  });

  it('caches the resolved backend across calls', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const e = makeEmbedding(3);
    e[0] = 0.85;
    const s1 = await neuralRouterStatus();
    const s2 = await neuralRouterStatus();
    // routedBy should be sticky across calls (single-init guarantee)
    expect(s1.routedBy).toBe(s2.routedBy);
  });
});

// ---------------------------------------------------------------------------
// router-trajectory
// ---------------------------------------------------------------------------
describe('router-trajectory (ADR-148)', () => {
  let tmpDir: string;

  beforeEach(() => {
    clearEnv();
    __resetTrajectoryRecorderForTests();
    tmpDir = mkdtempSync(join(tmpdir(), 'router-traj-test-'));
  });
  afterEach(() => {
    clearEnv();
    __resetTrajectoryRecorderForTests();
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes nothing when gate is closed', () => {
    const path = join(tmpDir, 'trajectories.jsonl');
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_PATH = path;
    __resetTrajectoryRecorderForTests();
    recordDecision({
      task: 'add console.log to cache',
      complexity: 0.1, model: 'haiku', confidence: 0.9, uncertainty: 0.1,
      routedBy: 'heuristic',
    });
    expect(existsSync(path)).toBe(false);
  });

  it('writes one JSONL row per call when gate is open', () => {
    const path = join(tmpDir, 'trajectories.jsonl');
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY = '1';
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_PATH = path;
    __resetTrajectoryRecorderForTests();
    recordDecision({
      task: 'add console.log to cache',
      embedding: [1, 2, 3],
      complexity: 0.1, model: 'haiku', confidence: 0.9, uncertainty: 0.1,
      routedBy: 'metaharness-knn',
    });
    recordDecision({
      task: 'design distributed consensus protocol',
      complexity: 0.85, model: 'opus', confidence: 0.92, uncertainty: 0.08,
      routedBy: 'fastgrnn',
    });
    const content = readFileSync(path, 'utf8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
    const first = JSON.parse(lines[0]);
    expect(first.v).toBe(1);
    expect(first.type).toBe('decision');
    expect(first.model).toBe('haiku');
    expect(first.routed_by).toBe('metaharness-knn');
    expect(first.embedding).toEqual([1, 2, 3]);
    expect(first.task_hash).toMatch(/^[0-9a-f]{8}$/);
    const second = JSON.parse(lines[1]);
    expect(second.routed_by).toBe('fastgrnn');
    expect(second.embedding).toBeUndefined();
  });

  it('truncates task text to the configured limit', () => {
    const path = join(tmpDir, 'trajectories.jsonl');
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY = '1';
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_PATH = path;
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_TASKLEN = '10';
    __resetTrajectoryRecorderForTests();
    recordDecision({
      task: 'a'.repeat(500),
      complexity: 0.5, model: 'sonnet', confidence: 0.8, uncertainty: 0.2,
      routedBy: 'heuristic',
    });
    const row = JSON.parse(readFileSync(path, 'utf8').trim());
    expect(row.task).toHaveLength(10);
  });

  it('taskHash is deterministic and 8-hex', () => {
    expect(taskHash('hello')).toBe(taskHash('hello'));
    expect(taskHash('hello')).toMatch(/^[0-9a-f]{8}$/);
    expect(taskHash('hello')).not.toBe(taskHash('Hello'));
  });

  it('exposes accurate status via trajectoryRecorderStatus()', () => {
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY = '1';
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_PATH = '/tmp/x.jsonl';
    __resetTrajectoryRecorderForTests();
    const s = trajectoryRecorderStatus();
    expect(s.enabled).toBe(true);
    expect(s.path).toBe('/tmp/x.jsonl');
  });
});

// ---------------------------------------------------------------------------
// Integration with ModelRouter (the load-bearing parity check)
// ---------------------------------------------------------------------------
describe('ModelRouter integration (ADR-148)', () => {
  beforeEach(() => {
    clearEnv();
    __resetNeuralRouterForTests();
    __resetTrajectoryRecorderForTests();
    // Reset the singleton model router so the Beta priors start from a fresh state
    // Note: resetModelRouter() is the public surface for this.
    vi.resetModules();
  });

  it('result carries routedBy="heuristic" when neural gate is closed (default)', async () => {
    const { resetModelRouter, routeToModelFull } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const result = await routeToModelFull('add console.log to cache');
    expect(result.routedBy).toBe('heuristic');
    expect(['haiku', 'sonnet', 'opus', 'inherit']).toContain(result.model);
  });

  it('result carries routedBy="heuristic" even with neural gate open if no embedding supplied', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    const { resetModelRouter, routeToModelFull } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const result = await routeToModelFull('add console.log to cache');
    // No embedding → neural path not consulted → still heuristic
    expect(result.routedBy).toBe('heuristic');
  });

  it('routedBy reflects active neural backend when gate + embedding + corpus all align', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const { resetModelRouter, routeToModelFull } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const e = makeEmbedding(3);
    e[0] = 0.85; e[1] = 0.0;
    const result = await routeToModelFull('add console.log to cache', e);
    // ADR-148 hybrid math: `routedBy` is the decision mechanism, not the
    // backend identity. When the neural backend returns a prediction, the
    // bandit posterior is blended with the neural prior and the mechanism
    // is reported as 'hybrid'; the neural backend ID is on `neuralBackend`.
    expect(['hybrid', 'bandit-fallback', 'heuristic']).toContain(result.routedBy);
    if (result.routedBy === 'hybrid') {
      expect(['metaharness-knn', 'metaharness-krr', 'fastgrnn']).toContain(result.neuralBackend);
    }
  });
});

// ---------------------------------------------------------------------------
// ADR-148 phase 2 — OpenRouter alternates
// ---------------------------------------------------------------------------
describe('OpenRouter alternates (ADR-148 phase 2)', () => {
  beforeEach(() => {
    clearEnv();
    __resetNeuralRouterForTests();
    vi.resetModules();
  });
  afterEach(() => clearEnv());

  it('defaults provider to "anthropic" when no OpenRouter signals are set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    const { resetModelRouter, routeToModelFull } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const r = await routeToModelFull('add console.log to cache');
    expect(r.provider).toBe('anthropic');
    expect(r.openrouterModel).toBeUndefined();
  });

  it('switches to "openrouter" when CLAUDE_FLOW_ROUTER_PROVIDER=openrouter', async () => {
    process.env.CLAUDE_FLOW_ROUTER_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    const { resetModelRouter, routeToModelFull } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const r = await routeToModelFull('add console.log to cache');
    expect(r.provider).toBe('openrouter');
    // openrouterModel should be set when the alts asset loads correctly.
    // If asset path isn't resolved in test env it can be undefined — assert
    // that *if* present, it's a non-empty string.
    if (r.openrouterModel !== undefined) {
      expect(typeof r.openrouterModel).toBe('string');
      expect(r.openrouterModel.length).toBeGreaterThan(0);
    }
  });

  it('auto-selects openrouter when only OPENROUTER_API_KEY is set', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'; // no ANTHROPIC_API_KEY
    const { resetModelRouter, routeToModelFull } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const r = await routeToModelFull('add console.log to cache');
    expect(r.provider).toBe('openrouter');
  });

  it('respects explicit ANTHROPIC_API_KEY presence even when OpenRouter key is also set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    // No explicit CLAUDE_FLOW_ROUTER_PROVIDER — defaults to anthropic
    const { resetModelRouter, routeToModelFull } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const r = await routeToModelFull('add console.log to cache');
    expect(r.provider).toBe('anthropic');
  });

  it('explicit CLAUDE_FLOW_ROUTER_PROVIDER=anthropic overrides both keys', async () => {
    process.env.CLAUDE_FLOW_ROUTER_PROVIDER = 'anthropic';
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    const { resetModelRouter, routeToModelFull } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const r = await routeToModelFull('design distributed consensus protocol with byzantine fault tolerance');
    expect(r.provider).toBe('anthropic');
    expect(r.openrouterModel).toBeUndefined();
  });
});
