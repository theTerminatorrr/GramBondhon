---
name: systematic-debugging
description: >-
  Diagnose root causes systematically. Never guess bug fixes.
  Use when encountering runtime errors, server crashes, broken UI layouts, or failing tests.
---

# Systematic Debugging: Root-Cause Analysis Protocol

This skill enforces a scientific, evidence-based debugging procedure to eliminate guesswork and prevent regression cascades.

## When to Use
- Whenever an unexpected error occurs, a test fails, or UI breaks.
- Before writing any bug fix code.

## 4-Step Diagnostic Protocol

1. **Phase 1: Reproduce Reliably**:
   - Isolate the minimal steps to reproduce the failure.
   - Record exact error messages, stack traces, and exit codes.
2. **Phase 2: Localize Root Cause**:
   - Trace backwards from the point of failure.
   - Inspect variable state, network responses, and boundary inputs using logs or debug prints.
   - Do NOT assume the symptom is the cause.
3. **Phase 3: Formulate & Test Hypothesis**:
   - Formulate a single, falsifiable hypothesis: "Function X fails when input Y is null because of line Z".
   - Test the hypothesis by verifying code state.
4. **Phase 4: Implement Minimal Targeted Fix & Verify**:
   - Apply the surgical fix addressing the root cause.
   - Verify that the error is gone and no adjacent features regressed.
