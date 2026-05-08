/**
 * Bug 47 — stale-daemon-path detection.
 *
 * The bug: a long-running daemon was forked from a different binary path
 * (e.g. an old `~/.npm/_npx/<hash>/...` cache from before the SwarmOps
 * fork). It keeps scheduling workers with PRE-FORK code while the user's
 * CLI now resolves to a different install. We need to:
 *   - detect the mismatch (detectDaemonPathMismatch),
 *   - refuse `daemon restart` without --force-path,
 *   - proceed with --force-path (graceful SIGTERM, SIGKILL fallback,
 *     state-file wipe).
 *
 * These tests build fake `.claude-flow/daemon.pid` + `daemon-state.json`
 * trees in tmpdir() and stub the `ps`-equivalent + the SIGTERM/SIGKILL
 * killer so nothing real is touched.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  detectDaemonPathMismatch,
  restartBackgroundDaemon,
  type ProcessKiller,
} from '../src/commands/daemon.js';

let tmp: string;
let stateDir: string;
let pidFile: string;
let stateFile: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'daemon-path-mismatch-'));
  stateDir = join(tmp, '.claude-flow');
  mkdirSync(stateDir, { recursive: true });
  pidFile = join(stateDir, 'daemon.pid');
  stateFile = join(stateDir, 'daemon-state.json');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// detectDaemonPathMismatch
// ---------------------------------------------------------------------------

describe('detectDaemonPathMismatch', () => {
  it('returns null when no daemon.pid file exists', async () => {
    const result = await detectDaemonPathMismatch({ projectRoot: tmp });
    expect(result).toBeNull();
  });

  it('returns null when paths match (after canonicalization)', async () => {
    writeFileSync(pidFile, '12345');
    const expected = '/Users/dev/SwarmOps/v3/@claude-flow/cli/bin/cli.js';
    const result = await detectDaemonPathMismatch({
      projectRoot: tmp,
      expectedPath: expected,
      // Both paths get the same canonical form — no mismatch.
      readRunningCommand: () => expected,
      canonicalize: (p) => p,
    });
    expect(result).toBeNull();
  });

  it('returns DaemonPathInfo when running path differs from expected', async () => {
    writeFileSync(pidFile, '64888');
    writeFileSync(
      stateFile,
      JSON.stringify({
        startedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      }),
    );
    const expected = '/Users/dev/SwarmOps/v3/@claude-flow/cli/bin/cli.js';
    const running = '/Users/dev/.npm/_npx/2ed56890c96f58f7/node_modules/@claude-flow/cli/bin/cli.js';

    const result = await detectDaemonPathMismatch({
      projectRoot: tmp,
      expectedPath: expected,
      readRunningCommand: (pid) => {
        expect(pid).toBe(64888);
        return running;
      },
      canonicalize: (p) => p,
    });

    expect(result).not.toBeNull();
    expect(result!.pid).toBe(64888);
    expect(result!.runningPath).toBe(running);
    expect(result!.expectedPath).toBe(expected);
    expect(result!.ageDays).toBeGreaterThanOrEqual(3);
    expect(result!.startedAt).not.toBe('unknown');
  });

  it('handles PID-not-found gracefully (ps returns null)', async () => {
    writeFileSync(pidFile, '99999');
    const result = await detectDaemonPathMismatch({
      projectRoot: tmp,
      expectedPath: '/x/bin/cli.js',
      readRunningCommand: () => null, // simulate `ps` reporting PID gone
      canonicalize: (p) => p,
    });
    expect(result).toBeNull();
  });

  it('returns null when daemon.pid contains a non-numeric value', async () => {
    writeFileSync(pidFile, 'not-a-pid');
    const result = await detectDaemonPathMismatch({
      projectRoot: tmp,
      expectedPath: '/x/bin/cli.js',
      readRunningCommand: () => '/should/not/be/called',
      canonicalize: (p) => p,
    });
    expect(result).toBeNull();
  });

  it('reports startedAt="unknown" and ageDays=0 when no daemon-state.json', async () => {
    writeFileSync(pidFile, '12345');
    const result = await detectDaemonPathMismatch({
      projectRoot: tmp,
      expectedPath: '/path/A',
      readRunningCommand: () => '/path/B',
      canonicalize: (p) => p,
    });
    expect(result).not.toBeNull();
    expect(result!.startedAt).toBe('unknown');
    expect(result!.ageDays).toBe(0);
  });

  it('matches paths after canonicalization even when raw strings differ', async () => {
    writeFileSync(pidFile, '12345');
    // Two different raw paths that canonicalize to the same target.
    const result = await detectDaemonPathMismatch({
      projectRoot: tmp,
      expectedPath: '/var/symlinked/cli.js',
      readRunningCommand: () => '/private/var/symlinked/cli.js',
      canonicalize: () => '/canonical/cli.js',
    });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// restartBackgroundDaemon — kill flow
// ---------------------------------------------------------------------------

describe('restartBackgroundDaemon', () => {
  it('returns {killed:false, pid:null} when no daemon.pid exists', async () => {
    const killer = vi.fn() as unknown as ProcessKiller;
    const result = await restartBackgroundDaemon({
      projectRoot: tmp,
      clearState: false,
      killer,
      sleep: () => Promise.resolve(),
    });
    expect(result.killed).toBe(false);
    expect(result.pid).toBeNull();
    expect(killer).not.toHaveBeenCalled();
  });

  it('sends SIGTERM and exits early when process dies during grace period', async () => {
    writeFileSync(pidFile, '64888');
    let alive = true;
    const sigterms: number[] = [];
    const sigkills: number[] = [];

    const killer: ProcessKiller = (pid, signal) => {
      if (signal === 0) {
        if (!alive) {
          // ESRCH equivalent — throw to indicate process is gone.
          throw new Error('ESRCH');
        }
        return true;
      }
      if (signal === 'SIGTERM') {
        sigterms.push(pid);
        // Simulate graceful shutdown after first SIGTERM.
        alive = false;
        return true;
      }
      if (signal === 'SIGKILL') {
        sigkills.push(pid);
        return true;
      }
      return true;
    };

    const result = await restartBackgroundDaemon({
      projectRoot: tmp,
      clearState: false,
      killer,
      sleep: () => Promise.resolve(),
      graceMs: 100,
    });

    expect(result.killed).toBe(true);
    expect(result.pid).toBe(64888);
    expect(sigterms).toEqual([64888]);
    expect(sigkills).toEqual([]); // graceful shutdown — no SIGKILL needed
    expect(existsSync(pidFile)).toBe(false); // PID file cleaned up
  });

  it('escalates to SIGKILL when SIGTERM does not kill within grace period', async () => {
    writeFileSync(pidFile, '64888');
    const sigterms: number[] = [];
    const sigkills: number[] = [];

    // Process refuses to die — signal 0 always succeeds, SIGTERM is ignored.
    const killer: ProcessKiller = (pid, signal) => {
      if (signal === 0) return true; // always alive
      if (signal === 'SIGTERM') sigterms.push(pid);
      if (signal === 'SIGKILL') sigkills.push(pid);
      return true;
    };

    const result = await restartBackgroundDaemon({
      projectRoot: tmp,
      clearState: false,
      killer,
      sleep: () => Promise.resolve(),
      graceMs: 50,
    });

    expect(result.killed).toBe(true);
    expect(sigterms).toEqual([64888]);
    expect(sigkills).toEqual([64888]);
  });

  it('clears daemon-state.json when clearState=true (--force-path semantics)', async () => {
    writeFileSync(pidFile, '64888');
    writeFileSync(stateFile, JSON.stringify({ running: true, startedAt: new Date().toISOString() }));

    const killer: ProcessKiller = (_pid, signal) => {
      if (signal === 0) throw new Error('ESRCH'); // already dead
      return true;
    };

    const result = await restartBackgroundDaemon({
      projectRoot: tmp,
      clearState: true,
      killer,
      sleep: () => Promise.resolve(),
    });

    expect(result.pid).toBe(64888);
    expect(existsSync(stateFile)).toBe(false);
    expect(existsSync(pidFile)).toBe(false);
  });

  it('preserves daemon-state.json when clearState=false', async () => {
    writeFileSync(pidFile, '64888');
    writeFileSync(stateFile, JSON.stringify({ running: true }));

    const killer: ProcessKiller = (_pid, signal) => {
      if (signal === 0) throw new Error('ESRCH');
      return true;
    };

    await restartBackgroundDaemon({
      projectRoot: tmp,
      clearState: false,
      killer,
      sleep: () => Promise.resolve(),
    });

    expect(existsSync(stateFile)).toBe(true);
    expect(existsSync(pidFile)).toBe(false);
  });

  it('handles dead-PID + present-pidfile (cleans up state without raising signals)', async () => {
    writeFileSync(pidFile, '99999');
    const killer: ProcessKiller = (_pid, signal) => {
      if (signal === 0) throw new Error('ESRCH'); // already dead
      throw new Error('should not signal a dead process');
    };

    const result = await restartBackgroundDaemon({
      projectRoot: tmp,
      clearState: false,
      killer,
      sleep: () => Promise.resolve(),
    });

    expect(result.pid).toBe(99999);
    // killed=false because we didn't actually send a signal — but pidfile is gone.
    expect(existsSync(pidFile)).toBe(false);
  });
});
