// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/access/AccessControl.sol";

contract EscrowTest is Test {
    Escrow public escrow;
    address public owner;
    address public oracle;
    address public investor;
    address public farmer;
    address public platform;

    bytes32 constant DEAL_ID = keccak256("deal-1");

    event FundsDeposited(bytes32 indexed dealId, address indexed investor, uint256 amount);
    event FundsReleased(bytes32 indexed dealId, address indexed to, uint256 amount);
    event FundsRefunded(bytes32 indexed dealId, address indexed investor, uint256 amount);
    event FeeDeducted(bytes32 indexed dealId, address indexed platform, uint256 amount);

    function setUp() public {
        owner = address(this);
        oracle = makeAddr("oracle");
        investor = makeAddr("investor");
        farmer = makeAddr("farmer");
        platform = makeAddr("platform");

        escrow = new Escrow();
        escrow.grantRole(ORACLE_ROLE, oracle);
    }

    function testFund() public {
        vm.deal(investor, 10 ether);

        vm.prank(investor);
        escrow.fund{value: 5 ether}(DEAL_ID);

        assertEq(escrow.getBalance(), 5 ether, "total balance wrong");
        assertEq(escrow.getDealBalance(DEAL_ID), 5 ether, "deal balance wrong");
    }

    function testFundZeroValue() public {
        vm.prank(investor);
        vm.expectRevert("Escrow: zero value");
        escrow.fund{value: 0}(DEAL_ID);
    }

    function testFundMultipleDeposits() public {
        vm.deal(investor, 10 ether);

        vm.prank(investor);
        escrow.fund{value: 3 ether}(DEAL_ID);

        vm.prank(investor);
        escrow.fund{value: 2 ether}(DEAL_ID);

        assertEq(escrow.getBalance(), 5 ether);
        assertEq(escrow.getDealBalance(DEAL_ID), 5 ether);
    }

    function testRelease() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        uint256 farmerBalanceBefore = farmer.balance;

        vm.prank(oracle);
        escrow.release(farmer, 3 ether, DEAL_ID);

        assertEq(escrow.getBalance(), 2 ether);
        assertEq(farmer.balance - farmerBalanceBefore, 3 ether);
    }

    function testRefund() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        uint256 investorBalanceBefore = investor.balance;

        vm.prank(oracle);
        escrow.refund(investor, 2 ether, DEAL_ID);

        assertEq(escrow.getBalance(), 3 ether);
        assertEq(investor.balance - investorBalanceBefore, 2 ether);
    }

    function testUnauthorizedRelease() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        vm.prank(makeAddr("unauthorized"));
        vm.expectRevert("Escrow: not authorized");
        escrow.release(farmer, 3 ether, DEAL_ID);
    }

    function testUnauthorizedRefund() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        vm.prank(makeAddr("unauthorized"));
        vm.expectRevert("Escrow: not authorized");
        escrow.refund(investor, 2 ether, DEAL_ID);
    }

    function testDeductFee() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        uint256 platformBalanceBefore = platform.balance;

        vm.prank(oracle);
        escrow.deductFee(platform, 1 ether, DEAL_ID);

        assertEq(escrow.getBalance(), 4 ether);
        assertEq(platform.balance - platformBalanceBefore, 1 ether);
    }

    function testDeductFeeUnauthorized() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        vm.prank(makeAddr("unauthorized"));
        vm.expectRevert("Escrow: not authorized");
        escrow.deductFee(platform, 1 ether, DEAL_ID);
    }

    function testReleaseInsufficientBalance() public {
        vm.deal(address(escrow), 2 ether);

        vm.prank(oracle);
        escrow.fund{value: 2 ether}(DEAL_ID);

        vm.prank(oracle);
        vm.expectRevert("Escrow: insufficient balance");
        escrow.release(farmer, 5 ether, DEAL_ID);
    }

    function testEmitFundsDeposited() public {
        vm.deal(investor, 10 ether);

        vm.expectEmit(true, true, false, true);
        emit FundsDeposited(DEAL_ID, investor, 5 ether);
        vm.prank(investor);
        escrow.fund{value: 5 ether}(DEAL_ID);
    }

    function testEmitFundsReleased() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        vm.expectEmit(true, true, false, true);
        emit FundsReleased(DEAL_ID, farmer, 3 ether);
        vm.prank(oracle);
        escrow.release(farmer, 3 ether, DEAL_ID);
    }

    function testEmitFundsRefunded() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        vm.expectEmit(true, true, false, true);
        emit FundsRefunded(DEAL_ID, investor, 2 ether);
        vm.prank(oracle);
        escrow.refund(investor, 2 ether, DEAL_ID);
    }

    function testEmitFeeDeducted() public {
        vm.deal(address(escrow), 5 ether);

        vm.prank(oracle);
        escrow.fund{value: 5 ether}(DEAL_ID);

        vm.expectEmit(true, true, false, true);
        emit FeeDeducted(DEAL_ID, platform, 1 ether);
        vm.prank(oracle);
        escrow.deductFee(platform, 1 ether, DEAL_ID);
    }

    function testOwnerCanRelease() public {
        vm.deal(address(escrow), 5 ether);

        escrow.fund{value: 5 ether}(DEAL_ID);

        escrow.release(farmer, 3 ether, DEAL_ID);

        assertEq(escrow.getBalance(), 2 ether);
    }

    function testReceiveRejects() public {
        vm.deal(address(this), 1 ether);
        (bool success, ) = address(escrow).call{value: 1 ether}("");
        assertFalse(success, "should reject direct ETH");
    }
}
