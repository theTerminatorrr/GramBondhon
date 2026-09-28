-- ============================================================
-- GRAMBANDHAN ΓÇö Smart Rural Investment Platform
-- PostgreSQL Database Schema
-- Derived from: SRS Class Diagram (S6.5), DFD (S6.1), and
-- Functional Requirements (Ch. 4)
-- ============================================================

-- Run this against an empty database:
--   psql -U postgres -d grambandhan -f grambandhan_schema.sql

-- ------------------------------------------------------------
-- 0. ENUM TYPES (used for controlled, fixed-choice columns)
-- ------------------------------------------------------------
CREATE TYPE user_role          AS ENUM ('farmer', 'investor', 'field_agent', 'admin', 'buyer');
CREATE TYPE project_status     AS ENUM ('pending', 'active', 'completed', 'rejected');
CREATE TYPE investment_status  AS ENUM ('active', 'completed', 'withdrawn');
CREATE TYPE payment_method     AS ENUM ('bkash', 'nagad', 'bank_transfer');
CREATE TYPE transaction_type   AS ENUM ('investment', 'purchase', 'withdrawal', 'premium', 'claim_payout');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE order_status       AS ENUM ('placed', 'confirmed', 'delivered', 'cancelled');
CREATE TYPE insurance_status   AS ENUM ('active', 'claimed', 'expired');
CREATE TYPE claim_status       AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'paid');
CREATE TYPE risk_level         AS ENUM ('low', 'medium', 'high');

-- ------------------------------------------------------------
-- 1. USERS ΓÇö base identity table (SRS S6.5.3: User class)
--    Covers Functional Req 4.1: User Registration & Profile Mgmt
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id         BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    phone           VARCHAR(20)  UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_status      VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. Role-specific profile tables (1:1 with users ΓÇö "IS-A" per SRS S6.5.4)
CREATE TABLE farmer_profiles (
    farmer_id       BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    land_size       NUMERIC(10,2),
    location        VARCHAR(150),
    crops_grown     TEXT,
    rating          NUMERIC(3,2) NOT NULL DEFAULT 0.0 CHECK (rating BETWEEN 0 AND 5)
);

CREATE TABLE investor_profiles (
    investor_id     BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    total_invested  NUMERIC(14,2) NOT NULL DEFAULT 0,
    wallet_balance  NUMERIC(14,2) NOT NULL DEFAULT 0,
    risk_profile    VARCHAR(30) NOT NULL DEFAULT 'moderate'
);

CREATE TABLE field_agent_profiles (
    agent_id        BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_region VARCHAR(150)
);

