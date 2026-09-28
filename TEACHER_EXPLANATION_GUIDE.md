# 🌾 GramBandhan (গ্রামীণ বন্ধন) - Project & Teacher Explanation Guide
**Student Name / Module Owner**: Tasfi  
**Assigned Scope**: Homepage, Hero Section, Marketplace, and Investor Ecosystem (Dashboard, Projects, Financials, AI Risk, Profile)

---

## 1. Project Overview & Architecture

**GramBandhan (গ্রামীণ বন্ধন)** is an ethical FinTech and rural commerce platform connecting global conscious investors with local agricultural collectives and village women artisans across Bangladesh under fair Shariah-compliant **Mudarabah** profit sharing.

### 🔄 Core Ecosystem Flow:
$$\text{INVESTORS} \xrightarrow{\text{Mudarabah Capital}} \text{RURAL PRODUCERS} \xrightarrow{\text{Harvest \& Production}} \text{MARKETPLACE} \xrightarrow{\text{Wholesale \& Retail}} \text{ETHICAL PROFIT SHARE}$$

- **Homepage & Hero Section**: Welcomes visitors with a continuous 2.0s authentic Bangladeshi agricultural slideshow, direct typography overlay, Halal Investment spotlight, and How It Works guide.
- **Village Marketplace**: Comprehensive digital marketplace with instant search autocomplete, category filtering, flash deals countdown, shopping bag, and bKash/Nagad checkout.
- **Investor Ecosystem**: Multi-tab professional dashboard featuring verified projects, an interactive Investment Return Calculator, AI risk forecasting, and a detailed capital outflow & return inflow ledger.

---

## 2. File-by-File Breakdown (According to the Architecture Box)

Every file in this project is divided by feature with **zero redundancy**, making it immediately understandable by name:

### 🌐 A. HTML Pages (Root)

| File Name | Purpose & Role | Key Things to Tell Your Teacher |
| :--- | :--- | :--- |
| **`homepage.html`** / **`index.html`** | **Main Homepage** | Titled *"GramBandhan - Homepage"*. Contains the **Hero Section** (continuous 2.0s agricultural slideshow & direct text overlay), Halal Spotlight, Active Projects preview, Dual-Track "How It Works" guide, and Marketplace highlights. |
| **`investor_marketplace.html`** | **Investor Dashboard Marketplace** | Directly opens the Investor Dashboard on the **Marketplace** tab. Displays rural handicraft investments, bulk purchase contracts, and village producer listings. |
| **`investor_dashboard.html`** | **Investor Dashboard Overview** | Directly opens the Investor Dashboard on the **Dashboard** overview. Features the dark green sidebar (`#02221A`), 4 square stat boxes (Total Balance ৳ 4,85,000, Total Profit ৳ 84,250), and live field activity feeds. |
| **`investor_projects.html`** | **Investor Projects Directory** | Directly opens the Investor Dashboard on the **Projects** tab. Showcases 30 verified projects with bilingual Mudarabah return cards (`৩৫% বিনিয়োগকারীর সরাসরি মুনাফা`) and the interactive Investment Return Calculator. |
| **`investor_financials.html`** | **Investor Financials & Portfolio** | Directly opens the Investor Dashboard on the **Financials** tab. Displays the redesigned compact **Capital Outflow & Return Inflow Ledger** and Shariah reconciliation certificates. |
| **`investor_airisk.html`** | **Investor AI Risk Analysis** | Directly opens the Investor Dashboard on the **AI Based Risk Analysis** tab. Features satellite precipitation monitoring and predictive crop yield models. |
| **`investor_profile.html`** | **Investor Profile & Settings** | Directly opens the Investor Dashboard on the **Settings** tab. Displays verified NID validation, IBBL Mudarabah bank account details, and bKash/Nagad payout wallets. |
| **`investor.html`** | **Investor Landing Page** | Features the Post-Login Hero banner: *"Invest in the Earth’s Future"* with category search autocomplete, verified investor badge, and curated Halal opportunities. |
| **`marketplace.html`** | **Public Marketplace Storefront** | Full-screen village marketplace storefront featuring 100 authentic Bangladeshi products in Taka (৳), search autocomplete, flash deals timer, and cart drawer. |
| **`orders.html`** | **Marketplace Order Tracking** | Displays real-time order tracking with multi-stage delivery timelines (🚚 On The Way / In Transit, Delivered, Cancelled). |
| **`login.html`** & **`register.html`** | **Authentication Portal** | Secure login and sign-up with a 1-Click Demo Login button for rapid examination and grading. |

