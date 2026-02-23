# Bicameral Agent Implementation Plan

To implement the bicameral agent model within your Cursor environment, you will utilize the native Agent Mode and `.cursor/rules/` (`.mdc` files) to enforce the hierarchy between the "Master" and "Emissary."

Below is a structured plan. You should create the specified directory and files, then use the provided "Bicameral Protocol" prompt to initiate the workflow.

## 1. Project Directory Structure

First, ensure your project has the following directory structure to house the "laws" of the hemispheres:

```
.cursor/
├── rules/
│   ├── 01_master_rh.mdc      # The Master (Right Hemisphere)
│   ├── 02_emissary_lh.mdc    # The Emissary (Left Hemisphere)
│   └── 03_callosum.mdc       # The Communication Protocol
├── hooks/
│   └── grind.ts               # Inhibitory Feedback Loop
└── plans/                     # Storage for architectural Gestalt
```

## 2. Copy-Paste Rule Files (.mdc)

Create these files in `.cursor/rules/`. Each file uses frontmatter to tell Cursor when to apply the rule.

### File: `.cursor/rules/01_master_rh.mdc`

```markdown
---
description: USE WHEN planning architecture, defining project intent, or performing high-level code reviews.
globs:
alwaysApply: false
---

# Right Hemisphere: The Master (Claude 3.6 Opus)

You are the architect of the system. Your primary mode is holistic, contextual, and non-linear.

## Core Principles

- **The Whole over the Part:** Prioritize system-wide integrity over local implementation.
- **Inhibitory Gating:** You must act as a filter. If the implementation "Emissary" suggests a change that drifts from the core intent, inhibit and redirect.
- **Implicit Understanding:** Look for patterns, ambiguity, and user intent that isn't explicitly stated in the code.

## Operational Guidelines

- **Plan Mode First:** Always research the codebase using grep or semantic search before suggesting a single line of code.
- **Gestalt Bug Diagnosis:** When a bug appears, look at the relationships between modules rather than just the failing line.
- **Metacognitive Self-Improvement:** After each review cycle, update `.cursor/plans/` with lessons learned and architectural invariants.
```

### File: `.cursor/rules/02_emissary_lh.mdc`

```markdown
---
description: USE WHEN implementing specific functions, writing tests, or executing sequential coding tasks.
globs: src/**/* , tests/**/*
alwaysApply: false
---

# Left Hemisphere: The Emissary (Gemini 1.5 Flash)

You are the executor. Your primary mode is analytical, sequential, and literal.

## Core Principles

- **The Part over the Whole:** Focus exclusively on the discrete task assigned by the Master.
- **Tool Manipulation:** You excel at syntax, naming, and procedural logic.
- **Execution Clarity:** Transform the Master's implicit "intent" into explicit, static, and manipulatable code.

## Operational Guidelines

- **Strict TDD:** Write the test first, confirm failure, then implement.
- **No Scope Creep:** Do not make "while-I'm-here" improvements. Stick to the sequential plan.
- **Syntactic Precision:** Ensure 100% linter and type-safety compliance.
```

### File: `.cursor/rules/03_callosum.mdc`

```markdown
---
description: USE WHEN agents are communicating or handing off tasks.
globs:
alwaysApply: true
---

# The Corpus Callosum: The 2% Signaling Protocol

To prevent "context pollution," communication between agents is limited to high-signal metadata.

## Communication Constraints

- **Selective Signaling:** Only 2% of total context is shared during a hand-off.
- **Interhemispheric Inhibition:** The Master must review every diff. If the Emissary's output is noisy, the Master will issue a "Suppression Signal" to force a retry.

## The JSON Handshake

All hand-offs between Master and Emissary must follow this structure:

```json
{
  "intent_id": "feat-auth-endpoint-001",
  "architectural_constraint": "Must use existing AuthMiddleware pattern; no new dependencies without Master approval.",
  "target_files": [
    "src/controllers/auth.controller.ts",
    "src/migrations/003_add_sessions.ts",
    "tests/auth.controller.test.ts"
  ],
  "acceptance_criteria": [
    "POST /api/auth/session returns 201 with valid JWT",
    "Migration is reversible",
    "All existing tests still pass"
  ],
  "implementation_proof": {
    "test_log": "<stdout from test runner>",
    "diff_summary": "<git diff --stat output>",
    "lint_status": "pass | fail"
  }
}
```

## Suppression Signal

If the Master detects architectural drift, it returns:

```json
{
  "signal": "SUPPRESS",
  "intent_id": "feat-auth-endpoint-001",
  "reason": "Introduced undeclared dependency on redis; violates constraint.",
  "action": "ROLLBACK_AND_RETRY"
}
```
```

## 3. Step-by-Step Implementation Workflow

Once the rules are saved, follow these steps to "spin up" the system:

### Phase 1: Set the Context

Open Cursor and ensure your research document is available.

**Prompt (in Chat Cmd+L):** "I am initializing a Bicameral Agent system based on @Research_Report.md. Ensure all future operations respect `.cursor/rules/`."

### Phase 2: The Master's Plan (RH Focus)

Use Plan Mode (Shift + Tab) and select Claude 3.6 Opus.

**Prompt:** "Act as the Master (RH). Research the existing codebase and create an architectural plan for [FEATURE]. Output the plan to `.cursor/plans/gestalt_01.md`."

