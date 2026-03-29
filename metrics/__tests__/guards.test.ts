import { describe, it, expect, beforeEach } from "vitest";
import { evaluate } from "../guards.js";
import { resetConfig, setConfig } from "../config.js";
import type { DerivedMetrics } from "../types.js";

function makeGoodMetrics(overrides: Partial<DerivedMetrics> = {}): DerivedMetrics {
  return {
    validated_progress_delta: 0.8,
    validated_progress_velocity: 0.16,
    consecutive_non_improving: 0,
    drift_score: 0,
    in_scope_touch_ratio: 1,
    scope_expansion_rate: 0,
    churn_ratio: 0,
    rewrite_hotspot_score: 0,
    rollback_frequency: 0,
    summary_debt: 0,
    stale_context_flag: false,
    summary_validity_score: 100,
    efficiency_score: 80,
    tokens_per_validated_subgoal: null,
    cost_per_validated_progress: null,
    stability_score: 100,
    oscillation_flag: false,
    validation_volatility: 0,
    escalation_rate: 0,
    escalation_quality_score: 100,
    stall_before_escalation: 0,
    convergence_score: 85,
    ...overrides,
  };
}

beforeEach(() => {
  resetConfig();
});

describe("evaluate", () => {
  it("returns no flags and continue for healthy metrics", () => {
    const result = evaluate(makeGoodMetrics());
    expect(result.flags).toHaveLength(0);
    expect(result.recommended_action).toBe("continue");
  });

  it("flags non-improving streak", () => {
    const result = evaluate(makeGoodMetrics({ consecutive_non_improving: 4 }));
    const flag = result.flags.find((f) => f.id === "non_improving_streak");
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe("warning");
  });

  it("recommends escalate for long non-improving streak", () => {
    const result = evaluate(
      makeGoodMetrics({ consecutive_non_improving: 6 })
    );
    expect(result.recommended_action).toBe("escalate");
  });

  it("flags high drift", () => {
    const result = evaluate(makeGoodMetrics({ drift_score: 0.5 }));
    const flag = result.flags.find((f) => f.id === "high_drift");
    expect(flag).toBeDefined();
  });

  it("recommends replan for extreme drift", () => {
    const result = evaluate(
      makeGoodMetrics({ drift_score: 0.7, convergence_score: 60 })
    );
    expect(result.recommended_action).toBe("replan");
  });

  it("flags high churn", () => {
    const result = evaluate(makeGoodMetrics({ churn_ratio: 0.6 }));
    expect(result.flags.find((f) => f.id === "high_churn")).toBeDefined();
  });

  it("flags stale context", () => {
    const result = evaluate(makeGoodMetrics({ stale_context_flag: true }));
    const flag = result.flags.find((f) => f.id === "stale_context");
    expect(flag).toBeDefined();
    expect(result.recommended_action).toBe("re_summary");
  });

  it("flags oscillation", () => {
    const result = evaluate(
      makeGoodMetrics({ oscillation_flag: true, validation_volatility: 0.6 })
    );
    expect(result.flags.find((f) => f.id === "oscillation")).toBeDefined();
  });

  it("recommends stop for very low convergence", () => {
    const result = evaluate(makeGoodMetrics({ convergence_score: 20 }));
    expect(result.recommended_action).toBe("stop");
  });

  it("respects custom thresholds", () => {
    setConfig({ maxDriftScore: 0.9 });
    const result = evaluate(makeGoodMetrics({ drift_score: 0.5 }));
    expect(result.flags.find((f) => f.id === "high_drift")).toBeUndefined();
  });
});
