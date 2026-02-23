# Bicameral Agent Implementation Plan

This template includes all rule files, hooks, MCP config, and plans pre-configured. No manual file creation or copy-pasting is needed — just clone (or use as a template) and follow the workflow below.

## 1. Project Directory Structure (Included in Template)

The following structure is already set up:

```
.cursor/
├── rules/
│   ├── 01_master_rh.mdc      # The Master (Right Hemisphere) — Claude 4.6 Opus
│   ├── 02_emissary_lh.mdc    # The Emissary (Left Hemisphere) — Gemini 2.5 Flash
│   ├── 03_callosum.mdc       # Communication Protocol + Global Workspace
│   └── 04_security.mdc       # STDIO/MCP Security Governance
├── mcp.json                   # MCP server config (local stdio)
├── hooks/
│   └── grind.ts               # Inhibitory Feedback Loop
└── plans/                     # Gestalt plans, handshakes, workspace state
```

Cursor reads `.cursor/rules/` automatically when you open the project. The `.mdc` frontmatter controls when each rule activates.

## 2. Step-by-Step Workflow

You work with the Master (Claude 4.6 Opus) as your primary agent. The Master spawns the Emissary (Gemini 2.5 Flash) as a subagent when it's time to implement. The handoff happens automatically — you don't manually switch modes.

### Phase 1: Master Plans

1. Open the project in Cursor.
2. Select **Claude 4.6 Opus** as the model.
3. Describe what you want to build.

**Example prompt:**

> Act as the Master (RH). Research the existing codebase and create an architectural plan for [YOUR FEATURE]. Output the plan to `.cursor/plans/gestalt_01.md`. Include target files, acceptance criteria, and architectural constraints.

The Master outputs a gestalt plan and a JSON handshake with `intent_id`, `target_files`, `architectural_constraint`, and `acceptance_criteria`.

### Phase 2: Master Dispatches Emissary (Subagent)

The Master spawns the Emissary as a **subagent** running Gemini 2.5 Flash. The subagent receives only the JSON handshake (~2% of context) and executes autonomously.

**Example prompt:**

> Dispatch the Emissary to implement the plan in @gestalt_01.md. The Emissary should only touch the files in `target_files`. It must write tests first (TDD), then implement, run tests after every change, and return an implementation proof when done.

The Emissary subagent works within its boundaries: strict TDD, file boundary enforcement, no scope creep. It returns a structured `implementation_proof`, or an `ESCALATE` / `SURPRISE` signal if it hits a problem. The Master receives the result in the same session.

### Phase 3: Master Reviews

The Master reviews the Emissary's proof automatically in the same conversation:

- Tests pass? Diff within `target_files` boundary? No undeclared dependencies?
- If aligned: issues `APPROVE` with follow-up tasks.
- If drift detected: issues `SUPPRESS` with rollback instructions.
- If the Emissary escalated: Master evaluates the `ESCALATE` signal, revises constraints, and re-dispatches.

### Phase 4: Repeat (Spiral)

Continue the Right → Left → Right spiral for each feature or task. The Global Workspace at `.cursor/plans/workspace_state.json` carries state between cycles.

## 3. Signal Types

| Signal | Who Sends | When |
|--------|-----------|------|
| **APPROVE** | Master | Emissary's work passes review |
| **SUPPRESS** | Master | Drift detected; Emissary must rollback and retry |
| **ESCALATE** | Emissary | 5 failed iterations on the same issue, or constraint vs criterion conflict |
| **SURPRISE** | Emissary | Prediction deviates significantly from actual outcome (Active Inference) |

## 4. Error Escalation Protocol (Clarification Threshold)

The Emissary operates autonomously within its task scope:

1. **Iterations 1–4:** Self-corrects using lint errors and test output. No Master involvement.
2. **Iteration 5 (Clarification Threshold):** Halts and sends a structured `ESCALATE` signal:

```json
{
  "signal": "ESCALATE",
  "intent_id": "feat-auth-endpoint-001",
  "iteration_count": 5,
  "failure_pattern": "Type error in AuthMiddleware.validate()",
  "attempted_fixes": [
    "Cast JWT payload to SessionPayload type",
    "Added optional chaining on session.user"
  ],
  "request": "Architectural guidance needed."
}
```

The Master re-evaluates and may issue a revised constraint or redesign.

## 5. Parallel Execution (Worktrees)

For multiple features in parallel:

```bash
./scripts/wt-spawn.sh task-api feat/api-refactor
./scripts/wt-spawn.sh task-docs feat/docs-update
```

Open each worktree in a new Cursor window. Each window runs its own Emissary (Flash). The Master in the main repo reviews PRs from each worktree and merges back.

## 6. Predicted Operation Economics

| Phase | Agent | Model | Input Tokens | Output Tokens | Cost |
|-------|-------|-------|-------------|--------------|------|
| Planning | Master (RH) | Claude 4.6 Opus | ~101,000 | ~2,000 | $0.555 |
| Implementation | Emissary (LH) | Gemini 2.5 Flash | ~48,000 | ~6,000 | $0.005 |
| Review | Master (RH) | Claude 4.6 Opus | ~108,000 | ~500 | $0.553 |
| **Total** | | | **~257,000** | **~8,500** | **$1.11** |

Compared to monolithic Opus-only: **~44% cost reduction** at baseline, **75–84% in validated tests** with v2 data compression and predictive processing.
