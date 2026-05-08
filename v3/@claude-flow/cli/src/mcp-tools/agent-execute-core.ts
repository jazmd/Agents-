/**
 * Shared agent-execution core.
 *
 * Both the agent_execute MCP tool and the workflow runtime (G3) need
 * to dispatch a prompt to an agent's configured Anthropic model. This
 * module factors that path out so it's testable and reusable, and
 * keeps the wire from agent_spawn → ProviderManager (real) in one
 * place rather than duplicated.
 *
 * PROMPT-CACHE shaping (#perf-cache-2026-05): we structure every Anthropic
 * Messages call so the cacheable prefix is byte-stable across dispatches:
 *   1. tools         → cache_control breakpoint 1, ttl=1h
 *   2. systemPrompt  → cache_control breakpoint 2, ttl=1h
 *   3. project ctx   → cache_control breakpoint 3, ttl=1h
 *   4. RAG + prompt  → user message, NOT cached
 * Anthropic allows up to 4 cache breakpoints; we use 3 and leave one for
 * future use (e.g. caching the previous turn). Cache hit/miss ratios are
 * persisted to .claude-flow/cache-stats.json so `swarmops cache-stats`
 * can report rolling-100 averages. See research-roadmap/execution/PROMPT-CACHE-result.md.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getProjectCwd } from './types.js';
import {
  buildAnthropicHeaders,
  resolveClaudeCredential,
  type CredentialSource,
} from '../auth/claude-code-token.js';
import { recordCost } from '../services/cost-recorder.js';
import type { CacheTtl } from '../services/pricing.js';

const STORAGE_DIR = '.claude-flow';
const AGENT_DIR = 'agents';
const AGENT_FILE = 'store.json';
const CACHE_STATS_FILE = 'cache-stats.json';

// Below these sizes Anthropic silently no-ops the cache write. We log a
// warning the first time a segment goes below the threshold per process
// run so the operator can see why their cache isn't warming up.
// Sources: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
const MIN_CACHE_TOKENS_SONNET = 1024;
const MIN_CACHE_TOKENS_HAIKU = 2048;
// Coarse char-per-token estimate used only for the < min-cacheable warning.
// Real token count comes back from usage; we don't gate dispatches on this.
const CHARS_PER_TOKEN_EST = 4;

type ClaudeModel = 'haiku' | 'sonnet' | 'opus' | 'inherit';

export interface AgentRecord {
  agentId: string;
  agentType: string;
  status: 'idle' | 'busy' | 'terminated';
  health: number;
  taskCount: number;
  config: Record<string, unknown>;
  createdAt: string;
  domain?: string;
  model?: ClaudeModel;
  modelRoutedBy?: 'explicit' | 'router' | 'agent-booster' | 'default';
  lastResult?: Record<string, unknown>;
}

interface AgentStore {
  agents: Record<string, AgentRecord>;
  version: string;
}

function getAgentDir(): string { return join(getProjectCwd(), STORAGE_DIR, AGENT_DIR); }
function getAgentPath(): string { return join(getAgentDir(), AGENT_FILE); }
function ensureAgentDir(): void {
  const dir = getAgentDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
function loadAgentStore(): AgentStore {
  try {
    if (existsSync(getAgentPath())) return JSON.parse(readFileSync(getAgentPath(), 'utf-8'));
  } catch { /* fall through */ }
  return { agents: {}, version: '3.0.0' };
}
function saveAgentStore(store: AgentStore): void {
  ensureAgentDir();
  writeFileSync(getAgentPath(), JSON.stringify(store, null, 2), 'utf-8');
}

const MODEL_MAP: Record<string, string> = {
  haiku: 'claude-3-5-haiku-latest',
  sonnet: 'claude-3-5-sonnet-latest',
  opus: 'claude-3-opus-latest',
  inherit: 'claude-3-5-sonnet-latest',
};

