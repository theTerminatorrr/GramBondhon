// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./access/AccessControl.sol";

contract Oracle is AccessControl {
    struct Attestation {
        bytes32 id;
        string entityType;
        bytes32 entityId;
        bytes32 dataHash;
        string data;
        address attestor;
        bool verified;
        uint256 timestamp;
    }

    mapping(bytes32 => Attestation) private _attestations;
    bytes32[] private _attestationIds;
    mapping(bytes32 => bytes32[]) private _entityAttestations;

    event AttestationSubmitted(
        bytes32 indexed attestationId,
        string entityType,
        bytes32 indexed entityId,
        bytes32 dataHash
    );
    event AttestationVerified(bytes32 indexed attestationId, bool verified);

    modifier onlyAttestor() {
        require(
            hasRole(ORACLE_ROLE, msg.sender) || hasRole(OWNER_ROLE, msg.sender),
            "Oracle: not attestor"
        );
        _;
    }

    function submitAttestation(
        string calldata entityType,
        bytes32 entityId,
        bytes32 dataHash,
        string calldata data
    ) external onlyAttestor returns (bytes32) {
        require(bytes(entityType).length > 0, "Oracle: empty entity type");
        require(entityId != bytes32(0), "Oracle: zero entity ID");
        require(dataHash != bytes32(0), "Oracle: zero data hash");

        bytes32 attestationId = keccak256(
            abi.encodePacked(entityType, entityId, dataHash, block.timestamp, block.prevrandao)
        );

        _attestations[attestationId] = Attestation({
            id: attestationId,
            entityType: entityType,
            entityId: entityId,
            dataHash: dataHash,
            data: data,
            attestor: msg.sender,
            verified: false,
            timestamp: block.timestamp
        });

        _attestationIds.push(attestationId);
        _entityAttestations[entityId].push(attestationId);

        emit AttestationSubmitted(attestationId, entityType, entityId, dataHash);
        return attestationId;
    }

    function verifyAttestation(bytes32 attestationId) external onlyAttestor {
        require(
            _attestations[attestationId].id != bytes32(0),
            "Oracle: attestation not found"
        );
        require(!_attestations[attestationId].verified, "Oracle: already verified");

        _attestations[attestationId].verified = true;

        emit AttestationVerified(attestationId, true);
    }

    function getAttestation(
        bytes32 attestationId
    ) external view returns (
        bytes32 id,
        string memory entityType,
        bytes32 entityId,
        bytes32 dataHash,
        string memory data,
        address attestor,
        bool verified,
        uint256 timestamp
    ) {
        Attestation storage att = _attestations[attestationId];
        require(att.id != bytes32(0), "Oracle: not found");

        return (
            att.id,
            att.entityType,
            att.entityId,
            att.dataHash,
            att.data,
            att.attestor,
            att.verified,
            att.timestamp
        );
    }

    function isAttestationVerified(bytes32 attestationId) external view returns (bool) {
        return _attestations[attestationId].verified;
    }

    function getEntityAttestations(bytes32 entityId) external view returns (bytes32[] memory) {
        return _entityAttestations[entityId];
    }

    function getAttestationCount() external view returns (uint256) {
        return _attestationIds.length;
    }

    function getAttestationsByType(
        string calldata entityType
    ) external view returns (bytes32[] memory) {
        bytes32[] memory results = new bytes32[](_attestationIds.length);
        uint256 count = 0;
        for (uint256 i = 0; i < _attestationIds.length; i++) {
            if (keccak256(abi.encodePacked(_attestations[_attestationIds[i]].entityType)) ==
                keccak256(abi.encodePacked(entityType)))
            {
                results[count] = _attestationIds[i];
                count++;
            }
        }
        bytes32[] memory filtered = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            filtered[i] = results[i];
        }
        return filtered;
    }
}
