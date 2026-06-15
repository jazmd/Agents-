/**
 * neural-router.ts — Optional cost-optimal neural routing path (ADR-148).
 *
 * Wires `@metaharness/router` (pure-TS k-NN/KRR + optional FastGRNN via
 * `@ruvector/tiny-dancer`) into the model-routing path as a graceful, gated
 * addition. The shipped heuristic + Thompson bandit stays as the default;
 * this module only contributes a decision when:
 *
 *   1. `CLAUDE_FLOW_ROUTER_NEURAL=1` is set
 *   2. Either a trained artifact path resolves (`CLAUDE_FLOW_ROUTER_MODEL_PATH`)
 *      OR the bundled seed corpus loads
 *   3. The dynamic `import('@metaharness/router')` succeeds
 *
 * Otherwise `tryCostOptimalRoute(...)` returns `null` and the caller falls
 * back to the bandit path with `routedBy: 'bandit-fallback'`.
 *
 * Observability — `routedBy` is returned on every result and must never be
 * inferred from "did the import resolve?" (ADR-074, ADR-086). It carries
 * exactly one of:
 *   - 'metaharness-knn'  pure-TS k-NN, no training (uses raw seed examples)
 *   - 'metaharness-krr'  pure-TS KRR with LOO-CV λ (TrainedRouter JSON)
 *   - 'fastgrnn'         native FastGRNN via tiny-dancer (NativeRouter)
 *
 * Performance — module-level caches resolve the backend, seed corpus and
 * router once per process. Hot path is a single `route(embedding)` call.
 *
 * @module neural-router
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve as resolvePath } from 'node:path';

import type { ClaudeModel } from './model-router.js';

// ============================================================================
// Public API
// ============================================================================

/** Backend identifier carried on every result (never inferred). */
export type NeuralRoutedBy = 'metaharness-knn' | 'metaharness-krr' | 'fastgrnn';

/** Cost-optimal route decision. */
export interface NeuralRouteResult {
  /** Chosen Claude tier label (back-compat). Derived from `modelId`. */
  model: ClaudeModel;
  /**
   * Concrete picked model id — ADR-149. May be an Anthropic SDK id or an
   * OpenRouter slug. Always a string; the closest tier label is in `model`
   * for back-compat with consumers that still expect ClaudeModel.
   */
  modelId: string;
  /** Predicted quality the chosen candidate is expected to achieve (0..1). */
  predictedQuality: number;
  /** Did the predicted quality clear the configured `qualityBar`? */
  metBar: boolean;
  /** Per-candidate predicted qualities, ordered cheapest-first. */
  alternatives: Array<{ model: ClaudeModel; modelId: string; predictedQuality: number; costPerMTok: number }>;
  /** Backend that produced the decision. */
  routedBy: NeuralRoutedBy;
  /** Inference latency in microseconds. */
  inferenceTimeUs: number;
}

/** Module-level configuration. Read once at first call from env. */
interface NeuralRouterConfig {
  enabled: boolean;
  modelPath?: string;
  /** Bundled fallback artifact (KRR JSON). Used when `modelPath` is unset. */
  bundledKrrPath: string;
  qualityBar: number;
  seedCorpusPath: string;
  /** k for k-NN backend (default 5). */
  k: number;
  /**
   * ADR-149 iter 12 — optional latency budget in ms. When > 0, candidates
   * whose measured p50 latency exceeds the budget are filtered OUT before
   * the cost-optimal selector runs. Default 0 (unbounded, cost-only).
   * For interactive flows that need sub-second responses, set 1000.
   */
  latencyBudgetMs: number;
}

// ============================================================================
// Internal state (lazy, single-init)
// ============================================================================

