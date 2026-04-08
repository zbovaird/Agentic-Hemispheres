/**
 * Raw signal collection helpers.
 * Gathers observable data from git, test output, and workspace state.
 * These are the trustworthy external signals -- not self-reported confidence.
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";
import type { IterationRecord } from "./types.js";

export function getGitDiffFiles(since?: string): string[] {
  try {
    const ref = since || "HEAD~1";
    const output = execSync(`git diff --name-only ${ref}`, {
      encoding: "utf-8",
      timeout: 10000,
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function getGitStagedFiles(): string[] {
  try {
    const output = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
      timeout: 10000,
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function classifyFiles(
  touched: string[],
  planned: string[]
): { inScope: string[]; outOfScope: string[] } {
  const plannedSet = new Set(planned);
  const inScope = touched.filter((f) => plannedSet.has(f));
  const outOfScope = touched.filter((f) => !plannedSet.has(f));
  return { inScope, outOfScope };
}

export function getRepeatedEdits(
  touchedFiles: string[],
  previousIterations: IterationRecord[]
): { file: string; editCount: number }[] {
  const editCounts = new Map<string, number>();

  for (const prev of previousIterations) {
    for (const f of prev.touched_files) {
      editCounts.set(f, (editCounts.get(f) || 0) + 1);
    }
  }
  for (const f of touchedFiles) {
    editCounts.set(f, (editCounts.get(f) || 0) + 1);
  }

  return Array.from(editCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([file, editCount]) => ({ file, editCount }))
    .sort((a, b) => b.editCount - a.editCount);
}

export function readWorkspaceState(
  path: string = ".cursor/plans/workspace_state.json"
): Record<string, unknown> | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

/** Summary debt and workflow fields from workspace state (for metrics / telemetry). */
export interface WorkspaceHarnessSignals {
  summary_debt_pending_count: number;
  summary_debt_log_count: number;
  clarification_threshold: number;
}

export function readWorkspaceHarnessSignals(
  ws: Record<string, unknown> | null
): WorkspaceHarnessSignals {
  if (!ws) {
    return {
      summary_debt_pending_count: 0,
      summary_debt_log_count: 0,
      clarification_threshold: 5,
    };
  }
  const pending = ws["summary_debt_pending"];
  const log = ws["summary_debt_log"];
  const wp = ws["workflow_policy"] as Record<string, unknown> | undefined;
  const th = wp?.["clarification_threshold"];
  return {
    summary_debt_pending_count: Array.isArray(pending) ? pending.length : 0,
    summary_debt_log_count: Array.isArray(log) ? log.length : 0,
    clarification_threshold:
      typeof th === "number" && th > 0 ? th : 5,
  };
}

export function readModelsConfig(
  path: string = ".cursor/models.json"
): IterationRecord["model_config"] {
  try {
    if (!existsSync(path)) {
      return { master: "unknown", implementer: "unknown", verifier: "unknown" };
    }
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return {
      master: data.master?.name || "unknown",
      implementer: data.implementer?.name || "unknown",
      verifier: data.verifier?.name || "unknown",
    };
  } catch {
    return { master: "unknown", implementer: "unknown", verifier: "unknown" };
  }
}

export function getSummaryAge(
  filePath: string,
  summaryDir: string = "docs/summaries"
): { exists: boolean; ageMs: number } {
  const basename = filePath.split("/").pop() || filePath;
  const summaryPath = `${summaryDir}/${basename}.summary.md`;

  if (!existsSync(summaryPath)) {
    return { exists: false, ageMs: Infinity };
  }

  const stat = statSync(summaryPath);
  return { exists: true, ageMs: Date.now() - stat.mtimeMs };
}

export function parseVitestJson(output: string): {
  passed: number;
  failed: number;
} {
  try {
    const passMatch = output.match(/"numPassedTests"\s*:\s*(\d+)/);
    const failMatch = output.match(/"numFailedTests"\s*:\s*(\d+)/);
    return {
      passed: passMatch ? parseInt(passMatch[1], 10) : 0,
      failed: failMatch ? parseInt(failMatch[1], 10) : 0,
    };
  } catch {
    return { passed: 0, failed: 0 };
  }
}

export function getWorkspaceStateSize(
  path: string = ".cursor/plans/workspace_state.json"
): number {
  try {
    if (!existsSync(path)) return 0;
    return statSync(path).size;
  } catch {
    return 0;
  }
}
