// Train a KRR artifact from the measured seed corpus (ADR-149) and write it
// to v3/@claude-flow/cli/assets/model-router/seed-router.krr.json so the
// integrated path can serve cost-optimal decisions at install time.
//
// Per-model schema: the seed corpus carries `scores: {model_id: 0..1}` for
// every candidate. Prices below mirror the candidate registry in the
// benchmark scripts; if a model in the corpus is missing from prices, we
// fall back to a conservative default ($1/Mtok blended).

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import * as mh from '@metaharness/router';

// Per-model blended price ($/Mtok). Blended = input + 3×output (rough mix
// since responses are 3-5x longer than prompts on average for these tasks).
// Keep aligned with scripts/benchmark-seed-corpus.mjs DEFAULT_CANDIDATES.
const BLENDED_PRICES = {
  'inclusionai/ling-2.6-flash':         (0.01 + 3 * 0.03),       // $0.10
  'google/gemini-2.5-flash-lite':       (0.10 + 3 * 0.40),       // $1.30
  'anthropic/claude-haiku-4.5':         (1.00 + 3 * 5.00),       // $16.00
  'openai/gpt-4.1':                     (2.00 + 3 * 8.00),       // $26.00
  'meta-llama/llama-3.3-70b-instruct':  (0.13 + 3 * 0.40),       // $1.33
  'anthropic/claude-sonnet-4-6':        (3.00 + 3 * 15.00),      // $48.00
  'anthropic/claude-opus-4':            (15.00 + 3 * 75.00),     // $240.00
};
// Corpus-calibrated qualityBar — measured-data scores on this corpus top
// around 0.42, so 0.8 is unreachable. We set the bar to a percentile of
// observed top scores per row; here we use 0.25 as a sane default that
// keeps the top half of candidates in the "clears the bar" set.
const QUALITY_BAR = 0.25;

const seedPath = resolve('v3/@claude-flow/cli/assets/model-router/seed-rows.json');
const outPath  = resolve('v3/@claude-flow/cli/assets/model-router/seed-router.krr.json');

console.log(`[train] reading measured seed corpus from ${seedPath}`);
const rows = JSON.parse(readFileSync(seedPath, 'utf8'));
const corpusModels = Object.keys(rows[0].scores);
console.log(`[train] ${rows.length} rows, dim=${rows[0].embedding.length}, candidates=${corpusModels.length}`);
console.log(`[train] candidates: ${corpusModels.join(', ')}`);

// Build the prices map for ONLY the candidates present in the corpus.
const prices = {};
for (const m of corpusModels) {
  if (BLENDED_PRICES[m] === undefined) {
    console.warn(`[train] WARN: no blended price configured for ${m}; defaulting to $1.00/Mtok`);
    prices[m] = 1.00;
  } else {
    prices[m] = BLENDED_PRICES[m];
  }
}

const t0 = performance.now();
const { router, lambda, looQuality } = mh.trainRouter(rows, prices, {
  qualityBar: QUALITY_BAR,
  lambdas: [1e-4, 1e-3, 1e-2, 1e-1, 1e0],
});
const trainMs = performance.now() - t0;
console.log(`[train] λ=${lambda.toExponential(3)}, looQuality=${looQuality.toFixed(4)}, ${trainMs.toFixed(0)}ms, qualityBar=${QUALITY_BAR}`);

const json = router.toJSON();
writeFileSync(outPath, JSON.stringify(json));
const size = statSync(outPath).size;
console.log(`[train] wrote ${outPath} (${size} bytes)`);

// Smoke: route a synthetic cheap probe + mid probe + strong probe.
// The bundled-seed embeddings carry the tier in v[0]/v[1]; using the same
// signal pattern produces interpretable picks.
const dim = rows[0].embedding.length;
const probe = (v0, v1) => {
  const v = new Array(dim).fill(0); v[0] = v0; v[1] = v1;
  return v;
};
console.log(`[smoke] cheap probe (v[0]=+0.85)  →`, router.route(probe(0.85, 0.0)));
console.log(`[smoke] mid probe   (v[0]= 0.0)   →`, router.route(probe(0.0, 0.0)));
console.log(`[smoke] strong probe(v[0]=-0.85)  →`, router.route(probe(-0.85, 0.7)));
