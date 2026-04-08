#!/usr/bin/env node
/**
 * Cursor hook: afterFileEdit — lint + test feedback loop with clarification threshold.
 * Invoked by .cursor/hooks.json. Reads JSON event from stdin.
 * Always exits 0 so edits are not blocked; failures are logged.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_PATH = join(ROOT, ".cursor/plans/grind_hook_state.json");
const WS_PATH = join(ROOT, ".cursor/plans/workspace_state.json");
const JOURNAL = join(ROOT, ".cursor/plans/action_journal.jsonl");

function readStdin() {
  try {
    const raw = readFileSync(0, "utf-8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getThreshold() {
  try {
    if (!existsSync(WS_PATH)) return 5;
    const ws = JSON.parse(readFileSync(WS_PATH, "utf-8"));
    const t = ws.workflow_policy?.clarification_threshold;
    return typeof t === "number" && t > 0 ? t : 5;
  } catch {
    return 5;
  }
}

function loadState() {
  try {
    if (!existsSync(STATE_PATH)) return { byFile: {} };
    return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
  } catch {
    return { byFile: {} };
  }
}

function saveState(s) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 2) + "\n", "utf-8");
}

function watchable(rel) {
  if (!rel || typeof rel !== "string") return false;
  const n = rel.replace(/\\/g, "/");
  return n.startsWith("src/") || n.startsWith("tests/");
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf-8",
    shell: false,
    timeout: 120000,
  });
  return { code: r.status ?? 1, out: (r.stdout || "") + (r.stderr || "") };
}

function main() {
  const ev = readStdin();
  const rawPath =
    ev.file_path ||
    ev.path ||
    ev.file ||
    (Array.isArray(ev.filePaths) && ev.filePaths[0]) ||
    "";
  if (!rawPath) {
    process.exit(0);
    return;
  }

  let abs = String(rawPath);
  let relPath = abs;
  try {
    if (abs.startsWith(ROOT)) {
      relPath = relative(ROOT, abs).replace(/\\/g, "/");
    }
  } catch {
    relPath = abs.replace(/\\/g, "/");
  }

  if (!watchable(relPath)) {
    process.exit(0);
    return;
  }

  const threshold = getThreshold();
  const state = loadState();
  const key = relPath;

  const eslint = run("npx", ["eslint", relPath, "--max-warnings", "0"], ROOT);
  const vitest = run("npx", ["vitest", "run", "--reporter=json"], ROOT);
  const ok = eslint.code === 0 && vitest.code === 0;

  if (ok) {
    state.byFile[key] = 0;
    saveState(state);
    process.exit(0);
    return;
  }

  const n = (state.byFile[key] || 0) + 1;
  state.byFile[key] = n;
  saveState(state);

  const payload = {
    signal: "ESCALATE",
    source: "cursor-after-file-edit",
    file: relPath,
    iteration: n,
    threshold,
    eslint_exit: eslint.code,
    vitest_exit: vitest.code,
  };

  mkdirSync(dirname(JOURNAL), { recursive: true });
  appendFileSync(JOURNAL, JSON.stringify({ ts: new Date().toISOString(), ...payload }) + "\n", "utf-8");

  if (n >= threshold) {
    console.error(
      `[grind] Clarification threshold (${threshold}) reached for ${relPath}. See .cursor/plans/action_journal.jsonl.`
    );
    state.byFile[key] = 0;
    saveState(state);
  }

  process.exit(0);
}

main();
