// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../access/AccessControl.sol";
import "../interfaces/IProfitDistribution.sol";
import "../interfaces/IDealFactory.sol";
import "../interfaces/IEscrow.sol";
import "../libraries/Types.sol";

contract ProfitDistribution is AccessControl, IProfitDistribution {
    IEscrow public immutable escrow;

    struct ProfitRecord {
        bytes32 profitCalculationId;
        bytes32 dealId;
        uint256 totalProfit;
        uint256 investorShare;
        uint256 farmerShare;
        uint256 platformFee;
        bool distributed;
        uint256 timestamp;
    }

    mapping(bytes32 => ProfitRecord) private _profitRecords;
    mapping(bytes32 => uint256) private _investorPaidAmount;
    bytes32[] private _profitCalculationIds;

    modifier onlyAuthorized() {
        require(
            hasRole(ORACLE_ROLE, msg.sender) || hasRole(OWNER_ROLE, msg.sender),
            "ProfitDistribution: not authorized"
        );
        _;
    }

    constructor(address _escrow) {
        require(_escrow != address(0), "ProfitDistribution: zero address");
        escrow = IEscrow(_escrow);
    }

    function calculateAndDistribute(
        bytes32 profitCalculationId,
        bytes32 dealId,
        address[] calldata investorAddresses,
        uint256[] calldata investorAmounts,
        uint256 farmerAmount,
        uint256 platformFee
    ) external override onlyAuthorized whenNotPaused {
        require(profitCalculationId != bytes32(0), "ProfitDistribution: invalid ID");
        require(investorAddresses.length == investorAmounts.length, "ProfitDistribution: length mismatch");
        require(investorAddresses.length > 0, "ProfitDistribution: no investors");

        uint256 totalInvestorAmount = 0;
        for (uint256 i = 0; i < investorAmounts.length; i++) {
            require(investorAmounts[i] > 0, "ProfitDistribution: zero amount");
            totalInvestorAmount += investorAmounts[i];
        }

        uint256 totalProfit = totalInvestorAmount + farmerAmount + platformFee;

        _profitRecords[profitCalculationId] = ProfitRecord({
            profitCalculationId: profitCalculationId,
            dealId: dealId,
            totalProfit: totalProfit,
            investorShare: totalInvestorAmount,
            farmerShare: farmerAmount,
            platformFee: platformFee,
            distributed: false,
            timestamp: block.timestamp
        });

        _profitCalculationIds.push(profitCalculationId);

        emit ProfitCalculated(profitCalculationId, dealId, totalProfit);

        for (uint256 i = 0; i < investorAddresses.length; i++) {
            require(investorAddresses[i] != address(0), "ProfitDistribution: zero address");
            _distributeToInvestor(dealId, investorAddresses[i], investorAmounts[i]);
        }

        if (farmerAmount > 0) {
            (, address farmer, , , ) = _getDealInfo(dealId);
            if (farmer != address(0)) {
                escrow.release(farmer, farmerAmount, dealId);
            }
        }

        if (platformFee > 0) {
            escrow.deductFee(owner(), platformFee, dealId);
        }

        _profitRecords[profitCalculationId].distributed = true;
    }

    function distributeProfit(
        address investorAddress,
        uint256 amount,
        bytes32 dealId
    ) external override onlyAuthorized whenNotPaused {
        require(investorAddress != address(0), "ProfitDistribution: zero address");
        require(amount > 0, "ProfitDistribution: zero amount");

        _distributeToInvestor(dealId, investorAddress, amount);
    }

    function getProfitSplit(
        bytes32 dealId
    ) external view override returns (
        uint256 totalProfit,
        uint256 investorShare,
        uint256 farmerShare,
        uint256 platformFee,
        bool distributed
    ) {
        bytes32 latestId = _findLatestProfitRecord(dealId);
        require(latestId != bytes32(0), "ProfitDistribution: not found");

        ProfitRecord storage record = _profitRecords[latestId];
        return (
            record.totalProfit,
            record.investorShare,
            record.farmerShare,
            record.platformFee,
            record.distributed
        );
    }

    function getInvestorPaidAmount(bytes32 dealId, address investor) external view returns (uint256) {
        return _investorPaidAmount[keccak256(abi.encodePacked(dealId, investor))];
    }

    function _distributeToInvestor(
        bytes32 dealId,
        address investor,
        uint256 amount
    ) internal {
        bytes32 key = keccak256(abi.encodePacked(dealId, investor));
        _investorPaidAmount[key] += amount;

        escrow.release(investor, amount, dealId);

        emit ProfitDistributed(dealId, investor, amount);
    }

    function _getDealInfo(bytes32 dealId) internal view returns (
        bytes32 id,
        address farmer,
        bytes32 termsHash,
        uint256 fundingTarget,
        uint256 totalInvested
    ) {
        (id, , farmer, fundingTarget, totalInvested, , , , , , , , , termsHash) =
            IDealFactory(msg.sender).getDeal(dealId);
    }

    function _findLatestProfitRecord(bytes32 dealId) internal view returns (bytes32) {
        for (uint256 i = _profitCalculationIds.length; i > 0; i--) {
            if (_profitRecords[_profitCalculationIds[i - 1]].dealId == dealId) {
                return _profitCalculationIds[i - 1];
            }
        }
        return bytes32(0);
    }

    function getProfitRecordCount() external view returns (uint256) {
        return _profitCalculationIds.length;
    }

    receive() external payable {
        revert("ProfitDistribution: no direct deposits");
    }
}
