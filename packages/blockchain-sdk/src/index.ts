export {
  createBlockchainPublicClient,
  createBlockchainWalletClient,
  getChainById,
  CHAIN_CONFIGS,
} from './client';

export {
  PLATFORM_ABIS,
  CONTRACT_ADDRESSES,
  getContractAddress,
  getContractAbi,
} from './contracts';

export {
  decodeEventLogs,
  parseInvestmentEvent,
  parseEscrowEvent,
  parseProfitEvent,
  encodeFunctionData,
  formatEventData,
} from './events';

export type {
  ChainConfig,
  ContractAddresses,
  PlatformContractName,
  FormattedEvent,
} from './types';
