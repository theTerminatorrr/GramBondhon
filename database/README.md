# 🌾 GramBandhan — Enterprise Database Repository

This repository contains the complete **Unified Database Architecture, DDL SQL Schemas, Prisma ORM Models, and Seeding Scripts** for the GramBandhan Rural Agri-FinTech Platform.

---

## 📁 Repository Contents

| File | Description |
| :--- | :--- |
| **`DATABASE_HANDOFF.md`** | Complete architectural documentation, SRS mapping, and integrity rules. |
| **`grambandhan_unified_schema.sql`** | Full PostgreSQL DDL script with all 16 modules, tables, constraints, foreign keys, and indexes. |
| **`grambandhan_schema.sql`** | Core relational entity schema definitions. |
| **`schema.prisma`** | Complete Prisma ORM schema models matching the PostgreSQL database. |
| **`seed.js`** | Automated database population script with realistic demo data (users, farms, projects, deals). |

---

## 🚀 Deployment & Active Connection

### Option 1: Built-in Native Persistent Engine (Active Out-of-the-Box)
The application now includes an embedded, zero-dependency persistent relational engine:
- **Database File**: `database/grambandhan.db` (Managed via `backend/db.mjs`)
- **Status API**: `http://localhost:3001/api/v1/database/status`
- **Tables API**: `http://localhost:3001/api/v1/database/tables`
- **Admin Visual Inspector**: Open `Admin/admin.html#/database` to view live tables, row counts, and data.

### Option 2: Standalone PostgreSQL (`psql`)
```bash
# 1. Connect to PostgreSQL
psql -U postgres

# 2. Create the database
CREATE DATABASE grambandhan;
\q

# 3. Run the complete Unified SQL Schema
psql -U postgres -d grambandhan -f grambandhan_unified_schema.sql
```

### Option 3: Using Prisma ORM
```bash
# 1. Install Prisma
npm install prisma @prisma/client

# 2. Set DATABASE_URL in your .env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/grambandhan?schema=public"

# 3. Synchronize schema with database
npx prisma db push

# 4. Run data seeder
node seed.js
```

---

## 🔒 Financial Integrity Safeguards
- **Exact Numeric Representation**: Monetary balances and investment sums use `NUMERIC(14,2)` to prevent floating-point rounding errors.
- **Double-Entry Constraint**:
  $$\sum \text{Debit} \equiv \sum \text{Credit}$$
  Zero-value or negative balance entries are rejected at the engine level.
- **Mudarabah Compliance**: 65% Grower / 35% Investor profit-sharing ratio without fixed interest (Riba).
