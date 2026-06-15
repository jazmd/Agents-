/**
 * router-trajectory.ts — Opt-in DRACO-shaped trajectory recorder for the
 * cost-optimal model router (ADR-148, phase 5).
 *
 * Writes one JSON-line per routing decision and one per outcome to a
 * shared `.swarm/model-router-trajectories.jsonl`. Outcome rows are
 * matched to their decision via `task_hash` (FNV-1a-32 of the task text).
 *
 * Gated behind `CLAUDE_FLOW_ROUTER_TRAJECTORY=1`. Default: **off** — rows
 * carry full task text + raw embeddings, which is a PII/retention surface
 * we do not enable without explicit consent.
 *
 * Schema is versioned (`"v": 1`). New required fields bump the version;
 * additive optional fields do not.
 *
 * @module router-trajectory
 */

import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';

import type { ClaudeModel } from './model-router.js';
import type { NeuralRoutedBy } from './neural-router.js';

// ============================================================================
// Schema (versioned)
// ============================================================================

/** A single routing decision — written at `route()` time. */
export interface TrajectoryDecisionRow {
  v: 1;
  type: 'decision';
  ts: string;                                  // ISO-8601, no millisecond ambiguity
  task_hash: string;                           // FNV-1a-32 hex of task text
  task: string;                                // ≤500 chars (truncated)
  embedding?: number[];                        // only present when supplied to route()
  complexity: number;                          // 0..1 from the heuristic features
  model: ClaudeModel;
  confidence: number;                          // 0..1
  uncertainty: number;                         // 0..1
  routed_by: 'metaharness-knn' | 'metaharness-krr' | 'fastgrnn' | 'bandit-fallback' | 'heuristic';
}

/** A routing outcome — written later by the caller via `recordOutcome()`. */
export interface TrajectoryOutcomeRow {
  v: 1;
  type: 'outcome';
  ts: string;
  task_hash: string;
  /** 0..1 measured quality the chosen model achieved. */
  quality: number;
  /** Optional per-model quality if the same query was evaluated against alternates. */
  scores?: Record<string, number>;
  /** Free-form provenance note (e.g. "manual rating", "benchmark suite"). */
  source?: string;
}

export type TrajectoryRow = TrajectoryDecisionRow | TrajectoryOutcomeRow;

// ============================================================================
// FNV-1a-32 (matches scripts/gen-seed-corpus.mjs)
// ============================================================================

export function taskHash(task: string): string {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < task.length; i++) {
    h ^= task.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// ============================================================================
// Recorder state
// ============================================================================

interface RecorderConfig {
  enabled: boolean;
  path: string;
  /** Max task chars to persist (default 500). */
  taskCharLimit: number;
}

let _cfg: RecorderConfig | null = null;

function getConfig(): RecorderConfig {
  if (_cfg !== null) return _cfg;
  const enabled = process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY === '1';
  const swarmDir = process.env.CLAUDE_FLOW_SWARM_DIR
    ?? resolvePath(process.cwd(), '.swarm');
  _cfg = {
    enabled,
    path: process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_PATH
      ?? join(swarmDir, 'model-router-trajectories.jsonl'),
    taskCharLimit: parseInt(process.env.CLAUDE_FLOW_ROUTER_TRAJECTORY_TASKLEN ?? '500', 10) || 500,
  };
  return _cfg;
}

function appendRow(row: TrajectoryRow): void {
  const cfg = getConfig();
  if (!cfg.enabled) return;
  try {
    const dir = dirname(cfg.path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    // One JSON object per line, newline-terminated. No leading whitespace —
    // we want the file to be `jq -c`-friendly.
    appendFileSync(cfg.path, JSON.stringify(row) + '\n');
  } catch {
    // Silent: trajectory collection must never break routing.
  }
}

// ============================================================================
// Public API
// ============================================================================

/** Record one decision. Cheap — a single appendFileSync of a JSONL row. */
export function recordDecision(args: {
  task: string;
  embedding?: number[];
  complexity: number;
  model: ClaudeModel;
  confidence: number;
  uncertainty: number;
  routedBy: TrajectoryDecisionRow['routed_by'];
}): void {
  const cfg = getConfig();
  if (!cfg.enabled) return;
  const row: TrajectoryDecisionRow = {
    v: 1, type: 'decision',
    ts: new Date().toISOString(),
    task_hash: taskHash(args.task),
    task: args.task.length > cfg.taskCharLimit ? args.task.slice(0, cfg.taskCharLimit) : args.task,
    embedding: args.embedding,
    complexity: args.complexity,
    model: args.model,
    confidence: args.confidence,
    uncertainty: args.uncertainty,
    routed_by: args.routedBy,
  };
  appendRow(row);
}

/** Record one outcome. Join to a decision by `task_hash`. */
export function recordTrajectoryOutcome(args: {
  task: string;
  quality: number;
  scores?: Record<string, number>;
  source?: string;
}): void {
  const cfg = getConfig();
  if (!cfg.enabled) return;
  const row: TrajectoryOutcomeRow = {
    v: 1, type: 'outcome',
    ts: new Date().toISOString(),
    task_hash: taskHash(args.task),
    quality: args.quality,
    scores: args.scores,
    source: args.source,
  };
  appendRow(row);
}

/** Diagnostic for status/CLI. */
export function trajectoryRecorderStatus(): { enabled: boolean; path: string; taskCharLimit: number } {
  return { ...getConfig() };
}

/** Test seam — reset cached config so unit tests can change env vars between cases. */
export function __resetTrajectoryRecorderForTests(): void {
  _cfg = null;
}
