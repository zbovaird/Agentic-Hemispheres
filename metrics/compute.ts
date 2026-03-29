/**
 * Derived metrics computation engine.
 * ALL formulas live in this single file.
 * Each function is pure: takes raw data in, returns a number.
 */

import type { IterationRecord, DerivedMetrics } from "./types.js";
import { getConfig } from "./config.js";

export function computeAll(
  current: IterationRecord,
  history: IterationRecord[]
): DerivedMetrics {
  const allIterations = [...history, current];

  return {
    validated_progress_delta: progressDelta(current),
    validated_progress_velocity: progressVelocity(current),
    consecutive_non_improving: consecutiveNonImproving(allIterations),

    drift_score: driftScore(current),
    in_scope_touch_ratio: inScopeTouchRatio(current),
    scope_expansion_rate: scopeExpansionRate(current, history),

    churn_ratio: churnRatio(current, history),
    rewrite_hotspot_score: rewriteHotspotScore(current, history),
    rollback_frequency: rollbackFrequency(allIterations),

    summary_debt: summaryDebt(current),
    stale_context_flag: staleContextFlag(current),
    summary_validity_score: summaryValidityScore(current),

    efficiency_score: efficiencyScore(current),
    tokens_per_validated_subgoal: tokensPerSubgoal(current),
    cost_per_validated_progress: costPerProgress(current),

    stability_score: stabilityScore(allIterations),
    oscillation_flag: oscillationFlag(allIterations),
    validation_volatility: validationVolatility(allIterations),

    escalation_rate: escalationRate(allIterations),
    escalation_quality_score: escalationQualityScore(allIterations),
    stall_before_escalation: stallBeforeEscalation(allIterations),

    convergence_score: convergenceScore(current, history),
  };
}

// --- Progress ---

export function progressDelta(r: IterationRecord): number {
  if (r.acceptance_criteria_total === 0) return 0;
  const ratio = r.acceptance_criteria_completed / r.acceptance_criteria_total;
  const testBonus = r.tests_passed > 0 && r.tests_failed === 0 ? 0.1 : 0;
  const lintBonus = r.lint_passed ? 0.05 : 0;
  const typecheckBonus = r.typecheck_passed ? 0.05 : 0;
  const regressionPenalty = Math.min(0.2, r.regression_count * 0.05);

  return clamp(ratio + testBonus + lintBonus + typecheckBonus - regressionPenalty, 0, 1);
}

export function progressVelocity(r: IterationRecord): number {
  const delta = progressDelta(r);
  const seconds = Math.max(1, r.elapsed_seconds);
  return delta / (seconds / 60);
}

