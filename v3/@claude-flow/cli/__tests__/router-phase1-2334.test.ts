/**
 * #2334 Phase 1 — cost-optimal neural routing seam.
 *
 * Proves the load-bearing guarantees, not just the happy path:
 *  - the default path is unchanged and pays ZERO embedding cost (routedBy='heuristic');
 *  - a fabricated (mock/hash) or wrong-shape embedding is REJECTED — never fed to
 *    routing or trajectory collection (ADR-086);
 *  - the neural path degrades to an observable 'bandit-fallback', never throws;
 *  - when a real artifact + the optional dep resolve, the pick is honestly tagged
 *    'metaharness-knn' (asserted strictly when the dep is present, else fallback);
 *  - trajectory collection is opt-in and writes a versioned DRACO row.
 *
 * The embedding provider is mocked so the suite is deterministic + offline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rmSync, mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { generateEmbedding } = vi.hoisted(() => ({ generateEmbedding: vi.fn() }));
vi.mock('../src/memory/memory-initializer.js', () => ({ generateEmbedding }));

import { ModelRouter } from '../src/ruvector/model-router.js';
import { resetTaskEmbedder, tryTaskEmbedding } from '../src/ruvector/router-embedding.js';
import { resetNeuralRouter } from '../src/ruvector/neural-router.js';
import { trajectoryFilePath } from '../src/ruvector/router-trajectory.js';

const VALID = ['haiku', 'sonnet', 'opus', 'inherit'];
const onnx384 = () => ({
  embedding: Array.from({ length: 384 }, (_, i) => Math.sin(i) * 0.05),
  dimensions: 384,
  model: 'Xenova/all-MiniLM-L6-v2',
  backend: 'onnx' as const,
});

let cwd0: string;
let tmp: string;

beforeEach(() => {
  cwd0 = process.cwd();
  tmp = mkdtempSync(join(tmpdir(), 'router-p1-2334-'));
  process.chdir(tmp);
  delete process.env.CLAUDE_FLOW_ROUTER_NEURAL;
  delete process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY;
  delete process.env.CLAUDE_FLOW_ROUTER_MODEL_PATH;
  generateEmbedding.mockReset();
  resetTaskEmbedder();
  resetNeuralRouter();
});

afterEach(() => {
  process.chdir(cwd0);
  rmSync(tmp, { recursive: true, force: true });
});

describe('#2334 Phase 1 — neural routing seam', () => {
  it('default path is unchanged and computes no embedding (routedBy=heuristic)', async () => {
    generateEmbedding.mockResolvedValue(onnx384()); // available, but must NOT be called
    const r = await new ModelRouter().route('rename a variable');
    expect(r.routedBy).toBe('heuristic');
    expect(VALID).toContain(r.model);
    expect(generateEmbedding).not.toHaveBeenCalled();
  });

  it('neural gate on but no artifact → bandit-fallback (observable, never throws)', async () => {
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    generateEmbedding.mockResolvedValue(onnx384());
    const r = await new ModelRouter().route('design a distributed consensus protocol');
    expect(r.routedBy).toBe('bandit-fallback');
    expect(VALID).toContain(r.model);
  });

  it('bandit-fallback is byte-identical to the default bandit — neural embedding never perturbs the heuristic complexity', async () => {
    const task = 'design a complex distributed caching layer with strong consistency guarantees';
    generateEmbedding.mockResolvedValue(onnx384()); // a real onnx vector is available...
    const off = await new ModelRouter().route(task); // ...but the gate is OFF here
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';      // gate ON, no artifact → bandit-fallback
    resetTaskEmbedder();
    resetNeuralRouter();
    const on = await new ModelRouter().route(task);
    expect(on.routedBy).toBe('bandit-fallback');
    // complexity is deterministic; if the lazily-acquired embedding leaked into
    // computeSemanticDepth this would differ. It must not. (Would fail pre-fix.)
    expect(on.complexity).toBe(off.complexity);
  });

  it('rejects a mock (hash-fallback) embedding — fabrication is never used (ADR-086)', async () => {
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY = '1'; // make an embedding consumer present
    generateEmbedding.mockResolvedValue({ ...onnx384(), backend: 'mock', model: 'hash-fallback' });
    expect(await tryTaskEmbedding('anything')).toBeNull();
  });

  it('rejects wrong-dimension and missing-backend embeddings', async () => {
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY = '1';
    generateEmbedding.mockResolvedValue({ ...onnx384(), embedding: Array(128).fill(0.1), dimensions: 128 });
    expect(await tryTaskEmbedding('x')).toBeNull();
    resetTaskEmbedder();
    generateEmbedding.mockResolvedValue({ embedding: Array(384).fill(0.1), dimensions: 384, model: 'm' }); // no backend
    expect(await tryTaskEmbedding('x')).toBeNull();
  });

  it('neural gate on + DRACO artifact → metaharness-knn when dep present, else bandit-fallback', async () => {
    const rows = ['haiku', 'sonnet', 'opus'].flatMap((m) =>
      Array.from({ length: 4 }, () => ({
        embedding: Array.from({ length: 384 }, (_, i) => Math.sin(i) * 0.05),
        scores: { haiku: 0.9, sonnet: 0.8, opus: 0.7 },
      })),
    );
    const artifact = join(tmp, 'router-artifact.json');
    writeFileSync(artifact, JSON.stringify(rows));
    process.env.CLAUDE_FLOW_ROUTER_NEURAL = '1';
    process.env.CLAUDE_FLOW_ROUTER_MODEL_PATH = artifact;
    generateEmbedding.mockResolvedValue(onnx384());

    const depPresent = !!(await import('@metaharness/router' as string).catch(() => null));
    const r = await new ModelRouter().route('implement a feature');
    if (depPresent) {
      expect(r.routedBy).toBe('metaharness-knn');
    } else {
      expect(r.routedBy).toBe('bandit-fallback');
    }
    expect(VALID).toContain(r.model);
  });

  it('trajectory collection is opt-in and writes a versioned DRACO row with a real embedding', async () => {
    generateEmbedding.mockResolvedValue(onnx384());

    // off → nothing written
    await new ModelRouter().route('a simple task');
    expect(existsSync(trajectoryFilePath())).toBe(false);

    // on → one v:1 row with the real 384-dim embedding
    process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY = '1';
    resetTaskEmbedder();
    await new ModelRouter().route('architect a scalable distributed system');
    expect(existsSync(trajectoryFilePath())).toBe(true);
    const row = JSON.parse(readFileSync(trajectoryFilePath(), 'utf8').trim().split('\n').pop() as string);
    expect(row.v).toBe(1);
    expect(row.embedding).toHaveLength(384);
    expect(row.embeddingSource).toBe('minilm');
    expect(VALID).toContain(row.model);
  });
});
