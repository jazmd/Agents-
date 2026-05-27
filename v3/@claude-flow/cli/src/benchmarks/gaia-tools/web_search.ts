/**
 * GAIA Tool: web_search — ADR-133-PR2 / ADR-135
 *
 * Multi-backend web search with Google Custom Search as the primary engine.
 *
 * Backend priority (iter 30 finding — HAL uses Google, JoyAgent shows +16pp Google vs Bing):
 *   1. Google Custom Search API  — best quality, needs GOOGLE_CUSTOM_SEARCH_API_KEY + _CX
 *   2. Wikipedia REST API        — reliable structured fallback for factual queries
 *   3. DuckDuckGo HTML scrape    — zero-creds fallback (original iter-21 backend)
 *
 * Credential resolution for Google (in order):
 *   a. GOOGLE_CUSTOM_SEARCH_API_KEY + GOOGLE_CUSTOM_SEARCH_CX env vars
 *   b. gcloud secrets versions access (ruv-dev project) — async exec, non-blocking
 *   c. If either is absent → skip Google, fall through to Wikipedia
 *
 * Fallback semantics:
 *   - If Google credentials are missing → silently skip, no warning
 *   - If Google returns 0 results or throws → warn + fall through to Wikipedia
 *   - If Wikipedia returns 0 results or throws → fall through to DDG
 *   - If DDG throws → propagate error to caller
 *
 * Backend selection is logged to stderr so L1 run logs show which engine served each query.
 *
 * Refs: ADR-133, ADR-135, iter 30 research, #2156
 */

import * as https from 'node:https';
import { GaiaTool, ToolDefinition } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_RESULTS = 5;
const REQUEST_TIMEOUT_MS = 20_000;
const GOOGLE_CSE_BASE = 'https://customsearch.googleapis.com/customsearch/v1';
const WIKIPEDIA_SEARCH_BASE = 'https://en.wikipedia.org/w/api.php';
const DDG_HTML_URL = 'https://html.duckduckgo.com/html/';

/** User-Agent accepted by DDG and Wikipedia. */
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface GoogleCseCredentials {
  apiKey: string;
  cx: string;
}

// ---------------------------------------------------------------------------
// Google Custom Search — credential resolution
// ---------------------------------------------------------------------------

/**
 * Resolve Google Custom Search credentials.
 *
 * Returns null when credentials are unavailable — callers must fall through.
 * Never throws (all errors are caught and collapsed to null).
 */
export async function resolveGoogleCustomSearchCredentials(): Promise<GoogleCseCredentials | null> {
  // 1. Env vars — fastest path, used in test mocks
  const envKey = process.env['GOOGLE_CUSTOM_SEARCH_API_KEY'];
  const envCx = process.env['GOOGLE_CUSTOM_SEARCH_CX'];
  if (envKey && envCx) {
    return { apiKey: envKey, cx: envCx };
  }

  // 2. GCP Secrets Manager fallback (matches existing resolveApiKey pattern in gaia-bench.ts)
  //    execSync in a try/catch so missing gcloud binary or missing secret → return null
  try {
    const { execSync } = await import('node:child_process');
    const apiKey = execSync(
      'gcloud secrets versions access latest --secret=GOOGLE_CUSTOM_SEARCH_API_KEY --project=ruv-dev 2>/dev/null',
      { encoding: 'utf-8', timeout: 5_000 },
    ).trim();
    const cx = execSync(
      'gcloud secrets versions access latest --secret=GOOGLE_CUSTOM_SEARCH_CX --project=ruv-dev 2>/dev/null',
      { encoding: 'utf-8', timeout: 5_000 },
    ).trim();
    if (apiKey && cx) {
      return { apiKey, cx };
    }
  } catch {
    // gcloud not installed, project unreachable, or secrets not yet created → fall through
  }

  return null; // Signal: Google not configured — use fallback chain
}

// ---------------------------------------------------------------------------
// Backend 1: Google Custom Search
// ---------------------------------------------------------------------------

interface GoogleCseItem {
  title: string;
  link: string;
  snippet?: string;
}

interface GoogleCseResponse {
  items?: GoogleCseItem[];
  error?: { message: string; code: number };
}

/**
 * Search via Google Custom Search JSON API.
 *
 * Throws on HTTP errors or API-level errors so caller can fall through.
 */
