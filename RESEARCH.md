# RESEARCH — `fix/global-install-and-learning-loop`

All paths relative to the repo root `/Users/h4ckm1n/dev/ruflo/` unless absolute.
Line numbers verified with `grep -n` against the source files at the time of
investigation. Each bug section ends with a recommended fix shape sized for
the upstream PR.

---

## Bug 1 — CWD-relative paths in helpers (memory.js, session.js)

- **Source (template that emits `.claude/helpers/memory.js`)**:
  `v3/@claude-flow/cli/src/init/helpers-generator.ts:285` — inside
  `generateMemoryHelper()` (function declared at line 275).
  ```ts
  const MEMORY_DIR = path.join(process.cwd(), '.claude-flow', 'data');
  ```
- **Source (template that emits `.claude/helpers/session.js`)**:
  `v3/@claude-flow/cli/src/init/helpers-generator.ts:78` — inside
  `generateSessionManager()` (function declared at line 68).
  ```ts
  const SESSION_DIR = path.join(process.cwd(), '.claude-flow', 'sessions');
  ```
- **Other CWD-relative emitters in the same template file** (must all be
  fixed together to actually converge writes under `~/.claude/`):
  - line 285 — memory data dir (memory.js)
  - line 616 — `DATA_DIR` injected into intelligence helper string
  - line 619 — `PENDING_PATH` injected into intelligence helper string
  - line 620 — `SESSION_DIR` injected into intelligence helper string
  - line 664/665 — additional memory search roots
  - line 1071 — `localDir` for sessions in another helper
- **Confirmation**: `grep -n "process.cwd()" v3/@claude-flow/cli/src/init/helpers-generator.ts`
  returned 9 matches, including the two referenced in the brief.
- **Difficulty**: small (mechanical, but spread across one file).
- **Approach**: introduce a single template-side helper string
  `resolveFlowPath(...segs)` that is emitted into every generated helper
  (memory.js, session.js, intelligence.cjs, hook-handler.cjs). The helper:
  1. Detects whether `process.cwd()` is inside the install root
     (`os.homedir() + '/.claude'` or contains `.claude-flow/data` writeable).
  2. Otherwise, falls back to `path.join(os.homedir(), '.claude', ...segs)`.
  Replace each `path.join(process.cwd(), '.claude-flow', ...)` literal in
  helpers-generator with `resolveFlowPath('.claude-flow', ...)`. Add a
  vitest that runs the generator with `cwd` set to a temp dir and asserts
  the rendered helpers prefer the global path.

---

## Bug 2 — `bridge-fallback` vs `reasoningBank` controller fragmentation

- **Source (store)**:
  `v3/@claude-flow/cli/src/memory/memory-bridge.ts:1331` —
  `bridgeStorePattern()` returns `controller: 'reasoningBank'` at line 1354
  if `reasoningBank.store` exists, otherwise falls through to
  `bridgeStoreEntry({ namespace: 'pattern' })` at line 1359 and returns
  `controller: 'bridge-fallback'` at **line 1383**.
- **Source (search)**:
  `v3/@claude-flow/cli/src/memory/memory-bridge.ts:1392` —
  `bridgeSearchPatterns()`. Line 1402 fetches `reasoningBank` from the
  registry; line 1405 only proceeds if `reasoningBank.searchPatterns` *or*
  `reasoningBank.search` is callable. If the registry has reasoningBank but
  it lacks both methods (or returns no results because the data was written
  by `bridge-fallback` into namespace `pattern` via SQL+HNSW, not into the
  reasoningBank instance), search returns `controller: 'reasoningBank'`
  with `[]` at lines 1412–1419 — never falling through to the SQL
  `bridgeSearchEntries({ namespace: 'pattern' })` fallback at line 1422.
- **Caller sites** (MCP tool handlers):
  - `v3/@claude-flow/cli/src/mcp-tools/agentdb-tools.ts:128` —
    `agentdb_pattern-store` calls `bridge.bridgeStorePattern`.
  - `v3/@claude-flow/cli/src/mcp-tools/agentdb-tools.ts:189` —
    `agentdb_pattern-search` calls `bridge.bridgeSearchPatterns`.
- **Hooks-tools mirror**:
  `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts:2611` — same
  controller-name check (`controller === 'reasoningBank' || controller === 'bridge-fallback'`).