interface ResolvedBackend {
  /** True if `@metaharness/router` was importable. */
  available: boolean;
  /** Initialised router, or null when no corpus / artifact was loadable. */
  router: { route: (e: number[]) => { id: string; predictedQuality: number; costPerMTok: number; metBar: boolean }; predictAll: (e: number[]) => Array<{ id: string; predictedQuality: number; costPerMTok: number }> } | null;
  /**
   * For the FastGRNN/native path: the loaded `NativeRouter` instance and the
   * pre-built per-candidate embeddings. Loaded ONCE at resolve time and
   * reused on every route() call — avoids the load/build overhead per call.
   */
  native?: {
    router: { route: (e: number[], cands: Array<{ id: string; embedding: number[]; costPerMTok?: number; successRate?: number }>) => Promise<{ id: string; confidence: number; uncertainty: number; useLightweight: boolean; costPerMTok?: number; inferenceTimeUs: number }> };
    candidates: Array<{ id: string; embedding: number[]; costPerMTok: number }>;
  };
  /** Which backend the router represents. */
  routedBy: NeuralRoutedBy | null;
  /** Reason string for diagnostics. */
  reason: string;
}

let _config: NeuralRouterConfig | null = null;
let _backend: ResolvedBackend | null = null;
let _initPromise: Promise<ResolvedBackend> | null = null;

const PRICES: Record<ClaudeModel, number> = {
  haiku: 1, sonnet: 3, opus: 15, inherit: 3,
};

// ADR-149 iter 12 — lazy load measured per-model latency (mean ms) from the
// most-recent FULL seed-corpus measurement file. Cached per-process.
// Returns an empty map if no measurement is available.
let _latencyMapPromise: Promise<Record<string, number>> | null = null;
function loadLatencyMap(): Promise<Record<string, number>> {
  if (_latencyMapPromise !== null) return _latencyMapPromise;
  _latencyMapPromise = (async () => {
    const result: Record<string, number> = {};
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const benchDir = path.resolve(process.cwd(), 'docs', 'benchmarks', 'runs');
      if (!fs.existsSync(benchDir)) return result;
      const files = fs.readdirSync(benchDir)
        .filter(f => f.startsWith('seed-corpus-') && f.endsWith('.json'))
        .sort().reverse();
      // Prefer a file with all three tiers populated (full measurement run);
      // fall back to newest if none qualify.
      let chosen: { perCandidate?: Array<{ id: string; latency_mean_ms?: number | null; cheap_avg_score?: number | null; mid_avg_score?: number | null; strong_avg_score?: number | null }> } | null = null;
      for (const f of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(benchDir, f), 'utf8'));
          const sample = data.perCandidate?.[0];
          if (sample && sample.cheap_avg_score != null && sample.mid_avg_score != null && sample.strong_avg_score != null) {
            chosen = data; break;
          }
          if (!chosen) chosen = data;
        } catch { /* skip */ }
      }
      for (const r of chosen?.perCandidate ?? []) {
        if (typeof r.latency_mean_ms === 'number' && r.latency_mean_ms > 0) {
          result[r.id] = r.latency_mean_ms;
        }
      }
    } catch { /* best-effort */ }
    return result;
  })();
  return _latencyMapPromise;
}

/**
 * ADR-149 — map a concrete OpenRouter / Anthropic model id back to the
 * closest ClaudeModel tier label for back-compat. Used to populate the
 * `model: ClaudeModel` field when the actual picked `modelId` is e.g.
 * `openai/gpt-4.1` or `inclusionai/ling-2.6-flash`.
 *
 * Mapping rule: substring-based. Anthropic ids carry the tier name;
 * other providers map to the tier whose role they play (cheap, mid, strong).
 * The map is intentionally non-exhaustive — unknown ids default to 'sonnet'
 * (the safest middle ground for an unrecognised candidate).
 */
function tierLabelForModelId(modelId: string): ClaudeModel {
  const id = modelId.toLowerCase();
  if (id.includes('haiku') || id.includes('ling-') || id.includes('flash-lite')
    || id.includes('nemotron-nano') || id.includes('ministral')
    || id.includes('llama-3.2-3b') || id.includes('llama-3.1-8b')) {
    return 'haiku';
  }
  if (id.includes('opus')) return 'opus';
  // Mid-tier: sonnet, gpt-4.1, gemini-flash, llama-70b, nemotron-super, etc.
  return 'sonnet';
}

// ============================================================================
// Config resolution
// ============================================================================

