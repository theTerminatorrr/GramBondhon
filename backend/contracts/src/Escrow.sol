// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../access/AccessControl.sol";
import "../interfaces/IEscrow.sol";
import "../libraries/Types.sol";

contract Escrow is AccessControl, IEscrow {
    mapping(bytes32 => uint256) private _dealBalances;
    uint256 private _totalBalance;

    modifier onlyAuthorized(bytes32 dealId) {
        require(
            hasRole(ORACLE_ROLE, msg.sender) || hasRole(OWNER_ROLE, msg.sender),
            "Escrow: not authorized"
        );
        _;
    }

    function fund(bytes32 dealId) external payable override whenNotPaused {
        require(msg.value > 0, "Escrow: zero value");
        require(dealId != bytes32(0), "Escrow: invalid deal ID");

        _dealBalances[dealId] += msg.value;
        _totalBalance += msg.value;

        emit FundsDeposited(dealId, msg.sender, msg.value);
    }

    function release(
        address to,
        uint256 amount,
        bytes32 dealId
    ) external override onlyAuthorized(dealId) {
        require(to != address(0), "Escrow: zero address");
        require(amount > 0, "Escrow: zero amount");
        require(_dealBalances[dealId] >= amount, "Escrow: insufficient balance");

        _dealBalances[dealId] -= amount;
        _totalBalance -= amount;

        (bool success, ) = to.call{value: amount}("");
        require(success, "Escrow: transfer failed");

        emit FundsReleased(dealId, to, amount);
    }

    function refund(
        address investor,
        uint256 amount,
        bytes32 dealId
    ) external override onlyAuthorized(dealId) {
        require(investor != address(0), "Escrow: zero address");
        require(amount > 0, "Escrow: zero amount");
        require(_dealBalances[dealId] >= amount, "Escrow: insufficient balance");

        _dealBalances[dealId] -= amount;
        _totalBalance -= amount;

        (bool success, ) = investor.call{value: amount}("");
        require(success, "Escrow: refund failed");

        emit FundsRefunded(dealId, investor, amount);
    }

    function deductFee(
        address platform,
        uint256 amount,
        bytes32 dealId
    ) external override onlyAuthorized(dealId) {
        require(platform != address(0), "Escrow: zero address");
        require(amount > 0, "Escrow: zero amount");
        require(_dealBalances[dealId] >= amount, "Escrow: insufficient balance");

        _dealBalances[dealId] -= amount;
        _totalBalance -= amount;

        (bool success, ) = platform.call{value: amount}("");
        require(success, "Escrow: fee transfer failed");

        emit FeeDeducted(dealId, platform, amount);
    }

    function getBalance() external view override returns (uint256) {
        return _totalBalance;
    }

    function getDealBalance(bytes32 dealId) external view override returns (uint256) {
        return _dealBalances[dealId];
    }

    receive() external payable {
        revert("Escrow: use fund()");
    }
}