- **Confirmation**:
  - `grep -rn "bridge-fallback" v3/@claude-flow/` → 9 hits (`memory-bridge.ts`
    1383, 1433, 1569, 1669, 1762, 1866 + 3 hooks/test).
  - `grep -n "reasoningBank" v3/@claude-flow/cli/src/memory/memory-bridge.ts` →
    18+ hits anchored on lines 1342, 1402, 1482.
- **Difficulty**: medium (controller registry semantics).
- **Approach**: in `bridgeSearchPatterns` (line 1392) make the
  `reasoningBank`-method branch *additive* rather than terminal: always
  attempt the SQL fallback after, then merge by id and return the union.
  Symmetrically, when `bridgeStorePattern` lands in the
  `bridge-fallback` branch, also dual-write into the `reasoningBank`
  controller if `reasoningBank.store` is added later. Simpler alternative:
  invert the priority — write everything through `bridgeStoreEntry` (which
  already HNSW-indexes), and have `reasoningBank.store` adapt to call it,
  so both store and search hit the same SQL-backed `pattern` namespace.
  Add a regression test in `v3/@claude-flow/cli/__tests__/agentdb-pattern-roundtrip.test.ts`
  that store-then-search returns the just-written pattern.

---

## Bug 3 — HNSW counter stuck at 0

- **Source (counter producer)**:
  `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts:558` —
  `getIntelligenceStatsFromMemory()` sets
  `memory.indexSize = entries.length`, where `entries` comes from
  `loadMemoryStore()` reading `.claude-flow/memory/store.json`
  (constants at lines 461–462).
- **Source (counter consumer)**:
  `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts:2918` —
  the `hooks_intelligence_stats` handler emits
  `hnsw.indexSize: memoryStats.memory.indexSize`.
- **Source of the spurious `hnswIndexed: true` claim**:
  `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts:2619` —
  `hnswIndexed: success && hasEmbedding` in `hooks_intelligence_pattern-store`.
  But the actual HNSW add happens in
  `v3/@claude-flow/cli/src/memory/memory-bridge.ts:1373-1380` (call to
  `addToHNSWIndex`) and **never updates the JSON store** that
  `loadMemoryStore()` reads — so `entries.length` remains the count of
  legacy memory writes, not actual HNSW-indexed patterns.
- **Confirmation**: `grep -n "indexSize" hooks-tools.ts` returned hits at
  487, 558, 2148, 2769, 2918; `grep -n "hnswIndexed" hooks-tools.ts` →
  line 2619 only.
- **Difficulty**: small.
- **Approach**: replace the JSON-store proxy with a real query against the
  HNSW backend. In `hooks-tools.ts` near line 2917, import
  `getHNSWIndexSize()` from `../memory/memory-initializer.js` (the same
  module that exposes `addToHNSWIndex`) and use that as the source of
  truth. Falls back to `memoryStats.memory.indexSize` only if HNSW isn't
  initialized. Add a unit test that store-then-stats reports >0.

---

## Bug 4 — `memory_search_unified` hardcoded namespace allowlist (KNOWN)

- **Source**: `v3/@claude-flow/cli/src/mcp-tools/memory-tools.ts:862`
  ```ts
  const namespaces = ns ? [ns] : ['default', 'claude-memories', 'auto-memory', 'patterns', 'tasks', 'feedback'];
  ```
- **Confirmation**: `grep -n "claude-memories" memory-tools.ts` returned
  matches at 666, 673, 816, 862, 875, plus `searchedNamespaces` echo at
  896.
- **Difficulty**: trivial.
- **Approach**: replace the literal array with a runtime
  `SELECT DISTINCT namespace FROM memory_entries`. Cache the result for
  the duration of the request to avoid repeated queries when iterating
  per-namespace below.

---

## Bug 5 — Learning loop disconnected (pending-insights vs metrics)

- **Source (writer of `pending-insights.jsonl`)**:
  `v3/@claude-flow/cli/.claude/helpers/intelligence.cjs:564` —
  `recordEdit(file)` does `fs.appendFileSync(PENDING_PATH, ...)`. Constant
  defined at `intelligence.cjs:24`.