export async function searchGoogleCustomSearch(
  query: string,
  creds: GoogleCseCredentials,
  maxResults: number,
  timeoutMs: number,
): Promise<SearchResult[]> {
  const url =
    `${GOOGLE_CSE_BASE}?key=${encodeURIComponent(creds.apiKey)}` +
    `&cx=${encodeURIComponent(creds.cx)}` +
    `&q=${encodeURIComponent(query)}` +
    `&num=${Math.min(maxResults, 10)}`;

  const resp = await fetchJson<GoogleCseResponse>(url, timeoutMs);

  if (resp.error) {
    throw new Error(`Google CSE API error ${resp.error.code}: ${resp.error.message}`);
  }

  return (resp.items ?? []).map((item) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet ?? '',
  }));
}

// ---------------------------------------------------------------------------
// Backend 2: Wikipedia REST Search
// ---------------------------------------------------------------------------

interface WikipediaSearchResult {
  title: string;
  pageid: number;
  snippet: string;
}

interface WikipediaSearchResponse {
  query?: {
    search?: WikipediaSearchResult[];
  };
}

/**
 * Search Wikipedia via the MediaWiki action API.
 * Returns snippet-level results (not full article text).
 */
export async function searchWikipedia(
  query: string,
  maxResults: number,
  timeoutMs: number,
): Promise<SearchResult[]> {
  const url =
    `${WIKIPEDIA_SEARCH_BASE}?action=query&list=search` +
    `&srsearch=${encodeURIComponent(query)}` +
    `&srlimit=${maxResults}` +
    `&format=json&origin=*`;

  const resp = await fetchJson<WikipediaSearchResponse>(url, timeoutMs);
  const hits = resp.query?.search ?? [];

  return hits.map((hit) => ({
    title: hit.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
    snippet: stripHtml(hit.snippet),
  }));
}

// ---------------------------------------------------------------------------
// Backend 3: DuckDuckGo HTML scrape (original iter-21 backend, preserved)
// ---------------------------------------------------------------------------

/** POST to DDG's HTML search endpoint and return the raw HTML string. */
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
      if (
        res.statusCode !== undefined &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        const loc = res.headers.location;
        res.resume();
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

/**
 * Extract up to `maxResults` search results from DDG HTML.
 *
 * DDG's HTML result structure (stable as of 2026):
 *   <a class="result__a" href="URL">TITLE</a>
 *   <a class="result__snippet">SNIPPET</a>
 */
function parseDdgHtml(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  const resultBlockRe =
    /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>)?/g;

  let match: RegExpExecArray | null;
  while ((match = resultBlockRe.exec(html)) !== null && results.length < maxResults) {
    const rawUrl = match[1] ?? '';
    const rawTitle = match[2] ?? '';
    const rawSnippet = match[3] ?? '';

    const url = decodeRawUrl(rawUrl);
    const title = stripHtml(rawTitle).trim();
    const snippet = stripHtml(rawSnippet).trim();

    if (url && title) {
      results.push({ title, url, snippet });
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
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return raw;
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

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

/**
 * Fetch a JSON endpoint via native https.get, with a timeout.
 * Follows a single redirect if needed.
 */
function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json',
        },
      },
      (res) => {
        // Follow one redirect
        if (
          res.statusCode !== undefined &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          const loc = res.headers.location;
          if (loc.startsWith('https://')) {
            fetchJson<T>(loc, timeoutMs).then(resolve, reject);
          } else {
            reject(new Error(`fetchJson unexpected redirect: ${loc}`));
          }
          return;
        }

        if (res.statusCode !== 200) {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () =>
            reject(
              new Error(
                `HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString('utf-8').slice(0, 200)}`,
              ),
            ),
          );
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')) as T);
          } catch (e) {
            reject(new Error(`fetchJson JSON parse error: ${String(e)}`));
          }
        });
        res.on('error', reject);
      },
    );

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`fetchJson timeout after ${timeoutMs}ms`));
    });
  });
}

// ---------------------------------------------------------------------------
// Format output for Claude
// ---------------------------------------------------------------------------

