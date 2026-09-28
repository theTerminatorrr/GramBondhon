# 🌾 GramBandhan (গ্রামীণ বন্ধন) — 3-Tier Enterprise Architecture
## Official Project & Technical Presentation Guide for Supervisor Review

---

## 🏛️ 1. Executive Summary & 3-Tier System Architecture

**GramBandhan** is structured following modern enterprise engineering principles, maintaining strict separation of concerns across **three core tiers**:

```
                                  GRAMBANDHAN ECOSYSTEM
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                   1. FRONTEND TIER                                    │
 │  • Investor Portal    • Farmer Portal    • Admin & Staff Hub    • Village Marketplace │
 │  • Tech Stack: HTML5 Semantic, Modern Modular Vanilla CSS, TypeScript, Vite Bundler  │
 └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / JSON API (/api/v1/*)
                                            ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                   2. BACKEND TIER                                     │
 │  • REST API Gateway & Controllers        • MFS Channels (bKash, Nagad, IBBL)          │
 │  • Base Sepolia Smart Contract Relay     • Zapier Automated Telco & Email Dispatch    │
 │  • Tech Stack: Node.js, NestJS Framework, Web3 viem/ethers, Nodemailer SMTP           │
 └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ SQL Queries & Prisma ORM
                                            ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                   3. DATABASE TIER                                    │
 │  • 16 SRS Domain Entity Tables           • GAAP Double-Entry Ledger System            │
 │  • On-Chain Escrow Hash Receipts         • Real-Time Audit Logs & KYC Vault           │
 │  • Tech Stack: PostgreSQL (Unified DDL Schema), Prisma ORM Models, DB Seeders         │
 └───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 2. Clean Repository Directory Structure

The repository is organized into distinct, self-contained directories:

```
GramBondhon-main/
│
├── 🌐 frontend/                     # Tier 1: Client Application & UI Portals
│   ├── index.html                   # Platform Landing & Gateway Entrypoint
│   ├── homepage.html                # Authentic Hero Section & Agricultural Slideshow
│   ├── investor.html                # Investor Public Portal & Halal Opportunities
│   ├── investor_dashboard.html      # Investor Financial Overview & Live Telemetry
│   ├── investor_projects.html       # 30 Verified Deals & Return Calculator
│   ├── investor_financials.html     # Shariah Capital Outflow & Return Inflow Ledger
│   ├── investor_airisk.html         # AI Yield Prediction & Satellite Rainfall Radar
│   ├── investor_marketplace.html    # Rural Artisan Wholesale & Bulk Investments
│   ├── investor_profile.html        # NID KYC Badge, IBBL Bank & bKash Payout Setup
│   ├── marketplace.html             # Public Village Storefront (100 Authentic Items)
│   ├── orders.html                  # Multi-Stage Real-Time Delivery Tracking
│   ├── login.html & register.html   # Role-Based Auth Portals (1-Click Demo Login)
│   ├── Admin/                       # Admin & Compliance Officer Workspace
│   │   ├── admin.html               # Staff Dashboard (KYC Queue, Deal Approval)
│   │   ├── admin.ts & admin.css     # Staff Control Logic & Verification Engine
│   ├── Farmer/                      # Agricultural Producer Portal
│   │   ├── farmer.html              # Farmer Dashboard (Harvest & Land Management)
│   │   ├── farmer.ts & farmer.css   # Crop Lifecycle & Payout Tracker
│   ├── src/                         # Core Frontend TypeScript Architecture
│   │   ├── api-client.ts            # Centralized API Gateway Client
│   │   ├── main.ts                  # Application Orchestrator & Router
│   │   ├── data.ts                  # Authentic Datasets (Projects & Marketplace)
│   │   └── types.ts                 # Strict TypeScript Domain Interfaces
│   ├── css/                         # Modular CSS Design Tokens & Stylesheets
│   │   ├── base.css                 # Typography & Design System Tokens
│   │   └── style.css                # Master Component Stylesheet
│   └── public/                      # Static Assets, Vectors, Brand Logos
│
├── ⚙️ backend/                      # Tier 2: Business Logic & Blockchain Gateway
│   ├── dev-server.mjs               # High-Performance Node.js REST API Server
│   ├── src/                         # Full NestJS Enterprise Microservices
│   │   ├── auth/                    # JWT Authentication & Role Guards
│   │   ├── deals/                   # Project Crowdfunding & Equity Engine
│   │   ├── blockchain/              # Base Sepolia Smart Contract Interop
│   │   ├── escrow/                  # Non-Custodial Capital Lock & Milestones
│   │   ├── payments/                # bKash / Nagad / Bank Transfer Ledger
│   │   ├── profits/                 # Mudarabah Variable Profit-Sharing Split
│   │   └── ledger/                  # GAAP Double-Entry Accounting Service
│   ├── prisma/                      # Database Schema & Migration Definitions
│   │   └── schema.prisma            # Prisma ORM Model Mapping (PostgreSQL)
│   └── notifications_outbox.jsonl   # Append-Only Persistent Transaction Audit Log
│
├── 🗄️ database/                     # Tier 3: Enterprise Data Tier & Schemas
│   ├── grambandhan_unified_schema.sql # 100% Unified SQL DDL Schema (16 Core Tables)
│   ├── grambandhan_schema.sql       # Modular Domain Entity Definitions
│   ├── DATABASE_HANDOFF.md          # Database Architecture & Integrity Specifications
│   └── seed.js                      # Database Population & Demo Data Seeder
│
├── 📜 contracts/                    # Base Sepolia Smart Contracts (Solidity)
│   ├── AgriPlatform.sol             # Core Agricultural Tokenization & Escrow
│   ├── ShariahEscrow.sol            # Non-Custodial Shariah-Compliant Fund Vault
│   └── ProfitDistribution.sol       # Autonomous Dividend Payout Contract
│
├── vite.config.ts                   # Frontend Bundler Config (Root: 'frontend', Port: 5173)
├── package.json                     # Root Project Orchestration Scripts
├── tsconfig.json                    # Strict TypeScript Compiler Configuration
└── TEACHER_EXPLANATION_GUIDE.md     # Viva / Defense Oral Presentation Guide
```

---

## 🔍 3. Detailed Tier Breakdown for Defense / Viva

### Tier 1: Frontend (Client Layer)
- **Role**: Serves 4 distinct user personas: **Investors**, **Farmers**, **Buyers**, and **Staff/Admin**.
- **Performance**: Powered by **Vite 5** with zero-latency Hot Module Replacement (HMR).
- **Design System**: Hand-crafted Vanilla CSS with responsive CSS Grid/Flexbox, Plus Jakarta Sans typography, and high-contrast dark forest green (`#061D15` / `#02221A`) aesthetic.
- **Resilience**: Integrated with an automatic fallback mechanism in `api-client.ts`. If the backend is under maintenance, client views gracefully fall back to local simulated telemetry without throwing unhandled exceptions.

