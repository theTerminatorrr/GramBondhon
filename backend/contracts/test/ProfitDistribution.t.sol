// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ProfitDistribution.sol";
import "../src/Escrow.sol";
import "../src/access/AccessControl.sol";

contract MockDealFactory {
    struct DealInfo {
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
        uint8 status;
        bytes32 termsHash;
    }

    mapping(bytes32 => DealInfo) public deals;

    function setDeal(bytes32 dealId, address farmer) external {
        deals[dealId] = DealInfo({
            id: dealId,
            projectId: keccak256("project"),
            farmer: farmer,
            fundingTarget: 10 ether,
            totalInvested: 10 ether,
            investorShareBps: 7000,
            farmerShareBps: 2500,
            platformFeeBps: 500,
            investmentUnits: 100,
            unitPrice: 0.1 ether,
            startDate: block.timestamp,
            endDate: block.timestamp + 30 days,
            status: 4,
            termsHash: keccak256("terms")
        });
    }

    function getDeal(bytes32 dealId) external view returns (
        bytes32, bytes32, address, uint256, uint256,
        uint256, uint256, uint256, uint256, uint256,
        uint256, uint256, uint8, bytes32
    ) {
        DealInfo storage d = deals[dealId];
        return (
            d.id, d.projectId, d.farmer, d.fundingTarget, d.totalInvested,
            d.investorShareBps, d.farmerShareBps, d.platformFeeBps,
            d.investmentUnits, d.unitPrice, d.startDate, d.endDate,
            d.status, d.termsHash
        );
    }
}

contract ProfitDistributionTest is Test {
    Escrow public escrow;
    ProfitDistribution public profitDistribution;
    MockDealFactory public mockDealFactory;

    address public owner;
    address public oracle;
    address public farmer;
    address public platform;
    address[] public investors;

    bytes32 constant DEAL_ID = keccak256("deal-1");
    bytes32 constant PROFIT_CALC_ID = keccak256("profit-calc-1");

    event ProfitCalculated(bytes32 indexed profitCalculationId, bytes32 indexed dealId, uint256 totalProfit);
    event ProfitDistributed(bytes32 indexed dealId, address indexed investor, uint256 amount);

    function setUp() public {
        owner = address(this);
        oracle = makeAddr("oracle");
        farmer = makeAddr("farmer");
        platform = makeAddr("platform");

        investors.push(makeAddr("investor1"));
        investors.push(makeAddr("investor2"));

        escrow = new Escrow();
        escrow.grantRole(ORACLE_ROLE, oracle);

        mockDealFactory = new MockDealFactory();
        mockDealFactory.setDeal(DEAL_ID, farmer);

        profitDistribution = new ProfitDistribution(address(escrow));
        profitDistribution.grantRole(ORACLE_ROLE, oracle);
    }

    function _fundEscrow(uint256 amount) internal {
        vm.deal(address(escrow), amount);
        vm.prank(oracle);
        escrow.fund{value: amount}(DEAL_ID);
    }

    function testCalculateAndDistribute() public {
        _fundEscrow(10 ether);

        address[] memory addrs = new address[](2);
        addrs[0] = investors[0];
        addrs[1] = investors[1];

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 3 ether;
        amounts[1] = 2 ether;

        uint256 farmerBalanceBefore = farmer.balance;
        uint256 platformBalanceBefore = platform.balance;

        vm.prank(oracle);
        profitDistribution.calculateAndDistribute(
            PROFIT_CALC_ID,
            DEAL_ID,
            addrs,
            amounts,
            4 ether,
            1 ether
        );

        uint256 totalDistributed = 3 ether + 2 ether + 4 ether + 1 ether;
        assertEq(escrow.getDealBalance(DEAL_ID), 10 ether - totalDistributed);
    }

    function testDistributeProfit() public {
        _fundEscrow(5 ether);

        uint256 investorBalanceBefore = investors[0].balance;

        vm.prank(oracle);
        profitDistribution.distributeProfit(investors[0], 2 ether, DEAL_ID);

        assertEq(investors[0].balance - investorBalanceBefore, 2 ether);
        assertEq(escrow.getDealBalance(DEAL_ID), 3 ether);
    }

    function testCalculateAndDistributeEmitEvents() public {
        _fundEscrow(10 ether);

        address[] memory addrs = new address[](1);
        addrs[0] = investors[0];

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 5 ether;

        vm.expectEmit(true, true, false, true);
        emit ProfitCalculated(PROFIT_CALC_ID, DEAL_ID, 10 ether);

        vm.prank(oracle);
        profitDistribution.calculateAndDistribute(
            PROFIT_CALC_ID,
            DEAL_ID,
            addrs,
            amounts,
            4 ether,
            1 ether
        );
    }

    function testDistributeProfitEmitEvent() public {
        _fundEscrow(5 ether);

        vm.expectEmit(true, true, false, true);
        emit ProfitDistributed(DEAL_ID, investors[0], 2 ether);

        vm.prank(oracle);
        profitDistribution.distributeProfit(investors[0], 2 ether, DEAL_ID);
    }

    function testGetProfitSplit() public {
        _fundEscrow(10 ether);

        address[] memory addrs = new address[](1);
        addrs[0] = investors[0];

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 5 ether;

        vm.prank(oracle);
        profitDistribution.calculateAndDistribute(
            PROFIT_CALC_ID,
            DEAL_ID,
            addrs,
            amounts,
            4 ether,
            1 ether
        );

        (uint256 totalProfit, uint256 investorShare, uint256 farmerShare, uint256 fee, bool distributed) =
            profitDistribution.getProfitSplit(DEAL_ID);

        assertEq(totalProfit, 10 ether);
        assertEq(investorShare, 5 ether);
        assertEq(farmerShare, 4 ether);
        assertEq(fee, 1 ether);
        assertTrue(distributed);
    }

    function testGetInvestorPaidAmount() public {
        _fundEscrow(5 ether);

        vm.prank(oracle);
        profitDistribution.distributeProfit(investors[0], 2 ether, DEAL_ID);

        uint256 paid = profitDistribution.getInvestorPaidAmount(DEAL_ID, investors[0]);
        assertEq(paid, 2 ether);
    }

    function testUnauthorizedAccess() public {
        _fundEscrow(5 ether);

        address[] memory addrs = new address[](1);
        addrs[0] = investors[0];

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 2 ether;

        vm.prank(makeAddr("unauthorized"));
        vm.expectRevert("ProfitDistribution: not authorized");
        profitDistribution.calculateAndDistribute(
            PROFIT_CALC_ID,
            DEAL_ID,
            addrs,
            amounts,
            2 ether,
            1 ether
        );
    }

    function testLengthMismatchReverts() public {
        _fundEscrow(5 ether);

        address[] memory addrs = new address[](2);
        addrs[0] = investors[0];
        addrs[1] = investors[1];

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 2 ether;

        vm.prank(oracle);
        vm.expectRevert("ProfitDistribution: length mismatch");
        profitDistribution.calculateAndDistribute(
            PROFIT_CALC_ID,
            DEAL_ID,
            addrs,
            amounts,
            2 ether,
            1 ether
        );
    }

    function testZeroAmountReverts() public {
        _fundEscrow(5 ether);

        address[] memory addrs = new address[](1);
        addrs[0] = investors[0];

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 0;

        vm.prank(oracle);
        vm.expectRevert("ProfitDistribution: zero amount");
        profitDistribution.calculateAndDistribute(
            PROFIT_CALC_ID,
            DEAL_ID,
            addrs,
            amounts,
            5 ether,
            0
        );
    }
}
