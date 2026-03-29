#!/bin/bash
set -euo pipefail

# MVP Telemetry: collect observable metrics from test/lint/workspace_state.
# Appends a JSON line to .cursor/plans/telemetry.jsonl.
#
# Usage: ./scripts/telemetry.sh [intent_id]
#
# Collects: timestamp, intent_id, test pass/fail, lint status, workspace phase.
# Does NOT collect token usage (not available in hooks).

INTENT_ID=${1:-"unknown"}
TELEMETRY_FILE=".cursor/plans/telemetry.jsonl"
WORKSPACE_STATE=".cursor/plans/workspace_state.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

test_result="unknown"
test_passed=0
test_failed=0
if command -v npx >/dev/null 2>&1 && [ -f "vitest.config.ts" ]; then
  test_output=$(npx vitest run --reporter=json 2>/dev/null || true)
  test_passed=$(echo "$test_output" | grep -o '"numPassedTests":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
  test_failed=$(echo "$test_output" | grep -o '"numFailedTests":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
  if [ "$test_failed" = "0" ] && [ "$test_passed" != "0" ]; then
    test_result="pass"
  elif [ "$test_failed" != "0" ]; then
    test_result="fail"
  fi
fi

lint_result="unknown"
if command -v npx >/dev/null 2>&1 && [ -f "eslint.config.js" ] || [ -f ".eslintrc.json" ]; then
  if npx eslint src/ --quiet 2>/dev/null; then
    lint_result="pass"
  else
    lint_result="fail"
  fi
fi

workspace_phase="unknown"
if [ -f "$WORKSPACE_STATE" ]; then
  workspace_phase=$(grep -o '"phase"[[:space:]]*:[[:space:]]*"[^"]*"' "$WORKSPACE_STATE" | head -1 | sed 's/.*: *"//;s/"//' || echo "unknown")
fi

mkdir -p "$(dirname "$TELEMETRY_FILE")"

printf '{"timestamp":"%s","intent_id":"%s","tests":{"passed":%s,"failed":%s,"result":"%s"},"lint":"%s","workspace_phase":"%s"}\n' \
  "$TIMESTAMP" "$INTENT_ID" "${test_passed:-0}" "${test_failed:-0}" "$test_result" "$lint_result" "$workspace_phase" \
  >> "$TELEMETRY_FILE"

echo "Telemetry recorded to $TELEMETRY_FILE"