### Tier 2: Backend (Application & Web3 Layer)
- **Role**: Handles business rules, authentication, KYC state management, transactional notifications, and blockchain communication.
- **REST API Gateway**: Standardized on `/api/v1/*` serving deals, payments, compliance queues, and ledger history.
- **Blockchain Gateway**: Connected to **Base Sepolia Testnet (Chain ID 84532)**. Every capital commitment creates a cryptographic hash proof that is verified in real-time.
- **Automated Notifications**: Real Gmail delivery via SMTP and SMS telco gateway receipts dispatched on every transaction.

### Tier 3: Database (Persistence & Accounting Layer)
- **Role**: Preserves immutable records of all users, farms, projects, investments, orders, and insurance claims.
- **Double-Entry Constraint**: Enforces standard accounting equation:
  $$\sum \text{Debit} \equiv \sum \text{Credit}$$
  Zero-value or negative balance transitions are physically barred at the engine level.
- **Auditability**: All financial transactions generate immutable audit logs with timestamp anchoring and cryptographic transaction IDs.

---

## 🚀 4. How to Demonstrate to Your Supervisor

### Step 1: Start Both Tiers
Open two terminals in the project root:

**Terminal 1 (Backend Gateway):**
```bash
npm run dev:backend
```
*Active on `http://localhost:3001` with Swagger docs at `http://localhost:3001/api/docs`*

**Terminal 2 (Frontend Interface):**
```bash
npm run dev
```
*Active on `http://localhost:5173`*

### Step 2: Key Pages to Showcase
1. **Homepage** (`http://localhost:5173/homepage.html`): Point out the 2.0s continuous slideshow, Halal investment spotlight, and responsive navbar.
2. **Investor Dashboard** (`http://localhost:5173/investor_dashboard.html`): Showcase live balance cards, sector distribution, and verified farmer feeds.
3. **Projects & Calculator** (`http://localhost:5173/investor_projects.html`): Demonstrate the interactive Mudarabah 65/35 profit-sharing calculator.
4. **Financial Ledger** (`http://localhost:5173/investor_financials.html`): Highlight the redesigned 2×2 compact Capital Outflow & Return Inflow Ledger.
5. **Admin Portal** (`http://localhost:5173/Admin/admin.html`): Demonstrate the Staff Compliance Queue, 1-click KYC approval, and Base Sepolia escrow release.
6. **Farmer Portal** (`http://localhost:5173/Farmer/farmer.html`): Show harvest logs, land registry, and disbursement tracking.

---

## 🎯 5. Frequently Asked Questions by Supervisors

| Question | Strong Answer to Provide |
| :--- | :--- |
| **Why did you separate the folders into frontend, backend, and database?** | *"To follow the enterprise 3-tier architecture pattern. This ensures loose coupling and high cohesion—the frontend can be developed or restyled independently of the backend API, and the database schema remains cleanly documented with DDL scripts and ORM models."* |
| **How does the frontend communicate with the backend?** | *"Via Vite's reverse proxy configured in `vite.config.ts`. The frontend sends requests to `/api/v1/*`, which Vite automatically forwards to `http://localhost:3001`. This eliminates CORS issues in development and simulates production reverse-proxy routing (like Nginx)."* |
| **How is financial accuracy maintained?** | *"All monetary amounts use exact Decimal(14,2) representation to prevent floating-point rounding errors, and our database schema enforces strict GAAP double-entry constraints where every debit must balance a corresponding credit."* |
| **What makes the platform Shariah-compliant?** | *"We do not charge fixed interest (Riba). Instead, we use Mudarabah profit-and-loss sharing, where the investor provides capital and the farmer provides labor/expertise, splitting actual harvest yields in an agreed ratio (65% Farmer / 35% Investor)."* |
