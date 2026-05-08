#!/usr/bin/env node
/**
 * @claude-flow/cli - CLI Entry Point
 *
 * Claude Flow V3 Command Line Interface
 *
 * Auto-detects MCP mode when stdin is piped and no args provided.
 * This allows: echo '{"jsonrpc":"2.0",...}' | npx @claude-flow/cli
 */

import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Suppress the SPECIFIC cosmetic "[AgentDB Patch] Controller index not found"
// warning from agentic-flow's runtime patch — these are emitted because the
// patch was written for agentdb v1.x and we use v3, where the controllers
// dist directory is laid out differently. The warning surfaces on every
// command and the audit (audit_1776483149979) flagged a too-broad suppression
// as a security risk because it could hide legitimate [AgentDB Patch] warnings.
//
// Tight match: must include both the prefix AND the specific "Controller
// index not found" text. Anything else (including future [AgentDB Patch]
// warnings about real issues) flows through unchanged. Also patch
// console.log because the underlying code uses it (the previous filter
// only caught console.warn and was therefore a no-op).
const _origWarn = console.warn;
const _origLog = console.log;
const _isCosmeticAgentdbPatchNoise = (msg) =>
  msg.includes('[AgentDB Patch]') && msg.includes('Controller index not found');
console.warn = (...args) => {
  if (_isCosmeticAgentdbPatchNoise(String(args[0] ?? ''))) return;
  _origWarn.apply(console, args);
};
console.log = (...args) => {
  if (_isCosmeticAgentdbPatchNoise(String(args[0] ?? ''))) return;
  _origLog.apply(console, args);
};

// Bug #36: lazy-load the SDK. `ruflo --version` and `ruflo --help` previously
// paid ~165ms to load the entire v3 module tree (agentdb, agentic-flow,
// @ruvector/*) even though they only need the package version string and a
// hand-maintained help screen. Cold-start floor was 210ms.
//
// The fix: parse argv FIRST. For purely-informational commands that don't
// need the SDK (`--version`, `-V`, `--help`, `-h`), short-circuit BEFORE
// importing `../dist/src/index.js`. Only real commands (or the bare-TTY
// help path, or MCP mode) trigger the dynamic import.
//
// Bug #28's bare-TTY path used to do `await import('../dist/src/index.js')`
// then `cli.run([])`. We replicate that exact behaviour, but the SDK import
// only happens when we *actually* take that branch — not eagerly at the top.
const cliArgs = process.argv.slice(2);
const isBareTTY = process.stdin.isTTY === true && process.argv.length === 2;

// Fast paths that MUST NOT trigger the SDK import (Bug #36).
const VERSION_FLAGS = new Set(['--version', '-V']);
const HELP_FLAGS = new Set(['--help', '-h']);
const isVersionOnly = cliArgs.length === 1 && VERSION_FLAGS.has(cliArgs[0]);
const isHelpOnly = cliArgs.length === 1 && HELP_FLAGS.has(cliArgs[0]);

if (isVersionOnly) {
  // Read version directly from package.json — no SDK import, no commands
  // module load. Should run in <50ms cold.
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    process.stdout.write(`ruflo v${pkg.version || '3.0.0'}\n`);
    process.exit(0);
  } catch (error) {
    process.stderr.write(`Failed to read version: ${error.message}\n`);
    process.exit(1);
  }
}

if (isHelpOnly) {
  // Hand-maintained top-level help. Mirrors the categories printed by the
  // SDK's full help screen, but without the cost of loading every command
  // module and every category index. Users who want full per-command help
  // run `ruflo <command> --help`, which hits the SDK path and triggers
  // lazy command loading there.
  process.stdout.write(`ruflo - RuFlo V3 AI Agent Orchestration Platform

USAGE:
  ruflo <command> [subcommand] [options]
  ruflo --version | -V          Print version (no SDK load)
  ruflo --help    | -h          Print this help

COMMANDS:
  init                          Initialize ruflo in the current project
  doctor                        Diagnostics & auto-fix
  status                        Show daemon / swarm / memory status
  memory <subcommand>           Memory operations (store, search, list, ...)
  swarm <subcommand>            Swarm orchestration (init, status, shutdown)
  hooks <subcommand>            Hooks management & worker dispatch
  agent <subcommand>            Agent operations (spawn, list, terminate)
  daemon <subcommand>           Background daemon control
  hive-mind <subcommand>        Hive-mind coordination
  routes / route                Route a task to the right agent / model
  mcp <subcommand>              MCP server / tool management
  config <subcommand>           Configuration management
  performance / perf            Benchmarks & profiling
  security                      Security scan
  update                        Self-update
  guidance                      Capabilities & quick reference

For per-command help with all flags and subcommands:
  ruflo <command> --help

Examples:
  ruflo init --wizard
  ruflo memory store --namespace patterns --key foo --value bar
  ruflo memory search --query "auth flow"
  ruflo swarm init --topology hierarchical --max-agents 8
  ruflo doctor --fix

Logging:
  RUFLO_LOG_LEVEL=warn  (default — subsystem init noise → ~/.claude/logs/ruflo.log)
  RUFLO_LOG_LEVEL=info  (subsystem init banners → stderr)
  RUFLO_LOG_LEVEL=debug (everything to stderr + log file)
  RUFLO_LOG_LEVEL=silent (no logs anywhere)
`);
  process.exit(0);
}

