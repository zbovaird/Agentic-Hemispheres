/**
 * Workspace state writer for intent lifecycle.
 * The Master (or telemetry.sh) calls these at intent boundaries
 * to populate target_files and acceptance_criteria so the metrics
 * collector can compute drift and progress accurately.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const WS_PATH = ".cursor/plans/workspace_state.json";

interface AcceptanceCriterion {
  description: string;
  completed: boolean;
}

interface WorkspaceState {
  intent_id: string;
  phase: string;
  target_files: string[];
  acceptance_criteria: AcceptanceCriterion[];
  master_constraints: string[];
  emissary_observations: string[];
  action_items: string[];
  prediction_log: unknown[];
  [key: string]: unknown;
}

function readState(path: string = WS_PATH): WorkspaceState {
  try {
    if (!existsSync(path)) return emptyState();
    const raw = JSON.parse(readFileSync(path, "utf-8"));
    return { ...emptyState(), ...raw };
  } catch {
    return emptyState();
  }
}

function writeState(state: WorkspaceState, path: string = WS_PATH): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

function emptyState(): WorkspaceState {
  return {
    intent_id: "",
    phase: "idle",
    target_files: [],
    acceptance_criteria: [],
    master_constraints: [],
    emissary_observations: [],
    action_items: [],
    prediction_log: [],
  };
}

/**
 * Initialize workspace state for a new intent.
 * Call this at the start of each planning cycle.
 */
export function startIntent(
  intentId: string,
  targetFiles: string[],
  acceptanceCriteria: string[],
  constraints: string[] = [],
  path: string = WS_PATH
): WorkspaceState {
  const state: WorkspaceState = {
    ...emptyState(),
    intent_id: intentId,
    phase: "implementation",
    target_files: targetFiles,
    acceptance_criteria: acceptanceCriteria.map((desc) => ({
      description: desc,
      completed: false,
    })),
    master_constraints: constraints,
  };
  writeState(state, path);
  return state;
}

/**
 * Mark an acceptance criterion as completed by index.
 */
export function completeAcceptanceCriterion(
  index: number,
  path: string = WS_PATH
): WorkspaceState {
  const state = readState(path);
  if (index >= 0 && index < state.acceptance_criteria.length) {
    state.acceptance_criteria[index].completed = true;
  }
  writeState(state, path);
  return state;
}

/**
 * Mark all acceptance criteria as completed at once.
 */
export function completeAllCriteria(
  path: string = WS_PATH
): WorkspaceState {
  const state = readState(path);
  for (const c of state.acceptance_criteria) {
    c.completed = true;
  }
  writeState(state, path);
  return state;
}

/**
 * Finalize the intent with a signal and move to review phase.
 */
export function completeIntent(
  signal: "APPROVE" | "SUPPRESS" | "ESCALATE" | "SURPRISE",
  path: string = WS_PATH
): WorkspaceState {
  const state = readState(path);
  state.phase = "review";
  (state as Record<string, unknown>)["master_signal"] = {
    signal,
    timestamp: new Date().toISOString(),
  };
  writeState(state, path);
  return state;
}

export { readState, emptyState, type WorkspaceState, type AcceptanceCriterion };