-- ------------------------------------------------------------
-- 3. PROJECTS ΓÇö Functional Req 4.2: Project Listing & Investment
--    "Farmer creates Project" = One-to-Many (SRS S6.5.4)
-- ------------------------------------------------------------
CREATE TABLE projects (
    project_id      BIGSERIAL PRIMARY KEY,
    farmer_id       BIGINT NOT NULL REFERENCES farmer_profiles(farmer_id),
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    crop_type       VARCHAR(100),
    fund_goal       NUMERIC(14,2) NOT NULL CHECK (fund_goal > 0),
    fund_raised     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (fund_raised >= 0),
    start_date      DATE,
    end_date        DATE,
    status          project_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- 4. INVESTMENTS ΓÇö "Investor invests in Project" = Many-to-Many,
--    resolved into a junction table with its own attributes
CREATE TABLE investments (
    investment_id   BIGSERIAL PRIMARY KEY,
    investor_id     BIGINT NOT NULL REFERENCES investor_profiles(investor_id),
    project_id      BIGINT NOT NULL REFERENCES projects(project_id),
    amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    expected_return NUMERIC(14,2),
    status          investment_status NOT NULL DEFAULT 'active',
    invested_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 5. MILESTONE UPDATES ΓÇö Functional Req 4.3: Real-Time Progress Tracking
-- ------------------------------------------------------------
CREATE TABLE milestone_updates (
    update_id       BIGSERIAL PRIMARY KEY,
    project_id      BIGINT NOT NULL REFERENCES projects(project_id),
    verified_by     BIGINT REFERENCES field_agent_profiles(agent_id),
    notes           TEXT,
    photo_urls      TEXT[],
    expense_log     NUMERIC(14,2),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 6. RISK SCORES ΓÇö Functional Req 4.5: AI-Based Risk Suggestion
-- ------------------------------------------------------------
CREATE TABLE risk_scores (
    score_id        BIGSERIAL PRIMARY KEY,
    project_id      BIGINT NOT NULL REFERENCES projects(project_id),
    score           NUMERIC(5,2) NOT NULL,
    level           risk_level NOT NULL,
    factors         TEXT,
    recommendation  TEXT,
    generated_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 7. PRODUCT LISTINGS ΓÇö Functional Req 4.4: Online Marketplace
-- ------------------------------------------------------------
CREATE TABLE product_listings (
    listing_id      BIGSERIAL PRIMARY KEY,
    producer_id     BIGINT NOT NULL REFERENCES users(user_id),
    name            VARCHAR(150) NOT NULL,
    category        VARCHAR(100),
    price           NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    quantity        INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    description     TEXT,
    delivery_area   VARCHAR(150),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    order_id        BIGSERIAL PRIMARY KEY,
    buyer_id        BIGINT NOT NULL REFERENCES users(user_id),
    listing_id      BIGINT NOT NULL REFERENCES product_listings(listing_id),
    quantity        INT NOT NULL CHECK (quantity > 0),
    total_price     NUMERIC(12,2) NOT NULL,
    status          order_status NOT NULL DEFAULT 'placed',
    ordered_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 8. INSURANCE ΓÇö Functional Req 4.6: Insurance & Risk Coverage
-- ------------------------------------------------------------
CREATE TABLE insurance_policies (
    policy_id       BIGSERIAL PRIMARY KEY,
    project_id      BIGINT NOT NULL REFERENCES projects(project_id),
    coverage_type   VARCHAR(100),
    premium         NUMERIC(12,2) NOT NULL,
    status          insurance_status NOT NULL DEFAULT 'active',
    started_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE insurance_claims (
    claim_id        BIGSERIAL PRIMARY KEY,
    policy_id       BIGINT NOT NULL REFERENCES insurance_policies(policy_id),
    evidence        TEXT,
    status          claim_status NOT NULL DEFAULT 'submitted',
    filed_at        TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 9. TRANSACTIONS ΓÇö Functional Req 4.9: Digital Payment System
-- ------------------------------------------------------------
CREATE TABLE transactions (
    transaction_id  BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(user_id),
    amount          NUMERIC(14,2) NOT NULL,
    type            transaction_type NOT NULL,
    method          payment_method,
    status          transaction_status NOT NULL DEFAULT 'pending',
    reference_id    BIGINT, -- points to investment_id / order_id / claim_id depending on `type`
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 10. FRAUD ALERTS ΓÇö Functional Req 4.7: Fraud Protection System
-- ------------------------------------------------------------
CREATE TABLE fraud_alerts (
    alert_id        BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(user_id),
    transaction_id  BIGINT REFERENCES transactions(transaction_id),
    reason          TEXT NOT NULL,
    flagged_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 11. RATINGS & FEEDBACK ΓÇö Functional Req 4.8
-- ------------------------------------------------------------
CREATE TABLE ratings (
    rating_id       BIGSERIAL PRIMARY KEY,
    from_user_id    BIGINT NOT NULL REFERENCES users(user_id),
    to_user_id      BIGINT REFERENCES users(user_id),
    project_id      BIGINT REFERENCES projects(project_id),
    listing_id      BIGINT REFERENCES product_listings(listing_id),
    stars           SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 12. NOTIFICATIONS ΓÇö supports the Notification System (DFD S6.1)
-- ------------------------------------------------------------
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(user_id),
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 13. INDEXES ΓÇö speed up the lookups every screen in the SRS needs:
--     "browse projects", "investor's portfolio", "farmer's projects"
-- ------------------------------------------------------------
CREATE INDEX idx_projects_farmer      ON projects(farmer_id);
CREATE INDEX idx_investments_project  ON investments(project_id);
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_milestones_project   ON milestone_updates(project_id);
CREATE INDEX idx_listings_producer    ON product_listings(producer_id);
CREATE INDEX idx_orders_buyer         ON orders(buyer_id);
CREATE INDEX idx_orders_listing       ON orders(listing_id);
CREATE INDEX idx_transactions_user    ON transactions(user_id);
CREATE INDEX idx_notifications_user   ON notifications(user_id);
