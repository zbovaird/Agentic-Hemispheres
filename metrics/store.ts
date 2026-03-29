/**
 * JSONL-based metrics store.
 * Append iteration records, read them back, query by run/goal.
 * Designed for manual inspection -- one JSON object per line.
 */

import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { IterationRecord, ScoredIteration } from "./types.js";

const DEFAULT_PATH = ".cursor/plans/metrics.jsonl";

export function ensureDir(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function appendRecord(
  record: ScoredIteration,
  path: string = DEFAULT_PATH
): void {
  ensureDir(path);
  const line = JSON.stringify(record) + "\n";
  appendFileSync(path, line, "utf-8");
}

export function readAllRecords(
  path: string = DEFAULT_PATH
): ScoredIteration[] {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf-8");
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as ScoredIteration;
      } catch {
        return null;
      }
    })
    .filter((r): r is ScoredIteration => r !== null);
}

export function queryByRun(
  runId: string,
  path: string = DEFAULT_PATH
): ScoredIteration[] {
  return readAllRecords(path).filter((r) => r.record.run_id === runId);
}

export function queryByGoal(
  goalId: string,
  path: string = DEFAULT_PATH
): ScoredIteration[] {
  return readAllRecords(path).filter(
    (r) => r.record.active_goal_id === goalId
  );
}

export function getLatestIteration(
  runId: string,
  path: string = DEFAULT_PATH
): ScoredIteration | null {
  const records = queryByRun(runId, path);
  return records.length > 0 ? records[records.length - 1] : null;
}

export function clearStore(path: string = DEFAULT_PATH): void {
  ensureDir(path);
  writeFileSync(path, "", "utf-8");
}
