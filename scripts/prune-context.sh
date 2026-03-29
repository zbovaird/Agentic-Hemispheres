#!/bin/bash
set -euo pipefail

# Context pruner: summarize the action journal into workspace state and truncate.
# Run after the verifier exits and the Master issues a final signal.
#
# Usage: ./scripts/prune-context.sh
#
# Reads:  .cursor/plans/action_journal.jsonl
# Writes: Appends summary to workspace_state.json (manual or via jq)
# Truncates: action_journal.jsonl after archiving

JOURNAL=".cursor/plans/action_journal.jsonl"
WORKSPACE_STATE=".cursor/plans/workspace_state.json"
ARCHIVE_DIR=".cursor/plans/archive"

if [ ! -f "$JOURNAL" ]; then
  echo "No action journal found at $JOURNAL. Nothing to prune."
  exit 0
fi

LINE_COUNT=$(wc -l < "$JOURNAL" | tr -d ' ')
if [ "$LINE_COUNT" = "0" ]; then
  echo "Action journal is empty. Nothing to prune."
  exit 0
fi

mkdir -p "$ARCHIVE_DIR"
ARCHIVE_FILE="$ARCHIVE_DIR/journal_$(date -u +%Y%m%d_%H%M%S).jsonl"
cp "$JOURNAL" "$ARCHIVE_FILE"
echo "Archived journal to $ARCHIVE_FILE ($LINE_COUNT entries)"

SUMMARY_LINE_COUNT=20
echo ""
echo "=== Journal Summary (last $SUMMARY_LINE_COUNT entries) ==="
tail -n "$SUMMARY_LINE_COUNT" "$JOURNAL"
echo ""

: > "$JOURNAL"
echo "Action journal truncated. Raw log archived at $ARCHIVE_FILE."
echo ""
echo "Next step: Update workspace_state.json with the summarized observations."
echo "The Master should review the archive and update emissary_observations and action_items."
