---
name: supermemory
description: >-
  Consult project history, past architecture decisions, knowledge items,
  conversation transcripts, and developer preferences across sessions.
  Use whenever starting a task, recalling past user constraints, or checking established patterns.
---

# Supermemory: Project History & Long-Term Context

This skill governs retrieval and persistence of project history, architectural decisions, past user instructions, and cross-session knowledge.

## When to Use
- Starting any major architectural change or multi-step feature.
- Checking past user decisions, preferred styling, or rejected implementations.
- Recalling credentials, endpoints, port configurations, and repository conventions.

## Procedure

1. **Check Local Knowledge Items (KIs)**:
   - Check `<appDataDir>\knowledge` and conversation transcripts under `<appDataDir>\brain\<conversation-id>\.system_generated\logs\transcript.jsonl`.
   - Inspect existing architectural reports (e.g., `TEACHER_EXPLANATION_GUIDE.md`, `README.md`, `SUPERVISOR_PRESENTATION_ARCHITECTURE.md`).

2. **Recall Workspace Context**:
   - Web server running on `http://localhost:5173` (Vite dev server).
   - Backend surveillance & API server running on `http://localhost:3001` (`backend/dev-server.mjs`).
   - Project: GramBandhan (GramBondhon) - Agritech & FinTech platform connecting rural Bangladeshi farmers directly with institutional & retail investors via smart contracts, AI crop analytics, and marketplace.

3. **Store New Decisions**:
   - Whenever an important architecture pattern or user preference is established, record it in documentation or artifacts for future sessions.
