---
name: writing-plans
description: >-
  Break complex features and bug fixes into small, ordered, 2–5 minute testable micro-tasks.
  Mandatory before starting execution of multi-step coding work.
---

# Writing Plans: Micro-Task Decomposition

This skill structures complex engineering initiatives into atomic, executable micro-tasks with clear checkpoints.

## When to Use
- **Mandatory before non-trivial coding**: After brainstorming and PRD creation, but before writing implementation code.
- Managing multi-file changes across frontend (`apps/web`, `src/`) and backend (`apps/api`, `backend/`).

## Procedure

1. **Task Granularity**:
   - Every micro-task must represent a single, focused 2–5 minute change.
   - Example: "Add `/api/v1/surveillance/telemetry` endpoint", "Write Vitest test for endpoint", "Connect UI canvas to endpoint".
2. **Deterministic Verification Step**:
   - Each task must define its exact verification method:
     - CLI command (e.g., `npm test`, `curl http://localhost:3001/api/health`).
     - Visual check (e.g., Iris screenshot at `http://localhost:5173/orders.html`).
3. **Checklist Tracking**:
   - Track progress using markdown checkboxes (`- [ ]`, `- [x]`).
   - Halt immediately if a verification step fails before proceeding to the next task.
