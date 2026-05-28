/**
 * GAIA Tool: web_search — ADR-133-PR2 / iter-50 (CSE primary backend)
 *
 * 4-backend fallback chain (in priority order):
 *   1. Google Custom Search Engine (CSE) — highest quality; 16pp lift over Bing
 *      per JoyAgent finding (Google=75.2% vs Bing=58.8% on web-search tasks).
 *      Requires GOOGLE_AI_API_KEY + GOOGLE_CUSTOM_SEARCH_CX.
 *   2. Wikipedia REST API — exact-match fact retrieval; no key required.
 *   3. Brave Search API — requires BRAVE_API_KEY.
 *   4. DuckDuckGo HTML scrape — no key; public DDG HTML endpoint.
 *
 * Each backend falls through to the next on missing credentials, HTTP error,
 * or timeout.  The `source` field on SearchResult records which backend served.
 *
 * CLI flag --enable-cse (default: auto — true when both CSE credentials are
 * present, false otherwise).  Setting DISABLE_CSE=1 in env forces CSE off for
 * ablation.
 *
 * Design notes:
 * - Uses native Node.js https/http (no external fetch polyfill).
 * - Follows the DDG Lite HTML endpoint: https://html.duckduckgo.com/html/?q=…
 * - Parses result titles + URLs via a simple regex (no DOM parser dependency).
 * - Rate-limit aware: 1-second back-off between calls is the caller's
 *   responsibility (the agent loop enforces this in PR-3).
 * - PDF / binary detection is handled by file_read.ts, not here.
 *
 * Refs: ADR-133, ADR-135, #2156
 */

import * as https from 'node:https';
import { execSync } from 'node:child_process';
import { GaiaTool, ToolDefinition } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_RESULTS = 5;
const REQUEST_TIMEOUT_MS = 20_000;
const CSE_TIMEOUT_MS = 10_000;

// User-Agent that DDG accepts (plain browser UA).
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  /** Which backend served this result. */
  source?: string;
}

// ---------------------------------------------------------------------------
// Secret resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a secret value from env var first, then GCP Secret Manager fallback.
 * Never logs the value — returns empty string if unavailable.
 */
function resolveSecret(envVar: string, gcpSecretName: string): string {
  const envVal = process.env[envVar];
  if (envVal && envVal.trim()) return envVal.trim();

  try {
    const out = execSync(
      `gcloud secrets versions access latest --secret=${gcpSecretName} --project=ruv-dev 2>/dev/null`,
      { encoding: 'utf-8', timeout: 10_000 },
    ).trim();
    if (out) {
      // Cache in env for subsequent calls within this process.
      process.env[envVar] = out;
      return out;
    }
  } catch {
    /* secret not available — fall through */
  }

  return '';
}

// ---------------------------------------------------------------------------
// Backend 1: Google Custom Search Engine
// ---------------------------------------------------------------------------

/**
 * True when CSE credentials are present and DISABLE_CSE is not set.
 * Evaluated lazily on first call.
 */
let _cseAvailable: boolean | null = null;

export function isCseAvailable(): boolean {
  if (_cseAvailable !== null) return _cseAvailable;
  if (process.env.DISABLE_CSE === '1') {
    _cseAvailable = false;
    return false;
  }
  // Use GOOGLE_CUSTOM_SEARCH_API_KEY (dedicated CSE key) with fallback to GOOGLE_AI_API_KEY.
  // The CSE key must belong to a project with Custom Search JSON API access
  // (set up via programmablesearchengine.google.com, not just gcloud services enable).
  const apiKey =
    resolveSecret('GOOGLE_CUSTOM_SEARCH_API_KEY', 'GOOGLE_CUSTOM_SEARCH_API_KEY') ||
    resolveSecret('GOOGLE_AI_API_KEY', 'GOOGLE_AI_API_KEY');
  const cx = resolveSecret('GOOGLE_CUSTOM_SEARCH_CX', 'GOOGLE_CUSTOM_SEARCH_CX');
  _cseAvailable = Boolean(apiKey && cx);
  return _cseAvailable;
}

/** Reset the cached availability flag (used in tests). */
export function resetCseAvailabilityCache(): void {
  _cseAvailable = null;
}

async function googleCustomSearch(
  query: string,
  opts: { maxResults?: number } = {},
): Promise<SearchResult[]> {
  const apiKey =
    resolveSecret('GOOGLE_CUSTOM_SEARCH_API_KEY', 'GOOGLE_CUSTOM_SEARCH_API_KEY') ||
    resolveSecret('GOOGLE_AI_API_KEY', 'GOOGLE_AI_API_KEY');
  const cx = resolveSecret('GOOGLE_CUSTOM_SEARCH_CX', 'GOOGLE_CUSTOM_SEARCH_CX');
  if (!apiKey || !cx) return [];

  const num = Math.min(opts.maxResults ?? 5, 10);
  const params = new URLSearchParams({ key: apiKey, cx, q: query, num: String(num) });
  const urlStr = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;

  const data = await fetchJsonWithTimeout(urlStr, CSE_TIMEOUT_MS);
  const items: Array<{ title?: string; link?: string; snippet?: string }> =
    (data as any).items ?? [];

  return items.map((item) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    snippet: item.snippet ?? '',
    source: 'google-cse',
  }));
}

