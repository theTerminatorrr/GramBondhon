use std::sync::Arc;
use std::time::Duration;
use alloy::sol_types::SolEvent;
use redis::AsyncCommands;
use tokio::time::sleep;
use tracing::{debug, error, info, warn};

use crate::config::Config;
use crate::db::Database;
use crate::events::{
    EnrichedBlockchainEvent, FeeDeducted, FundsDeposited, FundsRefunded, FundsReleased,
    InvestmentMade, ProfitDeclared, ProfitDistributed,
};
use crate::rpc::RpcClient;

pub struct IndexerService {
    config: Arc<Config>,
    db: Arc<Database>,
    rpc: Arc<RpcClient>,
    redis_client: Option<redis::Client>,
}

impl IndexerService {
    pub fn new(
        config: Arc<Config>,
        db: Arc<Database>,
        rpc: Arc<RpcClient>,
    ) -> Self {
        let redis_client = redis::Client::open(config.redis_url.as_str()).ok();
        Self {
            config,
            db,
            rpc,
            redis_client,
        }
    }

    pub async fn run(&self) -> Result<(), anyhow::Error> {
        info!("Starting gram-indexer continuous processing loop...");

        // 1. Initial State Recovery
        let mut last_processed = match self.db.get_last_processed_block().await? {
            Some(b) => {
                info!(last_processed_block = b, "Recovered sync state from database");
                b
            }
            None => {
                let current = self.rpc.get_block_number().await.unwrap_or(0);
                let start = current.saturating_sub(self.config.reorg_buffer_blocks);
                info!(start_block = start, "No previous state found, starting from head");
                self.db.set_last_processed_block(start).await?;
                start
            }
        };

        let poll_interval = Duration::from_millis(self.config.poll_interval_ms);

        // 2. Continuous Block Polling & Streaming Loop
        loop {
            match self.rpc.get_block_number().await {
                Ok(current_head) => {
                    // Safe finalized height considering reorg buffer
                    let safe_head = current_head.saturating_sub(self.config.reorg_buffer_blocks);

                    if last_processed < safe_head {
                        let from_block = last_processed + 1;
                        let chunk_end = (from_block + self.config.max_block_range - 1).min(safe_head);

                        debug!(from_block, to_block = chunk_end, safe_head, "Processing block range");

                        match self.process_block_range(from_block, chunk_end).await {
                            Ok(events_count) => {
                                if events_count > 0 {
                                    info!(
                                        from_block,
                                        to_block = chunk_end,
                                        events_count,
                                        "Batch processed and persisted successfully"
                                    );
                                }
                                last_processed = chunk_end;
                                let _ = self.db.set_last_processed_block(chunk_end).await;
                            }
                            Err(e) => {
                                error!(error = %e, from_block, to_block = chunk_end, "Failed to process block range");
                            }
                        }
                    }
                }
                Err(e) => {
                    warn!(error = %e, "Blockchain RPC temporarily unreachable, retrying...");
                }
            }

            sleep(poll_interval).await;
        }
    }

    async fn process_block_range(&self, from_block: u64, to_block: u64) -> Result<usize, anyhow::Error> {
        let logs = self.rpc.fetch_logs(self.config.contract_address, from_block, to_block).await?;
        if logs.is_empty() {
            return Ok(0);
        }

        let mut enriched_events = Vec::new();

        for log in logs {
            let tx_hash = log.transaction_hash.map(|h| format!("{:#x}", h)).unwrap_or_default();
            let block_num = log.block_number.unwrap_or(0);
            let log_idx = log.log_index.unwrap_or(0) as u32;
            let contract_addr = format!("{:#x}", log.address());
            let event_id = format!("{}-{}", tx_hash, log_idx);

            // Decode against known smart contract event signatures
            if let Some((event_type, payload)) = Self::decode_log(&log) {
                enriched_events.push(EnrichedBlockchainEvent {
                    id: event_id,
                    event_type,
                    tx_hash,
                    block_number: block_num,
                    log_index: log_idx,
                    contract_address: contract_addr,
                    payload,
                    timestamp: chrono::Utc::now().timestamp(),
                });
            }
        }

        let count = enriched_events.len();
        if count > 0 {
            // Persist to PostgreSQL via SQLx
            self.db.insert_events(&enriched_events).await?;

            // Broadcast to Redis channel for NestJS subscriber
            self.publish_events_to_redis(&enriched_events).await;
        }

        Ok(count)
    }

    fn decode_log(log: &alloy::rpc::types::eth::Log) -> Option<(String, serde_json::Value)> {
        // Match topic0 against Solidity event selectors
        if let Ok(ev) = InvestmentMade::decode_log(log.as_ref(), true) {
            return Some((
                "investment.made".to_string(),
                serde_json::to_value(&ev.data).unwrap_or_default(),
            ));
        }
        if let Ok(ev) = FundsDeposited::decode_log(log.as_ref(), true) {
            return Some((
                "escrow.deposited".to_string(),
                serde_json::to_value(&ev.data).unwrap_or_default(),
            ));
        }
        if let Ok(ev) = FundsReleased::decode_log(log.as_ref(), true) {
            return Some((
                "escrow.released".to_string(),
                serde_json::to_value(&ev.data).unwrap_or_default(),
            ));
        }
        if let Ok(ev) = FundsRefunded::decode_log(log.as_ref(), true) {
            return Some((
                "escrow.refunded".to_string(),
                serde_json::to_value(&ev.data).unwrap_or_default(),
            ));
        }
        if let Ok(ev) = FeeDeducted::decode_log(log.as_ref(), true) {
            return Some((
                "escrow.fee".to_string(),
                serde_json::to_value(&ev.data).unwrap_or_default(),
            ));
        }
        if let Ok(ev) = ProfitDeclared::decode_log(log.as_ref(), true) {
            return Some((
                "profit.declared".to_string(),
                serde_json::to_value(&ev.data).unwrap_or_default(),
            ));
        }
        if let Ok(ev) = ProfitDistributed::decode_log(log.as_ref(), true) {
            return Some((
                "profit.distributed".to_string(),
                serde_json::to_value(&ev.data).unwrap_or_default(),
            ));
        }

        None
    }

    async fn publish_events_to_redis(&self, events: &[EnrichedBlockchainEvent]) {
        if let Some(client) = &self.redis_client {
            if let Ok(mut con) = client.get_multiplexed_async_connection().await {
                for ev in events {
                    if let Ok(payload_json) = serde_json::to_string(ev) {
                        let channel = format!("blockchain.{}", ev.event_type);
                        let _: Result<(), _> = con.publish(&channel, &payload_json).await;
                        let _: Result<(), _> = con.publish("blockchain.events", &payload_json).await;
                    }
                }
            }
        }
    }
}
