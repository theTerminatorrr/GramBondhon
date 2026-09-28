import { Hash, Address } from 'viem';

export interface BlockchainTransaction {
  txHash: string;
  blockNumber: number;
  from: string;
  to: string | null;
  value: string;
  gasUsed: string;
  status: 'success' | 'reverted';
  timestamp: Date;
}

export interface BlockchainEventRecord {
  id: string;
  eventType: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  contractAddress: string;
  data: Record<string, unknown>;
  processed: boolean;
  reorged: boolean;
  createdAt: Date;
  processedAt: Date | null;
}

export interface ChainStatus {
  connected: boolean;
  chainId: number;
  blockNumber: string;
  latestProcessedBlock: string;
  timestamp: string;
  error?: string;
}

export interface ParsedEvent {
  name: string;
  args: Record<string, unknown>;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
  contractAddress: string;
}

export interface InvestmentEvent extends ParsedEvent {
  name: 'InvestmentMade';
  args: {
    investmentId: Hash;
    dealId: Hash;
    investor: Address;
    units: bigint;
    amount: bigint;
  };
}

export interface EscrowDepositEvent extends ParsedEvent {
  name: 'FundsDeposited';
  args: {
    dealId: Hash;
    investor: Address;
    amount: bigint;
  };
}

export interface EscrowReleaseEvent extends ParsedEvent {
  name: 'FundsReleased';
  args: {
    dealId: Hash;
    to: Address;
    amount: bigint;
  };
}

export interface ProfitDeclaredEvent extends ParsedEvent {
  name: 'ProfitDeclared';
  args: {
    investorProfit: bigint;
    farmerProfit: bigint;
    platformFee: bigint;
  };
}

export interface ProfitDistributedEvent extends ParsedEvent {
  name: 'ProfitDistributed';
  args: {
    dealId: Hash;
    investor: Address;
    amount: bigint;
  };
}

export interface ReconciliationDiscrepancy {
  id: string;
  type: 'INVESTMENT' | 'ESCROW_BALANCE' | 'TRANSACTION_STATUS';
  description: string;
  dbValue: string;
  chainValue: string;
  dealId: string | null;
  investmentId: string | null;
  txHash: string | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  autoFixable: boolean;
  detectedAt: Date;
  resolvedAt: Date | null;
}

export interface EventPollingConfig {
  intervalMs: number;
  maxBlockRange: bigint;
  reorgBufferBlocks: bigint;
  contractAddress: string;
}
