// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ProjectRegistry.sol";
import "../src/DealFactory.sol";
import "../src/libraries/Types.sol";

contract DealFactoryTest is Test {
    ProjectRegistry public projectRegistry;
    DealFactory public dealFactory;
    address public owner;
    address public oracle;
    address public farmer;

    bytes32 constant PROJECT_ID = keccak256("project-1");
    bytes32 constant DEAL_ID = keccak256("deal-1");
    bytes32 constant METADATA_HASH = keccak256("ipfs://Qm123");
    bytes32 constant TERMS_HASH = keccak256("ipfs://terms");

    event DealCreated(bytes32 indexed dealId, bytes32 indexed projectId, address indexed farmer);
    event DealActivated(bytes32 indexed dealId);

    function setUp() public {
        owner = address(this);
        oracle = makeAddr("oracle");
        farmer = makeAddr("farmer");

        projectRegistry = new ProjectRegistry();
        dealFactory = new DealFactory(address(projectRegistry));

        projectRegistry.grantRole(ORACLE_ROLE, oracle);
        dealFactory.grantRole(ORACLE_ROLE, oracle);
    }

    function _createAndActivateDeal() internal {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        projectRegistry.verifyProject(PROJECT_ID, true);

        vm.prank(farmer);
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2500,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );

        dealFactory.activateDeal(DEAL_ID);
    }

    function testCreateDeal() public {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        projectRegistry.verifyProject(PROJECT_ID, true);

        vm.prank(farmer);
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2500,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );

        uint8 status = dealFactory.getStatus(DEAL_ID);
        assertEq(status, uint8(DealStatus.Draft), "status should be Draft");
    }

    function testCreateDealUnverifiedProject() public {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(farmer);
        vm.expectRevert("DealFactory: project not verified");
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2500,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );
    }

    function testCreateDealInvalidShares() public {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        projectRegistry.verifyProject(PROJECT_ID, true);

        vm.prank(farmer);
        vm.expectRevert("DealFactory: shares must sum to 100%");
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2000,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );
    }

    function testActivateDeal() public {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        projectRegistry.verifyProject(PROJECT_ID, true);

        vm.prank(farmer);
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2500,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );

        dealFactory.activateDeal(DEAL_ID);

        uint8 status = dealFactory.getStatus(DEAL_ID);
        assertEq(status, uint8(DealStatus.Funding), "status should be Funding");
    }

    function testActivateDealNotDraft() public {
        _createAndActivateDeal();

        vm.expectRevert("DealFactory: invalid status");
        dealFactory.activateDeal(DEAL_ID);
    }

    function testActivateDealUnauthorized() public {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        projectRegistry.verifyProject(PROJECT_ID, true);

        vm.prank(farmer);
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2500,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );

        vm.prank(makeAddr("unauthorized"));
        vm.expectRevert("AccessControl: unauthorized");
        dealFactory.activateDeal(DEAL_ID);
    }

    function testGetDeal() public {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        projectRegistry.verifyProject(PROJECT_ID, true);

        vm.prank(farmer);
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2500,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );

        (
            bytes32 id,
            bytes32 projectId,
            address dealFarmer,
            uint256 fundingTarget,
            ,
            uint256 investorShareBps,
            uint256 farmerShareBps,
            uint256 platformFeeBps,
            uint256 investmentUnits,
            uint256 unitPrice,
            ,
            ,
            uint8 status,
            bytes32 termsHash
        ) = dealFactory.getDeal(DEAL_ID);

        assertEq(id, DEAL_ID);
        assertEq(projectId, PROJECT_ID);
        assertEq(dealFarmer, farmer);
        assertEq(fundingTarget, 10 ether);
        assertEq(investorShareBps, 7000);
        assertEq(farmerShareBps, 2500);
        assertEq(platformFeeBps, 500);
        assertEq(investmentUnits, 100);
        assertEq(unitPrice, 0.1 ether);
        assertEq(status, uint8(DealStatus.Draft));
        assertEq(termsHash, TERMS_HASH);
    }

    function testEmitDealCreated() public {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        projectRegistry.verifyProject(PROJECT_ID, true);

        vm.expectEmit(true, true, true, true);
        emit DealCreated(DEAL_ID, PROJECT_ID, farmer);
        vm.prank(farmer);
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2500,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );
    }

    function testEmitDealActivated() public {
        projectRegistry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        projectRegistry.verifyProject(PROJECT_ID, true);

        vm.prank(farmer);
        dealFactory.createDeal(
            PROJECT_ID,
            DEAL_ID,
            TERMS_HASH,
            10 ether,
            7000,
            2500,
            500,
            100,
            0.1 ether,
            block.timestamp,
            block.timestamp + 30 days
        );

        vm.expectEmit(true, false, false, true);
        emit DealActivated(DEAL_ID);
        dealFactory.activateDeal(DEAL_ID);
    }
}
