/**
 * DRACO trajectory collection for the model router (#2334 Phase 1).
 *
 * Opt-in via `CLAUDE_FLOW_ROUTER_TRAJECTORY=1`. Appends one versioned decision
 * row per routing call to `.swarm/model-router-trajectories.jsonl`, capturing the
 * query `embedding` + the routing decision.
 *
 * This is the EMBEDDING/decision half of a future DRACO training set — NOT a
 * complete `{embedding, scores}` example. The per-model `scores` (quality each
 * tier would achieve on the query — the trainer's target) are NOT captured here
 * and are NOT recoverable from the current bandit outcomes: those are aggregate
 * Beta(α,β) counters keyed by complexity-bucket, not per-query labels, and carry
 * no `taskHash`/embedding to join on. Producing trainable `{embedding, scores}`
 * rows requires a Phase-2 outcome sink (a per-query, `taskHash`-keyed labelled
 * reward) that does not exist yet. Phase 1 starts accumulating the embedding half
 * so it's ready when that sink lands.
 *
 * Best-effort by construction: a write failure NEVER propagates into the routing
 * path (a routing decision must not fail because trajectory logging failed).
 * Rows carry full (truncated) task text + the raw embedding, so collection is
 * opt-in for the same PII reason flagged on #2334.
 *
 * @module router-trajectory
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

/** Schema version — Phase 2 can add fields additively under `v:2`. */
const ROW_VERSION = 1;
const TRAJECTORY_FILE = join('.swarm', 'model-router-trajectories.jsonl');

/** True only when the operator opted into trajectory collection. */
export function trajectoryCollectionEnabled(): boolean {
  return process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY === '1';
}

/** Path of the JSONL sink (relative to cwd). Exposed for tests/tooling. */
export function trajectoryFilePath(): string {
  return TRAJECTORY_FILE;
}

export interface TrajectoryDecision {
  task: string;
  model: string;
  routedBy: string;
  confidence: number;
  complexity: number;
  /** Present ONLY for a real onnx 384-dim vector (never a hash fallback). */
  embedding?: number[];
  embeddingSource?: 'minilm';
  /** Neural prediction context, present only when the neural path engaged. */
  predictedQuality?: number;
  metBar?: boolean;
}

/**
 * Append a decision row. No-op (zero cost) when collection is disabled. Never
 * throws — any I/O failure is swallowed so routing is unaffected.
 */
export function recordTrajectoryDecision(d: TrajectoryDecision): void {
  if (!trajectoryCollectionEnabled()) return;
  try {
    const row: Record<string, unknown> = {
      v: ROW_VERSION,
      ts: new Date().toISOString(),
      taskHash: createHash('sha256').update(d.task).digest('hex').slice(0, 16),
      task: d.task.slice(0, 500),
      model: d.model,
      routedBy: d.routedBy,
      confidence: d.confidence,
      complexity: d.complexity,
    };
    // A missing feature is honest; a fabricated one is a lie (ADR-086). The
    // embedding is emitted only when it is a real onnx vector — otherwise absent.
    if (d.embedding && d.embedding.length > 0) {
      row.embedding = d.embedding;
      row.embeddingSource = d.embeddingSource ?? 'minilm';
    }
    if (d.predictedQuality !== undefined) row.predictedQuality = d.predictedQuality;
    if (d.metBar !== undefined) row.metBar = d.metBar;

    mkdirSync(dirname(TRAJECTORY_FILE), { recursive: true });
    appendFileSync(TRAJECTORY_FILE, JSON.stringify(row) + '\n');
  } catch {
    // best-effort: trajectory collection must never break a routing decision
  }
}
