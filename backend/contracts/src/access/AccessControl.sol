// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;
    mapping(bytes32 => bytes32) private _roleAdmin;

    address private _owner;
    bool private _paused;

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event Paused(bool paused);

    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "AccessControl: unauthorized");
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "AccessControl: paused");
        _;
    }

    constructor() {
        _owner = msg.sender;
        _grantRole(OWNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    function grantRole(bytes32 role, address account) public onlyRole(OWNER_ROLE) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public onlyRole(OWNER_ROLE) {
        _revokeRole(role, account);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _paused = true;
        emit Paused(true);
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _paused = false;
        emit Paused(false);
    }

    function paused() public view returns (bool) {
        return _paused;
    }

    function _grantRole(bytes32 role, address account) internal {
        if (!_roles[role][account]) {
            _roles[role][account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    function _revokeRole(bytes32 role, address account) internal {
        if (_roles[role][account]) {
            _roles[role][account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }
}
