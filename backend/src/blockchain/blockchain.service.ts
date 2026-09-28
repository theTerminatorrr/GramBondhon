import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type HttpTransport,
  type Account,
  type TransactionReceipt,
  type TransactionRequest,
  parseAbiItem,
  type AbiEvent,
  type GetContractEventsParameters,
  type Log,
  type BlockNumber,
  type Hash,
} from 'viem';
import { hardhat, sepolia, mainnet, baseSepolia } from 'viem/chains';

const SUPPORTED_CHAINS: Record<number, Chain> = {
  [hardhat.id]: hardhat,
  [sepolia.id]: sepolia,
  [mainnet.id]: mainnet,
  [baseSepolia.id]: baseSepolia,
};

/**
 * Core service interacting with EVM smart contracts on-chain.
 * @contract contracts/src/AgriPlatform.sol
 * @contract contracts/src/DealContract.sol
 * @contract contracts/src/DealFactory.sol
 * @contract contracts/src/Escrow.sol
 * @contract contracts/src/ProfitDistribution.sol
 * @contract contracts/src/ProjectRegistry.sol
 */
@Injectable()
export class BlockchainService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainService.name);
  private publicClient!: PublicClient<HttpTransport, Chain, undefined>;
  private walletClient!: WalletClient<HttpTransport, Chain, Account>;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const chainId = this.config.get<number>('BLOCKCHAIN_CHAIN_ID', 31337);
    const rpcUrl = this.config.get<string>('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545');

    this.publicClient = createPublicClient({
      chain: SUPPORTED_CHAINS[chainId] ?? hardhat,
      transport: http(rpcUrl, {
        timeout: 2_000,
        retryCount: 1,
        retryDelay: 300,
      }),
    });

    const privateKey = this.config.get<string>('BLOCKCHAIN_PRIVATE_KEY');
    if (privateKey) {
      const account = privateKey.startsWith('0x')
        ? (privateKey as `0x${string}`)
        : (`0x${privateKey}` as `0x${string}`);

      this.walletClient = createWalletClient({
        account,
        chain: SUPPORTED_CHAINS[chainId] ?? hardhat,
        transport: http(rpcUrl, {
          timeout: 2_000,
          retryCount: 1,
        }),
      });

      this.logger.log(`Blockchain wallet client initialized for ${account}`);
    }

    this.logger.log(`Blockchain client initialized - chain ${chainId} at ${rpcUrl}`);
  }

  async onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  getPublicClient(): PublicClient<HttpTransport, Chain, undefined> {
    return this.publicClient;
  }

  getWalletClient(): WalletClient<HttpTransport, Chain, Account> {
    if (!this.walletClient) {
      throw new Error('Wallet client not configured. Set BLOCKCHAIN_PRIVATE_KEY.');
    }
    return this.walletClient;
  }

  getChainId(): number {
    return this.publicClient.chain?.id ?? 0;
  }

  async getBlockNumber(): Promise<bigint> {
    try {
      return await this.publicClient.getBlockNumber();
    } catch (error) {
      this.logger.debug('Blockchain RPC offline, returning 0n');
      return 0n;
    }
  }

  async getTransaction(txHash: Hash) {
    try {
      return await this.publicClient.getTransaction({ hash: txHash });
    } catch (error) {
      this.logger.error(`Failed to get transaction ${txHash}`, error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash: Hash): Promise<TransactionReceipt | null> {
    try {
      return await this.publicClient.getTransactionReceipt({ hash: txHash });
    } catch (error) {
      this.logger.error(`Failed to get receipt for ${txHash}`, error);
      return null;
    }
  }

  async waitForConfirmation(
    txHash: Hash,
    confirmations: number = this.config.get<number>('BLOCKCHAIN_CONFIRMATIONS', 1),
  ): Promise<TransactionReceipt> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations,
        timeout: 120_000,
      });
      this.logger.log(`Transaction ${txHash} confirmed in block ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      this.logger.error(`Timeout waiting for confirmation of ${txHash}`, error);
      throw error;
    }
  }

  async estimateGas(params: {
    to: `0x${string}`;
    data?: `0x${string}`;
    value?: bigint;
    account?: `0x${string}`;
  }) {
    try {
      return await this.publicClient.estimateGas({
        to: params.to,
        data: params.data,
        value: params.value,
        account: params.account,
      });
    } catch (error) {
      this.logger.error('Gas estimation failed', error);
      throw error;
    }
  }

  async sendTransaction(
    params: Omit<TransactionRequest, 'from'> & { account?: `0x${string}` },
  ): Promise<Hash> {
    const wallet = this.getWalletClient();
    const account = params.account ?? wallet.account?.address;

    if (!account) {
      throw new Error('No account available for transaction');
    }

    try {
      const request = {
        to: params.to,
        data: params.data,
        value: params.value,
        chain: this.publicClient.chain,
        account,
        gas: params.gas,
        nonce: params.nonce,
        ...(params.maxFeePerGas !== undefined && {
          maxFeePerGas: params.maxFeePerGas,
          maxPriorityFeePerGas: params.maxPriorityFeePerGas,
        }),
        ...(params.gasPrice !== undefined
          ? { gasPrice: params.gasPrice }
          : params.maxFeePerGas === undefined
            ? { maxFeePerGas: undefined, maxPriorityFeePerGas: undefined, gasPrice: undefined }
            : {}),
      };

      const hash = await wallet.sendTransaction(request as Parameters<typeof wallet.sendTransaction>[0]);

      this.logger.log(`Transaction sent: ${hash}`);
      return hash;
    } catch (error) {
      this.logger.error('Failed to send transaction', error);
      throw error;
    }
  }

  async getContractEventLogs(
    address: `0x${string}`,
    fromBlock: bigint,
    toBlock: bigint | 'latest',
    eventAbi: AbiEvent,
  ): Promise<Log[]> {
    try {
      return await this.publicClient.getLogs({
        address,
        event: eventAbi,
        fromBlock,
        toBlock,
      });
    } catch (error) {
      this.logger.error(`Failed to get logs from ${fromBlock} to ${toBlock}`, error);
      throw error;
    }
  }

  async getBalance(address: `0x${string}`): Promise<bigint> {
    try {
      return await this.publicClient.getBalance({ address });
    } catch (error) {
      this.logger.error(`Failed to get balance for ${address}`, error);
      throw error;
    }
  }

  async getBlock(timestamp: bigint) {
    try {
      return await this.publicClient.getBlock({ blockNumber: timestamp });
    } catch (error) {
      this.logger.error('Failed to get block', error);
      throw error;
    }
  }

  async getBlockByTimestamp(timestamp: number, closest: 'before' | 'after' = 'before') {
    try {
      return await this.publicClient.getBlock({ blockTag: closest === 'before' ? 'latest' : 'pending' });
    } catch (error) {
      this.logger.error('Failed to get block by timestamp', error);
      throw error;
    }
  }
}
