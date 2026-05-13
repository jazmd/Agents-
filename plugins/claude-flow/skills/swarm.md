---
name: swarm
description: Initialize and coordinate multi-agent swarms with hierarchical topology, anti-drift configuration, and specialized agent roles
---

# Claude Flow Swarm Coordination

Initialize a multi-agent swarm for complex tasks:

```bash
npx claude-flow@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## Spawn Agents

```bash
npx claude-flow@latest agent spawn -t coder --name my-coder
npx claude-flow@latest agent spawn -t researcher --name my-researcher
```

## Monitor Swarm

```bash
npx claude-flow@latest swarm status
npx claude-flow@latest agent list
```

## Topologies
- `hierarchical` — Queen controls workers (anti-drift, recommended)
- `mesh` — Fully connected peer network
- `hierarchical-mesh` — Hybrid (10+ agents)
- `adaptive` — Dynamic based on load