/** Minimal JSON fetch with abort-signal timeout (no extra deps). */
function fetchJsonWithTimeout(urlStr: string, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.get(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: { Accept: 'application/json', 'User-Agent': UA },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Google CSE HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
          } catch (e) {
            reject(e);
          }
        });
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Google CSE timeout after ${timeoutMs}ms`));
    });
  });
}

// ---------------------------------------------------------------------------
// Backend 2: Wikipedia REST API
// ---------------------------------------------------------------------------

async function wikipediaSearch(
  query: string,
  opts: { maxResults?: number } = {},
): Promise<SearchResult[]> {
  const limit = Math.min(opts.maxResults ?? 5, 10);
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const urlStr = `https://en.wikipedia.org/w/rest.php/v1/search/page?${params.toString()}`;

  const data = await fetchJsonWithTimeout(urlStr, REQUEST_TIMEOUT_MS);
  const pages: Array<{ title?: string; key?: string; description?: string; excerpt?: string }> =
    (data as any).pages ?? [];

  return pages.map((p) => ({
    title: p.title ?? p.key ?? '',
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.key ?? p.title ?? '')}`,
    snippet: p.description ?? p.excerpt ?? '',
    source: 'wikipedia',
  }));
}

// ---------------------------------------------------------------------------
// Backend 3: Brave Search API
// ---------------------------------------------------------------------------

async function braveSearch(
  query: string,
  opts: { maxResults?: number } = {},
): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];

  const count = Math.min(opts.maxResults ?? 5, 10);
  const params = new URLSearchParams({ q: query, count: String(count) });
  const urlStr = `https://api.search.brave.com/res/v1/web/search?${params.toString()}`;

  return new Promise((resolve, _reject) => {
    const url = new URL(urlStr);
    const req = https.get(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve([]);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            const hits: Array<{ title?: string; url?: string; description?: string }> =
              parsed?.web?.results ?? [];
            resolve(
              hits.map((h) => ({
                title: h.title ?? '',
                url: h.url ?? '',
                snippet: h.description ?? '',
                source: 'brave',
              })),
            );
          } catch {
            resolve([]);
          }
        });
        res.on('error', () => resolve([]));
      },
    );
    req.on('error', () => resolve([]));
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// ---------------------------------------------------------------------------
// Backend 4: DuckDuckGo HTML scrape (original; no-key fallback)
// ---------------------------------------------------------------------------

/**
 * POST to DuckDuckGo's HTML search endpoint and return the raw HTML string.
 * DDG blocks GET for automated scrapers but accepts POST form submissions.
 */
async function fetchDdgHtml(query: string): Promise<string> {
  const body = `q=${encodeURIComponent(query)}&b=&kl=&df=`;
  const bodyBytes = Buffer.from(body, 'utf-8');

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: 'html.duckduckgo.com',
      path: '/html/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': bodyBytes.length,
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    };

    const req = https.request(options, (res) => {
      // Follow a single redirect if needed (DDG occasionally redirects to /html/)
      if (
        res.statusCode !== undefined &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        const loc = res.headers.location;
        res.resume();
        // Simple follow — only handle absolute https redirects
        if (loc.startsWith('https://')) {
          https
            .get(loc, { headers: { 'User-Agent': UA } }, (r2) => {
              const chunks: Buffer[] = [];
              r2.on('data', (c: Buffer) => chunks.push(c));
              r2.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
              r2.on('error', reject);
            })
            .on('error', reject);
        } else {
          reject(new Error(`Unexpected redirect target: ${loc}`));
        }
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`DDG returned HTTP ${res.statusCode ?? 'unknown'}`));
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`web_search timeout after ${REQUEST_TIMEOUT_MS}ms`));
    });

    req.write(bodyBytes);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// HTML parser (regex-based, no DOM)
// ---------------------------------------------------------------------------

/**
 * Extract up to `maxResults` search results from DDG HTML.
 *
 * DDG's HTML result structure (stable as of 2026):
 *   <a class="result__a" href="URL">TITLE</a>
 *   <a class="result__snippet">SNIPPET</a>
 *
 * We parse with regex to avoid adding an htmlparser2 dependency.
 */