function getConfig(): NeuralRouterConfig {
  if (_config !== null) return _config;
  // Default seed-corpus path: bundled with the package. We resolve relative to
  // this file's location so it works both in src (tsc dev) and in the dist.
  // dist layout:  dist/src/ruvector/neural-router.js → assets at dist/assets/...
  // src layout:   src/ruvector/neural-router.ts     → assets at assets/...
  // We probe both candidate locations.
  let assetsDir: string;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const candidates = [
      resolvePath(here, '..', '..', 'assets', 'model-router'),       // src/ruvector → src/assets/...
      resolvePath(here, '..', '..', '..', 'assets', 'model-router'), // dist/src/ruvector → dist/assets/...
      resolvePath(here, '..', '..', '..', '..', 'assets', 'model-router'), // safety net
    ];
    assetsDir = candidates.find(existsSync) ?? candidates[0];
  } catch {
    assetsDir = resolvePath(process.cwd(), 'v3', '@claude-flow', 'cli', 'assets', 'model-router');
  }

  _config = {
    enabled: process.env.CLAUDE_FLOW_ROUTER_NEURAL === '1',
    modelPath: process.env.CLAUDE_FLOW_ROUTER_MODEL_PATH || undefined,
    bundledKrrPath: join(assetsDir, 'seed-router.krr.json'),
    // ADR-149 v2 — measured against the richer code-context corpus
    // (gen-seed-corpus-v2.mjs). On that corpus, cheap models (Ling 2.6
    // Flash) deliver 75-93% on cheap/mid tasks and ~54% on strong tasks;
    // expensive models deliver 56-89% across tiers. Bar=0.50 lets cheap
    // models win cheap+mid (cost-optimal) but escalates to capable models
    // on strong queries where cheap predictions fall below the bar.
    // Override per-installation; 0.25 = always-cheapest, 0.70 = quality-strict.
    qualityBar: parseFloat(process.env.CLAUDE_FLOW_ROUTER_QUALITY_BAR ?? '0.50') || 0.50,
    seedCorpusPath: process.env.CLAUDE_FLOW_ROUTER_SEED_CORPUS
      ?? join(assetsDir, 'seed-rows.json'),
    k: parseInt(process.env.CLAUDE_FLOW_ROUTER_KNN_K ?? '5', 10) || 5,
    latencyBudgetMs: Math.max(0, parseInt(process.env.CLAUDE_FLOW_ROUTER_LATENCY_BUDGET_MS ?? '0', 10) || 0),
  };
  return _config;
}

// ============================================================================
// Backend resolution (single-init, lazy)
// ============================================================================

/** DRACO row — the shape both pure-TS and FastGRNN backends consume. */
interface DracoRow {
  embedding: number[];
  scores: Record<string, number>;
}

function loadSeedCorpus(path: string): DracoRow[] | null {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    // Light-touch validation: each row must have a numeric-array embedding and
    // a non-empty scores map. We do not coerce types — bad data should be
    // visible as a config bug, not silently routed around.
    for (const row of data) {
      if (!row || !Array.isArray(row.embedding) || row.embedding.length === 0) return null;
      if (!row.scores || typeof row.scores !== 'object') return null;
    }
    return data as DracoRow[];
  } catch {
    return null;
  }
}

