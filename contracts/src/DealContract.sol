// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../access/AccessControl.sol";
import "../interfaces/IEscrow.sol";
import "../interfaces/IDealFactory.sol";
import "../libraries/Types.sol";

contract DealContract is AccessControl {
    IDealFactory public immutable dealFactory;
    IEscrow public immutable escrow;

    bytes32 public dealId;

    mapping(bytes32 => Investment) private _investments;
    bytes32[] private _investmentIds;
    mapping(address => bytes32[]) private _investorInvestments;

    HarvestRecord[] private _harvests;
    RevenueRecord[] private _revenues;

    uint256 public totalInvested;
    uint256 public totalUnits;
    bool public settled;

    event InvestmentMade(bytes32 indexed investmentId, bytes32 indexed dealId, address indexed investor, uint256 units, uint256 amount);
    event InvestmentConfirmed(bytes32 indexed investmentId);
    event InvestmentRefunded(bytes32 indexed investmentId);
    event HarvestRecorded(uint256 indexed index, uint256 quantity, bytes32 metadataHash);
    event RevenueRecorded(uint256 indexed index, uint256 amount, bytes32 metadataHash);
    event ProfitDeclared(uint256 investorProfit, uint256 farmerProfit, uint256 platformFee);
    event DealSettled();

    modifier onlyFarmerOrOwner() {
        (, , address farmer, , , , , , , , , , , ) = dealFactory.getDeal(dealId);
        require(msg.sender == farmer || hasRole(OWNER_ROLE, msg.sender), "DealContract: not authorized");
        _;
    }

    constructor(
        bytes32 _dealId,
        address _dealFactory,
        address _escrow
    ) {
        require(_dealId != bytes32(0), "DealContract: zero dealId");
        require(_dealFactory != address(0), "DealContract: zero dealFactory");
        require(_escrow != address(0), "DealContract: zero escrow");

        dealId = _dealId;
        dealFactory = IDealFactory(_dealFactory);
        escrow = IEscrow(_escrow);
    }

    function invest(
        address investorAddress,
        uint256 units
    ) external payable whenNotPaused {
        require(!settled, "DealContract: settled");
        require(investorAddress != address(0), "DealContract: zero address");
        require(units > 0, "DealContract: zero units");

        (,,, uint256 fundingTarget, uint256 currentInvested, , , , uint256 investmentUnits, uint256 unitPrice, , , uint8 status, ) =
            dealFactory.getDeal(dealId);
        require(status == uint8(DealStatus.Funding), "DealContract: not funding");
        require(totalUnits + units <= investmentUnits, "DealContract: exceeds available units");

        uint256 expectedAmount = units * unitPrice;
        require(msg.value == expectedAmount, "DealContract: incorrect payment amount");
        require(msg.sender == investorAddress, "DealContract: sender mismatch");

        bytes32 investmentId = keccak256(abi.encodePacked(dealId, investorAddress, block.timestamp, block.prevrandao));

        _investments[investmentId] = Investment({
            id: investmentId,
            dealId: dealId,
            investor: investorAddress,
            units: units,
            amount: msg.value,
            timestamp: block.timestamp,
            status: InvestmentStatus.Pending
        });

        _investmentIds.push(investmentId);
        _investorInvestments[investorAddress].push(investmentId);

        totalInvested += msg.value;
        totalUnits += units;

        escrow.fund{value: msg.value}(dealId);
        dealFactory.updateTotalInvested(dealId, msg.value);

        emit InvestmentMade(investmentId, dealId, investorAddress, units, msg.value);
    }

    function confirmInvestment(bytes32 investmentId) external onlyRole(ORACLE_ROLE) {
        require(_investments[investmentId].id != bytes32(0), "DealContract: investment not found");
        require(
            _investments[investmentId].status == InvestmentStatus.Pending,
            "DealContract: investment not pending"
        );

        _investments[investmentId].status = InvestmentStatus.Confirmed;

        emit InvestmentConfirmed(investmentId);
    }

    function refundInvestment(bytes32 investmentId) external {
        Investment storage investment = _investments[investmentId];
        require(investment.id != bytes32(0), "DealContract: investment not found");
        require(
            investment.status == InvestmentStatus.Pending || investment.status == InvestmentStatus.Confirmed,
            "DealContract: cannot refund"
        );
        require(msg.sender == investment.investor || hasRole(OWNER_ROLE, msg.sender), "DealContract: not authorized");

        investment.status = InvestmentStatus.Refunded;
        totalInvested -= investment.amount;
        totalUnits -= investment.units;

        escrow.refund(investment.investor, investment.amount, dealId);

        emit InvestmentRefunded(investmentId);
    }

    function recordHarvest(
        uint256 quantity,
        bytes32 metadataHash
    ) external onlyFarmerOrOwner {
        require(quantity > 0, "DealContract: zero quantity");

        _harvests.push(HarvestRecord({
            quantity: quantity,
            metadataHash: metadataHash,
            timestamp: block.timestamp
        }));

        emit HarvestRecorded(_harvests.length - 1, quantity, metadataHash);
    }

    function recordRevenue(
        uint256 amount,
        bytes32 metadataHash
    ) external onlyFarmerOrOwner {
        require(amount > 0, "DealContract: zero amount");

        _revenues.push(RevenueRecord({
            amount: amount,
            metadataHash: metadataHash,
            timestamp: block.timestamp
        }));

        emit RevenueRecorded(_revenues.length - 1, amount, metadataHash);
    }

    function declareProfit(
        uint256 investorProfit,
        uint256 farmerProfit,
        uint256 platformFee
    ) external onlyFarmerOrOwner {
        require(!settled, "DealContract: already settled");
        require(
            investorProfit + farmerProfit + platformFee > 0,
            "DealContract: profit must be > 0"
        );

        emit ProfitDeclared(investorProfit, farmerProfit, platformFee);
    }

    function settle() external onlyRole(OWNER_ROLE) {
        require(!settled, "DealContract: already settled");
        settled = true;
        dealFactory.updateDealStatus(dealId, DealStatus.Settled);
        emit DealSettled();
    }

    function getInvestment(bytes32 investmentId) external view returns (Investment memory) {
        require(_investments[investmentId].id != bytes32(0), "DealContract: not found");
        return _investments[investmentId];
    }

    function getInvestorInvestments(address investor) external view returns (bytes32[] memory) {
        return _investorInvestments[investor];
    }

    function getInvestmentCount() external view returns (uint256) {
        return _investmentIds.length;
    }

    function getHarvestCount() external view returns (uint256) {
        return _harvests.length;
    }

    function getRevenueCount() external view returns (uint256) {
        return _revenues.length;
    }

    receive() external payable {}
}
