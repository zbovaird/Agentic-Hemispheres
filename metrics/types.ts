/**
 * Core types for the agentic metrics framework.
 * All per-iteration data and derived metrics are defined here.
 */

export interface IterationRecord {
  run_id: string;
  iteration_id: string;
  parent_iteration_id: string | null;
  timestamp_start: string;
  timestamp_end: string;

  active_goal_id: string;
  active_subgoal_id: string | null;
  actor_type: "master" | "implementer" | "verifier" | "user";

  planned_target_files: string[];
  touched_files: string[];
  out_of_scope_files: string[];

  acceptance_criteria_total: number;
  acceptance_criteria_completed: number;

  tests_passed: number;
  tests_failed: number;
  lint_passed: boolean;
  typecheck_passed: boolean;
  regression_count: number;

  reverted_change_count: number;
  repeated_edit_count: number;
  rollback_triggered: boolean;

  summary_version: number;
  summary_age_iterations: number;
  summary_refresh_performed: boolean;
  stale_reference_count: number;

  token_input: number | null;
  token_output: number | null;
  estimated_cost: number | null;
  tool_call_count: number;
  elapsed_seconds: number;

  escalation_triggered: boolean;
  escalation_reason: string | null;

  signal: "APPROVE" | "SUPPRESS" | "ESCALATE" | "SURPRISE" | null;
  model_config: {
    master: string;
    implementer: string;
    verifier: string;
  };

  notes: string | null;
}

export interface DerivedMetrics {
  validated_progress_delta: number;
  validated_progress_velocity: number;
  consecutive_non_improving: number;

  drift_score: number;
  in_scope_touch_ratio: number;
  scope_expansion_rate: number;

  churn_ratio: number;
  rewrite_hotspot_score: number;
  rollback_frequency: number;

  summary_debt: number;
  stale_context_flag: boolean;
  summary_validity_score: number;

  efficiency_score: number;
  tokens_per_validated_subgoal: number | null;
  cost_per_validated_progress: number | null;

  stability_score: number;
  oscillation_flag: boolean;
  validation_volatility: number;

  escalation_rate: number;
  escalation_quality_score: number;
  stall_before_escalation: number;

  convergence_score: number;
}

export interface ScoredIteration {
  record: IterationRecord;
  derived: DerivedMetrics;
  flags: GuardFlag[];
}

export interface GuardFlag {
  id: string;
  severity: "info" | "warning" | "critical";
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

export interface RunSummary {
  run_id: string;
  iteration_count: number;
  goal_id: string;
  started: string;
  ended: string;
  final_signal: string | null;
  final_convergence: number;
  flags_raised: GuardFlag[];
  model_config: IterationRecord["model_config"];
}
