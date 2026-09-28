// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/Types.sol";

interface IDealFactory {
    function createDeal(
        bytes32 projectId,
        bytes32 dealId,
        bytes32 termsHash,
        uint256 fundingTarget,
        uint256 investorShareBps,
        uint256 farmerShareBps,
        uint256 platformFeeBps,
        uint256 investmentUnits,
        uint256 unitPrice,
        uint256 startDate,
        uint256 endDate
    ) external returns (bytes32);

    function activateDeal(bytes32 dealId) external;

    function updateTotalInvested(bytes32 dealId, uint256 amount) external;

    function updateDealStatus(bytes32 dealId, DealStatus newStatus) external;

    function getDeal(bytes32 dealId) external view returns (
        bytes32 id,
        bytes32 projectId,
        address farmer,
        uint256 fundingTarget,
        uint256 totalInvested,
        uint256 investorShareBps,
        uint256 farmerShareBps,
        uint256 platformFeeBps,
        uint256 investmentUnits,
        uint256 unitPrice,
        uint256 startDate,
        uint256 endDate,
        uint8 status,
        bytes32 termsHash
    );

    function getStatus(bytes32 dealId) external view returns (uint8);

    function isDealActive(bytes32 dealId) external view returns (bool);

    event DealCreated(bytes32 indexed dealId, bytes32 indexed projectId, address indexed farmer);

    event DealActivated(bytes32 indexed dealId);
}
