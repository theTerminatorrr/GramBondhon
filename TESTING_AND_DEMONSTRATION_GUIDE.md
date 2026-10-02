# 🧪 GramBandhan — Enterprise Testing & Demonstration Master Guide

> **Official Evaluation & Presentation Reference Manual**  
> **Platform:** GramBandhan (গ্রামীণ বন্ধন) — Shariah-Compliant Agro-FinTech, AI Risk Modeling & Rural Marketplace Collective  
> **Blockchain Network:** Base Sepolia Testnet (EVM Chain ID `84532`)  
> **Test Suite Coverage:** 26/26 Test Cases Passed (100% Green Scorecard)  
> **Repository:** Monorepo Workspace (`apps/web`, `backend`, `contracts`, `packages/blockchain-sdk`)

---

## 📑 Table of Contents

1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [How to Run the Automated Test Suite](#2-how-to-run-the-automated-test-suite)
3. [Test Suite Architecture & Verification Matrix](#3-test-suite-architecture--verification-matrix)
4. [Step-by-Step Live Demonstration Script for Evaluators](#4-step-by-step-live-demonstration-script-for-evaluators)
   - [Stage 1: Terminal Test Execution & Security Verification](#stage-1-terminal-test-execution--security-verification-cli)
   - [Stage 2: Live Sentinel Surveillance Hub](#stage-2-live-sentinel-surveillance-hub-3001surveillance)
   - [Stage 3: Bondhon AI Chatbot & Investor KYC Gatekeeping](#stage-3-bondhon-ai-chatbot--investor-kyc-gatekeeping-5173)
   - [Stage 4: Unified Multi-Role Lifecycle & Cross-Role Access](#stage-4-unified-multi-role-lifecycle--cross-role-access)
   - [Stage 5: Live Blockchain Proof & Real SMTP Mail Dispatch](#stage-5-live-blockchain-proof--real-smtp-mail-dispatch)
5. [Summary Scorecard & Compliance Invariants](#5-summary-scorecard--compliance-invariants)

---

## 1. Executive Summary & Purpose

This document provides a comprehensive, end-to-end guide for running, verifying, and demonstrating the **GramBandhan** system to academic supervisors, technical evaluators, and investor committees.

GramBandhan bridges rural agriculture with ethical capital through three core innovations:
1. **Zero-Interest (Riba-free) Profit-Sharing:** Mathematical enforcement of Musharakah and Mudarabah contracts.
2. **Cryptographic Escrow & Milestone Governance:** Smart contract milestone disbursements anchored on Base Sepolia.
3. **Unified Multi-Role Architecture:** Seamless lifecycle transitioning between Farmers, Investors, and Marketplace Buyers without redundant signups.

All system invariants, endpoints, cryptographic primitives, and KYC gatekeeping rules are covered by automated unit and integration tests.

---

## 2. How to Run the Automated Test Suite

Ensure the local backend server is running on port `3001` (or launched automatically via dev commands). In the root workspace directory, run:

```bash
# Standard npm test command
npm test

# Alternatively, run via Node directly
node tests/run-all-tests.mjs

# Run dedicated dual-authentication unit tests
npm run test:auth
```

### Expected Output

```text
🌾 =========================================================================
   GRAMBANDHAN (গ্রামীণ বন্ধন) — AUTOMATED ECOSYSTEM TEST SUITE
=========================================================================

▶ SUITE 1: Dual-Authentication & Cryptographic Security (9 Endpoints)
  ● [Auth] 1. POST /api/v1/auth/register (Bcrypt Sanitization)... ✓ PASSED (0.3ms)
  ● [Auth] 2. POST /api/v1/auth/login (JWT Access & Refresh Token Pair)... ✓ PASSED (0.3ms)
  ● [Auth] 3. POST /api/v1/auth/refresh (Token Rotation & Session Extension)... ✓ PASSED (0.3ms)
  ● [Auth] 4. POST /api/v1/auth/web3/nonce (Cryptographic Nonce Generation)... ✓ PASSED (0.4ms)
  ● [Auth] 5. POST /api/v1/auth/web3/login (EVM Address Verification)... ✓ PASSED (0.2ms)
  ● [Auth] 6. GET /api/v1/auth/me (Protected Profile Sanitization)... ✓ PASSED (0.1ms)
  ● [Auth] 7. POST /api/v1/auth/logout (Session Revocation)... ✓ PASSED (0.1ms)
  ● [Auth] 8. POST /api/v1/auth/forgot-password (Email Token Dispatch)... ✓ PASSED (0.1ms)
  ● [Auth] 9. POST /api/v1/auth/reset-password (Password Update Validation)... ✓ PASSED (0.1ms)

▶ SUITE 2: Live Backend REST API & Shariah Agriculture Cohorts (6 Endpoints)
  ● [Backend] 1. GET /api/v1/deals (Active Halal Agricultural Deals)... ✓ PASSED (48.1ms)
  ● [Backend] 2. GET /api/v1/blockchain/status (Base Sepolia EVM 84532)... ✓ PASSED (2.5ms)
  ● [Backend] 3. POST /api/v1/payments (bKash Escrow Capital Commitment)... ✓ PASSED (5.2ms)
  ● [Backend] 4. POST /api/v1/payments (Nagad Escrow Capital Commitment)... ✓ PASSED (5.6ms)
  ● [Backend] 5. GET /api/v1/admin/kyc/pending (Compliance & Verification Queue)... ✓ PASSED (3.0ms)
  ● [Backend] 6. GET /api/v1/surveillance/telemetry (Real-Time Sensor Feed)... ✓ PASSED (3.4ms)

▶ SUITE 3: Surveillance Hub & Real-time Operations (3 Tests)
  ● [Surveillance] 1. GET /surveillance (Enterprise Operations Hub & Monitoring)... ✓ PASSED (3.6ms)
  ● [Surveillance] 2. GET /api/v1/communications/feed (Staff ➔ Farmer ➔ Investor Bus)... ✓ PASSED (2.1ms)
  ● [Surveillance] 3. GET /api/v1/blockchain/transactions (Audit Trail & Receipts)... ✓ PASSED (5.0ms)

▶ SUITE 4: Multi-Role Identity & Chatbot KYC Gatekeeping (4 Tests)
  ● [AuthManager] 1. Guest User Investment Blocking (KYC Enforcement)... ✓ PASSED (0.1ms)
  ● [AuthManager] 2. Verified Investor Authorization & NID Status... ✓ PASSED (0.1ms)
  ● [AuthManager] 3. Dynamic Multi-Role Expansion (Farmer + Investor + Buyer)... ✓ PASSED (1.5ms)
  ● [Chatbot] 4. Chatbot Singleton & Dynamic Menu State... ✓ PASSED (0.2ms)

▶ SUITE 5: Smart Contracts & Shariah Escrow Invariants (4 Tests)
  ● [SmartContracts] 1. DealFactory Cohort Deployment Schema... ✓ PASSED (0.2ms)
  ● [SmartContracts] 2. Escrow Lock-in & Milestone Release Invariant... ✓ PASSED (0.1ms)
  ● [SmartContracts] 3. ProfitDistribution Proportional Payout (Zero Riba Invariant)... ✓ PASSED (0.1ms)
  ● [SmartContracts] 4. Base Sepolia Chain & Cryptographic Hashing Proof... ✓ PASSED (0.3ms)

=========================================================================
   FINAL TEST EXECUTION SUMMARY SCORECARD
=========================================================================
   ● Auth            : 9/9 Passed (100%)
   ● Backend         : 6/6 Passed (100%)
   ● Surveillance    : 3/3 Passed (100%)
   ● AuthManager     : 3/3 Passed (100%)
   ● Chatbot         : 1/1 Passed (100%)
   ● SmartContracts  : 4/4 Passed (100%)
-------------------------------------------------------------------------
   Overall Result   : 26/26 PASSED (100% SUCCESS RATE)
=========================================================================
```

---

## 3. Test Suite Architecture & Verification Matrix

The test suite systematically audits all functional modules defined in `AGENTS.md`:

| Suite | Category | Tested Endpoints / Units | Critical Verification Points |
| :--- | :--- | :--- | :--- |
| **Suite 1** | **Dual-Authentication & Cryptographic Security** | 9 Endpoints (`/api/v1/auth/*`) | Bcrypt password sanitization (preventing hash leaks), JWT dual-token generation & rotation, cryptographic Web3 nonces (`agrishare_<timestamp>_<rand>`), EVM 0x wallet address authentication, and session revocation. |
| **Suite 2** | **Live Backend & Shariah Cohorts** | 6 Endpoints (`/api/v1/deals`, `/payments`, `/blockchain/status`, etc.) | Active asset-backed farming cohorts, expected ROI ranges (18%–28%), Base Sepolia Chain ID 84532 connection, multi-channel MFS payments (bKash, Nagad), compliance KYC review queue, and live telemetry data. |
| **Suite 3** | **Surveillance Hub & Operations** | 3 Endpoints (`/surveillance`, `/communications/feed`, `/blockchain/transactions`) | Enterprise Operations UI rendering, Sentinel node monitoring, inter-role character communications bus (Staff ➔ Farmer ➔ Investor), and audit trail persistence. |
| **Suite 4** | **Multi-Role Identity & Chatbot KYC** | 4 Units (`AuthManager`, `BondhonChatbot`) | Strict investment gatekeeping (unverified guests cannot commit capital), NID verification status checks, seamless multi-role role promotion (`farmer` + `investor` + `buyer`), and dynamic chatbot menu state. |
| **Suite 5** | **Smart Contracts & Shariah Invariants** | 4 Units (`DealFactory`, `Escrow`, `ProfitDistribution`, Base Sepolia) | Zero-Riba profit arithmetic (100% of profit distributed according to Mudarabah ratio with zero leakages), milestone escrow fund release, and cryptographic 256-bit EVM transaction receipt hashes. |

---

## 4. Step-by-Step Live Demonstration Script for Evaluators

Follow these 5 structured stages when presenting the platform:

### Stage 1: Terminal Test Execution & Security Verification (CLI)
1. Open a clean terminal in the repository root.
2. Execute:
   ```bash
   npm test
   ```
3. **Talking Points for Evaluators:**
   - *"All 26 automated unit and integration tests across our 5 core subsystems pass in less than 200 milliseconds."*
   - *"This test suite enforces strict invariants: passwords never leak into JSON payloads, Shariah profit-sharing equations are algebraically balanced to 0% interest, and all MFS payments generate verifiable Base Sepolia transaction proofs."*

---

### Stage 2: Live Sentinel Surveillance Hub (`http://localhost:3001/surveillance`)
1. Open your browser and navigate to:  
   [`http://localhost:3001/surveillance`](http://localhost:3001/surveillance)
2. **Talking Points for Evaluators:**
   - **Visual Branding:** Showcase the Petrol Green (`#05161A`) and Crisp White theme featuring the official GramBandhan leaf identity logo.
   - **Sentinel Health:** Highlight the real-time node cluster (API Gateway, PostgreSQL/SQLite engine, Base Sepolia RPC, IoT Telemetry ingestor).
   - **Inter-Role Communications Bus:** Demonstrate the chronological audit log showing verified communications between platform roles:
     - *Staff (Kamrul Islam)* ➔ *Farmer (Md. Delwar Hossain)*: KYC & biosecurity inspection approval.
     - *Investor (Rahat Khan)* ➔ *Escrow Vault*: bKash capital commitment sealed on-chain.
     - *Compliance Officer* ➔ *Collective*: Harvest milestone and telemetry linkage.

---

### Stage 3: Bondhon AI Chatbot & Investor KYC Gatekeeping (`http://localhost:5173`)
1. Open your browser and navigate to:  
   [`http://localhost:5173`](http://localhost:5173)
2. Click the floating **Bondhon AI** launcher icon in the bottom right corner.
3. **Demonstrate Guest Gatekeeping (The User Security Constraint):**
   - Point out the header badge: `🔒 Guest · Login`.
   - Click the quick action **"💰 Invest in a Project"**.
   - Browse the Shariah cohort cards (e.g., *Monsoon Paddy Harvest*, *Sustainable Poultry*).
   - Click **"Invest in This Project →"**.
   - **Observe:** The chatbot halts the investment flow and displays the **"Investor Verification & KYC Required"** card, explaining the SEC compliance and Shariah partnership requirement.
4. **Demonstrate 1-Click Instant Verification:**
   - Click **"⚡ Instant Demo Verification (Tariq Rahman · NID Verified ✓)"**.
   - **Observe:** The chatbot header badge immediately updates to `👤 Tariq (Verified ✓)` with an active green indicator.
   - The bot displays verification credentials (NID `1988269120485921` Verified ✓, KYC Approved) and automatically resumes the investment prompt.
5. **Demonstrate Payment & Blockchain Receipt:**
   - Enter an investment amount (e.g., `15000`) and confirm.
   - Select **"📱 bKash Direct"**.
   - **Observe:** A cryptographic receipt is rendered displaying:
     - Reference ID (`GB...`)
     - Verified Investor name and NID status
     - Base Sepolia Transaction Hash (`0x...`)
     - Block Number (`#19824...`) with 12 Block Confirmations.

---

### Stage 4: Unified Multi-Role Lifecycle & Cross-Role Access
1. In the browser, demonstrate cross-role continuity without re-login friction:
   - **Investor Portfolio:** [`http://localhost:5173/investor_profile.html`](http://localhost:5173/investor_profile.html)  
     *(Inspect holdings, ROI distributions, and asset verification certificates).*
   - **Artisanal Rural Marketplace:** [`http://localhost:5173/marketplace.html`](http://localhost:5173/marketplace.html)  
     *(Inspect Nakshi Kantha craft listings produced by rural women artisans).*
   - **Farmer IoT Portal:** [`http://localhost:5173/Farmer/farmer.html`](http://localhost:5173/Farmer/farmer.html)  
     *(Inspect soil telemetry, crop stage alerts, and harvest yield projections).*
   - **Admin Command Center:** [`http://localhost:5173/Admin/admin.html`](http://localhost:5173/Admin/admin.html)  
     *(Inspect deal approval queues and direct one-click navigation to the Surveillance Hub).*
2. **Talking Points for Evaluators:**
   - *"In traditional architectures, users must create separate accounts for buying, investing, and farming. GramBandhan's `UnifiedUser` controller enables dynamic role accretion—a farmer who buys a craft product automatically receives the buyer role, and an investor can support rural artisans seamlessly."*

---

### Stage 5: Live Blockchain Proof & Real SMTP Mail Dispatch
1. Open a terminal and run the live mail verification script:
   ```bash
   node backend/test-real-mail.mjs
   ```
2. **Observe:** The script authenticates with `smtp.gmail.com:465` and dispatches an authentic investment share certificate directly to `binsadikmuhutasim@gmail.com`.
3. **Talking Points for Evaluators:**
   - *"Every milestone and investment is cryptographically verifiable on BaseScan (`https://sepolia.basescan.org`) and simultaneously delivered as a physical/digital receipt via automated SMTP email and telco SMS gateways."*

---

## 5. Summary Scorecard & Compliance Invariants

| Invariant / Metric | Platform Guarantee | Verification Mechanism |
| :--- | :--- | :--- |
| **Zero Riba (0% Interest)** | **100% Shariah Compliant** | Profit is derived strictly from harvest yields and distributed via pre-agreed Mudarabah ratios (e.g. 65/35). |
| **Identity & KYC Enforcement** | **Mandatory Verification** | Unverified guests are strictly barred from committing capital via frontend UI, Chatbot, and REST endpoints. |
| **Tamper-Proof Ledger** | **Base Sepolia (EVM 84532)** | Capital commitments and milestones produce non-repudiable 256-bit hashes anchored to smart contract vaults. |
| **System Uptime & Monitoring** | **Continuous Surveillance** | Operations Hub (`/surveillance`) tracks request latencies, client IPs, and inter-role communications live. |
| **Automated Test Score** | **26 / 26 Tests (100% Pass)** | Verified via Node.js native test runner and TypeScript strict mode (`tsc --noEmit`). |

---

*Authored by Team Torongo Dhara · GramBandhan Enterprise Engineering*  
*Document Version: 2.1.0 · Last Updated: September 2026*
