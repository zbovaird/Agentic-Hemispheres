// Inhibitory feedback loop for the Emissary (LH)
//
// Automatically re-feeds lint/test failures back to the Emissary
// without involving the Master, until the Clarification Threshold
// is reached (default: 5 iterations).

const CLARIFICATION_THRESHOLD = 5;

export default {
  name: "grind",
  event: "onSave",
  match: ["src/**/*", "tests/**/*"],

  async run(context: {
    file: { path: string };
    runCommand: (cmd: string) => Promise<{ exitCode: number; stdout: string }>;
    getState: (key: string) => unknown;
    setState: (key: string, value: unknown) => void;
  }) {
    const { file, runCommand, getState, setState } = context;

    const iterKey = `grind:${file.path}:iterations`;
    const iterations = (getState(iterKey) as number) || 0;

    const lintResult = await runCommand(`npx eslint ${file.path} --format json`);
    const testResult = await runCommand(`npx vitest run --reporter=json`);

    const lintPassed = lintResult.exitCode === 0;
    const testsPassed = testResult.exitCode === 0;

    if (lintPassed && testsPassed) {
      setState(iterKey, 0);
      return { action: "continue" };
    }

    const nextIteration = iterations + 1;
    setState(iterKey, nextIteration);

    if (nextIteration >= CLARIFICATION_THRESHOLD) {
      setState(iterKey, 0);
      return {
        action: "escalate",
        message: `Clarification Threshold reached (${CLARIFICATION_THRESHOLD} iterations). Escalating to Master.`,
        payload: {
          signal: "ESCALATE",
          iteration_count: nextIteration,
          lint_errors: lintPassed ? null : lintResult.stdout,
          test_errors: testsPassed ? null : testResult.stdout,
        },
      };
    }

    return {
      action: "retry",
      message: `Iteration ${nextIteration}/${CLARIFICATION_THRESHOLD}. Fix the following errors before proceeding.`,
      payload: {
        lint_errors: lintPassed ? null : lintResult.stdout,
        test_errors: testsPassed ? null : testResult.stdout,
      },
    };
  },
};
