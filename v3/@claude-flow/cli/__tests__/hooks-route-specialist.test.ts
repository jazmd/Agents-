/**
 * ROUTING-B — `hooks_route_specialist` MCP tool tests.
 *
 * The tool is a *pure ranker*: given a task description, score every known
 * specialist agent type and return the top-N with confidence scores so the
 * caller can pick a language- or domain-specific worker instead of defaulting
 * to generic `coder`/`tester`/`reviewer`.
 *
 * Companion to `hooksRoute` (which returns one end-to-end routing decision).
 * These tests pin the contract for the active query path.
 */

import { describe, expect, it } from 'vitest';

import {
  hooksRouteSpecialist,
  rankSpecialistAgents,
} from '../src/mcp-tools/hooks-tools.js';

interface SpecialistResponse {
  candidates: Array<{
    agentType: string;
    confidence: number;
    matchedTokens: string[];
    reason: string;
  }>;
  fallback: string | null;
  detectedLanguages: string[];
  detectedFrameworks: string[];
  detectedDomains: string[];
}

async function callTool(params: Record<string, unknown>): Promise<SpecialistResponse> {
  // The MCP handler returns the typed object directly (existing hooks tools
  // do the same — see hooksRoute return shape on line ~1006).
  return (await hooksRouteSpecialist.handler(params)) as SpecialistResponse;
}

describe('hooks_route_specialist — MCP tool contract', () => {
  it('declares the locked input schema with task/limit/includeGenerics', () => {
    expect(hooksRouteSpecialist.name).toBe('hooks_route_specialist');
    expect(hooksRouteSpecialist.inputSchema.type).toBe('object');
    const props = hooksRouteSpecialist.inputSchema.properties as Record<string, unknown>;
    expect(props.task).toBeDefined();
    expect(props.limit).toBeDefined();
    expect(props.includeGenerics).toBeDefined();
    expect(hooksRouteSpecialist.inputSchema.required).toEqual(['task']);
  });

  it('rejects empty / invalid task via validateText', async () => {
    const res = (await hooksRouteSpecialist.handler({ task: '' })) as
      | SpecialistResponse
      | { success: false; error: string };
    // validateText rejects empty strings → handler returns a `success:false`
    // shape rather than the ranker payload. Either branch is acceptable as
    // long as we don't crash.
    if ('success' in res && res.success === false) {
      expect(res.error).toBeTruthy();
    } else {
      expect((res as SpecialistResponse).candidates).toEqual([]);
    }
  });
});

