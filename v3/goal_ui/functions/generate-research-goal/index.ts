/**
 * GCF (Google Cloud Functions) entrypoint for `generate-research-goal`.
 *
 * Compatible with `@google-cloud/functions-framework` (signature
 * `(req, res) => void`). Deployed via:
 *
 *   npm run functions:deploy -- generate-research-goal
 *
 * Locally the same handler is mounted via `functions/server.ts`.
 *
 * Origin / token / rate-limit middleware lives in `functions/server.ts`
 * for local dev; in GCF deployment the same checks must run inside
 * the entrypoint (Step 22b adds them when this graduates from proof
 * to production rollout).
 */

import { generateResearchGoalHandler } from './handler';

interface GcfReq {
  method?: string;
  body?: unknown;
}
interface GcfRes {
  status(code: number): GcfRes;
  set(name: string, value: string): GcfRes;
  json(body: unknown): void;
  send(body?: string | Buffer): void;
}

export async function generateResearchGoal(req: GcfReq, res: GcfRes): Promise<void> {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res
      .set('Access-Control-Allow-Origin', '*')
      .set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .set('Access-Control-Allow-Headers', 'content-type, x-ruflo-token')
      .status(204)
      .send();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const body = (req.body ?? {}) as { category?: string; customContext?: string };
  const result = await generateResearchGoalHandler({
    category: body.category ?? '',
    customContext: body.customContext,
  });

  res
    .set('Access-Control-Allow-Origin', '*')
    .set('Content-Type', 'application/json')
    .status(result.status)
    .json(result.body);
}
