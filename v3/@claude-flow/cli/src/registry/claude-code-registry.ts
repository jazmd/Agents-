/**
 * Claude Code Registry — Filesystem scanner for user-installed content.
 *
 * Bug 22 (root cause): Ruflo's MCP server was blind to the user's actual
 * installed agents/skills/commands/plugins. `agent_list` returned an empty
 * set, `guidance_capabilities` listed only ~16 hardcoded built-ins, and
 * `hooks_route` could not see things like `polymarket-analyzer`,
 * `kali-osint-*`, `geo-*`, `ceo`, `polybot-ops`, etc. that live on disk.
 *
 * This module scans `~/.claude/` (overridable via `CLAUDE_HOME` env var)
 * for the four content types Claude Code natively supports:
 *
 *   - **Agents**: markdown files anywhere under `agents/`. Name = filename
 *     basename. `category` = first subdir under `agents/`. Optional
 *     `description` parsed from YAML frontmatter (`description: ...`).
 *
 *   - **Skills**: subdirectories of `skills/`. Each skill's `SKILL.md`
 *     (or `skill.md` fallback) frontmatter is parsed for `description`.
 *
 *   - **Commands**: markdown files anywhere under `commands/`. Just name +
 *     path; we don't need to read them to know they exist.
 *
 *   - **Plugins**: parsed from `plugins/installed_plugins.json` — the canonical
 *     source-of-truth Claude Code itself uses.
 *
 * Results are cached in-process for 60 seconds (`CACHE_TTL_MS`) keyed on
 * the absolute claudeRoot path. Subsequent calls within that window return
 * the cached snapshot — important because every MCP tool call would
 * otherwise re-scan ~350 files.
 *
 * NO new dependencies. Uses stdlib `fs` + a 20-line YAML frontmatter
 * extractor (the only field we ever need is `description`, which is
 * always a single string after the second `---`).
 *
 * @module @claude-flow/cli/registry/claude-code-registry
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface UserAgent {
  name: string;
  path: string;
  /** First subdirectory under `agents/`, or `'root'` if at the top level. */
  category: string;
  description?: string;
}

export interface UserSkill {
  name: string;
  path: string;
  description?: string;
}

export interface UserCommand {
  name: string;
  path: string;
}

export interface UserPlugin {
  name: string;
  version?: string;
}

export interface ClaudeCodeRegistry {
  agents: UserAgent[];
  skills: UserSkill[];
  commands: UserCommand[];
  plugins: UserPlugin[];
  /** Epoch millis when this snapshot was produced. */
  scannedAt: number;
  /** Absolute root path that was scanned. */
  root: string;
}

// ── Cache ─────────────────────────────────────────────────────

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  registry: ClaudeCodeRegistry;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Clear the in-memory scan cache. Exposed for tests so each test can start
 * from a clean slate without a 60-second wait.
 */
export function clearRegistryCache(): void {
  cache.clear();
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Resolve the Claude Code root. Precedence:
 *   1. Explicit arg (used by tests + power users).
 *   2. `CLAUDE_HOME` env var.
 *   3. `~/.claude/` (the default Claude Code install location).
 */
export function resolveClaudeRoot(claudeRoot?: string): string {
  if (claudeRoot && claudeRoot.length > 0) return claudeRoot;
  const env = process.env.CLAUDE_HOME;
  if (env && env.length > 0) return env;
  return join(homedir(), '.claude');
}

/**
 * Tiny YAML-frontmatter extractor. Reads a file's leading `---\n…\n---\n`
 * block and extracts simple `key: value` pairs. Sufficient for the
 * `description: ...` field on agents/skills — we don't need to parse
 * arrays, nested objects, or multi-line strings here.
 *
 * Returns `{}` if the file has no frontmatter or can't be read. NEVER
 * throws — a malformed agent file should not crash the scanner.
 */
function parseFrontmatter(filePath: string): Record<string, string> {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return {};
  }

  // Frontmatter must start at the very beginning with `---\n`.
  if (!content.startsWith('---')) return {};

  // Find the closing `---` on its own line.
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return {};

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) return {};

  const result: Record<string, string> = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    // Match `key: value` — value may be quoted ('...' or "...").
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[m[1]] = value;
  }
  return result;
}

/** Recursive directory walker. Skips dotfiles and stops at non-existent paths. */
function walkDirectory(dir: string, predicate: (entry: string, fullPath: string) => boolean): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;

  const stack: string[] = [dir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      // Skip dotfiles/dotdirs (e.g. .git, .DS_Store).
      if (entry.name.startsWith('.')) continue;
      const full = join(cur, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && predicate(entry.name, full)) {
        out.push(full);
      }
    }
  }
  return out;
}

// ── Scanners ──────────────────────────────────────────────────

function scanAgents(claudeRoot: string): UserAgent[] {
  const agentsDir = join(claudeRoot, 'agents');
  if (!existsSync(agentsDir)) return [];

  const files = walkDirectory(agentsDir, (name) => name.endsWith('.md'));
  const agents: UserAgent[] = [];

  for (const path of files) {
    // Skip well-known non-agent docs.
    const fileName = path.split(/[\\/]/).pop() ?? '';
    if (fileName === 'MIGRATION_SUMMARY.md' || fileName === 'README.md') continue;

    const name = fileName.replace(/\.md$/, '');

    // Category = first subdir under agents/. If file is directly inside
    // agents/, category = 'root'.
    const rel = path.slice(agentsDir.length + 1);
    const parts = rel.split(/[\\/]/);
    const category = parts.length > 1 ? parts[0] : 'root';

    const fm = parseFrontmatter(path);
    // `name` field in frontmatter wins over filename when present.
    const agentName = fm.name && fm.name.length > 0 ? fm.name : name;

    agents.push({
      name: agentName,
      path,
      category,
      description: fm.description,
    });
  }
  return agents;
}

