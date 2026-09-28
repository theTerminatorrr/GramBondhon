# 🌱 GramBandhan — Enterprise Backend Architecture

Welcome to the backend service for **GramBandhan** — a decentralized, digital agricultural financing and profit-sharing ecosystem connecting rural farmers with institutional and retail investors through transparent milestone escrow and blockchain verification.

Developed and maintained by **Muhutasim** for the GramBandhan team.

---

## 🏛️ System Architecture

The backend is built as an enterprise-grade modular system using **NestJS**, **Prisma ORM**, **PostgreSQL**, and **Base Sepolia Smart Contracts**:

```
backend/
├── src/                          # NestJS Application Source Code
│   ├── auth/                     # JWT authentication, guards, refresh tokens & RBAC
│   ├── admin/                    # Admin verification, risk assessment, financial reports
│   ├── users/                    # Profile management & role routing
│   ├── farmers/                  # Farmer registration, land documents, KYC verification
│   ├── farms/                    # Farm land coordinates, crop history & inspections
│   ├── investors/                # Investor profiles, risk tiers, KYC submissions
│   ├── projects/                 # Agricultural projects, milestones, progress proofs
│   ├── crops/                    # Crop catalog, market price feeds, yield estimations
│   ├── deals/                    # Investment deal creation, terms, lifecycle management
│   ├── investments/              # Fund commitments, ledger entries, investor tracking
│   ├── escrow/                   # Milestone-locked escrow holding & release checks
│   ├── profits/                  # Post-harvest profit calculation & revenue sharing
│   ├── settlements/              # Payout processing, bank/bKash/Nagad withdrawals
│   ├── ledger/                   # Double-entry internal accounting ledger & audit logs
│   ├── blockchain/               # Base Sepolia EVM integration & contract synchronization
│   ├── oracle/                   # Harvest attestation, revenue verification, weather data
│   ├── notifications/            # Transactional emails (SMTP), system alerts, BullMQ queue
│   ├── webhooks/                 # Zapier & payment gateway integration webhooks
│   ├── common/                   # Global filters, interceptors, decorators & utility functions
│   └── database/                 # Prisma client lifecycle management
├── prisma/                       # Prisma Schema, Migrations & Database Seeders
│   ├── schema.prisma             # Full relational schema (16+ interconnected tables)
│   └── seed.ts                   # Realistic test data (Admin, Farmers, Projects, Deals)
├── contracts/                    # Solidity 0.8.20 Smart Contracts (Base Sepolia)
│   ├── src/                      # AgriPlatform, DealContract, Escrow, ProfitDistribution
│   └── test/                     # Foundry smart contract test suites
├── indexer/                      # High-throughput Rust event indexer service
│   ├── Cargo.toml
│   └── src/                      # Real-time WebSocket block listener & DB sync
├── Dockerfile                    # Optimized multi-stage Docker build
├── docker-compose.yml            # One-click Postgres + Redis + API stack
└── .env.example                  # Environment configuration template
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v16.x`
- **Redis**: `v7.x` (for BullMQ queues & caching)

### 1. Installation

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the template configuration file:

```bash
cp .env.example .env
```

Open `.env` and configure your local PostgreSQL database URL and JWT secret:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/grambandhan?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-min-32-chars"
```

### 3. Initialize Database & Seed Sample Data

Run Prisma migrations to create all database tables and seed test accounts:

```bash
# Generate Prisma Client
npx prisma generate

# Push Schema to PostgreSQL
npx prisma db push

# Seed Sample Data (Admin, Farmers, Investors, Projects)
npm run prisma:seed
```

**Default Seed Credentials:**
- **Admin**: `admin@agriplatform.com` / `admin123`
- **Farmer**: `farmer@agriplatform.com` / `farmer123`
- **Investor**: `investor@agriplatform.com` / `investor123`

### 4. Run Development Server

```bash
# Start NestJS in watch mode (auto-reload on changes)
npm run start:dev

# Or launch the zero-dependency dev server:
npm run dev:fast
```

The API will be available at: **`http://localhost:3001/api/v1`**

---

## 📚 API Documentation (Swagger)

Once the backend server is running, explore and test all 80+ endpoints interactively via the built-in Swagger UI:

👉 **`http://localhost:3001/api/docs`**

### Core Endpoint Groups

| Group | Path Prefix | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | User registration, login, JWT refresh tokens, role verification |
| **Admin** | `/api/v1/admin` | Platform metrics, farmer approvals, risk scores, withdrawal review |
| **Farmers** | `/api/v1/farmers` | Farmer profiles, land deeds, identity documents |
| **Projects**| `/api/v1/projects`| Project funding requests, milestone verification, budget tracking |
| **Deals** | `/api/v1/deals` | Profit-sharing contract terms, investor agreements |
| **Escrow** | `/api/v1/escrow` | Milestone funds holding, release authorizations |
| **Profits** | `/api/v1/profits` | Harvest revenue accounting, investor dividend distribution |
| **Blockchain** | `/api/v1/blockchain` | Base Sepolia on-chain transaction hash verification & smart contract status |

---

## ⛓️ Blockchain & Smart Contract Integration

The backend interacts with smart contracts deployed on **Base Sepolia**:

- **AgriPlatform**: Master platform registry & access controls (`0x9048648B1109Ea88d24016e7DAf6e5032316d29F`)
- **DealContract**: On-chain deal term enforcement
- **Escrow**: Milestone fund locking & transparent release
- **ProfitDistribution**: Cryptographic profit share allocation

The contract sources and tests reside in `backend/contracts/`.

---

## 🐳 Docker Deployment

To launch the complete backend environment (PostgreSQL 16, Redis 7, and NestJS API) with a single command:

```bash
docker compose up -d --build
```

---

## 🧪 Testing & Code Quality

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e

# Code style linting
npm run lint
```
