import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path: database/grambandhan.db
const DB_DIR = path.resolve(__dirname, "../database");
const DB_PATH = path.join(DB_DIR, "grambandhan.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    // Enable WAL mode & foreign keys for performance and integrity
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db) {
  // Create all tables matching grambandhan_unified_schema.sql and seed.js
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL, -- FARMER, INVESTOR, ADMIN, FIELD_AGENT, BUYER
      is_email_verified INTEGER NOT NULL DEFAULT 1,
      is_phone_verified INTEGER NOT NULL DEFAULT 1,
      kyc_status TEXT NOT NULL DEFAULT 'VERIFIED',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farmer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      nid_number TEXT,
      division TEXT,
      district TEXT,
      upazila TEXT,
      farm_size_acres REAL NOT NULL DEFAULT 0.0,
      experience_years INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 4.8,
      bio TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investor_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      tax_id TEXT,
      total_invested REAL NOT NULL DEFAULT 0.0,
      wallet_balance REAL NOT NULL DEFAULT 0.0,
      risk_profile TEXT DEFAULT 'MODERATE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS field_agent_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      assigned_region TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agricultural_projects (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      crop_type TEXT NOT NULL,
      category TEXT NOT NULL,
      district TEXT NOT NULL,
      fund_goal REAL NOT NULL,
      fund_raised REAL NOT NULL DEFAULT 0.0,
      expected_return_pct REAL NOT NULL DEFAULT 20.0,
      duration_months INTEGER NOT NULL DEFAULT 4,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      disbursement_pct REAL NOT NULL,
      verified_by TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      expense_log REAL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES agricultural_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      district TEXT NOT NULL,
      description TEXT,
      funding_goal REAL NOT NULL,
      funded_amount REAL NOT NULL DEFAULT 0.0,
      min_investment REAL NOT NULL DEFAULT 5000,
      expected_return_pct REAL NOT NULL DEFAULT 22.0,
      duration_months INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      farmer_name TEXT NOT NULL,
      farmer_verified INTEGER NOT NULL DEFAULT 1,
      farmer_rating REAL NOT NULL DEFAULT 4.9,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES agricultural_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      investor_id TEXT NOT NULL,
      deal_id TEXT NOT NULL,
      amount REAL NOT NULL,
      expected_return REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'bKash Direct',
      tx_hash TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS risk_scores (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      score REAL NOT NULL,
      level TEXT NOT NULL, -- LOW, MEDIUM, HIGH
      factors TEXT,
      recommendation TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES agricultural_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_listings (
      id TEXT PRIMARY KEY,
      producer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      quantity INTEGER NOT NULL DEFAULT 50,
      image_url TEXT,
      rating REAL DEFAULT 4.9,
      description TEXT,
      delivery_area TEXT NOT NULL DEFAULT 'All Bangladesh',
      created_at TEXT NOT NULL,
      FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      listing_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'bKash',
      status TEXT NOT NULL DEFAULT 'CONFIRMED', -- PLACED, CONFIRMED, SHIPPED, DELIVERED
      shipping_address TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES product_listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      deal_id TEXT,
      type TEXT NOT NULL, -- INVESTMENT, DISTRIBUTION, MARKETPLACE
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      ref TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
      balance REAL NOT NULL DEFAULT 0.0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      transaction_ref TEXT NOT NULL,
      description TEXT NOT NULL,
      debit REAL NOT NULL DEFAULT 0.0,
      credit REAL NOT NULL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS smart_contracts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      chain_id INTEGER NOT NULL DEFAULT 84532,
      network TEXT NOT NULL DEFAULT 'Base Sepolia Testnet',
      is_active INTEGER NOT NULL DEFAULT 1,
      deployed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default data if database is brand new
  seedIfEmpty(db);
}

function seedIfEmpty(db) {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();

  // 1. Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, phone, password_hash, first_name, last_name, role, is_email_verified, is_phone_verified, kyc_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run("user-farmer-1", "karim.farmer@agriplatform.com", "+8801711000001", "argon2_hash_placeholder", "Abdul", "Karim", "FARMER", 1, 1, "VERIFIED", now, now);
  insertUser.run("user-investor-1", "binsadikmuhutasim@gmail.com", "01838213020", "argon2_hash_placeholder", "Rahat", "Khan", "INVESTOR", 1, 1, "VERIFIED", now, now);
  insertUser.run("user-agent-1", "jasim.agent@agriplatform.com", "+8801711000003", "argon2_hash_placeholder", "Jasim", "Uddin", "FIELD_AGENT", 1, 1, "VERIFIED", now, now);
  insertUser.run("user-admin-1", "admin@grambandhan.com", "+8801800000000", "argon2_hash_placeholder", "System", "Admin", "ADMIN", 1, 1, "VERIFIED", now, now);
  insertUser.run("user-buyer-1", "nusrat.buyer@agriplatform.com", "+8801711000004", "argon2_hash_placeholder", "Nusrat", "Jahan", "BUYER", 1, 1, "VERIFIED", now, now);

  // 2. Profiles
  db.prepare(`
    INSERT INTO farmer_profiles (id, user_id, nid_number, division, district, upazila, farm_size_acres, experience_years, rating, bio, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run("fp-1", "user-farmer-1", "1988269120485921", "Mymensingh", "Mymensingh", "Trishal", 15.0, 12, 4.9, "Pioneer in BRRI Dhan precision farming and climate-smart irrigation.", now, now);

  db.prepare(`
    INSERT INTO investor_profiles (id, user_id, tax_id, total_invested, wallet_balance, risk_profile, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run("ip-1", "user-investor-1", "TIN-889104820", 485000.0, 125000.0, "MODERATE_ETHICAL", now, now);

  db.prepare(`
    INSERT INTO field_agent_profiles (id, user_id, assigned_region, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run("fap-1", "user-agent-1", "Mymensingh & Bogura Agri-Belt", now, now);

  // 3. Agricultural Projects
  const insertProject = db.prepare(`
    INSERT INTO agricultural_projects (id, farmer_id, title, description, crop_type, category, district, fund_goal, fund_raised, expected_return_pct, duration_months, start_date, end_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProject.run(
    "proj-001",
    "user-farmer-1",
    "Boro Rice Cultivation (Cycle 1)",
    "High-yield BRRI Dhan 29 paddy cultivation across 15 bighas with precision drip irrigation.",
    "Boro Rice",
    "CROPS",
    "Mymensingh",
    250000,
    185000,
    24,
    4,
    "2026-01-15",
    "2026-05-15",
    "ACTIVE",
    now,
    now
  );

  insertProject.run(
    "proj-002",
    "user-farmer-1",
    "Hilsa Fish Semi-Intensive Aquaculture",
    "Eco-friendly pond aquaculture of freshwater Hilsa fingerlings with certified probiotic feed.",
    "Hilsa Fish",
    "AQUACULTURE",
    "Chandpur",
    500000,
    420000,
    28,
    6,
    "2026-02-01",
    "2026-08-01",
    "ACTIVE",
    now,
    now
  );

  insertProject.run(
    "proj-003",
    "user-farmer-1",
    "Black Bengal Goat Breeding Cohort",
    "Selective breeding farm for premium Black Bengal goats adhering to strict halal livestock guidelines.",
    "Black Bengal Goat",
    "LIVESTOCK",
    "Kushtia",
    150000,
    95000,
    22,
    8,
    "2026-01-10",
    "2026-09-10",
    "ACTIVE",
    now,
    now
  );

  insertProject.run(
    "proj-004",
    "user-farmer-1",
    "Mustard Seed & Honey Agroforestry",
    "Symbiotic mustard cultivation integrated with bee apiaries producing organic mustard honey.",
    "Mustard & Honey",
    "CROPS",
    "Tangail",
    200000,
    140000,
    26,
    5,
    "2026-02-15",
    "2026-07-15",
    "ACTIVE",
    now,
    now
  );

  // 4. Deals (Connected to Projects)
  const insertDeal = db.prepare(`
    INSERT INTO deals (id, project_id, title, category, district, description, funding_goal, funded_amount, min_investment, expected_return_pct, duration_months, status, farmer_name, farmer_verified, farmer_rating, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDeal.run("deal-001", "proj-001", "Boro Rice Cultivation (Cycle 1)", "CROPS", "Mymensingh", "High-yield BRRI Dhan 29 paddy cultivation across 15 bighas with precision drip irrigation.", 250000, 185000, 5000, 24, 4, "ACTIVE", "Rafiqul Islam", 1, 4.9, now);
  insertDeal.run("deal-002", "proj-002", "Hilsa Fish Semi-Intensive Aquaculture", "AQUACULTURE", "Chandpur", "Eco-friendly pond aquaculture of freshwater Hilsa fingerlings with certified probiotic feed.", 500000, 420000, 10000, 28, 6, "ACTIVE", "Kabir Hossain", 1, 4.8, now);
  insertDeal.run("deal-003", "proj-003", "Black Bengal Goat Breeding Cohort", "LIVESTOCK", "Kushtia", "Selective breeding farm for premium Black Bengal goats adhering to strict halal livestock guidelines.", 150000, 95000, 5000, 22, 8, "ACTIVE", "Nazmul Haque", 1, 4.7, now);
  insertDeal.run("deal-004", "proj-004", "Mustard Seed & Honey Agroforestry", "CROPS", "Tangail", "Symbiotic mustard cultivation integrated with bee apiaries producing organic mustard honey.", 200000, 140000, 5000, 26, 5, "ACTIVE", "Mofizur Rahman", 1, 5.0, now);

  // 5. Milestones
  const insertMilestone = db.prepare(`
    INSERT INTO project_milestones (id, project_id, title, disbursement_pct, verified_by, status, notes, expense_log, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMilestone.run("ms-1", "proj-001", "Land Preparation & BRRI-29 Sowing", 35, "user-agent-1", "VERIFIED", "Precision drip irrigation channels laid. Seedbed germination verified at 94%.", 28500.0, now);
  insertMilestone.run("ms-2", "proj-001", "Bio-Fertilizer & Weeding Phase", 35, "user-agent-1", "VERIFIED", "Eco-friendly bio-compost applied. NDVI remote sensing confirms vegetative index 0.72.", 32000.0, now);
  insertMilestone.run("ms-3", "proj-001", "Harvesting & Mandi Storage", 30, "user-agent-1", "IN_PROGRESS", "Golden paddy maturing. Mandi storage space reserved at Trishal depot.", 0.0, now);

  // 6. Investments
  const insertInvest = db.prepare(`
    INSERT INTO investments (id, investor_id, deal_id, amount, expected_return, payment_method, tx_hash, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInvest.run("inv-1", "user-investor-1", "deal-001", 35000, 43400, "bKash Direct", "0x7bc1928410293812093841029384120934810293481029348102938410293841", "ACTIVE", now);
  insertInvest.run("inv-2", "user-investor-1", "deal-002", 50000, 64000, "Bank Transfer (Islami Bank)", "0x44f1294819a81230491820491829304912093481029348120934812093841029", "ACTIVE", now);

  // 7. Risk Scores
  const insertRisk = db.prepare(`
    INSERT INTO risk_scores (id, project_id, score, level, factors, recommendation, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertRisk.run("risk-1", "proj-001", 18.5, "LOW", "Optimal soil moisture (NDVI 0.72), no flood vulnerability this quarter", "Low Risk. Qualified for full Mudarabah equity tranche.", now);
  insertRisk.run("risk-2", "proj-002", 22.0, "LOW", "Protected freshwater pond basin, probiotic biosecurity verified", "Low-Medium Risk. Staggered milestone escrow recommended.", now);
  insertRisk.run("risk-3", "proj-003", 26.5, "MEDIUM", "Vaccination schedule compliant, temperature control required", "Medium Risk. Takaful livestock insurance attached.", now);
  insertRisk.run("risk-4", "proj-004", 19.0, "LOW", "High bee pollination density, stable weather forecast", "Low Risk. Highly recommended for Shariah investors.", now);

  // 8. Product Listings
  const insertProduct = db.prepare(`
    INSERT INTO product_listings (id, producer_id, name, category, price, unit, quantity, image_url, rating, description, delivery_area, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProduct.run("prod-1", "user-farmer-1", "Premium BRRI 29 Boro Rice", "Rice & Grains", 85, "kg", 500, "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80", 4.9, "100% organic, pesticide-free fragrant Boro rice.", "All Bangladesh", now);
  insertProduct.run("prod-2", "user-farmer-1", "Fresh Cold-Pressed Mustard Oil", "Oils & Spices", 240, "liter", 150, "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80", 5.0, "Traditional Ghani cold-pressed pure mustard oil from Tangail.", "All Bangladesh", now);
  insertProduct.run("prod-3", "user-farmer-1", "Sundarbans Organic Raw Honey", "Honey", 950, "kg", 80, "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&q=80", 4.9, "Wildflower unprocessed pure natural raw honey.", "All Bangladesh", now);
  insertProduct.run("prod-4", "user-farmer-1", "Handcrafted Nakshi Kantha Quilt", "Handicrafts", 3500, "piece", 25, "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?w=500&q=80", 5.0, "Authentic rural women artisan hand-embroidered heritage quilt.", "Worldwide", now);

  // 9. Orders
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, buyer_id, listing_id, quantity, total_price, payment_method, status, shipping_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run("ord-1", "user-buyer-1", "prod-1", 2, 170.0, "bKash Direct", "DELIVERED", "House 12, Road 4, Dhanmondi, Dhaka", now);
  insertOrder.run("ord-2", "user-buyer-1", "prod-3", 1, 950.0, "Nagad Direct", "SHIPPED", "Plot 44, Sector 7, Uttara, Dhaka", now);

  // 10. Payments & Transactions
  const insertPayment = db.prepare(`
    INSERT INTO payments (id, user_id, deal_id, type, title, amount, method, status, ref, tx_hash, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPayment.run("pay-101", "user-investor-1", "deal-001", "DISTRIBUTION", "Profit Payout: Boro Rice Harvest #1", 14200, "bKash Direct", "COMPLETED", "TRX-BK892301", "0x89a1c247e8b94109fa71239840192ea01948194b912a78120491823901928301", "Mar 12, 2026", now);
  insertPayment.run("pay-102", "user-investor-1", "deal-002", "INVESTMENT", "Capital Commitment: Hilsa Aqua Farm", 50000, "Bank Transfer (Islami Bank)", "COMPLETED", "IBBL-9921448", "0x44f1294819a81230491820491829304912093481029348120934812093841029", "Feb 28, 2026", now);
  insertPayment.run("pay-103", "user-investor-1", "deal-003", "DISTRIBUTION", "Interim Dividend: Goat Farm Cohort", 6800, "Nagad Wallet", "COMPLETED", "NGD-4412093", "0x12a9381029381209384102938412093481029348102934810293841029384120", "Feb 15, 2026", now);
  insertPayment.run("pay-104", "user-investor-1", "deal-001", "INVESTMENT", "Capital Commitment: Boro Cycle", 35000, "bKash Direct", "COMPLETED", "TRX-BK771029", "0x7bc1928410293812093841029384120934810293481029348102938410293841", "Jan 10, 2026", now);

  // 11. General Ledger Accounts & Journal Entries
  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, account_number, name, type, balance, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAccount.run("acc-1", "1010", "Escrow Cash Clearing Account (bKash/IBBL)", "ASSET", 575000.0, now);
  insertAccount.run("acc-2", "2010", "Investor Capital Obligation (Mudarabah)", "LIABILITY", 485000.0, now);
  insertAccount.run("acc-3", "3010", "Farmer Equity Surplus Buffer", "EQUITY", 90000.0, now);
  insertAccount.run("acc-4", "4010", "Gross Mandi Marketplace Revenue", "REVENUE", 145000.0, now);
  insertAccount.run("acc-5", "5010", "Agricultural Cultivation & Seed Expenses", "EXPENSE", 72000.0, now);

  const insertLedger = db.prepare(`
    INSERT INTO ledger_entries (id, account_id, transaction_ref, description, debit, credit, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertLedger.run("le-1", "acc-1", "TRX-BK771029", "Investor capital deposit via bKash (deal-001)", 35000.0, 0.0, now);
  insertLedger.run("le-2", "acc-2", "TRX-BK771029", "Escrow liability allocated to Rafiqul Islam", 0.0, 35000.0, now);
  insertLedger.run("le-3", "acc-1", "TRX-BK892301", "Mudarabah 35% investor profit distribution", 0.0, 14200.0, now);
  insertLedger.run("le-4", "acc-4", "TRX-BK892301", "Revenue recognition from BRRI-29 harvest", 14200.0, 0.0, now);

  // 12. Smart Contracts
  const insertContract = db.prepare(`
    INSERT INTO smart_contracts (id, name, address, chain_id, network, is_active, deployed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertContract.run("sc-1", "AgriPlatformEscrow", "0x9048648B1109Ea88d24016e7DAf6e5032316d29F", 84532, "Base Sepolia Testnet", 1, now);
  insertContract.run("sc-2", "ShariahMudarabahVault", "0x882A973024859a019481920394819284918201A0", 84532, "Base Sepolia Testnet", 1, now);
  insertContract.run("sc-3", "ProfitDistributionRouter", "0x331Fa973024859a0194819203948192849182EE7", 84532, "Base Sepolia Testnet", 1, now);

  // 13. Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, message, is_read, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertNotification.run("notif-1", "user-farmer-1", 'Your project "Boro Rice Cultivation (Cycle 1)" received milestone disbursement of ৳ 28,500.', 0, now);
  insertNotification.run("notif-2", "user-investor-1", 'Capital commitment of ৳ 35,000 confirmed and minted on Base Sepolia (#19842188).', 1, now);
}

export function getDatabaseStats() {
  const db = getDatabase();
  const tables = [
    "users",
    "farmer_profiles",
    "investor_profiles",
    "field_agent_profiles",
    "agricultural_projects",
    "project_milestones",
    "deals",
    "investments",
    "risk_scores",
    "product_listings",
    "orders",
    "payments",
    "accounts",
    "ledger_entries",
    "smart_contracts",
    "notifications",
  ];

  const tableStats = {};
  let totalRows = 0;

  for (const t of tables) {
    try {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get();
      tableStats[t] = row.count;
      totalRows += row.count;
    } catch {
      tableStats[t] = 0;
    }
  }

  return {
    connected: true,
    status: "HEALTHY_CONNECTED",
    engine: "Node.js Native SQLite Engine (Persistent)",
    databaseFile: DB_PATH,
    schemaVersion: "GramBandhan Unified Enterprise v1.0",
    totalTables: tables.length,
    totalRows,
    tableStats,
    timestamp: new Date().toISOString(),
  };
}
