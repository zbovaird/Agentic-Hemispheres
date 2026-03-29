/**
 * Centralized thresholds and weights for all derived metrics.
 * Edit this file to tune behavior -- no other files need changing.
 */

export interface MetricsConfig {
  /** Max consecutive iterations with no validated progress before flagging */
  maxNonImprovingIterations: number;

  /** Drift score above this triggers a warning */
  maxDriftScore: number;

  /** Churn ratio above this triggers a warning (0-1) */
  maxChurnRatio: number;

  /** Summary debt above this triggers a re-summary flag */
  maxSummaryDebt: number;

  /** Stale references above this triggers a warning */
  maxStaleReferences: number;

  /** Oscillation count above this triggers a warning */
  maxOscillationCount: number;

  /** Efficiency score below this triggers a warning (0-100) */
  minEfficiencyScore: number;

  /** Stability score below this triggers a warning (0-100) */
  minStabilityScore: number;

  /** Convergence score below this suggests stopping autonomous work (0-100) */
  minConvergenceScore: number;

  /** Escalation rate above this triggers review (0-1) */
  maxEscalationRate: number;

  /** Iterations without progress before forcing escalation */
  escalationTriggerIterations: number;

  /** Summary age in iterations before forcing refresh */
  reSummaryTriggerAge: number;

  /** Drift score above this forces a replan */
  forcedReplanDriftScore: number;

  /** Weights for convergence score components (should sum to ~1.0) */
  convergenceWeights: {
    progress: number;
    drift: number;
    churn: number;
    context: number;
    stability: number;
    efficiency: number;
  };
}

export const DEFAULT_CONFIG: MetricsConfig = {
  maxNonImprovingIterations: 3,
  maxDriftScore: 0.3,
  maxChurnRatio: 0.4,
  maxSummaryDebt: 5,
  maxStaleReferences: 3,
  maxOscillationCount: 3,
  minEfficiencyScore: 30,
  minStabilityScore: 50,
  minConvergenceScore: 40,
  maxEscalationRate: 0.5,
  escalationTriggerIterations: 5,
  reSummaryTriggerAge: 10,
  forcedReplanDriftScore: 0.6,
  convergenceWeights: {
    progress: 0.30,
    drift: 0.15,
    churn: 0.15,
    context: 0.10,
    stability: 0.15,
    efficiency: 0.15,
  },
};

let activeConfig: MetricsConfig = { ...DEFAULT_CONFIG };

export function getConfig(): MetricsConfig {
  return activeConfig;
}

export function setConfig(overrides: Partial<MetricsConfig>): MetricsConfig {
  activeConfig = { ...activeConfig, ...overrides };
  return activeConfig;
}

export function resetConfig(): MetricsConfig {
  activeConfig = { ...DEFAULT_CONFIG };
  return activeConfig;
}
