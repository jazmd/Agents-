/**
 * Regression test for #1987 — `memory stats` reported HNSW
 * `active (0 entries)` in a fresh CLI process even when persisted rows had
 * embeddings, because `getHNSWStatus()` reads an in-process singleton that
 * is never hydrated on the stats code path.
 *
 * Fix exposes `countVectorEntries()` which queries `memory_entries` for
 * `embedding IS NOT NULL` directly. This test pins the contract.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  _resetMemoryRootCache,
  countVectorEntries,
  getMemoryRoot,
  initializeMemoryDatabase,
  storeEntry,
} from '../src/memory/memory-initializer.js';

const SAVED_ENV: Record<string, string | undefined> = {};
function saveEnv(...names: string[]) {
  for (const n of names) SAVED_ENV[n] = process.env[n];
}
function restoreEnv() {
  for (const [n, v] of Object.entries(SAVED_ENV)) {
    if (v === undefined) delete process.env[n];
    else process.env[n] = v;
  }
}

describe('#1987 memory stats HNSW count', () => {
  let workdir: string;
  let dbPath: string;

  beforeEach(async () => {
    saveEnv('CLAUDE_FLOW_MEMORY_PATH', 'CLAUDE_FLOW_ENCRYPT_AT_REST');
    delete process.env.CLAUDE_FLOW_ENCRYPT_AT_REST;
    workdir = mkdtempSync(join(tmpdir(), 'mem-stats-hnsw-'));
    process.env.CLAUDE_FLOW_MEMORY_PATH = workdir;
    _resetMemoryRootCache();
    dbPath = join(workdir, 'memory.db');
    await initializeMemoryDatabase({ dbPath, force: true });
  });

  afterEach(() => {
    rmSync(workdir, { recursive: true, force: true });
    _resetMemoryRootCache();
    restoreEnv();
  });

  it('resolves to the tmpdir via CLAUDE_FLOW_MEMORY_PATH', () => {
    expect(getMemoryRoot()).toBe(workdir);
  });

  it('returns 0 from an empty DB', async () => {
    const count = await countVectorEntries(dbPath);
    expect(count).toBe(0);
  });

  it('returns 0 when the DB file is missing', async () => {
    const missing = join(workdir, 'does-not-exist.db');
    const count = await countVectorEntries(missing);
    expect(count).toBe(0);
  });

  it('counts entries that have an embedding after store', async () => {
    const result = await storeEntry({
      key: 'oauth-design',
      value: 'OAuth2 with PKCE flow for the auth service',
      namespace: 'test-ns',
      dbPath,
    });
    expect(result.success).toBe(true);

    const count = await countVectorEntries(dbPath);
    // Pre-fix this assertion failed because `getHNSWStatus().entryCount`
    // (the value the stats handler used) was always 0 in a fresh process.
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('counts multiple entries across namespaces', async () => {
    await storeEntry({ key: 'a', value: 'first entry with text', namespace: 'ns1', dbPath });
    await storeEntry({ key: 'b', value: 'second entry with text', namespace: 'ns1', dbPath });
    await storeEntry({ key: 'c', value: 'third entry with text', namespace: 'ns2', dbPath });

    const count = await countVectorEntries(dbPath);
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
