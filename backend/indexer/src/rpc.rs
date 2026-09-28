use alloy::primitives::Address;
use alloy::providers::{Provider, ProviderBuilder, RootProvider};
use alloy::rpc::types::eth::Filter;
use alloy::transports::http::{Client, Http};
use anyhow::Context;
use tracing::{debug, error, info};
use url::Url;

pub struct RpcClient {
    provider: RootProvider<Http<Client>>,
}

impl RpcClient {
    pub fn new(rpc_url: &str) -> Result<Self, anyhow::Error> {
        let url: Url = rpc_url.parse().context("Invalid RPC URL")?;
        let provider = ProviderBuilder::new().on_http(url);
        info!(rpc_url, "Alloy EVM RPC Provider initialized");
        Ok(Self { provider })
    }

    pub async fn get_block_number(&self) -> Result<u64, anyhow::Error> {
        match self.provider.get_block_number().await {
            Ok(n) => Ok(n),
            Err(e) => {
                error!(error = %e, "Failed to get latest block number from RPC");
                Err(anyhow::anyhow!(e))
            }
        }
    }

    pub async fn fetch_logs(
        &self,
        contract: Address,
        from_block: u64,
        to_block: u64,
    ) -> Result<Vec<alloy::rpc::types::eth::Log>, anyhow::Error> {
        debug!(from_block, to_block, %contract, "Fetching logs over block range");

        let filter = Filter::new()
            .address(contract)
            .from_block(from_block)
            .to_block(to_block);

        let logs = self.provider.get_logs(&filter).await?;
        Ok(logs)
    }
}
