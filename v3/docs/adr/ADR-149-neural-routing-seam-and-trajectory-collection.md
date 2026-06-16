# ADR-149 — Cost-optimal neural routing seam + DRACO trajectory collection

**Status**: Proposed
**Date**: 2026-06-16
**Issue**: https://github.com/ruvnet/ruflo/issues/2334
**Related**: ADR-026 (routing tiers), ADR-074 / ADR-086 (observable, honest-not-inferred capability), ADR-124 (optional-dependency graceful degradation), ADR-142 (per-bucket Thompson bandit). Supersedes the approach in PR #2347. A separate Phase-2 *artifact-lifecycle* ADR (ruvnet's draft) is the follow-on — see **Numbering**.

## Context

`model-router.ts` already accepts `route(task, embedding?)` and consumes the embedding in `computeSemanticDepth`, but no internal caller ever supplies one — the neural path described in ADR-026 "was never wired in" (post-#2329 header). #2334 (Option B) is to wire it. The two original blockers (undocumented FastGRNN safetensors layout; the candidate-modeling question) were dissolved upstream: `@metaharness/router` exposes a cost-optimal `route(embedding)` over a `{embedding, scores}` dataset with a `qualityBar`, so v1 needs neither a documented tensor layout nor a per-tier candidate encoding.

The point of Phase 1 is to **wire the seam and collect the training dataset** while keeping default behaviour identical — not to ship a trained model.

## Decision

Phase 1 (this PR) — opt-in, default byte-identical:

1. **Embedding feed** (`router-embedding.ts`): lazily compute a local all-MiniLM-L6-v2 vector via the in-tree `generateEmbedding`, **only** when a gate is open. Accept it **only** when `backend === 'onnx'` AND `dimensions === 384`; otherwise return `null`. No hash/fake fallback — a fabricated embedding silently poisons training (ADR-086).
2. **Neural advice** (`neural-router.ts`): behind `CLAUDE_FLOW_ROUTER_NEURAL=1` + an artifact at `CLAUDE_FLOW_ROUTER_MODEL_PATH`, load `@metaharness/router`'s pure-TS `Router`/`TrainedRouter` (optionalDependency, dynamic import, ADR-124) and return the cost-optimal pick. **Advise, not override**: the Thompson bandit's decision stands unless the neural pick clears its quality bar.
3. **Trajectory collection** (`router-trajectory.ts`): behind `CLAUDE_FLOW_ROUTER_TRAJECTORY=1`, append versioned decision rows to `.swarm/model-router-trajectories.jsonl` (best-effort; never throws). These rows capture the **embedding/decision half** of a future training set — not complete `{embedding, scores}` examples (see Consequences).
4. **Observability** (ADR-074/086): every result carries `routedBy ∈ {metaharness-knn, metaharness-krr, fastgrnn, bandit-fallback, heuristic}`, **derived from what actually happened** — never assumed.

`'fastgrnn'` (native `@ruvector/tiny-dancer` acceleration) is **reserved** in the union for Phase 2 so adding it later is not a breaking change.

## Consequences

**Positive**: default path unchanged (gates default off; embedding computed only when needed; the heuristic+bandit complexity is never perturbed by the neural embedding, so a `bandit-fallback` decision is byte-identical to the true default bandit); honest fallback is observable; the seam begins accumulating the embedding half of a future training set with a stable, versioned row schema.
**Negative / risks**: one new optionalDependency (`@metaharness/router`), brand-new + single-author + no npm provenance attestation — mitigated by exact pin + recorded integrity hash + full gating (default path never loads it). `EnhancedModelRouter` (the Tier-1 codemod/booster layer) does not yet consume the neural recommendation — wiring it in is deliberately out of scope here.
**Deferred (Phase 2+)**: trained artifact + training/eval scripts; **the labelled-outcome sink** — a per-query, `taskHash`-keyed record of the quality each tier achieved — needed to turn the collected embedding rows into trainable `{embedding, scores}` examples (the current bandit outcomes are aggregate Beta(α,β) counters, not per-query labels, so this does NOT exist yet); native FastGRNN inference; binding the recommendation to the executing model (stays advisory); promotion to default-on behind a measured +5pp acceptance bar.

## Alternatives considered

- **Bundled seed corpus** to make gate-on non-empty out of the box — rejected: fabricated 384-dim vectors would poison k-NN and violate ADR-086. The gate-on path activates against a real operator-provided artifact instead.
- **tiny-dancer direct (native-only)** as primary — rejected: native binary matrix; `@metaharness/router`'s pure-TS backends avoid a hard native dep.
- **Pure-internal (no dependency)** — viable but ships no live neural path in Phase 1.

## Validation

`tsc` clean for the added/edited files (sandbox residual errors are unrelated optional-dep/project-ref artifacts). `vitest`: 18/18 across the new `router-phase1-2334` suite (6) + existing `router-bandit` (8) + `codemod-routing` (4) — proving byte-identical default (0 embedding calls when gated off), observable `bandit-fallback`, the real `metaharness-knn` path, and rejection of mock/wrong-dim embeddings.

## Numbering

`148` is contested between an in-flight frontier-tier ADR (#2357/#2359) and ruvnet's Phase-2 artifact-lifecycle ADR draft (#2334). This ADR is numbered `149` provisionally — **renumber as the maintainer prefers**; the Phase-2 artifact-lifecycle ADR is ruvnet's to author.
