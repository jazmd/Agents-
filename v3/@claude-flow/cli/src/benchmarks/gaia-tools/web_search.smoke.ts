/**
 * Smoke test for the Google CSE backend — iter-50 ablation prep.
 *
 * Run after sourcing credentials ephemerally:
 *   export GOOGLE_AI_API_KEY=$(gcloud secrets versions access latest --secret=GOOGLE_AI_API_KEY --project=ruv-dev)
 *   export GOOGLE_CUSTOM_SEARCH_CX=$(gcloud secrets versions access latest --secret=GOOGLE_CUSTOM_SEARCH_CX --project=ruv-dev)
 *   node dist/benchmarks/gaia-tools/web_search.smoke.js
 *
 * Asserts: non-empty results, source === 'google-cse'.
 * Exit 0 on pass, exit 1 on failure.
 *
 * Refs: ADR-133, #2156
 */

import { createWebSearchTool, resetCseAvailabilityCache } from './web_search.js';

async function runSmoke(): Promise<void> {
  resetCseAvailabilityCache();

  const tool = createWebSearchTool({ enableCse: true });
  const raw = await tool.execute({ query: 'GAIA benchmark AI evaluation leaderboard', max_results: 3 });

  if (!raw || raw === 'No results found.') {
    throw new Error('smoke FAIL: CSE returned no results');
  }

  const lines = raw.split('\n').filter((l) => l.startsWith('['));
  if (lines.length === 0) {
    throw new Error('smoke FAIL: output has no numbered results');
  }

  console.log('smoke PASS — CSE returned results:\n' + raw.slice(0, 400));
}

runSmoke().catch((err) => {
  console.error('smoke FAIL:', err.message);
  process.exit(1);
});
