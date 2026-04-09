/**
 * Shared working-directory helper for MCP tools.
 *
 * When ruflo is installed globally and the MCP server is registered without
 * an explicit cwd, macOS (and some Linux setups) spawn the stdio process at
 * "/". All process.cwd()-based paths then resolve to the read-only root
 * filesystem, breaking every file operation.
 *
 * This helper checks the CLAUDE_FLOW_CWD environment variable first,
 * falling back to process.cwd() only when the variable is not set.
 */

/**
 * Returns the effective working directory for file operations.
 *
 * Resolution order:
 * 1. CLAUDE_FLOW_CWD environment variable (set by the install script)
 * 2. process.cwd()
 */
export function getBaseCwd(): string {
  const cwd = process.env.CLAUDE_FLOW_CWD || process.cwd();
  if (cwd === '/') {
    console.warn('[ruflo] Warning: CWD resolved to root (/). Set CLAUDE_FLOW_CWD to your project directory.');
  }
  return cwd;
}
