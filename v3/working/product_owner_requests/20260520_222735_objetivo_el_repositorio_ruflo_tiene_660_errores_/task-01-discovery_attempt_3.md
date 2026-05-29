Goal: Ejecutar el compilador de TypeScript para generar un log completo de todos los errores de tipo y guardarlo para su posterior análisis.

Rules:
- Implement exactly the task below in the current branch and keep the scope bounded to the listed invariants.
- Preserve the hexagonal boundaries of Sovereign Fabric and the append-only event sourcing invariants.
- Work contract-first for ports, contracts, adapters, CLI and workflows; update tests/docs when behavior or contracts change.
- Do not bypass quality gates, documentation governance, golden path checks or sandbox constraints.
- Keep security and performance posture sane: no shell=True, os.system, eval/exec, unsafe deserialization, hardcoded secrets, verify=False, oversized files, or expensive subprocess/I/O loops.
- Prefer reuse over duplication, avoid unjustified new dependencies, and respect the selected execution lane and runtime hints.
- If you create a new Python file, start from templates/golden_paths/ when applicable.
- Repo path contract: only create `allowed_create_paths`; any other referenced repo path must already exist in `existing_repo_paths`. If absent from both, do not invent it.
- Execution mode is implementation-only: stay on repository-local evidence, do not use web search/SOTA exploration, and do not create RFCs or new architecture tracks unless they are explicitly in scope.
- You must use tools (like replace, write_file, or run_shell_command) to implement the change.

Structured context:
{
  "request_title": "Refactorización Orbital del repositorio Ruflo para eliminar ~660 errores de TypeScript",
  "problem": "El repositorio 'Ruflo' presenta aproximadamente 660 errores de compilación de TypeScript después de una migración a Event Sourcing, lo que impide la compilación, los tests y el despliegue.",
  "value_expected": "Restaurar la integridad de la base de código de 'Ruflo' eliminando los errores de TypeScript, permitiendo que el proyecto vuelva a compilar, pasar los tests y funcionar correctamente.",
  "global_invariants": [
    "Todos los cambios de código deben estar justificados por uno o más errores del log de `tsc`.",
    "No se debe introducir nueva funcionalidad.",
    "El número total de errores de `tsc` debe reducirse a cero o a un mínimo aceptable."
  ],
  "execution_lane": "high_risk",
  "semantic_surfaces": [
    "workflows"
  ],
  "task": {
    "id": "task-01-discovery",
    "title": "Descubrimiento y Análisis Topológico de Errores TypeScript",
    "objective": "Ejecutar el compilador de TypeScript para generar un log completo de todos los errores de tipo y guardarlo para su posterior análisis.",
    "in_scope": [
      "Ejecutar el comando `npx pnpm --config.ignore-scripts=false exec tsc --noEmit > ts_errors.log` dentro del entorno de ejecución del repositorio Ruflo.",
      "Analizar el archivo `ts_errors.log` para categorizar los errores (ej. métodos faltantes, tipos incorrectos, importaciones rotas)."
    ],
    "source_of_truth": [
      "La salida estándar del comando `tsc`."
    ],
    "invariants": [
      "El comando se ejecuta hasta completarse.",
      "El archivo `ts_errors.log` contiene todos los errores reportados."
    ],
    "validation": [
      "Verificar que el archivo `ts_errors.log` no está vacío y contiene patrones de error de TypeScript reconocibles."
    ],
    "semantic_surfaces": [],
    "execution_contract": {
      "task_id": "task-01-discovery",
      "mode": "implementation_only",
      "primary_paths": [],
      "approved_paths": [],
      "allowed_create_paths": [],
      "existing_repo_paths": [],
      "required_test_paths": [],
      "required_doc_paths": [],
      "requires_tests": false,
      "requires_docs": false,
      "approved_symbol_names": [
        "Analizar",
        "Análisis",
        "Descubrimiento",
        "Ejecución",
        "Ejecutar",
        "Eliminación",
        "Errores",
        "Event",
        "Modificación",
        "Orbital",
        "Refactorización",
        "Restaurar",
        "Ruflo",
        "Sourcing",
        "Todos",
        "Topológico",
        "TypeScript",
        "Verificar"
      ],
      "architectural_symbol_suffixes": [
        "Port",
        "Adapter",
        "Workflow",
        "Engine",
        "Gateway",
        "Client",
        "Service"
      ],
      "allowed_concept_families": [],
      "forbidden_concept_families": [
        "core_orchestration",
        "rfc",
        "sandbox",
        "temporal",
        "web_research"
      ],
      "forbidden_actions": [
        "Do not use web search, internet research, or SOTA exploration during implementation.",
        "Do not create RFCs, architecture proposals, or decision records unless explicitly requested in scope.",
        "Do not introduce new orchestration, sandbox, Temporal/DAG, or infrastructure tracks unless they are explicitly in scope.",
        "If repository evidence contradicts the task, stop at the contradiction and keep the patch bounded instead of expanding the objective."
      ],
      "allow_design_expansion": false,
      "max_changed_code_files": 4
    }
  },
  "repo_path_contract": {
    "existing_repo_paths": [],
    "allowed_create_paths": []
  },
  "execution_contract": {
    "task_id": "task-01-discovery",
    "mode": "implementation_only",
    "primary_paths": [],
    "approved_paths": [],
    "allowed_create_paths": [],
    "existing_repo_paths": [],
    "required_test_paths": [],
    "required_doc_paths": [],
    "requires_tests": false,
    "requires_docs": false,
    "approved_symbol_names": [
      "Analizar",
      "Análisis",
      "Descubrimiento",
      "Ejecución",
      "Ejecutar",
      "Eliminación",
      "Errores",
      "Event",
      "Modificación",
      "Orbital",
      "Refactorización",
      "Restaurar",
      "Ruflo",
      "Sourcing",
      "Todos",
      "Topológico",
      "TypeScript",
      "Verificar"
    ],
    "architectural_symbol_suffixes": [
      "Port",
      "Adapter",
      "Workflow",
      "Engine",
      "Gateway",
      "Client",
      "Service"
    ],
    "allowed_concept_families": [],
    "forbidden_concept_families": [
      "core_orchestration",
      "rfc",
      "sandbox",
      "temporal",
      "web_research"
    ],
    "forbidden_actions": [
      "Do not use web search, internet research, or SOTA exploration during implementation.",
      "Do not create RFCs, architecture proposals, or decision records unless explicitly requested in scope.",
      "Do not introduce new orchestration, sandbox, Temporal/DAG, or infrastructure tracks unless they are explicitly in scope.",
      "If repository evidence contradicts the task, stop at the contradiction and keep the patch bounded instead of expanding the objective."
    ],
    "allow_design_expansion": false,
    "max_changed_code_files": 4
  },
  "attempt": 3
}