if (isBareTTY) {
  // Delegate to the normal CLI run() with no args — it prints help and resolves.
  const { CLI } = await import('../dist/src/index.js');
  const cli = new CLI();
  try {
    await cli.run([]);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Check if we should run in MCP server mode
// Conditions:
//   1. stdin is being piped AND no CLI arguments provided (auto-detect)
//   2. stdin is being piped AND args are "mcp start" (explicit, e.g. npx claude-flow@alpha mcp start)
const isExplicitMCP = cliArgs.length >= 1 && cliArgs[0] === 'mcp' && (cliArgs.length === 1 || cliArgs[1] === 'start');
const isMCPMode = !process.stdin.isTTY && (process.argv.length === 2 || isExplicitMCP);

if (isMCPMode) {
  // Run MCP server mode
  const { listMCPTools, callMCPTool, hasTool } = await import('../dist/src/mcp-client.js');

  const VERSION = '3.0.0';
  const sessionId = `mcp-${Date.now()}-${randomUUID().slice(0, 8)}`;

  console.error(
    `[${new Date().toISOString()}] INFO [claude-flow-mcp] (${sessionId}) Starting in stdio mode`
  );

  // Audit-flagged DoS protection (audit_1776483149979): cap the
  // newline-buffered stdin parser so a malicious client cannot pipe
  // gigabytes of un-newlined data and exhaust memory before
  // JSON.parse runs. 10MB is far above any legitimate MCP message
  // (the protocol's largest realistic payloads — tool descriptions,
  // batch search results — top out at ~1MB).
  const MCP_MAX_BUFFER_BYTES = 10 * 1024 * 1024;
  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    if (buffer.length > MCP_MAX_BUFFER_BYTES) {
      // Drop the buffer + emit a protocol-level error so the client
      // sees the rejection rather than a silent OOM.
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Buffered stdin exceeds ${MCP_MAX_BUFFER_BYTES} bytes without newline; resetting`,
        },
      }));
      buffer = '';
      return;
    }
    let lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' },
          }));
          continue;
        }
        try {
          const response = await handleMessage(message);
          if (response) {
            console.log(JSON.stringify(response));
          }
        } catch (error) {
          // #1606: Return proper internal error instead of parse error
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: message.id ?? null,
            error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' },
          }));
        }
      }
    }
  });

  process.stdin.on('end', () => {
    process.exit(0);
  });

  async function handleMessage(message) {
    if (!message.method) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32600, message: 'Invalid Request: missing method' },
      };
    }

    const params = message.params || {};

    switch (message.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: { name: 'claude-flow', version: VERSION },
            capabilities: {
              tools: { listChanged: true },
              resources: { subscribe: true, listChanged: true },
            },
          },
        };

      case 'tools/list': {
        const tools = listMCPTools();
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            })),
          },
        };
      }

      case 'tools/call': {
        const toolName = params.name;
        const toolParams = params.arguments || {};

        if (!hasTool(toolName)) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: { code: -32601, message: `Tool not found: ${toolName}` },
          };
        }

        try {
          const result = await callMCPTool(toolName, toolParams, { sessionId });
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
          };
        } catch (error) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : 'Tool execution failed',
            },
          };
        }
      }

      case 'notifications/initialized':
        return null;

      case 'ping':
        return { jsonrpc: '2.0', id: message.id, result: {} };

      default:
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: { code: -32601, message: `Method not found: ${message.method}` },
        };
    }
  }
} else {
  // Run normal CLI mode
  const { CLI } = await import('../dist/src/index.js');
  const cli = new CLI();
  cli.run()
    .then(() => {
      // #1552: Exit cleanly after one-shot commands.
      // Long-running commands (daemon foreground, mcp, status --watch) never resolve,
      // so this only fires for normal CLI commands.
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}
