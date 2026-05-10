# ruflo2

> This project supports both Claude Code and OpenAI Codex.

## Platform Compatibility

| Platform | Config File | Skill Syntax |
|----------|-------------|--------------|
| Claude Code | CLAUDE.md | /skill-name |
| OpenAI Codex | AGENTS.md | $skill-name |

## Instructions

**Primary instructions are in `AGENTS.md`** (Agentic AI Foundation standard).

This file provides compatibility for Claude Code users.

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Available Skills

Both platforms share the same skills in `.agents/skills/`:

- `$swarm-orchestration` (Codex) / `/swarm-orchestration` (Claude Code)
- `$memory-management` (Codex) / `/memory-management` (Claude Code)
- `$sparc-methodology` (Codex) / `/sparc-methodology` (Claude Code)
- `$security-audit` (Codex) / `/security-audit` (Claude Code)
- `$performance-analysis` (Codex) / `/performance-analysis` (Claude Code)
- `$github-automation` (Codex) / `/github-automation` (Claude Code)
- `$agent-coordination` (Codex) / `/agent-coordination` (Claude Code)
- `$agentdb-advanced` (Codex) / `/agentdb-advanced` (Claude Code)
- `$agentdb-learning` (Codex) / `/agentdb-learning` (Claude Code)
- `$agentdb-memory-patterns` (Codex) / `/agentdb-memory-patterns` (Claude Code)
- `$agentdb-optimization` (Codex) / `/agentdb-optimization` (Claude Code)
- `$agentdb-vector-search` (Codex) / `/agentdb-vector-search` (Claude Code)
- `$agentic-jujutsu` (Codex) / `/agentic-jujutsu` (Claude Code)
- `$claims` (Codex) / `/claims` (Claude Code)
- `$embeddings` (Codex) / `/embeddings` (Claude Code)
- `$flow-nexus-neural` (Codex) / `/flow-nexus-neural` (Claude Code)
- `$flow-nexus-platform` (Codex) / `/flow-nexus-platform` (Claude Code)
- `$flow-nexus-swarm` (Codex) / `/flow-nexus-swarm` (Claude Code)
- `$github-code-review` (Codex) / `/github-code-review` (Claude Code)
- `$github-multi-repo` (Codex) / `/github-multi-repo` (Claude Code)
- `$github-project-management` (Codex) / `/github-project-management` (Claude Code)
- `$github-release-management` (Codex) / `/github-release-management` (Claude Code)
- `$github-workflow-automation` (Codex) / `/github-workflow-automation` (Claude Code)
- `$hive-mind` (Codex) / `/hive-mind` (Claude Code)
- `$hive-mind-advanced` (Codex) / `/hive-mind-advanced` (Claude Code)
- `$hooks-automation` (Codex) / `/hooks-automation` (Claude Code)
- `$neural-training` (Codex) / `/neural-training` (Claude Code)
- `$pair-programming` (Codex) / `/pair-programming` (Claude Code)
- `$reasoningbank-agentdb` (Codex) / `/reasoningbank-agentdb` (Claude Code)
- `$reasoningbank-intelligence` (Codex) / `/reasoningbank-intelligence` (Claude Code)
- `$skill-builder` (Codex) / `/skill-builder` (Claude Code)
- `$stream-chain` (Codex) / `/stream-chain` (Claude Code)
- `$swarm-advanced` (Codex) / `/swarm-advanced` (Claude Code)
- `$v3-cli-modernization` (Codex) / `/v3-cli-modernization` (Claude Code)
- `$v3-core-implementation` (Codex) / `/v3-core-implementation` (Claude Code)
- `$v3-ddd-architecture` (Codex) / `/v3-ddd-architecture` (Claude Code)
- `$v3-integration-deep` (Codex) / `/v3-integration-deep` (Claude Code)
- `$v3-mcp-optimization` (Codex) / `/v3-mcp-optimization` (Claude Code)
- `$v3-memory-unification` (Codex) / `/v3-memory-unification` (Claude Code)
- `$v3-performance-optimization` (Codex) / `/v3-performance-optimization` (Claude Code)
- `$v3-security-overhaul` (Codex) / `/v3-security-overhaul` (Claude Code)
- `$v3-swarm-coordination` (Codex) / `/v3-swarm-coordination` (Claude Code)
- `$verification-quality` (Codex) / `/verification-quality` (Claude Code)
- `$worker-benchmarks` (Codex) / `/worker-benchmarks` (Claude Code)
- `$worker-integration` (Codex) / `/worker-integration` (Claude Code)
- `$workflow-automation` (Codex) / `/workflow-automation` (Claude Code)
- `$agent-payments` (Codex) / `/agent-payments` (Claude Code)
- `$agent-challenges` (Codex) / `/agent-challenges` (Claude Code)
- `$agent-sandbox` (Codex) / `/agent-sandbox` (Claude Code)
- `$agent-app-store` (Codex) / `/agent-app-store` (Claude Code)
- `$agent-user-tools` (Codex) / `/agent-user-tools` (Claude Code)
- `$agent-neural-network` (Codex) / `/agent-neural-network` (Claude Code)
- `$agent-swarm` (Codex) / `/agent-swarm` (Claude Code)
- `$agent-workflow` (Codex) / `/agent-workflow` (Claude Code)
- `$agent-authentication` (Codex) / `/agent-authentication` (Claude Code)
- `$agent-docs-api-openapi` (Codex) / `/agent-docs-api-openapi` (Claude Code)
- `$agent-spec-mobile-react-native` (Codex) / `/agent-spec-mobile-react-native` (Claude Code)
- `$agent-v3-security-architect` (Codex) / `/agent-v3-security-architect` (Claude Code)
- `$agent-v3-memory-specialist` (Codex) / `/agent-v3-memory-specialist` (Claude Code)
- `$agent-v3-queen-coordinator` (Codex) / `/agent-v3-queen-coordinator` (Claude Code)
- `$agent-v3-integration-architect` (Codex) / `/agent-v3-integration-architect` (Claude Code)
- `$agent-v3-performance-engineer` (Codex) / `/agent-v3-performance-engineer` (Claude Code)
- `$agent-coordinator-swarm-init` (Codex) / `/agent-coordinator-swarm-init` (Claude Code)
- `$agent-memory-coordinator` (Codex) / `/agent-memory-coordinator` (Claude Code)
- `$agent-automation-smart-agent` (Codex) / `/agent-automation-smart-agent` (Claude Code)
- `$agent-github-pr-manager` (Codex) / `/agent-github-pr-manager` (Claude Code)
- `$agent-implementer-sparc-coder` (Codex) / `/agent-implementer-sparc-coder` (Claude Code)
- `$agent-sparc-coordinator` (Codex) / `/agent-sparc-coordinator` (Claude Code)
- `$agent-migration-plan` (Codex) / `/agent-migration-plan` (Claude Code)
- `$agent-performance-analyzer` (Codex) / `/agent-performance-analyzer` (Claude Code)
- `$agent-orchestrator-task` (Codex) / `/agent-orchestrator-task` (Claude Code)
- `$agent-arch-system-design` (Codex) / `/agent-arch-system-design` (Claude Code)
- `$agent-crdt-synchronizer` (Codex) / `/agent-crdt-synchronizer` (Claude Code)
- `$agent-quorum-manager` (Codex) / `/agent-quorum-manager` (Claude Code)
- `$agent-performance-benchmarker` (Codex) / `/agent-performance-benchmarker` (Claude Code)
- `$agent-security-manager` (Codex) / `/agent-security-manager` (Claude Code)
- `$agent-raft-manager` (Codex) / `/agent-raft-manager` (Claude Code)
- `$agent-gossip-coordinator` (Codex) / `/agent-gossip-coordinator` (Claude Code)
- `$agent-byzantine-coordinator` (Codex) / `/agent-byzantine-coordinator` (Claude Code)
- `$agent-test-long-runner` (Codex) / `/agent-test-long-runner` (Claude Code)
- `$agent-queen-coordinator` (Codex) / `/agent-queen-coordinator` (Claude Code)
- `$agent-swarm-memory-manager` (Codex) / `/agent-swarm-memory-manager` (Claude Code)
- `$agent-worker-specialist` (Codex) / `/agent-worker-specialist` (Claude Code)
- `$agent-collective-intelligence-coordinator` (Codex) / `/agent-collective-intelligence-coordinator` (Claude Code)
- `$agent-scout-explorer` (Codex) / `/agent-scout-explorer` (Claude Code)
- `$agent-code-analyzer` (Codex) / `/agent-code-analyzer` (Claude Code)
- `$agent-analyze-code-quality` (Codex) / `/agent-analyze-code-quality` (Claude Code)
- `$agent-dev-backend-api` (Codex) / `/agent-dev-backend-api` (Claude Code)
- `$agent-base-template-generator` (Codex) / `/agent-base-template-generator` (Claude Code)
- `$agent-agentic-payments` (Codex) / `/agent-agentic-payments` (Claude Code)
- `$agent-pseudocode` (Codex) / `/agent-pseudocode` (Claude Code)
- `$agent-refinement` (Codex) / `/agent-refinement` (Claude Code)
- `$agent-specification` (Codex) / `/agent-specification` (Claude Code)
- `$agent-architecture` (Codex) / `/agent-architecture` (Claude Code)
- `$agent-pagerank-analyzer` (Codex) / `/agent-pagerank-analyzer` (Claude Code)
- `$agent-consensus-coordinator` (Codex) / `/agent-consensus-coordinator` (Claude Code)
- `$agent-trading-predictor` (Codex) / `/agent-trading-predictor` (Claude Code)
- `$agent-performance-optimizer` (Codex) / `/agent-performance-optimizer` (Claude Code)
- `$agent-matrix-optimizer` (Codex) / `/agent-matrix-optimizer` (Claude Code)
- `$agent-code-goal-planner` (Codex) / `/agent-code-goal-planner` (Claude Code)
- `$agent-goal-planner` (Codex) / `/agent-goal-planner` (Claude Code)
- `$agent-sublinear-goal-planner` (Codex) / `/agent-sublinear-goal-planner` (Claude Code)
- `$agent-sona-learning-optimizer` (Codex) / `/agent-sona-learning-optimizer` (Claude Code)
- `$agent-ml-developer` (Codex) / `/agent-ml-developer` (Claude Code)
- `$agent-tester` (Codex) / `/agent-tester` (Claude Code)
- `$agent-coder` (Codex) / `/agent-coder` (Claude Code)
- `$agent-reviewer` (Codex) / `/agent-reviewer` (Claude Code)
- `$agent-researcher` (Codex) / `/agent-researcher` (Claude Code)
- `$agent-planner` (Codex) / `/agent-planner` (Claude Code)

## Configuration

### Codex Configuration
- Main: `.agents/config.toml`
- Local: `.codex/config.toml` (gitignored)

### Claude Code Configuration
- This file: `CLAUDE.md`
- Local: `CLAUDE.local.md` (gitignored)

## MCP Integration

```bash
# Start MCP server
npx @claude-flow/cli mcp start
```

## Swarm Orchestration

This project uses hierarchical swarm coordination:

| Setting | Value |
|---------|-------|
| Topology | hierarchical |
| Max Agents | 8 |
| Strategy | specialized |

## Code Standards

- Files under 500 lines
- No hardcoded secrets
- Input validation at boundaries
- Typed interfaces for APIs

## Security

- NEVER commit .env files or secrets
- Always validate user input
- Use parameterized queries for SQL

## Full Documentation

For complete instructions, see `AGENTS.md`.

---

*Generated by @claude-flow/codex - Dual platform mode*
