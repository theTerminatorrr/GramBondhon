// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IProjectRegistry {
    function registerProject(bytes32 projectId, address farmer, bytes32 metadataHash) external;

    function verifyProject(bytes32 projectId, bool verified) external;

    function getProject(bytes32 projectId) external view returns (
        bytes32 id,
        address farmer,
        bytes32 metadataHash,
        bool verified,
        uint256 createdAt
    );

    function isProjectVerified(bytes32 projectId) external view returns (bool);

    function isProjectRegistered(bytes32 projectId) external view returns (bool);

    event ProjectRegistered(bytes32 indexed projectId, address indexed farmer, bytes32 metadataHash);

    event ProjectVerified(bytes32 indexed projectId, bool verified);
}