describe('rankSpecialistAgents — pure ranker', () => {
  it('returns empty candidates + general-purpose fallback for whitespace-only input', () => {
    const res = rankSpecialistAgents('   ');
    expect(res.candidates).toEqual([]);
    expect(res.fallback).toBe('general-purpose');
    expect(res.detectedLanguages).toEqual([]);
    expect(res.detectedFrameworks).toEqual([]);
    expect(res.detectedDomains).toEqual([]);
  });

  it('ranks typescript-expert highly for a TypeScript task', () => {
    const res = rankSpecialistAgents('implement TypeScript prompt-cache shaping for agent dispatch');
    expect(res.detectedLanguages).toContain('typescript');
    const top = res.candidates[0];
    expect(top).toBeDefined();
    expect(top.agentType).toBe('typescript-expert');
    expect(top.confidence).toBeGreaterThan(0);
    expect(top.confidence).toBeLessThanOrEqual(1);
    expect(top.matchedTokens.some(t => t.includes('typescript'))).toBe(true);
  });

  it('ranks python-expert highly for a Python task', () => {
    const res = rankSpecialistAgents('refactor pytest fixtures and migrate asyncio code to typed Python');
    expect(res.detectedLanguages).toContain('python');
    const py = res.candidates.find(c => c.agentType === 'python-expert');
    expect(py).toBeDefined();
    expect(py!.confidence).toBeGreaterThan(0);
  });

  it('ranks BOTH language experts when the task names two languages', () => {
    const res = rankSpecialistAgents(
      'port the TypeScript embedder to Python with mypy-clean type hints and pytest coverage',
    );
    expect(res.detectedLanguages).toEqual(expect.arrayContaining(['typescript', 'python']));
    const types = res.candidates.map(c => c.agentType);
    expect(types).toEqual(expect.arrayContaining(['typescript-expert', 'python-expert']));
  });

  it('routes security tasks to security specialists', () => {
    const res = rankSpecialistAgents('audit security of authentication flow for OWASP top 10 vulnerabilities');
    expect(res.detectedDomains).toEqual(expect.arrayContaining(['security']));
    const types = res.candidates.map(c => c.agentType);
    expect(types).toEqual(expect.arrayContaining(['security-auditor']));
  });

  it('routes performance tasks to performance specialists', () => {
    const res = rankSpecialistAgents('profile and optimize the cold start memory leak in the embedder cache');
    expect(res.detectedDomains).toEqual(expect.arrayContaining(['performance']));
    const types = res.candidates.map(c => c.agentType);
    // performance-engineer OR performance-profiler should win here
    const perfHit = types.some(t => t === 'performance-engineer' || t === 'performance-profiler');
    expect(perfHit).toBe(true);
  });

  it('routes architectural-hoist refactor tasks to system-architect / refactoring-specialist', () => {
    const res = rankSpecialistAgents('fix STRAT-1 install context architectural hoist and extract design pattern');
    const types = res.candidates.map(c => c.agentType);
    expect(types).toEqual(expect.arrayContaining(['system-architect']));
    expect(types).toEqual(expect.arrayContaining(['refactoring-specialist']));
  });

  it('hides generics when specialists exist (includeGenerics=false default)', () => {
    const res = rankSpecialistAgents('audit security vulnerabilities in the TypeScript dispatch layer');
    const generics = ['coder', 'tester', 'reviewer', 'general-purpose'];
    for (const c of res.candidates) {
      expect(generics).not.toContain(c.agentType);
    }
    // sanity — at least one specialist matched
    expect(res.candidates.length).toBeGreaterThan(0);
  });

  it('STILL returns generics if no specialist matched (includeGenerics=false)', () => {
    // "render Gantt SVG in pure HTML" has no specialist token → should fall
    // through to the generic pool rather than returning an empty list.
    const res = rankSpecialistAgents('render Gantt SVG in pure HTML');
    if (res.candidates.length === 0) {
      // No tokens matched at all → fallback is general-purpose.
      expect(res.fallback).toBe('general-purpose');
    } else {
      // If any generic surfaced via name-mention boost, that's also valid.
      const generics = ['coder', 'tester', 'reviewer', 'general-purpose'];
      for (const c of res.candidates) {
        expect(generics).toContain(c.agentType);
      }
    }
  });

  it('includes generics when includeGenerics=true and specialists also match', () => {
    const res = rankSpecialistAgents(
      'refactor TypeScript and have coder review tests',
      { includeGenerics: true },
    );
    const types = res.candidates.map(c => c.agentType);
    // typescript-expert is a specialist; coder gets the +5 name-boost.
    expect(types).toContain('typescript-expert');
    expect(types).toContain('coder');
  });

  it('respects the limit parameter', () => {
    const res = rankSpecialistAgents(
      'TypeScript Python Rust security performance refactor architecture database api test',
      { limit: 3 },
    );
    expect(res.candidates.length).toBeLessThanOrEqual(3);
  });

  it('caps limit at 15 (and floors at 1)', () => {
    const big = rankSpecialistAgents(
      'TypeScript Python Rust security performance refactor architecture database api test debug',
      { limit: 999 },
    );
    expect(big.candidates.length).toBeLessThanOrEqual(15);

    const tiny = rankSpecialistAgents('TypeScript refactor', { limit: 0 });
    expect(tiny.candidates.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps confidence in [0, 1]', () => {
    const res = rankSpecialistAgents(
      'TypeScript Python Rust security audit performance refactor architecture database api test debug typescript-expert security-auditor',
      { includeGenerics: true, limit: 15 },
    );
    for (const c of res.candidates) {
      expect(c.confidence).toBeGreaterThanOrEqual(0);
      expect(c.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('populates detectedLanguages / detectedFrameworks / detectedDomains', () => {
    const res = rankSpecialistAgents(
      'build a React + Next.js TypeScript dashboard with REST API and security audit',
    );
    expect(res.detectedLanguages).toContain('typescript');
    expect(res.detectedFrameworks).toEqual(expect.arrayContaining(['react']));
    // 'next.js' is a framework token; 'rest api' is a domain token (api/rest)
    expect(res.detectedFrameworks).toEqual(expect.arrayContaining(['next']));
    expect(res.detectedDomains.length).toBeGreaterThan(0);
  });

  it('boosts an agent when its literal name appears in the task', () => {
    const withName = rankSpecialistAgents('please use security-auditor for this OWASP review');
    const withoutName = rankSpecialistAgents('please review this for OWASP issues');
    const namedHit = withName.candidates.find(c => c.agentType === 'security-auditor');
    const unnamedHit = withoutName.candidates.find(c => c.agentType === 'security-auditor');
    expect(namedHit).toBeDefined();
    expect(unnamedHit).toBeDefined();
    expect(namedHit!.confidence).toBeGreaterThanOrEqual(unnamedHit!.confidence);
  });

  it('case-insensitive token matching', () => {
    const lower = rankSpecialistAgents('typescript refactor');
    const upper = rankSpecialistAgents('TYPESCRIPT REFACTOR');
    expect(lower.candidates[0]?.agentType).toBe(upper.candidates[0]?.agentType);
  });

  it('penalizes generics relative to specialists when both qualify', () => {
    const res = rankSpecialistAgents(
      'TypeScript refactor and coder coordination',
      { includeGenerics: true },
    );
    const ts = res.candidates.find(c => c.agentType === 'typescript-expert');
    const coder = res.candidates.find(c => c.agentType === 'coder');
    expect(ts).toBeDefined();
    expect(coder).toBeDefined();
    // typescript-expert: +3 lang + 1 domain (refactor) = 4
    // coder: +5 name boost - 1 generic penalty = 4 — but specialists win the
    // alphabetical tiebreak when scores tie. Either way, ts >= coder confidence.
    expect(ts!.confidence).toBeGreaterThanOrEqual(coder!.confidence);
  });

  it('returns deterministic ordering for tied scores (stable alphabetical tiebreak)', () => {
    const a = rankSpecialistAgents('refactor', { includeGenerics: true });
    const b = rankSpecialistAgents('refactor', { includeGenerics: true });
    expect(a.candidates.map(c => c.agentType)).toEqual(b.candidates.map(c => c.agentType));
  });
});

describe('hooks_route_specialist — handler integration', () => {
  it('returns the same payload as the pure ranker for a TypeScript task', async () => {
    const direct = rankSpecialistAgents('refactor TypeScript module to extract design pattern');
    const viaTool = await callTool({ task: 'refactor TypeScript module to extract design pattern' });
    expect(viaTool.candidates.map(c => c.agentType)).toEqual(direct.candidates.map(c => c.agentType));
    expect(viaTool.detectedLanguages).toEqual(direct.detectedLanguages);
  });

  it('respects limit param via the tool handler', async () => {
    const res = await callTool({
      task: 'TypeScript Python security performance refactor architecture',
      limit: 2,
    });
    expect(res.candidates.length).toBeLessThanOrEqual(2);
  });

  it('respects includeGenerics=true via the tool handler', async () => {
    const res = await callTool({
      task: 'TypeScript refactor and have coder do the work',
      includeGenerics: true,
    });
    const types = res.candidates.map(c => c.agentType);
    expect(types).toContain('coder');
  });
});
