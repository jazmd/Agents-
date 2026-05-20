#!/usr/bin/env bash
# Smoke driver for the ruflo CLI.
# Run from the repo root: bash .claude/skills/run-ruflo/smoke.sh
set -uo pipefail

RUFLO="node ruflo/bin/ruflo.js"
PASS=0; FAIL=0

chk() {
  local label=$1; local pattern=$2; shift 2
  local out
  out=$($RUFLO "$@" 2>&1) || true
  if echo "$out" | grep -q "$pattern"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (got: $(echo "$out" | head -1))"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== ruflo smoke tests ==="

chk "--version prints version"      "^ruflo v"           --version
chk "--help lists PRIMARY COMMANDS" "PRIMARY COMMANDS"    --help
chk "doctor prints Summary"         "Summary:"            doctor
chk "agent --help lists spawn"      "spawn"               agent --help
chk "route --help mentions Q-Learn" "Q-Learning"          route --help

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
