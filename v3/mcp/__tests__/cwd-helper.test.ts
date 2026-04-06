/**
 * Tests for cwd-helper.ts
 *
 * Verifies that getBaseCwd() respects the CLAUDE_FLOW_CWD environment
 * variable, falling back to process.cwd() when unset.
 *
 * Closes #1532
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getBaseCwd } from '../tools/cwd-helper.js';

describe('getBaseCwd', () => {
  const originalEnv = process.env.CLAUDE_FLOW_CWD;

  afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.CLAUDE_FLOW_CWD;
    } else {
      process.env.CLAUDE_FLOW_CWD = originalEnv;
    }
  });

  it('returns CLAUDE_FLOW_CWD when set', () => {
    process.env.CLAUDE_FLOW_CWD = '/Users/testuser';
    expect(getBaseCwd()).toBe('/Users/testuser');
  });

  it('returns process.cwd() when CLAUDE_FLOW_CWD is not set', () => {
    delete process.env.CLAUDE_FLOW_CWD;
    expect(getBaseCwd()).toBe(process.cwd());
  });

  it('returns process.cwd() when CLAUDE_FLOW_CWD is empty string', () => {
    process.env.CLAUDE_FLOW_CWD = '';
    // Empty string is falsy, so falls back to process.cwd()
    expect(getBaseCwd()).toBe(process.cwd());
  });

  it('does not return "/" (root) when CLAUDE_FLOW_CWD is set to a home dir', () => {
    process.env.CLAUDE_FLOW_CWD = '/home/user';
    const result = getBaseCwd();
    expect(result).not.toBe('/');
    expect(result).toBe('/home/user');
  });
});
