# ADR-115 — Claude Managed Agents as a cloud backend for `rvagent`

**Status**: Proposed (2026-05-12)
**Date**: 2026-05-12
**Authors**: claude (drafted with rUv)
**Related**: `ruflo-agent` plugin / `wasm_agent_*` MCP tools (`@ruvector/rvagent-wasm`) · ADR-026 (3-tier model routing) · ADR-095 G2 / ADR-104 (pluggable `ConsensusTransport` / `FederationTransport`) · ADR-097 (federation peers) · ADR-112 (MCP tool discoverability) · [Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview)
**Supersedes**: nothing

## Context

Ruflo's `rvagent` capability — the `ruflo-agent` plugin, wrapping `@ruvector/rvagent-wasm` — is a *local, WASM-sandboxed* agent harness. Its MCP surface:

| `rvagent` tool | What it does |
|---|---|
| `wasm_agent_create` | spin up a WASM-sandboxed agent (its own filesystem, tools) |
| `wasm_agent_prompt` | send the agent a user turn |
| `wasm_agent_tool` | invoke a tool inside the sandbox |
| `wasm_agent_files` | read the sandbox filesystem |
| `wasm_agent_export` | export the session as an RVF container (portable, replayable) |
| `wasm_agent_terminate` | stop the agent |
| `wasm_gallery_*` | publish / discover reusable agent templates |

[Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview) (Anthropic, beta — `anthropic-beta: managed-agents-2026-04-01`) is a *cloud, Anthropic-managed* agent harness with the **same conceptual model**:

| Managed Agents concept | API |
|---|---|
| **Agent** — model + system + tools + MCP servers + skills | `POST /v1/agents` → `{id, version}` (reusable by id, versioned) |
| **Environment** — container template (apt/pip/npm/cargo/gem/go packages, networking, init script, env vars) | `POST /v1/environments` → `{id}` |
| **Session** — a running agent instance in an environment | `POST /v1/sessions` `{agent, environment_id, title}` → `{id, status}` |
| **Events** — user turns / tool use / tool results / status, SSE-streamed and persisted | `POST /v1/sessions/{id}/events`, `GET /v1/sessions/{id}/stream` (SSE), `GET /v1/sessions/{id}/events` (full history) |
| Built-in toolset (`agent_toolset_20260401`): bash, file ops (read/write/edit/glob/grep), web search/fetch, MCP servers | per-tool config + `permission_policy` |

It also exposes `mcp_servers`, `skills`, `multiagent` (research preview), and **define-outcomes** (research preview) on the agent config — i.e. Anthropic is converging on the same primitives ruflo already has (agents, MCP servers, skills, multi-agent swarms, success criteria).

The mapping to `rvagent` is essentially 1:1:

| `rvagent` (WASM, local) | Managed Agents (cloud) |
|---|---|
| `wasm_agent_create` (sandbox) | `agents.create` + `environments.create` + `sessions.create` |
| `wasm_agent_prompt` | `events.send(user.message)` + `events.stream` |
| (tools run inside the WASM sandbox) | the agent autonomously calls `agent_toolset_20260401` tools in the cloud container |
| `wasm_agent_files` | bash/file tools in the container; full event history is `GET /sessions/{id}/events` |
| `wasm_agent_export` (RVF container) | session + event history is persisted server-side; export = the event log |
| `wasm_agent_terminate` | `DELETE /v1/sessions/{id}` (or the session goes idle) |
| WASM sandbox (local, no network unless granted) | cloud container (`environments`, networking rules) |
| `wasm_gallery_*` (share agent templates) | agents are reusable-by-id; a "gallery" entry = the agent-config blob |

### Validation (this exploration)

A live smoke against `https://api.anthropic.com/v1` with the org's Anthropic key (sourced from the GCP `claude-flow/anthropic-api-key` secret) confirmed the flow end-to-end:

```
POST /v1/agents        {name, model:"claude-haiku-4-5-20251001", system, tools:[{type:"agent_toolset_20260401"}]}  → agent_…  (version 1)
POST /v1/environments  {name, config:{type:"cloud", networking:{type:"unrestricted"}}}                            → env_…
POST /v1/sessions      {agent, environment_id, title}                                                              → sesn_…  (status:"idle")
POST /v1/sessions/{id}/events  {events:[{type:"user.message", content:[{type:"text", text:"echo … > /tmp/x && cat /tmp/x"}]}]}
GET  /v1/sessions/{id}/events  → 13 events: session.status_running → user.message → agent.thinking → agent.tool_use(bash) →
                                  agent.tool_result("ruflo-managed-agents-smoke OK\n") → agent.message("Done.") → session.status_idle (stop_reason:end_turn)
DELETE /v1/sessions/{id}, DELETE /v1/environments/{id}   (cleanup)
```

