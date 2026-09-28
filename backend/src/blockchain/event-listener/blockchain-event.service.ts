import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BlockchainService } from '../blockchain.service';
import { PrismaService } from '../../database/database.service';
import { InvestmentHandler } from './handlers/investment.handler';
import { EscrowHandler } from './handlers/escrow.handler';
import { ProfitHandler } from './handlers/profit.handler';
import { parseAbiItem, decodeEventLog, type Log, type AbiEvent } from 'viem';
import Redis from 'ioredis';

const EVENT_POLL_INTERVAL_MS = 4_000;
const MAX_BLOCK_RANGE = 2_000n;
const REORG_BUFFER_BLOCKS = 12n;

const INVESTMENT_MADE_SIG = 'event InvestmentMade(bytes32 indexed investmentId, bytes32 indexed dealId, address indexed investor, uint256 units, uint256 amount)';
const FUNDS_DEPOSITED_SIG = 'event FundsDeposited(bytes32 indexed dealId, address indexed investor, uint256 amount)';
const FUNDS_RELEASED_SIG = 'event FundsReleased(bytes32 indexed dealId, address indexed to, uint256 amount)';
const FUNDS_REFUNDED_SIG = 'event FundsRefunded(bytes32 indexed dealId, address indexed investor, uint256 amount)';
const FEE_DEDUCTED_SIG = 'event FeeDeducted(bytes32 indexed dealId, address indexed platform, uint256 amount)';
const PROFIT_DECLARED_SIG = 'event ProfitDeclared(uint256 investorProfit, uint256 farmerProfit, uint256 platformFee)';
const PROFIT_DISTRIBUTED_SIG = 'event ProfitDistributed(bytes32 indexed dealId, address indexed investor, uint256 amount)';

const TRACKED_EVENTS: { signature: string; abi: AbiEvent; topic: string; handler: string }[] = [
  {
    signature: INVESTMENT_MADE_SIG,
    abi: parseAbiItem(INVESTMENT_MADE_SIG),
    topic: 'investment.made',
    handler: 'investment',
  },
  {
    signature: FUNDS_DEPOSITED_SIG,
    abi: parseAbiItem(FUNDS_DEPOSITED_SIG),
    topic: 'escrow.deposited',
    handler: 'escrow',
  },
  {
    signature: FUNDS_RELEASED_SIG,
    abi: parseAbiItem(FUNDS_RELEASED_SIG),
    topic: 'escrow.released',
    handler: 'escrow',
  },
  {
    signature: FUNDS_REFUNDED_SIG,
    abi: parseAbiItem(FUNDS_REFUNDED_SIG),
    topic: 'escrow.refunded',
    handler: 'escrow',
  },
  {
    signature: FEE_DEDUCTED_SIG,
    abi: parseAbiItem(FEE_DEDUCTED_SIG),
    topic: 'escrow.fee',
    handler: 'escrow',
  },
  {
    signature: PROFIT_DECLARED_SIG,
    abi: parseAbiItem(PROFIT_DECLARED_SIG),
    topic: 'profit.declared',
    handler: 'profit',
  },
  {
    signature: PROFIT_DISTRIBUTED_SIG,
    abi: parseAbiItem(PROFIT_DISTRIBUTED_SIG),
    topic: 'profit.distributed',
    handler: 'profit',
  },
];