- **Source (template that emits the writer)**:
  `v3/@claude-flow/cli/src/init/helpers-generator.ts:619` injects
  `const PENDING_PATH = path.join(DATA_DIR, 'pending-insights.jsonl');`
  into the generated intelligence helper.
- **Sole reader in MCP layer**:
  `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts:1924` — only used
  inside `hooks_session-end` to compute `pendingInsights: insightCount`
  for the response. **No drain, no consume, no counter update.**
- **`hooks_metrics` handler**:
  `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts:1063` — calls
  `getIntelligenceStatsFromMemory()` (line 1081) + `loadRoutingOutcomes()`
  (line 1087). Neither touches `pending-insights.jsonl`. The "No metrics
  data collected yet" note is at line 1126.
- **Confirmation**:
  - `grep -rn "pending-insights" v3/@claude-flow/` → 4 hits (writer in
    intelligence.cjs:24, comment at intelligence.cjs:12, template at
    helpers-generator.ts:619, peek-only reader at hooks-tools.ts:1924).
- **Difficulty**: medium.
- **Approach**: add a `drainPendingInsights()` helper to `hooks-tools.ts`
  (or new module `pending-insights-drain.ts`) that:
  1. Reads + truncates `.claude-flow/data/pending-insights.jsonl`
     atomically (rename to `.processing`, then unlink on success).
  2. For each event line: increments the appropriate counter
     (`patterns.total`, `agents.totalRoutes`, `commands.totalExecuted`)
     in the same JSON store `loadMemoryStore` reads. For `type: 'edit'`
     events, append a synthetic trajectory entry so SONA picks it up.
  3. Call `drainPendingInsights()` at the top of `hooks_metrics`
     (line 1073) before computing stats. Also wire it into the daemon's
     periodic tick if `services/worker-daemon.ts` exists.
  4. Regression test: write 3 lines to a temp jsonl, call
     `hooks_metrics`, assert non-zero counters.

---

## Bug 6 — Subsystems advertised but `not-loaded`

- **Source (the literal `'not-loaded'` strings)**:
  `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts:2807` (ewc),
  `:2829` (moe), `:2857` (flash), `:2874` (lora) — defaults inside
  `hooks_intelligence_stats` (handler entry near line ~2750).
  Also the `implementationStatus` block at lines 2933-2937 advertises
  `loaded`/`not-loaded` for sona/ewc/moe/flash/lora.
- **Source (advertised but always 1.0)**:
  `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts:2854` —
  `flashStats.speedup: 1.0` default; only overridden at line 2861 if the
  flash module loaded. No "actual speedup measured" path.
- **Marketing-source claims** are also baked into:
  - `v3/@claude-flow/cli/src/init/claudemd-generator.ts` (the `2.49x-7.47x
    Flash Attention speedup` string the brief quotes — search the file
    for `Flash Attention`).
- **`agentdb_health` semanticRouter / vectorBackend / gnnService flags**:
  the `agentdb_health` tool handler is at
  `v3/@claude-flow/cli/src/mcp-tools/agentdb-tools.ts:60` (matched by
  `grep -n "agentdb_health" agentdb-tools.ts`). The actual booleans for
  `semanticRouter.enabled`, `vectorBackend.enabled`, `gnnService.enabled`
  are emitted from inside that handler (the file contains the surrounding
  comment block at lines 134-159 about the controller-registry fallback).
- **Confirmation**:
  - `grep -rn "not-loaded" v3/@claude-flow/` → 7 source hits clustered in
    `hooks-tools.ts` lines 2807-2937.
- **Difficulty**: medium (triage + decision per subsystem).
- **Approach**: split into two PR-sized fixes.
  1. *Honesty fix* (mechanical): in `hooks_intelligence_stats`, when a
     subsystem is `null`, omit its key entirely instead of returning a
     stub with `implementation: 'not-loaded'` and `speedup: 1`. Update
     `implementationStatus` to only list loaded subsystems.
  2. *Loader fix*: audit which of `sona`/`ewc`/`moe`/`flash`/`lora` are
     actually shippable with current deps (`grep -rn "import.*flash\|import.*moe" v3/@claude-flow/cli/src/`)
     and lazy-load them on first stats call instead of expecting them to
     be wired by some other path. Same audit applies to
     `agentdb_health`'s `semanticRouter`/`vectorBackend`/`gnnService`.