async function resolveBackend(cfg: NeuralRouterConfig): Promise<ResolvedBackend> {
  // 1. Optional dep present?
  let mh: typeof import('@metaharness/router');
  try {
    mh = await import('@metaharness/router');
  } catch {
    return { available: false, router: null, routedBy: null, reason: '@metaharness/router not installed' };
  }

  // 2. If a trained-model path is set AND tiny-dancer is loadable, prefer FastGRNN.
  //    Load the NativeRouter ONCE here; reuse on every route() call.
  if (cfg.modelPath && existsSync(cfg.modelPath)) {
    const backend = await mh.resolveRouterBackend('auto');
    if (backend === 'native') {
      try {
        const nativeRouter = await mh.NativeRouter.load({ modelPath: cfg.modelPath });
        // Build per-candidate embeddings once. NativeRouter requires non-empty
        // candidate embeddings; we use a one-hot signature so the three tiers
        // are distinct in the FastGRNN's feature engineering. Dim is probed
        // from the seed corpus or falls back to 384 (MiniLM default).
        const seed = loadSeedCorpus(cfg.seedCorpusPath);
        const dim = seed?.[0]?.embedding.length ?? 384;
        const candidates = (['haiku', 'sonnet', 'opus'] as const).map((id, i) => {
          const v = new Array(dim).fill(0);
          v[i % dim] = 1;
          return { id, embedding: v, costPerMTok: PRICES[id] };
        });
        return {
          available: true,
          router: null, // The native path uses the `native` field below, not `router`.
          native: { router: nativeRouter, candidates },
          routedBy: 'fastgrnn',
          reason: `native router loaded from ${cfg.modelPath}`,
        };
      } catch (e) {
        // Fall through to pure-TS paths
      }
    }
  }

  // 3. Trained KRR JSON artifact path?
  if (cfg.modelPath && existsSync(cfg.modelPath) && cfg.modelPath.endsWith('.json')) {
    try {
      const json = JSON.parse(readFileSync(cfg.modelPath, 'utf8'));
      const trained = mh.TrainedRouter.fromJSON(json);
      // Pre-extract candidate ids+costs for predictAll
      const cands = json.candidates.map((c: { id: string; costPerMTok: number }) => ({ id: c.id, costPerMTok: c.costPerMTok }));
      return {
        available: true,
        router: {
          route: (e: number[]) => {
            const r = trained.route(e);
            return { id: r.id, predictedQuality: r.predictedQuality, costPerMTok: r.costPerMTok, metBar: r.metBar };
          },
          predictAll: (e: number[]) => cands.map((c: { id: string; costPerMTok: number }) => ({
            id: c.id, predictedQuality: trained.predict(c.id, e), costPerMTok: c.costPerMTok,
          })).sort((a: { costPerMTok: number }, b: { costPerMTok: number }) => a.costPerMTok - b.costPerMTok),
        },
        routedBy: 'metaharness-krr',
        reason: `KRR artifact loaded from ${cfg.modelPath}`,
      };
    } catch {
      // Fall through to k-NN
    }
  }

  // 3.5. No user artifact → try the bundled pre-trained KRR (~96kB, ~0.020 ms/route).
  if (existsSync(cfg.bundledKrrPath)) {
    try {
      const json = JSON.parse(readFileSync(cfg.bundledKrrPath, 'utf8'));
      const trained = mh.TrainedRouter.fromJSON(json);
      const cands = json.candidates.map((c: { id: string; costPerMTok: number }) => ({ id: c.id, costPerMTok: c.costPerMTok }));
      return {
        available: true,
        router: {
          route: (e: number[]) => {
            const r = trained.route(e);
            return { id: r.id, predictedQuality: r.predictedQuality, costPerMTok: r.costPerMTok, metBar: r.metBar };
          },
          predictAll: (e: number[]) => cands.map((c: { id: string; costPerMTok: number }) => ({
            id: c.id, predictedQuality: trained.predict(c.id, e), costPerMTok: c.costPerMTok,
          })).sort((a: { costPerMTok: number }, b: { costPerMTok: number }) => a.costPerMTok - b.costPerMTok),
        },
        routedBy: 'metaharness-krr',
        reason: `bundled KRR artifact loaded from ${cfg.bundledKrrPath}`,
      };
    } catch {
      // Fall through to k-NN
    }
  }

  // 4. Pure-TS k-NN over the bundled seed corpus.
  const seed = loadSeedCorpus(cfg.seedCorpusPath);
  if (!seed || seed.length === 0) {
    return { available: true, router: null, routedBy: null, reason: `seed corpus missing or invalid at ${cfg.seedCorpusPath}` };
  }
  const router = mh.Router.fromExamples(seed, PRICES, { qualityBar: cfg.qualityBar, k: cfg.k });
  // Pre-build per-candidate views ONCE so predictAll() doesn't re-allocate
  // O(seed.length) objects per call. Sort by cost so the result is already in
  // cheapest-first order.
  const candIds = Object.keys(PRICES).filter(id => id !== 'inherit');
  const candidateViews = candIds
    .map(id => ({
      id,
      costPerMTok: PRICES[id as ClaudeModel],
      examples: seed.map(r => ({ embedding: r.embedding, quality: r.scores[id] ?? 0 })),
    }))
    .sort((a, b) => a.costPerMTok - b.costPerMTok);
  return {
    available: true,
    router: {
      route: (e: number[]) => {
        const r = router.route(e);
        return { id: r.id, predictedQuality: r.predictedQuality, costPerMTok: r.costPerMTok, metBar: r.metBar };
      },
      predictAll: (e: number[]) => candidateViews.map(c => ({
        id: c.id, predictedQuality: router.predict(c, e), costPerMTok: c.costPerMTok,
      })),
    },
    routedBy: 'metaharness-knn',
    reason: `k-NN over ${seed.length} seed rows`,
  };
}

