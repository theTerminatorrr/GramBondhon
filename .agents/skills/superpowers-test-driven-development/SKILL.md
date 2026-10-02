---
name: superpowers:test-driven-development
description: >-
  Enforce the Red-Green-Refactor test-driven development loop.
  Write automated tests first to prove bug existence or feature need, then write minimal code to pass.
  Use when writing unit tests, API tests, or smart contract tests.
---

# Superpowers: Test-Driven Development (TDD)

This skill enforces strict Red-Green-Refactor discipline across frontend, backend, and smart contract modules.

## When to Use
- Implementing any new API route, calculation logic, or data transformation.
- Fixing bugs: write a failing test first that reproduces the bug before writing the fix.
- Testing smart contracts in `contracts/test/`.

## Procedure

1. **🔴 Red Phase (Failing Test)**:
   - Write a unit test that asserts the desired behavior or reproduces an existing bug.
   - Run the test suite: `npm test` or `forge test`.
   - Confirm that the test fails for the exact reason expected.
2. **🟢 Green Phase (Minimal Implementation)**:
   - Write the simplest, cleanest code necessary to satisfy the test.
   - Re-run the test suite and confirm it passes without regressions.
3. **🔵 Refactor Phase**:
   - Clean up duplication, improve variable naming, and optimize performance.
   - Verify that all tests remain green throughout the refactoring.
