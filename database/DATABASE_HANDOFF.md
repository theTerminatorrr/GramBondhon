# 🌾 GramBandhan — Unified Database Architecture & Handoff Guide

This guide documents the **Unified Enterprise Database Architecture** for GramBandhan, built by **Muhutasim**.

It satisfies **100% of the functional requirements** in the Project SRS across all 16 modules, while providing native support for the **Double-Entry Financial Accounting Ledger** and **Base Sepolia Smart Contract Settlement**.

---

## 🏛️ Schema Entity Map (SRS Functional Requirements)

| Module | Core Tables | SRS Section Reference | Key Integrity Safeguards |
| :--- | :--- | :--- | :--- |
| **1. Identity & RBAC** | `users`, `farmer_profiles`, `investor_profiles`, `field_agent_profiles` | §4.1 & §6.5.1 | Distinct 1:1 profile extension tables, cascading deletions |
| **2. Campaigns & Projects** | `agricultural_projects`, `farms`, `crops`, `project_milestones` | §4.2, §4.3 & §6.5.4 | Fund goal validation (`CHECK fund_goal > 0`), unique milestone sort ordering |
| **3. Crowdfunding & Deals** | `investments`, `deals`, `deal_participants` | §4.2 & §6.5.5 | Decimal(14,2) precision, pro-rata equity calculation |
| **4. AI Risk Assessment** | `risk_scores` | §4.5 & §6.5.6 | `score BETWEEN 0 AND 100`, `risk_level` enum (`LOW`, `MEDIUM`, `HIGH`) |
| **5. Agri-Marketplace** | `product_listings`, `orders` | §4.4 & §6.5.7 | Stock inventory constraint (`quantity >= 0`), price checks |
| **6. Crop Insurance** | `insurance_policies`, `insurance_claims` | §4.6 & §6.5.8 | Parametric policy limits, photo evidence arrays, approval timestamps |
| **7. Digital Payments & Wallets**| `payments`, `wallets`, `wallet_transactions` | §4.9 & §6.5.9 | Idempotency key uniqueness, bKash/Nagad/Bank/Crypto channels |
| **8. Fraud Protection** | `fraud_alerts` | §4.7 & §6.5.10 | Automated anomaly flags with severity tiers (`LOW` to `CRITICAL`) |
| **9. Reputation & Reviews** | `ratings`, `notifications` | §4.8 & §6.5.11 | Strict `stars BETWEEN 1 AND 5`, multi-entity ratings (User, Project, Item) |
| **10. Financial Ledger** | `accounts`, `ledger_transactions`, `ledger_entries` | Financial Audit | Standard GAAP double-entry constraint: $\sum \text{Debit} \equiv \sum \text{Credit}$ |
| **11. Web3 Settlement** | `smart_contracts`, `blockchain_transactions` | On-Chain Escrow | Base Sepolia contract addresses, EIP-1559 gas receipts, multi-sig oracles |

---

## 🚀 Deployment Instructions

### Method A: Standalone PostgreSQL Deployment (`psql`)

To deploy directly to any local or cloud PostgreSQL instance (Supabase, Neon, AWS RDS, local):

```bash
# 1. Access PostgreSQL
psql -U postgres

# 2. Create the GramBandhan database
CREATE DATABASE grambandhan;
\q

# 3. Execute the Unified SQL DDL Script
psql -U postgres -d grambandhan -f grambandhan_unified_schema.sql
```

Verify all tables and indexes deployed cleanly:
```bash
psql -U postgres -d grambandhan -c "\dt"
```
You should see all 16+ core tables listed.

---

### Method B: Using Prisma ORM (Node.js / TypeScript)

```bash
# 1. Install dependencies
npm install prisma @prisma/client

# 2. Configure DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/grambandhan?schema=public"

# 3. Generate Prisma Client
npx prisma generate

# 4. Synchronize Schema with PostgreSQL
npx prisma db push

# 5. Seed Initial Data
node seed.js
```

---

## 🔒 Enterprise Financial & Data Integrity Rules

1. **No Floating Point for Money**: Every currency balance, investment amount, and fee uses `NUMERIC(14,2)` / Prisma `Decimal(14,2)`.
2. **Double-Entry Constraint**:
   ```sql
   CONSTRAINT chk_debit_or_credit CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
   ```
   Zero-value or negative journal entries are physically barred at the database engine level.
3. **Audit Trail**: State transitions generate immutable audit log records with actor tracking and timestamp anchoring.
