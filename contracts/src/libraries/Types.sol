// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct Project {
    bytes32 id;
    address farmer;
    bytes32 metadataHash;
    bool verified;
    uint256 createdAt;
}

struct Deal {
    bytes32 id;
    bytes32 projectId;
    address farmer;
    uint256 fundingTarget;
    uint256 totalInvested;
    uint256 investorShareBps;
    uint256 farmerShareBps;
    uint256 platformFeeBps;
    uint256 investmentUnits;
    uint256 unitPrice;
    uint256 startDate;
    uint256 endDate;
    DealStatus status;
    bytes32 termsHash;
}

enum DealStatus {
    Draft,
    Published,
    Funding,
    Funded,
    Active,
    Harvesting,
    ProfitCalculation,
    Distribution,
    Settled,
    Closed,
    Cancelled
}

struct Investment {
    bytes32 id;
    bytes32 dealId;
    address investor;
    uint256 units;
    uint256 amount;
    uint256 timestamp;
    InvestmentStatus status;
}

enum InvestmentStatus {
    Pending,
    Confirmed,
    Completed,
    Refunded
}

struct HarvestRecord {
    uint256 quantity;
    bytes32 metadataHash;
    uint256 timestamp;
}

struct RevenueRecord {
    uint256 amount;
    bytes32 metadataHash;
    uint256 timestamp;
}

struct ProfitSplit {
    uint256 investorAmount;
    uint256 farmerAmount;
    uint256 platformFee;
}
