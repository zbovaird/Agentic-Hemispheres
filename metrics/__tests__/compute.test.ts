import { describe, it, expect, beforeEach } from "vitest";
import {
  progressDelta,
  progressVelocity,
  consecutiveNonImproving,
  driftScore,
  inScopeTouchRatio,
  churnRatio,
  rewriteHotspotScore,
  rollbackFrequency,
  summaryDebt,
  staleContextFlag,
  efficiencyScore,
  stabilityScore,
  oscillationFlag,
  validationVolatility,
  escalationRate,
  convergenceScore,
  computeAll,
} from "../compute.js";
import { resetConfig } from "../config.js";
import type { IterationRecord } from "../types.js";

function makeRecord(overrides: Partial<IterationRecord> = {}): IterationRecord {
  return {
    run_id: "test-run",
    iteration_id: "iter-1",
    parent_iteration_id: null,
    timestamp_start: "2026-01-01T00:00:00Z",
    timestamp_end: "2026-01-01T00:05:00Z",
    active_goal_id: "goal-1",
    active_subgoal_id: null,
    actor_type: "implementer",
    planned_target_files: ["src/foo.ts", "tests/foo.test.ts"],
    touched_files: ["src/foo.ts", "tests/foo.test.ts"],
    out_of_scope_files: [],
    acceptance_criteria_total: 5,
    acceptance_criteria_completed: 5,
    tests_passed: 10,
    tests_failed: 0,
    lint_passed: true,
    typecheck_passed: true,
    regression_count: 0,
    reverted_change_count: 0,
    repeated_edit_count: 0,
    rollback_triggered: false,
    summary_version: 1,
    summary_age_iterations: 0,
    summary_refresh_performed: false,
    stale_reference_count: 0,
    token_input: null,
    token_output: null,
    estimated_cost: null,
    tool_call_count: 5,
    elapsed_seconds: 300,
    escalation_triggered: false,
    escalation_reason: null,
    signal: "APPROVE",
    model_config: { master: "opus", implementer: "flash", verifier: "flash" },
    notes: null,
    ...overrides,
  };
}

beforeEach(() => {
  resetConfig();
});

describe("progressDelta", () => {
  it("returns 1.0 for perfect iteration (all criteria + tests + lint + typecheck)", () => {
    const r = makeRecord();
    const delta = progressDelta(r);
    expect(delta).toBeGreaterThanOrEqual(1.0);
  });

  it("returns 0 when no criteria exist", () => {
    const r = makeRecord({ acceptance_criteria_total: 0, acceptance_criteria_completed: 0 });
    expect(progressDelta(r)).toBe(0);
  });

  it("penalizes regressions", () => {
    const clean = makeRecord({ acceptance_criteria_completed: 3, tests_failed: 1 });
    const regressed = makeRecord({ acceptance_criteria_completed: 3, tests_failed: 1, regression_count: 3 });
    expect(progressDelta(regressed)).toBeLessThan(progressDelta(clean));
  });

  it("partial completion gives proportional score", () => {
    const r = makeRecord({ acceptance_criteria_completed: 3 });
    const delta = progressDelta(r);
    expect(delta).toBeGreaterThan(0.5);
    expect(delta).toBeLessThan(1.0);
  });
});

describe("consecutiveNonImproving", () => {
  it("returns 0 when each iteration improves", () => {
    const history = [
      makeRecord({ acceptance_criteria_completed: 1, tests_failed: 2, lint_passed: false, typecheck_passed: false }),
      makeRecord({ acceptance_criteria_completed: 3, tests_failed: 1, lint_passed: false, typecheck_passed: false }),
      makeRecord({ acceptance_criteria_completed: 5, tests_failed: 0, lint_passed: true, typecheck_passed: true }),
    ];
    expect(consecutiveNonImproving(history)).toBe(0);
  });

  it("counts flat iterations at the end", () => {
    const history = [
      makeRecord({ acceptance_criteria_completed: 5 }),
      makeRecord({ acceptance_criteria_completed: 5 }),
      makeRecord({ acceptance_criteria_completed: 5 }),
    ];
    expect(consecutiveNonImproving(history)).toBe(2);
  });
});

describe("driftScore", () => {
  it("returns 0 when all files are in scope", () => {
    const r = makeRecord();
    expect(driftScore(r)).toBe(0);
  });

  it("returns >0 when out-of-scope files are touched", () => {
    const r = makeRecord({
      touched_files: ["src/foo.ts", "src/bar.ts", "config.json"],
      out_of_scope_files: ["src/bar.ts", "config.json"],
    });
    expect(driftScore(r)).toBeCloseTo(2 / 3, 1);
  });

  it("returns 0 when no files are touched", () => {
    const r = makeRecord({ touched_files: [], out_of_scope_files: [] });
    expect(driftScore(r)).toBe(0);
  });
});

