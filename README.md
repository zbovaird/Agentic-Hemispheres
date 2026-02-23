# Agentic Hemispheres

A bi-hemispheric AI orchestration framework for Cursor, modeled after Iain McGilchrist's Master-Emissary paradigm. Use this repo as a template to run a high-reasoning "Master" model for strategy and a task-focused "Emissary" model for execution—with structured handoffs that reduce token cost and context pollution.

## Overview

This project implements a dual-agent architecture that pairs:

- **Master (RH):** Claude 4.6 Opus — holistic planning, code review, architectural oversight  
- **Emissary (LH):** Gemini 2.5 Flash — rapid implementation, TDD, sequential task execution  
- **Corpus Callosum:** A 2% selective signaling protocol that limits inter-agent communication to high-signal metadata

Validated results: ~75–84% cost reduction vs monolithic Opus, with fewer scope-creep and constraint-violation errors.

## Repository Structure

```
├── High-level plan/
│   └── high-level plan.md                        # Implementation guide (Plan → Implement → Review)
├── test-runs/                                    # Validation runs (APPROVE + ESCALATE paths)
│   ├── 01-string-utils/                          # String utils — 75% cost savings (v2)
│   └── 02-boundary-violation/                    # Array utils + contradiction trap — 84% savings (v2)
├── scripts/
│   └── wt-spawn.sh                               # Git worktree spawner for parallel Emissaries
├── .cursor/
│   ├── rules/
│   │   ├── 01_master_rh.mdc                     # Master agent rules
│   │   ├── 02_emissary_lh.mdc                   # Emissary agent rules
│   │   ├── 03_callosum.mdc                      # Communication protocol + Global Workspace
│   │   └── 04_security.mdc                      # STDIO/MCP security governance
│   ├── mcp.json                                  # MCP server configuration (local stdio)
│   ├── hooks/
│   │   └── grind.ts                              # Inhibitory feedback loop
│   └── plans/                                    # Architectural Gestalt + workspace state
├── .cursorrules                                  # Cursor template guidance (project structure, standards)
└── README.md
```

## How Each Part of the Architecture Works

### Master (Right Hemisphere) — `01_master_rh.mdc`

The Master governs strategy, architecture, and the "Three Axes" (functionality, efficiency, cost). It:

- Issues high-level **Intents** (no tool schemas—prevents "Shadow Poisoning")
- Runs Plan Mode first: researches the codebase before suggesting code
- Reviews Emissary output via `implementation_proof` and issues `APPROVE` or `SUPPRESS`
- Uses **Human-in-the-Loop gates** for tradeoffs, ambiguity, or architectural changes
- Uses **Active Inference Gate**: invoked only when Emissary's prediction error is high ("surprise")
- Instructs the Emissary which MCP clients to use for which domains

### Emissary (Left Hemisphere) — `02_emissary_lh.mdc`

The Emissary executes discrete tasks with strict boundaries. It:

- Follows **Strict TDD**: write tests first, confirm failure, then implement
- Respects **File Boundary**: only touches files in the Master's `target_files`
- Self-corrects up to 5 iterations, then **ESCALATE**s with failure pattern and resolution options
- Uses **Predictive Processing**: emits a 1-sentence prediction before each action; high deviation triggers `SURPRISE` and Master re-evaluation
- Interacts with MCP servers exclusively via **stdio** (no remote URLs unless authorized)
- Summarizes outputs into Semantic Summaries (≤20 lines) before sending to Master

### Corpus Callosum — `03_callosum.mdc`

The signaling layer limits cross-agent traffic to high-signal metadata. It defines:

- **JSON Handshake**: `intent_id`, `architectural_constraint`, `target_files`, `acceptance_criteria`, `implementation_proof`
- **Signal types**: `APPROVE`, `SUPPRESS`, `ESCALATE`, `SURPRISE`
- **Data Compression**: Emissary writes Action Items/Observations; Master writes Contextual Constraints/Strategy Shifts
- **Global Workspace**: Shared state at `.cursor/plans/workspace_state.json` instead of passing full conversation history

