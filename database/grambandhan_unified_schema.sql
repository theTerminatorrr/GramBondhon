-- ============================================================================
-- ðŸŒ± GramBandhan: Unified Enterprise PostgreSQL Database Architecture
-- Comprehensive Multi-Tier Schema: 16 SRS Modules + Double-Entry Ledger + Blockchain Settlement
-- Target RDBMS: PostgreSQL 16+
-- ============================================================================

-- Enable cryptographic UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMERATED TYPES (Strict Domain Value Integrity)
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'FARMER',
    'INVESTOR',
    'FIELD_AGENT',
    'ADMIN',
    'SUPER_ADMIN',
    'BUYER'
);

CREATE TYPE kyc_status AS ENUM (
    'NOT_STARTED',
    'PENDING',
    'VERIFIED',
    'REJECTED'
);

CREATE TYPE project_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'ACTIVE',
    'COMPLETED',
    'ARCHIVED'
);

CREATE TYPE investment_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'ACTIVE',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
);

CREATE TYPE milestone_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'SUBMITTED',
    'VERIFIED',
    'REJECTED'
);

CREATE TYPE order_status AS ENUM (
    'PLACED',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);

CREATE TYPE payment_method AS ENUM (
    'BKASH',
    'NAGAD',
    'BANK_TRANSFER',
    'CRYPTO_WALLET'
);

CREATE TYPE insurance_status AS ENUM (
    'ACTIVE',
    'CLAIMED',
    'EXPIRED',
    'CANCELLED'
);

CREATE TYPE claim_status AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'PAID'
);

CREATE TYPE risk_level AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);

CREATE TYPE alert_severity AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE account_type AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);

-- ============================================================================
-- 2. IDENTITY & ROLE-BASED ACCESS CONTROL (SRS S6.5.1 & S6.5.2)
-- ============================================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(150) UNIQUE NOT NULL,
    phone               VARCHAR(30) UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    role                user_role NOT NULL,
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_status          kyc_status NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE farmer_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nid_number          VARCHAR(50),
    division            VARCHAR(100),
    district            VARCHAR(100),
    upazila             VARCHAR(100),
    farm_size_acres     NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (farm_size_acres >= 0),
    experience_years    INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    rating              NUMERIC(3, 2) NOT NULL DEFAULT 0.0 CHECK (rating BETWEEN 0 AND 5),
    bio                 TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE investor_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tax_id              VARCHAR(50),
    total_invested      NUMERIC(14, 2) NOT NULL DEFAULT 0.0 CHECK (total_invested >= 0),
    wallet_balance      NUMERIC(14, 2) NOT NULL DEFAULT 0.0 CHECK (wallet_balance >= 0),
    wallet_address      VARCHAR(42), -- EVM 0x address
    risk_profile        risk_level NOT NULL DEFAULT 'MEDIUM',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE field_agent_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_region     VARCHAR(150) NOT NULL,
    national_id         VARCHAR(50),
    rating              NUMERIC(3, 2) NOT NULL DEFAULT 0.0 CHECK (rating BETWEEN 0 AND 5),
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. FARMS, CROPS & AGRICULTURAL PROJECTS (SRS S6.5.3 & S6.5.4)
-- ============================================================================

