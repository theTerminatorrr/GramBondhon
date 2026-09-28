mod config;
mod db;
mod events;
mod indexer;
mod rpc;

use std::sync::Arc;
use tracing::{error, info};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::config::Config;
use crate::db::Database;
use crate::indexer::IndexerService;
use crate::rpc::RpcClient;

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    // 1. Initialize Tracing Subscriber
    tracing_subscriber::registry()
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,gram_indexer=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("=======================================================");
    info!("  GramBondhon Blockchain Indexer (Rust / Paradigm Alloy) ");
    info!("=======================================================");

    // 2. Load Configuration
    let config = Arc::new(Config::from_env().map_err(|e| {
        error!(error = %e, "Failed to load environment configuration");
        e
    })?);

    info!(
        rpc_url = %config.rpc_url,
        contract = %config.contract_address,
        chain_id = config.chain_id,
        poll_interval_ms = config.poll_interval_ms,
        "Configuration initialized successfully"
    );

    // 3. Connect to Database Pool
    let db = Arc::new(Database::connect(&config.database_url).await.map_err(|e| {
        error!(error = %e, "Database connection failure");
        e
    })?);

    // 4. Initialize Alloy RPC Provider
    let rpc = Arc::new(RpcClient::new(&config.rpc_url).map_err(|e| {
        error!(error = %e, "RPC Provider initialization failure");
        e
    })?);

    // 5. Instantiate Indexer Service
    let indexer = IndexerService::new(
        Arc::clone(&config),
        Arc::clone(&db),
        Arc::clone(&rpc),
    );

    // 6. Run Indexer with Graceful Shutdown on SIGINT / Ctrl+C
    tokio::select! {
        res = indexer.run() => {
            if let Err(e) = res {
                error!(error = %e, "Indexer terminated with error");
                return Err(e);
            }
        }
        _ = tokio::signal::ctrl_c() => {
            info!("Shutdown signal received (Ctrl+C). Flushing state and exiting gracefully...");
        }
    }

    info!("GramBondhon Indexer stopped cleanly.");
    Ok(())
}