---

### 🎨 B. CSS Stylesheets (`css/`)

| Stylesheet | Scope | Implementation Details |
| :--- | :--- | :--- |
| **`css/homepage.css`** | Homepage Layout | Tighter 30px section spacing, balanced padding, and responsive container layout. |
| **`css/hero_section.css`** | Hero Section Slideshow | Fast 2.0s crossfade carousel transitions, direct white typography overlay, and dual pill CTA buttons. |
| **`css/investor_marketplace.css`** | Investor Marketplace Tab | Product cards, artisan collective profiles, and wholesale investment contracts. |
| **`css/investor_dashboard.css`** | Investor Dashboard Overview | Deep Forest Green (`#02221A`) sidebar, top navbar with search pill, and square metric boxes. |
| **`css/investor_projects.css`** | Investor Projects Directory | High-contrast bilingual profit cards, progress indicators, and calculator modal. |
| **`css/investor_financials.css`** | Financials & Redesigned Ledger | **Redesigned 2×2 compact grid** replacing stretched 70px pillars; balanced spacing for stage milestones. |
| **`css/investor_airisk.css`** | AI Risk Analysis Tab | Weather radar cards, soil health indicators, and risk mitigation gauges. |
| **`css/investor_profile.css`** | Investor Profile & Settings | NID verification badge, IBBL bank accounts, and session security panels. |
| **`css/investor.css`** | Core Investor Theme | Dark black-green luxury fintech aesthetic (`#061D15`), mint highlights (`#34D399`). |
| **`css/marketplace.css`** | Public Marketplace Storefront | Top sticky navbar with **pure white brand text (`#FFFFFF`)**, category filter chips, and cart drawer. |
| **`css/base.css`** | Shared Design Tokens | CSS Custom Properties (`:root`), typography (Plus Jakarta Sans & Tiro Bangla), and navbar/footer. |
| **`css/style.css`** | Master Stylesheet | Consolidated bundle importing all modular stylesheets. |

---

### ⚙️ C. TypeScript Modules (`src/`) & JavaScript (`js/`)

| Module Name | Purpose & Code Role |
| :--- | :--- |
| **`src/main.ts`** / **`js/main.js`** | **Application Orchestrator**: Boots all sector controllers, registers navbar reactivity, handles modal keybindings, and manages the multi-page direct router (`routeDedicatedPageView`). |
| **`src/homepage.ts`** / **`js/homepage.js`** | **Homepage Coordinator**: Manages homepage sections, how-it-works tabs, and testimonials. |
| **`src/hero_section.ts`** / **`js/hero_section.js`** | **Hero Section Controller**: Powers the continuous 2.0s agricultural slideshow without pausing on hover. |
| **`src/investor_marketplace.ts`** / **`js/investor_marketplace.js`** | **Investor Marketplace Controller**: Bridges the investor dashboard with rural artisan market listings. |
| **`src/investor_dashboard.ts`** / **`js/investor_dashboard.js`** | **Dashboard Controller**: Manages overview metrics, live agronomist logs, and notifications. |
| **`src/investor_projects.ts`** / **`js/investor_projects.js`** | **Projects Controller**: Renders 30 verified project cards and the interactive return calculator. |
| **`src/investor_financials.ts`** / **`js/investor_financials.js`** | **Financials Controller**: Manages capital outflow/return inflow ledger records and dividend tracking. |
| **`src/investor_airisk.ts`** / **`js/investor_airisk.js`** | **AI Risk Controller**: Handles weather indices and agronomist verification feeds. |
| **`src/investor_profile.ts`** / **`js/investor_profile.js`** | **Profile Controller**: Handles KYC data, IBBL Mudarabah bank account storage, and payout wallet switching. |
| **`src/investor.ts`** / **`js/investor.js`** | **Investor Core Module**: Master exporter for investor subsystem components. |
| **`src/marketplace.ts`** / **`js/marketplace.js`** | **Marketplace Controller**: Powers search autocomplete, category chips, cart drawer, and bKash/Nagad checkout. |
| **`src/auth.ts`** / **`js/auth.js`** | **Unified Auth Manager**: Multi-role session management (Investor, Buyer, Farmer) with 1-Click Demo login. |
| **`src/data.ts`** | **Authentic Dataset**: 30 verified agricultural projects, 100 authentic products in ৳, and artisan bios. |
| **`src/types.ts`** | **TypeScript Type Definitions**: Strict interfaces ensuring compile-time safety and transparency. |

---

## 3. Key Design Improvements Explained for Evaluators

