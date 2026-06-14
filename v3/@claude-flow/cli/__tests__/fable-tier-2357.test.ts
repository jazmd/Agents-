/**
 * Tests for #2357 / ADR-148 P1+P2: Claude Fable 5 as an explicit-opt-in
 * frontier tier.
 *
 * Pins three contracts:
 *  1. Alias — `fable` resolves to `claude-fable-5`; literal ids pass through.
 *  2. Behavior-neutrality — fable's complexity score is 0, so the router's
 *     automatic selection NEVER returns fable (it is reachable only via
 *     explicit `model: "fable"`). Routing for existing tiers is unchanged.
 *  3. Forward-migration safety — persisted router state written BEFORE the
 *     `fable` key existed (both v1-flat and v2-bucketed layouts) must load
 *     without crashing and backfill Beta(1,1) for the new key, instead of
 *     propagating `undefined` into sampleBeta() (NaN poisons the argmax).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { resolveAnthropicModel } from '../src/mcp-tools/agent-execute-core.js';
import {
  MODEL_CAPABILITIES,
  clonePriors,
  createModelRouter,
} from '../src/ruvector/model-router.js';

describe('fable alias + capabilities (#2357)', () => {
  it('resolves the fable alias to the canonical model id', () => {
    expect(resolveAnthropicModel('fable')).toBe('claude-fable-5');
  });

  it('still passes the literal id through verbatim (post-#2232 contract)', () => {
    expect(resolveAnthropicModel('claude-fable-5')).toBe('claude-fable-5');
  });

  it('registers fable in MODEL_CAPABILITIES at 2x opus cost', () => {
    expect(MODEL_CAPABILITIES.fable).toBeDefined();
    expect(MODEL_CAPABILITIES.fable.costMultiplier).toBe(2.0);
    // ties opus on the capped complexity axis — cost is the differentiator
    expect(MODEL_CAPABILITIES.fable.maxComplexity).toBe(1.0);
  });
});

describe('clonePriors backfills missing model keys (#2357 trap)', () => {
  it('backfills Beta(1,1) for a pre-fable prior object', () => {
    const legacy = {
      haiku: { alpha: 5, beta: 2 },
      sonnet: { alpha: 1, beta: 1 },
      opus: { alpha: 3, beta: 4 },
      inherit: { alpha: 1, beta: 1 },
      // no `fable` key — written by an older version
    };
    const cloned = clonePriors(legacy);
    expect(cloned.fable).toEqual({ alpha: 1, beta: 1 });
    // learned values survive untouched
    expect(cloned.haiku).toEqual({ alpha: 5, beta: 2 });
    expect(cloned.opus).toEqual({ alpha: 3, beta: 4 });
  });

  it('ignores malformed entries instead of propagating them', () => {
    const cloned = clonePriors({ haiku: { alpha: 2, beta: 1 }, fable: null as never });
    expect(cloned.fable).toEqual({ alpha: 1, beta: 1 });
    expect(cloned.haiku).toEqual({ alpha: 2, beta: 1 });
  });
});

describe('router with legacy persisted state (#2357 forward-migration)', () => {
  const dirs: string[] = [];
  // ModelRouter resolves statePath via join(process.cwd(), statePath), which
  // mangles absolute paths — hand it a cwd-relative path so loadState()
  // genuinely reads our crafted legacy file.
  const tmpStatePath = (state: unknown): string => {
    const dir = mkdtempSync(join(tmpdir(), 'ruflo-2357-'));
    dirs.push(dir);
    const p = join(dir, 'model-router-state.json');
    writeFileSync(p, JSON.stringify(state), 'utf-8');
    return relative(process.cwd(), p);
  };

  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  const legacyFlatPriors = {
    haiku: { alpha: 4, beta: 2 },
    sonnet: { alpha: 2, beta: 2 },
    opus: { alpha: 1, beta: 3 },
    inherit: { alpha: 1, beta: 1 },
  };

  it('loads v1-flat pre-fable state without crashing and routes normally', async () => {
    const router = createModelRouter({
      statePath: tmpStatePath({ priors: legacyFlatPriors }),
      autoSaveInterval: 1000, // don't persist during the test
    });
    const result = await router.route('fix a typo in the README');
    expect(['haiku', 'sonnet', 'opus']).toContain(result.model);
    expect(Number.isNaN(result.confidence)).toBe(false);
  });

  it('loads v2-bucketed pre-fable state and backfills fable priors', async () => {
    const router = createModelRouter({
      statePath: tmpStatePath({
        priors: {
          low: legacyFlatPriors,
          med: legacyFlatPriors,
          high: legacyFlatPriors,
        },
      }),
      autoSaveInterval: 1000,
    });
    // selection must not crash on the missing key…
    const result = await router.route(
      'redesign the distributed consensus architecture for byzantine fault tolerance'
    );
    expect(['haiku', 'sonnet', 'opus']).toContain(result.model);
    // …and the migrated priors expose a valid Beta(1,1) for fable
    const priors = router.getBanditPriors('med');
    expect(priors.fable).toEqual({ alpha: 1, beta: 1 });
    // learned legacy values survive the migration
    expect(priors.haiku).toEqual({ alpha: 4, beta: 2 });
  });

  it('never auto-selects fable from complexity alone (explicit-only contract)', async () => {
    const router = createModelRouter({
      statePath: tmpStatePath({}),
      autoSaveInterval: 1000,
    });
    // maximum-complexity prompts across repeated runs — fable must never win
    for (let i = 0; i < 25; i++) {
      const result = await router.route(
        'architect a security-critical distributed system migration with formal verification and byzantine consensus'
      );
      expect(result.model).not.toBe('fable');
    }
  });
});
