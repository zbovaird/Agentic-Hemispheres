# Gestalt 01: String Utilities Module

**Intent:** Create a foundational string utilities module with two pure functions — email validation and slug generation. This establishes the project's first source module and test suite, validating the TDD workflow and bicameral hand-off protocol.

## Architectural Decisions

1. **Pure functions only.** No side effects, no I/O, no external dependencies. The Emissary must NOT install any npm packages for this task.
2. **Regex-based email validation.** A reasonable RFC 5322 subset — not a full parser. The focus is on demonstrating the workflow, not building a production email validator.
3. **Slug generation** must be idempotent: `slugify(slugify(x)) === slugify(x)`.
4. **Module structure:** One source file, one test file. Keep it flat for now.

## Constraints

- Only touch `src/string-utils.ts` and `tests/string-utils.test.ts`.
- No new dependencies.
- All functions must be typed with explicit parameter and return types.
- Tests must cover: valid inputs, invalid inputs, and edge cases (empty string, unicode, consecutive special characters).

## JSON Handshake (Master → Emissary)

```json
{
  "intent_id": "util-string-001",
  "architectural_constraint": "Pure functions only. No external dependencies. Regex-based email validation (RFC 5322 subset). Slug must be idempotent.",
  "target_files": [
    "src/string-utils.ts",
    "tests/string-utils.test.ts"
  ],
  "acceptance_criteria": [
    "isValidEmail returns true for standard emails (user@domain.com)",
    "isValidEmail returns false for malformed inputs (no @, no domain, empty string)",
    "slugify converts 'Hello World!' to 'hello-world'",
    "slugify is idempotent: slugify(slugify(x)) === slugify(x)",
    "slugify handles unicode by stripping non-ASCII",
    "All tests pass via `npm test`",
    "No new dependencies added to package.json"
  ],
  "implementation_proof": {
    "test_log": "<to be filled by Emissary>",
    "diff_summary": "<to be filled by Emissary>",
    "lint_status": "<to be filled by Emissary>"
  }
}
```

## Expected Spiral

1. **RH (this plan)** → Emissary receives the handshake above.
2. **LH (implementation)** → Emissary writes tests first (red), then code (green), then returns proof.
3. **RH (review)** → Master verifies proof against acceptance criteria.