export function consecutiveNonImproving(history: IterationRecord[]): number {
  if (history.length < 2) return 0;

  let count = 0;
  for (let i = history.length - 1; i > 0; i--) {
    const curr = progressDelta(history[i]);
    const prev = progressDelta(history[i - 1]);
    if (curr <= prev) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// --- Drift ---

export function driftScore(r: IterationRecord): number {
  const total = r.touched_files.length;
  if (total === 0) return 0;

  const outOfScope = r.out_of_scope_files.length;
  return clamp(outOfScope / total, 0, 1);
}

export function inScopeTouchRatio(r: IterationRecord): number {
  const total = r.touched_files.length;
  if (total === 0) return 1;

  const planned = new Set(r.planned_target_files);
  const inScope = r.touched_files.filter((f) => planned.has(f)).length;
  return clamp(inScope / total, 0, 1);
}

export function scopeExpansionRate(
  current: IterationRecord,
  history: IterationRecord[]
): number {
  if (history.length === 0) return 0;

  const prevTouched = new Set(history.flatMap((h) => h.touched_files));
  const newFiles = current.touched_files.filter((f) => !prevTouched.has(f));
  const total = current.touched_files.length;

  return total === 0 ? 0 : clamp(newFiles.length / total, 0, 1);
}

// --- Churn ---

export function churnRatio(
  current: IterationRecord,
  history: IterationRecord[]
): number {
  const totalChanges = current.touched_files.length;
  if (totalChanges === 0) return 0;

  const reedited = current.repeated_edit_count + current.reverted_change_count;
  return clamp(reedited / Math.max(1, totalChanges), 0, 1);
}

export function rewriteHotspotScore(
  current: IterationRecord,
  history: IterationRecord[]
): number {
  const allTouched = [...history.flatMap((h) => h.touched_files), ...current.touched_files];
  const counts = new Map<string, number>();
  for (const f of allTouched) {
    counts.set(f, (counts.get(f) || 0) + 1);
  }

  const totalFiles = new Set(allTouched).size;
  if (totalFiles === 0) return 0;

  const hotspots = Array.from(counts.values()).filter((c) => c > 2).length;
  return clamp(hotspots / totalFiles, 0, 1);
}

export function rollbackFrequency(history: IterationRecord[]): number {
  if (history.length === 0) return 0;
  const rollbacks = history.filter((h) => h.rollback_triggered).length;
  return clamp(rollbacks / history.length, 0, 1);
}

// --- Context Integrity ---

export function summaryDebt(r: IterationRecord): number {
  return r.summary_age_iterations + r.stale_reference_count;
}

export function staleContextFlag(r: IterationRecord): boolean {
  const cfg = getConfig();
  return (
    r.summary_age_iterations > cfg.reSummaryTriggerAge ||
    r.stale_reference_count > cfg.maxStaleReferences
  );
}

export function summaryValidityScore(r: IterationRecord): number {
  const agePenalty = Math.min(50, r.summary_age_iterations * 5);
  const stalePenalty = Math.min(30, r.stale_reference_count * 10);
  const refreshBonus = r.summary_refresh_performed ? 20 : 0;
  return clamp(100 - agePenalty - stalePenalty + refreshBonus, 0, 100);
}

// --- Efficiency ---

export function efficiencyScore(r: IterationRecord): number {
  const progress = progressDelta(r);
  if (progress === 0) return 0;

  const timeCost = Math.max(1, r.elapsed_seconds / 60);
  const toolCost = Math.max(1, r.tool_call_count);
  const tokenCost =
    r.token_input !== null && r.token_output !== null
      ? (r.token_input + r.token_output) / 10000
      : timeCost;

  const costFactor = (timeCost * 0.4 + toolCost * 0.3 + tokenCost * 0.3);
  return clamp((progress / costFactor) * 100, 0, 100);
}

export function tokensPerSubgoal(r: IterationRecord): number | null {
  if (r.token_input === null || r.acceptance_criteria_completed === 0) return null;
  return (r.token_input + (r.token_output || 0)) / r.acceptance_criteria_completed;
}

export function costPerProgress(r: IterationRecord): number | null {
  if (r.estimated_cost === null) return null;
  const progress = progressDelta(r);
  return progress > 0 ? r.estimated_cost / progress : null;
}

// --- Stability ---

export function stabilityScore(history: IterationRecord[]): number {
  if (history.length < 2) return 100;

  let score = 100;
  score -= oscillationPenalty(history) * 20;
  score -= rollbackFrequency(history) * 30;
  score -= reopenPenalty(history) * 15;

  return clamp(score, 0, 100);
}

export function oscillationFlag(history: IterationRecord[]): boolean {
  return oscillationPenalty(history) >= 3;
}

export function validationVolatility(history: IterationRecord[]): number {
  if (history.length < 2) return 0;

  let flips = 0;
  for (let i = 1; i < history.length; i++) {
    const prevPass = history[i - 1].tests_failed === 0;
    const currPass = history[i].tests_failed === 0;
    if (prevPass !== currPass) flips++;
  }
  return clamp(flips / (history.length - 1), 0, 1);
}

function oscillationPenalty(history: IterationRecord[]): number {
  if (history.length < 3) return 0;

  let oscillations = 0;
  for (let i = 2; i < history.length; i++) {
    const a = history[i - 2].tests_failed === 0;
    const b = history[i - 1].tests_failed === 0;
    const c = history[i].tests_failed === 0;
    if (a === c && a !== b) oscillations++;
  }
  return oscillations;
}

function reopenPenalty(history: IterationRecord[]): number {
  if (history.length < 2) return 0;
  let reopens = 0;
  for (let i = 1; i < history.length; i++) {
    if (
      history[i].tests_failed > 0 &&
      history[i - 1].tests_failed === 0 &&
      history[i].regression_count > 0
    ) {
      reopens++;
    }
  }
  return clamp(reopens / history.length, 0, 1);
}

// --- Escalation ---

export function escalationRate(history: IterationRecord[]): number {
  if (history.length === 0) return 0;
  const escalations = history.filter((h) => h.escalation_triggered).length;
  return clamp(escalations / history.length, 0, 1);
}

export function escalationQualityScore(history: IterationRecord[]): number {
  const escalations = history.filter((h) => h.escalation_triggered);
  if (escalations.length === 0) return 100;

  const resolved = escalations.filter(
    (e) => e.signal === "APPROVE" || e.signal === "ESCALATE"
  ).length;
  return clamp((resolved / escalations.length) * 100, 0, 100);
}

export function stallBeforeEscalation(history: IterationRecord[]): number {
  let maxStall = 0;
  let currentStall = 0;

  for (const r of history) {
    if (progressDelta(r) === 0) {
      currentStall++;
    } else {
      currentStall = 0;
    }
    if (r.escalation_triggered) {
      maxStall = Math.max(maxStall, currentStall);
      currentStall = 0;
    }
  }
  return maxStall;
}

// --- Convergence (top-level signal) ---

export function convergenceScore(
  current: IterationRecord,
  history: IterationRecord[]
): number {
  const w = getConfig().convergenceWeights;
  const all = [...history, current];

  const progressComponent = progressDelta(current) * 100;
  const driftComponent = (1 - driftScore(current)) * 100;
  const churnComponent = (1 - churnRatio(current, history)) * 100;
  const contextComponent = summaryValidityScore(current);
  const stabilityComponent = stabilityScore(all);
  const efficiencyComponent = efficiencyScore(current);

  const weighted =
    progressComponent * w.progress +
    driftComponent * w.drift +
    churnComponent * w.churn +
    contextComponent * w.context +
    stabilityComponent * w.stability +
    efficiencyComponent * w.efficiency;

  return clamp(weighted, 0, 100);
}

// --- Utility ---

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