function parseDdgHtml(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Match result blocks — DDG wraps each result in <div class="result …">
  // We extract title+url from the result__a anchor, and snippet from result__snippet.
  const resultBlockRe =
    /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>)?/g;

  let match: RegExpExecArray | null;
  while ((match = resultBlockRe.exec(html)) !== null && results.length < maxResults) {
    const rawUrl = match[1] ?? '';
    const rawTitle = match[2] ?? '';
    const rawSnippet = match[3] ?? '';

    // DDG wraps URLs in //duckduckgo.com/l/?uddg=ENCODED_URL
    const url = decodeRawUrl(rawUrl);
    const title = stripHtml(rawTitle).trim();
    const snippet = stripHtml(rawSnippet).trim();

    if (url && title) {
      results.push({ title, url, snippet, source: 'ddg' });
    }
  }

  return results;
}

/**
 * Decode the DDG redirect URL back to the real URL.
 * Input example: //duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F&rut=…
 */
function decodeRawUrl(raw: string): string {
  if (raw.startsWith('//duckduckgo.com/l/')) {
    const qIdx = raw.indexOf('uddg=');
    if (qIdx !== -1) {
      const encoded = raw.slice(qIdx + 5).split('&')[0];
      try {
        return decodeURIComponent(encoded);
      } catch {
        return raw;
      }
    }
  }
  // Direct URL (some results skip the redirect)
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return raw;
}

/** Strip HTML tags and decode common entities. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// 4-backend fallback chain
// ---------------------------------------------------------------------------

/**
 * Run the 4-backend fallback chain: CSE → Wikipedia → Brave → DDG.
 * Returns results from the first backend that produces a non-empty list.
 */
async function searchWithFallback(
  query: string,
  maxResults: number,
  enableCse: boolean,
): Promise<SearchResult[]> {
  // Backend 1: Google CSE (primary when available and enabled)
  if (enableCse && isCseAvailable()) {
    try {
      const results = await googleCustomSearch(query, { maxResults });
      if (results.length > 0) {
        console.error(`[web_search] backend=google-cse results=${results.length}`);
        return results;
      }
    } catch (err) {
      console.error(`[web_search] google-cse failed: ${(err as Error).message}`);
    }
  }

  // Backend 2: Wikipedia
  try {
    const results = await wikipediaSearch(query, { maxResults });
    if (results.length > 0) {
      console.error(`[web_search] backend=wikipedia results=${results.length}`);
      return results;
    }
  } catch (err) {
    console.error(`[web_search] wikipedia failed: ${(err as Error).message}`);
  }

  // Backend 3: Brave
  try {
    const results = await braveSearch(query, { maxResults });
    if (results.length > 0) {
      console.error(`[web_search] backend=brave results=${results.length}`);
      return results;
    }
  } catch (err) {
    console.error(`[web_search] brave failed: ${(err as Error).message}`);
  }

  // Backend 4: DuckDuckGo (original no-key fallback)
  const html = await fetchDdgHtml(query);
  const results = parseDdgHtml(html, maxResults);
  console.error(`[web_search] backend=ddg results=${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// Format output for Claude
// ---------------------------------------------------------------------------

function formatResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No results found.';
  }
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    URL: ${r.url}${r.snippet ? '\n    ' + r.snippet : ''}`,
    )
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// GaiaTool implementation
// ---------------------------------------------------------------------------

export class WebSearchTool implements GaiaTool {
  readonly name = 'web_search';

  /**
   * Whether to use the Google CSE backend.
   * Defaults to `isCseAvailable()` — overridden by `--enable-cse` flag.
   */
  private readonly enableCse: boolean;

  constructor(opts: { enableCse?: boolean } = {}) {
    this.enableCse = opts.enableCse ?? isCseAvailable();
  }

  readonly definition: ToolDefinition = {
    name: 'web_search',
    description:
      'Search the web and return the top results (title, URL, snippet). ' +
      'Uses a 4-backend fallback chain: Google CSE → Wikipedia → Brave → DuckDuckGo. ' +
      'Use this when you need current information, external facts, or to verify claims.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query string.',
        },
        max_results: {
          type: 'number',
          description: `Maximum number of results to return (default: ${DEFAULT_MAX_RESULTS}, max: 10).`,
        },
      },
      required: ['query'],
    },
  };

  async execute(input: Record<string, unknown>): Promise<string> {
    const query = String(input['query'] ?? '').trim();
    if (!query) throw new Error('web_search: `query` input is required and must be non-empty.');

    const maxResults = Math.min(
      Math.max(1, Number(input['max_results'] ?? DEFAULT_MAX_RESULTS)),
      10,
    );

    const results = await searchWithFallback(query, maxResults, this.enableCse);
    return formatResults(results);
  }
}

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

/**
 * Create a WebSearchTool instance.
 *
 * @param opts.enableCse  Set true/false to force CSE on/off for ablation.
 *                        Defaults to auto-detection (CSE on if credentials present).
 */
export function createWebSearchTool(opts: { enableCse?: boolean } = {}): WebSearchTool {
  return new WebSearchTool(opts);
}
