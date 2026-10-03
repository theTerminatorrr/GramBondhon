# 🌾 GramBandhan (গ্রামীণ বন্ধন) - Tasfi's Module Workspace

An ethical fintech and rural marketplace platform connecting global conscious investors with local agricultural collectives and village women artisans across Bangladesh under fair Shariah-compliant Mudarabah profit sharing.

---

## 📁 Project Architecture & File Organization

This branch contains the full implementation of **Homepage**, **Marketplace**, and **Investor Ecosystem**, with dedicated and clearly named files:

### 1. 🌐 Core Pages (HTML)
- **`index.html`** / **`homepage.html`**: The main GramBandhan Homepage featuring the continuous 2.0s Bangladesh agricultural slideshow, headline direct text overlay, Shariah Halal Spotlight, Active Projects preview, Dual-Track "How It Works" guide, and Marketplace highlights.
- **`marketplace.html`**: Dedicated Village Marketplace storefront with instant autocomplete search, category filter chips (Farming, Handicrafts, Dairy, Fisheries, Spices, Fruits), ⚡ Flash Offers with live countdown, 100 authentic products in Taka (৳), cart drawer, and bKash/Nagad checkout.
- **`projects.html`**: Dedicated Active Projects directory showcasing 30 verified agricultural projects across Bangladesh (Bogura, Gazipur, Rajshahi, Jamalpur, etc.) with high-visibility bilingual Mudarabah profit cards (`৩৫% বিনিয়োগকারীর সরাসরি মুনাফা`) and interactive Return Calculator.
- **`dashboard.html`** / **`investor.html`**: Dedicated Investor Portal & Dashboard showing total balance, profit splits, recent/ongoing investments, and live field agronomist updates.
- **`portfolio.html`**: Dedicated Investor Portfolio page displaying capital allocation breakdown, project ROI, and performance charts.
- **`profile.html`**: Dedicated User & Investor Profile page with NID validation, bank details (IBBL, BEFTN/NPSB), bKash/Nagad payout wallets, and security settings.
- **`orders.html`**: Dedicated Buyer Order Tracking page with real-time delivery timelines (🚚 On The Way / In Transit, Delivered, Cancelled).
- **`login.html`**: Investor and buyer authentication portal with 1-Click Demo Login.
- **`register.html`**: Onboarding and account creation portal with KYC selection.

---

### 2. 📂 Module Folders
- **`Homepage/`**: Homepage module assets, references, and redirects.
- **`Marketplace/`**: Marketplace module assets, components, and storefront controllers.
- **`Investor/`**: Investor portal, dashboard, portfolio, and financial simulator controllers.
- **`css/`**:
  - `style.css`: Complete compiled stylesheet bundle.
  - `homepage.css`: Hero slideshow, navigation, and landing styles.
  - `marketplace.css`: Marketplace storefront, product cards, filter chips, and cart drawer styles.
  - `investor.css`: Investor dashboard, dark black-green luxury theme, and stats card styles.
  - `projects.css`: Active project cards and Mudarabah return card styles.
  - `base.css`: Shared design tokens, typography (Plus Jakarta Sans & Tiro Bangla), and layout.
- **`js/`**:
  - Modular browser scripts and application controllers.
- **`src/`**:
  - `homepage.ts`: Homepage and hero slideshow controller.
  - `marketplace.ts`: Full marketplace storefront, search autocomplete, cart, and checkout engine.
  - `investor.ts`: Investor profile, dashboard, and portfolio controller.
  - `projects.ts`: Active projects catalog and investment return simulator.
  - `auth.ts`: Authentication state manager and session preservation.
  - `data.ts`: Authentic Bangladesh datasets (30 projects, 100 products, artisan bios).
  - `types.ts`: TypeScript contracts and type definitions.
  - `main.ts`: Application orchestrator.

---

## 🚀 Running the Project

### Development Server (Vite)
```bash
npm install
npm run dev
```
Open **`http://localhost:5174/`** in your browser.

### Direct Navigation to Pages
- **Homepage**: `http://localhost:5174/index.html` or `http://localhost:5174/homepage.html`
- **Marketplace**: `http://localhost:5174/marketplace.html`
- **Active Projects**: `http://localhost:5174/projects.html`
- **Investor Dashboard**: `http://localhost:5174/dashboard.html` or `http://localhost:5174/investor.html`
- **Investor Portfolio**: `http://localhost:5174/portfolio.html`
- **Investor Profile**: `http://localhost:5174/profile.html`
- **Marketplace Orders**: `http://localhost:5174/orders.html`
- **Login**: `http://localhost:5174/login.html`
- **Register**: `http://localhost:5174/register.html`

---

## 🎨 Design & Code Preservation Guarantee
All visual styles, colors (Deep Forest Green `#0A2C22`, Emerald `#10B981`, Warm Cream `#F7F4EC`), responsive layouts, Bengali script typography, and interactive behaviors are 100% preserved.
