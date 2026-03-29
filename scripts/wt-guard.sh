#!/bin/bash
set -euo pipefail

# Worktree guard: baseline tagging and rollback support.
# Run AFTER wt-spawn.sh creates the worktree.
#
# Usage:
#   ./scripts/wt-guard.sh <worktree-path> [tag|rollback]
#
# Commands:
#   tag       - Create a baseline tag at the current HEAD (default)
#   rollback  - Reset the worktree to its baseline tag

if [ $# -lt 1 ]; then
  echo "Usage: $0 <worktree-path> [tag|rollback]"
  echo ""
  echo "Commands:"
  echo "  tag       Create a baseline tag (default)"
  echo "  rollback  Reset worktree to baseline"
  exit 1
fi

WORKTREE_PATH=$1
ACTION=${2:-tag}
TASK_NAME=$(basename "$WORKTREE_PATH")
TAG_NAME="baseline-${TASK_NAME}"

if [ ! -d "$WORKTREE_PATH" ]; then
  echo "Error: Worktree path '$WORKTREE_PATH' does not exist."
  exit 1
fi

case "$ACTION" in
  tag)
    cd "$WORKTREE_PATH"
    git tag -f "$TAG_NAME" HEAD
    echo "Baseline tag '$TAG_NAME' created at $(git rev-parse --short HEAD)"
    echo "To rollback: ./scripts/wt-guard.sh $WORKTREE_PATH rollback"
    ;;
  rollback)
    cd "$WORKTREE_PATH"
    if ! git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
      echo "Error: No baseline tag '$TAG_NAME' found. Run 'tag' first."
      exit 1
    fi
    git reset --hard "$TAG_NAME"
    git clean -fd
    echo "Worktree reset to baseline '$TAG_NAME' ($(git rev-parse --short HEAD))"
    ;;
  *)
    echo "Unknown action: $ACTION. Use 'tag' or 'rollback'."
    exit 1
    ;;
esac