export interface AnthropicCallInput {
  prompt: string;
  systemPrompt?: string;
  model?: string;          // already-resolved Anthropic model id (e.g. 'claude-3-5-sonnet-latest')
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /**
   * #perf-cache — optional structured cache shaping. When provided, these
   * become the second cache breakpoint (system) plus a dedicated third
   * breakpoint for project context (CLAUDE.md, repo facts). Dynamic content
   * (memory recall, retrieved RAG) belongs in `ragBlock`, which is appended
   * to the user message and NOT cached. If these are absent the call falls
   * back to the legacy single-breakpoint shape (still cached on `system`).
   */
  toolsBlock?: string;
  projectContext?: string;
  ragBlock?: string;
  /**
   * Gap 4 — cost telemetry attribution. All optional & backwards-compatible:
   * existing callers that don't pass these still record entries (with null
   * sessionId/stepIndex and 'unknown' agent) so the per-dispatch fallback
   * works. Pass these from the agent execution loop to unlock per-step cost
   * granularity in the trace viewer.
   */
  sessionId?: string | null;
  stepIndex?: number | null;
  agentName?: string;
  /** Cache TTL the request was shaped with. Defaults to '1h' on the wire. */
  cacheTtl?: CacheTtl;
}

/** #perf-cache — shape we send when the structured form is in use. */
interface CacheBreakdown {
  /** Tokens served from cache on this call (free-tier read price). */
  cacheReadTokens: number;
  /** Tokens written to cache on this call (1.25x or 2x for 1h TTL). */
  cacheCreationTokens: number;
  /** Plain input tokens not eligible for cache this call. */
  rawInputTokens: number;
  /** cacheReadTokens / (cacheReadTokens + cacheCreationTokens + rawInputTokens). 0 on first warm. */
  hitRatio: number;
}

export interface AnthropicCallResult {
  success: boolean;
  model?: string;
  messageId?: string;
  stopReason?: string;
  output?: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  /** #perf-cache — surfaced so callers/tests can assert cache shaping worked. */
  cache?: CacheBreakdown;
  durationMs?: number;
  error?: string;
  /**
   * Bug #24 — surfaces which credential source served the call so callers
   * (and humans reading logs) can see whether ANTHROPIC_API_KEY or the
   * Claude Code OAuth token was used. Absent on non-Anthropic providers.
   */
  _credSource?: CredentialSource;
}

// ---- #perf-cache helpers ----

/**
 * True when the resolved Anthropic model supports prompt caching with
 * the shape we emit (tools+system blocks, ttl=1h). Sonnet 3.5+, Haiku
 * 3.5+, Opus 3+ all qualify per Anthropic docs (2026-05). We err on
 * the side of opt-in: unknown models skip cache shaping rather than
 * risk a 400 from a model that doesn't accept the field.
 */
function modelSupportsPromptCache(model: string): boolean {
  return /claude-(?:3|3-5|3-7|sonnet-4|opus-4|haiku-4)/i.test(model);
}

/**
 * Min cacheable segment size (tokens) for the resolved model. Below this
 * the cache write silently no-ops — we log a warning so it's debuggable.
 */
function minCacheableTokens(model: string): number {
  return /haiku/i.test(model) ? MIN_CACHE_TOKENS_HAIKU : MIN_CACHE_TOKENS_SONNET;
}

/**
 * Crude char→token estimate, used only for the "below min cacheable" warning.
 * The real token count comes back from `usage`; this just lets us bail early.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_EST);
}

/** Per-process dedup so we don't spam a warning every dispatch. */
const warnedSmallSegments = new Set<string>();

function warnIfSegmentTooSmall(label: string, text: string, model: string): void {
  if (!text) return;
  const min = minCacheableTokens(model);
  const est = estimateTokens(text);
  if (est >= min) return;
  const key = `${label}:${model}`;
  if (warnedSmallSegments.has(key)) return;
  warnedSmallSegments.add(key);
  if (process.env.DEBUG || process.env.RUFLO_VERBOSE) {
    // eslint-disable-next-line no-console
    console.warn(
      `[cache] ${label} ~${est} tokens — below min cacheable (${min}) for ${model}; cache write will silently no-op`,
    );
  }
}

interface CacheStatsRecord {
  ts: string;
  model: string;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  rawInputTokens: number;
  hitRatio: number;
}

interface CacheStatsFile {
  version: string;
  /** Most recent first; capped at 100 entries. */
  recent: CacheStatsRecord[];
}

const CACHE_STATS_MAX = 100;

function getCacheStatsPath(): string {
  return join(getProjectCwd(), STORAGE_DIR, CACHE_STATS_FILE);
}

