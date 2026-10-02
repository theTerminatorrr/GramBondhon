---
name: ralph-loop
description: >-
  Autonomous execution loop for batch or multi-task features.
  Enforce the discipline of executing exactly one task per iteration, testing,
  verifying UI with Iris, committing, and advancing.
---

# Ralph Loop: Autonomous Iteration Discipline

This skill enforces strict, atomic step-by-step progress during complex multi-task workflows or batch feature implementations.

## When to Use
- Implementing multi-part features across several modules.
- Batch refactoring or applying systematic migrations across multiple files.
- Running autonomous iterative engineering loops.

## The Ralph Loop Workflow

For every task in the backlog or plan:

```
┌────────────────────────────────────────────────────────┐
│ 1. SELECT NEXT TASK                                    │
│    Pick exactly ONE atomic task from the plan.         │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 2. EXECUTE IMPLEMENTATION                              │
│    Write clean, minimal code for this specific task.   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 3. RUN TESTS & VERIFY                                  │
│    Run tests (TDD) and diagnose failures immediately.   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 4. VISUAL UI VERIFICATION (IRIS)                       │
│    Capture Iris screenshot at http://localhost:5173.   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 5. ADVANCE & REPEAT                                    │
│    Mark task done, record progress, advance to next.   │
└────────────────────────────────────────────────────────┘
```

## Core Invariant
- **Never attempt multiple batch tasks in a single unverified leap**.
- Always verify the current step (both code and UI) before moving to the next.