@Injectable()
export class BlockchainEventService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainEventService.name);
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private latestProcessedBlock: bigint = 0n;
  private isListening = false;
  private isProcessing = false;
  private contractAddress: `0x${string}` = '0x0000000000000000000000000000000000000000';
  private redisSubscriber: Redis | null = null;
  private useRustIndexer = false;

  constructor(
    private readonly blockchain: BlockchainService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
    private readonly investmentHandler: InvestmentHandler,
    private readonly escrowHandler: EscrowHandler,
    private readonly profitHandler: ProfitHandler,
  ) {}

  async onModuleInit() {
    this.contractAddress = (this.config.get<string>('AGRI_PLATFORM_ADDRESS') ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
    this.useRustIndexer = this.config.get<string>('USE_RUST_INDEXER') === 'true';

    if (this.useRustIndexer) {
      this.logger.log('USE_RUST_INDEXER=true: Subscribing to Redis events from gram-indexer');
      this.initRedisSubscriber();
    } else {
      this.recoverFromRestart()
        .then(() => this.startListening())
        .catch((err) => this.logger.debug('Blockchain sync deferred:', err?.message));
    }
  }

  onModuleDestroy() {
    this.stopListening();
    if (this.redisSubscriber) {
      this.redisSubscriber.disconnect();
      this.redisSubscriber = null;
    }
  }

  private initRedisSubscriber() {
    try {
      const redisUrl = this.config.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379';
      this.redisSubscriber = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 5) {
            this.logger.warn('Redis connection failed repeatedly. Falling back to internal poller.');
            this.startListening();
            return null;
          }
          return Math.min(times * 500, 3000);
        },
      });

      this.redisSubscriber.subscribe('blockchain.events', (err) => {
        if (err) {
          this.logger.error('Failed to subscribe to blockchain.events Redis channel:', err);
          this.startListening();
        } else {
          this.logger.log('Subscribed to blockchain.events channel from Rust gram-indexer');
        }
      });

      this.redisSubscriber.on('message', async (channel, message) => {
        if (channel === 'blockchain.events') {
          await this.handleRustIndexedEvent(message);
        }
      });

      this.redisSubscriber.on('error', (err) => {
        this.logger.warn(`Redis subscriber error: ${err.message}. Starting fallback polling.`);
        this.startListening();
      });

      this.redisSubscriber.on('connect', () => {
        this.logger.log('Connected to Redis event bus for gram-indexer.');
        if (this.isListening) {
          this.logger.log('Redis stream active. Disabling fallback polling.');
          this.stopListening();
        }
      });
    } catch (e: any) {
      this.logger.error('Failed to initialize Redis subscriber, falling back to interval polling:', e.message);
      this.startListening();
    }
  }

  private async handleRustIndexedEvent(rawJson: string) {
    try {
      const event = JSON.parse(rawJson);
      this.logger.debug(`Received event from Rust indexer: ${event.event_type} (${event.id})`);

      const payload = event.payload || {};
      const txHash = event.tx_hash as `0x${string}`;
      const blockNum = BigInt(event.block_number);
      const logIdx = Number(event.log_index);

      if (event.event_type === 'investment.made') {
        await this.investmentHandler.handle({
          args: {
            investmentId: payload.investmentId,
            dealId: payload.dealId,
            investor: payload.investor,
            units: BigInt(payload.units ?? 0),
            amount: BigInt(payload.amount ?? 0),
          },
          transactionHash: txHash,
          blockNumber: blockNum,
          logIndex: logIdx,
        });
      } else if (event.event_type.startsWith('escrow.')) {
        const nameMap: Record<string, string> = {
          'escrow.deposited': 'FundsDeposited',
          'escrow.released': 'FundsReleased',
          'escrow.refunded': 'FundsRefunded',
          'escrow.fee': 'FeeDeducted',
        };
        const eventName = nameMap[event.event_type] || 'FundsDeposited';
        await this.escrowHandler.handle({
          name: eventName,
          args: {
            dealId: payload.dealId,
            investor: payload.investor,
            to: payload.to,
            platform: payload.platform,
            amount: payload.amount ? BigInt(payload.amount) : undefined,
          },
          transactionHash: txHash,
          blockNumber: blockNum,
          logIndex: logIdx,
        });
      } else if (event.event_type.startsWith('profit.')) {
        const nameMap: Record<string, string> = {
          'profit.declared': 'ProfitDeclared',
          'profit.distributed': 'ProfitDistributed',
        };
        const eventName = nameMap[event.event_type] || 'ProfitDistributed';
        await this.profitHandler.handle({
          name: eventName,
          args: {
            dealId: payload.dealId,
            investor: payload.investor,
            amount: payload.amount ? BigInt(payload.amount) : undefined,
            investorProfit: payload.investorProfit ? BigInt(payload.investorProfit) : undefined,
            farmerProfit: payload.farmerProfit ? BigInt(payload.farmerProfit) : undefined,
            platformFee: payload.platformFee ? BigInt(payload.platformFee) : undefined,
          },
          transactionHash: txHash,
          blockNumber: blockNum,
        });
      }

      await this.markProcessed(event.id);
      this.latestProcessedBlock = blockNum;
      this.eventEmitter.emit(`blockchain.${event.event_type}`, event);
    } catch (err: any) {
      this.logger.error('Error dispatching Rust-indexed event:', err);
    }
  }

  startListening() {
    if (this.isListening) return;
    this.isListening = true;

    this.logger.log(
      `Event listener started (poll every ${EVENT_POLL_INTERVAL_MS}ms, contract: ${this.contractAddress})`,
    );

    this.pollTimer = setInterval(async () => {
      if (!this.isProcessing) {
        await this.pollEvents();
      }
    }, EVENT_POLL_INTERVAL_MS);
  }

  stopListening() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isListening = false;
    this.logger.log('Event listener stopped');
  }

  private async pollEvents() {
    this.isProcessing = true;
    try {
      const currentBlock = await this.blockchain.getBlockNumber();
      const safeBlock = currentBlock > REORG_BUFFER_BLOCKS ? currentBlock - REORG_BUFFER_BLOCKS : 0n;

      if (this.latestProcessedBlock >= safeBlock) return;

      const fromBlock = this.latestProcessedBlock + 1n;
      const toBlock = fromBlock + MAX_BLOCK_RANGE - 1n > safeBlock ? safeBlock : fromBlock + MAX_BLOCK_RANGE - 1n;

      await this.processEvents(fromBlock, toBlock);
    } catch (error) {
      this.logger.error('Error polling events', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processEvents(fromBlock: bigint, toBlock: bigint) {
    if (fromBlock > toBlock) return;

    this.logger.debug(`Processing blocks ${fromBlock} to ${toBlock}`);

    for (const tracked of TRACKED_EVENTS) {
      try {
        const logs = await this.blockchain.getContractEventLogs(
          this.contractAddress,
          fromBlock,
          toBlock,
          tracked.abi,
        );

        for (const log of logs) {
          await this.handleEvent(log, tracked);
        }
      } catch (error) {
        this.logger.error(`Error fetching ${tracked.topic} events`, error);
      }
    }

    this.latestProcessedBlock = toBlock;
    await this._updateLastProcessedBlock(toBlock);
  }

  async handleEvent(log: Log, tracked: (typeof TRACKED_EVENTS)[number]) {
    const eventId = `${log.transactionHash}-${log.logIndex}`;

    const existing = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM blockchain_events WHERE id = $1`,
      eventId,
    ).catch(() => []);

    if (existing && existing.length > 0) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO blockchain_events (id, event_type, tx_hash, block_number, log_index, contract_address, data, processed, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO NOTHING`,
        eventId,
        tracked.topic,
        log.transactionHash,
        Number(log.blockNumber),
        log.logIndex,
        log.address,
        JSON.stringify({
          topics: log.topics.map(String),
          data: log.data,
        }),
        false,
      );
    } catch (error) {
      this.logger.error(`Failed to persist event ${eventId}`, error);
      return;
    }

    try {
      const parsed = decodeEventLog({
        abi: [tracked.abi],
        data: log.data,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      });

      const enrichedEvent = {
        ...parsed,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        contractAddress: log.address,
      };

      switch (tracked.handler) {
        case 'investment':
          await this.investmentHandler.handle(
            enrichedEvent as unknown as Parameters<typeof this.investmentHandler.handle>[0],
          );
          break;
        case 'escrow':
          await this.escrowHandler.handle(
            enrichedEvent as unknown as Parameters<typeof this.escrowHandler.handle>[0],
          );
          break;
        case 'profit':
          await this.profitHandler.handle(
            enrichedEvent as unknown as Parameters<typeof this.profitHandler.handle>[0],
          );
          break;
      }

      await this.markProcessed(eventId);

      this.eventEmitter.emit(`blockchain.${tracked.topic}`, enrichedEvent);
    } catch (error) {
      this.logger.error(`Error handling event ${eventId} (${tracked.topic})`, error);
    }
  }

  getLatestProcessedBlock(): bigint {
    return this.latestProcessedBlock;
  }

  async handleReorg(blockNumber: bigint) {
    this.logger.warn(`Handling reorg at block ${blockNumber}`);

    if (blockNumber <= this.latestProcessedBlock) {
      const revertedEvents = await this.prisma.$executeRawUnsafe(
        `UPDATE blockchain_events SET processed = false, reorged = true WHERE block_number >= $1`,
        Number(blockNumber),
      );

      this.latestProcessedBlock = blockNumber - 1n;
      await this._updateLastProcessedBlock(this.latestProcessedBlock);

      this.logger.warn(
        `Reverted ${revertedEvents} events from block ${blockNumber}. Re-processing...`,
      );

      const currentBlock = await this.blockchain.getBlockNumber();
      await this.processEvents(blockNumber, currentBlock > REORG_BUFFER_BLOCKS ? currentBlock - REORG_BUFFER_BLOCKS : currentBlock);

      this.eventEmitter.emit('blockchain.reorg.handled', { blockNumber });
    }
  }

  async getUnprocessedEvents() {
    return this.prisma.$queryRawUnsafe<{ id: string; event_type: string; tx_hash: string; block_number: number; data: string }[]>(
      `SELECT id, event_type, tx_hash, block_number, data FROM blockchain_events WHERE processed = false ORDER BY block_number ASC LIMIT 100`,
    );
  }

  async markProcessed(eventId: string) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE blockchain_events SET processed = true, processed_at = NOW() WHERE id = $1`,
      eventId,
    ).catch((error) => {
      this.logger.error(`Failed to mark event ${eventId} as processed`, error);
    });
  }

  async recoverFromRestart() {
    try {
      const result = await this.prisma.$queryRawUnsafe<{ last_block: number | null }[]>(
        `SELECT MAX(block_number) as last_block FROM blockchain_events WHERE processed = true`,
      );

      if (result[0]?.last_block != null) {
        this.latestProcessedBlock = BigInt(result[0].last_block);
        this.logger.log(`Recovered from block ${this.latestProcessedBlock}`);
      } else {
        const currentBlock = await this.blockchain.getBlockNumber();
        this.latestProcessedBlock = currentBlock > REORG_BUFFER_BLOCKS ? currentBlock - REORG_BUFFER_BLOCKS : 0n;
        await this._updateLastProcessedBlock(this.latestProcessedBlock);
        this.logger.log(`No previous state found, starting from block ${this.latestProcessedBlock}`);
      }
    } catch (error) {
      this.logger.warn('Could not recover state, starting from current block');
      const currentBlock = await this.blockchain.getBlockNumber();
      this.latestProcessedBlock = currentBlock > REORG_BUFFER_BLOCKS ? currentBlock - REORG_BUFFER_BLOCKS : 0n;
      await this._updateLastProcessedBlock(this.latestProcessedBlock).catch(() => {});
    }
  }

  private async _updateLastProcessedBlock(blockNumber: bigint) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO blockchain_sync_state (key, value, updated_at) VALUES ('last_processed_block', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      Number(blockNumber),
    ).catch((error) => {
      this.logger.debug('Failed to persist sync state (table may not exist yet)');
    });
  }
}
