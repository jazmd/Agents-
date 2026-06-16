/**
 * Cost-optimal neural routing seam (#2334 Phase 1).
 *
 * Wires `@ruvector/tiny-dancer`'s productized router, `@metaharness/router`, into
 * the model router as an OPT-IN advisor. Default behaviour is unchanged: this
 * module returns `null` (and the existing heuristic + Thompson bandit decides)
 * unless BOTH `CLAUDE_FLOW_ROUTER_NEURAL=1` is set AND a routing artifact resolves
 * at `CLAUDE_FLOW_ROUTER_MODEL_PATH`.
 *
 * Honesty (ADR-074 / ADR-086): `routedBy` is DERIVED from what actually happened,
 * never assumed — a recommendation is only ever tagged `metaharness-knn` /
 * `metaharness-krr` when that backend literally produced it. Any failure (gate
 * off, no artifact, dep absent, load error, unknown model) collapses to `null`,
 * which the caller reports as `bandit-fallback`. Nothing is fabricated.
 *
 * Phase-1 uses only `@metaharness/router`'s dependency-free pure-TS backends
 * (k-NN over example rows, or a serialized KRR `TrainedRouter`). The native
 * FastGRNN accelerator (`@ruvector/tiny-dancer`, `routedBy:'fastgrnn'`) is
 * RESERVED in the union below for Phase 2 — kept now so adding it later is not a
 * breaking change. See the seam ADR.
 *
 * @module neural-router
 */

import { existsSync, readFileSync } from 'node:fs';

/** Observable provenance of a routing decision. Derived, never assumed. */
export type RoutedBy =
  | 'metaharness-knn'   // pure-TS k-NN over example rows
  | 'metaharness-krr'   // serialized KRR TrainedRouter artifact
  | 'fastgrnn'          // RESERVED (Phase 2): native tiny-dancer FastGRNN
  | 'bandit-fallback'   // neural gated on but unavailable/declined → bandit decided
  | 'heuristic';        // neural gate off → default shipped path

export interface NeuralRecommendation {
  /** The recommended model id (validated against the caller's known tiers). */
  model: string;
  predictedQuality: number;
  metBar: boolean;
  routedBy: 'metaharness-knn' | 'metaharness-krr';
}

export interface NeuralRouteOptions {
  /** Per-model price table (cost axis the router minimises). */
  prices: Record<string, number>;
  /** Model ids the caller will accept; anything else is rejected as unknown. */
  knownModels: string[];
  /** Quality bar for the k-NN path (KRR artifacts carry their own). */
  qualityBar?: number;
}

const DEFAULT_QUALITY_BAR = 0.7;

/** True only when the operator opted into neural routing. */
export function neuralRoutingEnabled(): boolean {
  return process.env.CLAUDE_FLOW_ROUTER_NEURAL === '1';
}

// ── Minimal typed view of the @metaharness/router surface we depend on ───────────
interface MhRouteResult { id: string; predictedQuality: number; costPerMTok: number; metBar: boolean; }
interface MhRouter { route(embedding: number[]): MhRouteResult; }
interface MhModule {
  Router: { fromExamples(
    rows: { embedding: number[]; scores: Record<string, number> }[],
    prices: Record<string, number>,
    opts?: { k?: number; qualityBar?: number },
  ): MhRouter };
  TrainedRouter: { fromJSON(o: unknown): MhRouter };
}

/**
 * Load @metaharness/router's pure-TS API via dynamic import (optionalDependency,
 * ADR-124 graceful degradation; `as string` defers tsc module resolution so the
 * dep can be absent). Named exports may surface top-level (ESM) or under
 * `.default` (CJS interop); the `?? imported` fallback plus the `fromExamples`
 * capability probe handle both and reject anything that isn't the router.
 */
async function importMetaharness(): Promise<MhModule | null> {
  const imported = await import('@metaharness/router' as string).catch(() => null);
  const mod = (imported && ((imported as { default?: unknown }).default ?? imported)) as MhModule | null;
  return mod && typeof mod.Router?.fromExamples === 'function' ? mod : null;
}

// Sticky latch + cache: a missing artifact/dep costs one failed load, not one per call.
let loadFailed = false;
let cached: { router: MhRouter; routedBy: 'metaharness-knn' | 'metaharness-krr' } | null = null;

async function loadRouter(
  opts: NeuralRouteOptions,
): Promise<{ router: MhRouter; routedBy: 'metaharness-knn' | 'metaharness-krr' } | null> {
  if (cached) return cached;
  if (loadFailed) return null;

  const artifactPath = process.env.CLAUDE_FLOW_ROUTER_MODEL_PATH;
  if (!artifactPath || !existsSync(artifactPath)) { loadFailed = true; return null; }

  try {
    const mod = await importMetaharness();
    if (!mod) { loadFailed = true; return null; }

    const raw: unknown = JSON.parse(readFileSync(artifactPath, 'utf8'));

    // A serialized KRR TrainedRouter has `candidates[].alpha`; a raw dataset is an
    // array of DRACO rows. The shape decides the backend AND the honest routedBy tag.
    if (raw && typeof raw === 'object' && Array.isArray((raw as { candidates?: unknown }).candidates)) {
      cached = { router: mod.TrainedRouter.fromJSON(raw), routedBy: 'metaharness-krr' };
    } else if (Array.isArray(raw)) {
      cached = {
        router: mod.Router.fromExamples(
          raw as { embedding: number[]; scores: Record<string, number> }[],
          opts.prices,
          { qualityBar: opts.qualityBar ?? DEFAULT_QUALITY_BAR },
        ),
        routedBy: 'metaharness-knn',
      };
    } else {
      loadFailed = true; return null;
    }
    return cached;
  } catch {
    loadFailed = true;
    return null;
  }
}

/**
 * Best-effort cost-optimal routing recommendation. Returns `null` (never throws)
 * whenever the neural path is off, unavailable, or declines — the caller then
 * falls back to the bandit. A returned recommendation is honest: its `routedBy`
 * reflects the backend that actually produced it, and its `model` is guaranteed
 * to be one of `opts.knownModels`.
 */
export async function tryCostOptimalRoute(
  embedding: number[] | undefined,
  opts: NeuralRouteOptions,
): Promise<NeuralRecommendation | null> {
  if (!neuralRoutingEnabled()) return null;
  if (!embedding || embedding.length === 0) return null;  // no real embedding → no neural route
  const loaded = await loadRouter(opts);
  if (!loaded) return null;
  try {
    const r = loaded.router.route(embedding);
    if (!opts.knownModels.includes(r.id)) return null;     // honest: only known tiers
    return {
      model: r.id,
      predictedQuality: r.predictedQuality,
      metBar: r.metBar,
      routedBy: loaded.routedBy,
    };
  } catch {
    return null;
  }
}

/** Reset cached state — for tests. */
export function resetNeuralRouter(): void {
  cached = null;
  loadFailed = false;
}
