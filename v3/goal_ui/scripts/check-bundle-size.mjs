#!/usr/bin/env tsx
/**
 * R-7.3 bundle-size watcher.
 *
 * Compares current `dist/` bundle sizes to the baseline tracked in
 * `.bundle-size-baseline.json`. Exits 0 when all bundles are within
 * the threshold (default 5%); exits 1 when any bundle has grown by
 * more than the threshold — that exit triggers the `optimize` worker
 * dispatch step in `.github/workflows/goal_ui-bundle-watch.yml`.
 *
 * Targets:
 *   - dist/widget.js                    (the embeddable IIFE bundle)
 *   - dist/assets/index-*.js (largest)  (the main SPA bundle, hash-named)
 *
 * Flags:
 *   --simulate-growth-pct=N   add N% to current sizes before
 *                             comparing — used by the DoD smoke test
 *                             to verify the trigger fires without
 *                             needing a real bundle bloat.
 */

import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const simulateArg = args.find((a) => a.startsWith('--simulate-growth-pct='));
const simulatePct = simulateArg ? Number(simulateArg.split('=')[1]) : 0;

const distDir = resolve('dist');
const baselinePath = resolve('.bundle-size-baseline.json');

if (!existsSync(baselinePath)) {
  console.error(`baseline not found: ${baselinePath}`);
  process.exit(2);
}
if (!existsSync(distDir)) {
  console.error(`dist not found — run \`npm run build\` first`);
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const thresholdPct = Number(baseline.thresholdPct ?? 5);

function widgetSize() {
  const p = join(distDir, 'widget.js');
  if (!existsSync(p)) return null;
  return statSync(p).size;
}

function mainBundleSize() {
  const assetsDir = join(distDir, 'assets');
  if (!existsSync(assetsDir)) return null;
  const candidates = readdirSync(assetsDir)
    .filter((f) => /^index-.*\.js$/.test(f))
    .map((f) => ({ f, size: statSync(join(assetsDir, f)).size }))
    .sort((a, b) => b.size - a.size);
  return candidates[0]?.size ?? null;
}

const current = {
  widget: widgetSize(),
  main: mainBundleSize(),
};

if (simulatePct > 0) {
  current.widget = current.widget !== null ? Math.round(current.widget * (1 + simulatePct / 100)) : null;
  current.main = current.main !== null ? Math.round(current.main * (1 + simulatePct / 100)) : null;
  console.log(`(SIMULATED +${simulatePct}% growth on current sizes)\n`);
}

const rows = [];
let exceeded = false;

for (const key of ['widget', 'main']) {
  const c = current[key];
  const b = baseline[key];
  if (c === null) {
    rows.push({ key, current: 'MISSING', baseline: b, deltaPct: 'n/a', status: 'SKIP' });
    continue;
  }
  if (typeof b !== 'number' || b <= 0) {
    rows.push({ key, current: c, baseline: 'unset', deltaPct: 'n/a', status: 'SKIP' });
    continue;
  }
  const deltaPct = ((c - b) / b) * 100;
  const over = deltaPct > thresholdPct;
  if (over) exceeded = true;
  rows.push({
    key,
    current: c,
    baseline: b,
    deltaPct: deltaPct.toFixed(2) + '%',
    status: over ? 'OVER' : 'OK',
  });
}

console.log(`R-7.3 bundle-size watcher (threshold +${thresholdPct}%)\n`);
console.log(`  ${'bundle'.padEnd(8)} ${'current'.padStart(10)} ${'baseline'.padStart(10)} ${'delta'.padStart(10)}  status`);
for (const r of rows) {
  console.log(`  ${r.key.padEnd(8)} ${String(r.current).padStart(10)} ${String(r.baseline).padStart(10)} ${String(r.deltaPct).padStart(10)}  ${r.status}`);
}
console.log('');

if (exceeded) {
  console.log('⚠ bundle size exceeded threshold — workflow will dispatch optimize worker.');
  process.exit(1);
} else {
  console.log('✓ bundle sizes within threshold.');
  process.exit(0);
}
