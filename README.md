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

### MCP Servers — `.cursor/mcp.json`

MCP (Model Context Protocol) servers give the Emissary access to tools (file ops, databases, APIs). Each server is an npm package that Cursor spawns as a **local child process** via stdio. Tools are bundled per server — you add servers, not individual tools.

**Included servers:**

| Server           | Package                                   | Purpose          | Notes                           |
|------------------|-------------------------------------------|------------------|---------------------------------|
| `local-filesystem` | `@modelcontextprotocol/server-filesystem` | File operations  | Scoped to `${workspaceFolder}` |
| `security-audit`   | `@modelcontextprotocol/server-snyk`      | Vulnerability scan | Requires `SNYK_TOKEN` env var  |

**Adding a new server:** Edit `.cursor/mcp.json` and add an entry under `mcpServers`:

```json
"server-name": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres"],
  "type": "stdio",
  "env": { "DATABASE_URL": "${env:DATABASE_URL}" }
}
```

Browse packages on npm (`@modelcontextprotocol/server-*`) or the [MCP registry](https://github.com/modelcontextprotocol/servers). The Master assigns domains to servers in each Intent; the Emissary uses the specified server for that domain.

**Security:** All servers run over stdio (local processes only — no network exposure). **Cross-server isolation** prevents data from one server from leaking into another; the Emissary does not cross-pollinate outputs between `stdio` server instances. **Tool schema isolation** keeps the Master from seeing raw tool schemas (prevents "Shadow Poisoning" of its holistic context); only the Emissary interacts with tool interfaces and summarizes results.

### Grind Hook — `.cursor/hooks/grind.ts`

Runs on save for `src/**` and `tests/**`. Re-runs lint and tests; if failures persist for 5 iterations, escalates to the Master with an `ESCALATE` payload. Validation runs used subagent self-correction; the grind hook is available for automation.

### Worktree Spawner — `scripts/wt-spawn.sh`

Creates isolated git worktrees for parallel Emissary sessions:

```bash
./scripts/wt-spawn.sh <task-name> <branch>
```

Open each worktree in a new Cursor window. The Master in the main repo reviews PRs from each worktree and merges back.

## Quick Start

1. **Use this template** — Click "Use this template" on GitHub, or clone and open in Cursor.
2. **Run `npm install`** to set up dependencies.
3. **Enable your models** — In Cursor settings, make sure Claude 4.6 Opus and Gemini 2.5 Flash (or your preferred models) are enabled.
4. **The rules are already configured** — `.cursor/rules/` files load automatically when you open the project. No copy-pasting needed.

## How to Use It

The template configures Plan Mode as the Master (Opus) and Agent Mode as the Emissary (Flash). The rules load automatically—when you open Plan Mode, the Master governs; when you open Agent Mode, the Emissary executes. The handoff flows via the structured protocol (gestalt → handshake → proof). Cursor requires selecting the mode for each phase; the workspace ensures the correct agent and model apply in that mode.

### Phase 1: Master Plans

In **Plan Mode** (Shift+Tab), with **Claude 4.6 Opus** selected, describe what you want:

> Create an architectural plan for [YOUR FEATURE]. Output the plan to `.cursor/plans/gestalt_01.md` with target files, acceptance criteria, and constraints.

The Master researches the codebase, produces a plan, and generates a JSON handshake for the Emissary.

### Phase 2: Emissary Implements

In **Agent Mode** (Cmd+I / Ctrl+I), with **Gemini 2.5 Flash** selected, hand it the plan:

> Follow the plan in @gestalt_01.md. Only touch the files in `target_files`. Write tests first, then implement. Return an implementation proof when done.

The Emissary executes with strict TDD, file boundaries, and no scope creep.

### Phase 3: Master Reviews

Back in **Plan Mode** with **Claude 4.6 Opus**:

> Review the Emissary's implementation proof. If aligned, APPROVE. If drift detected, SUPPRESS with reason.

### Phase 4: Repeat

Continue the Right → Left → Right spiral. See `High-level plan/high-level plan.md` for the full workflow, signal types, and economics.

### Parallel Tasks

```bash
./scripts/wt-spawn.sh <task-name> <branch>
```

Open each worktree in a new Cursor window with its own Emissary. Master reviews and merges from the main repo.

### Security Audit MCP

Set `SNYK_TOKEN` in your environment to enable the `security-audit` MCP server.

## Changing Models

The template defaults to Claude 4.6 Opus (Master) and Gemini 2.5 Flash (Emissary), but you can swap in any models that fit the roles.

### Master (Right Hemisphere) — high-reasoning model

Best for: architectural planning, code review, contradiction detection, strategy.

To change:
1. Open `.cursor/rules/01_master_rh.mdc` and update the header (e.g., `Claude 4.6 Opus` → `DeepSeek-R1`).
2. In Cursor, select your preferred model when in **Plan Mode**.

Good alternatives: Claude Opus (any version), DeepSeek-R1, Gemini 3 Pro, GPT-4o.

### Emissary (Left Hemisphere) — fast, task-focused model

Best for: implementation, TDD, sequential coding, tool calling.

To change:
1. Open `.cursor/rules/02_emissary_lh.mdc` and update the header (e.g., `Gemini 2.5 Flash` → `Gemini 3 Flash`).
2. In Cursor, select your preferred model when in **Agent Mode**.

Good alternatives: Gemini Flash (any version), Claude Sonnet, GPT-4o-mini, Codestral.

### What to look for when choosing

| Role | Prioritize | Avoid |
|------|-----------|-------|
| Master | Deep reasoning, large context window, architectural judgment | Models that are fast but shallow |
| Emissary | Speed, low cost, strong tool-use, code generation | Models that are slow or expensive per token |

The cost savings scale with the price gap between your Master and Emissary models. The wider the gap, the more you save.

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