Validation feedback from previous attempt:
SINTOMA:
v3/@claude-flow/claims/src/application/index.ts(13,24): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/@claude-flow/cli/src/commands/memory.ts(381,44): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/@claude-flow/cli/src/commands/neural.ts(1727,41): error TS2307: Cannot find module '@ruvector/learning-wasm' or its corresponding type declarations.
v3/@claude-flow/cli/src/mcp-tools/memory-tools.ts(478,35): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/@claude-flow/cli/src/memory/memory-bridge.ts(89,53): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/@claude-flow/cli/src/ruvector/index.ts(210,31): error TS2307: Cannot find module '@ruvector/learning-wasm' or its corresponding type declarations.
v3/@claude-flow/cli/src/services/ruvector-training.ts(21,8): error TS2307: Cannot find module '@ruvector/learning-wasm' or its corresponding type declarations.
v3/@claude-flow/cli/src/services/ruvector-training.ts(323,39): error TS2307: Cannot find module '@ruvector/learning-wasm' or its corresponding type declarations.
v3/@claude-flow/codex/src/cli.ts(9,25): error TS2307: Cannot find module 'commander' or its corresponding type declarations.
v3/@claude-flow/codex/src/cli.ts(10,19): error TS2307: Cannot find module 'chalk' or its corresponding type declarations.
v3/@claude-flow/codex/src/cli.ts(17,16): error TS2307: Cannot find module 'fs-extra' or its corresponding type declarations.
v3/@claude-flow/codex/src/dual-mode/cli.ts(6,25): error TS2307: Cannot find module 'commander' or its corresponding type declarations.
v3/@claude-flow/codex/src/dual-mode/cli.ts(7,19): error TS2307: Cannot find module 'chalk' or its corresponding type declarations.
v3/@claude-flow/codex/src/initializer.ts(7,16): error TS2307: Cannot find module 'fs-extra' or its corresponding type declarations.
v3/@claude-flow/codex/src/loop/cli.ts(1,25): error TS2307: Cannot find module 'commander' or its corresponding type declarations.
v3/@claude-flow/codex/src/loop/cli.ts(2,19): error TS2307: Cannot find module 'chalk' or its corresponding type declarations.
v3/@claude-flow/codex/src/loop/index.ts(3,16): error TS2307: Cannot find module 'fs-extra' or its corresponding type declarations.
v3/@claude-flow/deployment/examples/basic-release.ts(10,54): error TS2307: Cannot find module '@claude-flow/deployment' or its corresponding type declarations.
v3/@claude-flow/deployment/examples/dry-run.ts(7,56): error TS2307: Cannot find module '@claude-flow/deployment' or its corresponding type declarations.
v3/@claude-flow/deployment/examples/prerelease-workflow.ts(7,46): error TS2307: Cannot find module '@claude-flow/deployment' or its corresponding type declarations.
v3/@claude-flow/guidance/src/hooks.ts(22,8): error TS2307: Cannot find module '@claude-flow/hooks' or its corresponding type declarations.
v3/@claude-flow/guidance/src/hooks.ts(27,8): error TS2307: Cannot find module '@claude-flow/hooks' or its corresponding type declarations.
v3/@claude-flow/guidance/src/hooks.ts(29,35): error TS2307: Cannot find module '@claude-flow/hooks' or its corresponding type declarations.
v3/@claude-flow/mcp/src/transport/http.ts(8,67): error TS2307: Cannot find module 'express' or its corresponding type declarations.
v3/@claude-flow/mcp/src/transport/http.ts(10,44): error TS2307: Cannot find module 'ws' or its corresponding type declarations.
v3/@claude-flow/mcp/src/transport/http.ts(11,18): error TS2307: Cannot find module 'cors' or its corresponding type declarations.
v3/@claude-flow/mcp/src/transport/http.ts(12,20): error TS2307: Cannot find module 'helmet' or its corresponding type declarations.
v3/@claude-flow/mcp/src/transport/websocket.ts(8,53): error TS2307: Cannot find module 'ws' or its corresponding type declarations.
v3/@claude-flow/memory/benchmarks/longmemeval/adapters/agentdb-adapter.ts(39,7): error TS2353: Object literal may only specify known properties, and 'storagePath' does not exist in type 'AgentDBBackendConfig'.
v3/@claude-flow/memory/benchmarks/longmemeval/adapters/baseline-adapter.ts(24,45): error TS2307: Cannot find module '../../../src/onnx-embedder.js' or its corresponding type declarations.
v3/@claude-flow/memory/benchmarks/longmemeval/harness.ts(147,51): error TS2307: Cannot find module '@anthropic-ai/sdk' or its corresponding type declarations.
v3/@claude-flow/memory/examples/agentdb-example.ts(120,7): error TS2353: Object literal may only specify known properties, and 'dbPath' does not exist in type 'Partial<SQLiteBackendConfig>'.
v3/@claude-flow/memory/src/database-provider.ts(126,36): error TS2307: Cannot find module 'better-sqlite3' or its corresponding type declarations.
v3/@claude-flow/memory/src/sqlite-backend.ts(12,27): error TS2307: Cannot find module 'better-sqlite3' or its corresponding type declarations.
v3/@claude-flow/memory/src/sqlite-backend.ts(110,36): error TS2307: Cannot find module 'better-sqlite3' or its corresponding type declarations.
v3/@claude-flow/memory/src/sqljs-backend.ts(12,21): error TS2614: Module '"sql.js"' has no exported member 'Database'. Did you mean to use 'import Database from "sql.js"' instead?
v3/@claude-flow/neural/src/sona-integration.ts(13,70): error TS2307: Cannot find module '@ruvector/sona' or its corresponding type declarations.
v3/@claude-flow/plugin-agent-federation/src/application/inbound-dispatcher.ts(22,35): error TS2307: Cannot find module 'agentic-flow/transport/loader' or its corresponding type declarations.
v3/@claude-flow/plugin-agent-federation/src/transport/midstream-aware-loader.ts(41,8): error TS2307: Cannot find module 'agentic-flow/transport/loader' or its corresponding type declarations.
v3/@claude-flow/plugin-agent-federation/src/transport/midstream-aware-loader.ts(71,25): error TS2307: Cannot find module 'agentic-flow/transport/loader' or its corresponding type declarations.
v3/@claude-flow/plugin-iot-cognitum/src/application/iot-coordinator.ts(1,61): error TS2307: Cannot find module '@cognitum-one/sdk/seed' or its corresponding type declarations.
v3/@claude-flow/plugin-iot-cognitum/src/infrastructure/seed-client-factory.ts(1,28): error TS2307: Cannot find module '@cognitum-one/sdk/seed' or its corresponding type declarations.
v3/@claude-flow/plugin-iot-cognitum/src/infrastructure/seed-client-factory.ts(2,40): error TS2307: Cannot find module '@cognitum-one/sdk/seed' or its corresponding type declarations.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(176,39): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(177,32): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(179,40): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(180,33): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(196,9): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(198,21): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(199,22): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(224,80): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(233,89): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(234,37): error TS18047: 'safeFileType' is possibly 'null'.
v3/@claude-flow/plugins/examples/ruvector-plugins/hook-pattern-library.ts(442,31): error TS2339: Property 'PostToolCall' does not exist on type 'typeof HookEvent'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(10,31): error TS2300: Duplicate identifier 'ReasoningBank'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(11,36): error TS2300: Duplicate identifier 'SemanticCodeSearch'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(12,30): error TS2300: Duplicate identifier 'SONALearning'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(13,30): error TS2300: Duplicate identifier 'IntentRouter'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(14,34): error TS2300: Duplicate identifier 'MCPToolOptimizer'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(15,36): error TS2300: Duplicate identifier 'HookPatternLibrary'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(57,10): error TS2300: Duplicate identifier 'ReasoningBank'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(58,10): error TS2300: Duplicate identifier 'SemanticCodeSearch'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(59,10): error TS2300: Duplicate identifier 'SONALearning'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(60,10): error TS2300: Duplicate identifier 'IntentRouter'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(61,10): error TS2300: Duplicate identifier 'MCPToolOptimizer'.
v3/@claude-flow/plugins/examples/ruvector-plugins/index.ts(62,10): error TS2300: Duplicate identifier 'HookPatternLibrary'.
v3/@claude-flow/plugins/examples/ruvector-plugins/intent-router.ts(138,7): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/intent-router.ts(139,7): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/intent-router.ts(159,51): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/intent-router.ts(181,32): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(133,60): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(141,43): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(142,36): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(148,13): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(148,37): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(148,75): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(152,37): error TS2345: Argument of type 'ToolUsagePattern | undefined' is not assignable to parameter of type 'ToolUsagePattern'.
  Type 'undefined' is not assignable to type 'ToolUsagePattern'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(162,48): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(162,91): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(164,14): error TS18048: 'pattern' is possibly 'undefined'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(164,34): error TS18048: 'pattern' is possibly 'undefined'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(165,14): error TS18048: 'pattern' is possibly 'undefined'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(165,53): error TS18048: 'pattern' is possibly 'undefined'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(167,38): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(170,5): error TS2322: Type 'ToolUsagePattern | undefined' is not assignable to type 'ToolUsagePattern'.
  Type 'undefined' is not assignable to type 'ToolUsagePattern'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(174,63): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(207,54): error TS2345: Argument of type '(string | null)[]' is not assignable to parameter of type 'string[]'.
  Type 'string | null' is not assignable to type 'string'.
    Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(216,48): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(217,44): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(218,117): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(218,123): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(224,50): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(224,72): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(234,102): error TS2322: Type '(string | null)[]' is not assignable to type 'string[]'.
  Type 'string | null' is not assignable to type 'string'.
    Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(258,46): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(261,36): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/mcp-tool-optimizer.ts(391,31): error TS2339: Property 'PostToolCall' does not exist on type 'typeof HookEvent'.