async function getBackend(): Promise<ResolvedBackend> {
  if (_backend !== null) return _backend;
  if (_initPromise !== null) return _initPromise;
  const cfg = getConfig();
  _initPromise = resolveBackend(cfg).then(b => { _backend = b; return b; });
  return _initPromise;
}

// ============================================================================
// Public function
// ============================================================================

/**
 * Cost-optimal route via the optional neural backend. Returns `null` when the
 * neural path is disabled (gate closed), unavailable (deps missing), or
 * unconfigured (no corpus / artifact). Callers must fall back to the
 * heuristic+bandit path on null and tag the result `routedBy: 'bandit-fallback'`.
 *
 * @param embedding 384-dim (or matching corpus dim) query embedding
 * @returns NeuralRouteResult on success, or `null` when the path is inactive
 */
export async function tryCostOptimalRoute(embedding: number[]): Promise<NeuralRouteResult | null> {
  const cfg = getConfig();
  if (!cfg.enabled) return null;
  if (!Array.isArray(embedding) || embedding.length === 0) return null;

  const backend = await getBackend();
  if (!backend.available || backend.routedBy === null) return null;

  const t0 = Number(process.hrtime.bigint() / 1000n); // microseconds
  try {
    if (backend.routedBy === 'fastgrnn') {
      // Native path: NativeRouter was loaded once at resolveBackend time;
      // candidates were precomputed. Hot path is one .route() call.
      if (!backend.native) return null;
      const res = await backend.native.router.route(embedding, backend.native.candidates);
      const modelId = res.id;
      const t1 = Number(process.hrtime.bigint() / 1000n);
      return {
        model: tierLabelForModelId(modelId),
        modelId,
        predictedQuality: 1 - res.uncertainty, // FastGRNN reports uncertainty, not quality directly
        metBar: !res.useLightweight && res.confidence >= cfg.qualityBar,
        alternatives: backend.native.candidates.map(c => ({
          model: tierLabelForModelId(c.id),
          modelId: c.id,
          predictedQuality: c.id === modelId ? res.confidence : 0,
          costPerMTok: c.costPerMTok,
        })),
        routedBy: 'fastgrnn',
        inferenceTimeUs: t1 - t0,
      };
    }

    // Pure-TS paths (k-NN or KRR) — ADR-149: ids are arbitrary strings,
    // not ClaudeModel tier names. `tierLabelForModelId` derives the
    // back-compat tier; `modelId` carries the concrete pick.
    if (!backend.router) return null;
    const all = backend.router.predictAll(embedding);

    // ADR-149 iter 12 — latency-aware filtering. When CLAUDE_FLOW_ROUTER_
    // LATENCY_BUDGET_MS is set, drop candidates whose measured latency
    // exceeds the budget BEFORE the cost-optimal pick. The unfiltered
    // alternatives stay on the result for observability — only the chosen
    // `modelId` is constrained.
    let main = backend.router.route(embedding);
    if (cfg.latencyBudgetMs > 0) {
      const latency = await loadLatencyMap();
      const eligible = all.filter(a => {
        const lat = latency[a.id];
        return lat === undefined || lat <= cfg.latencyBudgetMs;
      });
      if (eligible.length > 0) {
        // Re-pick cheapest-clearing-bar among eligible
        const clearing = eligible.filter(a => a.predictedQuality >= cfg.qualityBar)
          .sort((a, b) => a.costPerMTok - b.costPerMTok);
        const pick = clearing[0] ?? [...eligible].sort((a, b) => b.predictedQuality - a.predictedQuality)[0];
        main = { id: pick.id, predictedQuality: pick.predictedQuality, costPerMTok: pick.costPerMTok, metBar: pick.predictedQuality >= cfg.qualityBar };
      }
      // else: every candidate exceeds the budget → fall back to the original pick
      //   (better to return a slow answer than no answer)
    }

    const t1 = Number(process.hrtime.bigint() / 1000n);
    return {
      model: tierLabelForModelId(main.id),
      modelId: main.id,
      predictedQuality: main.predictedQuality,
      metBar: main.metBar,
      alternatives: all.map(a => ({
        model: tierLabelForModelId(a.id),
        modelId: a.id,
        predictedQuality: a.predictedQuality,
        costPerMTok: a.costPerMTok,
      })),
      routedBy: backend.routedBy,
      inferenceTimeUs: t1 - t0,
    };
  } catch {
    // Any runtime failure is silently swallowed → caller's bandit-fallback engages.
    return null;
  }
}

