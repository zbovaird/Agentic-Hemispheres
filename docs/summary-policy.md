# Summary policy

This document complements [`.cursor/rules/06_ai_navigation.mdc`](../.cursor/rules/06_ai_navigation.mdc). It defines **where** summaries live and **when** to create or refresh them—without saturating the repo with comments.

## Goals

- Reduce repeated "open every file" exploration for agents and humans.
- Treat **stale summaries as architecture drift**, not a separate cleanup chore.
- Prefer **compression** (maps, folder READMEs, sidecars) over block-by-block narration.

## What a good summary contains

- Purpose and main responsibilities.
- Important entry points or public API.
- Local invariants or constraints.
- Related files and when to read raw source anyway.

Avoid:

- Line-by-line paraphrase of the code.
- Stale counts or fragile detail that drifts every commit.
- Generic filler that could describe any module.

## When to add or refresh

- New top-level or domain folder.
- A file becomes large, dense, exported, or a frequent reference.
- A module’s responsibility or boundary changes.
- A nearby summary becomes wrong because of the current change.

## When not to add

- The file is small and faster to read than to summarize.
- The summary would only restate obvious names and structure.
- The artifact is transient or scratch with no stable role.
- Native JSON or generated blobs where inline comments are inappropriate—use a sidecar under `docs/summaries/` when needed.

## Deferred work

If summary updates cannot be done in the current task, add a short note to `summary_debt_pending` in [`.cursor/plans/workspace_state.json`](../.cursor/plans/workspace_state.json) so the Master can schedule follow-up.
