// Train KRR artifact(s) from the measured seed corpus (ADR-149).
//
// Default behaviour writes ONE unified artifact:
//   v3/@claude-flow/cli/assets/model-router/seed-router.krr.json
//
// With `--per-bucket`, also writes THREE specialist artifacts (iter 16):
//   v3/@claude-flow/cli/assets/model-router/seed-router.krr.low.json
//   v3/@claude-flow/cli/assets/model-router/seed-router.krr.med.json
//   v3/@claude-flow/cli/assets/model-router/seed-router.krr.high.json
// Each fits only its tier's rows, producing sharper predictions for queries
// in that complexity band ("3 specialists beat 1 generalist").
//
// USAGE
//   node scripts/train-bundled-krr.mjs                # unified KRR only
//   node scripts/train-bundled-krr.mjs --per-bucket   # unified + 3 specialists

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import * as mh from '@metaharness/router';

const ARGS = (() => {
  const a = { perBucket: false };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--per-bucket') a.perBucket = true;
  }
  return a;
})();

// Per-model blended price ($/Mtok). Blended = input + 3×output (rough mix
// since responses are 3-5x longer than prompts on average for these tasks).
const BLENDED_PRICES = {
  'inclusionai/ling-2.6-flash':         (0.01 + 3 * 0.03),       // $0.10
  'google/gemini-2.5-flash-lite':       (0.10 + 3 * 0.40),       // $1.30
  'anthropic/claude-haiku-4.5':         (1.00 + 3 * 5.00),       // $16.00
  'openai/gpt-4.1':                     (2.00 + 3 * 8.00),       // $26.00
  'meta-llama/llama-3.3-70b-instruct':  (0.13 + 3 * 0.40),       // $1.33
  'anthropic/claude-sonnet-4-6':        (3.00 + 3 * 15.00),      // $48.00
  'anthropic/claude-opus-4':            (15.00 + 3 * 75.00),     // $240.00
};
const QUALITY_BAR = 0.25;

const ASSETS_DIR = resolve('v3/@claude-flow/cli/assets/model-router');
const seedPath = resolve(ASSETS_DIR, 'seed-rows.json');

console.log(`[train] reading measured seed corpus from ${seedPath}`);
const allRows = JSON.parse(readFileSync(seedPath, 'utf8'));
const corpusModels = Object.keys(allRows[0].scores);
console.log(`[train] ${allRows.length} rows, dim=${allRows[0].embedding.length}, candidates=${corpusModels.length}`);

// Build the prices map for ONLY the candidates present in the corpus.
const prices = {};
for (const m of corpusModels) {
  prices[m] = BLENDED_PRICES[m] ?? 1.00;
}

// Train ONE KRR over a row subset + write it to `outPath`.
// Returns { lambda, looQuality, trainMs, size }.
function trainOne(rows, outPath, label) {
  if (rows.length < 3) {
    console.warn(`[${label}] WARN: only ${rows.length} rows — skipping (KRR needs ≥3 for LOO-CV).`);
    return null;
  }
  const t0 = performance.now();
  const { router, lambda, looQuality } = mh.trainRouter(rows, prices, {
    qualityBar: QUALITY_BAR,
    lambdas: [1e-4, 1e-3, 1e-2, 1e-1, 1e0],
  });
  const trainMs = performance.now() - t0;
  writeFileSync(outPath, JSON.stringify(router.toJSON()));
  const size = statSync(outPath).size;
  console.log(`[${label}] ${rows.length} rows  λ=${lambda.toExponential(2)}  looQ=${looQuality.toFixed(4)}  ${trainMs.toFixed(0)}ms  ${size}B  → ${outPath}`);
  return { lambda, looQuality, trainMs, size };
}

// Always write the unified artifact (back-compat for callers that don't
// know about per-bucket artifacts).
trainOne(allRows, resolve(ASSETS_DIR, 'seed-router.krr.json'), 'unified');

if (ARGS.perBucket) {
  // The tier label in the corpus rows is the SOURCE of bucket membership.
  // Bandit complexity buckets (low/med/high) map directly:
  //   cheap → low, mid → med, strong → high
  const tierToBucket = { cheap: 'low', mid: 'med', strong: 'high' };
  for (const [tier, bucket] of Object.entries(tierToBucket)) {
    const subset = allRows.filter(r => r.tier === tier);
    const path = resolve(ASSETS_DIR, `seed-router.krr.${bucket}.json`);
    trainOne(subset, path, bucket);
  }
}
