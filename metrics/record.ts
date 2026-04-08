#!/usr/bin/env node
/**
 * CLI entry point for recording a metrics iteration.
 * Called by telemetry.sh or directly:
 *   npx tsx metrics/record.ts --run=<id> --goal=<id> [--cost=<usd>]
 *
 * Reads workspace state, git diff, test results, and models.json.
 * Computes derived metrics, evaluates guards, appends to metrics.jsonl.
 * Prints a one-line scorecard to stdout.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { computeAll } from "./compute.js";
import { evaluate } from "./guards.js";
import { appendRecord, queryByRun } from "./store.js";
import {
  classifyFiles,
  readModelsConfig,
  readWorkspaceState,
  readWorkspaceHarnessSignals,
  getRepeatedEdits,
} from "./collect.js";
import type { IterationRecord, ScoredIteration } from "./types.js";

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function readTargetFilesFromGestalt(dir: string = ".cursor/plans"): string[] {
  try {
    if (!existsSync(dir)) return [];
    const files = readdirSync(dir)
      .filter((f) => f.startsWith("gestalt_") && f.endsWith(".md"))
      .sort()
      .reverse();

    for (const file of files) {
      const content = readFileSync(`${dir}/${file}`, "utf-8");
      const match = content.match(/"target_files"\s*:\s*\[([\s\S]*?)\]/);
      if (match) {
        const items = match[1].match(/"([^"]+)"/g);
        if (items) return items.map((s) => s.replace(/"/g, ""));
      }
    }
  } catch { /* empty */ }
  return [];
}

function main() {
  const args = parseArgs();
  const runId = args.run || `run-${Date.now()}`;
  const goalId = args.goal || "unknown";
  const cost = args.cost ? parseFloat(args.cost) : null;
  const actor = (args.actor as IterationRecord["actor_type"]) || "implementer";

  const ws = readWorkspaceState() || {};
  const harness = readWorkspaceHarnessSignals(ws as Record<string, unknown>);
  const models = readModelsConfig();

  let planned: string[] =
    (ws as Record<string, unknown>)["target_files"] as string[] ||
    ((ws as Record<string, unknown>)["planned_target_files"] as string[]) || [];

  // Fallback: scan .cursor/plans/ for the latest gestalt plan with target_files
  if (planned.length === 0) {
    planned = readTargetFilesFromGestalt();
  }

  let touched: string[] = [];
  try {
    touched = execSync("git diff --name-only HEAD", { encoding: "utf-8", timeout: 5000 })
      .trim().split("\n").filter(Boolean);
  } catch { /* empty */ }
  if (touched.length === 0) {
    try {
      touched = execSync("git diff --cached --name-only", { encoding: "utf-8", timeout: 5000 })
        .trim().split("\n").filter(Boolean);
    } catch { /* empty */ }
  }

  const { inScope, outOfScope } = classifyFiles(touched, planned);

  let testsPassed = 0;
  let testsFailed = 0;
  let lintPassed = true;
  let typecheckPassed = true;

  try {
    const testOut = execSync("npx vitest run --reporter=json 2>/dev/null", { encoding: "utf-8", timeout: 60000 });
    const pm = testOut.match(/"numPassedTests"\s*:\s*(\d+)/);
    const fm = testOut.match(/"numFailedTests"\s*:\s*(\d+)/);
    testsPassed = pm ? parseInt(pm[1], 10) : 0;
    testsFailed = fm ? parseInt(fm[1], 10) : 0;
  } catch { /* empty */ }

  try {
    execSync("npx eslint src/ --quiet 2>/dev/null", { timeout: 30000 });
  } catch { lintPassed = false; }

  try {
    execSync("npx tsc --noEmit --skipLibCheck 2>/dev/null", { timeout: 30000 });
  } catch { typecheckPassed = false; }

  const predLog = (ws as Record<string, unknown>)["prediction_log"];
  const iterations = Array.isArray(predLog) ? predLog.length : 0;

  const signal = ((ws as Record<string, unknown>)["master_signal"] as Record<string, string>)?.signal || null;

  const pendingCount = harness.summary_debt_pending_count;
  const debtLogCount = harness.summary_debt_log_count;

  const rawCriteria = (ws as Record<string, unknown>)["acceptance_criteria"];
  let acceptTotal = 0;
  let acceptCompleted = 0;

  if (Array.isArray(rawCriteria)) {
    acceptTotal = rawCriteria.length;
    if (rawCriteria.length > 0 && typeof rawCriteria[0] === "object" && rawCriteria[0] !== null) {
      // Structured format: { description, completed }
      acceptCompleted = rawCriteria.filter(
        (c: Record<string, unknown>) => c.completed === true
      ).length;
    } else {
      // Legacy string array format -- assume all complete if present
      acceptCompleted = acceptTotal;
    }
  }

  const prevIterations = queryByRun(runId).map((s) => s.record);
  const repeatedEdits = getRepeatedEdits(touched, prevIterations);

  const now = new Date().toISOString();
  const record: IterationRecord = {
    run_id: runId,
    iteration_id: `${runId}-${prevIterations.length + 1}`,
    parent_iteration_id: prevIterations.length > 0 ? prevIterations[prevIterations.length - 1].iteration_id : null,
    timestamp_start: now,
    timestamp_end: now,
    active_goal_id: goalId,
    active_subgoal_id: null,
    actor_type: actor,
    planned_target_files: planned,
    touched_files: touched,
    out_of_scope_files: outOfScope,
    acceptance_criteria_total: acceptTotal,
    acceptance_criteria_completed: acceptCompleted,
    tests_passed: testsPassed,
    tests_failed: testsFailed,
    lint_passed: lintPassed,
    typecheck_passed: typecheckPassed,
    regression_count: 0,
    reverted_change_count: 0,
    repeated_edit_count: repeatedEdits.reduce((s, r) => s + r.editCount - 1, 0),
    rollback_triggered: false,
    summary_version: 1,
    summary_age_iterations: prevIterations.length,
    summary_refresh_performed: false,
    stale_reference_count: 0,
    token_input: null,
    token_output: null,
    estimated_cost: cost,
    tool_call_count: 0,
    elapsed_seconds: 0,
    escalation_triggered: signal === "ESCALATE" || signal === "ACKNOWLEDGE_ESCALATION",
    escalation_reason: signal === "ESCALATE" ? "Agent escalated" : null,
    signal: signal as IterationRecord["signal"],
    model_config: models,
    notes:
      pendingCount > 0 || debtLogCount > 0
        ? `summary_debt_pending:${pendingCount};summary_debt_log:${debtLogCount}`
        : null,
  };

  const derived = computeAll(record, prevIterations);
  const guardResult = evaluate(derived);

  const scored: ScoredIteration = {
    record,
    derived,
    flags: guardResult.flags,
  };

  appendRecord(scored);

  const flagStr = guardResult.flags.length > 0
    ? ` FLAGS: ${guardResult.flags.map(f => `[${f.severity}] ${f.id}`).join(", ")}`
    : "";

  console.log(
    `[metrics] convergence=${derived.convergence_score.toFixed(0)} ` +
    `drift=${(derived.drift_score * 100).toFixed(0)}% ` +
    `churn=${(derived.churn_ratio * 100).toFixed(0)}% ` +
    `stability=${derived.stability_score.toFixed(0)} ` +
    `action=${guardResult.recommended_action}${flagStr}`
  );
}

main();
