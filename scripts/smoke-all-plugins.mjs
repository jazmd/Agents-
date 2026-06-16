#!/usr/bin/env node
// smoke-all-plugins — run every `plugins/*/scripts/smoke.sh` in parallel,
// aggregate pass/fail counts, exit non-zero if any plugin's contract fails.
//
// USAGE
//   node scripts/smoke-all-plugins.mjs                    # parallel, table output
//   node scripts/smoke-all-plugins.mjs --sequential       # one at a time (debugging)
//   node scripts/smoke-all-plugins.mjs --format json      # machine-readable
//   node scripts/smoke-all-plugins.mjs --only ruflo-agent,ruflo-cost-tracker
//   node scripts/smoke-all-plugins.mjs --skip ruflo-iot-cognitum
//
// CI integration:
//   - name: All-plugin smoke contracts
//     run: node scripts/smoke-all-plugins.mjs
//
// Exit codes:
//   0  every smoke contract passed
//   1  one or more plugins failed
//   2  config error (e.g. invalid CLI args)
//   3  no smoke scripts found (likely repo-layout drift — fail closed)

import { readdirSync, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPTS_DIR);
const PLUGINS_DIR = join(REPO_ROOT, 'plugins');

const ARGS = (() => {
  const a = { sequential: false, format: 'table', only: null, skip: new Set() };
  for (let i = 2; i < process.argv.length; i++) {
    const v = process.argv[i];
    if (v === '--sequential') a.sequential = true;
    else if (v === '--format') a.format = process.argv[++i];
    else if (v === '--only') {
      a.only = new Set((process.argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean));
    } else if (v === '--skip') {
      for (const s of (process.argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean)) {
        a.skip.add(s);
      }
    }
  }
  return a;
})();

function discoverPlugins() {
  if (!existsSync(PLUGINS_DIR)) return [];
  const entries = readdirSync(PLUGINS_DIR);
  const plugins = [];
  for (const name of entries) {
    if (ARGS.only && !ARGS.only.has(name)) continue;
    if (ARGS.skip.has(name)) continue;
    const dir = join(PLUGINS_DIR, name);
    let stat;
    try { stat = statSync(dir); } catch { continue; }
    if (!stat.isDirectory()) continue;
    const smoke = join(dir, 'scripts', 'smoke.sh');
    if (!existsSync(smoke)) continue;
    plugins.push({ name, smoke });
  }
  return plugins.sort((a, b) => a.name.localeCompare(b.name));
}

function runSmoke(plugin) {
  return new Promise((resolve) => {
    const start = Date.now();
    const p = spawn('bash', [plugin.smoke], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => { stdout += d.toString(); });
    p.stderr.on('data', (d) => { stderr += d.toString(); });
    p.on('close', (exitCode) => {
      // Parse final summary line "N passed, M failed"
      const m = /(\d+)\s+passed,\s+(\d+)\s+failed/.exec(stdout);
      const passed = m ? parseInt(m[1], 10) : null;
      const failed = m ? parseInt(m[2], 10) : null;
      const failingSteps = [];
      const lineRe = /→\s+(.+?)\s+\.\.\.\s+FAIL:?\s*(.*)$/gm;
      let lm;
      while ((lm = lineRe.exec(stdout)) !== null) {
        failingSteps.push({ step: lm[1].trim(), reason: lm[2].trim() });
      }
      resolve({
        name: plugin.name,
        exitCode: exitCode ?? 0,
        ok: (exitCode ?? 0) === 0,
        passed,
        failed,
        durationMs: Date.now() - start,
        failingSteps,
        stderrTail: stderr.slice(-400),
      });
    });
    p.on('error', (err) => {
      resolve({
        name: plugin.name,
        exitCode: 127,
        ok: false,
        passed: null,
        failed: null,
        durationMs: Date.now() - start,
        failingSteps: [],
        stderrTail: err.message,
      });
    });
  });
}

async function main() {
  const plugins = discoverPlugins();
  if (plugins.length === 0) {
    console.error('smoke-all-plugins: no plugins/*/scripts/smoke.sh found — repo layout drift?');
    process.exit(3);
  }

  let results;
  if (ARGS.sequential) {
    results = [];
    for (const p of plugins) results.push(await runSmoke(p));
  } else {
    results = await Promise.all(plugins.map(runSmoke));
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;
  const totalSteps = results.reduce((s, r) => s + (r.passed || 0) + (r.failed || 0), 0);
  const totalPassed = results.reduce((s, r) => s + (r.passed || 0), 0);
  const totalFailed = results.reduce((s, r) => s + (r.failed || 0), 0);
  const totalDurationMs = results.reduce((s, r) => s + r.durationMs, 0);

  if (ARGS.format === 'json') {
    console.log(JSON.stringify({
      plugins: results,
      summary: {
        pluginsOk: okCount,
        pluginsFailed: failCount,
        stepsPassed: totalPassed,
        stepsFailed: totalFailed,
        stepsTotal: totalSteps,
        wallTimeMs: totalDurationMs,
      },
      generatedAt: new Date().toISOString(),
    }, null, 2));
  } else {
    console.log('# smoke-all-plugins');
    console.log('');
    console.log(`| Plugin | Status | Pass / Total | Duration | Failing steps |`);
    console.log(`|---|:---:|---:|---:|---|`);
    for (const r of results) {
      const status = r.ok ? '✓' : '⚠';
      const passTotal = r.passed !== null
        ? `${r.passed}/${(r.passed + r.failed)}`
        : '—';
      const failures = r.failingSteps.length > 0
        ? r.failingSteps.map((f) => `\`${f.step}\``).join(', ').slice(0, 120)
        : (r.ok ? '' : `**exit ${r.exitCode}**`);
      console.log(`| \`${r.name}\` | ${status} | ${passTotal} | ${(r.durationMs / 1000).toFixed(1)}s | ${failures} |`);
    }
    console.log('');
    console.log(`**Summary**: ${okCount}/${results.length} plugins OK · ${totalPassed}/${totalSteps} steps passed · ${(totalDurationMs / 1000).toFixed(1)}s wall (parallel: ${!ARGS.sequential})`);
    console.log('');
    if (failCount > 0) {
      console.log(`⚠ ${failCount} plugin(s) failed their smoke contract — see failing steps above.`);
    } else {
      console.log(`✓ All ${results.length} plugin smoke contracts passed.`);
    }
    console.log('');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main();
