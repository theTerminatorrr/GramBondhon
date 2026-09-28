// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./access/AccessControl.sol";
import "./ProjectRegistry.sol";
import "./DealFactory.sol";
import "./DealContract.sol";
import "./Escrow.sol";
import "./ProfitDistribution.sol";
import "./Oracle.sol";
import "./libraries/Types.sol";

contract AgriPlatform is AccessControl {
    ProjectRegistry public immutable projectRegistry;
    DealFactory public immutable dealFactory;
    Escrow public immutable escrow;
    ProfitDistribution public immutable profitDistribution;
    Oracle public immutable oracle;

    mapping(bytes32 => address) private _dealContracts;

    event DealContractDeployed(bytes32 indexed dealId, address indexed contractAddress);

    constructor() {
        ProjectRegistry _projectRegistry = new ProjectRegistry();
        Escrow _escrow = new Escrow();
        DealFactory _dealFactory = new DealFactory(address(_projectRegistry));
        ProfitDistribution _profitDistribution = new ProfitDistribution(address(_escrow));
        Oracle _oracle = new Oracle();

        projectRegistry = _projectRegistry;
        dealFactory = _dealFactory;
        escrow = _escrow;
        profitDistribution = _profitDistribution;
        oracle = _oracle;

        grantRole(ORACLE_ROLE, address(_oracle));
        grantRole(ORACLE_ROLE, address(_dealFactory));

        grantRole(ORACLE_ROLE, address(_projectRegistry));
        grantRole(ORACLE_ROLE, address(_dealFactory));
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
    ) external returns (bytes32) {
        dealFactory.createDeal(
            projectId,
            dealId,
            termsHash,
            fundingTarget,
            investorShareBps,
            farmerShareBps,
            platformFeeBps,
            investmentUnits,
            unitPrice,
            startDate,
            endDate
        );

        DealContract dealContract = new DealContract(
            dealId,
            address(dealFactory),
            address(escrow)
        );

        _dealContracts[dealId] = address(dealContract);

        grantRole(ORACLE_ROLE, address(dealContract));

        emit DealContractDeployed(dealId, address(dealContract));
        return dealId;
    }

    function activateDeal(bytes32 dealId) external onlyRole(OWNER_ROLE) {
        dealFactory.activateDeal(dealId);
    }

    function registerProject(
        bytes32 projectId,
        address farmer,
        bytes32 metadataHash
    ) external {
        projectRegistry.registerProject(projectId, farmer, metadataHash);
    }

    function verifyProject(bytes32 projectId, bool verified) external onlyRole(ORACLE_ROLE) {
        projectRegistry.verifyProject(projectId, verified);
    }

    function submitAttestation(
        string calldata entityType,
        bytes32 entityId,
        bytes32 dataHash,
        string calldata data
    ) external returns (bytes32) {
        return oracle.submitAttestation(entityType, entityId, dataHash, data);
    }

    function getDealContract(bytes32 dealId) external view returns (address) {
        return _dealContracts[dealId];
    }

    function isDealContractDeployed(bytes32 dealId) external view returns (bool) {
        return _dealContracts[dealId] != address(0);
    }
}
