#!/usr/bin/env node
/**
 * Validates harness layout and workspace_state.json shape.
 * Usage: node scripts/verify-harness.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const REQUIRED_FILES = [
  ".cursor/rules/01_master_rh.mdc",
  ".cursor/rules/02_emissary_lh.mdc",
  ".cursor/rules/03_callosum.mdc",
  ".cursor/rules/04_security.mdc",
  ".cursor/rules/05_model_routing.mdc",
  ".cursor/rules/06_ai_navigation.mdc",
  ".cursor/agents/implementer.md",
  ".cursor/agents/verifier.md",
  ".cursor/models.json",
  ".cursor/mcp.json",
  ".cursor/hooks.json",
  "docs/MAP.md",
  "docs/summary-policy.md",
  "metrics/intent.ts",
  "schemas/workspace_state.schema.json",
  "schemas/handshake.schema.json",
];

function fail(msg) {
  console.error(`verify-harness: ${msg}`);
  process.exit(1);
}

function validateWorkspaceState(obj) {
  if (typeof obj !== "object" || obj === null) fail("workspace_state.json must be a JSON object");
  if (obj.schema_version !== "1.0") fail('workspace_state.json must have schema_version "1.0"');
  if (!Array.isArray(obj.target_files)) fail("workspace_state.json must have target_files array");
  if (!Array.isArray(obj.acceptance_criteria)) fail("workspace_state.json must have acceptance_criteria array");
  if (!Array.isArray(obj.summary_debt_pending)) fail("workspace_state.json must have summary_debt_pending array");
  if (!Array.isArray(obj.summary_debt_log)) fail("workspace_state.json must have summary_debt_log array");
  if (typeof obj.workflow_policy !== "object" || obj.workflow_policy === null) {
    fail("workspace_state.json must have workflow_policy object");
  }
}

function checkSubagentModels() {
  const modelsPath = join(ROOT, ".cursor/models.json");
  const implPath = join(ROOT, ".cursor/agents/implementer.md");
  const verPath = join(ROOT, ".cursor/agents/verifier.md");
  if (!existsSync(modelsPath) || !existsSync(implPath)) return;
  const models = JSON.parse(readFileSync(modelsPath, "utf-8"));
  const impl = readFileSync(implPath, "utf-8");
  const ver = readFileSync(verPath, "utf-8");
  const implTier = (impl.match(/^model:\s*(\S+)/m) || [])[1];
  const verTier = (ver.match(/^model:\s*(\S+)/m) || [])[1];
  const implName = models.implementer?.name || "";
  const verName = models.verifier?.name || "";
  if (implTier === "fast" && verTier === "fast" && implName && verName && implName !== verName) {
    console.warn(
      "verify-harness: warning — implementer.md and verifier.md both use model: fast but models.json names differ; ensure this is intentional."
    );
  }
}

for (const rel of REQUIRED_FILES) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) fail(`missing required file: ${rel}`);
}

const wsPath = join(ROOT, ".cursor/plans/workspace_state.json");
if (!existsSync(wsPath)) fail("missing .cursor/plans/workspace_state.json");

let ws;
try {
  ws = JSON.parse(readFileSync(wsPath, "utf-8"));
} catch {
  fail(".cursor/plans/workspace_state.json is not valid JSON");
}
validateWorkspaceState(ws);

checkSubagentModels();

console.log("verify-harness: OK");