function formatResults(results: SearchResult[], backend: string): string {
  if (results.length === 0) {
    return 'No results found.';
  }
  const header = `[web_search backend: ${backend}]`;
  const body = results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    URL: ${r.url}${r.snippet ? '\n    ' + r.snippet : ''}`,
    )
    .join('\n\n');
  return `${header}\n\n${body}`;
}

// ---------------------------------------------------------------------------
// Test hooks — allow smoke tests to inject stub backends without module patching.
// These are only used when set; production code leaves them undefined.
// ---------------------------------------------------------------------------

/**
 * Mutable backend overrides for smoke testing.
 *
 * Set these before calling `tool.execute()` in tests, then restore to `undefined`.
 * Example:
 *   webSearchTestHooks.googleSearch = async () => [{ title:'T', url:'U', snippet:'S' }];
 *   webSearchTestHooks.credentialResolver = async () => ({ apiKey:'k', cx:'c' });
 *   // ... after test ...
 *   delete webSearchTestHooks.googleSearch;
 */
export const webSearchTestHooks: {
  credentialResolver?: () => Promise<GoogleCseCredentials | null>;
  googleSearch?: (
    query: string,
    creds: GoogleCseCredentials,
    maxResults: number,
    timeoutMs: number,
  ) => Promise<SearchResult[]>;
  wikipediaSearch?: (
    query: string,
    maxResults: number,
    timeoutMs: number,
  ) => Promise<SearchResult[]>;
  ddgFetch?: (query: string) => Promise<string>;
} = {};

// ---------------------------------------------------------------------------
// Orchestrated search: try backends in priority order
// ---------------------------------------------------------------------------

/**
 * Execute a web search using the best available backend.
 *
 * Priority:
 *   1. Google Custom Search (if GOOGLE_CUSTOM_SEARCH_API_KEY + _CX available)
 *   2. Wikipedia REST Search
 *   3. DuckDuckGo HTML scrape
 *
 * Each backend failure (0 results or exception) is logged to stderr and
 * falls through to the next. DDG is the final backend and propagates errors.
 *
 * In test environments, set `webSearchTestHooks.*` to inject stub backends
 * without any module-level monkey-patching.
 */
async function executeWebSearch(query: string, maxResults: number): Promise<string> {
  const resolveCredsFn = webSearchTestHooks.credentialResolver ?? resolveGoogleCustomSearchCredentials;
  const googleSearchFn = webSearchTestHooks.googleSearch ?? searchGoogleCustomSearch;
  const wikipediaSearchFn = webSearchTestHooks.wikipediaSearch ?? searchWikipedia;
  const ddgFetchFn = webSearchTestHooks.ddgFetch ?? fetchDdgHtml;

  // --- Backend 1: Google Custom Search ---
  const googleCreds = await resolveCredsFn();
  if (googleCreds) {
    try {
      const results = await googleSearchFn(query, googleCreds, maxResults, REQUEST_TIMEOUT_MS);
      if (results.length > 0) {
        process.stderr.write(`[web_search] backend=google query=${JSON.stringify(query)}\n`);
        return formatResults(results, 'google-cse');
      }
      process.stderr.write(`[web_search] Google CSE returned 0 results, falling back\n`);
    } catch (err) {
      process.stderr.write(
        `[web_search] Google CSE failed: ${(err as Error).message}, falling back to wikipedia\n`,
      );
    }
  }

  // --- Backend 2: Wikipedia ---
  try {
    const results = await wikipediaSearchFn(query, maxResults, REQUEST_TIMEOUT_MS);
    if (results.length > 0) {
      process.stderr.write(`[web_search] backend=wikipedia query=${JSON.stringify(query)}\n`);
      return formatResults(results, 'wikipedia');
    }
    process.stderr.write(`[web_search] Wikipedia returned 0 results, falling back to ddg\n`);
  } catch (err) {
    process.stderr.write(
      `[web_search] Wikipedia failed: ${(err as Error).message}, falling back to ddg\n`,
    );
  }

  // --- Backend 3: DuckDuckGo (original iter-21 backend) ---
  process.stderr.write(`[web_search] backend=ddg query=${JSON.stringify(query)}\n`);
  const html = await ddgFetchFn(query);
  const results = parseDdgHtml(html, maxResults);
  return formatResults(results, 'ddg');
}

// ---------------------------------------------------------------------------
// GaiaTool implementation
// ---------------------------------------------------------------------------

export class WebSearchTool implements GaiaTool {
  readonly name = 'web_search';

  readonly definition: ToolDefinition = {
    name: 'web_search',
    description:
      'Search the web and return the top results (title, URL, snippet). ' +
      'Uses Google Custom Search when credentials are available (best quality), ' +
      'otherwise falls back to Wikipedia or DuckDuckGo. ' +
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

    return executeWebSearch(query, maxResults);
  }
}

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

export function createWebSearchTool(): WebSearchTool {
  return new WebSearchTool();
}
