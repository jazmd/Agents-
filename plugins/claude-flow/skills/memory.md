---
name: memory
description: Store, search, and retrieve persistent memory across agents and sessions using AgentDB with HNSW vector search
---

# Claude Flow Memory System

## Store

```bash
npx claude-flow@latest memory store --key "pattern-auth" --value "JWT with refresh tokens" --namespace patterns
```

## Search (semantic)

```bash
npx claude-flow@latest memory search --query "authentication patterns" --namespace patterns
```

## Retrieve

```bash
npx claude-flow@latest memory retrieve --key "pattern-auth" --namespace patterns
```

## List

```bash
npx claude-flow@latest memory list --namespace patterns --limit 20
```

## Performance
- HNSW indexing: 150x–12,500x faster search
- Backends: SQLite (sql.js) + AgentDB hybrid
- Vector dimensions: 384 (all-MiniLM-L6-v2)