Roughly ~7 s wall-clock for a trivial bash task on Haiku. The container provisioned, ran the agent loop, executed the tool, and went idle without intervention. Headers required on every request: `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-beta: managed-agents-2026-04-01`. The SSE stream returns nothing if you attach it *after* a fast session already went idle — `GET /sessions/{id}/events` is the reliable transcript; attach the stream before/while sending the user event for real-time.

## Decision

**Treat `rvagent` as the *interface* and add Claude Managed Agents as a second *backend* behind it — a `runtime: "managed"` (vs the default `"wasm"`) on the `wasm_agent_*` MCP tools** (and/or a thin `managed_agent_*` alias toolset), wrapping the Managed Agents REST API via `@anthropic-ai/sdk`'s `client.beta.agents|environments|sessions` (which sets the beta header automatically). This mirrors the established ruflo pattern of one interface over a local-vs-cloud transport (`ConsensusTransport`: `LocalTransport` | `FederationTransport` — ADR-095 G2 / ADR-104).

### Surface

- `wasm_agent_create({ runtime: "managed", model?, system?, mcpServers?, skills?, env? })` — creates (or reuses) a Managed Agent + environment + session; returns a handle that looks like a WASM-agent handle (`agentId` ↔ session id, plus the underlying `agent`/`environment` ids) so downstream tools don't care which backend it is.
- `wasm_agent_prompt({ agentId, runtime: "managed", message })` — `events.send(user.message)` then drain `events.stream` (or poll `events`) until `session.status_idle`; returns the assistant text + a tool-use trace.
- `wasm_agent_files({ agentId, runtime: "managed" })` — fetch the session's file artifacts / event history.
- `wasm_agent_terminate({ agentId, runtime: "managed" })` — `DELETE /v1/sessions/{id}` (and optionally the env).
- `wasm_gallery_*` — store/retrieve Managed-Agent **config blobs** (`{model, system, tools, mcp_servers, skills}`) alongside the existing WASM-agent templates; a gallery entry that targets `runtime: "managed"` materializes a real Managed Agent on use.

### The high-value combinations

