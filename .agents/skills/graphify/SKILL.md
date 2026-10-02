---
name: graphify
description: >-
  Explore relationships, dependencies, cross-module flows, AST topology,
  and database models in frontend and backend codebases.
  Use when analyzing project architecture, tracing imports, or inspecting contract interactions.
---

# Graphify: Codebase Topology & Dependency Analysis

This skill guides the structural mapping of modules, cross-boundary calls, data contracts, and schema dependencies across GramBandhan.

## When to Use
- Tracing data flow between frontend (`homepage.html`, `investor.html`, `marketplace.html`, `src/`) and backend services (`backend/dev-server.mjs`, `backend/surveillance.mjs`).
- Inspecting smart contract topology (`contracts/`, `packages/blockchain-sdk/`).
- Analyzing schema models in `database/` or `prisma/schema.prisma`.

## Procedure

1. **Map Module Boundaries**:
   - Frontend static entrypoints: `index.html`, `homepage.html`, `marketplace.html`, `investor.html`, `orders.html`, `Admin/admin.html`, `Farmer/farmer.html`.
   - TypeScript application modules: `src/main.ts`, `src/marketplace.ts`, `src/investor-profile.ts`, `src/api-client.ts`, `src/chatbot.ts`.
   - Backend APIs: Node.js Express server on port 3001 (`backend/dev-server.mjs`, `backend/surveillance.mjs`).
   - Contracts: Solidity contracts (`AgriPlatform.sol`, `DealFactory.sol`, `Escrow.sol`, `ProfitDistribution.sol`).

2. **Verify Dependencies**:
   - Check `package.json` dependencies and workspaces.
   - Run type checking: `npx tsc --noEmit`.
   - Trace circular dependencies or missing exports across shared modules.
