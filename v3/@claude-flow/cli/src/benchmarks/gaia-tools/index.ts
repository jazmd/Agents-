/**
 * gaia-tools barrel — ADR-133-PR2/PR4/PR5
 *
 * Exports all tool implementations + shared types so that gaia-agent.ts
 * (PR-3) and future iterations can import from a single entry point.
 *
 * Catalogue evolution:
 *   PR-2: web_search + file_read
 *   PR-4: + python_exec (local Python 3 subprocess — see python_exec.ts)
 *   PR-5: + web_browse (Playwright headless) + image_describe (Anthropic vision)
 *
 * Refs: ADR-133, #2156
 */

export * from './types.js';
export * from './web_search.js';
export * from './file_read.js';
export * from './python_exec.js';
export * from './web_browse.js';
export * from './image_describe.js';

import { createWebSearchTool } from './web_search.js';
import { createFileReadTool } from './file_read.js';
import { createPythonExecTool, type PythonExecToolOptions } from './python_exec.js';
import { createWebBrowseTool, type WebBrowseToolOptions } from './web_browse.js';
import { createImageDescribeTool, type ImageDescribeToolOptions } from './image_describe.js';
import type { GaiaToolCatalogue } from './types.js';

export interface GaiaToolCatalogueOptions {
  pythonExec?: PythonExecToolOptions;
  webBrowse?: WebBrowseToolOptions;
  imageDescribe?: ImageDescribeToolOptions;
}

/**
 * Returns the default tool catalogue for a GAIA Level-1 run.
 *
 * PR-2 catalogue: web_search + file_read
 * PR-4 catalogue: + python_exec (local Python 3 subprocess — see python_exec.ts security model)
 * PR-5 catalogue: + web_browse (Playwright) + image_describe (Anthropic vision)
 */
export function createDefaultToolCatalogue(opts?: GaiaToolCatalogueOptions): GaiaToolCatalogue {
  return [
    createWebSearchTool(),
    createFileReadTool(),
    createPythonExecTool(opts?.pythonExec),
    createWebBrowseTool(opts?.webBrowse),
    createImageDescribeTool(opts?.imageDescribe),
  ];
}
