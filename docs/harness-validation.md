# Harness validation

Operational checks for the bicameral harness (not application tests).

## Commands

```bash
npm install
npm run verify:harness
npm test
```

## What `verify:harness` checks

- Core files exist under `.cursor/` (rules, agents, `models.json`, `mcp.json`, `hooks.json`).
- `docs/MAP.md` and `docs/summary-policy.md` exist.
- `metrics/intent.ts` and `schemas/workspace_state.schema.json` exist.
- `.cursor/plans/workspace_state.json` parses and includes required keys, including `schema_version`.

CI runs `npm test` and `npm run verify:harness` on pull requests (see `.github/workflows/harness.yml`).