function appendCacheStats(rec: CacheStatsRecord): void {
  try {
    const dir = join(getProjectCwd(), STORAGE_DIR);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const p = getCacheStatsPath();
    let file: CacheStatsFile = { version: '1', recent: [] };
    if (existsSync(p)) {
      try { file = JSON.parse(readFileSync(p, 'utf-8')) as CacheStatsFile; } catch { /* corrupt → reset */ }
      if (!Array.isArray(file.recent)) file.recent = [];
    }
    file.recent.unshift(rec);
    if (file.recent.length > CACHE_STATS_MAX) file.recent.length = CACHE_STATS_MAX;
    writeFileSync(p, JSON.stringify(file, null, 2), 'utf-8');
  } catch {
    // Stats are non-critical. Never fail a dispatch because we couldn't write the file.
  }
}

function logCacheUsage(model: string, breakdown: CacheBreakdown): void {
  appendCacheStats({
    ts: new Date().toISOString(),
    model,
    cacheReadTokens: breakdown.cacheReadTokens,
    cacheCreationTokens: breakdown.cacheCreationTokens,
    rawInputTokens: breakdown.rawInputTokens,
    hitRatio: breakdown.hitRatio,
  });
  if (process.env.DEBUG || process.env.RUFLO_VERBOSE) {
    // eslint-disable-next-line no-console
    console.log(
      `[cache] model=${model} read=${breakdown.cacheReadTokens} ` +
      `write=${breakdown.cacheCreationTokens} raw=${breakdown.rawInputTokens} ` +
      `hitRatio=${(breakdown.hitRatio * 100).toFixed(1)}%`,
    );
  }
}

/**
 * Build the `system` payload as either a single string (legacy) or an
 * array of cache-controlled blocks. We only emit the structured form
 * when (a) the model supports caching and (b) at least one of the
 * structured fields is present — otherwise the existing single-string
 * path remains, preserving wire compat for callers that still pass
 * `systemPrompt` only.
 */
function buildSystemPayload(
  input: AnthropicCallInput,
  model: string,
): string | Array<Record<string, unknown>> | undefined {
  const useStructured =
    modelSupportsPromptCache(model) &&
    (input.toolsBlock || input.projectContext || input.systemPrompt);

  if (!useStructured) {
    return input.systemPrompt;
  }

  const blocks: Array<Record<string, unknown>> = [];
  // Breakpoint 1 — tools (rarely changes, smallest churn surface)
  if (input.toolsBlock) {
    warnIfSegmentTooSmall('tools', input.toolsBlock, model);
    blocks.push({
      type: 'text',
      text: input.toolsBlock,
      cache_control: { type: 'ephemeral', ttl: '1h' },
    });
  }
  // Breakpoint 2 — system prompt (per-agent stable)
  if (input.systemPrompt) {
    warnIfSegmentTooSmall('system', input.systemPrompt, model);
    blocks.push({
      type: 'text',
      text: input.systemPrompt,
      cache_control: { type: 'ephemeral', ttl: '1h' },
    });
  }
  // Breakpoint 3 — project context / CLAUDE.md (per-project stable)
  if (input.projectContext) {
    warnIfSegmentTooSmall('projectContext', input.projectContext, model);
    blocks.push({
      type: 'text',
      text: input.projectContext,
      cache_control: { type: 'ephemeral', ttl: '1h' },
    });
  }
  return blocks.length > 0 ? blocks : undefined;
}

/**
 * Build the user-message content. RAG goes here (NOT cached) so that a
 * change in retrieved memory doesn't bust the system-prompt cache. The
 * actual user prompt is appended last so the model sees RAG as context
 * for the request.
 */
function buildUserContent(input: AnthropicCallInput): string {
  if (!input.ragBlock) return input.prompt;
  return `${input.ragBlock}\n\n---\n\n${input.prompt}`;
}

/**
 * Augment the headers built by `buildAnthropicHeaders` with the
 * `extended-cache-ttl-2025-04-11` beta when we're sending 1h-TTL
 * cache_control markers. We append (not overwrite) so the existing
 * `oauth-2025-04-20` beta on the OAuth path stays intact — that's
 * what the existing tests assert.
 */
function withCacheBeta(
  headers: Record<string, string>,
  needExtendedTtl: boolean,
): Record<string, string> {
  if (!needExtendedTtl) return headers;
  const existing = headers['anthropic-beta'];
  const beta = 'extended-cache-ttl-2025-04-11';
  return {
    ...headers,
    'anthropic-beta': existing ? `${existing},${beta}` : beta,
  };
}

