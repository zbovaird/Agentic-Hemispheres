import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import {
  startIntent,
  completeAcceptanceCriterion,
  completeAllCriteria,
  completeIntent,
  readState,
} from "../intent.js";

const TEST_DIR = ".cursor/plans/__test_intent__";
const TEST_PATH = `${TEST_DIR}/workspace_state.json`;

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("startIntent", () => {
  it("creates workspace state with target_files and acceptance_criteria", () => {
    const state = startIntent(
      "feat-login-001",
      ["src/auth.ts", "tests/auth.test.ts"],
      ["Login returns 200", "Session persists"],
      ["No new dependencies"],
      TEST_PATH
    );

    expect(state.intent_id).toBe("feat-login-001");
    expect(state.phase).toBe("implementation");
    expect(state.target_files).toEqual(["src/auth.ts", "tests/auth.test.ts"]);
    expect(state.acceptance_criteria).toHaveLength(2);
    expect(state.acceptance_criteria[0].description).toBe("Login returns 200");
    expect(state.acceptance_criteria[0].completed).toBe(false);
    expect(state.master_constraints).toEqual(["No new dependencies"]);

    const onDisk = JSON.parse(readFileSync(TEST_PATH, "utf-8"));
    expect(onDisk.intent_id).toBe("feat-login-001");
    expect(onDisk.target_files).toEqual(["src/auth.ts", "tests/auth.test.ts"]);
  });
});

describe("completeAcceptanceCriterion", () => {
  it("marks a specific criterion as completed", () => {
    startIntent("test-001", ["a.ts"], ["Criterion A", "Criterion B"], [], TEST_PATH);

    const state = completeAcceptanceCriterion(0, TEST_PATH);
    expect(state.acceptance_criteria[0].completed).toBe(true);
    expect(state.acceptance_criteria[1].completed).toBe(false);
  });

  it("ignores out-of-bounds index", () => {
    startIntent("test-001", ["a.ts"], ["Criterion A"], [], TEST_PATH);

    const state = completeAcceptanceCriterion(99, TEST_PATH);
    expect(state.acceptance_criteria[0].completed).toBe(false);
  });
});

describe("completeAllCriteria", () => {
  it("marks all criteria as completed", () => {
    startIntent("test-001", ["a.ts"], ["A", "B", "C"], [], TEST_PATH);

    const state = completeAllCriteria(TEST_PATH);
    expect(state.acceptance_criteria.every((c) => c.completed)).toBe(true);
  });
});

describe("completeIntent", () => {
  it("sets phase to review and writes signal", () => {
    startIntent("test-001", ["a.ts"], ["A"], [], TEST_PATH);

    const state = completeIntent("APPROVE", TEST_PATH);
    expect(state.phase).toBe("review");

    const onDisk = JSON.parse(readFileSync(TEST_PATH, "utf-8"));
    expect(onDisk.master_signal.signal).toBe("APPROVE");
    expect(onDisk.phase).toBe("review");
  });
});

describe("readState", () => {
  it("returns empty state for missing file", () => {
    const state = readState(`${TEST_DIR}/nonexistent.json`);
    expect(state.intent_id).toBe("");
    expect(state.phase).toBe("idle");
    expect(state.target_files).toEqual([]);
  });

  it("reads existing state", () => {
    startIntent("read-test", ["x.ts"], ["Done"], [], TEST_PATH);
    const state = readState(TEST_PATH);
    expect(state.intent_id).toBe("read-test");
    expect(state.target_files).toEqual(["x.ts"]);
  });
});
