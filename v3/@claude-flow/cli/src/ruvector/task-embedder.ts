/**
 * task-embedder.ts — Shared lazy task embedder + LRU cache (ADR-149 iter 9).
 *
 * The cost-optimal neural router (ADR-149) fires only when `route(task, embedding)`
 * is called with a real embedding. Two call sites in the dispatcher chain need
 * embeddings: `agent-tools.ts` (initial routing) and `agent-execute-core.ts`
 * (the fallback chain on 429/5xx). Before this module they each loaded their
 * own @xenova/transformers MiniLM pipeline and recomputed embeddings on every
 * call — including for repeated prompts.
 *
 * This module:
 *   1. Loads the pipeline once per process (`loadTaskEmbedder`).
 *   2. Caches embeddings per task text via an LRU of configurable size
 *      (default 500 entries ≈ 1.5 MB at 384-dim).
 *   3. Hashes by FNV-1a-32 + length to keep the key compact and collision-safe
 *      for typical prompt sizes.
 *   4. Returns `undefined` on any failure so callers gracefully fall back to
 *      the heuristic+bandit path.
 *
 * @module task-embedder
 */

// ============================================================================
// FNV-1a-32 hash (matches scripts/gen-seed-corpus.mjs + router-trajectory.ts)
// ============================================================================

function fnv1a32(s: string): string {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Compact cache key — hash + length so distinct prompts of similar shape collide rarely. */
function cacheKey(task: string): string {
  return `${fnv1a32(task)}:${task.length}`;
}

// ============================================================================
// Lazy pipeline load (shared across all callers in the process)
// ============================================================================

type EmbedFn = (text: string) => Promise<number[]>;

let _embedderPromise: Promise<EmbedFn | null> | null = null;

function loadEmbedder(): Promise<EmbedFn | null> {
  if (_embedderPromise !== null) return _embedderPromise;
  _embedderPromise = (async () => {
    try {
      const specifier = '@xenova/transformers';
      const mod = await import(/* @vite-ignore */ specifier).catch(() => null);
      if (!mod || typeof mod.pipeline !== 'function') return null;
      const extractor = await mod.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
      return async (text: string): Promise<number[]> => {
        const out = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(out.data as Float32Array);
      };
    } catch {
      return null;
    }
  })();
  return _embedderPromise;
}

// ============================================================================
// LRU cache — Map preserves insertion order, so delete+set on hit = O(1) LRU
// ============================================================================

const MAX_SIZE = (() => {
  const v = parseInt(process.env.CLAUDE_FLOW_ROUTER_EMBED_CACHE_SIZE ?? '500', 10);
  return Number.isFinite(v) && v >= 0 ? v : 500;
})();

const _cache: Map<string, number[]> = new Map();
let _hits = 0;
let _misses = 0;

function lruGet(key: string): number[] | undefined {
  const hit = _cache.get(key);
  if (hit === undefined) return undefined;
  // Refresh recency: re-insert at the end.
  _cache.delete(key);
  _cache.set(key, hit);
  return hit;
}

function lruSet(key: string, value: number[]): void {
  if (MAX_SIZE === 0) return;
  if (_cache.has(key)) _cache.delete(key);
  _cache.set(key, value);
  while (_cache.size > MAX_SIZE) {
    const oldest = _cache.keys().next().value;
    if (oldest === undefined) break;
    _cache.delete(oldest);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Compute (or fetch from cache) the 384-dim MiniLM embedding for `task`.
 * Returns `undefined` on any failure (missing @xenova/transformers, ONNX
 * runtime error, etc.) so callers can gracefully fall back to the
 * heuristic+bandit path. Best-effort and never throws.
 *
 * Cache hit-rate accumulates across the process lifetime and is observable
 * via `embedderStats()` for diagnostics.
 */
export async function embedTaskWithCache(task: string): Promise<number[] | undefined> {
  if (typeof task !== 'string' || task.length === 0) return undefined;
  const key = cacheKey(task);
  const cached = lruGet(key);
  if (cached !== undefined) {
    _hits++;
    return cached;
  }
  try {
    const embed = await loadEmbedder();
    if (!embed) return undefined;
    const v = await embed(task);
    lruSet(key, v);
    _misses++;
    return v;
  } catch {
    return undefined;
  }
}

/** Diagnostic surface — hit/miss counters + cache state. */
export function embedderStats(): { size: number; maxSize: number; hits: number; misses: number; hitRate: number } {
  const total = _hits + _misses;
  return {
    size: _cache.size,
    maxSize: MAX_SIZE,
    hits: _hits,
    misses: _misses,
    hitRate: total > 0 ? _hits / total : 0,
  };
}

/** Test seam — clear LRU + counters so tests get a fresh baseline. */
export function __resetTaskEmbedderForTests(): void {
  _cache.clear();
  _hits = 0;
  _misses = 0;
  _embedderPromise = null;
}
