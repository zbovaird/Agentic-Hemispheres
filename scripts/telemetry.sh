#!/bin/bash
set -euo pipefail

# Agent Performance Telemetry: collect metrics from test/lint/workspace_state.
# Appends a JSON line to .cursor/plans/telemetry.jsonl.
#
# Usage: ./scripts/telemetry.sh [intent_id] [cost_usd]
#
# Arguments:
#   intent_id  - The current intent identifier (default: "unknown")
#   cost_usd   - Actual cost from Cursor usage panel (default: null)
#
# Collects: timestamp, intent_id, model_config, tests, lint, workspace_phase,
#           signal, iterations, predictions, callosal_bytes, summary_debt_count,
#           file_count, cost_usd.

INTENT_ID=${1:-"unknown"}
COST_USD=${2:-"null"}
TELEMETRY_FILE=".cursor/plans/telemetry.jsonl"
WORKSPACE_STATE=".cursor/plans/workspace_state.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- Test results ---
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

# --- Lint results ---
lint_result="unknown"
if command -v npx >/dev/null 2>&1; then
  if [ -f "eslint.config.js" ] || [ -f ".eslintrc.json" ]; then
    if npx eslint src/ --quiet 2>/dev/null; then
      lint_result="pass"
    else
      lint_result="fail"
    fi
  fi
fi

# --- Workspace state fields ---
workspace_phase="unknown"
MODELS_JSON=".cursor/models.json"
model_master="opus"
model_implementer="flash"
model_verifier="flash"
if [ -f "$MODELS_JSON" ]; then
  model_master=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$MODELS_JSON" | head -1 | sed 's/.*: *"//;s/"//' 2>/dev/null || echo "opus")
  model_implementer=$(grep -A2 '"implementer"' "$MODELS_JSON" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"//;s/"//' 2>/dev/null || echo "flash")
  model_verifier=$(grep -A2 '"verifier"' "$MODELS_JSON" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"//;s/"//' 2>/dev/null || echo "flash")
fi
signal="unknown"
iterations=0
pred_total=0
pred_low=0
pred_high=0
callosal_bytes=0
summary_debt_count=0
file_count=0

if [ -f "$WORKSPACE_STATE" ]; then
  workspace_phase=$(grep -o '"phase"[[:space:]]*:[[:space:]]*"[^"]*"' "$WORKSPACE_STATE" | head -1 | sed 's/.*: *"//;s/"//' || echo "unknown")

  model_tier=$(grep -o '"model_tier"[[:space:]]*:[[:space:]]*"[^"]*"' "$WORKSPACE_STATE" | head -1 | sed 's/.*: *"//;s/"//' 2>/dev/null || echo "")
  if [ -n "$model_tier" ]; then
    model_implementer="$model_tier"
  fi

  signal=$(grep -o '"signal"[[:space:]]*:[[:space:]]*"[^"]*"' "$WORKSPACE_STATE" | head -1 | sed 's/.*: *"//;s/"//' 2>/dev/null || echo "unknown")

  iterations=$(grep -c '"step"' "$WORKSPACE_STATE" 2>/dev/null || true)
  iterations=$(echo "$iterations" | tr -d '[:space:]')
  iterations=${iterations:-0}

  pred_total=$iterations
  pred_high=$(grep -c '"deviation"[[:space:]]*:[[:space:]]*"high"' "$WORKSPACE_STATE" 2>/dev/null || true)
  pred_high=$(echo "$pred_high" | tr -d '[:space:]')
  pred_high=${pred_high:-0}
  pred_low=$((pred_total - pred_high))
  if [ "$pred_low" -lt 0 ]; then pred_low=0; fi

  callosal_bytes=$(wc -c < "$WORKSPACE_STATE" 2>/dev/null || true)
  callosal_bytes=$(echo "$callosal_bytes" | tr -d '[:space:]')
  callosal_bytes=${callosal_bytes:-0}

  summary_debt_count=0
  if grep -q '"summary_debt_log"' "$WORKSPACE_STATE" 2>/dev/null; then
    summary_debt_count=$(grep -A 100 '"summary_debt_log"' "$WORKSPACE_STATE" 2>/dev/null | grep -c '"file"' || true)
    summary_debt_count=$(echo "$summary_debt_count" | tr -d '[:space:]')
    summary_debt_count=${summary_debt_count:-0}
  fi

  file_count=0
  if grep -q '"target_files"' "$WORKSPACE_STATE" 2>/dev/null; then
    file_count=$(grep -A 50 '"target_files"' "$WORKSPACE_STATE" 2>/dev/null | grep -c '\.' || true)
    file_count=$(echo "$file_count" | tr -d '[:space:]')
    file_count=${file_count:-0}
  fi
fi

# --- Validate cost_usd ---
if [ "$COST_USD" != "null" ]; then
  if ! echo "$COST_USD" | grep -qE '^[0-9]+\.?[0-9]*$'; then
    echo "Warning: cost_usd '$COST_USD' is not a valid number. Setting to null."
    COST_USD="null"
  fi
fi

mkdir -p "$(dirname "$TELEMETRY_FILE")"

printf '{"timestamp":"%s","intent_id":"%s","model_config":{"master":"%s","implementer":"%s","verifier":"%s"},"tests":{"passed":%s,"failed":%s,"result":"%s"},"lint":"%s","workspace_phase":"%s","signal":"%s","iterations":%s,"predictions":{"total":%s,"low_surprise":%s,"high_surprise":%s},"callosal_bytes":%s,"summary_debt_count":%s,"file_count":%s,"cost_usd":%s}\n' \
  "$TIMESTAMP" "$INTENT_ID" \
  "$model_master" "$model_implementer" "$model_verifier" \
  "${test_passed:-0}" "${test_failed:-0}" "$test_result" \
  "$lint_result" "$workspace_phase" "$signal" "$iterations" \
  "$pred_total" "$pred_low" "$pred_high" \
  "$callosal_bytes" "$summary_debt_count" "$file_count" \
  "$COST_USD" \
  >> "$TELEMETRY_FILE"

echo "Telemetry recorded to $TELEMETRY_FILE"
echo "  intent=$INTENT_ID signal=$signal model=$model_implementer iterations=$iterations cost=$COST_USD"

# --- Also record to new metrics framework ---
if command -v npx >/dev/null 2>&1 && [ -f "metrics/record.ts" ]; then
  COST_ARG=""
  if [ "$COST_USD" != "null" ]; then COST_ARG="--cost=$COST_USD"; fi
  npx tsx metrics/record.ts --run="$INTENT_ID" --goal="$INTENT_ID" $COST_ARG 2>/dev/null || echo "  (metrics record skipped — tsx not available)"
fi
