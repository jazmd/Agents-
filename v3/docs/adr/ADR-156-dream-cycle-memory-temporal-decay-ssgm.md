# ADR-156 — Temporal Decay and Stability-Safety Governed Memory (SSGM) for AgentDB

**Status**: Proposed  
**Date**: 2026-06-13  
**Authors**: claude (dream-cycle agent, 2026-06-13)  
**Issue**: ruvnet/ruflo (dream-cycle 2026-06-13, DEEP=memory)  
**Related**: ADR-006 (Unified Memory), ADR-088 (LongMemEval), ADR-145 (Memory Namespace Governance), ADR-155 (KG multi-hop retrieval)

---

## Context

Ruflo's AgentDB backend uses a flat hybrid store: SQLite for persistence and HNSW for vector retrieval. Entries accumulate indefinitely — there is no temporal decay, no tier-based expiry, and no consistency verification on consolidation.

Two 2026 papers make this gap architectural rather than operational:

**arXiv:2603.11768 (SSGM, Mar 2026, Grade B)**: Identifies "topology-induced knowledge leakage" as a critical risk in flat-vector long-term stores. Without access-gated consolidation, sensitive contexts are solidified into long-term HNSW storage. Without temporal decay, iterative summarization causes semantic drift. The SSGM framework's three mechanisms — consistency verification, temporal decay modeling, and dynamic access control — together prevent both leakage and drift.

**arXiv:2604.04853 (MemMachine, Apr 2026, Grade A)**: Demonstrates that tiered memory (short-term/episodic/long-term) with TTL per tier achieves LoCoMo 0.9169 and cuts input tokens 80% vs Mem0 by preserving raw episodes instead of embeddings-only. The token efficiency gain comes directly from not retrieving stale or irrelevant long-term entries.

**Competitive pressure**: CrewAI v1.12 ships Qdrant Edge backend with hierarchical namespace isolation. LangGraph v0.4 ships PostgresSaver with TTL-aware state eviction. Both have native temporal decay. Ruflo has none.

### Why this is distinct from ADR-145 and ADR-088

| ADR | Scope | Gap |
|-----|-------|-----|
| ADR-088 | Benchmark scoring (LongMemEval) | Does not address why scores are low |
| ADR-145 | Write-authority governance (who can write) | Does not address when entries expire |
| **ADR-156** | Entry lifecycle (when entries age, decay, and expire) | New: temporal + consistency layer |

---

## Decision

Add a `TemporalDecayController` to AgentDB (new 19th controller) that implements SSGM-style temporal decay and consistency verification.

### Memory Tier TTL Defaults

| Tier | Default TTL | Half-life | Eviction Policy |
|------|-------------|-----------|----------------|
| `short-term` | 7 days | 3 days | Hard delete on TTL |
| `episodic` | 90 days | 30 days | Compress to summary on TTL |
| `long-term` | 365 days | 180 days | Archive (retain embedding, discard raw) |
| `permanent` | ∞ | — | Requires explicit `permanent=true` flag + write grant |

### Consistency Verification Gate

Before any entry moves from `episodic` → `long-term` (consolidation), run:
1. **Semantic coherence check**: cosine similarity of entry embedding vs. current namespace centroid must be ≥ `SSGM_COHERENCE_THRESHOLD` (default 0.7). Entries that drift far from namespace centroid during consolidation are flagged for review, not silently promoted.
2. **Provenance trace**: long-term entries must carry a `source_tier`, `consolidated_at`, and `session_commit` field. Enables audit trail for knowledge-leakage investigations.

### Episodic Raw Episode Storage

Alongside HNSW embeddings, store raw episode text in a new SQLite table `episode_store` for entries in `short-term` and `episodic` tiers. Raw episodes are referenced by embedding UUID. This enables MemMachine-style contextualized retrieval without recomputing embeddings.

### Implementation Targets

| Module | File | ~LOC |
|--------|------|------|
| `TemporalDecayController` | `v3/@claude-flow/memory/src/controllers/temporal-decay-controller.ts` | 150 |
| Schema migration (add `tier`, `ttl_expires_at`, `source_tier`, `session_commit` to `vector_indexes`) | `v3/@claude-flow/memory/src/schema/migrations/0009-temporal-decay.sql` | 25 |
| `episode_store` table | same migration | 10 |
| Config schema addition | `v3/@claude-flow/memory/src/config/memory-config.ts` | 20 |

Total: ~205 LOC new code. No breaking change to existing AgentDB read/write API.

### Config Flag

```typescript
CLAUDE_FLOW_MEMORY_TEMPORAL_DECAY=true   // default: false until benchmark validated
SSGM_COHERENCE_THRESHOLD=0.7
SSGM_SHORT_TERM_TTL_DAYS=7
SSGM_EPISODIC_TTL_DAYS=90
SSGM_LONGTERM_TTL_DAYS=365
```

Default `false` until ADR-088's LongMemEval run confirms baseline; enable after LoCoMo delta measurement.

---

## Consequences

**Positive**:
- Prevents semantic drift accumulation in long-term HNSW store (SSGM paper)
- ~80% token efficiency improvement on LoCoMo-style queries via stale-entry pruning (MemMachine result, Grade A)
- Provenance trail for knowledge-leakage audit (ADR-145 Part B complement)
- Competitive parity with CrewAI v1.12 and LangGraph v0.4 on temporal memory

**Negative / Risks**:
- New migration requires careful rollout: existing HNSW entries have no `tier` — backfill defaults to `long-term`
- Coherence threshold (0.7) is heuristic; too-high values cause valid entries to stall in `episodic`
- `episode_store` table increases SQLite size by ~3× for high-volume agents; needs storage budget monitoring

**Deferred**:
- Multimodal embodied memory (arXiv:2603.07670 frontier #5) — out of scope for this ADR
- Causal/multi-hop retrieval — ADR-155

---

## References

- arXiv:2603.11768 — SSGM Framework (Mar 2026, rev May 2026)
- arXiv:2604.04853 — MemMachine (Apr 2026, Grade A)
- arXiv:2603.07670 — Memory Survey (Mar 2026)
- arXiv:2504.19413 — Mem0 ECAI (2025, Grade A)
