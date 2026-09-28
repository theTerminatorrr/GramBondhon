// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../access/AccessControl.sol";
import "../interfaces/IDealFactory.sol";
import "../interfaces/IProjectRegistry.sol";
import "../libraries/Types.sol";

contract DealFactory is AccessControl, IDealFactory {
    IProjectRegistry public immutable projectRegistry;

    mapping(bytes32 => Deal) private _deals;

    modifier onlyFarmer(bytes32 dealId) {
        require(
            _deals[dealId].farmer == msg.sender || hasRole(OWNER_ROLE, msg.sender),
            "DealFactory: not farmer or owner"
        );
        _;
    }

    constructor(address _projectRegistry) {
        require(_projectRegistry != address(0), "DealFactory: zero address");
        projectRegistry = IProjectRegistry(_projectRegistry);
    }

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
    ) external override whenNotPaused returns (bytes32) {
        require(projectId != bytes32(0), "DealFactory: invalid project ID");
        require(dealId != bytes32(0), "DealFactory: invalid deal ID");
        require(projectRegistry.isProjectVerified(projectId), "DealFactory: project not verified");
        require(_deals[dealId].id == bytes32(0), "DealFactory: deal already exists");
        require(
            investorShareBps + farmerShareBps + platformFeeBps == 10000,
            "DealFactory: shares must sum to 100%"
        );
        require(investmentUnits > 0, "DealFactory: units must be > 0");
        require(unitPrice > 0, "DealFactory: unit price must be > 0");
        require(endDate > startDate, "DealFactory: end must be after start");

        (, address farmer,,, ) = projectRegistry.getProject(projectId);
        require(msg.sender == farmer || hasRole(OWNER_ROLE, msg.sender), "DealFactory: not authorized");

        uint256 computedTarget = investmentUnits * unitPrice;
        require(fundingTarget == computedTarget, "DealFactory: funding target mismatch");

        _deals[dealId] = Deal({
            id: dealId,
            projectId: projectId,
            farmer: farmer,
            fundingTarget: fundingTarget,
            totalInvested: 0,
            investorShareBps: investorShareBps,
            farmerShareBps: farmerShareBps,
            platformFeeBps: platformFeeBps,
            investmentUnits: investmentUnits,
            unitPrice: unitPrice,
            startDate: startDate,
            endDate: endDate,
            status: DealStatus.Draft,
            termsHash: termsHash
        });

        emit DealCreated(dealId, projectId, farmer);
        return dealId;
    }

    function activateDeal(bytes32 dealId) external override onlyRole(OWNER_ROLE) {
        require(_deals[dealId].id != bytes32(0), "DealFactory: deal not found");
        require(_deals[dealId].status == DealStatus.Draft, "DealFactory: invalid status");

        _deals[dealId].status = DealStatus.Funding;

        emit DealActivated(dealId);
    }

    function getDeal(
        bytes32 dealId
    ) external view override returns (
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
    ) {
        Deal storage deal = _deals[dealId];
        require(deal.id != bytes32(0), "DealFactory: deal not found");

        return (
            deal.id,
            deal.projectId,
            deal.farmer,
            deal.fundingTarget,
            deal.totalInvested,
            deal.investorShareBps,
            deal.farmerShareBps,
            deal.platformFeeBps,
            deal.investmentUnits,
            deal.unitPrice,
            deal.startDate,
            deal.endDate,
            uint8(deal.status),
            deal.termsHash
        );
    }

    function getStatus(bytes32 dealId) external view override returns (uint8) {
        require(_deals[dealId].id != bytes32(0), "DealFactory: deal not found");
        return uint8(_deals[dealId].status);
    }

    function isDealActive(bytes32 dealId) external view override returns (bool) {
        Deal storage deal = _deals[dealId];
        return deal.id != bytes32(0) && deal.status == DealStatus.Funding;
    }

    function updateTotalInvested(bytes32 dealId, uint256 amount) external onlyRole(ORACLE_ROLE) {
        require(_deals[dealId].id != bytes32(0), "DealFactory: deal not found");
        _deals[dealId].totalInvested += amount;
    }

    function updateDealStatus(bytes32 dealId, DealStatus newStatus) external onlyRole(ORACLE_ROLE) {
        require(_deals[dealId].id != bytes32(0), "DealFactory: deal not found");
        _deals[dealId].status = newStatus;
    }
}
