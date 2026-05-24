#!/usr/bin/env node
/**
 * Shared tool fixture generator for SOTA comparator benchmarks.
 *
 * Generates K tool descriptors in three formats:
 *   - MCP JSON schema (used by ruflo / wasm_agent_compose)
 *   - LangChain/LangGraph JSON schema (name+description+parameters)
 *   - Plain name list (for frameworks that just need tool names)
 *
 * Usage:
 *   import { makeToolFixture } from './tool-fixture.mjs';
 *   const { mcpTools, langchainTools, toolNames } = makeToolFixture(50);
 */

/**
 * @param {number} K - Number of tools to generate (default 50)
 * @returns {{ mcpTools: string[], langchainTools: object[], toolNames: string[], toolSchemas: object[] }}
 */
export function makeToolFixture(K = 50) {
  const toolSchemas = Array.from({ length: K }, (_, i) => {
    const name = `tool_${String(i).padStart(2, '0')}`;
    return {
      name,
      description: `Benchmark tool ${i} — echoes its input.`,
      inputSchema: {
        type: 'object',
        properties: { input: { type: 'string', description: 'Value to echo' } },
        required: ['input'],
      },
    };
  });

  // MCP tool names (ruflo wasm_agent_compose expects an array of name strings)
  const mcpTools = toolSchemas.map(t => t.name);

  // LangChain-style tool descriptors (dict with name/description/parameters)
  const langchainTools = toolSchemas.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'object',
      properties: { input: { type: 'string' } },
      required: ['input'],
    },
  }));

  const toolNames = toolSchemas.map(t => t.name);

  return { mcpTools, langchainTools, toolNames, toolSchemas };
}

/**
 * Export as Python dict literal for use by Python harnesses.
 * Writes to stdout so callers can `python3 -c "import subprocess..."` or pipe.
 */
export function toolsAsPythonList(K = 50) {
  const { toolSchemas } = makeToolFixture(K);
  const items = toolSchemas.map(t =>
    `  {"name": "${t.name}", "description": "${t.description}", ` +
    `"parameters": {"type": "object", "properties": {"input": {"type": "string"}}, "required": ["input"]}}`
  ).join(',\n');
  return `[\n${items}\n]`;
}

// CLI: node tool-fixture.mjs [--format=json|python] [--k=50]
if (process.argv[1] === import.meta.url.replace('file://', '')) {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
  );
  const K = parseInt(args.k || '50', 10);
  const fmt = args.format || 'json';
  if (fmt === 'python') {
    process.stdout.write(toolsAsPythonList(K) + '\n');
  } else {
    const fixture = makeToolFixture(K);
    process.stdout.write(JSON.stringify(fixture, null, 2) + '\n');
  }
}
