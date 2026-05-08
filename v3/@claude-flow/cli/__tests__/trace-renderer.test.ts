/**
 * Unit tests for `services/trace-renderer.ts` (Gap 1 — replayable agent traces).
 *
 * Coverage:
 *   - `renderTrace` returns a valid HTML5 document.
 *   - The trajectory JSON is embedded in `<script id="trajectory-data">`.
 *   - HTML escaping protects task / agent / action / result fields.
 *   - `</script>` injection through trajectory data is neutralised.
 *   - Zero-step trajectories render a graceful empty state.
 *   - `renderTraceList` renders an index page with one row per trajectory.
 *   - `renderTraceList` handles an empty array.
 *
 * Browser-runtime smoke (no console errors, .bar elements actually paint)
 * is the tester-trace agent's responsibility — see GAP-1-DESIGN.md test plan.
 */

import { describe, it, expect } from 'vitest';

import { renderTrace, renderTraceList, escapeHtml } from '../src/services/trace-renderer.js';
import type { LoadedTrajectory } from '../src/services/trace-loader.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function sampleTrajectory(): LoadedTrajectory {
  return {
    id: 'sess-abc12345',
    task: 'research RaBitQ for SwarmOps',
    agent: 'researcher',
    startedAt: '2026-05-08T18:30:00.000Z',
    endedAt: '2026-05-08T18:34:12.000Z',
    success: true,
    steps: [
      {
        action: 'Bash',
        result: 'listed 14 files',
        quality: 0.7,
        timestamp: '2026-05-08T18:30:01.000Z',
      },
      {
        action: 'Read',
        result: 'opened README.md',
        quality: 0.9,
        timestamp: '2026-05-08T18:30:03.500Z',
      },
      {
        action: 'mcp_memory_search',
        result: '3 hits',
        quality: 0.5,
        timestamp: '2026-05-08T18:30:08.000Z',
      },
      {
        action: 'SendMessage',
        result: 'delivered to architect',
        quality: 0.5,
        timestamp: '2026-05-08T18:30:12.000Z',
      },
      {
        action: 'Edit',
        result: 'error: file is read-only',
        quality: 0.2,
        timestamp: '2026-05-08T18:30:15.000Z',
      },
    ],
  };
}

function emptyTrajectory(): LoadedTrajectory {
  return {
    id: 'sess-empty01',
    task: 'placeholder',
    agent: 'researcher',
    startedAt: '2026-05-08T18:30:00.000Z',
    steps: [],
  };
}

// ---------------------------------------------------------------------------
// escapeHtml — exercised directly because every other test relies on it.
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
  it('escapes the five HTML metacharacters', () => {
    expect(escapeHtml(`<a href="x" data-y='z'>&hello</a>`)).toBe(
      '&lt;a href=&quot;x&quot; data-y=&#39;z&#39;&gt;&amp;hello&lt;/a&gt;',
    );
  });

  it('returns empty string for non-string input', () => {
    // Cast to silence TS — the runtime contract has to be defensive too.
    expect(escapeHtml(undefined as unknown as string)).toBe('');
    expect(escapeHtml(null as unknown as string)).toBe('');
  });

  it('is idempotent on already-escaped output', () => {
    const once = escapeHtml('<x>');
    const twice = escapeHtml(once);
    // Second pass turns the `&` into `&amp;` again, which is correct —
    // we just want to confirm it doesn't lose data.
    expect(twice).toContain('lt;');
    expect(twice).toContain('gt;');
  });
});

// ---------------------------------------------------------------------------
// renderTrace — single trajectory.
// ---------------------------------------------------------------------------