v3/@claude-flow/plugins/examples/ruvector-plugins/reasoning-bank.ts(123,77): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/reasoning-bank.ts(128,7): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/reasoning-bank.ts(165,51): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/reasoning-bank.ts(183,69): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(117,27): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(119,35): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(139,31): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(140,28): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(142,26): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(159,56): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(177,56): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(178,61): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/semantic-code-search.ts(200,50): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/shared/index.ts(7,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/@claude-flow/plugins/examples/ruvector-plugins/shared/index.ts(8,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/@claude-flow/plugins/examples/ruvector-plugins/shared/index.ts(9,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(136,53): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(140,7): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(141,7): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(142,7): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(144,7): error TS2322: Type 'number | null' is not assignable to type 'number'.
  Type 'null' is not assignable to type 'number'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(152,37): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(154,42): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(155,25): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(159,60): error TS2345: Argument of type 'number | null' is not assignable to parameter of type 'number'.
  Type 'null' is not assignable to type 'number'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(164,11): error TS2722: Cannot invoke an object which is possibly 'undefined'.
v3/@claude-flow/plugins/examples/ruvector-plugins/sona-learning.ts(188,58): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
v3/@claude-flow/plugins/examples/ruvector/attention-patterns.ts(96,55): error TS2345: Argument of type '{ connectionString: string; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/attention-patterns.ts(110,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/attention-patterns.ts(343,7): error TS2322: Type 'Float32Array<ArrayBuffer>' is not assignable to type 'Float32Array<ArrayBufferLike>[] | number[][]'.
  Type 'Float32Array<ArrayBuffer>' is missing the following properties from type 'number[][]': pop, push, concat, shift, and 5 more.
v3/@claude-flow/plugins/examples/ruvector/attention-patterns.ts(344,7): error TS2322: Type 'Float32Array<ArrayBuffer>' is not assignable to type 'Float32Array<ArrayBufferLike>[] | number[][]'.
  Type 'Float32Array<ArrayBuffer>' is missing the following properties from type 'number[][]': pop, push, concat, shift, and 5 more.
v3/@claude-flow/plugins/examples/ruvector/attention-patterns.ts(345,7): error TS2322: Type 'Float32Array<ArrayBuffer>' is not assignable to type 'Float32Array<ArrayBufferLike>[] | number[][]'.
  Type 'Float32Array<ArrayBuffer>' is missing the following properties from type 'number[][]': pop, push, concat, shift, and 5 more.
v3/@claude-flow/plugins/examples/ruvector/attention-patterns.ts(389,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(22,8): error TS2305: Module '"../../src/integrations/ruvector/index.js"' has no exported member 'VectorRecord'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(81,55): error TS2345: Argument of type '{ connectionString: string; poolSize: number; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; poolSize: number; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(91,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(98,18): error TS2339: Property 'createCollection' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(126,20): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(150,7): error TS2353: Object literal may only specify known properties, and 'includeDistance' does not exist in type 'VectorSearchOptions'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(153,40): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(161,42): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(174,39): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(188,18): error TS2339: Property 'update' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(199,37): error TS2339: Property 'get' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(222,18): error TS2339: Property 'insertBatch' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(233,32): error TS2339: Property 'getCollectionStats' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(245,18): error TS2339: Property 'delete' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(251,20): error TS2339: Property 'delete' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(256,37): error TS2339: Property 'get' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/basic-usage.ts(282,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(24,8): error TS2305: Module '"../../src/integrations/ruvector/gnn.js"' has no exported member 'GNNConfig'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(25,8): error TS2459: Module '"../../src/integrations/ruvector/gnn.js"' declares 'GraphData' locally, but it is not exported.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(26,8): error TS2305: Module '"../../src/integrations/ruvector/gnn.js"' has no exported member 'AdjacencyMatrix'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(216,55): error TS2345: Argument of type '{ connectionString: string; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(221,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(267,64): error TS2554: Expected 1 arguments, but got 2.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(271,52): error TS2339: Property 'length' does not exist on type 'GNNOutput'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(295,64): error TS2554: Expected 1 arguments, but got 2.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(300,52): error TS2339: Property 'length' does not exist on type 'GNNOutput'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(303,39): error TS2339: Property 'getAttentionWeights' does not exist on type 'GATLayer'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(335,66): error TS2554: Expected 1 arguments, but got 2.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(442,18): error TS2339: Property 'createCollection' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(451,20): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(472,41): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/gnn-analysis.ts(496,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(21,3): error TS2305: Module '"../../src/integrations/ruvector/hyperbolic.js"' has no exported member 'PoincareBall'.
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(22,3): error TS2305: Module '"../../src/integrations/ruvector/hyperbolic.js"' has no exported member 'PoincareEmbedding'.
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(23,8): error TS2724: '"../../src/integrations/ruvector/hyperbolic.js"' has no exported member named 'HyperbolicConfig'. Did you mean 'HyperbolicSpaceConfig'?
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(24,8): error TS2305: Module '"../../src/integrations/ruvector/hyperbolic.js"' has no exported member 'HierarchyNode'.
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(242,55): error TS2345: Argument of type '{ connectionString: string; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(254,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(450,18): error TS2339: Property 'createCollection' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(460,22): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(481,39): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/hyperbolic-hierarchies.ts(552,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(18,8): error TS2305: Module '"../../src/integrations/ruvector/index.js"' has no exported member 'VectorRecord'.
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(332,55): error TS2345: Argument of type '{ connectionString: string; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(337,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(610,20): error TS2339: Property 'createCollection' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(624,20): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(637,20): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(650,41): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(655,38): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/quantization.ts(675,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/self-learning.ts(174,55): error TS2345: Argument of type '{ connectionString: string; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/self-learning.ts(194,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/self-learning.ts(442,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(18,8): error TS2305: Module '"../../src/integrations/ruvector/index.js"' has no exported member 'VectorRecord'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(356,55): error TS2345: Argument of type '{ connectionString: string; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(363,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(370,18): error TS2339: Property 'createCollection' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(385,20): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(416,36): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(439,38): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(466,42): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(500,36): error TS2339: Property 'get' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(503,43): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(527,38): error TS2339: Property 'get' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(545,44): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/semantic-search.ts(571,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(18,8): error TS2305: Module '"../../src/integrations/ruvector/index.js"' has no exported member 'VectorRecord'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(291,29): error TS2339: Property 'insertBatch' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(330,55): error TS2345: Argument of type '{ connectionString: string; poolSize: number; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; poolSize: number; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(336,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(344,18): error TS2339: Property 'createCollection' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(408,32): error TS2339: Property 'getCollectionStats' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(428,18): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(436,20): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(467,36): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/streaming-large-data.ts(502,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(18,8): error TS2305: Module '"../../src/integrations/ruvector/index.js"' has no exported member 'VectorRecord'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(240,55): error TS2345: Argument of type '{ connectionString: string; poolSize: number; }' is not assignable to parameter of type 'RuVectorConfig'.
  Type '{ connectionString: string; poolSize: number; }' is missing the following properties from type 'RuVectorConfig': host, port, database, user, password
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(248,18): error TS2339: Property 'connect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(257,18): error TS2339: Property 'createCollection' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(274,24): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(298,24): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(326,24): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(342,26): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(363,24): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(388,42): error TS2339: Property 'search' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(397,24): error TS2339: Property 'update' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(423,34): error TS2339: Property 'getCollectionStats' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(433,24): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(473,26): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(506,18): error TS2339: Property 'insert' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(514,36): error TS2339: Property 'get' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(527,38): error TS2339: Property 'get' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(532,22): error TS2339: Property 'update' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(558,32): error TS2339: Property 'getCollectionStats' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/examples/ruvector/transactions.ts(589,18): error TS2339: Property 'disconnect' does not exist on type 'RuVectorBridge'.
v3/@claude-flow/plugins/src/integrations/index.ts(50,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/@claude-flow/plugins/src/integrations/ruvector/index.ts(103,10): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/@claude-flow/providers/src/__tests__/quick-test.ts(15,24): error TS2307: Cannot find module 'dotenv' or its corresponding type declarations.
v3/@claude-flow/providers/src/__tests__/quick-test.ts(248,20): error TS2345: Argument of type '{ provider: "anthropic"; apiKey: string; model: string; maxTokens: number; }' is not assignable to parameter of type 'never'.
v3/@claude-flow/providers/src/__tests__/quick-test.ts(258,20): error TS2345: Argument of type 'any' is not assignable to parameter of type 'never'.
v3/@claude-flow/providers/src/ruvector-provider.ts(186,34): error TS2307: Cannot find module '@ruvector/ruvllm' or its corresponding type declarations.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(17,20): error TS2344: Type '(...args: A) => R' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(26,20): error TS2344: Type '(...args: A) => R' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(117,22): error TS2344: Type '(password: string) => Promise<string>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(118,24): error TS2344: Type '(password: string, hash: string) => Promise<boolean>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(119,26): error TS2344: Type '(password: string) => { isValid: boolean; errors: string[]; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(120,29): error TS2344: Type '(hash: string) => boolean' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(121,27): error TS2344: Type '() => Record<string, unknown>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(141,34): error TS2344: Type '(length?: number | undefined) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(142,32): error TS2344: Type '(prefix?: string | undefined) => { key: string; prefix: string; keyId: string; createdAt: Date; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(143,32): error TS2344: Type '(length?: number | undefined) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(144,39): error TS2344: Type '() => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(145,49): error TS2344: Type '(expirationDays?: number | undefined) => { adminPassword: string; servicePassword: string; jwtSecret: string; sessionSecret: string; encryptionKey: string; generatedAt: Date; expiresAt?: Date | undefined; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(154,38): error TS2344: Type '() => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(155,35): error TS2344: Type '() => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(156,31): error TS2344: Type '() => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(192,26): error TS2344: Type '(path: string) => Promise<{ isValid: boolean; resolvedPath: string; relativePath: string; matchedPrefix: string; errors: string[]; }>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(199,30): error TS2344: Type '(path: string) => { isValid: boolean; resolvedPath: string; relativePath: string; matchedPrefix: string; errors: string[]; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(206,33): error TS2344: Type '(path: string) => Promise<string>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(207,28): error TS2344: Type '(prefix: string, ...segments: string[]) => Promise<string>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(208,33): error TS2344: Type '(path: string) => boolean' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(209,36): error TS2344: Type '() => readonly string[]' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(242,25): error TS2344: Type '(command: string, args?: string[] | undefined) => Promise<{ stdout: string; stderr: string; exitCode: number; command: string; args: string[]; duration: number; }>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(250,34): error TS2344: Type '(command: string, args?: string[] | undefined) => { process: unknown; stdout: unknown; stderr: unknown; promise: Promise<unknown>; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(256,34): error TS2344: Type '(arg: string) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(257,34): error TS2344: Type '(command: string) => boolean' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(258,30): error TS2344: Type '(command: string) => void' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(259,36): error TS2344: Type '() => readonly string[]' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(289,5): error TS2322: Type 'Mock<any[], any>' is not assignable to type 'MockInstance<(command: string) => void, any>'.
  Types of property 'mock' are incompatible.
    Type 'MockContext<any[], any>' is not assignable to type 'MockContext<(command: string) => void, any>'.
      Type 'any[]' is not assignable to type '(command: string) => void'.
        Type 'any[]' provides no match for the signature '(command: string): void'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(299,26): error TS2344: Type '(length?: number | undefined) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(300,40): error TS2344: Type '(expirationSeconds?: number | undefined, metadata?: Record<string, unknown> | undefined) => { value: string; createdAt: Date; expiresAt: Date; metadata?: Record<string, unknown> | undefined; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(306,38): error TS2344: Type '() => { value: string; createdAt: Date; expiresAt: Date; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(307,35): error TS2344: Type '() => { value: string; createdAt: Date; expiresAt: Date; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(308,34): error TS2344: Type '(prefix?: string | undefined) => { value: string; createdAt: Date; expiresAt: Date; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(309,42): error TS2344: Type '(length?: number | undefined, expirationMinutes?: number | undefined, maxAttempts?: number | undefined) => { code: string; createdAt: Date; expiresAt: Date; attempts: number; maxAttempts: number; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(316,37): error TS2344: Type '(payload: Record<string, unknown>, expirationSeconds?: number | undefined) => { token: string; signature: string; combined: string; createdAt: Date; expiresAt: Date; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(323,35): error TS2344: Type '(combined: string) => Record<string, unknown> | null' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(324,35): error TS2344: Type '() => { accessToken: { value: string; createdAt: Date; expiresAt: Date; }; refreshToken: { value: string; createdAt: Date; expiresAt: Date; }; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(328,27): error TS2344: Type '(token: { expiresAt: Date; }) => boolean' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(329,25): error TS2344: Type '(a: string, b: string) => boolean' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(389,31): error TS2344: Type '(email: string) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(390,34): error TS2344: Type '(password: string) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(391,36): error TS2344: Type '(id: string) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(392,30): error TS2344: Type '(path: string) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(393,36): error TS2344: Type '(arg: string) => string' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(394,38): error TS2344: Type '(data: unknown) => { email: string; password: string; mfaCode?: string | undefined; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(395,36): error TS2344: Type '(data: unknown) => { email: string; password: string; role: string; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(396,35): error TS2344: Type '(data: unknown) => { taskId: string; content: string; agentType: string; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(422,8): error TS2352: Conversion of type 'Function & Record<"mockReset", unknown>' to type 'MockInstance<any[], any>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Function & Record<"mockReset", unknown>' is missing the following properties from type 'MockInstance<any[], any>': getMockName, mockName, mock, mockClear, and 12 more.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(434,8): error TS2352: Conversion of type 'Function & Record<"mockClear", unknown>' to type 'MockInstance<any[], any>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Function & Record<"mockClear", unknown>' is missing the following properties from type 'MockInstance<any[], any>': getMockName, mockName, mock, mockReset, and 12 more.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(446,8): error TS2352: Conversion of type 'Function & Record<"mockRestore", unknown>' to type 'MockInstance<any[], any>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Function & Record<"mockRestore", unknown>' is missing the following properties from type 'MockInstance<any[], any>': getMockName, mockName, mock, mockClear, and 12 more.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(456,23): error TS2344: Type 'T extends MockInstance<infer F extends any[], any> ? F : never' does not satisfy the constraint '(...args: any) => any'.
  Type 'any[]' is not assignable to type '(...args: any) => any'.
    Type 'any[]' provides no match for the signature '(...args: any): any'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(458,3): error TS2304: Cannot find name 'expect'.
v3/@claude-flow/security/__tests__/helpers/create-mock.ts(468,3): error TS2304: Cannot find name 'expect'.
v3/@claude-flow/security/src/password-hasher.ts(23,25): error TS2307: Cannot find module 'bcryptjs' or its corresponding type declarations.
v3/@claude-flow/shared/src/events/event-store.ts(21,21): error TS2614: Module '"sql.js"' has no exported member 'Database'. Did you mean to use 'import Database from "sql.js"' instead?
v3/@claude-flow/shared/src/mcp/transport/http.ts(16,67): error TS2307: Cannot find module 'express' or its corresponding type declarations.
v3/@claude-flow/shared/src/mcp/transport/http.ts(18,44): error TS2307: Cannot find module 'ws' or its corresponding type declarations.
v3/@claude-flow/shared/src/mcp/transport/http.ts(19,18): error TS2307: Cannot find module 'cors' or its corresponding type declarations.
v3/@claude-flow/shared/src/mcp/transport/http.ts(20,20): error TS2307: Cannot find module 'helmet' or its corresponding type declarations.
v3/@claude-flow/shared/src/mcp/transport/websocket.ts(16,53): error TS2307: Cannot find module 'ws' or its corresponding type declarations.
v3/@claude-flow/testing/src/fixtures/agent-fixtures.ts(729,17): error TS2344: Type '(task: unknown) => Promise<unknown>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/agent-fixtures.ts(730,21): error TS2344: Type '(message: unknown) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/agent-fixtures.ts(731,19): error TS2344: Type '() => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/agent-fixtures.ts(732,20): error TS2344: Type '() => AgentMetrics' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(935,17): error TS2344: Type '() => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(936,20): error TS2344: Type '() => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(937,18): error TS2344: Type '(name: string, params: Record<string, unknown>) => Promise<MCPToolResult>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(938,19): error TS2344: Type '() => Promise<MCPTool[]>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(939,22): error TS2344: Type '(uri: string) => Promise<MCPResourceContent>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(940,23): error TS2344: Type '() => Promise<MCPResource[]>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(941,19): error TS2344: Type '(name: string, args: Record<string, string>) => Promise<string>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(942,21): error TS2344: Type '() => Promise<MCPPrompt[]>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(943,21): error TS2344: Type '() => boolean' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(944,27): error TS2344: Type '() => MCPSessionContext | null' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(972,15): error TS2344: Type '() => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(973,14): error TS2344: Type '() => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(974,22): error TS2344: Type '(tool: MCPTool) => void' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(975,26): error TS2344: Type '(resource: MCPResource) => void' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(976,24): error TS2344: Type '(prompt: MCPPrompt) => void' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(977,23): error TS2344: Type '(request: MCPRequestBase) => Promise<MCPResponseBase<unknown>>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(978,19): error TS2344: Type '() => MCPServerStatus' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(988,5): error TS2322: Type 'Mock<any[], any>' is not assignable to type 'Mock<(tool: MCPTool) => void, any>'.
  Types of property 'mock' are incompatible.
    Type 'MockContext<any[], any>' is not assignable to type 'MockContext<(tool: MCPTool) => void, any>'.
      Type 'any[]' is not assignable to type '(tool: MCPTool) => void'.
        Type 'any[]' provides no match for the signature '(tool: MCPTool): void'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(989,5): error TS2322: Type 'Mock<any[], any>' is not assignable to type 'Mock<(resource: MCPResource) => void, any>'.
  Types of property 'mock' are incompatible.
    Type 'MockContext<any[], any>' is not assignable to type 'MockContext<(resource: MCPResource) => void, any>'.
      Type 'any[]' is not assignable to type '(resource: MCPResource) => void'.
        Type 'any[]' provides no match for the signature '(resource: MCPResource): void'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(990,5): error TS2322: Type 'Mock<any[], any>' is not assignable to type 'Mock<(prompt: MCPPrompt) => void, any>'.
  Types of property 'mock' are incompatible.
    Type 'MockContext<any[], any>' is not assignable to type 'MockContext<(prompt: MCPPrompt) => void, any>'.
      Type 'any[]' is not assignable to type '(prompt: MCPPrompt) => void'.
        Type 'any[]' provides no match for the signature '(prompt: MCPPrompt): void'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(1014,14): error TS2344: Type '(message: string) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(1015,17): error TS2344: Type '() => Promise<string>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(1016,15): error TS2344: Type '() => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/mcp-fixtures.ts(1017,16): error TS2344: Type '() => boolean' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(704,15): error TS2344: Type '(key: string, value: unknown, metadata?: MemoryMetadata | undefined) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(705,18): error TS2344: Type '(key: string) => Promise<unknown>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(706,16): error TS2344: Type '(query: VectorQuery) => Promise<SearchResult[]>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(707,16): error TS2344: Type '(key: string) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(708,15): error TS2344: Type '() => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(709,18): error TS2344: Type '() => Promise<{ totalEntries: number; sizeBytes: number; }>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(730,16): error TS2344: Type '(id: string, embedding: number[], metadata?: unknown) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(731,16): error TS2344: Type '(embedding: number[], k: number) => Promise<SearchResult[]>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(732,16): error TS2344: Type '(id: string) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(733,16): error TS2344: Type '(id: string, embedding: number[], metadata?: unknown) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(734,18): error TS2344: Type '() => Promise<{ vectorCount: number; indexSize: number; }>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/memory-fixtures.ts(735,22): error TS2344: Type '() => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(782,20): error TS2344: Type '(config: SwarmConfig) => Promise<SwarmState>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(783,20): error TS2344: Type '(agents: string[], task: SwarmTask) => Promise<CoordinationResult>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(784,18): error TS2344: Type '(graceful?: boolean | undefined) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(785,18): error TS2344: Type '(agentId: string) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(786,21): error TS2344: Type '(agentId: string) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(787,18): error TS2344: Type '() => SwarmState' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(788,19): error TS2344: Type '(message: SwarmMessage<unknown>) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(789,26): error TS2344: Type '<T>(request: ConsensusRequest<T>) => Promise<ConsensusResponse<T>>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(819,17): error TS2344: Type '(message: SwarmMessage<unknown>) => Promise<void>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(820,19): error TS2344: Type '(pattern: string, handler: (message: SwarmMessage<unknown>) => void) => () => void' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(821,21): error TS2344: Type '(pattern: string) => void' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(822,17): error TS2344: Type '(message: SwarmMessage<unknown>, timeout?: number | undefined) => Promise<SwarmMessage<unknown>>' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(823,18): error TS2344: Type '() => { messagesSent: number; messagesReceived: number; }' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/fixtures/swarm-fixtures.ts(833,5): error TS2322: Type 'Mock<any[], any>' is not assignable to type 'Mock<(pattern: string) => void, any>'.
  Types of property 'mock' are incompatible.
    Type 'MockContext<any[], any>' is not assignable to type 'MockContext<(pattern: string) => void, any>'.
      Type 'any[]' is not assignable to type '(pattern: string) => void'.
        Type 'any[]' provides no match for the signature '(pattern: string): void'.
v3/@claude-flow/testing/src/helpers/create-mock.ts(16,12): error TS2344: Type '(...args: A) => R' does not satisfy the constraint 'any[]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(287,35): error TS2345: Argument of type '(event: DomainEvent) => Promise<void>' is not assignable to parameter of type '(...args: (event: DomainEvent) => Promise<void>) => any'.
  Types of parameters 'event' and 'args' are incompatible.
    Type '(event: DomainEvent) => Promise<void>' is not assignable to type '[event: DomainEvent]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(297,37): error TS2345: Argument of type '(eventType: string, handler: EventHandler) => () => boolean | undefined' is not assignable to parameter of type '(...args: (eventType: string, handler: EventHandler) => () => void) => any'.
  Types of parameters 'eventType' and 'args' are incompatible.
    Type '(eventType: string, handler: EventHandler) => () => void' is not assignable to type '[eventType: string, handler: EventHandler]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(305,39): error TS2345: Argument of type '(eventType: string, handler: EventHandler) => void' is not assignable to parameter of type '(...args: (eventType: string, handler: EventHandler) => void) => any'.
  Types of parameters 'eventType' and 'args' are incompatible.
    Type '(eventType: string, handler: EventHandler) => void' is not assignable to type '[eventType: string, handler: EventHandler]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(309,46): error TS2345: Argument of type '(eventType: string) => number' is not assignable to parameter of type '(...args: (eventType: string) => number) => any'.
  Types of parameters 'eventType' and 'args' are incompatible.
    Type '(eventType: string) => number' is not assignable to type '[eventType: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(325,34): error TS2345: Argument of type '(definition: TaskDefinition) => Promise<Task>' is not assignable to parameter of type '(...args: (definition: TaskDefinition) => Promise<Task>) => any'.
  Types of parameters 'definition' and 'args' are incompatible.
    Type '(definition: TaskDefinition) => Promise<Task>' is not assignable to type '[definition: TaskDefinition]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(339,35): error TS2345: Argument of type '(taskId: string) => Promise<{ taskId: string; success: boolean; duration: number; }>' is not assignable to parameter of type '(...args: (taskId: string) => Promise<TaskResult>) => any'.
  Types of parameters 'taskId' and 'args' are incompatible.
    Type '(taskId: string) => Promise<TaskResult>' is not assignable to type '[taskId: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(360,34): error TS2345: Argument of type '(taskId: string) => Promise<void>' is not assignable to parameter of type '(...args: (taskId: string) => Promise<void>) => any'.
  Types of parameters 'taskId' and 'args' are incompatible.
    Type '(taskId: string) => Promise<void>' is not assignable to type '[taskId: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(367,37): error TS2345: Argument of type '(taskId: string) => Promise<TaskStatus>' is not assignable to parameter of type '(...args: (taskId: string) => Promise<TaskStatus>) => any'.
  Types of parameters 'taskId' and 'args' are incompatible.
    Type '(taskId: string) => Promise<TaskStatus>' is not assignable to type '[taskId: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(372,35): error TS2345: Argument of type '(taskId: string) => Promise<Task | null>' is not assignable to parameter of type '(...args: (taskId: string) => Promise<Task | null>) => any'.
  Types of parameters 'taskId' and 'args' are incompatible.
    Type '(taskId: string) => Promise<Task | null>' is not assignable to type '[taskId: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(376,37): error TS2345: Argument of type '(filters?: TaskFilters) => Promise<Task[]>' is not assignable to parameter of type '(...args: (filters?: TaskFilters | undefined) => Promise<Task[]>) => any'.
  Types of parameters 'filters' and 'args' are incompatible.
    Type '(filters?: TaskFilters | undefined) => Promise<Task[]>' is not assignable to type '[filters?: TaskFilters | undefined]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(404,33): error TS2345: Argument of type '(config: AgentConfig) => Promise<{ agent: AgentInstance; sessionId: string; startupTime: number; success: boolean; }>' is not assignable to parameter of type '(...args: (config: AgentConfig) => Promise<AgentSpawnResult>) => any'.
  Types of parameters 'config' and 'args' are incompatible.
    Type '(config: AgentConfig) => Promise<AgentSpawnResult>' is not assignable to type '[config: AgentConfig]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(423,37): error TS2345: Argument of type '(agentId: string) => Promise<void>' is not assignable to parameter of type '(...args: (agentId: string, options?: TerminateOptions | undefined) => Promise<void>) => any'.
  Types of parameters 'agentId' and 'args' are incompatible.
    Type '(agentId: string, options?: TerminateOptions | undefined) => Promise<void>' is not assignable to type '[agentId: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(430,36): error TS2345: Argument of type '(agentId: string) => Promise<AgentInstance | null>' is not assignable to parameter of type '(...args: (agentId: string) => Promise<AgentInstance | null>) => any'.
  Types of parameters 'agentId' and 'args' are incompatible.
    Type '(agentId: string) => Promise<AgentInstance | null>' is not assignable to type '[agentId: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(434,38): error TS2345: Argument of type '(filters?: AgentFilters) => Promise<AgentInstance[]>' is not assignable to parameter of type '(...args: (filters?: AgentFilters | undefined) => Promise<AgentInstance[]>) => any'.
  Types of parameters 'filters' and 'args' are incompatible.
    Type '(filters?: AgentFilters | undefined) => Promise<AgentInstance[]>' is not assignable to type '[filters?: AgentFilters | undefined]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(459,39): error TS2345: Argument of type '(agentId: string) => Promise<{ healthy: boolean; lastActivity: Date; metrics: { tasksCompleted: number; tasksFailed: number; avgTaskDuration: number; totalDuration: number; errorRate: number; memoryUsageMb: number; }; }>' is not assignable to parameter of type '(...args: (agentId: string) => Promise<AgentHealthCheck>) => any'.
  Types of parameters 'agentId' and 'args' are incompatible.
    Type '(agentId: string) => Promise<AgentHealthCheck>' is not assignable to type '[agentId: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(486,33): error TS2345: Argument of type '(key: string, value: unknown, metadata?: Record<string, unknown>) => Promise<void>' is not assignable to parameter of type '(...args: (key: string, value: unknown, metadata?: Record<string, unknown> | undefined) => Promise<void>) => any'.
  Types of parameters 'key' and 'args' are incompatible.
    Type '(key: string, value: unknown, metadata?: Record<string, unknown> | undefined) => Promise<void>' is not assignable to type '[key: string, value: unknown, metadata?: Record<string, unknown> | undefined]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(490,36): error TS2345: Argument of type '(key: string) => Promise<{} | null>' is not assignable to parameter of type '(...args: (key: string) => Promise<unknown>) => any'.
  Types of parameters 'key' and 'args' are incompatible.
    Type '(key: string) => Promise<unknown>' is not assignable to type '[key: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(496,34): error TS2345: Argument of type '(key: string) => Promise<void>' is not assignable to parameter of type '(...args: (key: string) => Promise<void>) => any'.
  Types of parameters 'key' and 'args' are incompatible.
    Type '(key: string) => Promise<void>' is not assignable to type '[key: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(522,40): error TS2345: Argument of type '(path: string) => boolean' is not assignable to parameter of type '(...args: (path: string) => boolean) => any'.
  Types of parameters 'path' and 'args' are incompatible.
    Type '(path: string) => boolean' is not assignable to type '[path: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(527,41): error TS2345: Argument of type '(input: string, options?: InputValidationOptions) => { valid: boolean; errors: string[]; } | { valid: boolean; errors?: undefined; }' is not assignable to parameter of type '(...args: (input: string, options?: InputValidationOptions | undefined) => { valid: boolean; errors?: string[] | undefined; }) => any'.
  Types of parameters 'input' and 'args' are incompatible.
    Type '(input: string, options?: InputValidationOptions | undefined) => { valid: boolean; errors?: string[] | undefined; }' is not assignable to type '[input: string, options?: InputValidationOptions | undefined]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(535,40): error TS2345: Argument of type '(password: string) => Promise<string>' is not assignable to parameter of type '(...args: (password: string) => Promise<string>) => any'.
  Types of parameters 'password' and 'args' are incompatible.
    Type '(password: string) => Promise<string>' is not assignable to type '[password: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(539,42): error TS2345: Argument of type '(password: string, hash: string) => Promise<boolean>' is not assignable to parameter of type '(...args: (password: string, hash: string) => Promise<boolean>) => any'.
  Types of parameters 'password' and 'args' are incompatible.
    Type '(password: string, hash: string) => Promise<boolean>' is not assignable to type '[password: string, hash: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(543,41): error TS2345: Argument of type '(payload: Record<string, unknown>) => Promise<string>' is not assignable to parameter of type '(...args: (payload: Record<string, unknown>, expiresIn?: number | undefined) => Promise<string>) => any'.
  Types of parameters 'payload' and 'args' are incompatible.
    Type '(payload: Record<string, unknown>, expiresIn?: number | undefined) => Promise<string>' is not assignable to type '[payload: Record<string, unknown>]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(547,39): error TS2345: Argument of type '(token: string) => Promise<any>' is not assignable to parameter of type '(...args: (token: string) => Promise<Record<string, unknown>>) => any'.
  Types of parameters 'token' and 'args' are incompatible.
    Type '(token: string) => Promise<Record<string, unknown>>' is not assignable to type '[token: string]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(579,38): error TS2345: Argument of type '(config: SwarmConfig) => Promise<SwarmState>' is not assignable to parameter of type '(...args: (config: SwarmConfig) => Promise<SwarmState>) => any'.
  Types of parameters 'config' and 'args' are incompatible.
    Type '(config: SwarmConfig) => Promise<SwarmState>' is not assignable to type '[config: SwarmConfig]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(585,38): error TS2345: Argument of type '(agents: string[], task: SwarmTask) => Promise<{ success: boolean; completedTasks: number; failedTasks: number; totalDuration: number; agentMetrics: Map<any, any>; }>' is not assignable to parameter of type '(...args: (agents: string[], task: SwarmTask) => Promise<CoordinationResult>) => any'.
  Types of parameters 'agents' and 'args' are incompatible.
    Type '(agents: string[], task: SwarmTask) => Promise<CoordinationResult>' is not assignable to type '[agents: string[], task: SwarmTask]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(652,33): error TS2345: Argument of type '(message: string, context?: Record<string, unknown>) => void' is not assignable to parameter of type '(...args: (message: string, context?: Record<string, unknown> | undefined) => void) => any'.
  Types of parameters 'message' and 'args' are incompatible.
    Type '(message: string, context?: Record<string, unknown> | undefined) => void' is not assignable to type '[message: string, context?: Record<string, unknown> | undefined]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(656,32): error TS2345: Argument of type '(message: string, context?: Record<string, unknown>) => void' is not assignable to parameter of type '(...args: (message: string, context?: Record<string, unknown> | undefined) => void) => any'.
  Types of parameters 'message' and 'args' are incompatible.
    Type '(message: string, context?: Record<string, unknown> | undefined) => void' is not assignable to type '[message: string, context?: Record<string, unknown> | undefined]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(660,32): error TS2345: Argument of type '(message: string, context?: Record<string, unknown>) => void' is not assignable to parameter of type '(...args: (message: string, context?: Record<string, unknown> | undefined) => void) => any'.
  Types of parameters 'message' and 'args' are incompatible.
    Type '(message: string, context?: Record<string, unknown> | undefined) => void' is not assignable to type '[message: string, context?: Record<string, unknown> | undefined]'.
v3/@claude-flow/testing/src/helpers/mock-factory.ts(664,33): error TS2345: Argument of type '(message: string, error?: Error, context?: Record<string, unknown>) => void' is not assignable to parameter of type '(...args: (message: string, error?: Error | undefined, context?: Record<string, unknown> | undefined) => void) => any'.
  Types of parameters 'message' and 'args' are incompatible.
    Type '(message: string, error?: Error | undefined, context?: Record<string, unknown> | undefined) => void' is not assignable to type '[message: string, error?: Error | undefined, context?: Record<string, unknown> | undefined]'.
v3/@claude-flow/testing/src/helpers/swarm-instance.ts(161,37): error TS2345: Argument of type '(task: SwarmTask) => Promise<SwarmTaskResult>' is not assignable to parameter of type '(...args: (task: SwarmTask) => Promise<SwarmTaskResult>) => any'.
  Types of parameters 'task' and 'args' are incompatible.
    Type '(task: SwarmTask) => Promise<SwarmTaskResult>' is not assignable to type '[task: SwarmTask]'.
v3/@claude-flow/testing/src/helpers/swarm-instance.ts(172,41): error TS2345: Argument of type '(message: SwarmMessage) => Promise<void>' is not assignable to parameter of type '(...args: (message: SwarmMessage) => Promise<void>) => any'.
  Types of parameters 'message' and 'args' are incompatible.
    Type '(message: SwarmMessage) => Promise<void>' is not assignable to type '[message: SwarmMessage]'.
v3/@claude-flow/testing/src/helpers/swarm-instance.ts(277,31): error TS2345: Argument of type '[{ from: string; to: string; type: string; payload: SwarmTask; timestamp: Date; }]' is not assignable to parameter of type '(message: SwarmMessage) => Promise<void>'.
  Type '[{ from: string; to: string; type: string; payload: SwarmTask; timestamp: Date; }]' provides no match for the signature '(message: SwarmMessage): Promise<void>'.
v3/@claude-flow/testing/src/helpers/swarm-instance.ts(288,42): error TS2345: Argument of type '[SwarmTask]' is not assignable to parameter of type '(task: SwarmTask) => Promise<SwarmTaskResult>'.
  Type '[SwarmTask]' provides no match for the signature '(task: SwarmTask): Promise<SwarmTaskResult>'.
v3/@claude-flow/testing/src/helpers/test-application.ts(209,48): error TS2345: Argument of type '(def: TaskDefinition) => Promise<{ id: string; name: string; type: string; status: TaskStatus; payload: unknown; createdAt: Date; }>' is not assignable to parameter of type '(...args: (task: TaskDefinition) => Promise<Task>) => any'.
  Types of parameters 'def' and 'args' are incompatible.
    Type '(task: TaskDefinition) => Promise<Task>' is not assignable to type '[def: TaskDefinition]'.
v3/@claude-flow/testing/src/helpers/test-application.ts(231,50): error TS2345: Argument of type '(config: AgentConfig) => Promise<{ id: string; type: string; name: string; status: "idle"; }>' is not assignable to parameter of type '(...args: (config: AgentConfig) => Promise<Agent>) => any'.
  Types of parameters 'config' and 'args' are incompatible.
    Type '(config: AgentConfig) => Promise<Agent>' is not assignable to type '[config: AgentConfig]'.
v3/@claude-flow/testing/src/helpers/test-application.ts(293,19): error TS2352: Conversion of type 'MockedInterface<IEventBus>' to type 'IEventBus' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Types of property 'publish' are incompatible.
    Type 'Mock<(event: DomainEvent) => Promise<void>, any>' is not comparable to type '(event: DomainEvent) => Promise<void>'.
      Types of parameters 'args' and 'event' are incompatible.
        Type '[event: DomainEvent]' is not comparable to type '(event: DomainEvent) => Promise<void>'.
          Type '[event: DomainEvent]' provides no match for the signature '(event: DomainEvent): Promise<void>'.
v3/@claude-flow/testing/src/helpers/test-application.ts(294,22): error TS2352: Conversion of type 'MockedInterface<ITaskManager>' to type 'ITaskManager' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Types of property 'create' are incompatible.
    Type 'Mock<(task: TaskDefinition) => Promise<Task>, any>' is not comparable to type '(task: TaskDefinition) => Promise<Task>'.
      Types of parameters 'args' and 'task' are incompatible.
        Type '[task: TaskDefinition]' is not comparable to type '(task: TaskDefinition) => Promise<Task>'.
          Type '[task: TaskDefinition]' provides no match for the signature '(task: TaskDefinition): Promise<Task>'.
v3/@claude-flow/testing/src/helpers/test-application.ts(295,25): error TS2352: Conversion of type 'MockedInterface<IAgentLifecycle>' to type 'IAgentLifecycle' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Types of property 'spawn' are incompatible.
    Type 'Mock<(config: AgentConfig) => Promise<Agent>, any>' is not comparable to type '(config: AgentConfig) => Promise<Agent>'.
      Types of parameters 'args' and 'config' are incompatible.
        Type '[config: AgentConfig]' is not comparable to type '(config: AgentConfig) => Promise<Agent>'.
          Type '[config: AgentConfig]' provides no match for the signature '(config: AgentConfig): Promise<Agent>'.
v3/@claude-flow/testing/src/helpers/test-application.ts(296,24): error TS2352: Conversion of type 'MockedInterface<IMemoryService>' to type 'IMemoryService' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Types of property 'store' are incompatible.
    Type 'Mock<(key: string, value: unknown, metadata?: MemoryMetadata | undefined) => Promise<void>, any>' is not comparable to type '(key: string, value: unknown, metadata?: MemoryMetadata | undefined) => Promise<void>'.
      Types of parameters 'args' and 'key' are incompatible.
        Type '[key: string, value: unknown, metadata?: MemoryMetadata | undefined]' is not comparable to type '(key: string, value: unknown, metadata?: MemoryMetadata | undefined) => Promise<void>'.
          Type '[key: string, value: unknown, metadata?: MemoryMetadata | undefined]' provides no match for the signature '(key: string, value: unknown, metadata?: MemoryMetadata | undefined): Promise<void>'.
v3/@claude-flow/testing/src/helpers/test-application.ts(297,26): error TS2352: Conversion of type 'MockedInterface<ISecurityService>' to type 'ISecurityService' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Types of property 'validatePath' are incompatible.
    Type 'Mock<(path: string) => boolean, any>' is not comparable to type '(path: string) => boolean'.
      Types of parameters 'args' and 'path' are incompatible.
        Type '[path: string]' is not comparable to type '(path: string) => boolean'.
          Type '[path: string]' provides no match for the signature '(path: string): boolean'.
v3/@claude-flow/testing/src/helpers/test-application.ts(298,27): error TS2352: Conversion of type 'MockedInterface<ISwarmCoordinator>' to type 'ISwarmCoordinator' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Types of property 'initialize' are incompatible.
    Type 'Mock<(config: SwarmConfig) => Promise<void>, any>' is not comparable to type '(config: SwarmConfig) => Promise<void>'.
      Types of parameters 'args' and 'config' are incompatible.
        Type '[config: SwarmConfig]' is not comparable to type '(config: SwarmConfig) => Promise<void>'.
          Type '[config: SwarmConfig]' provides no match for the signature '(config: SwarmConfig): Promise<void>'.
v3/@claude-flow/testing/src/regression/integration-regression.ts(131,70): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/@claude-flow/testing/src/regression/integration-regression.ts(168,70): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/@claude-flow/testing/src/regression/integration-regression.ts(270,60): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/@claude-flow/testing/src/regression/integration-regression.ts(375,39): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/@claude-flow/testing/src/regression/integration-regression.ts(394,38): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/@claude-flow/testing/src/regression/performance-baseline.ts(186,18): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/goal_ui/src/components/ui/use-toast.ts(1,33): error TS2307: Cannot find module '@/hooks/use-toast' or its corresponding type declarations.
v3/goal_ui/src/hooks/use-toast.ts(1,24): error TS2307: Cannot find module 'react' or its corresponding type declarations.
v3/goal_ui/src/hooks/use-toast.ts(3,53): error TS2307: Cannot find module '@/components/ui/toast' or its corresponding type declarations.
v3/goal_ui/src/integrations/supabase/client.ts(2,30): error TS2307: Cannot find module '@supabase/supabase-js' or its corresponding type declarations.
v3/goal_ui/src/integrations/supabase/client.ts(5,34): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
v3/goal_ui/src/integrations/supabase/client.ts(6,46): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
v3/goal_ui/src/integrations/supabase/client.ts(13,14): error TS2304: Cannot find name 'localStorage'.
v3/goal_ui/src/lib/goapPlanner.ts(1,28): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
v3/goal_ui/src/lib/utils.ts(1,39): error TS2307: Cannot find module 'clsx' or its corresponding type declarations.
v3/goal_ui/src/lib/utils.ts(2,25): error TS2307: Cannot find module 'tailwind-merge' or its corresponding type declarations.
v3/goal_ui/supabase/functions/generate-action-items/index.ts(2,23): error TS2307: Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.
v3/goal_ui/supabase/functions/generate-action-items/index.ts(33,29): error TS2304: Cannot find name 'Deno'.
v3/goal_ui/supabase/functions/generate-action-items/index.ts(211,22): error TS18046: 'data' is of type 'unknown'.
v3/goal_ui/supabase/functions/generate-research-goal/index.ts(2,23): error TS2307: Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.
v3/goal_ui/supabase/functions/generate-research-goal/index.ts(24,29): error TS2304: Cannot find name 'Deno'.
v3/goal_ui/supabase/functions/generate-research-goal/index.ts(155,22): error TS18046: 'data' is of type 'unknown'.
v3/goal_ui/supabase/functions/optimize-research-config/index.ts(2,23): error TS2307: Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.
v3/goal_ui/supabase/functions/optimize-research-config/index.ts(24,29): error TS2304: Cannot find name 'Deno'.
v3/goal_ui/supabase/functions/optimize-research-config/index.ts(288,22): error TS18046: 'data' is of type 'unknown'.
v3/goal_ui/supabase/functions/research-api/index.ts(1,23): error TS2307: Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.
v3/goal_ui/supabase/functions/research-api/index.ts(57,29): error TS2304: Cannot find name 'Deno'.
v3/goal_ui/supabase/functions/research-api/index.ts(94,26): error TS2345: Argument of type '{ stepNumber: number; stepTitle: string; findings: any; timestamp: string; content?: undefined; } | { stepNumber: number; stepTitle: string; content: any; timestamp: string; findings?: undefined; }' is not assignable to parameter of type 'never'.
  Type '{ stepNumber: number; stepTitle: string; findings: any; timestamp: string; content?: undefined; }' is not assignable to type 'never'.
v3/goal_ui/supabase/functions/research-api/index.ts(253,7): error TS18046: 'data' is of type 'unknown'.
v3/goal_ui/supabase/functions/research-api/index.ts(254,22): error TS18046: 'data' is of type 'unknown'.
v3/goal_ui/supabase/functions/research-api/index.ts(268,14): error TS18046: 'data' is of type 'unknown'.
v3/goal_ui/supabase/functions/research-step/index.ts(2,23): error TS2307: Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.
v3/goal_ui/supabase/functions/research-step/index.ts(81,29): error TS2304: Cannot find name 'Deno'.
v3/goal_ui/supabase/functions/research-step/index.ts(342,31): error TS18046: 'data' is of type 'unknown'.
v3/goal_ui/supabase/functions/research-step/index.ts(352,22): error TS18046: 'data' is of type 'unknown'.
v3/goal_ui/tailwind.config.ts(1,29): error TS2307: Cannot find module 'tailwindcss' or its corresponding type declarations.
v3/goal_ui/vite.config.ts(1,30): error TS2307: Cannot find module 'vite' or its corresponding type declarations.
v3/goal_ui/vite.config.ts(2,19): error TS2307: Cannot find module '@vitejs/plugin-react-swc' or its corresponding type declarations.
v3/index.ts(146,3): error TS2300: Duplicate identifier 'IAgentRegistry'.
v3/index.ts(156,3): error TS2300: Duplicate identifier 'IEventStore'.
v3/index.ts(180,8): error TS2307: Cannot find module './core/interfaces/index.js' or its corresponding type declarations.
v3/index.ts(182,34): error TS2307: Cannot find module './core/interfaces/event.interface.js' or its corresponding type declarations.
v3/index.ts(214,8): error TS2307: Cannot find module './core/orchestrator/index.js' or its corresponding type declarations.
v3/index.ts(217,58): error TS2307: Cannot find module './core/event-bus.js' or its corresponding type declarations.
v3/index.ts(257,8): error TS2307: Cannot find module './core/config/index.js' or its corresponding type declarations.
v3/index.ts(291,3): error TS2300: Duplicate identifier 'SwarmMessage'.
v3/index.ts(332,8): error TS2307: Cannot find module './types/index.js' or its corresponding type declarations.
v3/index.ts(338,8): error TS2307: Cannot find module './types/index.js' or its corresponding type declarations.
v3/index.ts(375,3): error TS2300: Duplicate identifier 'SwarmMessage'.
v3/index.ts(381,8): error TS2307: Cannot find module './shared/types' or its corresponding type declarations.
v3/index.ts(387,8): error TS2307: Cannot find module './shared/types' or its corresponding type declarations.
v3/index.ts(392,3): error TS2300: Duplicate identifier 'IEventStore'.
v3/index.ts(395,8): error TS2307: Cannot find module './shared/events' or its corresponding type declarations.
v3/index.ts(417,8): error TS2307: Cannot find module './shared/events' or its corresponding type declarations.
v3/index.ts(421,3): error TS2300: Duplicate identifier 'IAgentRegistry'.
v3/index.ts(423,8): error TS2307: Cannot find module './coordination/agent-registry' or its corresponding type declarations.
v3/index.ts(428,8): error TS2307: Cannot find module './coordination/agent-registry' or its corresponding type declarations.
v3/index.ts(435,8): error TS2307: Cannot find module './coordination/task-orchestrator' or its corresponding type declarations.
v3/index.ts(440,8): error TS2307: Cannot find module './coordination/task-orchestrator' or its corresponding type declarations.
v3/index.ts(445,8): error TS2307: Cannot find module './coordination/swarm-hub' or its corresponding type declarations.
v3/index.ts(452,8): error TS2307: Cannot find module './coordination/swarm-hub' or its corresponding type declarations.
v3/index.ts(502,43): error TS2307: Cannot find module './coordination/swarm-hub' or its corresponding type declarations.
v3/index.ts(513,40): error TS2307: Cannot find module './coordination/swarm-hub' or its corresponding type declarations.
v3/index.ts(575,32): error TS2307: Cannot find module './coordination/swarm-hub' or its corresponding type declarations.
v3/index.ts(576,34): error TS2307: Cannot find module './shared/types' or its corresponding type declarations.
v3/index.ts(577,56): error TS2307: Cannot find module './shared/types' or its corresponding type declarations.
v3/mcp/connection-pool.ts(138,21): error TS2345: Argument of type 'Promise<ManagedConnection>' is not assignable to parameter of type 'Promise<void>'.
  Type 'ManagedConnection' is not assignable to type 'void'.
v3/mcp/index.ts(27,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(28,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(29,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(30,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(31,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(32,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(33,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(36,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(37,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(38,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(39,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(40,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(41,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(44,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(45,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(46,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(49,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(50,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(51,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(52,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(55,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(56,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(57,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(58,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(59,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(60,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(63,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(64,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(65,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(66,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(69,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(70,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(71,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(72,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(75,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(76,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(77,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(80,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(81,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(82,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(85,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(86,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(96,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(110,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(127,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(132,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(134,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(136,3): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/index.ts(164,19): error TS2304: Cannot find name 'MCPServerConfig'.
v3/mcp/index.ts(165,12): error TS2304: Cannot find name 'ILogger'.
v3/mcp/index.ts(166,12): error TS2304: Cannot find name 'MCPServer'.
v3/mcp/index.ts(168,24): error TS2304: Cannot find name 'ILogger'.
v3/mcp/index.ts(175,18): error TS2304: Cannot find name 'createMCPServer'.
v3/mcp/server.ts(464,20): error TS2352: Conversion of type 'Record<string, unknown> | undefined' to type 'MCPInitializeParams' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Record<string, unknown>' is missing the following properties from type 'MCPInitializeParams': protocolVersion, capabilities, clientInfo
v3/mcp/server.ts(727,7): error TS2322: Type '(input: { category?: string; }) => Promise<{ name: string; description: string; category?: string; tags?: string[]; deprecated?: boolean; }[]>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type '{ category?: string | undefined; }'.
v3/mcp/tool-registry.ts(18,17): error TS2307: Cannot find module 'ajv' or its corresponding type declarations.
v3/mcp/tool-registry.ts(411,57): error TS2345: Argument of type '{ sessionId?: string | undefined; requestId?: RequestId; orchestrator?: unknown; swarmCoordinator?: unknown; agentManager?: unknown; resourceManager?: unknown; messageBus?: unknown; monitor?: unknown; metadata?: Record<string, unknown>; }' is not assignable to parameter of type 'ToolContext'.
  Types of property 'sessionId' are incompatible.
    Type 'string | undefined' is not assignable to type 'string'.
      Type 'undefined' is not assignable to type 'string'.
v3/mcp/tools/agent-tools.ts(163,56): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/mcp/tools/agent-tools.ts(208,56): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/mcp/tools/agent-tools.ts(272,56): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/mcp/tools/agent-tools.ts(309,56): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/mcp/tools/config-tools.ts(276,13): error TS2304: Cannot find name 'path'.
v3/mcp/tools/federation-tools.ts(522,7): error TS2741: Property 'type' is missing in type '{ description: string; }' but required in type 'JSONSchema'.
v3/mcp/tools/federation-tools.ts(551,7): error TS2741: Property 'type' is missing in type '{ description: string; }' but required in type 'JSONSchema'.
v3/mcp/tools/memory-tools.ts(134,53): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/mcp/tools/memory-tools.ts(135,62): error TS2749: 'UnifiedMemoryService' refers to a value, but is being used as a type here. Did you mean 'typeof UnifiedMemoryService'?
v3/mcp/tools/memory-tools.ts(184,53): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/mcp/tools/memory-tools.ts(185,62): error TS2749: 'UnifiedMemoryService' refers to a value, but is being used as a type here. Did you mean 'typeof UnifiedMemoryService'?
v3/mcp/tools/memory-tools.ts(277,53): error TS2307: Cannot find module '@claude-flow/memory' or its corresponding type declarations.
v3/mcp/tools/memory-tools.ts(278,62): error TS2749: 'UnifiedMemoryService' refers to a value, but is being used as a type here. Did you mean 'typeof UnifiedMemoryService'?
v3/mcp/tools/sona-tools.ts(32,36): error TS2307: Cannot find module 'agentic-flow/core' or its corresponding type declarations.
v3/mcp/tools/sona-tools.ts(37,36): error TS2307: Cannot find module 'agentic-flow/core' or its corresponding type declarations.
v3/mcp/tools/swarm-tools.ts(150,56): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/mcp/tools/swarm-tools.ts(205,56): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/mcp/tools/swarm-tools.ts(310,56): error TS2307: Cannot find module '@claude-flow/swarm' or its corresponding type declarations.
v3/mcp/tools/v2-compat-tools.ts(69,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<unknown>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(103,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<unknown>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(132,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<{ monitoring: { duration: {}; interval: {}; }; recentEvents: never[]; }>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(173,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<unknown>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(199,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<unknown>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(225,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<{ agentId: string; metrics: {}; neuralNetworks: never[]; } | { neuralNetworks: never[]; agentId?: undefined; metrics?: undefined; }>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(267,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<unknown>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(296,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<unknown>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(329,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<unknown>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(365,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<unknown>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(427,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<{ modelLoaded: boolean; accuracy: number; trainingProgress: number; agent: unknown; system?: undefined; } | { ...; }>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(457,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<{ iterations: {}; agentId: unknown; trainingComplete: boolean; }>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(479,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<{ patterns: {}; filterType: {}; }>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(506,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<{ benchmarks: { name: string; value: number; unit: string; }[]; type: {}; iterations: {}; systemMetrics: unknown; }>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(537,3): error TS2322: Type '(input: Record<string, unknown>, context: ToolContext | undefined) => Promise<{ category: {}; features: { wasm: boolean; simd: boolean; memory: boolean; platform: Platform; }; }>' is not assignable to type 'ToolHandler<unknown, unknown>'.
  Types of parameters 'input' and 'input' are incompatible.
    Type 'unknown' is not assignable to type 'Record<string, unknown>'.
v3/mcp/tools/v2-compat-tools.ts(543,22): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/mcp/transport/http.ts(17,67): error TS2307: Cannot find module 'express' or its corresponding type declarations.
v3/mcp/transport/http.ts(19,44): error TS2307: Cannot find module 'ws' or its corresponding type declarations.
v3/mcp/transport/http.ts(20,18): error TS2307: Cannot find module 'cors' or its corresponding type declarations.
v3/mcp/transport/http.ts(21,20): error TS2307: Cannot find module 'helmet' or its corresponding type declarations.
v3/mcp/transport/http.ts(611,5): error TS2322: Type 'ConnectionPool<{ transport: HttpTransport; }>' is not assignable to type 'ConnectionPool<{ transport: HttpTransport; id: string; }>'.
  Types of property 'connections' are incompatible.
    Type 'Map<string, PooledConnection<{ transport: HttpTransport; }>>' is not assignable to type 'Map<string, PooledConnection<{ transport: HttpTransport; id: string; }>>'.
      Type 'PooledConnection<{ transport: HttpTransport; }>' is not assignable to type 'PooledConnection<{ transport: HttpTransport; id: string; }>'.
        Property 'id' is missing in type '{ transport: HttpTransport; }' but required in type '{ transport: HttpTransport; id: string; }'.
v3/mcp/transport/index.ts(27,26): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/transport/index.ts(28,25): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/transport/index.ts(29,30): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/mcp/transport/index.ts(108,9): error TS2416: Property 'getHealthStatus' in type 'InProcessTransport' is not assignable to the same property in base type 'ITransport'.
  Type '() => Promise<{ healthy: boolean; metrics: { transport: string; }; }>' is not assignable to type '() => Promise<TransportHealthStatus>'.
    Type 'Promise<{ healthy: boolean; metrics: { transport: string; }; }>' is not assignable to type 'Promise<TransportHealthStatus>'.
      Type '{ healthy: boolean; metrics: { transport: string; }; }' is not assignable to type 'TransportHealthStatus'.
        Types of property 'metrics' are incompatible.
          Type '{ transport: string; }' is not assignable to type 'Record<string, number>'.
            Property 'transport' is incompatible with index signature.
              Type 'string' is not assignable to type 'number'.
v3/mcp/transport/index.ts(122,3): error TS2322: Type 'InProcessTransport' is not assignable to type 'ITransport'.
  The types returned by 'getHealthStatus()' are incompatible between these types.
    Type 'Promise<{ healthy: boolean; metrics: { transport: string; }; }>' is not assignable to type 'Promise<TransportHealthStatus>'.
      Type '{ healthy: boolean; metrics: { transport: string; }; }' is not assignable to type 'TransportHealthStatus'.
        Types of property 'metrics' are incompatible.
          Type '{ transport: string; }' is not assignable to type 'Record<string, number>'.
            Property 'transport' is incompatible with index signature.
              Type 'string' is not assignable to type 'number'.
v3/mcp/transport/websocket.ts(16,53): error TS2307: Cannot find module 'ws' or its corresponding type declarations.
v3/plugins/agentic-qe/src/bridges/QEMemoryBridge.ts(179,26): error TS2339: Property 'schema' does not exist on type '{ readonly name: "aqe/v3/test-patterns"; readonly vectorDimension: 384; readonly hnswConfig: { readonly m: 16; readonly efConstruction: 200; readonly efSearch: 100; }; readonly schema: { readonly patternType: { ...; }; readonly language: { ...; }; readonly framework: { ...; }; readonly effectiveness: { ...; }; reado...'.
  Property 'schema' does not exist on type '{ readonly name: "aqe/v3/code-knowledge"; readonly vectorDimension: 384; readonly hnswConfig: { readonly m: 24; readonly efConstruction: 300; readonly efSearch: 150; }; }'.
v3/plugins/code-intelligence/src/bridges/gnn-bridge.ts(73,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/code-intelligence/src/bridges/mincut-bridge.ts(63,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/cognitive-kernel/tests/validate.ts(6,61): error TS2307: Cannot find module '../dist/mcp-tools.js' or its corresponding type declarations.
v3/plugins/cognitive-kernel/tests/validate.ts(7,36): error TS2307: Cannot find module '../dist/types.js' or its corresponding type declarations.
v3/plugins/financial-risk/src/mcp-tools.ts(606,25): error TS2345: Argument of type '{ id: string; regulation: "basel3"; severity: "critical"; description: string; affectedItems: string[]; remediation: string; }' is not assignable to parameter of type 'never'.
v3/plugins/financial-risk/src/mcp-tools.ts(620,23): error TS2345: Argument of type '{ id: string; regulation: "aml"; severity: "warning"; description: string; affectedItems: string[]; remediation: string; }' is not assignable to parameter of type 'never'.
v3/plugins/gastown-bridge/src/cache.ts(692,18): error TS2304: Cannot find name 'requestIdleCallback'.
v3/plugins/gastown-bridge/src/cache.ts(693,9): error TS2304: Cannot find name 'requestIdleCallback'.
v3/plugins/gastown-bridge/src/wasm-loader.ts(262,16): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/gastown-bridge/src/wasm-loader.ts(268,35): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/gastown-bridge/src/wasm-loader.ts(269,31): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/gastown-bridge/src/wasm-loader.ts(270,30): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/gastown-bridge/src/wasm/loader.ts(20,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/gastown-bridge/src/wasm/loader.ts(30,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/gastown-bridge/src/wasm/loader.ts(35,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/gastown-bridge/src/wasm/loader.ts(81,14): error TS2304: Cannot find name 'window'.
v3/plugins/gastown-bridge/src/wasm/loader.ts(180,24): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Imports'.
v3/plugins/gastown-bridge/src/wasm/loader.ts(182,24): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/gastown-bridge/src/wasm/loader.ts(183,26): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/gastown-bridge/src/wasm/loader.ts(187,52): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/gastown-bridge/tsup.config.ts(17,30): error TS2307: Cannot find module 'tsup' or its corresponding type declarations.
v3/plugins/healthcare-clinical/src/mcp-tools.ts(454,32): error TS2339: Property 'evidenceLevel' does not exist on type 'never'.
v3/plugins/healthcare-clinical/src/mcp-tools.ts(491,19): error TS2345: Argument of type '{ id: string; title: string; authors: string[]; abstract: string; source: "pubmed" | "cochrane" | "uptodate" | "local"; publicationDate: string; evidenceLevel: "systematic-review" | "rct" | "cohort" | "case-control"; relevanceScore: number; pmid: string; }' is not assignable to parameter of type 'never'.
v3/plugins/hyperbolic-reasoning/src/bridges/gnn-bridge.ts(117,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/hyperbolic-reasoning/src/bridges/gnn-bridge.ts(599,19): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/hyperbolic-reasoning/src/bridges/hyperbolic-bridge.ts(70,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/hyperbolic-reasoning/src/bridges/hyperbolic-bridge.ts(604,19): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/hyperbolic-reasoning/tests/validate.ts(6,65): error TS2307: Cannot find module '../dist/mcp-tools.js' or its corresponding type declarations.
v3/plugins/hyperbolic-reasoning/tests/validate.ts(7,36): error TS2307: Cannot find module '../dist/types.js' or its corresponding type declarations.
v3/plugins/legal-contracts/src/bridges/attention-bridge.ts(62,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/legal-contracts/src/bridges/dag-bridge.ts(57,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/neural-coordination/tests/validate.ts(6,64): error TS2307: Cannot find module '../dist/mcp-tools.js' or its corresponding type declarations.
v3/plugins/neural-coordination/tests/validate.ts(7,36): error TS2307: Cannot find module '../dist/types.js' or its corresponding type declarations.
v3/plugins/perf-optimizer/tests/validate.ts(6,59): error TS2307: Cannot find module '../dist/mcp-tools.js' or its corresponding type declarations.
v3/plugins/perf-optimizer/tests/validate.ts(7,36): error TS2307: Cannot find module '../dist/types.js' or its corresponding type declarations.
v3/plugins/prime-radiant/src/plugin.ts(127,35): error TS2307: Cannot find module 'prime-radiant-advanced-wasm' or its corresponding type declarations.
v3/plugins/prime-radiant/src/types.ts(353,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/prime-radiant/src/wasm-bridge.ts(179,41): error TS2307: Cannot find module 'prime-radiant-advanced-wasm' or its corresponding type declarations.
v3/plugins/prime-radiant/src/wasm-bridge.ts(220,32): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/prime-radiant/src/wasm-bridge.ts(222,30): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/prime-radiant/src/wasm-bridge.ts(222,94): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Imports'.
v3/plugins/prime-radiant/src/wasm-bridge.ts(238,41): error TS2307: Cannot find module 'prime-radiant-advanced-wasm' or its corresponding type declarations.
v3/plugins/prime-radiant/src/wasm-bridge.ts(261,18): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/prime-radiant/src/wasm-bridge.ts(263,30): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/prime-radiant/src/wasm-bridge.ts(270,34): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/prime-radiant/src/wasm-bridge.ts(271,32): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/prime-radiant/src/wasm-bridge.ts(271,96): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Imports'.
v3/plugins/prime-radiant/src/wasm-bridge.ts(284,75): error TS2694: Namespace 'global.WebAssembly' has no exported member 'ImportValue'.
v3/plugins/prime-radiant/src/wasm-bridge.ts(288,21): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/quantum-optimizer/src/bridges/dag-bridge.ts(79,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/quantum-optimizer/src/bridges/dag-bridge.ts(612,19): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/quantum-optimizer/src/bridges/exotic-bridge.ts(60,23): error TS2694: Namespace 'global.WebAssembly' has no exported member 'Memory'.
v3/plugins/quantum-optimizer/src/bridges/exotic-bridge.ts(594,19): error TS2708: Cannot use namespace 'WebAssembly' as a value.
v3/plugins/quantum-optimizer/tests/validate.ts(6,62): error TS2307: Cannot find module '../dist/mcp-tools.js' or its corresponding type declarations.
v3/plugins/quantum-optimizer/tests/validate.ts(7,36): error TS2307: Cannot find module '../dist/types.js' or its corresponding type declarations.
v3/plugins/ruvector-upstream/src/bridges/attention.ts(61,39): error TS2307: Cannot find module '@ruvector/attention-wasm' or its corresponding type declarations.
v3/plugins/ruvector-upstream/src/bridges/cognitive.ts(97,39): error TS2307: Cannot find module '@ruvector/cognitum-gate-kernel' or its corresponding type declarations.
v3/plugins/ruvector-upstream/src/bridges/exotic.ts(91,39): error TS2307: Cannot find module '@ruvector/exotic-wasm' or its corresponding type declarations.
v3/plugins/ruvector-upstream/src/bridges/gnn.ts(64,39): error TS2307: Cannot find module '@ruvector/gnn-wasm' or its corresponding type declarations.
v3/plugins/ruvector-upstream/src/bridges/hnsw.ts(58,39): error TS2307: Cannot find module '@ruvector/micro-hnsw-wasm' or its corresponding type declarations.
v3/plugins/ruvector-upstream/src/bridges/hyperbolic.ts(70,39): error TS2307: Cannot find module '@ruvector/hyperbolic-hnsw-wasm' or its corresponding type declarations.
v3/plugins/ruvector-upstream/src/bridges/learning.ts(78,39): error TS2307: Cannot find module '@ruvector/learning-wasm' or its corresponding type declarations.
v3/plugins/ruvector-upstream/src/bridges/sona.ts(115,39): error TS2307: Cannot find module '@ruvector/sona' or its corresponding type declarations.
v3/plugins/teammate-plugin/src/semantic-router.ts(20,32): error TS2307: Cannot find module '@ruvnet/bmssp' or its corresponding type declarations.
v3/plugins/teammate-plugin/src/topology-optimizer.ts(20,32): error TS2307: Cannot find module '@ruvnet/bmssp' or its corresponding type declarations.
v3/src/infrastructure/mcp/tools/AgentTools.ts(81,40): error TS2352: Conversion of type 'Record<string, unknown>' to type 'AgentConfig' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Record<string, unknown>' is missing the following properties from type 'AgentConfig': id, type
v3/src/infrastructure/mcp/tools/ConfigTools.ts(146,29): error TS2322: Type 'V3Config' is not assignable to type 'Record<string, unknown>'.
  Index signature for type 'string' is missing in type 'V3Config'.
v3/src/infrastructure/mcp/tools/ConfigTools.ts(183,31): error TS2322: Type 'V3Config | undefined' is not assignable to type 'Record<string, unknown> | undefined'.
  Type 'V3Config' is not assignable to type 'Record<string, unknown>'.
    Index signature for type 'string' is missing in type 'V3Config'.
v3/src/infrastructure/mcp/tools/ConfigTools.ts(185,29): error TS2322: Type 'V3Config' is not assignable to type 'Record<string, unknown>'.
  Index signature for type 'string' is missing in type 'V3Config'.
v3/src/infrastructure/mcp/tools/MemoryTools.ts(102,41): error TS2352: Conversion of type 'Record<string, unknown>' to type 'Memory' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Record<string, unknown>' is missing the following properties from type 'Memory': id, agentId, content, type, timestamp
v3/src/infrastructure/plugins/ExtensionPoint.ts(46,10): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
v3/src/task-execution/application/WorkflowEngine.ts(251,23): error TS2345: Argument of type 'Task[]' is not assignable to parameter of type 'never'.
v3/src/task-execution/application/WorkflowEngine.ts(257,28): error TS2488: Type 'never' must have a '[Symbol.iterator]()' method that returns an iterator.
v3/swarm.config.ts(16,8): error TS2307: Cannot find module './shared/types' or its corresponding type declarations.
v3/swarm.config.ts(69,3): error TS2353: Object literal may only specify known properties, and 'topology' does not exist in type 'V3SwarmConfig'.

CURA PROPUESTA POR EL DOCTOR:
Reintentar la misma tarea sin cambios de código y sin ampliar alcance; no tocar el repo mientras dure la saturación.

Runtime hints from recent runs and preflight analysis:
Execution lane: high_risk.
Semantic surfaces: workflows.
Preflight risk factors: workflows.
- Recent preexisting_repo_failure on workflows; implicated paths: ../../../src/onnx-embedder.js, ../../src/integrations/ruvector/gnn.js, ../../src/integrations/ruvector/hyperbolic.js.
- Recent preexisting_repo_failure on workflows; implicated paths: ../../../src/onnx-embedder.js, ../../src/integrations/ruvector/gnn.js, ../../src/integrations/ruvector/hyperbolic.js.
