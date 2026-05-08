/**
 * trace-loader — read-only query layer over the trajectory data already
 * persisted by hooks-tools.ts into `~/.claude/.claude-flow/memory/store.json`.
 *
 * Why this module exists
 * ----------------------
 * Gap 1 (replayable agent traces) needs to surface trajectory data to the
 * renderer + CLI without giving them direct knowledge of the on-disk shape
 * or the install-path resolution. Centralising the I/O here keeps the two
 * other Gap-1 coders (`coder-trace-renderer`, `coder-trace-cli`) decoupled
 * from store.json — they consume `LoadedTrajectory` only.
 *
 * Contract (locked — do not change without updating Gap-1 design):
 *   - listTrajectories(opts?) -> sorted-newest-first, optional since/agent/limit
 *   - loadTrajectory(idOrLatest) -> exact id, ≥8-char unique prefix, or 'latest'
 *
 * Design notes
 * ------------
 * - Pure reader — no writes, no mutation of the store.
 * - Uses `resolveInstallContext()` so we honour both global and per-project
 *   install layouts; never hardcodes `os.homedir()`.
 * - Each trajectory entry is parsed defensively. Malformed entries are
 *   skipped (via `swallowError`), never crashed-on, so one bad entry can't
 *   poison `swarmops trace list`.
 *
 * @module v3/cli/services/trace-loader
 */

import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

import { resolveInstallContext, swallowError } from '@claude-flow/shared';

// ============================================================================
// Public types — these are the locked contract surface.
// ============================================================================

/**
 * A single step in a trajectory. Mirrors `TrajectoryStep` from hooks-tools.ts
 * but is redeclared here so consumers don't have to import internal types.
 */
interface LoadedTrajectoryStep {
  action: string;
  result: string;
  quality: number;
  timestamp: string;
}

/**
 * A parsed trajectory ready for rendering. Mirrors `TrajectoryData` from
 * hooks-tools.ts. The `endedAt` and `success` fields are optional because
 * trajectories that are still in-flight (no `trajectory-end` fired yet)
 * legitimately don't have them.
 */
export interface LoadedTrajectory {
  id: string;
  task: string;
  agent: string;
  steps: LoadedTrajectoryStep[];
  startedAt: string;
  endedAt?: string;
  success?: boolean;
}

/**
 * Filter / pagination options for {@link listTrajectories}.
 */
export interface ListOptions {
  /** Filter by `startedAt >= since`. Strings are coerced via `new Date()`. */
  since?: Date;
  /** Substring match on agent name (case-insensitive). */
  agent?: string;
  /** Maximum number to return. Applied AFTER sort. Default 50. */
  limit?: number;
}

// ============================================================================
// Internal types — the on-disk shape we read.
// ============================================================================

interface MemoryStoreEntry {
  key: string;
  value: unknown;
  metadata?: Record<string, unknown>;
  storedAt: string;
  accessCount: number;
  lastAccessed: string;
}

interface MemoryStore {
  entries: Record<string, MemoryStoreEntry>;
  version: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 50;
const MIN_PREFIX_LENGTH = 8;

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Resolve the on-disk path of the memory store using the canonical install
 * context. Centralised so tests can override via RUFLO_INSTALL_CONTEXT_JSON
 * without touching this module.
 */
function getStorePath(): string {
  const ctx = resolveInstallContext();
  return path.join(ctx.claudeRoot, '.claude-flow', 'memory', 'store.json');
}

/**
 * Read + parse store.json. Returns an empty store on any failure
 * (file-not-found, permission denied, malformed JSON). The single failure
 * is logged via `swallowError` so debug builds get a breadcrumb.
 */
function readStore(storePath: string): MemoryStore {
  if (!existsSync(storePath)) {
    return { entries: {}, version: '0.0.0' };
  }

  let raw: string;
  try {
    raw = readFileSync(storePath, 'utf-8');
  } catch (err) {
    swallowError('trace-loader.readFile', err, storePath);
    return { entries: {}, version: '0.0.0' };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'entries' in parsed &&
      typeof (parsed as { entries: unknown }).entries === 'object' &&
      (parsed as { entries: unknown }).entries !== null
    ) {
      return parsed as MemoryStore;
    }
    swallowError('trace-loader.shape', new Error('store.json missing .entries'), storePath);
    return { entries: {}, version: '0.0.0' };
  } catch (err) {
    swallowError('trace-loader.parse', err, storePath);
    return { entries: {}, version: '0.0.0' };
  }
}

/**
 * Same trajectory-detection predicate the hooks-tools intel-stats uses.
 * Treat any entry that mentions "trajectory" in its key OR carries
 * `metadata.type === 'trajectory'` as a candidate. Keeping the predicate
 * loose means historical entries written before the metadata-type
 * convention still surface.
 */
function isTrajectoryEntry(entry: MemoryStoreEntry): boolean {
  if (entry.key.includes('trajectory')) return true;
  const metaType = entry.metadata?.type;
  return typeof metaType === 'string' && metaType === 'trajectory';
}

/**
 * Coerce an unknown `entry.value` into a `LoadedTrajectory`. Returns null
 * when required fields are missing or wrong-typed — caller is expected
 * to skip null results.
 *
 * We accept missing `steps` as an empty array (in-flight trajectories may
 * legitimately have no steps yet). `endedAt` and `success` are optional
 * by spec.
 */
