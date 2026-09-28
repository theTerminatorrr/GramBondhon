use std::env;
use alloy::primitives::Address;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub rpc_url: String,
    pub contract_address: Address,
    pub chain_id: u64,
    pub poll_interval_ms: u64,
    pub max_block_range: u64,
    pub reorg_buffer_blocks: u64,
}

impl Config {
    pub fn from_env() -> Result<Self, anyhow::Error> {
        let _ = dotenvy::dotenv();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/agrishare?schema=public".to_string());

        let redis_url = env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());

        let rpc_url = env::var("BLOCKCHAIN_RPC_URL")
            .unwrap_or_else(|_| "http://127.0.0.1:8545".to_string());

        let contract_addr_str = env::var("AGRI_PLATFORM_ADDRESS")
            .unwrap_or_else(|_| "0x4F129B515286F0dE0Ec43093224B4912953B8230".to_string());
        let contract_address: Address = contract_addr_str.parse()
            .unwrap_or(Address::ZERO);

        let chain_id = env::var("BLOCKCHAIN_CHAIN_ID")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(31337);

        let poll_interval_ms = env::var("INDEXER_POLL_INTERVAL_MS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(1500); // 1.5s fast polling in Rust (down from 4s in Node)

        let max_block_range = env::var("INDEXER_MAX_BLOCK_RANGE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(2000);

        let reorg_buffer_blocks = env::var("INDEXER_REORG_BUFFER_BLOCKS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(12);

        Ok(Self {
            database_url,
            redis_url,
            rpc_url,
            contract_address,
            chain_id,
            poll_interval_ms,
            max_block_range,
            reorg_buffer_blocks,
        })
    }
}
