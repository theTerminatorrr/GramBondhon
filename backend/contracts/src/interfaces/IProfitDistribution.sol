// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IProfitDistribution {
    function calculateAndDistribute(
        bytes32 profitCalculationId,
        bytes32 dealId,
        address[] calldata investorAddresses,
        uint256[] calldata investorAmounts,
        uint256 farmerAmount,
        uint256 platformFee
    ) external;

    function distributeProfit(address investorAddress, uint256 amount, bytes32 dealId) external;

    function getProfitSplit(bytes32 dealId) external view returns (
        uint256 totalProfit,
        uint256 investorShare,
        uint256 farmerShare,
        uint256 platformFee,
        bool distributed
    );

    event ProfitCalculated(bytes32 indexed profitCalculationId, bytes32 indexed dealId, uint256 totalProfit);

    event ProfitDistributed(bytes32 indexed dealId, address indexed investor, uint256 amount);
}
