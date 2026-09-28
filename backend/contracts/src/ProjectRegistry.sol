// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../access/AccessControl.sol";
import "../interfaces/IProjectRegistry.sol";
import "../libraries/Types.sol";

contract ProjectRegistry is AccessControl, IProjectRegistry {
    mapping(bytes32 => Project) private _projects;

    function registerProject(
        bytes32 projectId,
        address farmer,
        bytes32 metadataHash
    ) external override whenNotPaused {
        require(projectId != bytes32(0), "ProjectRegistry: invalid project ID");
        require(farmer != address(0), "ProjectRegistry: zero address farmer");
        require(
            _projects[projectId].createdAt == 0,
            "ProjectRegistry: already registered"
        );

        _projects[projectId] = Project({
            id: projectId,
            farmer: farmer,
            metadataHash: metadataHash,
            verified: false,
            createdAt: block.timestamp
        });

        emit ProjectRegistered(projectId, farmer, metadataHash);
    }

    function verifyProject(
        bytes32 projectId,
        bool verified
    ) external override onlyRole(ORACLE_ROLE) {
        require(_projects[projectId].createdAt != 0, "ProjectRegistry: not found");

        _projects[projectId].verified = verified;

        emit ProjectVerified(projectId, verified);
    }

    function getProject(
        bytes32 projectId
    ) external view override returns (
        bytes32 id,
        address farmer,
        bytes32 metadataHash,
        bool verified,
        uint256 createdAt
    ) {
        Project storage project = _projects[projectId];
        require(project.createdAt != 0, "ProjectRegistry: not found");

        return (
            project.id,
            project.farmer,
            project.metadataHash,
            project.verified,
            project.createdAt
        );
    }

    function isProjectVerified(bytes32 projectId) external view override returns (bool) {
        return _projects[projectId].verified;
    }

    function isProjectRegistered(bytes32 projectId) external view override returns (bool) {
        return _projects[projectId].createdAt != 0;
    }
}
