# Agentic Hemispheres

A bi-hemispheric AI orchestration framework for Cursor, modeled after Iain McGilchrist's Master-Emissary paradigm. Use this repo as a template to run a high-reasoning "Master" model for strategy and a task-focused "Emissary" model for execution—with structured handoffs that reduce token cost and context pollution.

## Overview

This project implements a dual-agent architecture that pairs:

- **Master (RH):** High-reasoning model (default: Claude 4.6 Opus) — holistic planning, code review, architectural oversight  
- **Emissary (LH):** Fast task-focused model (default: Gemini 3 Flash) — rapid implementation, TDD, sequential task execution  
- **Corpus Callosum:** A 2% selective signaling protocol that limits inter-agent communication to high-signal metadata

Model assignments are configured in `.cursor/models.json`. To swap models, edit that file or tell the Master which models to use.

Validated results: ~75–84% cost reduction vs monolithic Opus, with fewer scope-creep and constraint-violation errors.

## Repository Structure

```
├── .cursor/
│   ├── agents/                                    # Subagent definitions (2.0)
│   │   ├── implementer.md                        # TDD implementation subagent (Flash/Sonnet)
│   │   └── verifier.md                           # Readonly validation subagent (Fast)
│   ├── rules/
│   │   ├── 01_master_rh.mdc                     # Master agent rules + orchestration protocol
│   │   ├── 02_emissary_lh.mdc                   # Emissary agent rules
│   │   ├── 03_callosum.mdc                      # Communication protocol + Global Workspace
│   │   ├── 04_security.mdc                      # STDIO/MCP security governance
│   │   ├── 05_model_routing.mdc                 # Tri-model tiering (Opus/Sonnet/Flash)
│   │   └── 06_ai_navigation.mdc                 # Summary-first file access policy
│   ├── models.json                                # Model assignments (edit to swap Master/Emissary)
│   ├── mcp.json                                  # MCP server configuration (local stdio)
│   ├── hooks/
│   │   └── grind.ts                              # Inhibitory feedback loop
│   └── plans/                                    # Gestalt plans, workspace state, action journal
├── docs/
│   ├── MAP.md                                    # Layer 1 navigation map
│   └── summaries/                                # Layer 3 summary sidecars per source file
├── scripts/
│   ├── wt-spawn.sh                               # Create git worktrees for parallel Emissaries
│   ├── wt-guard.sh                               # Baseline tagging + rollback for worktrees
│   ├── telemetry.sh                              # MVP telemetry: test/lint/state metrics
│   └── prune-context.sh                          # Prune action journal after intent completion
├── metrics/                                      # Agentic metrics framework (convergence, drift, churn)
│   ├── compute.ts                                # All derived metric formulas
│   ├── guards.ts                                 # Threshold-based flags and control signals
│   ├── config.ts                                 # Tunable thresholds
│   └── __tests__/                                # Formula and guard tests
├── telemetry.html                                 # Agent performance dashboard (serve locally)
├── .cursorrules                                  # Cursor template guidance
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

### Model Routing — `05_model_routing.mdc`

Defines when to use each model tier. The Master reads this before dispatching subagents:

- **Opus:** Planning, final review, decision gates (Master only — not a subagent).
- **Sonnet:** High-surprise retries, ESCALATE re-analysis, cross-cutting refactors (>5 target files).
- **Flash:** Standard implementation, TDD, verification, boilerplate (default for implementer and verifier).

### AI Navigation — `06_ai_navigation.mdc`

Summary-first file access to reduce the "exploration tax":

- **Layer 1 (Map):** Read `docs/MAP.md` first for directory orientation.
- **Layer 2 (READMEs):** Check for README or summary sidecar before opening files >300 lines.
- **Layer 3 (Sidecars):** `docs/summaries/<filename>.summary.md` — maintained by the verifier. Stale summaries are "summary debt" that blocks APPROVE.

### Subagents — `.cursor/agents/`

Two subagents defined as Markdown with YAML frontmatter (per Cursor docs):

- **`implementer.md`** — TDD implementation (Flash or Sonnet). Returns proof/ESCALATE/SURPRISE to Master.
- **`verifier.md`** — Readonly validation (Fast). Runs tests, checks summary debt, reports pass/fail.

Subagents do not nest. The Master dispatches both sequentially: Implementer first, then Verifier.

### Grind Hook — `.cursor/hooks/grind.ts`

Runs on save for `src/**` and `tests/**`. Re-runs lint and tests; if failures persist for 5 iterations, escalates to the Master with an `ESCALATE` payload. Validation runs used subagent self-correction; the grind hook is available for automation.

### Worktree Spawner — `scripts/wt-spawn.sh`

Creates isolated git worktrees for parallel Emissary sessions:

```bash
./scripts/wt-spawn.sh <task-name> <branch>
```

Open each worktree in a new Cursor window. The Master in the main repo reviews PRs from each worktree and merges back.

### Worktree Guard — `scripts/wt-guard.sh`

Creates baseline tags for worktrees and supports rollback:

```bash
./scripts/wt-guard.sh <worktree-path> tag       # Create baseline
./scripts/wt-guard.sh <worktree-path> rollback   # Reset to baseline
```

### Telemetry — `scripts/telemetry.sh`

Collects agent performance metrics and appends to `.cursor/plans/telemetry.jsonl`:

```bash
./scripts/telemetry.sh <intent_id>            # auto-collect metrics (cost = null)
./scripts/telemetry.sh <intent_id> 0.045      # include actual cost from Cursor usage panel
```

Each entry captures: model config (master/implementer/verifier), test results, lint status, signal type (APPROVE/SUPPRESS/ESCALATE/SURPRISE), iteration count, prediction accuracy (low vs high surprise), callosal bytes (workspace state size), summary debt count, and optional cost.

### Telemetry Dashboard — `telemetry.html`

A real-time 8-panel dashboard for monitoring agent performance, detecting drift, and comparing model combinations.

**Panels:**

1. **Intent Timeline** — colored nodes per signal type; click to filter
2. **Signal Distribution** — doughnut chart of APPROVE/SUPPRESS/ESCALATE/SURPRISE ratios
3. **Test Pass/Fail** — bar chart over time
4. **Drift Detection** — composite health score (0-100) from iteration trend, surprise rate, suppress frequency
5. **Cost Per Intent** — bar chart with running average (manual cost entry via telemetry.sh)
6. **Convergence & Stability** — per-iteration metric bars (convergence, progress, stability, efficiency, drift, churn) from `metrics.jsonl`
7. **Guard Flags** — active warnings and critical flags with severity badges
8. **Summary Debt** — live list of stale/missing summaries from workspace state
9. **Workspace State** — live card showing current intent, phase, model tier, signal, verifier verdict

**Model Comparison Mode:** Select "All" in the Model Combo filter to see an aggregate table and radar chart comparing each Master+Emissary pairing across cost, speed, quality, accuracy, and efficiency.

**To use:**

```bash
npx serve . -l 3000
# Open http://localhost:3000/telemetry.html
```

The dashboard auto-refreshes every 5 seconds. Use the Pause button to freeze. Supports dark and light mode.

### Context Pruner — `scripts/prune-context.sh`

After the verifier exits and the Master issues a final signal, summarizes the action journal and truncates the raw log to keep the global workspace under budget:

```bash
./scripts/prune-context.sh
```

## Quick Start

1. **Use this template** — Click "Use this template" on GitHub, or clone and open in Cursor.
2. **Run `npm install`** to set up dependencies.
3. **Check `.cursor/models.json`** — Confirm the listed models are enabled in your Cursor settings (Settings > Models). Edit if you want different models.
4. **The rules are already configured** — `.cursor/rules/` files load automatically when you open the project. No copy-pasting needed.

## How to Use It

You work with the **Master** (your high-reasoning model) as your primary agent. When it's time to implement, the Master spawns the **Emissary** (your fast model) as a subagent. The Emissary runs autonomously, does the work, and returns its proof. The Master then reviews. You don't manually switch between modes — the handoff happens automatically via the structured protocol. Active models are defined in `.cursor/models.json`.

### Phase 1: Master Plans

With your Master model selected in Cursor, describe what you want to build:

> Create an architectural plan for [YOUR FEATURE]. Output the plan to `.cursor/plans/gestalt_01.md` with target files, acceptance criteria, and constraints.

The Master researches the codebase, produces a gestalt plan, and generates a JSON handshake for the Emissary.

### Phase 2: Emissary Implements (Subagent)

The Master dispatches the Emissary as a **subagent** (using the model from `models.json` → `implementer`). The subagent receives only the JSON handshake (~2% of context) and executes autonomously — strict TDD, file boundaries, no scope creep. When done, it returns an `implementation_proof` or an `ESCALATE`/`SURPRISE` signal back to the Master.

You can trigger this by asking the Master:

> Dispatch the Emissary to implement the plan in @gestalt_01.md. The Emissary should only touch the files in `target_files`, write tests first, then implement. It should return an implementation proof when done.

### Phase 3: Verifier Validates (Subagent)

The Master dispatches the `/verifier` subagent (always Fast, readonly) with the implementer's proof. The verifier independently runs tests, checks file boundaries, and reports summary debt. It returns a structured verdict to the Master.

### Phase 4: Master Reviews

The Master reviews both the implementer's proof and the verifier's report:

- Tests pass? Diff within boundary? No undeclared dependencies? Summary debt cleared?
- If aligned: `APPROVE` with follow-up tasks.
- If drift detected: `SUPPRESS` with rollback instructions.
- If summary debt: require the implementer to update summaries before APPROVE.

### Phase 5: Repeat

Continue the Right → Left → Right spiral. The Global Workspace at `.cursor/plans/workspace_state.json` carries state between cycles.

### Parallel Tasks

```bash
./scripts/wt-spawn.sh <task-name> <branch>
```

Open each worktree in a new Cursor window with its own Emissary subagent. The Master in the main repo reviews PRs from each worktree and merges back.

### Security Audit MCP

Set `SNYK_TOKEN` in your environment to enable the `security-audit` MCP server.

## Changing Models

All model assignments live in a single file: **`.cursor/models.json`**. No other files need editing.

### Quick swap

Tell the Master:

> "Use Gemini 3 Flash as the emissary" or "Switch the master to DeepSeek-R1"

The Master will update `.cursor/models.json` for you. Or edit it directly:

```json
{
  "master":      { "name": "Claude 4.6 Opus",   "tier": "high-reasoning" },
  "implementer": { "name": "Gemini 3 Flash",    "tier": "fast" },
  "verifier":    { "name": "Gemini 3 Flash",    "tier": "fast" },
  "mid_tier":    { "name": "Claude Sonnet 4.6",  "tier": "balanced" }
}
```

After changing `models.json`, make sure the model is enabled in your Cursor settings (Settings > Models).

### Role guide

| Role | Prioritize | Good choices | Avoid |
|------|-----------|--------------|-------|
| Master | Deep reasoning, large context, architectural judgment | Claude Opus, DeepSeek-R1, Gemini 3 Pro, GPT-4o | Models that are fast but shallow |
| Implementer | Speed, low cost, strong tool-use, code generation | Gemini Flash (any), Composer 2 Fast, Claude Sonnet, Codestral | Models that are slow or expensive per token |
| Verifier | Speed, readonly analysis | Same as implementer (always runs on fast tier) | Expensive models (verifier is high-volume) |
| Mid-tier | Balanced reasoning + speed | Claude Sonnet, Gemini Pro | Only used for high-surprise escalations |

The cost savings scale with the price gap between your Master and Implementer models. The wider the gap, the more you save.

### Comparing model combos

Run the same tasks with different `models.json` configurations. Each telemetry entry records the active `model_config`. The dashboard (`telemetry.html`) groups entries by combo and shows side-by-side quality, speed, and cost metrics automatically.

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

## 2.0 Capabilities

- **Tri-Model Tiering:** Opus for planning/review, Sonnet for high-surprise/cross-cutting work, Flash for standard implementation and verification. Routing criteria defined in `05_model_routing.mdc`.
- **Subagent Architecture:** Implementer and Verifier as `.cursor/agents/*.md` with YAML frontmatter. Master orchestrates both sequentially (no nesting).
- **Summary-First Navigation:** Layered file access (Map → README → Sidecar) to reduce exploration tax. Summary debt tracked by verifier.
- **Worktree Guard:** Baseline tagging and rollback via `wt-guard.sh`.
- **Agent Telemetry:** Rich metrics (model config, signals, predictions, drift, cost) logged to `telemetry.jsonl`.
- **Metrics Framework:** Per-iteration derived metrics (convergence, drift, churn, stability, efficiency, escalation) with configurable thresholds and guard flags for self-correction. All formulas centralized in `metrics/compute.ts`.
- **Performance Dashboard:** `telemetry.html` — 9-panel real-time dashboard with convergence bars, guard flags, drift detection, model comparison mode (radar + table), and dark/light theme.
- **Context Pruner:** Action journal summarized and truncated after intent completion to stay under token budget.

## Validation Results

The bicameral architecture was validated with two test scenarios during development:

| Scenario             | Signal Path | Cost Savings | Key Behaviors |
|----------------------|-------------|--------------|---------------|
| String utilities     | APPROVE     | ~75%         | TDD, file boundary, 2% signaling, predictive processing, data compression |
| Boundary violation   | ESCALATE    | ~84%         | Constraint vs criterion conflict detected; immediate escalation; partial work preserved |

Cost savings are measured against a monolithic single-model (Opus-only) baseline. Savings scale with the price gap between your Master and Implementer models.

## Requirements

See `package.json` for Node.js dependencies. The project uses TypeScript, Vitest, and ESLint. Run `npm install` after cloning.
