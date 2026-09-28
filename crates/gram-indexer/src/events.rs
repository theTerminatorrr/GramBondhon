use alloy::sol;
use serde::{Deserialize, Serialize};

// Generate typed event decoders using Alloy's compile-time sol! macro
sol! {
    #[derive(Debug, Serialize, Deserialize)]
    event InvestmentMade(
        bytes32 indexed investmentId,
        bytes32 indexed dealId,
        address indexed investor,
        uint256 units,
        uint256 amount
    );

    #[derive(Debug, Serialize, Deserialize)]
    event FundsDeposited(
        bytes32 indexed dealId,
        address indexed investor,
        uint256 amount
    );

    #[derive(Debug, Serialize, Deserialize)]
    event FundsReleased(
        bytes32 indexed dealId,
        address indexed to,
        uint256 amount
    );

    #[derive(Debug, Serialize, Deserialize)]
    event FundsRefunded(
        bytes32 indexed dealId,
        address indexed investor,
        uint256 amount
    );

    #[derive(Debug, Serialize, Deserialize)]
    event FeeDeducted(
        bytes32 indexed dealId,
        address indexed platform,
        uint256 amount
    );

    #[derive(Debug, Serialize, Deserialize)]
    event ProfitDeclared(
        uint256 investorProfit,
        uint256 farmerProfit,
        uint256 platformFee
    );

    #[derive(Debug, Serialize, Deserialize)]
    event ProfitDistributed(
        bytes32 indexed dealId,
        address indexed investor,
        uint256 amount
    );
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnrichedBlockchainEvent {
    pub id: String,
    pub event_type: String,
    pub tx_hash: String,
    pub block_number: u64,
    pub log_index: u32,
    pub contract_address: String,
    pub payload: serde_json::Value,
    pub timestamp: i64,
}
