/**
 * Shared working-directory helper for memory modules.
 *
 * When ruflo is installed globally, macOS spawns the MCP stdio process at "/".
 * All process.cwd()-based paths then resolve to the read-only root filesystem.
 * This helper checks CLAUDE_FLOW_CWD first, falling back to process.cwd().
 */
export function getBaseCwd(): string {
  const cwd = process.env.CLAUDE_FLOW_CWD || process.cwd();
  if (cwd === '/') {
    console.warn('[ruflo] Warning: CWD resolved to root (/). Set CLAUDE_FLOW_CWD to your project directory.');
  }
  return cwd;
}
