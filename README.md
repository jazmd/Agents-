<div align="center">

[![GOAL Planner — goal.teoh.my](https://img.shields.io/badge/_GOAL_Planner-goal.teoh.my-8b5cf6?style=for-the-badge&logoColor=white&logo=react)](https://goal.teoh.my/)
[![Live Agents — goal.teoh.my/agents](https://img.shields.io/badge/_Live_Agents-goal.teoh.my%2Fagents-10b981?style=for-the-badge&logoColor=white&logo=react)](https://goal.teoh.my/agents)

[![npm version](https://img.shields.io/npm/v/ruflo?label=ruflo&style=for-the-badge&logo=npm&color=cb3837)](https://www.npmjs.com/package/ruflo)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![K2-Backbone](https://img.shields.io/badge/K2--Backbone-Integrated-06b6d4?style=for-the-badge&logoColor=white&logo=graphql)](https://github.com/0x-wzw/k2-backbone)

# Ruflo

**Multi-agent AI orchestration with K2-Backbone convergence**

</div>

Orchestrate 100+ specialized AI agents across machines, teams, and trust boundaries. Ruflo adds coordinated swarms, self-learning memory, federated comms, and enterprise security — so agents don't just run, they collaborate.

### Why Ruflo?

> Ruflo converges the best of two worlds: **Ruflo's operational swarm infrastructure** (typeScript-native, persistent agents, GOAP planning) and **K2-Backbone's decomposition intelligence** (K2.6-powered task breakdown, NecroSwarm cost routing, NeuroSwarm dual-phase execution, Obliviarch 500x memory compression). The result is a production-grade multi-agent platform that decomposes intelligently, routes optimally, executes reliably, and compresses ruthlessly.

### What Ruflo Does

One `npx ruflo init` gives your workspace a nervous system: agents self-organize into swarms, learn from every task, remember across sessions, and — with federation — securely talk to agents on other machines without leaking data. You keep writing code. Ruflo handles the coordination.

```
Self-Learning / Self-Optimizing Agent Architecture

User --> Ruflo (CLI/MCP) --> Router --> Swarm --> Agents --> Memory --> LLM Providers
                          ^                           |
                          +---- Learning Loop <-------+
```

> **New to Ruflo?** You don't need to learn 314 MCP tools or 26 CLI commands. After `init`, just use your AI IDE normally — the hooks system automatically routes tasks, learns from successful patterns, and coordinates agents in the background.

---

![Ruflo Plugins](./ruflo-plugins.gif)

## Quick Start

There are **two different install paths** with very different surface areas:

| | **AI IDE Plugin** | **CLI install (`npx ruflo init`)** |
|---|---|---|
| What it gives you | Slash commands + a few skills + agent definitions per-plugin | Full Ruflo loop — 98 agents, 60+ commands, 30 skills, MCP server, hooks, daemon |
| Files in your workspace | **Zero** | `.ruflo/`, `CLAUDE.md`, helpers, settings |
| MCP server registered | **No** (`memory_store`, `swarm_init`, etc. unavailable) | Yes |
| Hooks installed | No | Yes |
| Best for | Try a single plugin's commands without committing to the full install | Production use — everything works as documented |

### Path A — AI IDE Plugins (lite, slash commands only)

```bash
# Add the marketplace
/plugin marketplace add 0x-wzw/ruflo

# Install core + any plugins you need
/plugin install ruflo-core@ruflo
/plugin install ruflo-swarm@ruflo
/plugin install ruflo-rag-memory@ruflo
```

This adds slash commands and agent definitions only. The Ruflo MCP server is NOT registered, so `memory_store`, `swarm_init`, `agent_spawn`, etc. won't be callable from your IDE. For the full loop, use Path B below.

<details>
<summary><strong>🔌 All 33 plugins</strong></summary>

#### Core & Orchestration

| Plugin | What it does |
|--------|-------------|
| [**ruflo-core**](plugins/ruflo-core/README.md) | Foundation — server, health checks, plugin discovery |
| [**ruflo-swarm**](plugins/ruflo-swarm/README.md) | Coordinate multiple agents as a team |
| [**ruflo-autopilot**](plugins/ruflo-autopilot/README.md) | Let agents run autonomously in a loop |
| [**ruflo-loop-workers**](plugins/ruflo-loop-workers/README.md) | Schedule background tasks on a timer |
| [**ruflo-workflows**](plugins/ruflo-workflows/README.md) | Reusable multi-step task templates |
| [**ruflo-federation**](plugins/ruflo-federation/README.md) | Agents on different machines collaborate securely |
| [**ruflo-k2-bridge**](plugins/ruflo-k2-bridge/README.md) | K2-Backbone integration — Python framework adapters via JSON-RPC |

#### Memory & Knowledge

| Plugin | What it does |
|--------|-------------|
| [**ruflo-agentdb**](plugins/ruflo-agentdb/README.md) | Fast vector database for agent memory |
| [**ruflo-rag-memory**](plugins/ruflo-rag-memory/README.md) | Smart retrieval — hybrid search, graph hops, diversity ranking |
| [**ruflo-rvf**](plugins/ruflo-rvf/README.md) | Save and restore agent memory across sessions |
| [**ruflo-knowledge-graph**](plugins/ruflo-knowledge-graph/README.md) | Build and traverse entity relationship maps |

#### Intelligence & Learning

| Plugin | What it does |
|--------|-------------|
| [**ruflo-intelligence**](plugins/ruflo-intelligence/README.md) | Agents learn from past successes and get smarter |
| [**ruflo-graph-intelligence**](plugins/ruflo-graph-intelligence/) | Sublinear graph reasoning — PageRank, delta updates, complexity-aware execution |
| [**ruflo-daa**](plugins/ruflo-daa/README.md) | Dynamic agent behavior and cognitive patterns |
| [**ruflo-ruvllm**](plugins/ruflo-ruvllm/README.md) | Run local LLMs (Ollama, etc.) with smart routing |
| [**ruflo-goals**](plugins/ruflo-goals/README.md) | Break big goals into plans and track progress |

#### Code Quality & Testing

| Plugin | What it does |
|--------|-------------|
| [**ruflo-testgen**](plugins/ruflo-testgen/README.md) | Find missing tests and generate them automatically |
| [**ruflo-browser**](plugins/ruflo-browser/README.md) | Automate browser testing with Playwright |
| [**ruflo-jujutsu**](plugins/ruflo-jujutsu/README.md) | Analyze git diffs, score risk, suggest reviewers |
| [**ruflo-docs**](plugins/ruflo-docs/README.md) | Generate and maintain documentation automatically |

#### Security & Compliance

| Plugin | What it does |
|--------|-------------|
| [**ruflo-security-audit**](plugins/ruflo-security-audit/README.md) | Scan for vulnerabilities and CVEs |
| [**ruflo-aidefence**](plugins/ruflo-aidefence/README.md) | Block prompt injection, detect PII, safety scanning |

#### Architecture & Methodology

| Plugin | What it does |
|--------|-------------|
| [**ruflo-adr**](plugins/ruflo-adr/README.md) | Track architecture decisions with a living record |
| [**ruflo-ddd**](plugins/ruflo-ddd/README.md) | Scaffold domain-driven design — contexts, aggregates, events |
| [**ruflo-sparc**](plugins/ruflo-sparc/README.md) | Guided 5-phase development methodology with quality gates |

#### DevOps & Observability

| Plugin | What it does |
|--------|-------------|
| [**ruflo-migrations**](plugins/ruflo-migrations/README.md) | Manage database schema changes safely |
| [**ruflo-observability**](plugins/ruflo-observability/README.md) | Structured logs, traces, and metrics in one place |
| [**ruflo-cost-tracker**](plugins/ruflo-cost-tracker/README.md) | Track token usage, set budgets, get cost alerts |

#### Extensibility

| Plugin | What it does |
|--------|-------------|
| [**ruflo-agent**](plugins/ruflo-agent/README.md) | Run agents — local WASM sandbox + managed cloud agents |
| [**ruflo-plugin-creator**](plugins/ruflo-plugin-creator/README.md) | Scaffold, validate, and publish your own plugins |

#### Domain-Specific

| Plugin | What it does |
|--------|-------------|
| [**ruflo-neural-trader**](plugins/ruflo-neural-trader/README.md) | AI trading with 4 agents, backtesting, 112+ tools |
| [**ruflo-market-data**](plugins/ruflo-market-data/README.md) | Ingest market data, vectorize OHLCV, detect patterns |

</details>

### Path B — CLI Install (full Ruflo loop)

```bash
# One-line install (POSIX shells)
curl -fsSL https://cdn.jsdelivr.net/gh/0x-wzw/ruflo@main/scripts/install.sh | bash

# Or interactive wizard
npx ruflo@latest init wizard

# Or install globally
npm install -g ruflo@latest
```

### MCP Server

```bash
# Add Ruflo as an MCP server
claude mcp add ruflo -- npx ruflo@latest mcp start
```

---

## What You Get

| Capability | Description |
|------------|-------------|
| 🤖 **100+ Agents** | Specialized agents for coding, testing, security, docs, architecture |
| 📡 **Comms Layer** | Zero-trust federation — agents across machines/orgs discover, authenticate, and exchange work securely |
| 🐝 **Swarm Coordination** | Hierarchical, mesh, and adaptive topologies with consensus |
| 🧠 **Self-Learning** | SONA neural patterns, ReasoningBank, trajectory learning |
| 💾 **Vector Memory** | HNSW-indexed AgentDB with 150x-12,500x faster search |
| ⚡ **Background Workers** | 12 auto-triggered workers (audit, optimize, testgaps, etc.) |
| 🧩 **Plugin Marketplace** | 32 native plugins + 21 npm plugins |
| 🔌 **Multi-Provider** | Claude, GPT, Gemini, Ollama with smart routing |
| 🛡️ **Security** | AIDefence, input validation, CVE remediation, path traversal prevention |
| 🌐 **Agent Federation** | Cross-installation agent collaboration with zero-trust security |
| 🔗 **K2-Backbone Bridge** | Python framework adapters — NecroSwarm, NeuroSwarm, VoidTether, Capital-Sentience |
| 🎯 **[GOAL Planner](https://goal.teoh.my/)** | GOAP A* planner — plain-English goals → executable agent plans |

---

## K2-Backbone Integration

Ruflo is natively integrated with [K2-Backbone](https://github.com/0x-wzw/k2-backbone) — the 0x-wzw agentic stack that adds intelligent decomposition, cost routing, and memory compression to the swarm layer.

```
┌─────────────────────────────────────────────────────────────────┐
│  Ruflo (TypeScript) — Orchestration + Memory + Federation       │
│  ├── Queen Coordinator                                          │
│  ├── AgentDB + HNSW                                             │
│  ├── SONA Learning                                              │
│  └── K2 Bridge Plugin ──┐                                       │
│                         │ JSON-RPC 2.0 / stdio                  │
├─────────────────────────┼───────────────────────────────────────┤
│  Python (K2 Stack)      │                                       │
│  ├── K2Decomposer       │ K2.6-powered task decomposition        │
│  ├── NecroSwarm Router  │ 10-D Council cost routing            │
│  ├── NeuroSwarm Executor│ Dual-phase GBrain + Council          │
│  ├── Obliviarch         │ 500x memory compression              │
│  └── VoidTether         │ Cross-platform federation mesh         │
└─────────────────────────┴───────────────────────────────────────┘
```

The K2 Bridge Plugin (`v3/plugins/nexys-bridge/`) connects Ruflo's TypeScript orchestration to K2-Backbone's Python frameworks. Each framework runs as a child process, discovered via `list_capabilities`, and registered as a typed agent in Ruflo's swarm registry.

---

## Architecture Overview

```
User --> AI IDE / CLI
          |
          v
    Orchestration Layer
    (MCP Server, Router, 27 Hooks)
          |
          v
    Swarm Coordination
    (Queen, Topology, Consensus)
          |
          v
    100+ Specialized Agents
    (coder, tester, reviewer, architect, security...)
          |
          v
    Memory & Learning
    (AgentDB, HNSW, SONA, ReasoningBank)
          |
          v
    LLM Providers
    (Claude, GPT, Gemini, Ollama)
          |
          v
    K2-Backbone Bridge
    (NecroSwarm, NeuroSwarm, VoidTether, Capital-Sentience)
```

---

## Documentation

| Doc | When to read it |
|-----|-----------------|
| **[Status](docs/STATUS.md)** | See what currently works — capability counts, test baselines, recent fixes |
| **[User Guide](docs/USERGUIDE.md)** | Daily reference — every command, every config flag, every plugin |
| **[Verification](verification.md)** | Cryptographically prove your installed bytes match the signed witness |
| **[K2 Integration](v3/plugins/nexys-bridge/README.md)** | How to connect K2-Backbone Python frameworks to Ruflo |

---

## Support

| Resource | Link |
|----------|------|
| Documentation | [User Guide](docs/USERGUIDE.md) |
| Issues & Bugs | [GitHub Issues](https://github.com/0x-wzw/ruflo/issues) |
| K2-Backbone | [0x-wzw/k2-backbone](https://github.com/0x-wzw/k2-backbone) |
| GOAL Planner | [goal.teoh.my](https://goal.teoh.my) |
| Author | [0x-wzw](https://github.com/0x-wzw) |

## License

MIT — [0x-wzw](https://github.com/0x-wzw)