### Security Layer — `04_security.mdc`

- **STDIO Mandate**: All MCP tools run as local child processes. Reject remote MCP URLs unless authorized.
- **Tool Schema Isolation**: Master never sees raw tool schemas. Emissary summarizes before relaying.
- **MCP Client Routing**: `local-filesystem` for file ops, `security-audit` (Snyk) for scanning. Add others in `.cursor/mcp.json`.
- **Worktree Security**: Each worktree gets isolated MCP instances; Master reviews PRs from worktrees.

### MCP Configuration — `.cursor/mcp.json`

Defines which MCP servers Cursor spawns as local child processes:

| Server           | Purpose          | Notes                           |
|-----------------|------------------|---------------------------------|
| `local-filesystem` | File operations   | Scoped to `${workspaceFolder}` |
| `security-audit`    | Vulnerability scan | Requires `SNYK_TOKEN` env var  |

Add new servers here. The Master assigns domains to clients in each Intent.

### Grind Hook — `.cursor/hooks/grind.ts`

Runs on save for `src/**` and `tests/**`. Re-runs lint and tests; if failures persist for 5 iterations, escalates to the Master with an `ESCALATE` payload. Validation runs used subagent self-correction; the grind hook is available for automation.

### Worktree Spawner — `scripts/wt-spawn.sh`

Creates isolated git worktrees for parallel Emissary sessions:

```bash
./scripts/wt-spawn.sh <task-name> <branch>
```

Open each worktree in a new Cursor window. The Master in the main repo reviews PRs from each worktree and merges back.

## Quick Start

1. Use this repo as a template or clone and open in Cursor.
2. Ensure Claude 4.6 Opus and Gemini 2.5 Flash are available in Cursor.
3. The `.cursor/rules/` files configure agent behavior automatically.
4. Follow the workflow in `High-level plan/high-level plan.md` (Plan → Implement → Review).
5. For parallel tasks: `./scripts/wt-spawn.sh <task-name> <branch>`, then open each worktree in a new Cursor window.
6. For security-audit MCP: set `SNYK_TOKEN` in your environment.

## Key Concepts

- **2% Connectivity Constraint:** Only ~2% of total context crosses the corpus callosum. Never dump the full codebase into a hand-off.
- **Clarification Threshold:** Emissary self-corrects for up to 5 iterations, then escalates.
- **JSON Handshake:** Structured hand-off with intent, constraints, target files, and acceptance criteria.
- **Spiral Formulation:** Right (plan) → Left (implement) → Right (review).

## v2 Capabilities

- **Global Workspace (State Object):** Agents read/write `.cursor/plans/workspace_state.json` instead of passing full conversation history.
- **Active Inference / Predictive Processing:** Emissary predicts outcomes before acting. Low surprise → autonomous; high surprise → Master re-evaluation.
- **STDIO Security Layer:** All MCP tools run as local stdio child processes. Tool schemas isolated from Master.
- **Parallel Worktree Execution:** `wt-spawn.sh` for isolated worktrees; Master reviews and merges.

## Validation Results

Two test runs validated the bicameral architecture:

| Test                 | Path      | Cost Savings | Key Behaviors                                                        |
|----------------------|-----------|--------------|----------------------------------------------------------------------|
| 01-string-utils      | APPROVE   | ~75% (v2)    | TDD, file boundary, 2% signaling, predictive processing, data compression |
| 02-boundary-violation| ESCALATE  | ~84% (v2)    | Constraint vs criterion conflict detected; immediate escalation; partial work preserved |

See `test-runs/*/ANALYSIS.md` for full analysis and v1 vs v2 three-axis comparison (functionality, efficiency, cost).

## Requirements

See `package.json` for Node.js dependencies. The project uses TypeScript, Vitest, and ESLint. Run `npm install` after cloning.