### A. Titled Homepage & Hero Section
- **Page Title**: Formally titled `<title>GramBandhan - Homepage</title>`.
- **Hero Section**: Explicitly demarcated with semantic attributes (`id="hero-slideshow" data-section-name="Hero Section"`). Features authentic Bangladesh scenes (rice planting, mustard fields, tea terraces) cycling continuously every 2.0 seconds with hardware-accelerated crossfades.

### B. Marketplace Brand Header Contrast (Pure White `#FFFFFF`)
- The `GramBandhan` brand text in the top navigation of the Marketplace has been upgraded from dark green to **pure white (`#FFFFFF`)**.
- The SVG leaf stroke was also updated to white, ensuring crisp, high-contrast visibility against the dark forest green `#0D382A` top bar.

### C. Redesigned Compact Capital Outflow & Return Inflow Ledger
- **Previous Issue**: The 4 stages of the ledger were squished into 4 narrow 70px pillars (`repeat(4, 1fr)`), forcing text to awkwardly wrap and vertically stretching the cards into 500px tall empty boxes.
- **Redesigned Solution**:
  - Structured into a clean **2×2 grid (`repeat(2, 1fr)`)** with compact padding (`8px 10px`).
  - Reduced height by **~60%**, eliminating messy empty space.
  - Stage 1 (Capital Sent via bKash) and Stage 2 (Field Disbursement) sit side-by-side on row 1; Stage 3 (Mandi Wholesale Sale) and Stage 4 (Money Received via BEFTN) sit side-by-side on row 2.
  - Retains all audit-grade color accents (Red for outflow, Blue for deployment, Amber for mandi, Emerald for inflow).

### D. Direct Multi-Page Routing
- When any dedicated HTML page is loaded (e.g., `investor_marketplace.html`, `investor_dashboard.html`, `investor_projects.html`, `marketplace.html`), the application router automatically activates that specific view without requiring the user to manually click through modals or navbars.

---

## 4. Teacher Viva / Defense Q&A Cheat Sheet

### Q1: "How did you divide and name your project files?"
> **Answer**:  
> *"The project is divided cleanly by feature domain with zero redundancy. Every sector has a matching set of files across HTML, CSS, TypeScript, and JavaScript. For example, the Investor Marketplace feature has `investor_marketplace.html`, `css/investor_marketplace.css`, `src/investor_marketplace.ts`, and `js/investor_marketplace.js`. Similarly, the Hero Section, Dashboard, Projects, Financials, AI Risk, and Profile each have dedicated, self-explanatory files."*

### Q2: "Why was the Capital Outflow & Return Inflow Ledger redesigned?"
> **Answer**:  
> *"Inside each project card, 4 sequential stages must be audited. In a multi-column portfolio layout, displaying 4 vertical columns inside a 320px card squished each column to ~70px, causing severe text wrapping and excessive vertical stretching. I redesigned it into a balanced 2×2 grid (`repeat(2, 1fr)`). This doubled the readable width per milestone, cut the card height by more than half, and removed all awkward empty whitespace while preserving the 100% Shariah audit trail."*

### Q3: "How does the marketplace search autocomplete work?"
> **Answer**:  
> *"In `src/marketplace.ts`, the search input listens to the `input` event. When the user types (e.g., 'r'), it filters the 100 authentic Bangladeshi products using `product.name.toLowerCase().startsWith(query)` and displays an instant dropdown with matching items like Chinigura Rice, Rui Fish, and Radhuni Ghee. Selecting an item immediately opens that product's detail modal."*

### Q4: "How does the system ensure ethical Shariah-compliant calculations?"
> **Answer**:  
> *"In `src/investor_projects.ts`, the return calculator simulates Mudarabah profit sharing (65% Farmer / 35% Investor) rather than charging interest (Riba). Returns are calculated dynamically as a variable range rather than a fixed guarantee, and every return value is accompanied by a DEMO DATA disclaimer explaining that returns depend on actual agricultural yields."*

---

## 5. How to Run the Application

```bash
# 1. Install dependencies
npm install

# 2. Run the Vite development server
npm run dev

# 3. Production build verification
npm run build
```
- **Local Server**: `http://localhost:5174/`
- **Homepage**: `http://localhost:5174/homepage.html`
- **Investor Marketplace**: `http://localhost:5174/investor_marketplace.html`
- **Investor Dashboard**: `http://localhost:5174/investor_dashboard.html`
- **Investor Projects**: `http://localhost:5174/investor_projects.html`
- **Investor Financials**: `http://localhost:5174/investor_financials.html`