**Why:** This ensures the high-reasoning model establishes the "Whole" before any code is touched.

### Phase 3: Targeted Implementation (LH Focus)

Switch to Agent Mode (Cmd + I) and select Gemini 1.5 Flash.

**Prompt:** "Act as the Emissary (LH). Follow the plan in @gestalt_01.md. You are only permitted to touch the files listed in the 'Target Files' section of the plan. Run tests after every change."

**Why:** This limits the "Emissary" to local parts, preventing context-drift and maintaining the 2% connectivity rule.

### Phase 4: Inhibitory Review

Switch back to Claude 3.6 Opus.

**Prompt:** "Review the diffs produced by the Emissary. Do they violate the architectural Gestalt? If yes, provide a suppression signal. If no, approve for merge."

## 4. Predicted Operation Economics (2026 Rates)

Based on the research document's model pricing projections:

| Phase | Agent | Model | Input Tokens | Output Tokens | Cost |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **1. Planning** | Master (RH) | Claude 3.6 Opus | 101,000 | 2,000 | $0.555 |
| **2. Implementation** | Emissary (LH) | Gemini 1.5 Flash | 48,000 | 6,000 | $0.005 |
| **3. Review** | Master (RH) | Claude 3.6 Opus | 108,000 | 500 | $0.553 |
| **Total** | | | **257,000** | **8,500** | **$1.11** |

Compared to a monolithic workflow (Opus-only): **~44% cost reduction** and **~60% latency reduction** during implementation loops.

## 5. Error Escalation Protocol (Clarification Threshold)

The Emissary (LH) operates autonomously within its task scope. Escalation to the Master follows a strict threshold:

1. **Iterations 1-3:** Emissary self-corrects using lint errors and test output. No Master involvement.
2. **Iteration 4:** Emissary logs a warning in the handshake `implementation_proof` noting repeated failures.
3. **Iteration 5 (Clarification Threshold):** Emissary halts and sends a structured escalation to the Master:

```json
{
  "signal": "ESCALATE",
  "intent_id": "feat-auth-endpoint-001",
  "iteration_count": 5,
  "failure_pattern": "Type error in AuthMiddleware.validate() - mismatch between JWT payload shape and Session model",
  "attempted_fixes": [
    "Cast JWT payload to SessionPayload type",
    "Added optional chaining on session.user",
    "Updated Session model to match JWT structure"
  ],
  "request": "Architectural guidance needed - possible schema mismatch between auth and session modules."
}
```

The Master then re-evaluates the architectural plan and may issue a revised constraint or redesign the interface.

## 6. Git Worktree Setup for Parallel Agents

For parallel execution of multiple features, use git worktrees to isolate each Emissary's workspace:

```bash
# Create worktrees for parallel feature branches
git worktree add ../feature-auth feature/auth-endpoint
git worktree add ../feature-dashboard feature/dashboard-refactor

# Each Cursor window opens a separate worktree
# Master (RH) operates from the main worktree
# Each Emissary (LH) operates in its isolated worktree
```

**Rules for worktree isolation:**
- Each Emissary gets its own worktree and feature branch.
- The Master reviews diffs from all worktrees before any merge to `main`.
- Worktrees are disposable; remove after merge with `git worktree remove ../feature-auth`.
- If two Emissaries touch the same file, the Master must sequence their merges and resolve conflicts.

## 7. The Grind Hook (Inhibitory Feedback Loop)

The `grind.ts` hook in `.cursor/hooks/` automates the Emissary's self-correction loop, preventing premature escalation while enforcing the Clarification Threshold.

```typescript
// .cursor/hooks/grind.ts
// Inhibitory feedback loop for the Emissary (LH)
//
// Automatically re-feeds lint/test failures back to the Emissary
// without involving the Master, until the Clarification Threshold
// is reached (default: 5 iterations).

const CLARIFICATION_THRESHOLD = 5;

export default {
  name: "grind",
  event: "onSave",
  match: ["src/**/*", "tests/**/*"],
  async run(context) {
    const { file, runCommand, getState, setState } = context;

    const iterKey = `grind:${file.path}:iterations`;
    const iterations = (getState(iterKey) as number) || 0;

    const lintResult = await runCommand(`npx eslint ${file.path} --format json`);
    const testResult = await runCommand(`npx vitest run --reporter=json`);

    const lintPassed = lintResult.exitCode === 0;
    const testsPassed = testResult.exitCode === 0;

    if (lintPassed && testsPassed) {
      setState(iterKey, 0);
      return { action: "continue" };
    }

    const nextIteration = iterations + 1;
    setState(iterKey, nextIteration);

    if (nextIteration >= CLARIFICATION_THRESHOLD) {
      setState(iterKey, 0);
      return {
        action: "escalate",
        message: `Clarification Threshold reached (${CLARIFICATION_THRESHOLD} iterations). Escalating to Master.`,
        payload: {
          signal: "ESCALATE",
          iteration_count: nextIteration,
          lint_errors: lintPassed ? null : lintResult.stdout,
          test_errors: testsPassed ? null : testResult.stdout,
        },
      };
    }

    return {
      action: "retry",
      message: `Iteration ${nextIteration}/${CLARIFICATION_THRESHOLD}. Fix the following errors before proceeding.`,
      payload: {
        lint_errors: lintPassed ? null : lintResult.stdout,
        test_errors: testsPassed ? null : testResult.stdout,
      },
    };
  },
};
```