---

## Bug 7 — `memory_import_claude` returns 0 imports

- **Source (importer)**:
  `v3/@claude-flow/cli/src/mcp-tools/memory-tools.ts:659` —
  `memory_import_claude` handler. The single-project branch is at lines
  696-707:
  ```ts
  const cwd = process.cwd();
  const projectHash = cwd.replace(/\//g, '-');   // ← THIS is wrong
  const memDir = join(claudeProjectsDir, projectHash, 'memory');
  ```
- **Source (status, which DOES find the files)**:
  `v3/@claude-flow/cli/src/mcp-tools/memory-tools.ts:786` —
  `memory_bridge_status` handler. Line 794-807 enumerates *every*
  subdirectory under `~/.claude/projects/` and counts files with no
  CWD-derived hash filter. That's why bridge_status returns
  `memoryFiles: 2` while the importer returns 0.
- **The actual encoding** Claude Code uses for project dirs is
  `cwd.replace(/[\/.]/g, '-')` with a leading `-` (e.g.
  `/Users/h4ckm1n/dev/ruflo` → `-Users-h4ckm1n-dev-ruflo`) — the current
  importer drops the `.` replacement and the leading dash.
- **Confirmation**:
  - `grep -n "memory_import_claude\|memoryFiles" memory-tools.ts` →
    importer at 659, status at 786, status `claudeCode.memoryFiles` at
    829.
- **Difficulty**: small.
- **Approach**: factor out an `enumerateClaudeMemoryFiles({ cwd?, allProjects? })`
  helper used by both `memory_import_claude` and `memory_bridge_status`.
  When `allProjects=false`, instead of hashing `cwd`, list every project
  dir and pick the one whose decoded path matches `cwd`. Decoded form =
  `'/' + dirname.replace(/^-/, '').replace(/-/g, '/')` (with the dot-encoding
  caveat — easier to just match on suffix or on a sentinel inside the
  memory frontmatter). Add a test: create
  `~/.claude/projects/-tmp-foo/memory/x.md` from a temp `cwd=/tmp/foo` and
  assert the importer finds it.

---

## Bug 8 — `settings.json` hook command template assumes per-project install

- **Source**: `v3/@claude-flow/cli/src/init/settings-generator.ts:184`
  inside `hookCmd(script, subcommand)` (function at line 177):
  ```ts
  const dir = '${CLAUDE_PROJECT_DIR:-.}';
  return `sh -c 'exec node "${dir}/${script}" ${subcommand}'`;
  ```
  Same pattern at line 209 inside `generateStatusLineConfig`. The Windows
  branch at line 179 has the same issue with `%CLAUDE_PROJECT_DIR%/`.
- **Callers**:
  - `hookHandlerCmd()` at line 189 emits
    `.claude/helpers/hook-handler.cjs` paths.
  - `autoMemoryCmd()` at line 194 emits `.claude/helpers/auto-memory-hook.mjs`.
- **Confirmation**: `grep -rn 'CLAUDE_PROJECT_DIR' v3/@claude-flow/cli/src/`
  → 7 hits, all inside `settings-generator.ts` lines 171-209 except a
  read-only env probe at `commands/doctor.ts:189`.
- **When global**: `CLAUDE_PROJECT_DIR=/Users/h4ckm1n/.claude` (set by
  Claude Code), and `script = '.claude/helpers/hook-handler.cjs'`, so the
  command resolves to
  `/Users/h4ckm1n/.claude/.claude/helpers/hook-handler.cjs` →
  MODULE_NOT_FOUND.
- **Difficulty**: small.
- **Approach**: detect the global-install case at `init` time
  (`InitOptions.installRoot === os.homedir() + '/.claude'`) and emit a
  different `hookCmd`:
  - global: `sh -c 'exec node "$HOME/.claude/helpers/${basename}" ${subcommand}'`
    (drops the `${CLAUDE_PROJECT_DIR}/.claude` prefix entirely).
  - per-project: keep current behavior.
  Alternative: make the helper path absolute at generate time (the
  generator already knows the install root) — `${dir}` becomes the
  literal install path string, no env-var indirection. Add a snapshot
  test for both modes.