function scanSkills(claudeRoot: string): UserSkill[] {
  const skillsDir = join(claudeRoot, 'skills');
  if (!existsSync(skillsDir)) return [];

  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const skills: UserSkill[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;

    const skillDir = join(skillsDir, entry.name);
    // Look for SKILL.md (canonical) or skill.md (case-insensitive fallback).
    const candidates = ['SKILL.md', 'skill.md'];
    let skillFile: string | undefined;
    for (const c of candidates) {
      const p = join(skillDir, c);
      if (existsSync(p)) {
        skillFile = p;
        break;
      }
    }

    if (!skillFile) continue;

    const fm = parseFrontmatter(skillFile);
    skills.push({
      name: fm.name && fm.name.length > 0 ? fm.name : entry.name,
      path: skillFile,
      description: fm.description,
    });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function scanCommands(claudeRoot: string): UserCommand[] {
  const commandsDir = join(claudeRoot, 'commands');
  if (!existsSync(commandsDir)) return [];

  const files = walkDirectory(commandsDir, (name) => name.endsWith('.md'));
  return files
    .map((path) => {
      const fileName = path.split(/[\\/]/).pop() ?? '';
      return { name: fileName.replace(/\.md$/, ''), path };
    })
    .filter((c) => c.name !== 'README')
    .sort((a, b) => a.name.localeCompare(b.name));
}

function scanPlugins(claudeRoot: string): UserPlugin[] {
  const installedFile = join(claudeRoot, 'plugins', 'installed_plugins.json');
  if (!existsSync(installedFile)) return [];

  let raw: string;
  try {
    raw = readFileSync(installedFile, 'utf-8');
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  // installed_plugins.json schema varies. Common shapes:
  //   - { "plugins": [{ "name": ..., "version": ... }, ...] }
  //   - { "<plugin-name>": { "version": ... }, ... }
  //   - [ { "name": ..., "version": ... }, ... ]
  const plugins: UserPlugin[] = [];

  if (Array.isArray(parsed)) {
    for (const p of parsed) {
      if (p && typeof p === 'object' && 'name' in p && typeof (p as { name: unknown }).name === 'string') {
        plugins.push({
          name: (p as { name: string }).name,
          version:
            'version' in p && typeof (p as { version: unknown }).version === 'string'
              ? (p as { version: string }).version
              : undefined,
        });
      }
    }
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.plugins)) {
      for (const p of obj.plugins) {
        if (p && typeof p === 'object' && 'name' in p && typeof (p as { name: unknown }).name === 'string') {
          plugins.push({
            name: (p as { name: string }).name,
            version:
              'version' in p && typeof (p as { version: unknown }).version === 'string'
                ? (p as { version: string }).version
                : undefined,
          });
        }
      }
    } else {
      // Treat top-level keys as plugin names.
      for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith('_') || key === 'plugins') continue;
        let version: string | undefined;
        if (val && typeof val === 'object' && 'version' in val) {
          const v = (val as { version: unknown }).version;
          if (typeof v === 'string') version = v;
        }
        plugins.push({ name: key, version });
      }
    }
  }

  return plugins.sort((a, b) => a.name.localeCompare(b.name));
}

// ── Public API ────────────────────────────────────────────────

/**
 * Scan the Claude Code installation for user-installed content.
 *
 * Result is cached for 60s per `claudeRoot` to avoid re-scanning the
 * filesystem on every MCP call. Tests should call `clearRegistryCache()`
 * between cases.
 *
 * @param claudeRoot Optional override (defaults to `$CLAUDE_HOME` or `~/.claude/`).
 */
export async function scanClaudeCodeRegistry(claudeRoot?: string): Promise<ClaudeCodeRegistry> {
  const root = resolveClaudeRoot(claudeRoot);

  const now = Date.now();
  const cached = cache.get(root);
  if (cached && cached.expiresAt > now) {
    return cached.registry;
  }

  // If the root doesn't exist, return an empty (but well-formed) registry.
  // Cache the empty result so we don't keep stat-ing a missing path.
  if (!existsSync(root)) {
    const empty: ClaudeCodeRegistry = {
      agents: [],
      skills: [],
      commands: [],
      plugins: [],
      scannedAt: now,
      root,
    };
    cache.set(root, { registry: empty, expiresAt: now + CACHE_TTL_MS });
    return empty;
  }

  // Defensive: confirm it's a directory (someone could symlink a file).
  try {
    if (!statSync(root).isDirectory()) {
      const empty: ClaudeCodeRegistry = {
        agents: [],
        skills: [],
        commands: [],
        plugins: [],
        scannedAt: now,
        root,
      };
      cache.set(root, { registry: empty, expiresAt: now + CACHE_TTL_MS });
      return empty;
    }
  } catch {
    // stat() can throw on permission denied. Treat as empty.
  }

  const registry: ClaudeCodeRegistry = {
    agents: scanAgents(root),
    skills: scanSkills(root),
    commands: scanCommands(root),
    plugins: scanPlugins(root),
    scannedAt: now,
    root,
  };

  cache.set(root, { registry, expiresAt: now + CACHE_TTL_MS });
  return registry;
}
