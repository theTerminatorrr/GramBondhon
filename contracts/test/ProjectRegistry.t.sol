// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ProjectRegistry.sol";
import "../src/access/AccessControl.sol";
import "../src/libraries/Types.sol";

contract ProjectRegistryTest is Test {
    ProjectRegistry public registry;
    address public owner;
    address public oracle;
    address public farmer;

    bytes32 constant PROJECT_ID = keccak256("project-1");
    bytes32 constant METADATA_HASH = keccak256("ipfs://Qm123");

    event ProjectRegistered(bytes32 indexed projectId, address indexed farmer, bytes32 metadataHash);
    event ProjectVerified(bytes32 indexed projectId, bool verified);

    function setUp() public {
        owner = address(this);
        oracle = makeAddr("oracle");
        farmer = makeAddr("farmer");

        registry = new ProjectRegistry();
        registry.grantRole(ORACLE_ROLE, oracle);
    }

    function testRegisterProject() public {
        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        (
            bytes32 id,
            address farmerAddr,
            bytes32 metadata,
            bool verified,
            uint256 createdAt
        ) = registry.getProject(PROJECT_ID);

        assertEq(id, PROJECT_ID, "project ID mismatch");
        assertEq(farmerAddr, farmer, "farmer mismatch");
        assertEq(metadata, METADATA_HASH, "metadata mismatch");
        assertFalse(verified, "should not be verified");
        assertGt(createdAt, 0, "createdAt should be set");
    }

    function testRegisterProjectUnauthorized() public {
        vm.prank(farmer);
        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.expectRevert("ProjectRegistry: already registered");
        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);
    }

    function testRegisterProjectInvalidInputs() public {
        vm.expectRevert("ProjectRegistry: invalid project ID");
        registry.registerProject(bytes32(0), farmer, METADATA_HASH);

        vm.expectRevert("ProjectRegistry: zero address farmer");
        registry.registerProject(PROJECT_ID, address(0), METADATA_HASH);
    }

    function testVerifyProject() public {
        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        registry.verifyProject(PROJECT_ID, true);

        assertTrue(registry.isProjectVerified(PROJECT_ID), "should be verified");
    }

    function testVerifyProjectUnverified() public {
        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(oracle);
        registry.verifyProject(PROJECT_ID, true);

        vm.prank(oracle);
        registry.verifyProject(PROJECT_ID, false);

        assertFalse(registry.isProjectVerified(PROJECT_ID), "should not be verified");
    }

    function testVerifyProjectUnauthorized() public {
        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.prank(makeAddr("unauthorized"));
        vm.expectRevert("AccessControl: unauthorized");
        registry.verifyProject(PROJECT_ID, true);
    }

    function testGetProjectNotFound() public {
        vm.expectRevert("ProjectRegistry: not found");
        registry.getProject(bytes32(0));
    }

    function testIsProjectRegistered() public {
        assertFalse(registry.isProjectRegistered(PROJECT_ID));

        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        assertTrue(registry.isProjectRegistered(PROJECT_ID));
    }

    function testEmitEvent() public {
        vm.expectEmit(true, true, false, true);
        emit ProjectRegistered(PROJECT_ID, farmer, METADATA_HASH);
        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);
    }

    function testEmitVerifyEvent() public {
        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);

        vm.expectEmit(true, false, false, true);
        emit ProjectVerified(PROJECT_ID, true);
        vm.prank(oracle);
        registry.verifyProject(PROJECT_ID, true);
    }

    function testMultipleProjects() public {
        bytes32 projectId2 = keccak256("project-2");

        registry.registerProject(PROJECT_ID, farmer, METADATA_HASH);
        registry.registerProject(projectId2, makeAddr("farmer2"), keccak256("ipfs://Qm456"));

        assertTrue(registry.isProjectRegistered(PROJECT_ID));
        assertTrue(registry.isProjectRegistered(projectId2));
    }
}
