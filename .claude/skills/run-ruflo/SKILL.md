---
name: run-ruflo
description: Build, run, and smoke-test the ruflo CLI. Use when asked to run ruflo, start ruflo, test ruflo, verify the CLI works, or drive ruflo commands.
---

ruflo is a Node.js CLI for AI agent orchestration (thin wrapper around `@claude-flow/cli`). Drive it via `.claude/skills/run-ruflo/smoke.sh` from the repo root, or invoke `node ruflo/bin/ruflo.js <command>` directly.

All paths below are relative to the repo root (`/home/user/ruflo/`).

## Prerequisites

Node.js ≥ 20 and pnpm ≥ 8 (already present in this container):

```bash
node --version   # v22.22.2
pnpm --version   # 8.15.0
```

## Setup

Install all dependencies (run once after clone):

```bash
# Root package
npm install

# v3 workspace — all @claude-flow/* packages
cd v3 && pnpm install && cd ..

# ruflo package
cd ruflo && npm install && cd ..
```

Build dependent packages in order (required before first run):

```bash
cd v3
pnpm --filter "@claude-flow/shared"   build
pnpm --filter "@claude-flow/swarm"    build
pnpm --filter "@claude-flow/hooks"    build
pnpm --filter "@claude-flow/cli-core" build
pnpm --filter "@claude-flow/mcp"      build
pnpm --filter "@claude-flow/neural"   build
pnpm --filter "@claude-flow/aidefence" build
pnpm --filter "@claude-flow/codex"    build
pnpm --filter "@claude-flow/embeddings" build
pnpm --filter "@claude-flow/guidance" build
pnpm --filter "@claude-flow/memory"   build
pnpm --filter "@claude-flow/security" build
pnpm --filter "@claude-flow/cli"      build
cd ..
```

## Run (agent path)

Smoke-test the CLI end-to-end:

```bash
bash .claude/skills/run-ruflo/smoke.sh
# → 5 passed, 0 failed
```

Direct invocation (all commands):

```bash
RUFLO="node ruflo/bin/ruflo.js"
$RUFLO --version         # → ruflo v3.7.0-alpha.32
$RUFLO --help            # → lists all commands
$RUFLO doctor            # → system health check (10+ passed, 7 warnings)
$RUFLO agent --help      # → agent subcommands
$RUFLO route --help      # → Q-Learning router subcommands
$RUFLO status            # → "not initialized" if no ruflo init yet
```

## Run (human path)

```bash
node ruflo/bin/ruflo.js --help   # → help and exits
```

The CLI exits after each command — no persistent process.

## Gotchas

- **`@claude-flow/cli` depends on pnpm workspaces** — running `npm install` inside `v3/@claude-flow/cli/` alone fails with `workspace:*` protocol errors. Always install from `v3/` with pnpm.
- **Build order matters** — `@claude-flow/cli` fails to build if `@claude-flow/swarm`, `@claude-flow/hooks`, and `@claude-flow/cli-core` aren't built first.
- **`((VAR++))` exits 1 when VAR=0** in bash — use `VAR=$((VAR + 1))` in scripts.
- **`ruflo status` exits with error until initialized** — run `ruflo init` first if you need status.

## Troubleshooting

- **`Cannot find module '.../dist/src/index.js'`**: `@claude-flow/cli` hasn't been built. Run the build sequence above.
- **`workspace:* Unsupported URL Type`**: running `npm install` inside a workspace package. Use pnpm from `v3/` instead.
- **`npm error ERESOLVE`** in `v3/@claude-flow/cli`: run with `--legacy-peer-deps`, or use pnpm from workspace root.
