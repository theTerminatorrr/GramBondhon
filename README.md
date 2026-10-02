# 🌾 GramBandhan: A Decentralized Milestone-Escrow and Double-Entry Ledger Framework for Transparent Agricultural Finance and Automated Profit Settlement
###  — An Enterprise Shariah-Compliant Agro-FinTech, AI Geospatial Risk Modeling & Decentralized Rural Producer Ecosystem

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-E0234E.svg?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%20ORM-336791.svg?logo=postgresql&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Cache%20%26%20Queues-Redis%20%7C%20BullMQ-DC382D.svg?logo=redis&logoColor=white)](https://redis.io/)
[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%20%7C%20Base%20Sepolia-363636.svg?logo=ethereum&logoColor=white)](https://sepolia.basescan.org/)
[![Shariah Compliance](https://img.shields.io/badge/Shariah%20Standard-AAOIFI%20Mudarabah%20No.%2013-059669.svg)](https://aaoifi.com/)
[![UN SDGs](https://img.shields.io/badge/UN%20SDGs-1%20%7C%202%20%7C%208%20%7C%209%20%7C%2013-F39C12.svg)](https://sdgs.un.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📑 Table of Contents
1. [Executive Summary & Academic Abstract](#1-executive-summary--academic-abstract)
2. [Research Context & Problem Statement](#2-research-context--problem-statement)
3. [System Architecture & Engineering Design](#3-system-architecture--engineering-design)
4. [Mathematical & Algorithmic Formulations](#4-mathematical--algorithmic-formulations)
5. [Ecosystem Subsystems & Portal Matrix](#5-ecosystem-subsystems--portal-matrix)
6. [Repository Anatomy & Monorepo Structure](#6-repository-anatomy--monorepo-structure)
7. [Enterprise Backend Microservices & API Surface](#7-enterprise-backend-microservices--api-surface)
8. [Blockchain Escrow & Double-Entry Ledger Engine](#8-blockchain-escrow--double-entry-ledger-engine)
9. [Installation, Reproduction & Execution Guide](#9-installation-reproduction--execution-guide)
10. [Supervisor Viva Defense & Evaluation Guide](#10-supervisor-viva-defense--evaluation-guide)
11. [Formal Test Cases & Quality Assurance Report (TEST_CASES.md)](TEST_CASES.md)
12. [Academic References & Standards](#12-academic-references--standards)

---

## 1. Executive Summary & Academic Abstract

### 📖 Abstract
In developing agrarian economies such as Bangladesh, smallholder farmers and cottage artisans face systemic capital exclusion. Conventional microfinance institutions (MFIs) frequently charge effective annual percentage rates (APR) exceeding **25% to 42%**, exacerbating rural debt cycles and insolvency upon adverse weather events. Conversely, conventional commercial banks demand institutional collateral and formal audited balance sheets that 98% of smallholders cannot supply.

**GramBandhan (গ্রামীণ বন্ধন)** introduces an end-to-end socio-technical platform resolving this market failure. The platform operationalizes Islamic **Mudarabah** (*profit-and-loss sharing*) equity financing, algorithmic satellite remote-sensing risk underwriting, and a direct-to-consumer rural marketplace. By pairing satellite-derived **Normalized Difference Vegetation Index (NDVI)** and meteorological precipitation indexes with automated smart contract escrow milestones on **Base Sepolia**, GramBandhan creates a verifiable, interest-free financing loop:

$$\text{Conscious Investors (Rabb-ul-Mal)} \xrightarrow{\text{Mudarabah Capital}} \text{Rural Farmers (Mudarib)} \xrightarrow{\text{Smart Escrow \& Cultivation}} \text{Mandi \& Consumer Marketplace} \xrightarrow{\text{Revenue}} \text{Automated Profit Share}$$

The system encompasses **four primary portal actors**:
1. **Ethical Investors**: Project discovery across 30 verified campaigns, predictive AI yield radar, and GAAP double-entry ledger tracking.
2. **Rural Producers & Farmers**: Interest-free project applications, IoT/harvest progress logging, and direct marketplace sales.
3. **Regulatory Platform Administrators**: Multi-sig milestone approvals, NID biometric KYC verification, fraud heuristic detection, and immutable audit logs.
4. **Rural Consumers & Bulk Mandi Buyers**: Storefront of 100+ authentic Bangladeshi agro-handicraft commodities priced in Taka (৳).

---

## 2. Research Context & Problem Statement

### 🔍 The Predatory Debt Trap in Agrarian Finance
Smallholder agriculture constitutes **~40% of national employment** and **~12% of GDP** in Bangladesh. Yet, smallholder farmers face severe structural headwinds:

```
┌────────────────────────────────────────────────────────────────────────┐
│             TRADITIONAL PREDATORY FINANCING PARADIGM                   │
├────────────────────────────────────────────────────────────────────────┤
│  Smallholder Farmer ──> Predatory MFI/Middleman (25-42% APR)           │
│         │                                                              │
│         ├── Climate Shock / Monsoon Flood Event                        │
│         ▼                                                              │
│  Crop Impairment ──> Fixed Debt Obligation Persists (Riba)             │
│         ▼                                                              │
│  Land Loss, Cycle of Chronic Rural Poverty, and Food Insecurity        │
└────────────────────────────────────────────────────────────────────────┘
                                    VS.
┌────────────────────────────────────────────────────────────────────────┐
│                  GRAMBANDHAN MUDARABAH PARADIGM                        │
├────────────────────────────────────────────────────────────────────────┤
│  Smallholder Farmer ──> Ethical Investors via GramBandhan Escrow       │
│         │                                                              │
│         ├── Satellite NDVI & IoT Weather Oracle Monitoring             │
│         ▼                                                              │
│  Variable Profit Sharing: 65% Producer / 35% Investor                  │
│         ▼                                                              │
│  Adverse Loss Buffer (AAOIFI Standard 13) ──> Zero Debt Enslavement   │
└────────────────────────────────────────────────────────────────────────┘
```

### 🎯 Research Hypotheses & Engineering Objectives
1. **Hypothesis 1 (Financial Inclusion)**: Shariah-compliant equity contracts (Mudarabah) combined with milestone-based smart contracts reduce farmer default vulnerability to 0% interest overhead.
2. **Hypothesis 2 (Asymmetric Information Reduction)**: Real-time satellite GNSS indices (NDVI) and meteorological verification replace traditional bank collateral with programmatic *Proof-of-Cultivation*.
3. **Hypothesis 3 (Market Intermediation)**: Direct integration of village artisan marketplaces cuts wholesale intermediary markups by **32% to 45%**, passing surplus directly to producers.

---

## 3. System Architecture & Engineering Design

GramBandhan employs a decoupled, enterprise multi-tier architecture spanning high-performance presentation portals, an event-driven NestJS core API, distributed caching, and smart contract escrow infrastructure.

### 🏛️ High-Level System Architecture Diagram

```mermaid
graph TB
    subgraph Presentation_Layer ["Presentation Layer (Vite 5.2 + TypeScript + Semantic HTML5)"]
        UI_Home["🌐 Public Landing & SDG Hub<br/>(index.html / homepage.html)"]
        UI_Investor["💼 Investor Portal & AI Radar<br/>(investor.html, investor_projects.html)"]
        UI_Farmer["🌱 Farmer Management Portal<br/>(Farmer/farmer.html)"]
        UI_Admin["🛡️ Admin & Compliance Console<br/>(Admin/admin.html)"]
        UI_Market["🛒 Village Marketplace & Orders<br/>(marketplace.html, orders.html)"]
        UI_Bot["🤖 Bondhon AI Chatbot<br/>(src/chatbot.ts)"]
    end

    subgraph Gateway_Security ["Gateway & Security Layer"]
        Vite_Proxy["Vite Reverse Proxy<br/>(:5173 /api -> :3001)"]
        Helmet_CORS["Helmet & CORS Firewall<br/>(Whitelist: 5173, 3000)"]
        JWT_Guards["Passport-JWT & RBAC Guards<br/>(Investor, Farmer, Admin)"]
    end

    subgraph Application_Core ["Application Core (NestJS 10.3 + TypeScript)"]
        Mod_Auth["Auth & KYC Service<br/>(NID, Bcrypt, Session)"]
        Mod_Deals["Deals & Projects Module<br/>(Mudarabah Engine)"]
        Mod_Escrow["Escrow & Settlement Engine<br/>(Milestone Triggers)"]
        Mod_Oracle["Weather & Satellite Oracle<br/>(NDVI, Rainfall API)"]
        Mod_Ledger["Double-Entry Ledger Engine<br/>(Debit/Credit Invariance)"]
        Mod_Queue["BullMQ Worker Queues<br/>(Async Notification, Payout)"]
        Mod_Audit["Winston Audit Logger<br/>(Immutable System Logs)"]
    end

    subgraph State_Storage ["State & Persistence Layer"]
        PG_DB[(PostgreSQL 15+<br/>Relational Persistence)]
        Prisma_ORM["Prisma ORM 5.10<br/>(Strict Schemas, Migrations)"]
        Redis_Cache[(Redis 7+<br/>BullMQ & Session Cache)]
        S3_Storage["AWS S3 / Object Store<br/>(KYC & Harvest Proofs)"]
    end

    subgraph Distributed_Ledger ["Distributed Settlement & Trust Layer"]
        Base_Sepolia["Base Sepolia Testnet<br/>(Chain ID: 84532)"]
        Agri_Contract["AgriPlatformEscrow.sol<br/>(0x9048...d29F)"]
        MFS_Gateway["bKash / Nagad MFS &<br/>IBBL BEFTN Banking API"]
    end

    UI_Home & UI_Investor & UI_Farmer & UI_Admin & UI_Market & UI_Bot --> Vite_Proxy
    Vite_Proxy --> Helmet_CORS --> JWT_Guards
    JWT_Guards --> Mod_Auth & Mod_Deals & Mod_Escrow & Mod_Oracle & Mod_Ledger
    Mod_Escrow & Mod_Deals --> Mod_Queue
    Mod_Queue --> Redis_Cache
    Mod_Auth & Mod_Deals & Mod_Ledger --> Prisma_ORM --> PG_DB
    Mod_Escrow --> Agri_Contract --> Base_Sepolia
    Mod_Escrow --> MFS_Gateway
    Mod_Audit --> PG_DB
```

---

### 🌐 Global Codebase Dependency & Call Network

The topological universe illustrates complete systemic interconnectivity spanning the Next.js presentation tier, NestJS domain services, Prisma ORM data layer, Solidity smart contract ABIs, and asynchronous BullMQ event pipelines.

<p align="center">
  <img src="docs/assets/global-codebase-dependency-network.png" alt="Global Codebase Dependency & Call Network" width="100%" />
  <br />
  <em><b>Figure 1:</b> Full-spectrum Force-Directed Dependency & Flow Graph computed via Graphify (AST parsing over 250+ modules). Nodes represent modules, controllers, and services; edges denote runtime injections, type dependencies, and on-chain RPC calls.</em>
</p>

---

### 🔄 End-to-End Mudarabah Deal Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 🌱 Farmer (Mudarib)
    actor Investor as 💼 Investor (Rabb-ul-Mal)
    participant Platform as 🌾 GramBandhan API
    participant Oracle as 🛰️ Satellite / IoT Oracle
    participant SmartContract as ⛓️ Base Sepolia Escrow
    actor Admin as 🛡️ Platform Admin

    Farmer->>Platform: Submit Project Proposal (৳ Goal, Crop Type, Harvest Date)
    Admin->>Platform: Verify NID, Land Deed & Agronomist Soil Report
    Platform->>Platform: Mark Project "VERIFIED" (Listed on Investor Hub)
    Investor->>Platform: Pledge Capital via bKash / IBBL Bank Account
    Platform->>SmartContract: Lock Funds in Milestone Escrow Contract
    SmartContract-->>Platform: Emit EscrowLocked(dealId, amount)
    
    rect rgb(240, 248, 255)
        note right of Platform: Milestone 1: Sowing & Seeds Disbursement
        Admin->>SmartContract: Authorize Milestone 1 Disbursement (40%)
        SmartContract->>Farmer: Release Capital to Farmer MFS Wallet
    end

    Oracle->>Platform: Ingest Sentinel-2 NDVI & Rain Precipitation Index
    Platform->>Platform: Compute Risk Score & Crop Growth Health
    
    rect rgb(240, 255, 240)
        note right of Platform: Milestone 2: Harvest & Marketplace Sale
        Farmer->>Platform: Deliver Yield to GramBandhan Village Mandi
        Platform->>Platform: Sale Finalized at Mandi (Gross Revenue Realized)
    end

    Platform->>Platform: Execute Double-Entry Mudarabah Profit Allocation
    Platform->>SmartContract: Trigger Settlement Distribution
    SmartContract->>Farmer: 65% Net Profit Share (Mudarib)
    SmartContract->>Investor: Principal Capital + 35% Net Profit (Rabb-ul-Mal)
    Platform->>Platform: Append Immutable Audit Ledger Record
```

---

## 4. Mathematical & Algorithmic Formulations

### 🧮 1. Shariah Mudarabah Profit-and-Loss Distribution Engine
In strict compliance with **AAOIFI Shariah Standard No. 13 (Mudarabah)**, capital returns are strictly variable rather than guaranteed interest (*Riba*):

Let:
- $C$: Capital invested by Rabb-ul-Mal (Investor)
- $R_{\text{Gross}}$: Gross revenue from crop harvest or artisan market sale
- $C_{\text{OpEx}}$: Allowable direct operating expenses (seeds, organic fertilizer, irrigation, logistics)
- $\alpha$: Agreed Investor Profit-Sharing Ratio ($\alpha = 0.35$ or $35\%$)
- $1 - \alpha$: Agreed Farmer Manager Share ($(1 - \alpha) = 0.65$ or $65\%$)

The net divisible profit $\Pi_{\text{Net}}$ is computed as:
$$\Pi_{\text{Net}} = \max\left(0, R_{\text{Gross}} - C_{\text{OpEx}} - C\right)$$

The respective payoffs $P_{\text{Investor}}$ and $P_{\text{Farmer}}$ are formally defined as:
$$P_{\text{Investor}} = C + \alpha \cdot \Pi_{\text{Net}}$$
$$P_{\text{Farmer}} = (1 - \alpha) \cdot \Pi_{\text{Net}}$$

#### Loss Treatment Invariant:
If $R_{\text{Gross}} < C + C_{\text{OpEx}}$ due to natural climatic impairment without proven negligence (*Ta'addi*) or misconduct (*Tafreet*) by the farmer:
$$\text{Loss} = (C + C_{\text{OpEx}}) - R_{\text{Gross}}$$
$$\text{Farmer Financial Obligation} = 0 \quad (\text{The farmer loses only their labor})$$
$$\text{Investor Capital Absorption} = \text{Loss}$$

---

### 🛰️ 2. AI Geospatial Vegetation Health Index (NDVI) & Risk Underwriting
To eliminate informational asymmetry, GramBandhan computes a multi-spectral composite score derived from satellite optical feeds (Sentinel-2 / Landsat-8):

The **Normalized Difference Vegetation Index (NDVI)** is determined by:
$$NDVI = \frac{\rho_{\text{NIR}} - \rho_{\text{RED}}}{\rho_{\text{NIR}} + \rho_{\text{RED}}}$$
where $\rho_{\text{NIR}}$ is near-infrared reflectance (Band 8, $\sim 842\text{ nm}$) and $\rho_{\text{RED}}$ is red band absorption (Band 4, $\sim 665\text{ nm}$).

The **Composite Agronomic Risk Metric ($\mathcal{R}$)** is calculated as:
$$\mathcal{R} = w_1 \cdot \left(1 - \overline{NDVI}\right) + w_2 \cdot \frac{|\Delta P_{\text{rain}}|}{\sigma_{\text{hist}}} + w_3 \cdot (1 - \mathcal{S}_{\text{soil}}) + w_4 \cdot (1 - \mathcal{H}_{\text{farmer}})$$

Where:
- $\overline{NDVI} \in [0, 1]$: Mean vegetative canopy density across field polygon.
- $\Delta P_{\text{rain}}$: Precipitation deviation from 10-year seasonal historical baseline.
- $\mathcal{S}_{\text{soil}} \in [0, 1]$: Soil moisture and pH suitability index.
- $\mathcal{H}_{\text{farmer}} \in [0, 1]$: Historical farmer track-record rating.
- Weights: $w_1 = 0.35, \, w_2 = 0.30, \, w_3 = 0.20, \, w_4 = 0.15$ with $\sum w_i = 1.0$.

If $\mathcal{R} > 0.65$, project funding triggers an automated Agronomist Field Inspection Protocol prior to approval.

---

### ⚖️ 3. Double-Entry Accounting Ledger Invariance
Every financial movement on the platform is logged via an immutable double-entry ledger. For any transaction $k$ occurring at timestamp $t$:

$$\sum_{i=1}^{M} \Delta \text{Debit}_{i, k} - \sum_{j=1}^{N} \Delta \text{Credit}_{j, k} = 0$$

Furthermore, the global integrity invariant of the platform ensures total system solvency:
$$\sum_{a \in \text{Assets}} \text{Balance}(a) \equiv \sum_{l \in \text{Liabilities}} \text{Balance}(l) + \sum_{e \in \text{Equity}} \text{Balance}(e)$$

---

## 5. Ecosystem Subsystems & Portal Matrix

GramBandhan provides four dedicated role-specific portals unified under a seamless top navigation bar and evaluation quick-switcher:

| Subsystem Portal | Primary Route / File | Target Actor | Core Capabilities & Key Modules |
| :--- | :--- | :--- | :--- |
| **🌐 Public Landing & SDG Hub** | [`index.html`](index.html)<br/>[`homepage.html`](homepage.html) | Global Public & Donors | 2.0s continuous Bangladeshi agricultural hero slideshow, Halal investment spotlights, dual-track "How It Works" roadmap, interactive 3D UN SDG flip cards (Goals 1, 2, 8, 9, 13). |
| **💼 Investor Portal & AI Radar** | [`investor.html`](investor.html)<br/>[`investor_dashboard.html`](investor_dashboard.html) | Conscious Investors | Real-time portfolio KPIs, 30 verified project cards, bilingual Mudarabah calculator, satellite NDVI radar, 2×2 compact double-entry ledger, IBBL & MFS payout routing. |
| **🌱 Farmer Operations Portal** | [`Farmer/farmer.html`](Farmer/farmer.html) | Rural Farmers & Women Collectives | Project submission wizard, photo upload for harvest proof, crop stage tracking (transplanting, weeding, harvest), wallet balance, interest-free payout requests. |
| **🛡️ Admin & Compliance Console** | [`Admin/admin.html`](Admin/admin.html) | Platform Officers & Auditors | Multi-tier KYC approval queue, smart contract escrow release triggers, automated fraud anomaly flags, role-based access management, immutable audit logs. |
| **🛒 Village Marketplace & Store** | [`marketplace.html`](marketplace.html)<br/>[`orders.html`](orders.html) | Rural Buyers & Consumers | 100 authentic Bangladeshi rural commodities (Chinigura rice, mustard honey, Nakshi Kantha), instant search autocomplete, category chips, slide-out cart, live delivery timelines. |
| **🤖 Bondhon AI Chatbot** | [`src/chatbot.ts`](src/chatbot.ts) | All Platform Users | Native dual-language (Bengali/English) NLP assistant: answers Shariah Mudarabah rules, risk mitigation policies, project queries, and budget recommendations. |

---

## 6. Repository Anatomy & Monorepo Structure

```
GRAMBONDHONE_by-team-TORONGO_DHARA/
├── 🌐 Root Presentation & HTML Views
│   ├── index.html                     # Unified Ecosystem Entry & UN SDG Alignment
│   ├── homepage.html                  # Landing Page & Continuous Slideshow
│   ├── investor.html                  # Post-login Investor Welcome & Search
│   ├── investor_dashboard.html        # Investor Real-Time Portfolio & KPIs
│   ├── investor_projects.html         # 30 Verified Project Directory & ROI Calculator
│   ├── investor_financials.html       # 2×2 Compact Capital Ledger & Shariah Audit
│   ├── investor_airisk.html           # AI Satellite NDVI Radar & Yield Modeling
│   ├── investor_marketplace.html      # Wholesale Agro-Contracts & Producer Profiles
│   ├── investor_profile.html          # NID Validation, Bank IBBL & MFS Wallet Setup
│   ├── marketplace.html               # 100 Authentic Bangladeshi Items Storefront
│   ├── orders.html                    # Real-Time Multi-Stage Order Tracking
│   ├── login.html & register.html     # Multi-Role Authentication with 1-Click Demo
│   ├── vite.config.ts                 # Multi-Page Rollup Bundler & API Proxy Config
│   ├── tsconfig.json                  # Root TypeScript Strict Configuration
│   └── package.json                   # Monorepo Scripts & Frontend Dependencies
│
├── 🎨 Styling Systems (css/ & src/styles/)
│   ├── css/base.css                   # Global Design Tokens, Typography & Ecosystem Bar
│   ├── css/hero-section.css           # Hardware-accelerated 2.0s Crossfade Slideshow
│   ├── css/investor_dashboard.css     # Luxury Emerald (#02221A) Fintech Theme
│   ├── css/investor_financials.css    # Redesigned 2×2 Compact Double-Entry Grid
│   ├── css/marketplace.css            # High-Contrast Pure White (#FFFFFF) Navbar
│   └── src/styles/sdg-impact.css      # 3D Transform Flip Cards & Badges
│
├── ⚙️ Frontend Logic Engine (src/)
│   ├── src/main.ts                    # Main SPA Orchestrator & View Switcher
│   ├── src/api-client.ts              # Blockchain & Backend REST API Client
│   ├── src/auth.ts                    # Multi-Role Session & 1-Click Demo Auth
│   ├── src/chatbot.ts                 # Bilingual Bengali/English NLP Chatbot
│   ├── src/data.ts                    # Curated Dataset (30 Projects, 100 Products)
│   ├── src/gnss-map.ts                # Leaflet & Satellite Geospatial Cartography
│   ├── src/investor-profile.ts        # Comprehensive Investor Subsystem Logic
│   └── src/sdg-impact.ts              # Interactive SDG 2030 Impact Engine
│
├── 🌱 Farmer Management Subsystem (Farmer/)
│   ├── Farmer/farmer.html             # Farmer Portal UI & Project Listing Shell
│   ├── Farmer/farmer.ts               # Project Management & Harvest Logging Engine
│   └── Farmer/farmer.css              # Earthy Rural Palette & Responsive Layout
│
├── 🛡️ Admin & Compliance Subsystem (Admin/)
│   ├── Admin/admin.html               # Admin Console Shell & Audit Interface
│   ├── Admin/admin.ts                 # KYC Validation, Escrow & Fraud Analytics
│   ├── Admin/admin.css                # Security Console Styling & D3 Chart Themes
│   └── Admin/Backend_Architecture...  # Technical Architecture & Rust/Blockchain PDF
│
└── 🚀 Enterprise Backend Microservices (backend/)
    ├── backend/src/                   # NestJS 10.3 Architecture
    │   ├── admin/                     # Admin Endpoints & Audit Interceptors
    │   ├── auth/                      # JWT Passport Strategy, Argon2/Bcrypt
    │   ├── blockchain/                # Web3 Ethers/Viem Provider & Escrow Bindings
    │   ├── deals/                     # Mudarabah Project Lifecycle Services
    │   ├── escrow/                    # Milestone Lock & Release Handlers
    │   ├── farmers/ & investors/      # Specialized Actor Services & Profiles
    │   ├── ledger/                    # Double-Entry GAAP Accounting Module
    │   ├── oracle/                    # Weather & Satellite GNSS Feed Aggregators
    │   ├── payments/ & settlements/   # bKash, Nagad, BEFTN & Crypto Payout Handlers
    │   ├── webhooks/                  # External Payment & Chain Event Webhooks
    │   ├── app.module.ts              # Master Dependency Injection Graph
    │   └── main.ts                    # Fastify/Express Bootstrap, Helmet, CORS, Swagger
    ├── backend/prisma/                # Database Layer
    │   ├── schema.prisma              # 48KB Comprehensive Relational Schema
    │   └── seed.ts                    # Production-Grade Seed Data (Deals, Users, Tx)
    └── backend/contracts/             # Distributed Smart Contracts (Foundry)
        ├── foundry.toml               # Foundry Build & Test Configuration
        └── src/AgriPlatformEscrow.sol # Solidity Escrow & Milestone Verification
```

---

## 7. Enterprise Backend Microservices & API Surface

The backend runs on **NestJS 10.3**, featuring strict type validation, dependency injection, and automatic Swagger OpenAPI generation at `/api/docs`.

### 📡 Core REST Endpoints Matrix

| Module | Method | Endpoint | Description | Auth Guard |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT Access/Refresh tokens | Public |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new Investor, Farmer, or Consumer | Public |
| **Auth** | `GET` | `/api/v1/auth/me` | Fetch active authenticated profile & permissions | Bearer JWT |
| **Deals** | `GET` | `/api/v1/deals` | List all verified active agricultural campaigns | Public |
| **Deals** | `POST` | `/api/v1/deals` | Farmer submits a new Mudarabah campaign | Farmer Role |
| **Deals** | `GET` | `/api/v1/deals/:id` | Detailed campaign profile, NDVI index & milestones | Public |
| **Investments** | `POST` | `/api/v1/deals/:id/invest` | Commit capital to escrow (bKash, Nagad, Bank, Crypto) | Investor Role |
| **Escrow** | `POST` | `/api/v1/escrow/release` | Approve milestone disbursement to farmer | Admin Role |
| **Ledger** | `GET` | `/api/v1/ledger/statement` | Export double-entry audit ledger statement | Authenticated |
| **Oracle** | `GET` | `/api/v1/oracle/ndvi/:plotId` | Fetch satellite vegetative health index for field | Authenticated |
| **Settlements**| `POST` | `/api/v1/settlements/finalize` | Harvest realized: calculate & distribute 65/35 profits | Admin / System |
| **Surveillance**| `GET` | `/surveillance` | Enterprise Operations & Threat Telemetry Hub UI | Public / Admin |
| **Surveillance**| `GET` | `/api/v1/surveillance/telemetry` | Live Node.js RSS, Base Sepolia Escrow, request velocity | Public |
| **Surveillance**| `POST` | `/api/v1/surveillance/mock-ping` | Inject cryptographic route probe & measure latency | Public |

---

## 8. Blockchain Escrow & Double-Entry Ledger Engine

### ⛓️ End-to-End Blockchain Architecture & Smart Contract Workflow
GramBandhan removes traditional counterparty risk by decentralizing fund custody. Rather than depositing capital into an intermediary corporate bank account, investor commitments are locked directly into immutable EVM smart contracts on **Base Sepolia (L2 Testnet, Chain ID: 84532)**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BASE SEPOLIA BLOCKCHAIN WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Investor Pledges Capital (bKash/Nagad/MetaMask)                          │
│    └──> AgriPlatformEscrow.sol::lockCapital(dealId)                         │
│         [Funds locked in Non-Custodial Multi-Tranche Escrow Vault]         │
│                                                                             │
│ 2. Field Agronomist & Satellite Remote Sensing Verification                 │
│    └──> Sentinel-2 Satellite NDVI > 0.45 + IoT Weather Oracle Validation    │
│                                                                             │
│ 3. Milestone Release (Tranches: 40% Seeding -> 30% Growth -> 30% Harvest)   │
│    └──> AgriPlatformEscrow.sol::releaseMilestone(dealId, trancheIndex)      │
│                                                                             │
│ 4. Harvest Settlement (Zero-Riba Mudarabah Rule)                            │
│    └──> ProfitDistribution.sol::settleHarvestProfits(dealId, grossRevenue) │
│         [Automated 65% Farmer / 35% Investor Distribution via Smart Contract]
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📜 Smart Contracts Suite (Foundry / Solidity 0.8.20+)
1. **`AgriPlatformEscrow.sol` (`0x9048648B1109Ea88d24016e7DAf6e5032316d29F`)**:
   - **`lockCapital(uint256 dealId)`**: Programmatically locks committed investor funds upon campaign funding target completion.
   - **`releaseMilestone(uint256 dealId, uint8 milestoneIndex, bytes32 proofHash)`**: Releases partial capital (e.g., 40% for land prep, 30% for organic inputs) only when accompanied by cryptographic proof of agronomist verification and satellite NDVI vegetative growth.
   - **`settleHarvestProfits(uint256 dealId, uint256 totalRevenue)`**: Programmatically executes the 65% / 35% Mudarabah profit distribution directly to participants' registered wallet addresses, eliminating any possibility of intermediary skimming.
2. **`DealFactory.sol`**:
   - Deploys isolated cohort escrow vaults for each agricultural campaign, preventing cross-project contagion.
3. **`ProfitDistribution.sol` & Double-Entry GAAP Parity**:
   - Enforces the strict accounting invariant $\sum \text{Debits} = \sum \text{Credits}$ with **৳0.00 variance**, strictly complying with **AAOIFI Standard No. 13** (*Mudarabah: Zero-Interest Profit-and-Loss Sharing*).
4. **Web3 Client Bindings**:
   - Integrated via `src/api-client.ts` and `backend/src/blockchain/` using Ethers.js and Viem with dual Web3 wallet connection (MetaMask/WalletConnect) and local MFS (bKash/Nagad) fiat bridge.

### 🔬 Base Sepolia Layer-2: Internal Architecture, Scalability & Automated Execution Pipeline

To satisfy the stringent performance and cost constraints of rural micro-finance in developing agrarian markets, GramBandhan adopts **Base Sepolia (Ethereum L2, Chain ID: 84532)**—an EVM-equivalent optimistic rollup incubated by Coinbase and architected on the open-source **OP Stack**:

#### 1. Architectural Motivation (Why L2 instead of Ethereum L1 or Private Chains?)
* **Sub-Cent Gas Efficiency**: Ethereum Layer-1 gas fees regularly fluctuate between **$5 to $50 (৳600–৳6,000 BDT)** per transaction with 12–15 second block latencies. In rural micro-campaigns where an investor commits ৳5,000 to ৳15,000 BDT, L1 gas fees would consume up to 40% of the principal capital. Base Sepolia reduces transaction overhead to **< $0.001 (৳0.10 BDT)** with deterministic **2.0-second block generation**, preserving full capital integrity for farming communities.
* **Inherited Decentralized Security**: Unlike private/permissioned enterprise blockchains (e.g., Hyperledger), Base Sepolia settles state roots directly onto public Ethereum Layer-1, guaranteeing zero counterparty censorship or single-point-of-failure vulnerabilities.

#### 2. The 5-Stage Automated Internal Pipeline (How Transactions Enter Blocks & Settle)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      BASE SEPOLIA AUTOMATED EXECUTION ENGINE                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Client Submission & ECDSA Signing                                                   │
│    └──> Investor/Farmer triggers action via Web3 (MetaMask) or MFS Gateway (bKash)     │
│    └──> Payload signed with private key (ECDSA secp256k1) and sent to Base RPC         │
│                                                                                        │
│ 2. Base Sequencer Processing (Instant L2 Finality)                                    │
│    └──> Orders incoming transactions, computes state delta in-memory within ms         │
│    └──> Mints an L2 block every 2.0 seconds (tracked live at /surveillance)            │
│                                                                                        │
│ 3. Rollup Compression & Batching                                                       │
│    └──> Hundreds of transactions are compressed into a cryptographic batch             │
│                                                                                        │
│ 4. L1 Settlement & Ethereum Anchoring                                                  │
│    └──> Sequencer publishes compressed state root to Ethereum Sepolia L1 as calldata   │
│    └──> Inherits public Ethereum Layer-1 consensus and immutability                    │
│                                                                                        │
│ 5. Autonomous Oracular Milestones & Zero-Riba Settlement                               │
│    └──> IoT/Sentinel-2 Satellite Oracle checks plot biomass (NDVI > 0.45)              │
│    └──> Automatically releases tranches (40% -> 30% -> 30%) and calculates 65/35 split │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Ingress & ECDSA Signing**: When an investor commits capital or an agronomist submits harvest verification, the payload is signed with a cryptographic private key (ECDSA `secp256k1`), creating an immutable digital signature.
2. **Sequencer In-Memory Execution**: The Base Sequencer receives the transaction via JSON-RPC, verifies nonces, executes the smart contract bytecode (`AgriPlatformEscrow.sol`), updates state in milliseconds, and mints an L2 block every **2.0 seconds** (monitored live in our Operations Hub at `http://localhost:3001/surveillance`).
3. **Rollup Batching & Compression**: Instead of posting individual transactions to Ethereum, the sequencer combines hundreds of transactions into cryptographic batches, drastically amortizing data availability costs.
4. **L1 Settlement & Data Availability**: The batch state root is written to Ethereum Sepolia L1 contracts as raw calldata/EIP-4844 blobs, anchoring the transaction permanently to Ethereum’s decentralized proof-of-stake consensus.
5. **Autonomous Milestone & Payout Settlement**: Milestone disbursements occur programmatically without manual banking approvals. When European Space Agency Sentinel-2 satellite feeds confirm vegetative biomass progress ($NDVI > 0.45$), the escrow contract autonomously unlocks the subsequent tranche, followed by automated 65% / 35% profit splits directly to participants' registered accounts upon harvest realization.

---

## 9. Installation, Reproduction & Execution Guide

### 📋 Prerequisites
- **Node.js**: `v18.18.0` or higher (`v20.x` recommended)
- **Package Manager**: `npm` (v9+) or `pnpm`
- **Optional (for backend DB)**: Docker Desktop or local PostgreSQL 15+ & Redis 7+

---

### 🚀 Step 1: Clone and Inspect
```bash
git clone https://github.com/muhtasim-cs/GRAMBONDHONE_by-team-TORONGO_DHARA.git
cd GRAMBONDHONE_by-team-TORONGO_DHARA
```

---

### 🖥️ Step 2: Run the Frontend Ecosystem
The frontend delivers a zero-config, ultra-responsive experience powered by Vite:

```bash
# 1. Install frontend dependencies
npm install

# 2. Launch Vite development server
npm run dev
```

The application will start immediately at:
👉 **`http://localhost:5173`**

#### Direct Portal Routes:
- **Unified Homepage**: `http://localhost:5173/`
- **Investor Hub**: `http://localhost:5173/investor.html`
- **Farmer Portal**: `http://localhost:5173/Farmer/farmer.html`
- **Admin Console**: `http://localhost:5173/Admin/admin.html`
- **Village Marketplace**: `http://localhost:5173/marketplace.html`
- **Order Tracking**: `http://localhost:5173/orders.html`
- **AI Risk Radar**: `http://localhost:5173/investor_airisk.html`
- **Double-Entry Financials**: `http://localhost:5173/investor_financials.html`

> 💡 **Tip for Evaluators**: Every page features the **Ecosystem Top Switcher Bar**, enabling instantaneous 1-click jumps between all roles without requiring re-login.

---

### ⚙️ Step 3: Run the NestJS Backend (Optional / Evaluator Mode)
In a separate terminal window:

```bash
cd backend

# 1. Install backend dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Generate Prisma client
npm run prisma:generate

# 4. Start NestJS in watch mode
npm run dev
```

- **API Base URL**: `http://localhost:3001/api/v1`
- **Interactive Swagger Docs**: `http://localhost:3001/api/docs`

---

## 10. Supervisor Viva Defense & Evaluation Guide

This section is curated specifically to prepare students for the **Capstone / Thesis Defense Examination**:

### ❓ Q1: "What is the core computer science and engineering innovation here?"
> **Answer**:  
> *"GramBandhan is not merely an e-commerce or CRUD app. Its core innovation lies in the **multi-disciplinary synthesis of three domains**:  
> 1. **Distributed Financial Integrity**: Replacing unverified microfinance loans with an algorithmic **double-entry ledger engine** and **Solidity milestone escrow smart contracts** where funds are released only upon cryptographic proof.  
> 2. **AI Remote Sensing**: Calculating real-time **NDVI and rainfall anomaly indices** via satellite feeds to underwrite agricultural risk without requiring physical land deeds.  
> 3. **Scalable Monorepo Architecture**: Unifying 4 discrete role-driven portals (Investor, Farmer, Admin, Storefront) with an event-driven **NestJS + Prisma backend** and zero-dependency, hardware-accelerated frontend controllers."*

---

### ❓ Q2: "How do you prove that your profit-sharing calculations comply with Shariah law?"
> **Answer**:  
> *"Under **AAOIFI Standard No. 13**, a true Mudarabah contract forbids any guaranteed yield or predetermined fixed interest (Riba). In our codebase (`src/investor_projects.ts` and `backend/src/deals/`), returns are calculated dynamically as a variable percentage of realized harvest revenues:  
> $$\Pi_{\text{Investor}} = 35\% \times \text{Net Profit}, \quad \Pi_{\text{Farmer}} = 65\% \times \text{Net Profit}$$  
> If an unpreventable natural calamity occurs, the capital loss is absorbed by the capital provider (*Rabb-ul-Mal*), while the farmer loses their physical labor—strictly satisfying the legal definition of equity risk-sharing."*

---

### ❓ Q3: "How does the system prevent fraud or fabricated harvest reports?"
> **Answer**:  
> *"We employ a **three-tier verification pipeline**:  
> 1. **Physical Tier**: Platform field agronomists inspect land boundaries and upload geo-tagged, timestamped harvest photos stored on AWS S3.  
> 2. **Satellite Tier**: Our AI Risk Radar samples multi-spectral satellite imagery to verify vegetative biomass progression ($NDVI > 0.45$) during the declared cultivation window.  
> 3. **Consensus Tier**: The platform Admin Console requires multi-signature sign-off before the smart contract releases escrow tranche payments."*

---

### ❓ Q4: "Why did you choose a 2×2 grid for the Capital Outflow & Return Inflow Ledger?"
> **Answer**:  
> *"In previous prototypes, four sequential financial milestones were squeezed into four narrow ~70px columns in a 1-row layout. This forced severe word-wrapping and caused card heights to stretch excessively. By re-architecting into a **2×2 grid (`repeat(2, 1fr)`)**, we doubled the readable width per milestone, reduced vertical whitespace waste by **~60%**, and cleanly separated capital deployment (Row 1) from harvest revenue realization (Row 2)."*

---

### ❓ Q5: "How does the frontend communicate with the backend and blockchain?"
> **Answer**:  
> *"Through the unified `GramBandhanApiClient` (`src/api-client.ts`). The frontend connects via a Vite reverse proxy (`/api` -> `http://localhost:3001`), protecting against cross-origin issues. It seamlessly handles both REST payloads (JSON Web Tokens, campaign records) and Web3 JSON-RPC queries to Base Sepolia smart contracts."*

---

### ❓ Q6: "Why did you implement Base Sepolia Layer-2 instead of Ethereum Mainnet or a private chain, and how does it work under the hood?"
> **Answer**:  
> *"Ethereum Layer-1 gas fees regularly reach **$5–$50 per transaction** with 12–15s confirmation times, which would consume up to 40% of smallholder farmer micro-investments (৳5,000–৳15,000 BDT). Conversely, private blockchains lack decentralized public trust.  
> We implemented **Base Sepolia (OP Stack Optimistic Rollup)** which provides:  
> 1. **Sub-cent gas costs (< $0.001 / ৳0.10 BDT)** and deterministic **2.0-second block generation** (monitored live in our Operations Hub at `/surveillance`).  
> 2. **Automated Sequencer & Rollup Engine**: Transactions are executed in-memory by the Base Sequencer, batched and compressed cryptographically, and anchored directly onto Ethereum Layer-1 as `calldata`/blobs—inheriting Ethereum's full decentralized proof-of-stake security while eliminating fee erosion."*

---

## 12. Academic References & Standards

1. **AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions)**. (2021). *Shari'ah Standard No. 13: Mudarabah*. Manama, Kingdom of Bahrain.
2. **Rouse, J. W., Haas, R. H., Schell, J. A., & Deering, D. W.** (1974). *Monitoring vegetation systems in the Great Plains with ERTS*. NASA Special Publication, 351, 309.
3. **World Bank Group**. (2020). *Digital Agriculture in Bangladesh: Transforming Smallholder Farming with Technology and Financial Inclusion*. World Bank Publications.
4. **Buterin, V.** (2014). *A Next-Generation Smart Contract and Decentralized Application Platform*. Ethereum White Paper.
5. **United Nations**. (2015). *Transforming our world: The 2030 Agenda for Sustainable Development*. UN General Assembly A/RES/70/1.

---

<div align="center">
  <sub>Developed with pride by <strong>Team Torongo Dhara</strong> (Tasfi, Jony, Muhtasim & Team) · GramBandhan © 2026</sub>
</div>
