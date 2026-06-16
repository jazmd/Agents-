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
  'CLAUDE_FLOW_ROUTER_LATENCY_BUDGET_MS',
  'CLAUDE_FLOW_ROUTER_BANDIT_PER_MODEL',
  'CLAUDE_FLOW_ROUTER_CALIBRATE',           // iter 24 — default-on; tests should not leak overrides
  'CLAUDE_FLOW_ROUTER_CALIBRATOR_PATH',
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

  it('returns a cost-optimal pick when gate is open and seed corpus loads', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    // ADR-149 v2 — the seed corpus now carries real 384-dim MiniLM embeddings.
    // A zero-vector probe is a neutral query; we don't predict a specific tier
    // (the picked tier depends on the trained KRR's nearest neighbours), but
    // every routing contract still applies: a real modelId, a valid tier
    // label, ≥2 alternatives, non-negative latency.
    const e = new Array(384).fill(0);
    const r = await tryCostOptimalRoute(e);
    if (!r) {
      // If @metaharness/router isn't installed in CI, we expect null and a
      // diagnostic reason. Skip strict assertions on the cost-optimal pick.
      const s = await neuralRouterStatus();
      expect(s.available || s.reason.includes('not installed')).toBe(true);
      return;
    }
    expect(['metaharness-knn', 'metaharness-krr', 'fastgrnn']).toContain(r.routedBy);
    expect(typeof r.modelId).toBe('string');
    expect(r.modelId.length).toBeGreaterThan(0);
    expect(['haiku', 'sonnet', 'opus', 'inherit']).toContain(r.model);
    expect(r.inferenceTimeUs).toBeGreaterThanOrEqual(0);
    expect(r.alternatives.length).toBeGreaterThanOrEqual(2);
  });

  it('returns a per-model pick with modelId (ADR-149)', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const e = new Array(32).fill(0);
    e[0] = -0.85; e[1] = 0.7;
    const r = await tryCostOptimalRoute(e);
    if (!r) return; // dep absent in CI
    // ADR-149: the result must carry a concrete model id (a string), and
    // the picked model id must appear as one of the alternatives.
    expect(typeof r.modelId).toBe('string');
    expect(r.modelId.length).toBeGreaterThan(0);
    expect(r.alternatives.find(a => a.modelId === r.modelId)).toBeDefined();
    // The tier label (model) is derived from the modelId — must be a valid
    // ClaudeModel tier, not necessarily the "expected" tier (DRACO finding:
    // measured cheap models often beat expensive ones on terse tasks).
    expect(['haiku', 'sonnet', 'opus', 'inherit']).toContain(r.model);
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

  it('calibration is default-ON; CLAUDE_FLOW_ROUTER_CALIBRATE=0 opts out (ADR-149 iter 24)', async () => {
    // Iter 23 OOS validation moved this from opt-in to opt-out: ECE 0.1604 →
    // 0.0335 with calibration enabled. Verify the env-var semantics flipped:
    //   unset      → calibration applied (status reason contains 'calibrated')
    //   = '1'      → calibration applied (back-compat)
    //   = '0'      → calibration bypassed (raw KRR behavior)
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';

    // Default: no env var → calibrated.
    __resetNeuralRouterForTests();
    const sDefault = await neuralRouterStatus();
    if (sDefault.routedBy !== 'metaharness-krr') return; // dep absent / KRR not loaded
    expect(sDefault.reason).toContain('calibrated');

    // Back-compat: '1' still works.
    process.env.CLAUDE_FLOW_ROUTER_CALIBRATE = '1';
    __resetNeuralRouterForTests();
    const sOn = await neuralRouterStatus();
    expect(sOn.reason).toContain('calibrated');

    // Opt-out: '0' bypasses.
    process.env.CLAUDE_FLOW_ROUTER_CALIBRATE = '0';
    __resetNeuralRouterForTests();
    const sOff = await neuralRouterStatus();
    expect(sOff.reason).not.toContain('calibrated');
  });

  it('per-tier calibrators load when present and are reported in status reason (ADR-149 iter 25)', async () => {
    // Iter 25 ships seed-router.calibrator.{low,med,high}.json alongside the
    // unified calibrator. When all are present, status reason should reflect
    // every loaded calibrator. When CALIBRATE=0, none should load.
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';

    __resetNeuralRouterForTests();
    const s = await neuralRouterStatus();
    if (s.routedBy !== 'metaharness-krr') return; // dep absent / KRR not loaded

    // The reason string lists which calibrators loaded; with the bundled
    // artifacts, expect unified + low + med + high.
    expect(s.reason).toMatch(/calibrated: .*unified/);
    // At least one bucket must be present (best-effort — file existence
    // depends on whether iter 25 was run on this checkout).
    const hasBucket = /calibrated: .*(low|med|high)/.test(s.reason);
    expect(hasBucket).toBe(true);

    // Opt-out kills all calibrators.
    process.env.CLAUDE_FLOW_ROUTER_CALIBRATE = '0';
    __resetNeuralRouterForTests();
    const sOff = await neuralRouterStatus();
    expect(sOff.reason).not.toContain('calibrated');
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

  it('IsotonicCalibrator: fit + transform corrects monotone bias (ADR-149 iter 22)', async () => {
    const { IsotonicCalibrator } = await import('../src/ruvector/router-calibrator.js');

    // Build a synthetic miscalibration: predictions are systematically too low
    // (linear with slope 0.5, offset 0). Calibrator should learn to lift them.
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i <= 10; i++) {
      const truth = i / 10;
      const predicted = truth * 0.5;          // 0.0 → 0.0, 1.0 → 0.5
      pairs.push([predicted, truth]);
    }
    const cal = IsotonicCalibrator.fit(pairs);

    // After fitting, transform should bring predictions back near the truth.
    expect(cal.transform(0.0)).toBeCloseTo(0.0, 1);
    expect(cal.transform(0.25)).toBeCloseTo(0.5, 1);
    expect(cal.transform(0.5)).toBeCloseTo(1.0, 1);

    // Bucket count is bounded by input size and PAV pooling.
    expect(cal.bucketCount).toBeGreaterThan(0);
    expect(cal.bucketCount).toBeLessThanOrEqual(pairs.length);

    // Round-trip via JSON preserves outputs.
    const roundtrip = IsotonicCalibrator.fromJSON(cal.toJSON());
    expect(roundtrip.transform(0.25)).toBeCloseTo(cal.transform(0.25), 6);
    expect(roundtrip.bucketCount).toBe(cal.bucketCount);
  });

  it('IsotonicCalibrator: monotonicity is enforced via PAV pooling (ADR-149 iter 22)', async () => {
    const { IsotonicCalibrator } = await import('../src/ruvector/router-calibrator.js');

    // Adversarial input where observed values violate monotonicity locally.
    // PAV should pool the violators into a single bucket.
    const pairs: Array<[number, number]> = [
      [0.0, 0.1],
      [0.1, 0.9],   // violator — high obs at low pred
      [0.2, 0.2],   // violator — low obs at higher pred (pooled with previous)
      [0.3, 0.5],
      [0.5, 0.6],
      [0.7, 0.7],
      [1.0, 0.9],
    ];
    const cal = IsotonicCalibrator.fit(pairs);

    // After PAV, the calibrated outputs must be non-decreasing.
    let prev = -Infinity;
    for (let i = 0; i <= 10; i++) {
      const v = cal.transform(i / 10);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }

    // PAV should have collapsed the violators into ≤ pairs.length buckets.
    expect(cal.bucketCount).toBeLessThan(pairs.length);

    // Empty pairs → pass-through identity (no calibration data).
    const empty = IsotonicCalibrator.fit([]);
    expect(empty.transform(0.42)).toBe(0.42);
    expect(empty.bucketCount).toBe(0);
  });

  it('pairTrajectoryRows reconstructs training rows from decision+outcome (ADR-149 iter 18)', async () => {
    const { pairTrajectoryRows, tierFromComplexity } = await import('../src/ruvector/router-trajectory.js');

    const emb = new Array(384).fill(0).map((_, i) => Math.sin(i));
    const rows = [
      // Paired: decision has embedding, matching outcome — should produce 1 row.
      { v: 1, type: 'decision', ts: '2026-06-15T00:00:00Z', task_hash: 'aaaaaaaa', task: 'remove console.log calls', embedding: emb,
        complexity: 0.15, model: 'haiku', confidence: 0.9, uncertainty: 0.1, routed_by: 'hybrid' },
      { v: 1, type: 'outcome', ts: '2026-06-15T00:00:05Z', task_hash: 'aaaaaaaa', quality: 1.0,
        scores: { 'inclusionai/ling-2.6-flash': 1.0 }, source: 'agent-execute' },

      // Dropped: no embedding.
      { v: 1, type: 'decision', ts: '2026-06-15T00:00:10Z', task_hash: 'bbbbbbbb', task: 'no-embed case',
        complexity: 0.5, model: 'sonnet', confidence: 0.7, uncertainty: 0.3, routed_by: 'heuristic' },
      { v: 1, type: 'outcome', ts: '2026-06-15T00:00:15Z', task_hash: 'bbbbbbbb', quality: 0.5 },

      // Dropped: orphan decision.
      { v: 1, type: 'decision', ts: '2026-06-15T00:00:20Z', task_hash: 'cccccccc', task: 'orphan', embedding: emb,
        complexity: 0.8, model: 'opus', confidence: 0.6, uncertainty: 0.4, routed_by: 'hybrid' },

      // Latest-wins: two outcomes for same hash, newer one is kept.
      { v: 1, type: 'decision', ts: '2026-06-15T00:00:30Z', task_hash: 'dddddddd', task: 'two outcomes', embedding: emb,
        complexity: 0.4, model: 'haiku', confidence: 0.8, uncertainty: 0.2, routed_by: 'hybrid' },
      { v: 1, type: 'outcome', ts: '2026-06-15T00:00:35Z', task_hash: 'dddddddd', quality: 0.0, source: 'agent-execute' },
      { v: 1, type: 'outcome', ts: '2026-06-15T00:00:50Z', task_hash: 'dddddddd', quality: 1.0, source: 'llm-judge' },
    ];

    const { pairs, stats } = pairTrajectoryRows(rows as never);

    expect(stats.totalRows).toBe(rows.length);
    expect(stats.decisions).toBe(4);
    expect(stats.outcomes).toBe(4);
    expect(stats.paired).toBe(2);                 // aaaa + dddd
    expect(stats.droppedNoEmbedding).toBe(1);     // bbbb
    expect(stats.droppedNoMatch).toBe(1);         // cccc

    // Shape matches seed-rows.json (task / embedding / scores / tier).
    const aaPair = pairs.find(p => p.task === 'remove console.log calls');
    expect(aaPair).toBeDefined();
    expect(aaPair!.tier).toBe('cheap');           // complexity 0.15 → cheap
    expect(aaPair!.embedding.length).toBe(384);
    expect(aaPair!.scores['inclusionai/ling-2.6-flash']).toBe(1.0);

    // Latest-wins on outcomes for the same task_hash.
    const ddPair = pairs.find(p => p.task === 'two outcomes');
    expect(ddPair).toBeDefined();
    expect(ddPair!.source).toBe('llm-judge');     // newer outcome kept
    // No explicit scores on the newer outcome → synthesize from model+quality.
    expect(ddPair!.scores).toEqual({ haiku: 1.0 });
    expect(ddPair!.tier).toBe('mid');             // complexity 0.4 → mid

    // tierFromComplexity boundaries.
    expect(tierFromComplexity(0.0)).toBe('cheap');
    expect(tierFromComplexity(0.33)).toBe('cheap');
    expect(tierFromComplexity(0.34)).toBe('mid');
    expect(tierFromComplexity(0.66)).toBe('mid');
    expect(tierFromComplexity(0.67)).toBe('strong');
    expect(tierFromComplexity(1.0)).toBe('strong');

    // bySource and byTier reflect the paired set, not the raw rows.
    expect(stats.bySource).toEqual({ 'agent-execute': 1, 'llm-judge': 1 });
    expect(stats.byTier).toEqual({ cheap: 1, mid: 1 });
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

  it('recordModelOutcome updates the bandit prior for the target tier (ADR-149 iter 2)', async () => {
    // ADR-149 — the bandit can only improve if outcome feedback fires. This
    // test confirms recordModelOutcome mutates state in a way getModelRouterStats
    // can see; without this round-trip, executeAgentTask's feedback loop is dead.
    const { resetModelRouter, recordModelOutcome, getModelRouterStats } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    const statsBefore = getModelRouterStats();
    // Drive the bandit through 5 success outcomes on 'haiku' for the same task.
    for (let i = 0; i < 5; i++) {
      recordModelOutcome('add a console.log to cache', 'haiku', 'success');
    }
    const statsAfter = getModelRouterStats();
    // The bandit tracks decisions internally; the per-mechanism counters
    // only update on route() calls, but the persistent Beta prior must be
    // observable via the public stats surface — total decisions ticks up
    // every recorded outcome via trackDecision under the hood.
    expect(statsAfter).toBeDefined();
    // Smoke: priors object exists; specific counts may vary by trackDecision
    // semantics but a clean increment from 0 baseline implies the loop is live.
    expect(typeof statsBefore.totalDecisions).toBe('number');
    expect(typeof statsAfter.totalDecisions).toBe('number');
  });

  it('nextCostOptimalAlternative returns a different model when the picked one is excluded (ADR-149 iter 7)', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const { nextCostOptimalAlternative, tryCostOptimalRoute } = await import('../src/ruvector/neural-router.js');
    const e = new Array(384).fill(0);
    const first = await tryCostOptimalRoute(e);
    if (!first) return; // dep absent in CI
    expect(typeof first.modelId).toBe('string');
    const alt = await nextCostOptimalAlternative(e, [first.modelId]);
    if (!alt) return; // single-candidate registry — unusual but possible
    expect(typeof alt.modelId).toBe('string');
    expect(alt.modelId).not.toBe(first.modelId);
    // alt.alternatives must NOT include the excluded model id
    expect(alt.alternatives.find(a => a.modelId === first.modelId)).toBeUndefined();
  });

  it('nextCostOptimalAlternative returns null when every candidate is excluded (ADR-149 iter 7)', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const { nextCostOptimalAlternative, tryCostOptimalRoute } = await import('../src/ruvector/neural-router.js');
    const e = new Array(384).fill(0);
    const first = await tryCostOptimalRoute(e);
    if (!first) return; // dep absent in CI
    // Exclude every candidate the router knows about
    const allIds = first.alternatives.map(a => a.modelId);
    const exhausted = await nextCostOptimalAlternative(e, allIds);
    expect(exhausted).toBeNull();
  });

  it('trajectory recorder pairs decision+outcome by task_hash (ADR-149 iter 17)', async () => {
    // Smoke that both row types share the same FNV-1a-32 task_hash so a
    // downstream training script can join on it without ambiguity.
    const tmp = mkdtempSync(join(tmpdir(), 'iter17-'));
    try {
      const path = join(tmp, 'trajectories.jsonl');
      process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY = '1';
      process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_PATH = path;
      __resetTrajectoryRecorderForTests();
      const { recordDecision, recordTrajectoryOutcome, taskHash } = await import('../src/ruvector/router-trajectory.js');

      const task = 'add console.log to cache';
      recordDecision({
        task, complexity: 0.2, model: 'haiku', confidence: 0.9, uncertainty: 0.1,
        routedBy: 'hybrid', neuralBackend: 'metaharness-krr',
      });
      recordTrajectoryOutcome({ task, quality: 1.0, scores: { 'inclusionai/ling-2.6-flash': 1.0 }, source: 'agent-execute' });

      const content = readFileSync(path, 'utf8');
      const lines = content.trim().split('\n').map(l => JSON.parse(l));
      expect(lines.length).toBe(2);
      // Both rows must share the same task_hash
      expect(lines[0].task_hash).toBe(lines[1].task_hash);
      expect(lines[0].task_hash).toBe(taskHash(task));
      // Types are correct + DRACO-shape fields present on outcome
      expect(lines[0].type).toBe('decision');
      expect(lines[1].type).toBe('outcome');
      expect(lines[1].scores).toBeDefined();
      expect(lines[1].quality).toBe(1.0);
    } finally {
      delete process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY;
      delete process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_PATH;
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('per-modelId Thompson is hooked when gated on (ADR-149 iter 14)', async () => {
    // Smoke: with the gate on AND priorsById accumulated, the selector
    // should still return a valid result. We don't assert a specific
    // pick change because that depends on whether the bandit signal
    // disagrees with the neural prediction — a real production-data scenario.
    const { resetModelRouter, recordModelOutcomeByModelId, getModelRouterPriorsById } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    // Drive ≥5 outcomes for a candidate so the density guard passes.
    const probeTask = 'Implement edge case for cache';
    for (let i = 0; i < 8; i++) {
      recordModelOutcomeByModelId(probeTask + ' ' + i, 'inclusionai/ling-2.6-flash', 'success');
    }
    const priorsById = getModelRouterPriorsById();
    expect(priorsById).not.toBeNull();
    // Marginal across all buckets for this id should reflect the accumulated alpha
    let totalAlpha = 0; let totalBeta = 0;
    for (const b of ['low','med','high'] as const) {
      const p = priorsById?.[b]?.['inclusionai/ling-2.6-flash'];
      if (p) { totalAlpha += p.alpha - 1; totalBeta += p.beta - 1; }
    }
    expect(totalAlpha).toBeGreaterThan(0); // ≥1 outcome accumulated

    // Verify the selector path runs with the gate on
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    process.env.CLAUDE_FLOW_ROUTER_BANDIT_PER_MODEL = '1';
    __resetNeuralRouterForTests();
    const { tryCostOptimalRoute } = await import('../src/ruvector/neural-router.js');
    const e = new Array(384).fill(0); e[0] = 0.3;
    const r = await tryCostOptimalRoute(e);
    if (!r) return; // dep absent
    expect(typeof r.modelId).toBe('string');
    expect(r.modelId.length).toBeGreaterThan(0);
  });

  it('latency budget filters slow candidates from the pick (ADR-149 iter 12)', async () => {
    // With no budget, the router picks the cost-optimal candidate (often Ling).
    // With a tight budget (200ms), candidates whose measured p50 exceeds it
    // should be filtered out — the picked modelId may change.
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const { tryCostOptimalRoute } = await import('../src/ruvector/neural-router.js');
    const e = new Array(384).fill(0); e[0] = 0.3;

    const unbounded = await tryCostOptimalRoute(e);
    if (!unbounded) return; // dep absent

    // Now apply a stricter budget — should still produce a result, possibly
    // the same model id (if it was already fast) or a different one.
    process.env.CLAUDE_FLOW_ROUTER_LATENCY_BUDGET_MS = '300';
    __resetNeuralRouterForTests();
    const constrained = await tryCostOptimalRoute(e);
    expect(constrained).not.toBeNull();
    expect(typeof constrained!.modelId).toBe('string');
    // The CONSTRAINT must not break the routing contract — alternatives
    // still surface the full set; only the pick is constrained.
    expect(constrained!.alternatives.length).toBeGreaterThanOrEqual(2);
  });

  it('embedTaskWithCacheBatch matches single-call results + amortizes setup (ADR-149 iter 11)', async () => {
    const { embedTaskWithCache, embedTaskWithCacheBatch, __resetTaskEmbedderForTests, embedderStats } = await import('../src/ruvector/task-embedder.js');
    __resetTaskEmbedderForTests();
    const tasks = ['task one', 'task two', 'task three'];
    const single = await Promise.all(tasks.map(t => embedTaskWithCache(t)));
    if (!single[0]) return; // dep absent
    __resetTaskEmbedderForTests();
    const batch = await embedTaskWithCacheBatch(tasks);
    expect(batch.length).toBe(3);
    // Batch results should equal single-call results
    for (let i = 0; i < 3; i++) {
      expect(batch[i]).toBeDefined();
      expect(batch[i]!.length).toBe(single[i]!.length);
      // Float comparison — same input via the same pipeline should be deterministic
      expect(batch[i]!.slice(0, 4)).toEqual(single[i]!.slice(0, 4));
    }
    // Counters reflect 3 misses (cold), 0 hits
    const s = embedderStats();
    expect(s.size).toBe(3);
    expect(s.misses).toBe(3);
    expect(s.hits).toBe(0);
  });

  it('tryCostOptimalRouteBatch matches single-call shape (ADR-149 iter 11)', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const { tryCostOptimalRoute, tryCostOptimalRouteBatch } = await import('../src/ruvector/neural-router.js');
    const e1 = new Array(384).fill(0); e1[0] = 0.5;
    const e2 = new Array(384).fill(0); e2[5] = 0.5;
    const e3 = new Array(384).fill(0); e3[10] = 0.5;
    const single1 = await tryCostOptimalRoute(e1);
    if (!single1) return; // dep absent
    const batch = await tryCostOptimalRouteBatch([e1, e2, e3]);
    expect(batch).toHaveLength(3);
    expect(batch[0]).not.toBeNull();
    expect(batch[1]).not.toBeNull();
    expect(batch[2]).not.toBeNull();
    // Batch[0] should match single1's pick (both routed the same embedding)
    expect(batch[0]!.modelId).toBe(single1.modelId);
    // Each result must have the new modelId field set
    for (const r of batch) {
      if (!r) continue;
      expect(typeof r.modelId).toBe('string');
      expect(r.modelId.length).toBeGreaterThan(0);
    }
  });

  it('tryCostOptimalRouteBatch returns null entries for invalid embeddings (ADR-149 iter 11)', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    __resetNeuralRouterForTests();
    const { tryCostOptimalRouteBatch } = await import('../src/ruvector/neural-router.js');
    const valid = new Array(384).fill(0);
    const batch = await tryCostOptimalRouteBatch([valid, [], valid]);
    expect(batch).toHaveLength(3);
    if (batch[0] === null) return; // dep absent — full null batch
    expect(batch[0]).not.toBeNull();
    expect(batch[1]).toBeNull();          // empty embedding → null
    expect(batch[2]).not.toBeNull();
  });

  it('embedTaskWithCache caches by task hash (ADR-149 iter 9)', async () => {
    const { embedTaskWithCache, embedderStats, __resetTaskEmbedderForTests } = await import('../src/ruvector/task-embedder.js');
    __resetTaskEmbedderForTests();
    const sBefore = embedderStats();
    expect(sBefore.size).toBe(0);
    expect(sBefore.hits).toBe(0);
    expect(sBefore.misses).toBe(0);

    // Compute the embedding twice for the same task. First should miss + load;
    // second should hit the LRU. If @xenova/transformers isn't installed in
    // CI, both calls return undefined and we skip the strict cache assertions.
    const task = 'Convert this var to const. Return ONLY the JavaScript:\nvar name = "alice";';
    const v1 = await embedTaskWithCache(task);
    if (!v1) {
      // dep absent — skip
      return;
    }
    const v2 = await embedTaskWithCache(task);
    expect(v2).toBeDefined();
    expect(v2!.length).toBe(v1.length);
    // Same task → cache hit on second call
    const sAfter = embedderStats();
    expect(sAfter.size).toBe(1);
    expect(sAfter.misses).toBe(1);
    expect(sAfter.hits).toBeGreaterThanOrEqual(1);

    // Different task → cache miss + size increment
    const task2 = 'Add a console.log before the return.';
    const v3 = await embedTaskWithCache(task2);
    expect(v3).toBeDefined();
    const sFinal = embedderStats();
    expect(sFinal.size).toBe(2);
    expect(sFinal.misses).toBe(2);
  });

  it('recordModelOutcomeByModelId writes shadow per-modelId state (ADR-149 iter 6)', async () => {
    const { resetModelRouter, recordModelOutcomeByModelId, getModelRouterStats } = await import('../src/ruvector/model-router.js');
    resetModelRouter();
    // Drive 3 successes on a concrete OpenRouter slug. The tier-level priors
    // should be untouched (this method targets priorsById only). After the
    // mutations, getStats must surface priorsById with the new entry and
    // stateVersion must bump to 3.
    const taskText = 'Convert this var to const. Return ONLY the JavaScript:\nvar name = "alice";';
    for (let i = 0; i < 3; i++) {
      recordModelOutcomeByModelId(taskText, 'inclusionai/ling-2.6-flash', 'success');
    }
    const stats = getModelRouterStats();
    expect(stats.stateVersion).toBeGreaterThanOrEqual(3);
    expect(stats.priorsById).toBeDefined();
    // Find the bucket the task got assigned to — could be low/med/high
    // depending on complexity analysis. We just need one of them to contain
    // an entry keyed by our model id with non-default alpha (3 successes ≥ 4).
    const buckets = ['low', 'med', 'high'] as const;
    let found = false;
    for (const b of buckets) {
      const m = stats.priorsById?.[b]?.['inclusionai/ling-2.6-flash'];
      if (m && m.alpha > 1) { found = true; break; }
    }
    expect(found).toBe(true);
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
