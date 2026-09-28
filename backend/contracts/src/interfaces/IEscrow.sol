// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEscrow {
    function fund(bytes32 dealId) external payable;

    function release(address to, uint256 amount, bytes32 dealId) external;

    function refund(address investor, uint256 amount, bytes32 dealId) external;

    function deductFee(address platform, uint256 amount, bytes32 dealId) external;

    function getBalance() external view returns (uint256);

    function getDealBalance(bytes32 dealId) external view returns (uint256);

    event FundsDeposited(bytes32 indexed dealId, address indexed investor, uint256 amount);

    event FundsReleased(bytes32 indexed dealId, address indexed to, uint256 amount);

    event FundsRefunded(bytes32 indexed dealId, address indexed investor, uint256 amount);

    event FeeDeducted(bytes32 indexed dealId, address indexed platform, uint256 amount);
}