/**
 * Generic Anthropic Messages API call. No agent registry coupling — used
 * by agent_execute (with the agent's configured model) and by the WASM
 * agent runtime (G4) when the bundled WASM only echoes input.
 *
 * Bug #24 — credential resolution prefers a Claude Code OAuth token when
 * ruflo runs on the same machine as Claude Code (env var → macOS Keychain
 * → ~/.claude/.credentials.json), and only falls back to ANTHROPIC_API_KEY
 * when no OAuth token is available. The credential source is surfaced via
 * `_credSource` on the result so callers can see which path served the call.
 *
 * #1725 — falls back to Ollama Cloud (Tier-2, OpenAI-compat) when no
 * Anthropic credential is available and OLLAMA_API_KEY is present, or when
 * RUFLO_PROVIDER=ollama is explicitly set. Response shape is normalized
 * to the Anthropic-flavored AnthropicCallResult so existing callers
 * don't need to know which provider answered.
 */
export async function callAnthropicMessages(input: AnthropicCallInput): Promise<AnthropicCallResult> {
  const explicitProvider = (process.env.RUFLO_PROVIDER || '').toLowerCase();
  const ollamaKey = process.env.OLLAMA_API_KEY;
  const cred = resolveClaudeCredential();
  const useOllama =
    explicitProvider === 'ollama' || (cred.source === 'none' && !!ollamaKey);

  if (useOllama && ollamaKey) {
    return callOllamaCompat({ ...input, apiKey: ollamaKey });
  }
  if (cred.source === 'none') {
    return {
      success: false,
      error:
        'No Anthropic credentials. Either run from Claude Code (auto-detected via ' +
        'CLAUDE_CODE_OAUTH_TOKEN, macOS Keychain, or ~/.claude/.credentials.json) ' +
        'or set ANTHROPIC_API_KEY. Tier-2 Ollama Cloud also works via OLLAMA_API_KEY (#1725).',
    };
  }
  const model = input.model || 'claude-3-5-sonnet-latest';
  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), input.timeoutMs || 60000);
    // #perf-cache — only structured `system` blocks need the 1h-TTL beta.
    // Legacy single-string `system` is plain prompt; no beta required.
    const systemPayload = buildSystemPayload(input, model);
    const usingStructured = Array.isArray(systemPayload);
    const headers = withCacheBeta(buildAnthropicHeaders(cred), usingStructured);
    const userContent = buildUserContent(input);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        max_tokens: input.maxTokens || 1024,
        temperature: typeof input.temperature === 'number' ? input.temperature : 0.7,
        ...(systemPayload !== undefined ? { system: systemPayload } : {}),
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errText = await res.text().catch(() => '<unreadable error body>');
      return {
        success: false,
        model,
        error: `Anthropic API error ${res.status}: ${errText.slice(0, 400)}`,
        _credSource: cred.source,
      };
    }
    const data = await res.json() as {
      id: string;
      model: string;
      content: Array<{ type: string; text?: string }>;
      stop_reason: string;
      usage: {
        input_tokens: number;
        output_tokens: number;
        // #perf-cache — present when the request used cache_control markers.
        // Both fields can be undefined (legacy non-cached calls) or 0.
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
      };
    };
    const textOut = data.content
      .filter(c => c.type === 'text' && typeof c.text === 'string')
      .map(c => c.text as string)
      .join('');
    const cacheRead = data.usage.cache_read_input_tokens ?? 0;
    const cacheWrite = data.usage.cache_creation_input_tokens ?? 0;
    const rawIn = data.usage.input_tokens;
    const denom = cacheRead + cacheWrite + rawIn;
    const breakdown: CacheBreakdown = {
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheWrite,
      rawInputTokens: rawIn,
      hitRatio: denom > 0 ? cacheRead / denom : 0,
    };
    if (usingStructured) {
      // Only persist stats when we actually shaped the prompt for caching.
      // Avoids polluting the file with non-cacheable legacy calls.
      logCacheUsage(data.model, breakdown);
    }
    // Gap 4 — record cost telemetry. Cost-recorder swallows its own failures;
    // a broken cost log MUST NOT break the dispatch. We always record (even
    // for legacy non-cached calls) so per-dispatch USD attribution works
    // independently of cache shaping.
    await recordCost({
      sessionId: input.sessionId ?? null,
      stepIndex: input.stepIndex ?? null,
      agent: input.agentName ?? 'unknown',
      model: data.model,
      cacheTtl: input.cacheTtl ?? '1h',
      usage: {
        input: data.usage.input_tokens,
        output: data.usage.output_tokens,
        cacheRead,
        cacheCreation: cacheWrite,
      },
    });
    return {
      success: true,
      model: data.model,
      messageId: data.id,
      stopReason: data.stop_reason,
      output: textOut,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      cache: breakdown,
      durationMs: Date.now() - startedAt,
      _credSource: cred.source,
    };
  } catch (err) {
    return {
      success: false,
      model,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startedAt,
      _credSource: cred.source,
    };
  }
}

