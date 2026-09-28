import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type HttpTransport,
  type Account,
} from 'viem';
import { hardhat, sepolia, mainnet, base, baseSepolia } from 'viem/chains';

export interface ChainConfig {
  chain: Chain;
  rpcUrl: string;
  name: string;
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [hardhat.id]: {
    chain: hardhat,
    rpcUrl: 'http://127.0.0.1:8545',
    name: 'Local Hardhat',
  },
  [sepolia.id]: {
    chain: sepolia,
    rpcUrl: 'https://rpc.sepolia.org',
    name: 'Sepolia Testnet',
  },
  [mainnet.id]: {
    chain: mainnet,
    rpcUrl: 'https://eth.llamarpc.com',
    name: 'Ethereum Mainnet',
  },
  [base.id]: {
    chain: base,
    rpcUrl: 'https://mainnet.base.org',
    name: 'Base',
  },
  [baseSepolia.id]: {
    chain: baseSepolia,
    rpcUrl: 'https://sepolia.base.org',
    name: 'Base Sepolia Testnet',
  },
};

export function getChainById(chainId: number): ChainConfig {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported: ${Object.keys(CHAIN_CONFIGS).join(', ')}`);
  }
  return config;
}

export function createBlockchainPublicClient(
  rpcUrl: string,
  chainId: number,
): PublicClient<HttpTransport, Chain, undefined> {
  const chainConfig = getChainById(chainId);

  return createPublicClient({
    chain: chainConfig.chain,
    transport: http(rpcUrl, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1_000,
    }),
  });
}

export function createBlockchainWalletClient(
  rpcUrl: string,
  privateKey: `0x${string}` | string,
  chainId: number,
): WalletClient<HttpTransport, Chain, Account> {
  const chainConfig = getChainById(chainId);
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  return createWalletClient({
    account: formattedKey as `0x${string}`,
    chain: chainConfig.chain,
    transport: http(rpcUrl, {
      timeout: 30_000,
      retryCount: 3,
    }),
  });
}