/**
 * Batch counterpart to `tryCostOptimalRoute`. Routes a list of embeddings
 * in one go, sharing backend resolution + (for the pure-TS paths)
 * candidate-view setup across the batch. The native FastGRNN path still
 * dispatches per-call (xenova's worker doesn't support array inputs for
 * tiny-dancer's Router.route).
 *
 * Order of the output array matches the input order. Each slot is either
 * a NeuralRouteResult or null (gate closed, backend unavailable, etc. —
 * mirrors the single-call contract).
 *
 * For harness-style callers (batch evals, GAIA runs, parallel agent
 * dispatch) this amortizes backend init across N queries — first-call
 * cold-load (~10 ms) becomes a fixed cost regardless of batch size.
 */
export async function tryCostOptimalRouteBatch(embeddings: number[][]): Promise<Array<NeuralRouteResult | null>> {
  const out: Array<NeuralRouteResult | null> = new Array(embeddings.length).fill(null);
  const cfg = getConfig();
  if (!cfg.enabled) return out;
  const backend = await getBackend();
  if (!backend.available || backend.routedBy === null) return out;

  // FastGRNN path: per-call native dispatch. The native router doesn't
  // expose a batch entry point. We still share the loaded NativeRouter
  // instance + candidate embeddings, which is most of the per-call cost.
  if (backend.routedBy === 'fastgrnn') {
    if (!backend.native) return out;
    const native = backend.native;
    const tasks = embeddings.map(async (e, i) => {
      if (!Array.isArray(e) || e.length === 0) return null;
      try {
        const t0 = Number(process.hrtime.bigint() / 1000n);
        const res = await native.router.route(e, native.candidates);
        const modelId = res.id;
        const t1 = Number(process.hrtime.bigint() / 1000n);
        const result: NeuralRouteResult = {
          model: tierLabelForModelId(modelId),
          modelId,
          predictedQuality: 1 - res.uncertainty,
          metBar: !res.useLightweight && res.confidence >= cfg.qualityBar,
          alternatives: native.candidates.map(c => ({
            model: tierLabelForModelId(c.id),
            modelId: c.id,
            predictedQuality: c.id === modelId ? res.confidence : 0,
            costPerMTok: c.costPerMTok,
          })),
          routedBy: 'fastgrnn',
          inferenceTimeUs: t1 - t0,
        };
        out[i] = result;
      } catch {
        out[i] = null;
      }
      return null;
    });
    await Promise.all(tasks);
    return out;
  }

  // Pure-TS path (k-NN or KRR): same shared router + candidate views,
  // tight loop. predictAll is cheap (already-pre-built per-candidate
  // examples) so we avoid re-allocating per call.
  if (!backend.router) return out;
  for (let i = 0; i < embeddings.length; i++) {
    const e = embeddings[i];
    if (!Array.isArray(e) || e.length === 0) { out[i] = null; continue; }
    try {
      const t0 = Number(process.hrtime.bigint() / 1000n);
      const main = backend.router.route(e);
      const all = backend.router.predictAll(e);
      const t1 = Number(process.hrtime.bigint() / 1000n);
      out[i] = {
        model: tierLabelForModelId(main.id),
        modelId: main.id,
        predictedQuality: main.predictedQuality,
        metBar: main.metBar,
        alternatives: all.map(a => ({
          model: tierLabelForModelId(a.id),
          modelId: a.id,
          predictedQuality: a.predictedQuality,
          costPerMTok: a.costPerMTok,
        })),
        routedBy: backend.routedBy,
        inferenceTimeUs: t1 - t0,
      };
    } catch {
      out[i] = null;
    }
  }
  return out;
}

