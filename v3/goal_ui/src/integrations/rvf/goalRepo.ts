/**
 * userGoal persistence via the browser RVF backend, plus past-goal
 * HNSW recall via the AgentDB browser client (R-2.4 / ADR-095).
 *
 * Two storage paths:
 *
 *   - `goal/current`  (RVF)        — the active goal, overwritten on
 *     every edit. Same shape as before; no vector.
 *   - `past-goals/<id>`  (AgentDB + HnswLite) — durable history of
 *     submitted goals with 384-dim vectors from ruvector ONNX-WASM
 *     (MiniLM-L6). Used by `searchPastGoals(query)` for autocomplete
 *     suggestions.
 *
 * `addPastGoal` is fire-and-forget from the consumer's perspective:
 * it embeds in the background and writes when ready. Embed failures
 * are swallowed (logged once) so a flaky WASM init never blocks the
 * user's primary save flow.
 */

import { getRvfClient } from './client';
import { getAgentDbClient } from '../agentdb/client';
// `./embed` is lazy-imported in addPastGoal/searchPastGoals — keeping
// it out of the static graph prevents the ruvector ONNX-WASM loader
// from being concatenated into the widget IIFE bundle (which can't
// code-split). Static reachability through the widget tree was
// causing `__dirname` (Node-fallback path) to leak into widget.js.

const NAMESPACE = 'goal';
const KEY = 'current';
const PAST_GOALS_NS = 'past-goals';

export interface PastGoalHit {
  id: string;
  text: string;
  score: number;
  ts: number;
}

/** Read the persisted goal string. Returns undefined if no row exists. */
export async function getCurrentGoal(): Promise<string | undefined> {
  const client = getRvfClient();
  const entry = await client.get(KEY, { namespace: NAMESPACE });
  const v = entry?.value as { goal?: string } | undefined;
  return v?.goal;
}

/**
 * Persist the current goal. Long (>=10-char) goals are also indexed
 * into the past-goals HNSW store as a fire-and-forget side-effect so
 * the autocomplete path has data to recall.
 */
export async function saveCurrentGoal(goal: string): Promise<void> {
  const client = getRvfClient();
  await client.put({ goal }, { key: KEY, namespace: NAMESPACE });
  if (goal && goal.trim().length >= 10) {
    void addPastGoal(goal.trim()).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[goalRepo] addPastGoal failed (non-fatal):', err?.message ?? err);
    });
  }
}

/** Drop the persisted goal (returns to empty on reload). */
export async function clearCurrentGoal(): Promise<void> {
  const client = getRvfClient();
  await client.delete(KEY, { namespace: NAMESPACE });
}

// ── Past-goal HNSW recall ───────────────────────────────────────────

/** Cheap stable hash → 8 hex chars. Avoids embedding-name collisions
 *  in the IDB key without pulling in a crypto dep. */
function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return ((h >>> 0).toString(16) + '00000000').slice(0, 8);
}

/**
 * Embed `goalText` and persist under `past-goals` with its vector.
 * Idempotent on identical text (id derives from a stable hash).
 */
export async function addPastGoal(goalText: string): Promise<void> {
  const text = goalText.trim();
  if (!text) return;
  // Bare alias `@/integrations/rvf/embed` so `vite.config.ts`'s
  // widget-build alias can swap in the no-op stub without dragging
  // ruvector ONNX-WASM into the IIFE bundle.
  const { embedText } = await import('@/integrations/rvf/embed');
  const vec = await embedText(text);
  const client = getAgentDbClient();
  const id = `${PAST_GOALS_NS}:${shortHash(text)}`;
  await client.put(id, PAST_GOALS_NS, { text, ts: Date.now() }, vec);
}

/**
 * HNSW-recall the top-K past goals semantically similar to `query`.
 * Returns at most `k` results, sorted by cosine score descending.
 *
 * Returns `[]` for queries shorter than 4 chars (avoids autocomplete
 * thrash on early keystrokes).
 */
export async function searchPastGoals(query: string, k = 3): Promise<PastGoalHit[]> {
  const q = query.trim();
  if (q.length < 4) return [];
  const { embedText } = await import('@/integrations/rvf/embed');
  const vec = await embedText(q);
  const client = getAgentDbClient();
  const hits = await client.searchByVector<{ text: string; ts: number }>(PAST_GOALS_NS, vec, k);
  return hits.map((h) => ({ id: h.id, text: h.entry.data.text, score: h.score, ts: h.entry.data.ts }));
}
