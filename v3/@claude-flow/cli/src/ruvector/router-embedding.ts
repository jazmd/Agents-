/**
 * Task-embedding feed for the model router (#2334 Phase 1).
 *
 * Supplies the embedding that `route(task, embedding?)` accepts but no internal
 * call site currently provides. Computed lazily and ONLY when a gate is open
 * (neural routing or trajectory collection), so the default path pays zero cost.
 *
 * Design rules (load-bearing):
 *  - Local 384-dim all-MiniLM-L6-v2 only (ADR-094/130), via the in-tree
 *    `generateEmbedding` provider — no hosted API, no new dependency.
 *  - NO hash/fake fallback, EVER. A fabricated embedding silently poisons the
 *    training set (the ADR-086 `_realEmbedding` failure mode). Absence is recorded
 *    as absence: return `null`, and the trajectory row simply omits `embedding`.
 *  - `backend === 'onnx'` is the ONLY trustworthy real-vs-fallback signal — the
 *    provider's own AUDIT note warns that `model` is not trustworthy via the
 *    AgentDB bridge, and the local hash fallback tags `backend:'mock'`. We reject
 *    anything that is not `'onnx'` (including `undefined`) AND not exactly 384-dim.
 *
 * @module router-embedding
 */

import { neuralRoutingEnabled } from './neural-router.js';
import { trajectoryCollectionEnabled } from './router-trajectory.js';
import { generateEmbedding } from '../memory/memory-initializer.js';

const MINILM_DIMS = 384;

export interface TaskEmbedding {
  /** Length 384, real ONNX all-MiniLM-L6-v2. */
  vector: number[];
  /** Provenance — emitted ONLY for backend==='onnx' vectors. */
  source: 'minilm';
}

// Sticky latch: a missing/broken embedder costs one failed load, not one per call.
let embedderUnavailable = false;
let embedFn: ((text: string) => Promise<number[] | null>) | null = null;

/** True only when some downstream actually consumes an embedding. */
export function embeddingNeeded(): boolean {
  return neuralRoutingEnabled() || trajectoryCollectionEnabled();
}

async function loadEmbedder(): Promise<((t: string) => Promise<number[] | null>) | null> {
  if (embedFn) return embedFn;
  if (embedderUnavailable) return null;
  try {
    // generateEmbedding is a static in-tree import (no new dependency); the typeof
    // guard + try/catch are defensive-only, against future module-shape drift.
    if (typeof generateEmbedding !== 'function') { embedderUnavailable = true; return null; }
    embedFn = async (t: string): Promise<number[] | null> => {
      const r = await generateEmbedding(t);
      // CRITICAL honesty gate (ADR-086): backend==='onnx' is the only trustworthy
      // real-vs-hash signal. Dimension/model alone are NOT sufficient. 'mock' is
      // the deterministic hash fallback — reject it.
      if (!r || r.backend !== 'onnx') return null;
      const v = r.embedding;
      return Array.isArray(v) && v.length === MINILM_DIMS ? v : null;
    };
    return embedFn;
  } catch {
    embedderUnavailable = true;
    return null;
  }
}

/**
 * Best-effort local embedding for a routing task. Returns `null` (never throws)
 * when no consumer needs it, the provider hash-falls-back, or it cannot produce a
 * real 384-dim ONNX vector. Callers pass `?.vector` straight into
 * `route(task, embedding?)`.
 */
export async function tryTaskEmbedding(task: string): Promise<TaskEmbedding | null> {
  if (!embeddingNeeded()) return null;          // zero cost on the default path
  if (!task) return null;
  const fn = await loadEmbedder();
  if (!fn) return null;
  try {
    const vector = await fn(task);
    return vector ? { vector, source: 'minilm' } : null;   // null over fabrication
  } catch {
    return null;
  }
}

/** Reset cached state — for tests. */
export function resetTaskEmbedder(): void {
  embedFn = null;
  embedderUnavailable = false;
}
