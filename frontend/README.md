# 🌾 GramBandhan — Frontend, Farmer & Admin Application Hub
### Official Repository for Jony (`jony_today_25`)

This repository contains the complete **Frontend Web Application, Farmer Portal, and Admin Control Hub** for the GramBandhan Rural Agri-FinTech Platform.

---

## 🏛️ Core Modules Included

### 1. 🧑‍🌾 Farmer Portal (`Farmer/`)
- **`Farmer/farmer.html`**: Dedicated agricultural producer workspace.
- **Features**:
  - Live Harvest Recording & Crop Yield telemetry.
  - Land title & Farm parcel verification status.
  - Capital disbursement progress & payout records.
  - Agronomist inspection log feeds.

### 2. 🛡️ Admin & Staff Portal (`Admin/`)
- **`Admin/admin.html`**: Administrative and compliance management center.
- **Features**:
  - **National ID KYC Queue**: Review and verify Farmer/Investor credentials.
  - **Deal Approval Engine**: Approve agricultural campaigns for public funding.
  - **Escrow Settlement Release**: Disburse funds directly on Base Sepolia blockchain.
  - **Inter-Role Communication Relay**: Broadcast urgent notices and updates across the platform.

### 3. 🌐 Investor & Marketplace Subsystem
- **`homepage.html` / `index.html`**: Hero Section (2.0s continuous agricultural slideshow), Halal investment spotlight, and How It Works guide.
- **`investor.html` & `investor_*.html`**: Multi-tab Investor ecosystem (Dashboard, Projects, Financials, AI Risk, Profile).
- **`marketplace.html`**: 100 authentic Bangladeshi rural products priced in Taka (৳) with instant search autocomplete and category filter chips.
- **`orders.html`**: Real-time delivery tracker with live progress states.
- **`login.html` & `register.html`**: Role-based authentication with 1-Click Demo Login.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The application will launch on **`http://localhost:5173`**.

### 3. Build for Production
```bash
npm run build
```

---

## 🔗 Key Route Index

| Portal / View | Local URL |
| :--- | :--- |
| **Homepage** | `http://localhost:5173/homepage.html` |
| **Farmer Dashboard** | `http://localhost:5173/Farmer/farmer.html` |
| **Admin Panel** | `http://localhost:5173/Admin/admin.html` |
| **Investor Dashboard** | `http://localhost:5173/investor_dashboard.html` |
| **Investor Projects** | `http://localhost:5173/investor_projects.html` |
| **Village Marketplace** | `http://localhost:5173/marketplace.html` |
| **Order Tracking** | `http://localhost:5173/orders.html` |
