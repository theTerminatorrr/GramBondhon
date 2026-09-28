export interface ContractAddresses {
  agriPlatform: string;
  projectRegistry: string;
  dealFactory: string;
  escrow: string;
  profitDistribution: string;
  oracle: string;
}

export type PlatformContractName = keyof ContractAddresses;

export const CONTRACT_ADDRESSES: ContractAddresses = {
  agriPlatform: process.env.AGRI_PLATFORM_ADDRESS ?? '0x0000000000000000000000000000000000000000',
  projectRegistry: process.env.PROJECT_REGISTRY_ADDRESS ?? '0x0000000000000000000000000000000000000000',
  dealFactory: process.env.DEAL_FACTORY_ADDRESS ?? '0x0000000000000000000000000000000000000000',
  escrow: process.env.ESCROW_ADDRESS ?? '0x0000000000000000000000000000000000000000',
  profitDistribution: process.env.PROFIT_DISTRIBUTION_ADDRESS ?? '0x0000000000000000000000000000000000000000',
  oracle: process.env.ORACLE_ADDRESS ?? '0x0000000000000000000000000000000000000000',
} as const;

export function getContractAddress(name: PlatformContractName): `0x${string}` {
  return CONTRACT_ADDRESSES[name] as `0x${string}`;
}

export const PLATFORM_ABIS = {
  agriPlatform: [
    {
      type: 'function',
      name: 'createDeal',
      inputs: [
        { name: 'projectId', type: 'bytes32' },
        { name: 'dealId', type: 'bytes32' },
        { name: 'termsHash', type: 'bytes32' },
        { name: 'fundingTarget', type: 'uint256' },
        { name: 'investorShareBps', type: 'uint256' },
        { name: 'farmerShareBps', type: 'uint256' },
        { name: 'platformFeeBps', type: 'uint256' },
        { name: 'investmentUnits', type: 'uint256' },
        { name: 'unitPrice', type: 'uint256' },
        { name: 'startDate', type: 'uint256' },
        { name: 'endDate', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bytes32' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'registerProject',
      inputs: [
        { name: 'projectId', type: 'bytes32' },
        { name: 'farmer', type: 'address' },
        { name: 'metadataHash', type: 'bytes32' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'verifyProject',
      inputs: [
        { name: 'projectId', type: 'bytes32' },
        { name: 'verified', type: 'bool' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'activateDeal',
      inputs: [{ name: 'dealId', type: 'bytes32' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'submitAttestation',
      inputs: [
        { name: 'entityType', type: 'string' },
        { name: 'entityId', type: 'bytes32' },
        { name: 'dataHash', type: 'bytes32' },
        { name: 'data', type: 'string' },
      ],
      outputs: [{ name: '', type: 'bytes32' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'getDealContract',
      inputs: [{ name: 'dealId', type: 'bytes32' }],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'DealContractDeployed',
      inputs: [
        { name: 'dealId', type: 'bytes32', indexed: true },
        { name: 'contractAddress', type: 'address', indexed: true },
      ],
    },
  ] as const,

  projectRegistry: [
    {
      type: 'function',
      name: 'getProject',
      inputs: [{ name: 'projectId', type: 'bytes32' }],
      outputs: [
        { name: 'id', type: 'bytes32' },
        { name: 'farmer', type: 'address' },
        { name: 'metadataHash', type: 'bytes32' },
        { name: 'verified', type: 'bool' },
        { name: 'createdAt', type: 'uint256' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'isProjectVerified',
      inputs: [{ name: 'projectId', type: 'bytes32' }],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'ProjectRegistered',
      inputs: [
        { name: 'projectId', type: 'bytes32', indexed: true },
        { name: 'farmer', type: 'address', indexed: true },
        { name: 'metadataHash', type: 'bytes32', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'ProjectVerified',
      inputs: [
        { name: 'projectId', type: 'bytes32', indexed: true },
        { name: 'verified', type: 'bool', indexed: false },
      ],
    },
  ] as const,

  dealFactory: [
    {
      type: 'function',
      name: 'getDeal',
      inputs: [{ name: 'dealId', type: 'bytes32' }],
      outputs: [
        { name: 'id', type: 'bytes32' },
        { name: 'projectId', type: 'bytes32' },
        { name: 'farmer', type: 'address' },
        { name: 'fundingTarget', type: 'uint256' },
        { name: 'totalInvested', type: 'uint256' },
        { name: 'investorShareBps', type: 'uint256' },
        { name: 'farmerShareBps', type: 'uint256' },
        { name: 'platformFeeBps', type: 'uint256' },
        { name: 'investmentUnits', type: 'uint256' },
        { name: 'unitPrice', type: 'uint256' },
        { name: 'startDate', type: 'uint256' },
        { name: 'endDate', type: 'uint256' },
        { name: 'status', type: 'uint8' },
        { name: 'termsHash', type: 'bytes32' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'DealCreated',
      inputs: [
        { name: 'dealId', type: 'bytes32', indexed: true },
        { name: 'projectId', type: 'bytes32', indexed: true },
        { name: 'farmer', type: 'address', indexed: true },
      ],
    },
    {
      type: 'event',
      name: 'DealActivated',
      inputs: [{ name: 'dealId', type: 'bytes32', indexed: true }],
    },
  ] as const,

  escrow: [
    {
      type: 'function',
      name: 'fund',
      inputs: [{ name: 'dealId', type: 'bytes32' }],
      outputs: [],
      stateMutability: 'payable',
    },
    {
      type: 'function',
      name: 'release',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'dealId', type: 'bytes32' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'getBalance',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getDealBalance',
      inputs: [{ name: 'dealId', type: 'bytes32' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'FundsDeposited',
      inputs: [
        { name: 'dealId', type: 'bytes32', indexed: true },
        { name: 'investor', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'FundsReleased',
      inputs: [
        { name: 'dealId', type: 'bytes32', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'FundsRefunded',
      inputs: [
        { name: 'dealId', type: 'bytes32', indexed: true },
        { name: 'investor', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'FeeDeducted',
      inputs: [
        { name: 'dealId', type: 'bytes32', indexed: true },
        { name: 'platform', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
      ],
    },
  ] as const,

  profitDistribution: [
    {
      type: 'function',
      name: 'getProfitSplit',
      inputs: [{ name: 'dealId', type: 'bytes32' }],
      outputs: [
        { name: 'totalProfit', type: 'uint256' },
        { name: 'investorShare', type: 'uint256' },
        { name: 'farmerShare', type: 'uint256' },
        { name: 'platformFee', type: 'uint256' },
        { name: 'distributed', type: 'bool' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'ProfitCalculated',
      inputs: [
        { name: 'profitCalculationId', type: 'bytes32', indexed: true },
        { name: 'dealId', type: 'bytes32', indexed: true },
        { name: 'totalProfit', type: 'uint256', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'ProfitDistributed',
      inputs: [
        { name: 'dealId', type: 'bytes32', indexed: true },
        { name: 'investor', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
      ],
    },
  ] as const,

  oracle: [
    {
      type: 'function',
      name: 'getAttestation',
      inputs: [{ name: 'attestationId', type: 'bytes32' }],
      outputs: [
        { name: 'id', type: 'bytes32' },
        { name: 'entityType', type: 'string' },
        { name: 'entityId', type: 'bytes32' },
        { name: 'dataHash', type: 'bytes32' },
        { name: 'data', type: 'string' },
        { name: 'attestor', type: 'address' },
        { name: 'verified', type: 'bool' },
        { name: 'timestamp', type: 'uint256' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'isAttestationVerified',
      inputs: [{ name: 'attestationId', type: 'bytes32' }],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'AttestationSubmitted',
      inputs: [
        { name: 'attestationId', type: 'bytes32', indexed: true },
        { name: 'entityType', type: 'string', indexed: false },
        { name: 'entityId', type: 'bytes32', indexed: true },
        { name: 'dataHash', type: 'bytes32', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'AttestationVerified',
      inputs: [
        { name: 'attestationId', type: 'bytes32', indexed: true },
        { name: 'verified', type: 'bool', indexed: false },
      ],
    },
  ] as const,
} as const;

export function getContractAbi(name: PlatformContractName) {
  return PLATFORM_ABIS[name];
}
