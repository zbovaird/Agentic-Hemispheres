# Cursor 3 and this template

This template assumes a **bicameral** loop: Master (main chat) plans and reviews; **implementer** and **verifier** subagents run as **sequential** tools invocations, not nested. Cursor 3 adds product features that align with parallel work and isolation—use them without violating “subagents do not nest.”

## Agents Window

Open **Agents Window** from the command palette (`Cmd+Shift+P` → “Agents Window”). Use it when you want **multiple agent sessions** (e.g. one per workstream or repo) while keeping the Master’s review model: the high-reasoning model in the **main** workspace still owns architecture and merge decisions.

## Git worktrees (`/worktree`)

Use **`/worktree`** to create an isolated branch/worktree for risky or parallel implementation. Typical pattern:

1. Master stays in the **primary** clone for planning and final review.
2. An Emissary-heavy session runs in the worktree for implementation.
3. Merge back via PR or explicit merge after the Master approves.

This matches `.cursor/rules/04_security.mdc` worktree guidance: isolated MCP and clear review boundary.

## Best-of-n (`/best-of-n`)

**`/best-of-n`** runs the same task across models in separate worktrees and compares results. Use it for **exploration**, not as a substitute for the **verifier** subagent. After picking a winner, still run your normal **implementation_proof** + **verifier** cycle if the change must satisfy acceptance criteria in `workspace_state.json`.

## Await

**Await** lets an agent wait for background shell or subagent completion. Use it when tests or builds are long-running so the main loop does not busy-wait. The **verifier** subagent remains the dedicated readonly check for acceptance criteria and summary debt unless you explicitly fold those checks into a scripted gate.

## Subagents and `models.json`

Custom agents live under [`.cursor/agents/`](../.cursor/agents/). Their `model:` field (e.g. `fast`) should match your intent in [`.cursor/models.json`](../.cursor/models.json) for implementer/verifier. If you change tier routing in `05_model_routing.mdc`, keep **implementer** subagent settings consistent.

## Official hooks

Post-edit validation is wired via [`.cursor/hooks.json`](../.cursor/hooks.json) and [`scripts/cursor-after-file-edit.mjs`](../scripts/cursor-after-file-edit.mjs). Prefer this over ad-hoc automation for the grind loop.