CREATE TABLE farms (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_profile_id   UUID NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    name                VARCHAR(150) NOT NULL,
    total_area_acres    NUMERIC(10, 2) NOT NULL CHECK (total_area_acres > 0),
    division            VARCHAR(100) NOT NULL,
    district            VARCHAR(100) NOT NULL,
    upazila             VARCHAR(100) NOT NULL,
    latitude            NUMERIC(10, 7),
    longitude           NUMERIC(10, 7),
    soil_type           VARCHAR(100),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE crops (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    variety             VARCHAR(100),
    category            VARCHAR(100),
    growing_cycle_days  INT NOT NULL CHECK (growing_cycle_days > 0),
    water_requirement   VARCHAR(50),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE agricultural_projects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_profile_id   UUID NOT NULL REFERENCES farmer_profiles(id) ON DELETE RESTRICT,
    farm_id             UUID REFERENCES farms(id) ON DELETE SET NULL,
    crop_id             UUID REFERENCES crops(id) ON DELETE SET NULL,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    fund_goal           NUMERIC(14, 2) NOT NULL CHECK (fund_goal > 0),
    fund_raised         NUMERIC(14, 2) NOT NULL DEFAULT 0.0 CHECK (fund_raised >= 0),
    start_date          DATE,
    end_date            DATE,
    status              project_status NOT NULL DEFAULT 'DRAFT',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE project_milestones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES agricultural_projects(id) ON DELETE CASCADE,
    verified_by_agent_id UUID REFERENCES field_agent_profiles(id) ON DELETE SET NULL,
    name                VARCHAR(150) NOT NULL,
    description         TEXT,
    target_date         DATE NOT NULL,
    completed_date      DATE,
    status              milestone_status NOT NULL DEFAULT 'PENDING',
    photo_urls          TEXT[] DEFAULT ARRAY[]::TEXT[],
    expense_log         NUMERIC(14, 2),
    sort_order          INT NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_sort_order UNIQUE (project_id, sort_order)
);

-- ============================================================================
-- 4. INVESTMENTS & DEALS (SRS S6.5.5)
-- ============================================================================

CREATE TABLE investments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id         UUID NOT NULL REFERENCES investor_profiles(id) ON DELETE RESTRICT,
    project_id          UUID NOT NULL REFERENCES agricultural_projects(id) ON DELETE RESTRICT,
    amount              NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    expected_return     NUMERIC(14, 2),
    actual_return       NUMERIC(14, 2),
    status              investment_status NOT NULL DEFAULT 'CONFIRMED',
    blockchain_tx_hash  VARCHAR(66),
    invested_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. AI RISK SCORING (SRS S6.5.6)
-- ============================================================================

CREATE TABLE risk_scores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES agricultural_projects(id) ON DELETE CASCADE,
    score               NUMERIC(5, 2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    level               risk_level NOT NULL,
    factors             TEXT,
    recommendation      TEXT,
    generated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. AGRI-COMMODITY MARKETPLACE & ORDERS (SRS S6.5.7)
-- ============================================================================

CREATE TABLE product_listings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(150) NOT NULL,
    category            VARCHAR(100),
    price               NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    quantity            INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit                VARCHAR(30) NOT NULL DEFAULT 'kg',
    description         TEXT,
    delivery_area       VARCHAR(150),
    image_url           TEXT,
    is_available        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    listing_id          UUID NOT NULL REFERENCES product_listings(id) ON DELETE RESTRICT,
    quantity            INT NOT NULL CHECK (quantity > 0),
    total_price         NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    status              order_status NOT NULL DEFAULT 'PLACED',
    payment_method      payment_method,
    delivery_address    TEXT,
    ordered_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. PARAMETRIC CROP INSURANCE (SRS S6.5.8)
-- ============================================================================

CREATE TABLE insurance_policies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES agricultural_projects(id) ON DELETE CASCADE,
    provider            VARCHAR(150) NOT NULL,
    coverage_type       VARCHAR(100) NOT NULL,
    coverage_amount     NUMERIC(14, 2) NOT NULL CHECK (coverage_amount > 0),
    premium_amount      NUMERIC(12, 2) NOT NULL CHECK (premium_amount >= 0),
    status              insurance_status NOT NULL DEFAULT 'ACTIVE',
    started_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at          TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE insurance_claims (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id           UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
    reason              TEXT NOT NULL,
    damage_assessment   TEXT,
    claim_amount        NUMERIC(14, 2) NOT NULL CHECK (claim_amount > 0),
    approved_amount     NUMERIC(14, 2) CHECK (approved_amount >= 0),
    evidence_urls       TEXT[] DEFAULT ARRAY[]::TEXT[],
    status              claim_status NOT NULL DEFAULT 'SUBMITTED',
    filed_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    settled_at          TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. PAYMENTS, DIGITAL WALLET & FRAUD DETECTION (SRS S6.5.9 & S6.5.10)
-- ============================================================================

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    investment_id       UUID REFERENCES investments(id) ON DELETE SET NULL,
    amount              NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency            VARCHAR(10) NOT NULL DEFAULT 'BDT',
    provider            VARCHAR(50) NOT NULL, -- BKASH, NAGAD, BANK_TRANSFER, BASE_SEPOLIA
    provider_reference  VARCHAR(150),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    idempotency_key     VARCHAR(150) UNIQUE NOT NULL,
    metadata            JSONB,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE fraud_alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_id      UUID REFERENCES payments(id) ON DELETE SET NULL,
    reason              TEXT NOT NULL,
    severity            alert_severity NOT NULL DEFAULT 'MEDIUM',
    is_resolved         BOOLEAN NOT NULL DEFAULT FALSE,
    flagged_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 9. REPUTATION, RATINGS & NOTIFICATIONS (SRS S6.5.11 & S6.5.12)
-- ============================================================================

CREATE TABLE ratings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id          UUID REFERENCES agricultural_projects(id) ON DELETE SET NULL,
    listing_id          UUID REFERENCES product_listings(id) ON DELETE SET NULL,
    stars               SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment             TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(150) NOT NULL,
    message             TEXT NOT NULL,
    read                BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. DOUBLE-ENTRY FINANCIAL ACCOUNTING LEDGER (Audit Compliance)
-- ============================================================================

CREATE TABLE accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(20) UNIQUE NOT NULL,
    name                VARCHAR(100) NOT NULL,
    type                account_type NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'BDT',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE ledger_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference           VARCHAR(100) UNIQUE NOT NULL,
    description         TEXT NOT NULL,
    posted_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE ledger_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id      UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    debit               NUMERIC(14, 2) NOT NULL DEFAULT 0.0 CHECK (debit >= 0),
    credit              NUMERIC(14, 2) NOT NULL DEFAULT 0.0 CHECK (credit >= 0),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT chk_debit_or_credit CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

-- ============================================================================
-- 11. BASE SEPOLIA SMART CONTRACT ANCHORING (Web3 Settlement)
-- ============================================================================

CREATE TABLE smart_contracts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    address             VARCHAR(42) NOT NULL, -- 0x... EVM address
    network             VARCHAR(50) NOT NULL DEFAULT 'base-sepolia',
    chain_id            INT NOT NULL DEFAULT 84532,
    deployer_address    VARCHAR(42) NOT NULL,
    abi                 JSONB NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deployed_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_contract_address_chain UNIQUE (address, chain_id)
);

-- ============================================================================
-- 12. PERFORMANCE OPTIMIZED B-TREE INDEXES
-- ============================================================================

CREATE INDEX idx_users_role              ON users(role);
CREATE INDEX idx_users_email             ON users(email);
CREATE INDEX idx_farmer_user             ON farmer_profiles(user_id);
CREATE INDEX idx_investor_user           ON investor_profiles(user_id);
CREATE INDEX idx_agent_region            ON field_agent_profiles(assigned_region);
CREATE INDEX idx_projects_farmer         ON agricultural_projects(farmer_profile_id);
CREATE INDEX idx_projects_status         ON agricultural_projects(status);
CREATE INDEX idx_milestones_project      ON project_milestones(project_id);
CREATE INDEX idx_investments_project     ON investments(project_id);
CREATE INDEX idx_investments_investor    ON investments(investor_id);
CREATE INDEX idx_listings_producer       ON product_listings(producer_id);
CREATE INDEX idx_orders_buyer            ON orders(buyer_id);
CREATE INDEX idx_orders_listing          ON orders(listing_id);
CREATE INDEX idx_payments_user           ON payments(user_id);
CREATE INDEX idx_payments_status         ON payments(status);
CREATE INDEX idx_ratings_from_user       ON ratings(from_user_id);
CREATE INDEX idx_ratings_project         ON ratings(project_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_ledger_transaction      ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_account          ON ledger_entries(account_id);
