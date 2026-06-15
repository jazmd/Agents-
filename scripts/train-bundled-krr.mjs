// Train a KRR artifact from the bundled seed corpus and write it to
// v3/@claude-flow/cli/assets/model-router/seed-router.krr.json so the
// integrated path can serve KRR-quality decisions at install time.

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import * as mh from '@metaharness/router';

const seedPath = resolve('v3/@claude-flow/cli/assets/model-router/seed-rows.json');
const outPath  = resolve('v3/@claude-flow/cli/assets/model-router/seed-router.krr.json');

console.log(`[train] reading seed corpus from ${seedPath}`);
const rows = JSON.parse(readFileSync(seedPath, 'utf8'));
console.log(`[train] ${rows.length} rows, dim=${rows[0].embedding.length}, candidates=${Object.keys(rows[0].scores).join(',')}`);

const t0 = performance.now();
// Smaller λ range — the bundled corpus is small (64 rows) and clean, so the
// default exploration up to λ=100 over-regularises (predictions get squashed
// toward the mean and never clear the qualityBar). Cap at 1 so predictions
// preserve enough magnitude for the metBar=true path to fire.
const { router, lambda, looQuality } = mh.trainRouter(rows, { haiku: 1, sonnet: 3, opus: 15 }, {
  qualityBar: 0.8,
  lambdas: [1e-4, 1e-3, 1e-2, 1e-1, 1e0],
});
const trainMs = performance.now() - t0;
console.log(`[train] λ=${lambda.toExponential(3)}, looQuality=${looQuality.toFixed(4)}, ${trainMs.toFixed(0)}ms`);

const json = router.toJSON();
writeFileSync(outPath, JSON.stringify(json));
const size = statSync(outPath).size;
console.log(`[train] wrote ${outPath} (${size} bytes)`);

// Smoke: route a synthetic cheap probe + strong probe
const cheap = new Array(rows[0].embedding.length).fill(0);
cheap[0] = 0.85; cheap[1] = 0.0;
const strong = new Array(rows[0].embedding.length).fill(0);
strong[0] = -0.85; strong[1] = 0.7;
console.log(`[smoke] cheap probe →`, router.route(cheap));
console.log(`[smoke] strong probe →`, router.route(strong));
