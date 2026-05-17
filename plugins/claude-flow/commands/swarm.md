---
name: swarm
description: Launch a multi-agent swarm for a complex task with hierarchical coordination
---

Run: `npx claude-flow@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized`

Then spawn agents for the task using the Task tool with named agents and SendMessage coordination.
