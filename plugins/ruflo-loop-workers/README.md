# ruflo-loop-workers

Cache-aware /loop workers and CronCreate background automation. Substrate plugin for every recurring task in the ruflo family.

## Install

```
/plugin marketplace add ruvnet/ruflo
/plugin install ruflo-loop-workers@ruflo
```

## What's Included

- **Loop Workers**: Recurring tasks via `/loop` with ScheduleWakeup (delay <270s for prompt cache hits)
- **CronCreate**: Background cron jobs for audit, optimization, and monitoring
- **12 Background Workers**: ultralearn, optimize, consolidate, predict, audit, map, preload, deepdive, document, refactor, benchmark, testgaps
- **Custom workers (v0.3.0)**: register consumer-defined recurring tasks from a YAML manifest. See [Custom workers](#custom-workers) below
- **Daemon Management**: Start, stop, status, trigger, and enable workers
- **ADR-091 Integration**: Native Claude Code capabilities preferred over daemon polling

## Requires

- `ruflo-core` plugin (provides MCP server)

## Compatibility

- **CLI:** pinned to `@claude-flow/cli` v3.6 major+minor.
- **Verification:** `bash plugins/ruflo-loop-workers/scripts/smoke.sh` is the contract.

## MCP surface (5 tools)

All defined at `v3/@claude-flow/cli/src/mcp-tools/hooks-tools.ts`:

| Tool | Purpose |
|------|---------|
| `hooks_worker-list` | List available workers and their triggers |
| `hooks_worker-dispatch` | Dispatch a worker run with `--trigger <worker-name>` and optional `--scope` |
| `hooks_worker-status` | Inspect a running worker |
| `hooks_worker-detect` | Detect which workers should fire based on context |
| `hooks_worker-cancel` | Cancel a running worker |

## 12 worker triggers → consumer plugins

| Trigger | Consumer plugin | Purpose |
|---------|-----------------|---------|
| `ultralearn` | `ruflo-intelligence` | Bootstrap learning corpus from a deep codebase scan |
| `optimize` | `ruflo-cost-tracker`, `ruflo-intelligence` | Performance + cost optimization recommendations |
| `consolidate` | `ruflo-intelligence`, `ruflo-agentdb` | EWC++ memory consolidation |
| `predict` | `ruflo-intelligence` | Predictive routing for upcoming tasks |
| `audit` | `ruflo-security-audit`, `ruflo-aidefence` | Security + compliance audit pass |
| `map` | `ruflo-knowledge-graph` | Build/refresh entity-relation knowledge graph |
| `preload` | `ruflo-core`, `ruflo-rag-memory` | Warm caches before high-frequency operations |
| `deepdive` | `ruflo-goals` (deep-research) | Multi-source investigation pass |
| `document` | `ruflo-docs` | Generate API docs + drift detection |
| `refactor` | `ruflo-jujutsu` | Diff-aware refactor recommendations |
| `benchmark` | `ruflo-cost-tracker`, `ruflo-iot-cognitum` | Perf benchmarks |
| `testgaps` | `ruflo-testgen` | Coverage gap detection + test generation |

Invocation pattern (CLI + MCP):

```bash
# CLI
npx @claude-flow/cli@latest hooks worker dispatch --trigger document --scope api

# MCP
mcp tool call hooks_worker-dispatch --json -- '{"trigger": "document", "scope": "api"}'
```

## Custom workers

The 12 built-in triggers above are dispatched via `mcp__claude-flow__hooks_worker-dispatch` and serve cross-plugin cases. A consumer plugin or downstream project sometimes needs to schedule its own recurring task that doesn't fit those triggers — for example, AgentVille's L4 deterministic anomaly tick.

For those cases, v0.3.0 introduces a **custom-worker manifest** (YAML) plus the `register-custom-workers` skill that reads the manifest and registers each worker via `CronCreate`. The 12 built-ins are unchanged; custom workers run alongside them in a separate registration path.

Minimal manifest:

```yaml
version: 1
workers:
  - name: agentville-l4
    schedule: '*/15 * * * *'
    command: ['pnpm', 'auto-ops:l4-tick', '--', '--project-root', '.']
    cwd: '/var/lib/agentville'
    env:
      AGENTVILLE_GLAB_REPO: 'org/repo'
    timeout_seconds: 60
```

Register from a Claude Code session:

```text
Skill: ruflo-loop-workers:register-custom-workers .ruflo/custom-workers.yaml
```

Schema reference: [`docs/custom-worker-manifest.md`](./docs/custom-worker-manifest.md). Design rationale: [`ADR-0002`](./docs/adrs/0002-custom-worker-manifest.md).

## Cache-aware /loop integration

This plugin pairs with [ruflo-autopilot ADR-0001](../ruflo-autopilot/docs/adrs/0001-autopilot-contract.md) which **owns the 270s cache-aware ScheduleWakeup heartbeat contract**. Recommended fallback heartbeat is **270 seconds** — under the 5-minute prompt-cache TTL so the next wake-up reads conversation context cached. Going past 300s pays a cache-miss; rounding to 5 minutes is the worst-of-both case.

For event-driven loops, arm a `Monitor` and let the 270s wake be the safety net.

## Namespace coordination

This plugin owns the `worker-history` AgentDB namespace (kebab-case, follows the convention from [ruflo-agentdb ADR-0001 §"Namespace convention"](../ruflo-agentdb/docs/adrs/0001-agentdb-optimization.md)). Reserved namespaces (`pattern`, `claude-memories`, `default`) MUST NOT be shadowed.

`worker-history` records dispatch events, durations, success/failure verdicts. Accessed via `memory_*` tools (namespace-routed).

## Verification

```bash
bash plugins/ruflo-loop-workers/scripts/smoke.sh
# Expected: "12 passed, 0 failed"
```

## Architecture Decisions

- [`ADR-0001` — ruflo-loop-workers plugin contract (12-worker trigger map, autopilot 270s cross-reference, smoke as contract)](./docs/adrs/0001-loop-workers-contract.md)
- [`ADR-0002` — custom-worker manifest schema and registration skill (v0.3.0)](./docs/adrs/0002-custom-worker-manifest.md)

## Related Plugins

- `ruflo-autopilot` — owns the 270s cache-aware /loop heartbeat contract
- `ruflo-docs`, `ruflo-security-audit`, `ruflo-testgen`, `ruflo-knowledge-graph`, etc. — worker-trigger consumers per the table above
- `ruflo-agentdb` — namespace convention owner; backing store for worker-history