describe("inScopeTouchRatio", () => {
  it("returns 1.0 when all touches are planned", () => {
    expect(inScopeTouchRatio(makeRecord())).toBe(1);
  });

  it("returns ratio when some touches are unplanned", () => {
    const r = makeRecord({
      touched_files: ["src/foo.ts", "src/bar.ts"],
      planned_target_files: ["src/foo.ts"],
    });
    expect(inScopeTouchRatio(r)).toBe(0.5);
  });
});

describe("churnRatio", () => {
  it("returns 0 with no repeated or reverted edits", () => {
    expect(churnRatio(makeRecord(), [])).toBe(0);
  });

  it("increases with reverted changes", () => {
    const r = makeRecord({ reverted_change_count: 3 });
    expect(churnRatio(r, [])).toBeGreaterThan(0);
  });
});

describe("rollbackFrequency", () => {
  it("returns 0 with no rollbacks", () => {
    expect(rollbackFrequency([makeRecord(), makeRecord()])).toBe(0);
  });

  it("returns 0.5 when half of iterations had rollbacks", () => {
    const history = [
      makeRecord({ rollback_triggered: true }),
      makeRecord({ rollback_triggered: false }),
    ];
    expect(rollbackFrequency(history)).toBe(0.5);
  });
});

describe("summaryDebt", () => {
  it("returns 0 for fresh summaries", () => {
    expect(summaryDebt(makeRecord())).toBe(0);
  });

  it("accumulates age + stale references", () => {
    const r = makeRecord({ summary_age_iterations: 5, stale_reference_count: 2 });
    expect(summaryDebt(r)).toBe(7);
  });
});

describe("stabilityScore", () => {
  it("returns 100 for single iteration", () => {
    expect(stabilityScore([makeRecord()])).toBe(100);
  });

  it("decreases with pass/fail oscillation", () => {
    const history = [
      makeRecord({ tests_failed: 0 }),
      makeRecord({ tests_failed: 3 }),
      makeRecord({ tests_failed: 0 }),
      makeRecord({ tests_failed: 2 }),
      makeRecord({ tests_failed: 0 }),
    ];
    expect(stabilityScore(history)).toBeLessThan(100);
  });
});

describe("oscillationFlag", () => {
  it("false for stable runs", () => {
    const history = [makeRecord(), makeRecord(), makeRecord()];
    expect(oscillationFlag(history)).toBe(false);
  });

  it("true for heavily oscillating runs", () => {
    const history = [
      makeRecord({ tests_failed: 0 }),
      makeRecord({ tests_failed: 1 }),
      makeRecord({ tests_failed: 0 }),
      makeRecord({ tests_failed: 1 }),
      makeRecord({ tests_failed: 0 }),
      makeRecord({ tests_failed: 1 }),
      makeRecord({ tests_failed: 0 }),
    ];
    expect(oscillationFlag(history)).toBe(true);
  });
});

describe("escalationRate", () => {
  it("returns 0 with no escalations", () => {
    expect(escalationRate([makeRecord()])).toBe(0);
  });

  it("returns ratio of escalated iterations", () => {
    const history = [
      makeRecord({ escalation_triggered: true }),
      makeRecord({ escalation_triggered: false }),
      makeRecord({ escalation_triggered: true }),
    ];
    expect(escalationRate(history)).toBeCloseTo(2 / 3, 1);
  });
});

describe("convergenceScore", () => {
  it("is high for a clean iteration", () => {
    const r = makeRecord();
    expect(convergenceScore(r, [])).toBeGreaterThan(70);
  });

  it("is low for a drifting, churning iteration with no progress", () => {
    const r = makeRecord({
      acceptance_criteria_completed: 0,
      tests_failed: 5,
      lint_passed: false,
      typecheck_passed: false,
      out_of_scope_files: ["a.ts", "b.ts"],
      touched_files: ["a.ts", "b.ts"],
      reverted_change_count: 3,
      summary_age_iterations: 15,
      stale_reference_count: 5,
    });
    expect(convergenceScore(r, [])).toBeLessThan(50);
  });
});

describe("computeAll", () => {
  it("returns all derived fields", () => {
    const r = makeRecord();
    const derived = computeAll(r, []);
    expect(derived).toHaveProperty("convergence_score");
    expect(derived).toHaveProperty("drift_score");
    expect(derived).toHaveProperty("churn_ratio");
    expect(derived).toHaveProperty("stability_score");
    expect(derived).toHaveProperty("escalation_rate");
    expect(derived.convergence_score).toBeGreaterThan(0);
  });
});
