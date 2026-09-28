import {
  PrismaClient,
  UserRole,
  AccountType,
  InvestorType,
  KYCStatus,
  FarmerVerificationStatus,
  FarmStatus,
  ProjectStatus,
  DealStatus,
  InvestmentStatus,
  MilestoneStatus,
  RiskLevel,
  InsuranceStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  NotificationType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@agriplatform.com';
const ADMIN_PASSWORD = 'admin123';

const roleDefinitions: Array<{ name: string; description: string }> = [
  'SUPER_ADMIN',
  'ADMIN',
  'INVESTOR',
  'FARMER',
  'FIELD_AGENT',
  'BUYER',
].map((name) => ({
  name,
  description: `${name.replace(/_/g, ' ').toLowerCase()} role for the Agriculture Profit-Sharing Platform`,
}));

const permissionDefinitions: Array<{
  name: string;
  resource: string;
  action: string;
  description: string;
}> = [
  { name: 'user.read', resource: 'user', action: 'read', description: 'Read user records' },
  { name: 'user.update', resource: 'user', action: 'update', description: 'Update user records' },
  { name: 'farmer.read', resource: 'farmer', action: 'read', description: 'Read farmer profiles' },
  { name: 'farmer.verify', resource: 'farmer', action: 'verify', description: 'Verify farmer profiles' },
  { name: 'investor.read', resource: 'investor', action: 'read', description: 'Read investor profiles' },
  { name: 'investor.verify', resource: 'investor', action: 'verify', description: 'Approve investor KYC' },
  { name: 'farm.create', resource: 'farm', action: 'create', description: 'Create farms' },
  { name: 'farm.read', resource: 'farm', action: 'read', description: 'Read farms' },
  { name: 'farm.update', resource: 'farm', action: 'update', description: 'Update farms' },
  { name: 'farm.verify', resource: 'farm', action: 'verify', description: 'Verify farms' },
  { name: 'project.create', resource: 'project', action: 'create', description: 'Create agricultural projects' },
  { name: 'project.read', resource: 'project', action: 'read', description: 'Read agricultural projects' },
  { name: 'project.update', resource: 'project', action: 'update', description: 'Update agricultural projects' },
  { name: 'project.manage', resource: 'project', action: 'manage', description: 'Approve or reject projects' },
  { name: 'milestone.create', resource: 'milestone', action: 'create', description: 'Create project milestones' },
  { name: 'milestone.update', resource: 'milestone', action: 'update', description: 'Update project milestones' },
  { name: 'deal.create', resource: 'deal', action: 'create', description: 'Create deals' },
  { name: 'deal.read', resource: 'deal', action: 'read', description: 'Read deals' },
  { name: 'deal.update', resource: 'deal', action: 'update', description: 'Update deals' },
  { name: 'deal.review', resource: 'deal', action: 'review', description: 'Review deals' },
  { name: 'deal.approve', resource: 'deal', action: 'approve', description: 'Approve or reject deals' },
  { name: 'deal.publish', resource: 'deal', action: 'publish', description: 'Publish deals' },
  { name: 'deal.manage', resource: 'deal', action: 'manage', description: 'Manage deal lifecycle' },
  { name: 'investment.create', resource: 'investment', action: 'create', description: 'Create investments' },
  { name: 'investment.read', resource: 'investment', action: 'read', description: 'Read investments' },
  { name: 'investment.refund', resource: 'investment', action: 'refund', description: 'Refund investments' },
  { name: 'payment.create', resource: 'payment', action: 'create', description: 'Create payments' },
  { name: 'payment.read', resource: 'payment', action: 'read', description: 'Read payments' },
  { name: 'payment.process', resource: 'payment', action: 'process', description: 'Process payment webhooks' },
  { name: 'payment.refund', resource: 'payment', action: 'refund', description: 'Refund payments' },
  { name: 'wallet.connect', resource: 'wallet', action: 'connect', description: 'Connect wallets' },
  { name: 'wallet.read', resource: 'wallet', action: 'read', description: 'Read wallets' },
  { name: 'ledger.read', resource: 'ledger', action: 'read', description: 'Read ledger records' },
  { name: 'ledger.write', resource: 'ledger', action: 'write', description: 'Write ledger entries' },
  { name: 'ledger.reconcile', resource: 'ledger', action: 'reconcile', description: 'Run ledger reconciliation' },
  { name: 'escrow.manage', resource: 'escrow', action: 'manage', description: 'Manage escrow accounts' },
  { name: 'expense.create', resource: 'expense', action: 'create', description: 'Create expenses' },
  { name: 'expense.approve', resource: 'expense', action: 'approve', description: 'Approve expenses' },
  { name: 'harvest.create', resource: 'harvest', action: 'create', description: 'Record harvests' },
  { name: 'harvest.verify', resource: 'harvest', action: 'verify', description: 'Verify harvests' },
  { name: 'sale.create', resource: 'sale', action: 'create', description: 'Record sales' },
  { name: 'sale.verify', resource: 'sale', action: 'verify', description: 'Verify sales' },
  { name: 'revenue.create', resource: 'revenue', action: 'create', description: 'Record revenue' },
  { name: 'profit.calculate', resource: 'profit', action: 'calculate', description: 'Calculate profits' },
  { name: 'profit.distribute', resource: 'profit', action: 'distribute', description: 'Distribute profits' },
  { name: 'settlement.process', resource: 'settlement', action: 'process', description: 'Process settlements' },
  { name: 'withdrawal.create', resource: 'withdrawal', action: 'create', description: 'Create withdrawals' },
  { name: 'withdrawal.approve', resource: 'withdrawal', action: 'approve', description: 'Approve withdrawals' },
  { name: 'blockchain.manage', resource: 'blockchain', action: 'manage', description: 'Manage blockchain operations' },
  { name: 'oracle.manage', resource: 'oracle', action: 'manage', description: 'Manage oracle attestations' },
  { name: 'notification.send', resource: 'notification', action: 'send', description: 'Send notifications' },
  { name: 'audit.read', resource: 'audit', action: 'read', description: 'Read audit logs' },
  { name: 'report.read', resource: 'report', action: 'read', description: 'Read financial reports' },
  { name: 'role.manage', resource: 'role', action: 'manage', description: 'Manage roles and permissions' },
  { name: 'settings.manage', resource: 'settings', action: 'manage', description: 'Manage platform settings' },
];

const cropDefinitions: Array<{
  name: string;
  variety: string | null;
  category: string;
  growingSeasonDays: number;
  description: string;
}> = [
  { name: 'Rice', variety: null, category: 'CEREAL', growingSeasonDays: 120, description: 'Staple grain widely cultivated across Bangladesh' },
  { name: 'Wheat', variety: null, category: 'CEREAL', growingSeasonDays: 110, description: 'Major rabi season cereal crop' },
  { name: 'Potato', variety: null, category: 'VEGETABLE', growingSeasonDays: 90, description: 'High-value tuber crop with short growing cycle' },
  { name: 'Tomato', variety: null, category: 'VEGETABLE', growingSeasonDays: 100, description: 'Cash vegetable crop grown across seasons' },
  { name: 'Maize', variety: null, category: 'CEREAL', growingSeasonDays: 115, description: 'Versatile cereal used for food and feed' },
  { name: 'Jute', variety: null, category: 'CASH_CROP', growingSeasonDays: 120, description: 'Natural fiber crop and key export commodity' },
  { name: 'Tea', variety: null, category: 'CASH_CROP', growingSeasonDays: 365, description: 'Perennial plantation cash crop' },
  { name: 'Mango', variety: null, category: 'FRUIT', growingSeasonDays: 240, description: 'Popular tropical fruit with strong market demand' },
];

interface AccountDefinition {
  code: string;
  name: string;
  type: AccountType;
  subtype: string;
  description: string;
  parentCode?: string;
}

const accountDefinitions: AccountDefinition[] = [
  { code: '1000', name: 'Assets', type: AccountType.ASSET, subtype: 'GROUP', description: 'All asset accounts' },
  { code: '1100', name: 'Fiat Balances', type: AccountType.ASSET, subtype: 'FIAT_BALANCES', description: 'Fiat currency platform balances', parentCode: '1000' },
  { code: '1110', name: 'Platform Operating Account', type: AccountType.ASSET, subtype: 'FIAT_BALANCES', description: 'Main operating bank account', parentCode: '1100' },
  { code: '1120', name: 'Platform Fee Account', type: AccountType.ASSET, subtype: 'FIAT_BALANCES', description: 'Accumulated platform fee assets', parentCode: '1100' },
  { code: '1130', name: 'Farmer Payout Account', type: AccountType.ASSET, subtype: 'FIAT_BALANCES', description: 'Funds held for farmer payouts', parentCode: '1100' },
  { code: '1200', name: 'Crypto Balances', type: AccountType.ASSET, subtype: 'CRYPTO_BALANCES', description: 'Cryptocurrency platform balances', parentCode: '1000' },
  { code: '1210', name: 'Platform Hot Wallet', type: AccountType.ASSET, subtype: 'CRYPTO_BALANCES', description: 'Hot wallet used for blockchain operations', parentCode: '1200' },
  { code: '1220', name: 'Platform Token Account', type: AccountType.ASSET, subtype: 'CRYPTO_BALANCES', description: 'Ownership token inventory', parentCode: '1200' },
  { code: '1300', name: 'Escrow', type: AccountType.ASSET, subtype: 'ESCROW', description: 'Deal escrow holdings', parentCode: '1000' },
  { code: '1310', name: 'Deal Escrow Accounts', type: AccountType.ASSET, subtype: 'ESCROW', description: 'Generic escrow account; per-deal escrow accounts are created dynamically', parentCode: '1300' },
  { code: '1400', name: 'Receivable', type: AccountType.ASSET, subtype: 'RECEIVABLE', description: 'Amounts owed to the platform', parentCode: '1000' },
  { code: '1410', name: 'Investor Receivable', type: AccountType.ASSET, subtype: 'RECEIVABLE', description: 'Investor contributions receivable', parentCode: '1400' },
  { code: '1420', name: 'Farmer Receivable', type: AccountType.ASSET, subtype: 'RECEIVABLE', description: 'Farmer share receivable', parentCode: '1400' },
  { code: '1430', name: 'Platform Fee Receivable', type: AccountType.ASSET, subtype: 'RECEIVABLE', description: 'Platform fee receivable', parentCode: '1400' },
  { code: '1500', name: 'Prepaid', type: AccountType.ASSET, subtype: 'PREPAID', description: 'Prepaid expenses', parentCode: '1000' },
  { code: '1510', name: 'Gas Prepaid', type: AccountType.ASSET, subtype: 'PREPAID', description: 'Prepaid blockchain gas', parentCode: '1500' },

  { code: '2000', name: 'Liabilities', type: AccountType.LIABILITY, subtype: 'GROUP', description: 'All liability accounts' },
  { code: '2100', name: 'Payable', type: AccountType.LIABILITY, subtype: 'PAYABLE', description: 'Amounts the platform owes', parentCode: '2000' },
  { code: '2110', name: 'Investor Payable', type: AccountType.LIABILITY, subtype: 'PAYABLE', description: 'Refunds and returns due to investors', parentCode: '2100' },
  { code: '2120', name: 'Farmer Payable', type: AccountType.LIABILITY, subtype: 'PAYABLE', description: 'Farmers earnings payable', parentCode: '2100' },
  { code: '2130', name: 'Vendor Payable', type: AccountType.LIABILITY, subtype: 'PAYABLE', description: 'External vendor payables', parentCode: '2100' },
  { code: '2200', name: 'Deferred Revenue', type: AccountType.LIABILITY, subtype: 'DEFERRED_REVENUE', description: 'Revenue recognized over time', parentCode: '2000' },
  { code: '2210', name: 'Platform Fee Deferred', type: AccountType.LIABILITY, subtype: 'DEFERRED_REVENUE', description: 'Deferred platform fees', parentCode: '2200' },
  { code: '2300', name: 'Tax Liability', type: AccountType.LIABILITY, subtype: 'TAX_LIABILITY', description: 'Tax obligations', parentCode: '2000' },
  { code: '2310', name: 'Withholding Tax', type: AccountType.LIABILITY, subtype: 'TAX_LIABILITY', description: 'Withholding tax liabilities', parentCode: '2300' },

  { code: '3000', name: 'Equity', type: AccountType.EQUITY, subtype: 'GROUP', description: 'Equity accounts' },
  { code: '3100', name: 'Investment Capital', type: AccountType.EQUITY, subtype: 'INVESTMENT_CAPITAL', description: 'Capital contributed by investors', parentCode: '3000' },
  { code: '3110', name: 'Investor Capital', type: AccountType.EQUITY, subtype: 'INVESTMENT_CAPITAL', description: 'Aggregated investor capital contributions', parentCode: '3100' },
  { code: '3200', name: 'Retained Earnings', type: AccountType.EQUITY, subtype: 'RETAINED_EARNINGS', description: 'Accumulated retained earnings', parentCode: '3000' },
  { code: '3210', name: 'Cumulative Retained', type: AccountType.EQUITY, subtype: 'RETAINED_EARNINGS', description: 'Cumulative retained earnings balance', parentCode: '3200' },
  { code: '3300', name: "Owner's Equity", type: AccountType.EQUITY, subtype: 'OWNER_EQUITY', description: 'Platform owner equity', parentCode: '3000' },
  { code: '3310', name: 'Platform Equity', type: AccountType.EQUITY, subtype: 'OWNER_EQUITY', description: 'Platform equity contribution', parentCode: '3300' },

  { code: '4000', name: 'Revenue', type: AccountType.REVENUE, subtype: 'GROUP', description: 'All revenue accounts' },
  { code: '4100', name: 'Sales Revenue', type: AccountType.REVENUE, subtype: 'SALES_REVENUE', description: 'Revenue from crop sales', parentCode: '4000' },
  { code: '4110', name: 'Crop Sales', type: AccountType.REVENUE, subtype: 'SALES_REVENUE', description: 'Proceeds from crop sales', parentCode: '4100' },
  { code: '4120', name: 'Livestock Sales', type: AccountType.REVENUE, subtype: 'SALES_REVENUE', description: 'Proceeds from livestock sales', parentCode: '4100' },
  { code: '4200', name: 'Investment Revenue', type: AccountType.REVENUE, subtype: 'INVESTMENT_REVENUE', description: 'Returns from investments', parentCode: '4000' },
  { code: '4210', name: 'Deal Returns', type: AccountType.REVENUE, subtype: 'INVESTMENT_REVENUE', description: 'Distribution returns on deals', parentCode: '4200' },
  { code: '4300', name: 'Platform Revenue', type: AccountType.REVENUE, subtype: 'PLATFORM_REVENUE', description: 'Platform-generated revenue', parentCode: '4000' },
  { code: '4310', name: 'Platform Fees', type: AccountType.REVENUE, subtype: 'PLATFORM_REVENUE', description: 'Fees charged to deals', parentCode: '4300' },
  { code: '4320', name: 'Transaction Fees', type: AccountType.REVENUE, subtype: 'PLATFORM_REVENUE', description: 'Fees on transactions', parentCode: '4300' },

  { code: '5000', name: 'Expenses', type: AccountType.EXPENSE, subtype: 'GROUP', description: 'All expense accounts' },
  { code: '5100', name: 'Operational Expenses', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Farm operational costs', parentCode: '5000' },
  { code: '5110', name: 'Seeds & Inputs', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Seed and input purchases', parentCode: '5100' },
  { code: '5120', name: 'Fertilizer', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Fertilizer costs', parentCode: '5100' },
  { code: '5130', name: 'Labor', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Labor costs', parentCode: '5100' },
  { code: '5140', name: 'Equipment', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Equipment purchase and rental', parentCode: '5100' },
  { code: '5150', name: 'Irrigation', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Irrigation costs', parentCode: '5100' },
  { code: '5160', name: 'Transport', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Transport costs', parentCode: '5100' },
  { code: '5170', name: 'Storage', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Storage costs', parentCode: '5100' },
  { code: '5180', name: 'Other Operational', type: AccountType.EXPENSE, subtype: 'OPERATIONAL', description: 'Miscellaneous operational costs', parentCode: '5100' },
  { code: '5200', name: 'Platform Expenses', type: AccountType.EXPENSE, subtype: 'PLATFORM', description: 'Platform operating expenses', parentCode: '5000' },
  { code: '5210', name: 'Hosting & Infrastructure', type: AccountType.EXPENSE, subtype: 'PLATFORM', description: 'Cloud and infrastructure costs', parentCode: '5200' },
  { code: '5220', name: 'Payment Processing Fees', type: AccountType.EXPENSE, subtype: 'PLATFORM', description: 'Payment provider fees', parentCode: '5200' },
  { code: '5230', name: 'Gas/Fees (Blockchain)', type: AccountType.EXPENSE, subtype: 'PLATFORM', description: 'Blockchain gas fees', parentCode: '5200' },
  { code: '5240', name: 'KYC Provider Fees', type: AccountType.EXPENSE, subtype: 'PLATFORM', description: 'KYC/verification provider costs', parentCode: '5200' },
  { code: '5300', name: 'Administrative', type: AccountType.EXPENSE, subtype: 'ADMINISTRATIVE', description: 'Administrative expenses', parentCode: '5000' },
  { code: '5310', name: 'Salaries', type: AccountType.EXPENSE, subtype: 'ADMINISTRATIVE', description: 'Payroll costs', parentCode: '5300' },
  { code: '5320', name: 'Office', type: AccountType.EXPENSE, subtype: 'ADMINISTRATIVE', description: 'Office expenses', parentCode: '5300' },
  { code: '5330', name: 'Marketing', type: AccountType.EXPENSE, subtype: 'ADMINISTRATIVE', description: 'Marketing expenses', parentCode: '5300' },
];

async function seedRoles(): Promise<Map<string, string>> {
  const roleMap = new Map<string, string>();
  for (const def of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: def.name },
      update: { description: def.description },
      create: def,
    });
    roleMap.set(def.name, role.id);
  }
  return roleMap;
}

async function seedPermissions(roleMap: Map<string, string>): Promise<void> {
  const adminRoleId = roleMap.get('ADMIN');
  const superAdminRoleId = roleMap.get('SUPER_ADMIN');

  for (const def of permissionDefinitions) {
    const permission = await prisma.permission.upsert({
      where: { name: def.name },
      update: {
        resource: def.resource,
        action: def.action,
        description: def.description,
      },
      create: def,
    });

    if (!adminRoleId || !superAdminRoleId) {
      continue;
    }

    for (const roleId of [adminRoleId, superAdminRoleId]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId: permission.id },
        },
        update: {},
        create: {
          roleId,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedAdminUser(roleMap: Map<string, string>): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      firstName: 'Admin',
      lastName: 'Platform',
      isEmailVerified: true,
      mfaEnabled: false,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: 'Admin',
      lastName: 'Platform',
      phone: '+8801234567890',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      mfaEnabled: false,
    },
  });

  const adminRoleId = roleMap.get('ADMIN');
  const superAdminRoleId = roleMap.get('SUPER_ADMIN');

  if (adminRoleId) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRoleId } },
      update: {},
      create: { userId: admin.id, roleId: adminRoleId },
    });
  }

  if (superAdminRoleId) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminRoleId } },
      update: {},
      create: { userId: admin.id, roleId: superAdminRoleId },
    });
  }

  console.log(`Seeded admin user: ${ADMIN_EMAIL}`);
}

