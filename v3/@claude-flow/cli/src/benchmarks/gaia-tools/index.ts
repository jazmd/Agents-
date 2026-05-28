/**
 * gaia-tools barrel — ADR-133-PR2 / ADR-138 iter 54 / iter-57
 *
 * Exports all tool implementations + shared types so that gaia-agent.ts
 * (PR-3) and gaia-codeagent.ts (ADR-138) can import from a single entry point.
 *
 * iter-47 fix: re-added grounded_query which was absent from the integration
 * branch because feat/adr-135-grounded-query-gemini was never cherry-picked
 * during Track A/B/D/E/Q integration (iter-42 measured −36pp / 13.2%).
 *
 * iter-54 adds: visit_webpage, python_exec, pdf_read (HAL tool parity).
 *
 * iter-57 upgrades visit_webpage:
 *   - max_chars parameter (50k default, was 8k hardcoded)
 *   - visitWebpageTestHooks for unit testing without live HTTP
 *   - Link extraction (up to 30 links)
 *   - AIDefence PII gate (optional)
 *   - Structured VisitWebpageResult type
 *   - visit_webpage added to createDefaultToolCatalogue() (previously CodeAgent-only)
 *
 * Refs: ADR-133, ADR-135, ADR-138, iter-57, #2156
 */

export * from './types.js';
export * from './web_search.js';
export * from './file_read.js';
export * from './grounded_query.js';
export * from './visit_webpage.js';
export * from './python_exec.js';
export * from './pdf_read.js';

import { createWebSearchTool } from './web_search.js';
import { createFileReadTool } from './file_read.js';
import { createGroundedQueryTool } from './grounded_query.js';
import { createVisitWebpageTool } from './visit_webpage.js';
import { createPythonExecTool } from './python_exec.js';
import { createPdfReadTool } from './pdf_read.js';
import type { GaiaToolCatalogue } from './types.js';

/**
 * Returns the default tool catalogue for a GAIA Level-1 run (ToolCallingAgent).
 *
 * PR-2 catalogue:  web_search + file_read
 * iter-33 adds:    grounded_query (Gemini 2.5 Flash grounding — pre-synthesised answer)
 * iter-57 adds:    visit_webpage (full page text — HAL parity, highest remaining lift)
 *
 * Agent tool selection guide:
 *   - grounded_query: factoid questions needing a clean answer with citations (1 call)
 *   - web_search:     raw snippets when source URLs are needed for follow-up
 *   - visit_webpage:  read the FULL content of a specific URL (Wikipedia, docs, etc.)
 */
export function createDefaultToolCatalogue(): GaiaToolCatalogue {
  return [
    createWebSearchTool(),
    createFileReadTool(),
    createGroundedQueryTool(),
    createVisitWebpageTool(),
  ];
}

/**
 * Returns the extended tool catalogue for CodeAgent (ADR-138 iter 54).
 *
 * Adds visit_webpage, python_exec, and pdf_read on top of the default set.
 * These tools are consumed by gaia-codeagent-runner.py, not the TypeScript
 * agent loop directly — the catalogue is registered so the system prompt
 * can enumerate them.
 */
export function createCodeAgentToolCatalogue(): GaiaToolCatalogue {
  return [
    createWebSearchTool(),
    createGroundedQueryTool(),
    createVisitWebpageTool(),
    createFileReadTool(),
    createPythonExecTool(),
    createPdfReadTool(),
  ];
}
