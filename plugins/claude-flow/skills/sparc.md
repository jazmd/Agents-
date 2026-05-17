---
name: sparc
description: Execute the SPARC methodology (Specification → Pseudocode → Architecture → Refinement → Completion) for systematic software development
---

# SPARC Methodology

Structured development through five phases with quality gates.

## Full SPARC Run

```bash
npx claude-flow@latest sparc run "implement OAuth2 login"
```

## Individual Phases

```bash
npx claude-flow@latest sparc spec "user authentication with OAuth2"
npx claude-flow@latest sparc pseudocode --from-spec ./spec.md
npx claude-flow@latest sparc architect --from-pseudocode ./pseudocode.md
npx claude-flow@latest sparc refine --target ./src/auth/
npx claude-flow@latest sparc complete --verify
```

## Phase Agents
| Phase | Agent | Output |
|-------|-------|--------|
| Specification | `specification` | Requirements doc |
| Pseudocode | `pseudocode` | Algorithm design |
| Architecture | `architecture` | System design |
| Refinement | `refinement` | Optimized code |
| Completion | `sparc-coder` | Production-ready impl |
