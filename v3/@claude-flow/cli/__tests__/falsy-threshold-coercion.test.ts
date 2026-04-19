/**
 * Regression tests for falsy numeric-default coercion bug (issue #1628).
 *
 * The `||` operator coerces *all* falsy values (including the valid numeric
 * input `0`) to the default.  The fix replaces `||` with `??` (nullish
 * coalescing) so that `0` is honoured while `undefined` / `null` still fall
 * back to the default.
 *
 * Each test reads the *source file* and asserts the corrected pattern,
 * guaranteeing the fix survives future refactors.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOOLS_DIR = resolve(__dirname, '..', 'src', 'mcp-tools');

function readTool(filename: string): string {
  return readFileSync(resolve(TOOLS_DIR, filename), 'utf-8');
}

/**
 * For every `(input.FIELD as number)` assignment that applies a non-zero
 * fractional default, assert `??` is used instead of `||`.
 *
 * Pattern:  `(input.<name> as number) || <non-zero-decimal>`
 * Fixed:    `(input.<name> as number) ?? <non-zero-decimal>`
 */
function assertNoFalsyCoercion(source: string, filename: string): void {
  // Match:  `(input.foo as number) || 0.<digits>`  (the buggy pattern)
  const buggy = /\(input\.\w+ as number\)\s*\|\|\s*0\.\d+/g;
  const matches = source.match(buggy) || [];
  expect(
    matches,
    `${filename} still contains || with non-zero fractional defaults:\n  ${matches.join('\n  ')}`
  ).toHaveLength(0);
}

// ---------------------------------------------------------------------------
// Per-file assertions
// ---------------------------------------------------------------------------

describe('falsy numeric-default coercion (issue #1628)', () => {
  // ---- memory-tools.ts ----------------------------------------------------

  describe('memory-tools.ts', () => {
    const src = readTool('memory-tools.ts');

    it('uses ?? for threshold default', () => {
      expect(src).toContain('(input.threshold as number) ?? 0.3');
    });

    it('has no remaining || with fractional defaults', () => {
      assertNoFalsyCoercion(src, 'memory-tools.ts');
    });

    it('threshold=0 is semantically valid (show-all intent)', () => {
      // Simulate the fixed coalescing logic
      const threshold0: number | undefined = 0;
      const resolved = threshold0 ?? 0.3;
      expect(resolved).toBe(0);
    });

    it('threshold=undefined falls back to default', () => {
      const thresholdUndef: number | undefined = undefined;
      const resolved = thresholdUndef ?? 0.3;
      expect(resolved).toBe(0.3);
    });
  });

  // ---- agent-tools.ts -----------------------------------------------------

  describe('agent-tools.ts', () => {
    const src = readTool('agent-tools.ts');

    it('uses ?? for threshold default', () => {
      expect(src).toContain('(input.threshold as number) ?? 0.5');
    });

    it('has no remaining || with fractional defaults', () => {
      assertNoFalsyCoercion(src, 'agent-tools.ts');
    });
  });

  // ---- embeddings-tools.ts ------------------------------------------------

  describe('embeddings-tools.ts', () => {
    const src = readTool('embeddings-tools.ts');

    it('uses ?? for threshold default', () => {
      expect(src).toContain('(input.threshold as number) ?? 0.5');
    });

    it('uses ?? for driftThreshold default', () => {
      expect(src).toContain('(input.driftThreshold as number) ?? 0.3');
    });

    it('uses ?? for decayRate default', () => {
      expect(src).toContain('(input.decayRate as number) ?? 0.01');
    });

    it('has no remaining || with fractional defaults', () => {
      assertNoFalsyCoercion(src, 'embeddings-tools.ts');
    });
  });

  // ---- claims-tools.ts ---------------------------------------------------

  describe('claims-tools.ts', () => {
    const src = readTool('claims-tools.ts');

    it('uses ?? for targetUtilization default', () => {
      expect(src).toContain('(input.targetUtilization as number) ?? 0.7');
    });

    it('has no remaining || with fractional defaults', () => {
      assertNoFalsyCoercion(src, 'claims-tools.ts');
    });
  });

  // ---- neural-tools.ts ---------------------------------------------------

  describe('neural-tools.ts', () => {
    const src = readTool('neural-tools.ts');

    it('uses ?? for learningRate default', () => {
      expect(src).toContain('(input.learningRate as number) ?? 0.001');
    });

    it('uses ?? for targetReduction default', () => {
      expect(src).toContain('(input.targetSize as number) ?? 0.5');
    });

    it('has no remaining || with fractional defaults', () => {
      assertNoFalsyCoercion(src, 'neural-tools.ts');
    });
  });

  // ---- daa-tools.ts -------------------------------------------------------

  describe('daa-tools.ts', () => {
    const src = readTool('daa-tools.ts');

    it('uses ?? for learningRate default', () => {
      expect(src).toContain('(input.learningRate as number) ?? 0.01');
    });

    it('uses ?? for performanceScore default', () => {
      expect(src).toContain('(input.performanceScore as number) ?? 0.8');
    });

    it('has no remaining || with fractional defaults', () => {
      assertNoFalsyCoercion(src, 'daa-tools.ts');
    });
  });

  // ---- Cross-cutting audit -----------------------------------------------

  describe('cross-cutting audit', () => {
    const ALL_TOOL_FILES = [
      'memory-tools.ts',
      'agent-tools.ts',
      'embeddings-tools.ts',
      'claims-tools.ts',
      'neural-tools.ts',
      'daa-tools.ts',
    ];

    it('all 10 occurrences use ?? (complete fix count)', () => {
      let totalFixed = 0;
      for (const file of ALL_TOOL_FILES) {
        const src = readTool(file);
        const fixed = (src.match(/\(input\.\w+ as number\)\s*\?\?\s*0\.\d+/g) || []).length;
        totalFixed += fixed;
      }
      // 1 memory + 1 agent + 3 embeddings + 1 claims + 2 neural + 2 daa = 10
      expect(totalFixed).toBe(10);
    });

    it('?? preserves 0 while || would silently drop it', () => {
      // This is the core semantic difference the fix addresses
      const input = 0;
      expect(input || 0.3).toBe(0.3);   // BUG: user's 0 dropped
      expect(input ?? 0.3).toBe(0);      // FIX: user's 0 honoured
    });

    it('?? still applies default for null', () => {
      const input: number | null = null;
      expect(input ?? 0.3).toBe(0.3);
    });

    it('?? still applies default for undefined', () => {
      const input: number | undefined = undefined;
      expect(input ?? 0.3).toBe(0.3);
    });

    it('?? passes through any non-nullish number', () => {
      for (const val of [0, 0.0, 0.001, 0.5, 1, -1, NaN, Infinity]) {
        expect(val ?? 999).toBe(val);
      }
    });
  });
});
