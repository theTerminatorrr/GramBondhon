import { AccountType } from '@prisma/client';

export interface AccountSeedData {
  code: string;
  name: string;
  type: AccountType;
  subtype?: string;
  description?: string;
}

export const CASH_ACCOUNT: AccountSeedData = {
  code: '1000',
  name: 'Cash & Bank',
  type: 'ASSET',
  description: 'Operational cash and bank balances',
};

export const INVESTOR_RECEIVABLE_ACCOUNT: AccountSeedData = {
  code: '1201',
  name: 'Investor Receivable',
  type: 'ASSET',
  description: 'Amounts receivable from investors for committed investments',
};

export const PLATFORM_FEE_REVENUE_ACCOUNT: AccountSeedData = {
  code: '4001',
  name: 'Platform Fee Revenue',
  type: 'REVENUE',
  description: 'Fees earned by the platform',
};

export const SALES_REVENUE_ACCOUNT: AccountSeedData = {
  code: '4002',
  name: 'Sales Revenue',
  type: 'REVENUE',
  description: 'Revenue recognized from project sales',
};

export const PROJECT_EXPENSE_ACCOUNT: AccountSeedData = {
  code: '5001',
  name: 'Project Expenses',
  type: 'EXPENSE',
  description: 'Operating expenses incurred by projects',
};

export const INCOME_SUMMARY_ACCOUNT: AccountSeedData = {
  code: '3001',
  name: 'Income Summary',
  type: 'EQUITY',
  description: 'Temporary account used to close revenue and expenses',
};

export function escrowFundsAccountFor(dealId: string): AccountSeedData {
  return {
    code: `1101-${dealId}`,
    name: `Escrow Funds - ${dealId}`,
    type: 'ASSET',
    subtype: 'ESCROW',
    description: `Funds held in escrow for deal ${dealId}`,
  };
}

export function investorPayableAccountFor(dealId: string): AccountSeedData {
  return {
    code: `2101-${dealId}`,
    name: `Investor Payable - ${dealId}`,
    type: 'LIABILITY',
    subtype: 'ESCROW',
    description: `Amounts owed to investors for deal ${dealId}`,
  };
}

export function farmerPayableAccountFor(dealId: string): AccountSeedData {
  return {
    code: `2102-${dealId}`,
    name: `Farmer Payable - ${dealId}`,
    type: 'LIABILITY',
    subtype: 'SETTLEMENT',
    description: `Amounts owed to farmers for deal ${dealId}`,
  };
}