function coerceTrajectory(value: unknown): LoadedTrajectory | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;

  if (typeof v.id !== 'string' || v.id.length === 0) return null;
  if (typeof v.task !== 'string') return null;
  if (typeof v.agent !== 'string') return null;
  if (typeof v.startedAt !== 'string') return null;

  const rawSteps = Array.isArray(v.steps) ? v.steps : [];
  const steps: LoadedTrajectoryStep[] = [];
  for (const s of rawSteps) {
    if (!s || typeof s !== 'object') continue;
    const step = s as Record<string, unknown>;
    if (
      typeof step.action !== 'string' ||
      typeof step.result !== 'string' ||
      typeof step.timestamp !== 'string'
    ) {
      continue;
    }
    const quality = typeof step.quality === 'number' ? step.quality : 0.5;
    steps.push({
      action: step.action,
      result: step.result,
      quality,
      timestamp: step.timestamp,
    });
  }

  const trajectory: LoadedTrajectory = {
    id: v.id,
    task: v.task,
    agent: v.agent,
    steps,
    startedAt: v.startedAt,
  };
  if (typeof v.endedAt === 'string') trajectory.endedAt = v.endedAt;
  if (typeof v.success === 'boolean') trajectory.success = v.success;

  return trajectory;
}

/**
 * Walk every entry in the store, keep the trajectory-shaped ones, return
 * them as `LoadedTrajectory[]`. Malformed entries are skipped (logged
 * once each via `swallowError`) so a single bad entry can't poison the
 * whole list.
 */
function collectTrajectories(store: MemoryStore): LoadedTrajectory[] {
  const out: LoadedTrajectory[] = [];
  for (const entry of Object.values(store.entries)) {
    if (!entry || typeof entry !== 'object') continue;
    if (!isTrajectoryEntry(entry)) continue;

    const trajectory = coerceTrajectory(entry.value);
    if (trajectory === null) {
      swallowError(
        'trace-loader.coerce',
        new Error(`malformed trajectory entry: ${entry.key}`),
        entry.key,
      );
      continue;
    }
    out.push(trajectory);
  }
  return out;
}

/**
 * Compare-fn for `Array.prototype.sort`. Newest-first by `startedAt`.
 * Invalid dates fall through to lexicographic compare which is still
 * deterministic — we never throw from the comparator.
 */
function byStartedAtDesc(a: LoadedTrajectory, b: LoadedTrajectory): number {
  const ta = Date.parse(a.startedAt);
  const tb = Date.parse(b.startedAt);
  if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta;
  // Fallback — at least one date is unparseable; lexicographic on the raw
  // string keeps sort total-order without crashing.
  if (a.startedAt === b.startedAt) return 0;
  return a.startedAt < b.startedAt ? 1 : -1;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * List recent trajectories, newest first by `startedAt`.
 *
 * Reads `~/.claude/.claude-flow/memory/store.json` (resolved via
 * `resolveInstallContext`). Returns `[]` if the store doesn't exist.
 *
 * @param opts.since — keep only trajectories with `startedAt >= since`
 * @param opts.agent — case-insensitive substring match on the agent name
 * @param opts.limit — applied AFTER sort. Defaults to 50.
 */
export async function listTrajectories(opts?: ListOptions): Promise<LoadedTrajectory[]> {
  const storePath = getStorePath();
  const store = readStore(storePath);

  let trajectories = collectTrajectories(store);

  if (opts?.since instanceof Date && !Number.isNaN(opts.since.getTime())) {
    const sinceMs = opts.since.getTime();
    trajectories = trajectories.filter((t) => {
      const ts = Date.parse(t.startedAt);
      // If the trajectory's startedAt is unparseable, drop it — we can't
      // honour a since-filter without a real timestamp.
      if (!Number.isFinite(ts)) return false;
      return ts >= sinceMs;
    });
  }

  if (typeof opts?.agent === 'string' && opts.agent.length > 0) {
    const needle = opts.agent.toLowerCase();
    trajectories = trajectories.filter((t) => t.agent.toLowerCase().includes(needle));
  }

  trajectories.sort(byStartedAtDesc);

  const limit =
    typeof opts?.limit === 'number' && Number.isFinite(opts.limit) && opts.limit >= 0
      ? Math.floor(opts.limit)
      : DEFAULT_LIMIT;

  return trajectories.slice(0, limit);
}

/**
 * Load a single trajectory by id. Accepts:
 *   - full id (exact match — always tried first)
 *   - prefix (≥ 8 chars, must uniquely identify one trajectory)
 *   - 'latest' shorthand → the newest trajectory by `startedAt`
 *
 * Returns `null` if not found, prefix-too-short, ambiguous prefix, or the
 * store is missing/malformed. Ambiguous-prefix is logged via
 * `swallowError('trace-loader.ambiguous-prefix', ...)` so debug builds
 * can see why a lookup failed.
 */
export async function loadTrajectory(sessionId: string): Promise<LoadedTrajectory | null> {
  if (typeof sessionId !== 'string' || sessionId.length === 0) return null;

  const storePath = getStorePath();
  const store = readStore(storePath);
  const trajectories = collectTrajectories(store);

  if (trajectories.length === 0) return null;

  // 'latest' shorthand — newest by startedAt
  if (sessionId === 'latest') {
    trajectories.sort(byStartedAtDesc);
    return trajectories[0] ?? null;
  }

  // Always try exact match first — even on short ids, exact wins.
  const exact = trajectories.find((t) => t.id === sessionId);
  if (exact) return exact;

  // Prefix match only when ≥ MIN_PREFIX_LENGTH chars.
  if (sessionId.length < MIN_PREFIX_LENGTH) return null;

  const matches = trajectories.filter((t) => t.id.startsWith(sessionId));
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Ambiguous — refuse rather than guess.
  swallowError(
    'trace-loader.ambiguous-prefix',
    new Error(`prefix '${sessionId}' matches ${matches.length} trajectories`),
    matches.map((m) => m.id).join(','),
  );
  return null;
}