async function seedCrops(): Promise<void> {
  for (const def of cropDefinitions) {
    await prisma.crop.upsert({
      where: { name_variety: { name: def.name, variety: def.variety } },
      update: {
        category: def.category,
        growingSeasonDays: def.growingSeasonDays,
        description: def.description,
      },
      create: def,
    });
  }
  console.log(`Seeded ${cropDefinitions.length} crops`);
}

async function seedChartOfAccounts(): Promise<void> {
  const parentMap = new Map<string, string>();

  for (const def of accountDefinitions) {
    const account = await prisma.account.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        type: def.type,
        subtype: def.subtype,
        description: def.description,
        parentId: def.parentCode ? (parentMap.get(def.parentCode) ?? null) : null,
        isActive: true,
      },
      create: {
        code: def.code,
        name: def.name,
        type: def.type,
        subtype: def.subtype,
        description: def.description,
        parentId: def.parentCode ? (parentMap.get(def.parentCode) ?? undefined) : undefined,
        isActive: true,
      },
    });
    parentMap.set(def.code, account.id);
  }

  console.log(`Seeded ${accountDefinitions.length} chart of accounts entries`);
}

async function seedSRSModules(adminId: string): Promise<void> {
  const agentPassword = await bcrypt.hash('agent123', 10);
  const buyerPassword = await bcrypt.hash('buyer123', 10);

  // 1. Seed Field Agent
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@agriplatform.com' },
    update: { passwordHash: agentPassword },
    create: {
      email: 'agent@agriplatform.com',
      passwordHash: agentPassword,
      firstName: 'Tariqul',
      lastName: 'Islam',
      phone: '+8801711223344',
      role: UserRole.FIELD_AGENT,
      isEmailVerified: true,
    },
  });

  await prisma.fieldAgentProfile.upsert({
    where: { id: agentUser.id }, // Using agentUser.id as deterministic profile id
    update: { assignedRegion: 'Rajshahi & Bogura' },
    create: {
      id: agentUser.id,
      userId: agentUser.id,
      assignedRegion: 'Rajshahi & Bogura',
      nationalId: '1987541239874',
      rating: 4.85,
      isVerified: true,
    },
  });

  // 2. Seed Marketplace Buyer
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@agriplatform.com' },
    update: { passwordHash: buyerPassword },
    create: {
      email: 'buyer@agriplatform.com',
      passwordHash: buyerPassword,
      firstName: 'Tanvir',
      lastName: 'Ahmed',
      phone: '+8801822334455',
      role: UserRole.BUYER,
      isEmailVerified: true,
    },
  });

  // 3. Seed Marketplace Product Listings
  const listings = [
    {
      name: 'Organic Miniket Rice',
      category: 'Grains',
      price: 78.00,
      quantity: 2500,
      unit: 'kg',
      description: 'Pesticide-free aromatic Miniket rice direct from Dinajpur paddy fields.',
      deliveryArea: 'Dhaka, Rajshahi, Rangpur',
    },
    {
      name: 'Rajshahi Premium Fazli Mangoes',
      category: 'Fruits',
      price: 135.00,
      quantity: 800,
      unit: 'kg',
      description: 'Naturally ripened, export-grade Fazli mangoes from Bagha orchards.',
      deliveryArea: 'Nationwide',
    },
    {
      name: 'Pure Cold-Pressed Mustard Oil',
      category: 'Oils & Spices',
      price: 290.00,
      quantity: 350,
      unit: 'liter',
      description: '100% natural, unadulterated ghani-pressed mustard oil with high pungency.',
      deliveryArea: 'Dhaka & Chattogram',
    },
  ];

  for (const item of listings) {
    await prisma.productListing.create({
      data: {
        producerId: adminId,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        description: item.description,
        deliveryArea: item.deliveryArea,
        isAvailable: true,
      },
    });
  }

  console.log(`Seeded SRS Extension Modules (Field Agent, Buyer, Product Listings)`);
}

