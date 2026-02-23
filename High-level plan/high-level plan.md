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

### Phase 1: Start the Master (Plan Mode)

1. Open the project in Cursor.
2. Switch to **Plan Mode** (Shift + Tab in the chat panel).
3. Select **Claude 4.6 Opus** as the model.
4. Describe what you want to build. The Master will research the codebase and produce an architectural plan.

**Example prompt:**

> Act as the Master (RH). Research the existing codebase and create an architectural plan for [YOUR FEATURE]. Output the plan to `.cursor/plans/gestalt_01.md`. Include target files, acceptance criteria, and architectural constraints.

The Master outputs a gestalt plan and a JSON handshake with `intent_id`, `target_files`, `architectural_constraint`, and `acceptance_criteria`.

### Phase 2: Hand Off to the Emissary (Agent Mode)

1. Switch to **Agent Mode** (Cmd+I / Ctrl+I).
2. Select **Gemini 2.5 Flash** as the model.
3. Give the Emissary the handshake and tell it to execute.

**Example prompt:**

> Act as the Emissary (LH). Follow the plan in @gestalt_01.md. You are only permitted to touch the files listed in `target_files`. Write tests first (TDD), then implement. Run tests after every change. Return an implementation proof when done.

The Emissary works within its boundaries: strict TDD, file boundary enforcement, no scope creep. It returns a structured `implementation_proof` or an `ESCALATE` signal if it hits a problem.

### Phase 3: Master Reviews (Plan Mode)

1. Switch back to **Plan Mode** with **Claude 4.6 Opus**.
2. Ask the Master to review the Emissary's output.

**Example prompt:**

> Review the Emissary's implementation proof. Check: tests pass, diff stays within target_files, no undeclared dependencies. If aligned, issue APPROVE. If drift detected, issue SUPPRESS with reason and action.

The Master issues `APPROVE` (with follow-up tasks) or `SUPPRESS` (with rollback instructions).

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
