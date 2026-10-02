# 🧭 Mandatory Skill Orchestration Matrix

Before writing code or executing tasks, route your process through the specialized skills according to the task phase:

| Phase | Assigned Skill / Tool | Trigger & Responsibility |
| :--- | :--- | :--- |
| **1. Memory & History** | `supermemory` | Consult project history, past architecture decisions, and developer preferences across sessions. |
| **2. Codebase Topology** | `graphify` | When exploring relationships, dependencies, cross-module flows, or database models in `apps/api` or `apps/web`. |
| **3. External Research** | `firecrawl` | When researching third-party libraries, live API documentation, or technical specs on the web. |
| **4. Requirements & Planning** | `superpowers:brainstorming`<br>`prd-creator`<br>`writing-plans` | **Mandatory before non-trivial coding**: Clarify user intent, write specifications, and break features into 2–5 minute testable micro-tasks. |
| **5. Implementation Discipline** | `superpowers:test-driven-development`<br>`systematic-debugging` | Enforce Red-Green-Refactor TDD loop. Never guess bug fixes—diagnose root causes systematically. |
| **6. Visual UI Verification** | `iris` | Whenever modifying frontend components or pages in `apps/web`, capture screenshots from `http://localhost:5173` to verify responsiveness, layout, and visual fidelity. |
| **7. Code Review & Security** | `coderabbit`<br>`vercel-react-best-practices`<br>`web-design-guidelines` | Audit git diffs for vulnerabilities, memory leaks, unnecessary re-renders, and code quality before completing tasks. |
| **8. Autonomous Loops** | `ralph-loop` | For batch or multi-task features: execute exactly **one task per iteration**, test, verify UI with Iris, commit, and advance. |

## ⚙️ Operating Guidelines

- **Strict Skill Routing**: Before writing any implementation code or executing tasks, inspect the task phase and invoke the assigned skill.
- **Verification First**: Verify all changes against live test suites and capture visual UI verification using Iris on `http://localhost:5173`.
- **Atomic Iterations**: For batch features, break down work into testable micro-tasks and advance iteratively using the Ralph loop discipline.