/**
 * Ollama Cloud / OpenAI-compat provider — Tier-2 routing per ADR-026 + #1725.
 *
 * Endpoint: https://ollama.com/v1/chat/completions
 * Auth: Authorization: Bearer <OLLAMA_API_KEY>
 *
 * Translates the Anthropic-flavored input shape onto OpenAI chat-completions
 * and translates the response back so callers never see provider-specific
 * fields. Logical model names are mapped to Ollama Cloud defaults:
 *   - 'haiku'  / 'sonnet'  → 'gpt-oss:120b-cloud' (sensible single default)
 *   - 'opus'              → 'gpt-oss:120b-cloud' (no opus tier on Ollama)
 *   - explicit 'ollama:<model>' or bare provider-native name → passed through
 */
async function callOllamaCompat(
  input: AnthropicCallInput & { apiKey: string },
): Promise<AnthropicCallResult> {
  const model = resolveOllamaModel(input.model);
  const startedAt = Date.now();
  // OLLAMA_BASE_URL lets users point at local/self-hosted endpoints
  // (e.g. http://ruvultra:11434, http://localhost:11434) instead of
  // Ollama Cloud. Default is the public cloud endpoint.
  const base = (process.env.OLLAMA_BASE_URL || 'https://ollama.com').replace(/\/+$/, '');
  const url = `${base}/v1/chat/completions`;
  // Self-hosted endpoints typically don't need an Authorization header
  // (the daemon binds to 11434 with no auth by default), but Ollama Cloud
  // does. Send the bearer when the key is non-empty AND looks cloud-shaped.
  const sendAuth = input.apiKey && input.apiKey !== 'local';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), input.timeoutMs || 60000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(sendAuth ? { Authorization: `Bearer ${input.apiKey}` } : {}),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: input.maxTokens || 1024,
        temperature: typeof input.temperature === 'number' ? input.temperature : 0.7,
        messages: [
          ...(input.systemPrompt
            ? [{ role: 'system' as const, content: input.systemPrompt }]
            : []),
          { role: 'user' as const, content: input.prompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errText = await res.text().catch(() => '<unreadable error body>');
      return { success: false, model, error: `Ollama API error ${res.status} at ${url}: ${errText.slice(0, 400)}` };
    }
    const data = (await res.json()) as {
      id?: string;
      model?: string;
      choices: Array<{
        message: { role: string; content: string };
        finish_reason?: string;
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
    const textOut = data.choices?.[0]?.message?.content ?? '';
    const usage = data.usage ?? {};
    return {
      success: true,
      model: data.model ?? model,
      messageId: data.id ?? `ollama-${Date.now()}`,
      stopReason: data.choices?.[0]?.finish_reason ?? 'end_turn',
      output: textOut,
      usage: {
        inputTokens: usage.prompt_tokens ?? 0,
        outputTokens: usage.completion_tokens ?? 0,
        totalTokens: usage.total_tokens ?? 0,
      },
      durationMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      success: false,
      model,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startedAt,
    };
  }
}

function resolveOllamaModel(input: string | undefined): string {
  const DEFAULT = 'gpt-oss:120b-cloud';
  if (!input) return DEFAULT;
  // Logical → cloud default
  if (input === 'haiku' || input === 'sonnet' || input === 'opus' || input === 'inherit') {
    return DEFAULT;
  }
  // Explicit provider prefix
  if (input.startsWith('ollama:')) return input.slice('ollama:'.length);
  // Bare name with cloud suffix (e.g. 'llama3:70b-cloud') passes through
  return input;
}

/**
 * Resolve a model identifier to an Anthropic model ID. Accepts:
 * - logical names: 'haiku', 'sonnet', 'opus', 'inherit'
 * - prefixed: 'anthropic:claude-3-5-sonnet-latest'
 * - direct: 'claude-3-5-sonnet-latest'
 */
export function resolveAnthropicModel(input: string | undefined): string {
  if (!input) return 'claude-3-5-sonnet-latest';
  if (input in MODEL_MAP) return MODEL_MAP[input];
  if (input.startsWith('anthropic:')) return input.slice('anthropic:'.length);
  return input;
}

export interface AgentExecuteInput {
  agentId: string;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /**
   * #perf-cache — caller-supplied tools/RAG that should NOT be merged
   * into the system prompt (RAG must stay below the cache boundary).
   * Caller is responsible for providing byte-stable `toolsBlock` for
   * cache hits to land. `ragBlock` is appended to the user message.
   */
  toolsBlock?: string;
  ragBlock?: string;
}

export interface AgentExecuteResult {
  success: boolean;
  agentId: string;
  model?: string;
  messageId?: string;
  stopReason?: string;
  output?: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  /** #perf-cache — same shape as AnthropicCallResult.cache. */
  cache?: { cacheReadTokens: number; cacheCreationTokens: number; rawInputTokens: number; hitRatio: number };
  durationMs?: number;
  error?: string;
  remediation?: string;
  /**
   * Bug #24 — surfaces which credential source served the call so callers
   * (and humans reading logs) can see whether ANTHROPIC_API_KEY or the
   * Claude Code OAuth token was used.
   */
  _credSource?: CredentialSource;
}

/**
 * #perf-cache — Read CLAUDE.md from the project root once per process,
 * memoized. The whole point of breakpoint 3 is byte-stability across
 * dispatches; reading on every call would also be cheap (~kB) but the
 * memo guarantees that if we DO get an updated file mid-process we
 * notice on next process start, not mid-loop. Per-session stability
 * is what the cache layer rewards.
 *
 * We load both `./CLAUDE.md` (project) and `./CLAUDE.local.md` (overlay
 * if present) and concatenate stably (project first, overlay second).
 * Returns `undefined` if neither exists — callers will then send only
 * the system-prompt breakpoint, still benefiting from cache breakpoints
 * 1 and 2.
 *
 * Stability guarantees:
 *   - No timestamps inserted (CLAUDE.md generator is already deterministic)
 *   - Concatenation order is fixed (project, then local overlay)
 *   - File contents are read as-is — operator owns byte-stability of CLAUDE.md
 */
let claudeMdCache: { value: string | undefined; loadedAt: number } | null = null;
function readProjectCacheContext(): string | undefined {
  if (claudeMdCache) return claudeMdCache.value;
  const cwd = getProjectCwd();
  const parts: string[] = [];
  for (const fname of ['CLAUDE.md', 'CLAUDE.local.md']) {
    try {
      const p = join(cwd, fname);
      if (existsSync(p)) {
        const content = readFileSync(p, 'utf-8');
        // Trim trailing whitespace only — leading/internal whitespace is part
        // of the byte-stable cache key. Don't normalize line endings either.
        if (content.trim().length > 0) {
          parts.push(`<!-- source: ${fname} -->\n${content.replace(/\s+$/, '')}`);
        }
      }
    } catch {
      // Read failure → omit; never poison the cache key with an error string.
    }
  }
  const value = parts.length > 0 ? parts.join('\n\n') : undefined;
  claudeMdCache = { value, loadedAt: Date.now() };
  return value;
}

export async function executeAgentTask(input: AgentExecuteInput): Promise<AgentExecuteResult> {
  // Bug #24 — prefer Claude Code OAuth over ANTHROPIC_API_KEY so users
  // running Claude Code locally don't need a second credential.
  const cred = resolveClaudeCredential();
  if (cred.source === 'none') {
    return {
      success: false,
      agentId: input.agentId,
      error:
        'No Anthropic credentials. Either run from Claude Code (auto-detected via ' +
        'CLAUDE_CODE_OAUTH_TOKEN, macOS Keychain entry "Claude Code-credentials", or ' +
        '~/.claude/.credentials.json) or set ANTHROPIC_API_KEY.',
      remediation:
        'If Claude Code is installed, ensure ~/.claude/.credentials.json exists and ' +
        'contains claudeAiOauth.accessToken. Otherwise export ANTHROPIC_API_KEY=sk-ant-... ' +
        'before invoking agent_execute.',
    };
  }

  const store = loadAgentStore();
  const agent = store.agents[input.agentId];
  if (!agent) {
    return { success: false, agentId: input.agentId, error: 'Agent not found', _credSource: cred.source };
  }
  if (agent.status === 'terminated') {
    return { success: false, agentId: input.agentId, error: 'Agent has been terminated', _credSource: cred.source };
  }

  const anthropicModel = MODEL_MAP[agent.model || 'sonnet'] || 'claude-3-5-sonnet-latest';
  const systemPrompt = input.systemPrompt ||
    `You are a ${agent.agentType} agent operating as part of a Ruflo swarm. ` +
    `Agent ID: ${input.agentId}. Domain: ${agent.domain ?? 'general'}. ` +
    `Respond directly and stay focused on the task. If you need information you don't have, state that explicitly.`;

  agent.status = 'busy';
  agent.taskCount = (agent.taskCount || 0) + 1;
  saveAgentStore(store);

  const startedAt = Date.now();

  try {
    const controller = new AbortController();
    const timeoutMs = input.timeoutMs || 60000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // #perf-cache — assemble the structured 3-breakpoint shape:
    //   1. tools (caller-supplied; usually empty for agent_execute today)
    //   2. systemPrompt (per-agent stable)
    //   3. CLAUDE.md + CLAUDE.local.md (per-project stable, byte-cached)
    // RAG goes below the cache via input.ragBlock; the actual user prompt
    // is appended last in buildUserContent().
    const projectContext = readProjectCacheContext();
    const callInput: AnthropicCallInput = {
      prompt: input.prompt,
      systemPrompt,
      model: anthropicModel,
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      timeoutMs,
      toolsBlock: input.toolsBlock,
      projectContext,
      ragBlock: input.ragBlock,
    };
    const systemPayload = buildSystemPayload(callInput, anthropicModel);
    const usingStructured = Array.isArray(systemPayload);
    const headers = withCacheBeta(buildAnthropicHeaders(cred), usingStructured);
    const userContent = buildUserContent(callInput);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: anthropicModel,
        max_tokens: input.maxTokens || 1024,
        temperature: typeof input.temperature === 'number' ? input.temperature : 0.7,
        ...(systemPayload !== undefined ? { system: systemPayload } : {}),
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => '<unreadable error body>');
      agent.status = 'idle';
      saveAgentStore(store);
      return {
        success: false,
        agentId: input.agentId,
        model: anthropicModel,
        error: `Anthropic API error ${res.status}: ${errText.slice(0, 400)}`,
        _credSource: cred.source,
      };
    }

    const data = await res.json() as {
      id: string;
      model: string;
      content: Array<{ type: string; text?: string }>;
      stop_reason: string;
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
      };
    };

    const textOut = data.content
      .filter(c => c.type === 'text' && typeof c.text === 'string')
      .map(c => c.text as string)
      .join('');

    const cacheRead = data.usage.cache_read_input_tokens ?? 0;
    const cacheWrite = data.usage.cache_creation_input_tokens ?? 0;
    const rawIn = data.usage.input_tokens;
    const denom = cacheRead + cacheWrite + rawIn;
    const cacheBreakdown = {
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheWrite,
      rawInputTokens: rawIn,
      hitRatio: denom > 0 ? cacheRead / denom : 0,
    };
    if (usingStructured) logCacheUsage(data.model, cacheBreakdown);

    // Gap 4 — cost telemetry for the agent-execute path. We use the agentId
    // as the recorded agent name so trace consumers can group by named agent.
    // sessionId/stepIndex aren't threaded through agent_execute today (that's
    // the per-step granularity follow-up); the per-dispatch fallback still
    // gives `swarmops cost stats` correct totals.
    await recordCost({
      sessionId: null,
      stepIndex: null,
      agent: input.agentId,
      model: data.model,
      cacheTtl: '1h',
      usage: {
        input: data.usage.input_tokens,
        output: data.usage.output_tokens,
        cacheRead,
        cacheCreation: cacheWrite,
      },
    });

    const result: AgentExecuteResult = {
      success: true,
      agentId: input.agentId,
      messageId: data.id,
      model: data.model,
      stopReason: data.stop_reason,
      output: textOut,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      cache: cacheBreakdown,
      durationMs: Date.now() - startedAt,
      _credSource: cred.source,
    };

    agent.status = 'idle';
    agent.lastResult = result as unknown as Record<string, unknown>;
    saveAgentStore(store);

    return result;
  } catch (err) {
    agent.status = 'idle';
    saveAgentStore(store);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      agentId: input.agentId,
      model: anthropicModel,
      error: `agent_execute failed: ${msg}`,
      durationMs: Date.now() - startedAt,
      _credSource: cred.source,
    };
  }
}
