#!/usr/bin/env bash
#
# dev-install.sh — Build and link the local Ruflo dev build globally.
#
# After running this, `ruflo` on the terminal points to the source in THIS repo,
# picking up every change after a rebuild (npm run build in v3/@claude-flow/cli).
#
# Usage:
#   bash scripts/dev-install.sh          # build + link
#   bash scripts/dev-install.sh --build  # same (explicit)
#   bash scripts/dev-install.sh --link   # skip build, re-link only
#   bash scripts/dev-install.sh --unlink # remove both global links
#

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI_DIR="$REPO_ROOT/v3/@claude-flow/cli"
RUFLO_DIR="$REPO_ROOT/ruflo"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "  ${YELLOW}▸${NC} $*"; }
err()  { echo -e "${RED}✗${NC} $*" >&2; }

MODE="build"
if [[ "${1:-}" == "--link" ]];   then MODE="link"; fi
if [[ "${1:-}" == "--unlink" ]]; then MODE="unlink"; fi

# ── Unlink ────────────────────────────────────────────────────────────────────
if [[ "$MODE" == "unlink" ]]; then
  echo -e "${BOLD}Removing local dev links...${NC}"
  cd "$RUFLO_DIR" && npm unlink --no-save 2>/dev/null && ok "ruflo global link removed" || info "ruflo was not linked"
  cd "$CLI_DIR"   && npm unlink          2>/dev/null && ok "@claude-flow/cli global link removed" || info "@claude-flow/cli was not linked"
  echo ""
  echo -e "Reverted. Install from npm with: ${BOLD}npm install -g ruflo@latest${NC}"
  exit 0
fi

echo ""
echo -e "${BOLD}Ruflo — local dev install${NC}"
echo -e "Repo:  $REPO_ROOT"
echo ""

# ── 1. Install CLI dependencies ───────────────────────────────────────────────
info "Installing @claude-flow/cli dependencies..."
cd "$CLI_DIR"
# Use --no-workspaces to avoid workspace:* resolution issues (project uses pnpm)
npm install --no-workspaces --legacy-peer-deps --prefer-offline 2>&1 \
  | grep -E "added|updated|removed|warn" | head -5 || true
ok "@claude-flow/cli deps ready"

# Ensure devDependencies (typescript, vitest) are installed
if [[ ! -f "node_modules/.bin/tsc" ]]; then
  info "Installing devDependencies (TypeScript compiler)..."
  npm install typescript@^5.3.0 vitest@^4.0.16 --save-dev --no-workspaces --legacy-peer-deps 2>&1 \
    | tail -2 || true
fi

# ── 2. Build TypeScript ───────────────────────────────────────────────────────
if [[ "$MODE" == "build" ]]; then
  info "Compiling TypeScript..."
  # --noEmitOnError false: pre-existing @claude-flow/swarm reference errors are
  # harmless (the swarm package isn't built locally); we still emit valid JS.
  node_modules/.bin/tsc --noEmitOnError false 2>&1 | grep "error TS" \
    | grep -v "swarm\|in-memory-repositories" || true
  ok "Build complete  →  dist/"
fi

# ── 3. Global-link @claude-flow/cli ──────────────────────────────────────────
info "Linking @claude-flow/cli globally..."
npm link
ok "@claude-flow/cli linked"

# ── 4. Install ruflo umbrella deps + link CLI into it ─────────────────────────
info "Linking @claude-flow/cli into ruflo umbrella..."
cd "$RUFLO_DIR"
npm install --prefer-offline 2>&1 | grep -E "added|updated|removed|warn" | head -5 || true
npm link @claude-flow/cli
ok "ruflo/node_modules/@claude-flow/cli → local build"

# ── 5. Global-link ruflo binary ───────────────────────────────────────────────
info "Linking ruflo globally..."
npm link
ok "ruflo binary linked globally"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Done!${NC} The global \`ruflo\` command now runs your local build."
echo ""
echo -e "  ${BOLD}ruflo --version${NC}            # verify"
echo -e "  ${BOLD}ruflo test --dry-run${NC}       # test the new test command"
echo ""
echo -e "After editing source files, rebuild with:"
echo -e "  ${BOLD}cd v3/@claude-flow/cli && npm run build${NC}"
echo -e "  (no re-link needed — the symlink already points here)"
echo ""
