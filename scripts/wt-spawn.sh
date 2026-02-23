#!/bin/bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <task-name> <branch-name>"
  echo "Example: $0 task-api feat/api-refactor"
  exit 1
fi

TASK_NAME=$1
BRANCH=$2
TARGET_DIR="../${PWD##*/}-worktrees/$TASK_NAME"

git worktree add -b "$BRANCH" "$TARGET_DIR" main

echo "Worktree created at $TARGET_DIR"
echo "Open in a new Cursor window to start an Emissary session."
