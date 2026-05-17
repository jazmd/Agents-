---
name: hooks
description: Configure self-learning hooks and background workers for automated coordination, neural pattern training, and session management
---

# Claude Flow Hooks

## Core Lifecycle

```bash
npx claude-flow@latest hooks pre-task --description "implement OAuth2"
npx claude-flow@latest hooks post-task --task-id "task-123" --success true --store-results true
npx claude-flow@latest hooks post-edit --file "src/auth.ts" --train-neural true
```

## Session Management

```bash
npx claude-flow@latest hooks session-start --session-id "my-session"
npx claude-flow@latest hooks session-end --generate-summary true --export-metrics true
npx claude-flow@latest hooks session-restore --latest
```

## Intelligence Routing

```bash
npx claude-flow@latest hooks route --task "refactor authentication module"
npx claude-flow@latest hooks explain --topic "why haiku was selected"
```

## Background Workers

```bash
npx claude-flow@latest hooks worker list
npx claude-flow@latest hooks worker dispatch --trigger audit
npx claude-flow@latest hooks worker dispatch --trigger optimize
```

## 12 Workers: `ultralearn`, `optimize`, `consolidate`, `predict`, `audit`, `map`, `preload`, `deepdive`, `document`, `refactor`, `benchmark`, `testgaps`