async function seedParthaDemoData(roleMap: Map<string, string>): Promise<void> {
  const farmerPassword = await bcrypt.hash('farmer123', 10);
  const investorPassword = await bcrypt.hash('investor123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const buyerPassword = await bcrypt.hash('buyer123', 10);

  // 1. Farmer User: Abdul Karim
  const farmerUser = await prisma.user.upsert({
    where: { email: 'karim.farmer@example.com' },
    update: {
      passwordHash: farmerPassword,
      firstName: 'Abdul',
      lastName: 'Karim',
      phone: '+8801711000001',
      role: UserRole.FARMER,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    create: {
      email: 'karim.farmer@example.com',
      passwordHash: farmerPassword,
      firstName: 'Abdul',
      lastName: 'Karim',
      phone: '+8801711000001',
      role: UserRole.FARMER,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const farmerRoleId = roleMap.get('FARMER');
  if (farmerRoleId) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: farmerUser.id, roleId: farmerRoleId } },
      update: {},
      create: { userId: farmerUser.id, roleId: farmerRoleId },
    });
  }

  // 1b. Farmer Profile
  const farmerProfile = await prisma.farmerProfile.upsert({
    where: { userId: farmerUser.id },
    update: {
      businessName: 'Karim Agro Enterprise',
      district: 'Bogura',
      division: 'Rajshahi',
      totalLandAcres: 3.5,
      bio: 'Experienced paddy and jute farmer cultivating in Bogura for over 15 years.',
      verificationStatus: FarmerVerificationStatus.VERIFIED,
      verifiedAt: new Date('2025-12-01'),
    },
    create: {
      userId: farmerUser.id,
      businessName: 'Karim Agro Enterprise',
      district: 'Bogura',
      division: 'Rajshahi',
      totalLandAcres: 3.5,
      bio: 'Experienced paddy and jute farmer cultivating in Bogura for over 15 years.',
      verificationStatus: FarmerVerificationStatus.VERIFIED,
      verifiedAt: new Date('2025-12-01'),
    },
  });

  // 1c. Farm
  let farm = await prisma.farm.findFirst({
    where: { farmerProfileId: farmerProfile.id, name: 'Bogura Boro Paddy Lands' },
  });
  if (!farm) {
    farm = await prisma.farm.create({
      data: {
        farmerProfileId: farmerProfile.id,
        name: 'Bogura Boro Paddy Lands',
        description: 'Fertile alluvial arable land with deep tubewell irrigation setup',
        location: 'Bogura, Rajshahi',
        totalAreaAcres: 3.5,
        soilType: 'Alluvial Silt Loam',
        waterSource: 'Deep Tubewell Irrigation',
        status: FarmStatus.ACTIVE,
      },
    });
  }

  // 2. Investor User: Rashida Begum
  const investorUser = await prisma.user.upsert({
    where: { email: 'rashida.investor@example.com' },
    update: {
      passwordHash: investorPassword,
      firstName: 'Rashida',
      lastName: 'Begum',
      phone: '+8801711000002',
      role: UserRole.INVESTOR,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    create: {
      email: 'rashida.investor@example.com',
      passwordHash: investorPassword,
      firstName: 'Rashida',
      lastName: 'Begum',
      phone: '+8801711000002',
      role: UserRole.INVESTOR,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const investorRoleId = roleMap.get('INVESTOR');
  if (investorRoleId) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: investorUser.id, roleId: investorRoleId } },
      update: {},
      create: { userId: investorUser.id, roleId: investorRoleId },
    });
  }

  // 2b. Investor Profile
  const investorProfile = await prisma.investorProfile.upsert({
    where: { userId: investorUser.id },
    update: {
      investorType: InvestorType.INDIVIDUAL,
      totalInvestmentCapacity: 50000.0,
      kycStatus: KYCStatus.VERIFIED,
      kycVerifiedAt: new Date('2026-01-01'),
    },
    create: {
      userId: investorUser.id,
      investorType: InvestorType.INDIVIDUAL,
      totalInvestmentCapacity: 50000.0,
      kycStatus: KYCStatus.VERIFIED,
      kycVerifiedAt: new Date('2026-01-01'),
    },
  });

  // 2c. Investor Web3 Wallet
  await prisma.wallet.upsert({
    where: {
      address_chainId: {
        address: '0x71C83605a96A74C40a1E7A0D54b4249a5C9134b2',
        chainId: 84532,
      },
    },
    update: {
      userId: investorUser.id,
      isPrimary: true,
      label: 'Rashida Base Sepolia Wallet',
    },
    create: {
      userId: investorUser.id,
      address: '0x71C83605a96A74C40a1E7A0D54b4249a5C9134b2',
      chainId: 84532,
      isPrimary: true,
      label: 'Rashida Base Sepolia Wallet',
    },
  });

  // 3. Field Agent User: Jasim Uddin
  const agentUser = await prisma.user.upsert({
    where: { email: 'jasim.agent@example.com' },
    update: {
      passwordHash: agentPassword,
      firstName: 'Jasim',
      lastName: 'Uddin',
      phone: '+8801711000003',
      role: UserRole.FIELD_AGENT,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    create: {
      email: 'jasim.agent@example.com',
      passwordHash: agentPassword,
      firstName: 'Jasim',
      lastName: 'Uddin',
      phone: '+8801711000003',
      role: UserRole.FIELD_AGENT,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const agentRoleId = roleMap.get('FIELD_AGENT');
  if (agentRoleId) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: agentUser.id, roleId: agentRoleId } },
      update: {},
      create: { userId: agentUser.id, roleId: agentRoleId },
    });
  }

  // 3b. Field Agent Profile
  const agentProfile = await prisma.fieldAgentProfile.upsert({
    where: { id: agentUser.id },
    update: {
      assignedRegion: 'Rajshahi Division',
      rating: 4.9,
      isVerified: true,
    },
    create: {
      id: agentUser.id,
      userId: agentUser.id,
      assignedRegion: 'Rajshahi Division',
      rating: 4.9,
      isVerified: true,
    },
  });

  // 4. Buyer User: Nusrat Jahan
  const buyerUser = await prisma.user.upsert({
    where: { email: 'nusrat.buyer@example.com' },
    update: {
      passwordHash: buyerPassword,
      firstName: 'Nusrat',
      lastName: 'Jahan',
      phone: '+8801711000004',
      role: UserRole.BUYER,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    create: {
      email: 'nusrat.buyer@example.com',
      passwordHash: buyerPassword,
      firstName: 'Nusrat',
      lastName: 'Jahan',
      phone: '+8801711000004',
      role: UserRole.BUYER,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const buyerRoleId = roleMap.get('BUYER');
  if (buyerRoleId) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: buyerUser.id, roleId: buyerRoleId } },
      update: {},
      create: { userId: buyerUser.id, roleId: buyerRoleId },
    });
  }

  // 5. Crop
  const riceCrop = await prisma.crop.findFirst({ where: { name: 'Rice' } });

  // 6. Agricultural Project: High-Yield Boro Rice Cultivation
  let project = await prisma.agriculturalProject.findFirst({
    where: { farmerProfileId: farmerProfile.id, name: 'High-Yield Boro Rice Cultivation' },
  });

  if (!project) {
    project = await prisma.agriculturalProject.create({
      data: {
        farmerProfileId: farmerProfile.id,
        farmId: farm.id,
        cropId: riceCrop?.id,
        name: 'High-Yield Boro Rice Cultivation',
        description: 'Season-long Boro rice cultivation on 3.5 acres using improved irrigation techniques.',
        season: 'Boro 2026',
        year: 2026,
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-05-15'),
        expectedYield: 8500.0,
        expectedRevenue: 175000.0,
        status: ProjectStatus.ACTIVE,
      },
    });
  }

  // 7. Deal for Crowdfunding
  let deal = await prisma.deal.findFirst({
    where: { projectId: project.id },
  });

  if (!deal) {
    deal = await prisma.deal.create({
      data: {
        projectId: project.id,
        farmerProfileId: farmerProfile.id,
        title: 'High-Yield Boro Rice Cultivation Deal',
        description: 'Season-long Boro rice cultivation with guaranteed harvest off-take and insurance.',
        status: DealStatus.ACTIVE,
        fundingTarget: 100000.0,
        minimumInvestment: 5000.0,
        maximumInvestment: 50000.0,
        totalInvested: 30000.0,
        investorSharePercent: 60.0,
        farmerSharePercent: 35.0,
        platformFeePercent: 5.0,
        investmentUnits: 20,
        unitPrice: 5000.0,
        durationDays: 120,
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-05-15'),
      },
    });
  }

  // 8. Investment by Rashida Begum
  let investment = await prisma.investment.findFirst({
    where: { dealId: deal.id, investorProfileId: investorProfile.id },
  });

  if (!investment) {
    investment = await prisma.investment.create({
      data: {
        dealId: deal.id,
        investorProfileId: investorProfile.id,
        units: 6,
        amount: 30000.0,
        unitPrice: 5000.0,
        status: InvestmentStatus.ACTIVE,
        idempotencyKey: 'inv-partha-rashida-boro-001',
        confirmedAt: new Date('2026-01-20'),
      },
    });
  }

  // 9. Milestone Update verified by Field Agent Jasim Uddin
  const existingMilestone = await prisma.projectMilestone.findFirst({
    where: { projectId: project.id, sortOrder: 1 },
  });

  if (!existingMilestone) {
    await prisma.projectMilestone.create({
      data: {
        projectId: project.id,
        name: 'Seedling Stage Verification',
        description: 'Seedling stage complete. Irrigation channels functioning well.',
        targetDate: new Date('2026-02-15'),
        completedDate: new Date('2026-02-14'),
        status: MilestoneStatus.VERIFIED,
        sortOrder: 1,
        verifiedByAgentId: agentProfile.id,
        photoUrls: ['https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=800&q=80'],
        expenseLog: 5000.0,
      },
    });
  }

  // 10. AI Risk Score
  const existingRiskScore = await prisma.riskScore.findFirst({
    where: { projectId: project.id },
  });

  if (!existingRiskScore) {
    await prisma.riskScore.create({
      data: {
        projectId: project.id,
        score: 22.5,
        level: RiskLevel.LOW,
        factors: 'Stable rainfall pattern, experienced farmer, no pest history in region',
        recommendation: 'Low risk. Recommended for standard insurance coverage.',
      },
    });
  }

  // 11. Crop Insurance Policy
  const existingPolicy = await prisma.insurancePolicy.findFirst({
    where: { projectId: project.id },
  });

  if (!existingPolicy) {
    await prisma.insurancePolicy.create({
      data: {
        projectId: project.id,
        provider: 'Green Delta Agri Insurance',
        coverageType: 'Crop failure coverage',
        coverageAmount: 100000.0,
        premiumAmount: 1500.0,
        status: InsuranceStatus.ACTIVE,
        startedAt: new Date('2026-01-15'),
      },
    });
  }

  // 12. Product Listing (Marketplace) by Farmer Abdul Karim
  let listing = await prisma.productListing.findFirst({
    where: { producerId: farmerUser.id, name: 'Premium Boro Rice (50kg sack)' },
  });

  if (!listing) {
    listing = await prisma.productListing.create({
      data: {
        producerId: farmerUser.id,
        name: 'Premium Boro Rice (50kg sack)',
        category: 'Rice',
        price: 2500.0,
        quantity: 40,
        unit: 'sack (50kg)',
        description: 'Freshly harvested Boro rice, sun-dried and cleaned.',
        deliveryArea: 'Dhaka, Rajshahi, Bogura',
        isAvailable: true,
      },
    });
  }

  // 13. Order by Buyer Nusrat Jahan
  const existingOrder = await prisma.order.findFirst({
    where: { buyerId: buyerUser.id, listingId: listing.id },
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        buyerId: buyerUser.id,
        listingId: listing.id,
        quantity: 2,
        totalPrice: 5000.0,
        status: OrderStatus.CONFIRMED,
        paymentMethod: PaymentMethod.BKASH,
        deliveryAddress: 'House 14, Road 5, Dhanmondi, Dhaka',
      },
    });
  }

  // 14. Payment Transaction for Investment (bKash)
  const existingPayment = await prisma.payment.findFirst({
    where: { idempotencyKey: 'pay-partha-rashida-boro-001' },
  });

  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        userId: investorUser.id,
        investmentId: investment.id,
        amount: 30000.0,
        currency: 'BDT',
        provider: 'bKash',
        providerReference: 'TRX-BKASH-89234710',
        status: PaymentStatus.COMPLETED,
        idempotencyKey: 'pay-partha-rashida-boro-001',
      },
    });
  }

  // 15. Rating from Investor to Farmer
  const existingRating = await prisma.rating.findFirst({
    where: { fromUserId: investorUser.id, toUserId: farmerUser.id },
  });

  if (!existingRating) {
    await prisma.rating.create({
      data: {
        fromUserId: investorUser.id,
        toUserId: farmerUser.id,
        projectId: project.id,
        stars: 5,
        comment: 'Great communication and progress updates. Very trustworthy.',
      },
    });
  }

  // 16. Notification for Farmer Abdul Karim
  const existingNotification = await prisma.notification.findFirst({
    where: { userId: farmerUser.id, title: 'New Investment Received' },
  });

  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: farmerUser.id,
        type: NotificationType.INVESTMENT_CONFIRMED,
        title: 'New Investment Received',
        message: 'Your project "High-Yield Boro Rice Cultivation" received a new investment of 30,000 taka from Rashida Begum.',
        read: false,
      },
    });
  }

  console.log('Seeded Partha demo dataset (Abdul Karim, Rashida Begum, Jasim Uddin, Nusrat Jahan, Boro Rice project & investment)');
}

async function main(): Promise<void> {
  const roleMap = await seedRoles();
  await seedPermissions(roleMap);
  await seedAdminUser(roleMap);
  await seedCrops();
  await seedChartOfAccounts();

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (admin) {
    await seedSRSModules(admin.id);
  }

  await seedParthaDemoData(roleMap);

  console.log('Database seed completed successfully');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });