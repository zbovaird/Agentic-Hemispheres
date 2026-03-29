/**
 * Threshold-based guardrails.
 * Turns derived metrics into actionable flags and control signals.
 * Machine-readable output -- the Master reads these to decide next action.
 */

import type { DerivedMetrics, GuardFlag } from "./types.js";
import { getConfig, type MetricsConfig } from "./config.js";

export type ControlAction =
  | "continue"
  | "re_summary"
  | "replan"
  | "escalate"
  | "stop";

export interface GuardResult {
  flags: GuardFlag[];
  recommended_action: ControlAction;
}

export function evaluate(derived: DerivedMetrics): GuardResult {
  const cfg = getConfig();
  const flags: GuardFlag[] = [];

  checkThreshold(flags, {
    id: "non_improving_streak",
    metric: "consecutive_non_improving",
    value: derived.consecutive_non_improving,
    threshold: cfg.maxNonImprovingIterations,
    message: `${derived.consecutive_non_improving} consecutive iterations without progress (max: ${cfg.maxNonImprovingIterations})`,
    severity: derived.consecutive_non_improving >= cfg.escalationTriggerIterations ? "critical" : "warning",
  });

  checkThreshold(flags, {
    id: "high_drift",
    metric: "drift_score",
    value: derived.drift_score,
    threshold: cfg.maxDriftScore,
    message: `Drift score ${(derived.drift_score * 100).toFixed(0)}% exceeds ${(cfg.maxDriftScore * 100).toFixed(0)}% threshold`,
    severity: derived.drift_score >= cfg.forcedReplanDriftScore ? "critical" : "warning",
  });

  checkThreshold(flags, {
    id: "high_churn",
    metric: "churn_ratio",
    value: derived.churn_ratio,
    threshold: cfg.maxChurnRatio,
    message: `Churn ratio ${(derived.churn_ratio * 100).toFixed(0)}% exceeds ${(cfg.maxChurnRatio * 100).toFixed(0)}% threshold`,
    severity: "warning",
  });

  checkThreshold(flags, {
    id: "summary_debt",
    metric: "summary_debt",
    value: derived.summary_debt,
    threshold: cfg.maxSummaryDebt,
    message: `Summary debt ${derived.summary_debt} exceeds max ${cfg.maxSummaryDebt}`,
    severity: "warning",
  });

  if (derived.stale_context_flag) {
    flags.push({
      id: "stale_context",
      severity: "warning",
      metric: "stale_context_flag",
      value: 1,
      threshold: 0,
      message: "Context is stale -- summaries need refresh",
    });
  }

  if (derived.oscillation_flag) {
    flags.push({
      id: "oscillation",
      severity: "warning",
      metric: "oscillation_flag",
      value: derived.validation_volatility,
      threshold: 0,
      message: `Test results oscillating (volatility: ${(derived.validation_volatility * 100).toFixed(0)}%)`,
    });
  }

  checkThresholdBelow(flags, {
    id: "low_efficiency",
    metric: "efficiency_score",
    value: derived.efficiency_score,
    threshold: cfg.minEfficiencyScore,
    message: `Efficiency score ${derived.efficiency_score.toFixed(0)} below minimum ${cfg.minEfficiencyScore}`,
    severity: "warning",
  });

  checkThresholdBelow(flags, {
    id: "low_stability",
    metric: "stability_score",
    value: derived.stability_score,
    threshold: cfg.minStabilityScore,
    message: `Stability score ${derived.stability_score.toFixed(0)} below minimum ${cfg.minStabilityScore}`,
    severity: "warning",
  });

  checkThresholdBelow(flags, {
    id: "low_convergence",
    metric: "convergence_score",
    value: derived.convergence_score,
    threshold: cfg.minConvergenceScore,
    message: `Convergence score ${derived.convergence_score.toFixed(0)} below minimum ${cfg.minConvergenceScore} -- consider stopping autonomous work`,
    severity: "critical",
  });

  checkThreshold(flags, {
    id: "high_escalation_rate",
    metric: "escalation_rate",
    value: derived.escalation_rate,
    threshold: cfg.maxEscalationRate,
    message: `Escalation rate ${(derived.escalation_rate * 100).toFixed(0)}% exceeds ${(cfg.maxEscalationRate * 100).toFixed(0)}% threshold`,
    severity: "warning",
  });

  return {
    flags,
    recommended_action: determineAction(flags, derived, cfg),
  };
}

function determineAction(
  flags: GuardFlag[],
  derived: DerivedMetrics,
  cfg: MetricsConfig
): ControlAction {
  const criticals = flags.filter((f) => f.severity === "critical");

  if (derived.convergence_score < cfg.minConvergenceScore) return "stop";
  if (derived.drift_score >= cfg.forcedReplanDriftScore) return "replan";
  if (derived.consecutive_non_improving >= cfg.escalationTriggerIterations) return "escalate";
  if (derived.stale_context_flag) return "re_summary";
  if (criticals.length > 0) return "escalate";
  return "continue";
}

function checkThreshold(
  flags: GuardFlag[],
  spec: GuardFlag & { severity: GuardFlag["severity"] }
): void {
  if (spec.value > spec.threshold) {
    flags.push(spec);
  }
}

function checkThresholdBelow(
  flags: GuardFlag[],
  spec: GuardFlag & { severity: GuardFlag["severity"] }
): void {
  if (spec.value < spec.threshold) {
    flags.push(spec);
  }
}
