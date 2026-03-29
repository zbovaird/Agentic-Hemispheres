# Project Map (Layer 1)

High-level directory structure with purpose annotations. Read this before exploring the codebase.

```
.
├── .cursor/
│   ├── agents/                  # Subagent definitions (implementer, verifier)
│   │   ├── implementer.md       # TDD implementation subagent (Flash/Sonnet)
│   │   └── verifier.md          # Readonly validation subagent (Fast)
│   ├── hooks/
│   │   └── grind.ts             # Inhibitory feedback loop (onSave: lint + test)
│   ├── models.json              # Model assignments (edit to swap Master/Emissary)
│   ├── mcp.json                 # MCP server config (local stdio only)
│   ├── plans/
│   │   ├── workspace_state.json # Global Workspace shared state
│   │   ├── action_journal.jsonl # Action journal (pruned after intent completion)
│   │   └── gestalt_*.md         # Architectural plans per intent
│   └── rules/
│       ├── 01_master_rh.mdc     # Master -- planning, orchestration, review
│       ├── 02_emissary_lh.mdc   # Emissary -- TDD, implementation
│       ├── 03_callosum.mdc      # Corpus Callosum -- signaling protocol, state schema
│       ├── 04_security.mdc      # STDIO mandate, tool schema isolation
│       ├── 05_model_routing.mdc # Tri-model tiering (Opus/Sonnet/Flash)
│       └── 06_ai_navigation.mdc # Summary-first file access policy
├── docs/
│   ├── MAP.md                   # This file (Layer 1 navigation)
│   └── summaries/               # Layer 3 summary sidecars per source file
├── scripts/
│   ├── wt-spawn.sh              # Create git worktrees for parallel Emissaries
│   ├── wt-guard.sh              # Baseline tagging + rollback for worktrees
│   ├── telemetry.sh             # MVP telemetry: test/lint/state metrics
│   └── prune-context.sh         # Prune action journal after intent completion
├── metrics/                     # Agentic metrics framework
│   ├── types.ts                 # IterationRecord, DerivedMetrics, GuardFlag types
│   ├── config.ts                # Centralized tunable thresholds
│   ├── store.ts                 # JSONL append/read/query
│   ├── collect.ts               # Raw signal collection (git, tests, workspace)
│   ├── compute.ts               # ALL derived metric formulas (single module)
│   ├── guards.ts                # Threshold-based flags and control signals
│   ├── record.ts                # CLI entry point (called by telemetry.sh)
│   ├── index.ts                 # Barrel export
│   └── __tests__/               # Formula and guard tests
├── src/                         # Application source code (your project goes here)
├── tests/                       # Test files (mirrors src/ structure)
├── telemetry.html               # Agent performance dashboard (serve locally)
├── .cursorrules                 # Template guidance for Cursor
├── package.json                 # Node.js dependencies
├── tsconfig.json                # TypeScript config
└── vitest.config.ts             # Test runner config
```

## Key Relationships

- **models.json** is the single source of truth for which models fill which roles.
- **Master** reads `05_model_routing.mdc` + `models.json` to decide which model the implementer uses.
- **Implementer** reads the handshake from `plans/` and writes proof back to Master.
- **Verifier** reads the proof + handshake, runs tests, checks `docs/summaries/` for debt.
- **workspace_state.json** is the shared blackboard -- both agents read/write it.
- **action_journal.jsonl** accumulates observations during an intent; pruned after completion.
- **metrics/** computes derived signals (convergence, drift, churn, stability) from external data. Guards emit flags the Master reads for self-correction.
- **metrics.jsonl** stores per-iteration scored records; the dashboard reads it alongside telemetry.jsonl.