/**
 * Diagnostic surface — returns the active backend without performing a route.
 * Used by the bench and by `claude-flow neural router status` (future CLI).
 */
export async function neuralRouterStatus(): Promise<{ enabled: boolean; available: boolean; routedBy: NeuralRoutedBy | null; reason: string; config: NeuralRouterConfig }> {
  const cfg = getConfig();
  if (!cfg.enabled) return { enabled: false, available: false, routedBy: null, reason: 'CLAUDE_FLOW_ROUTER_NEURAL!=1', config: cfg };
  const backend = await getBackend();
  return { enabled: true, available: backend.available, routedBy: backend.routedBy, reason: backend.reason, config: cfg };
}

/**
 * ADR-149 iter 7 — fallback selector for retry-on-failure. Returns the
 * cheapest candidate predicted to clear the quality bar (or the best-
 * predicted if none do) that is NOT in `excludeModelIds`. Used by
 * `executeAgentTask` to retry with a different model after a 429/5xx.
 *
 * Returns `null` when:
 *   - the gate is closed (mirrors tryCostOptimalRoute)
 *   - the embedding is missing or empty
 *   - the backend isn't loadable
 *   - every candidate is excluded (all retries exhausted)
 *
 * Selection is per-candidate via predictAll, then filter by exclude,
 * then cheapest-clearing-bar (falling back to best-predicted).
 */
export async function nextCostOptimalAlternative(
  embedding: number[],
  excludeModelIds: Iterable<string>
): Promise<NeuralRouteResult | null> {
  const cfg = getConfig();
  if (!cfg.enabled) return null;
  if (!Array.isArray(embedding) || embedding.length === 0) return null;
  const backend = await getBackend();
  if (!backend.available || backend.router === null || backend.routedBy === null) return null;

  const exclude = new Set<string>(excludeModelIds);
  const t0 = Number(process.hrtime.bigint() / 1000n);

  // Pure-TS path only — fallback retries are too rare to be worth threading
  // through the FastGRNN candidate-embedding rebuild dance.
  try {
    const all = backend.router.predictAll(embedding);
    const remaining = all.filter(a => !exclude.has(a.id));
    if (remaining.length === 0) return null;

    // Cheapest predicted to clear qualityBar, else best-predicted among
    // remaining. Mirrors @metaharness/router's qualityBar semantics.
    const clearing = remaining.filter(a => a.predictedQuality >= cfg.qualityBar)
      .sort((a, b) => a.costPerMTok - b.costPerMTok);
    const pick = clearing[0] ?? [...remaining].sort((a, b) => b.predictedQuality - a.predictedQuality)[0];
    const t1 = Number(process.hrtime.bigint() / 1000n);

    return {
      model: tierLabelForModelId(pick.id),
      modelId: pick.id,
      predictedQuality: pick.predictedQuality,
      metBar: pick.predictedQuality >= cfg.qualityBar,
      alternatives: remaining.map(a => ({
        model: tierLabelForModelId(a.id),
        modelId: a.id,
        predictedQuality: a.predictedQuality,
        costPerMTok: a.costPerMTok,
      })),
      routedBy: backend.routedBy,
      inferenceTimeUs: t1 - t0,
    };
  } catch {
    return null;
  }
}

/**
 * Test seam — reset module-level caches so unit tests can simulate cold init.
 * Not exported from the package's barrel.
 */
export function __resetNeuralRouterForTests(): void {
  _config = null;
  _backend = null;
  _initPromise = null;
  _latencyMapPromise = null;
}