1. **Ruflo's own MCP server as a Managed Agent tool source.** Managed Agents' agent config accepts `mcp_servers`. A ruflo Managed Agent can be wired to `npx ruflo mcp start` (HTTP transport) → the cloud agent gets ruflo's 314 MCP tools (memory, swarm, hooks, agentdb, federation, …) running in the cloud container. That is: a cloud-hosted ruflo agent, no local infra.
2. **Managed Agents as a federation peer (ADR-097/104).** A Managed Agent session is, operationally, a remote autonomous executor with persisted state — the same shape as a federated peer. The `FederationTransport` / `task_assign` dispatch could target a Managed Agent session as one of its executors (closing the #1916 "task-execution dispatch" gap with a *third* executor option: local WASM | federated peer | Anthropic Managed).
3. **Long-running / async work.** `rvagent`-WASM is in-process and ephemeral; Managed Agents persist a filesystem + event history across interactions and run for minutes/hours — the right backend for long agent tasks where the WASM sandbox isn't.
4. **Skills + outcomes parity.** Managed Agents accept ruflo's skills (Markdown skill files) and (research-preview) `define-outcomes` — a Managed-Agent backed `rvagent` can carry the same skill set and success criteria a local one does.

### Constraints / boundaries

- **Optional, off by default.** `runtime: "wasm"` stays the default; `runtime: "managed"` requires `ANTHROPIC_API_KEY` (or the GCP `anthropic-api-key` secret in CI/ops) and the beta header — degrade gracefully (`{ error: "managed runtime needs ANTHROPIC_API_KEY + managed-agents beta access" }`) when absent. No core package gains a hard dependency on `@anthropic-ai/sdk` for this — it's a plugin-level dep (`ruflo-agent` / a new `ruflo-managed-agents`), lazily imported.
- **Cost & rate limits.** Managed Agents bill per session (LM tokens + container time) and are rate-limited per org (create: 300/min, read: 600/min) plus tier spend limits. The tool descriptions must say so (ADR-112), and `cost-tracking` should record Managed-Agent sessions the same way it records LM calls. `wasm_agent_prompt({runtime:"managed"})` should surface an estimated cost before a long run.
- **Beta churn.** The API is beta (`managed-agents-2026-04-01`); `multiagent` and `define-outcomes` are research preview. Pin the beta header in one place; treat the latter two as feature-flagged.
- **Branding.** Anthropic's branding guidelines forbid presenting a Managed-Agents integration as "Claude Code"/"Claude Cowork" — ruflo keeps its own branding; surface it as "ruflo agent (Anthropic Managed runtime)" not "Claude Code agent".
- **Cleanup discipline.** A Managed Agent leaves an `agent` + `environment` + `session` on the org account; `wasm_agent_terminate` must delete the session (and env, if ruflo created it), and there should be a `managed_agent_gc` / doctor check for orphaned sessions.

This ADR records the *intent to build*; the plugin's internals (exact handle shape, stream-vs-poll, gallery storage, federation wiring) are a follow-up implementation PR.

## Consequences

### Positive

- **One mental model, two runtimes.** Authors think "rvagent"; ruflo picks local WASM (fast, free, ephemeral, no network) or Anthropic Managed (cloud, persistent, long-running, no local infra) per task — like it already picks `LocalTransport` vs `FederationTransport`.
- **Closes a real gap.** A cloud autonomous executor with persisted state and a full toolset is exactly what `task_assign` / hive workers (#1916 items 3/4) and long-running federation tasks need; Managed Agents is a turnkey option.
- **Ruflo-tools-in-the-cloud.** Wiring `npx ruflo mcp start` as a Managed Agent's MCP server gives a cloud-hosted ruflo with zero local setup — a strong onboarding/demo story and a real ops capability.
- **First-party, low integration cost.** It's Anthropic's own API; `@anthropic-ai/sdk` is already in the dep tree somewhere; the conceptual mapping is 1:1 so the adapter is thin. Validated working today.
- **Convergent primitives.** Managed Agents' agent/environment/session/events/skills/mcp_servers/multiagent/outcomes are the same primitives ruflo has — the integration is "speak the same nouns to a different harness", not an impedance mismatch.

### Negative

- **Cost surface.** Easy to rack up container-time + token spend; needs cost-tracking integration + pre-run estimates + a GC for orphaned sessions, or it becomes a footgun.
- **Beta exposure.** Wire shapes may shift; `multiagent`/`outcomes` are research-preview (gated). Maintenance burden until GA.
- **Two backends to keep behaviorally aligned.** `runtime: "wasm"` and `runtime: "managed"` must return compatible handle/result shapes; divergence (e.g. `wasm_agent_files` semantics) is a latent bug source — code review and a parity smoke (run the same trivial task on both runtimes, diff the result shape) are needed.
- **Network/credential dependency.** `managed` runtime can't work offline or without an Anthropic key + beta access; the WASM runtime is the floor.

### Neutral

- Opt-in; users who don't set `runtime: "managed"` see no change. Worst case: an unused code path behind a flag.
- This is "adopt an external standard" (Anthropic's harness), not invent one — same posture as ADR-114 (DSPy.ts).

## Links

- Claude Managed Agents — overview: https://platform.claude.com/docs/en/managed-agents/overview · quickstart: https://platform.claude.com/docs/en/managed-agents/quickstart · sessions API: https://platform.claude.com/docs/en/managed-agents/sessions · tools: https://platform.claude.com/docs/en/managed-agents/tools
- `@ruvector/rvagent-wasm` (the `rvagent` backend) — dep of `@claude-flow/cli`; surfaced via the `ruflo-agent` plugin's `wasm_agent_*` MCP tools
- ADR-095 G2 / ADR-104 — pluggable `ConsensusTransport` / `FederationTransport` (the local-vs-cloud pattern this reuses)
- ADR-097 — federation peers (a Managed Agent session ≈ a federated executor)
- ADR-026 — 3-tier model routing (Managed Agent `model` selection should route through this)
- ADR-112 — MCP tool discoverability (every new `*_agent_*({runtime:"managed"})` tool description must comply; must state the cost/beta caveats)
- #1916 — hive task-execution dispatch (Managed Agents as a third executor option)