describe('renderTrace', () => {
  it('returns a valid HTML5 document (DOCTYPE + html closing tag)', () => {
    const html = renderTrace(sampleTrajectory());
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
  });

  it('embeds the trajectory JSON in <script id="trajectory-data" type="application/json">', () => {
    const t = sampleTrajectory();
    const html = renderTrace(t);

    // The opening tag should be exact — JS reader does getElementById('trajectory-data').
    expect(html).toContain('<script id="trajectory-data" type="application/json">');

    // The id field is unique enough that a substring match confirms the
    // payload landed in the embed without us having to fully reparse.
    expect(html).toContain('"id":"sess-abc12345"');
    expect(html).toContain('"agent":"researcher"');
  });

  it('renders one Gantt row per step', () => {
    const t = sampleTrajectory();
    const html = renderTrace(t);
    const rowMatches = html.match(/class="row"/g) || [];
    expect(rowMatches.length).toBe(t.steps.length);
  });

  it('escapes <, >, &, ", \' in the task field', () => {
    const t = sampleTrajectory();
    t.task = `<script>alert('xss & "go"')</script>`;
    const html = renderTrace(t);

    // The literal <script> from the task must NOT appear in the rendered
    // header — only the escaped form. We narrow the search to the
    // <header> block to avoid false positives from the trajectory-data
    // script tag and the runtime <script> at the end.
    const headerMatch = html.match(/<header>[\s\S]*?<\/header>/);
    expect(headerMatch).not.toBeNull();
    const headerBlock = headerMatch![0];
    expect(headerBlock).not.toContain("<script>alert(");
    expect(headerBlock).toContain('&lt;script&gt;');
    expect(headerBlock).toContain('&amp;');
    expect(headerBlock).toContain('&quot;');
    expect(headerBlock).toContain('&#39;');
  });

  it('neutralises </script> injection inside trajectory JSON', () => {
    const t = sampleTrajectory();
    // A malicious result string trying to break out of the JSON script tag.
    t.steps = [
      {
        action: 'Bash',
        result: '</script><img src=x onerror=alert(1)>',
        quality: 0.5,
        timestamp: t.startedAt,
      },
    ];
    const html = renderTrace(t);

    // Find the opening tag of the embedded JSON, then look at the slice
    // that runs up to the *next* `</script>` we expect to see (which
    // should be the runtime JS block, not a smuggled one).
    const dataOpen = html.indexOf('<script id="trajectory-data"');
    expect(dataOpen).toBeGreaterThanOrEqual(0);
    const closingDataIdx = html.indexOf('</script>', dataOpen);
    expect(closingDataIdx).toBeGreaterThanOrEqual(0);

    const jsonBlock = html.slice(dataOpen, closingDataIdx);
    // The injected `</script>` must NOT appear literal inside the JSON
    // block. It should be escaped to <\/script>.
    expect(jsonBlock).not.toContain('</script>');
    expect(jsonBlock).toContain('\\u003c/script\\u003e');
  });

  it('renders a graceful empty state for zero-step trajectories', () => {
    const html = renderTrace(emptyTrajectory());
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('No steps recorded');
    // No row elements when there are no steps.
    expect(html).not.toMatch(/class="row"/);
    // Steps count in header should still render as 0.
    expect(html).toContain('Steps: <b>0</b>');
  });

  it('renders status badges for ok / failed / in-flight trajectories', () => {
    const ok = renderTrace({ ...sampleTrajectory(), success: true });
    const fail = renderTrace({ ...sampleTrajectory(), success: false });

    const inflight: LoadedTrajectory = {
      ...sampleTrajectory(),
      // Construct the in-flight case without setting `endedAt`/`success`
      // (which would otherwise satisfy `exactOptionalPropertyTypes`).
      success: undefined as unknown as boolean | undefined,
    };
    delete inflight.endedAt;
    delete inflight.success;
    const inflightHtml = renderTrace(inflight);

    expect(ok).toContain('class="status-ok"');
    expect(fail).toContain('class="status-fail"');
    expect(inflightHtml).toContain('class="status-pending"');
  });

  it('embeds the inline JS (no external <script src=>)', () => {
    const html = renderTrace(sampleTrajectory());
    // No external scripts of any kind — ADR-004 says self-contained.
    expect(html).not.toMatch(/<script\s+[^>]*src=/);
    // Sanity: the runtime IIFE marker should be present.
    expect(html).toContain("'use strict'");
  });

  it('budget: HTML for a 5-step trajectory stays under 30 KB', () => {
    const html = renderTrace(sampleTrajectory());
    expect(Buffer.byteLength(html, 'utf-8')).toBeLessThan(30 * 1024);
  });
});

// ---------------------------------------------------------------------------
// renderTraceList — index page.
// ---------------------------------------------------------------------------

describe('renderTraceList', () => {
  it('returns a valid HTML5 document', () => {
    const html = renderTraceList([sampleTrajectory()]);
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('</html>');
  });

  it('renders one table row per trajectory with a link to <id>.html', () => {
    const t1 = sampleTrajectory();
    const t2: LoadedTrajectory = { ...sampleTrajectory(), id: 'sess-defg6789' };
    const html = renderTraceList([t1, t2]);

    const rowMatches = html.match(/<tr>/g) || [];
    // 1 header row + 2 body rows = 3 total
    expect(rowMatches.length).toBe(3);

    expect(html).toContain('href="sess-abc12345.html"');
    expect(html).toContain('href="sess-defg6789.html"');
  });

  it('handles an empty array (renders the placeholder)', () => {
    const html = renderTraceList([]);
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('No trajectories recorded yet');
    // No table rendered when empty.
    expect(html).not.toContain('<table');
  });

  it('escapes hostile values in task/agent fields', () => {
    const t = sampleTrajectory();
    t.task = '<img src=x onerror=alert(1)>';
    t.agent = '<svg/onload=alert(1)>';
    const html = renderTraceList([t]);

    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<svg/onload');
    expect(html).toContain('&lt;img src=x');
    expect(html).toContain('&lt;svg/onload');
  });
});
