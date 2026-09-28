import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainEventService } from './event-listener/blockchain-event.service';
import { BlockchainQueryDto } from './dto/blockchain-query.dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly eventService: BlockchainEventService,
  ) {}

  @Get('status')
  async getStatus() {
    try {
      const blockNumber = await this.blockchainService.getBlockNumber();
      const chainId = this.blockchainService.getChainId();

      return {
        connected: true,
        chainId,
        blockNumber: blockNumber.toString(),
        latestProcessedBlock: this.eventService.getLatestProcessedBlock().toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        connected: false,
        chainId: 0,
        blockNumber: '0',
        latestProcessedBlock: '0',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('transactions')
  async getTransactions(@Query() query: BlockchainQueryDto) {
    const client = this.blockchainService.getPublicClient();
    const latestBlock = await this.blockchainService.getBlockNumber();

    const fromBlock = query.fromBlock
      ? BigInt(query.fromBlock)
      : latestBlock > 100n ? latestBlock - 100n : 0n;
    const toBlock = query.toBlock ? BigInt(query.toBlock) : latestBlock;

    const limit = Math.min(query.limit ?? 50, 200);

    const unprocessedEvents = await this.eventService.getUnprocessedEvents();
    const transactions = unprocessedEvents.slice(0, limit).map((event) => ({
      txHash: event.tx_hash,
      eventType: event.event_type,
      blockNumber: event.block_number,
      processed: false,
      timestamp: null,
    }));

    return {
      transactions,
      pagination: {
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        limit,
        total: transactions.length,
      },
    };
  }

  @Get('transactions/:txHash')
  async getTransaction(@Param('txHash') txHash: string) {
    const receipt = await this.blockchainService.getTransactionReceipt(txHash as `0x${string}`);

    if (!receipt) {
      return {
        found: false,
        txHash,
        message: 'Transaction not found or not yet mined',
      };
    }

    return {
      found: true,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
      status: receipt.status,
      from: receipt.from,
      to: receipt.to,
      gasUsed: receipt.gasUsed.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      logs: receipt.logs.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('events')
  async getEvents(@Query() query: BlockchainQueryDto) {
    const limit = Math.min(query.limit ?? 50, 200);
    const unprocessedEvents = await this.eventService.getUnprocessedEvents();

    const events = unprocessedEvents.slice(0, limit).map((event) => {
      let parsedData: Record<string, unknown> = {};
      try {
        parsedData = JSON.parse(event.data);
      } catch {
        parsedData = { raw: event.data };
      }

      return {
        id: event.id,
        eventType: event.event_type,
        txHash: event.tx_hash,
        blockNumber: event.block_number,
        data: parsedData,
        processed: false,
      };
    });

    return {
      events,
      total: events.length,
      latestProcessedBlock: this.eventService.getLatestProcessedBlock().toString(),
    };
  }

  @Get('sync-status')
  @HttpCode(HttpStatus.OK)
  async getSyncStatus() {
    return {
      latestProcessedBlock: this.eventService.getLatestProcessedBlock().toString(),
      isListening: true,
      timestamp: new Date().toISOString(),
    };
  }
}
