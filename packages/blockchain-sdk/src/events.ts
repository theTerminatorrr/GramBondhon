import { decodeEventLog, encodeFunctionData as viemEncodeFunctionData, type AbiEvent, type Hex } from 'viem';
import { PLATFORM_ABIS } from './contracts';

export interface FormattedEvent {
  name: string;
  args: Record<string, unknown>;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
  contractAddress: string;
}

export function decodeEventLogs(
  abi: readonly unknown[],
  logs: { topics: (Hex | undefined)[]; data: Hex; transactionHash: string; blockNumber: bigint; logIndex: number; address: string }[],
): FormattedEvent[] {
  const events: FormattedEvent[] = [];

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: abi as any,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      }) as { eventName: string; args: Record<string, any> };

      events.push({
        name: decoded.eventName,
        args: Object.fromEntries(
          Object.entries(decoded.args).filter(([key]) => typeof key === 'string'),
        ),
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        contractAddress: log.address,
      });
    } catch {
      // Skip logs that don't match this ABI
    }
  }

  return events;
}

export function parseInvestmentEvent(log: {
  topics: (Hex | undefined)[];
  data: Hex;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
  address: string;
}): FormattedEvent | null {
  const events = decodeEventLogs(PLATFORM_ABIS.dealFactory, [log]);
  return events.find((e) => e.name === 'InvestmentMade') ?? null;
}

export function parseEscrowEvent(log: {
  topics: (Hex | undefined)[];
  data: Hex;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
  address: string;
}): FormattedEvent | null {
  const events = decodeEventLogs(PLATFORM_ABIS.escrow, [log]);
  return events[0] ?? null;
}

export function parseProfitEvent(log: {
  topics: (Hex | undefined)[];
  data: Hex;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
  address: string;
}): FormattedEvent | null {
  const events = decodeEventLogs(PLATFORM_ABIS.profitDistribution, [log]);
  return events[0] ?? null;
}

export function encodeFunctionData(
  contractName: keyof typeof PLATFORM_ABIS,
  functionName: string,
  args: readonly unknown[],
): Hex {
  const abi = PLATFORM_ABIS[contractName] as any;
  return viemEncodeFunctionData({
    abi,
    functionName,
    args: args as any,
  });
}

export function formatEventData(event: FormattedEvent): Record<string, string> {
  const formatted: Record<string, string> = {
    event: event.name,
    txHash: event.transactionHash,
    block: event.blockNumber.toString(),
    logIndex: event.logIndex.toString(),
    contract: event.contractAddress,
  };

  for (const [key, value] of Object.entries(event.args)) {
    if (typeof value === 'bigint') {
      formatted[key] = value.toString();
    } else if (typeof value === 'string' && value.startsWith('0x')) {
      formatted[key] = value;
    } else {
      formatted[key] = String(value);
    }
  }

  return formatted;
}
