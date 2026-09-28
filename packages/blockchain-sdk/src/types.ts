import { type Chain, type HttpTransport, type PublicClient, type WalletClient, type Account } from 'viem';

export interface ChainConfig {
  chain: Chain;
  rpcUrl: string;
  name: string;
}

export interface ContractAddresses {
  agriPlatform: string;
  projectRegistry: string;
  dealFactory: string;
  escrow: string;
  profitDistribution: string;
  oracle: string;
}

export type PlatformContractName = keyof ContractAddresses;

export interface FormattedEvent {
  name: string;
  args: Record<string, unknown>;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
  contractAddress: string;
}
