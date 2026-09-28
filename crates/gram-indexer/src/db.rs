use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use tracing::{error, info, warn};
use crate::events::EnrichedBlockchainEvent;

pub struct Database {
    pub pool: PgPool,
}

impl Database {
    pub async fn connect(database_url: &str) -> Result<Self, sqlx::Error> {
        info!("Connecting to PostgreSQL database...");
        let pool = PgPoolOptions::new()
            .max_connections(15)
            .min_connections(2)
            .acquire_timeout(std::time::Duration::from_secs(5))
            .connect(database_url)
            .await?;

        info!("PostgreSQL connection established successfully.");
        Ok(Self { pool })
    }

    /// Retrieve cursor from `blockchain_sync_state` or calculate from `blockchain_events`
    pub async fn get_last_processed_block(&self) -> Result<Option<u64>, sqlx::Error> {
        let row = sqlx::query("SELECT value FROM blockchain_sync_state WHERE key = 'last_processed_block'")
            .fetch_optional(&self.pool)
            .await?;

        if let Some(r) = row {
            let val: i64 = r.try_get("value")?;
            return Ok(Some(val as u64));
        }

        // Fallback to highest block in blockchain_events
        let fallback_row = sqlx::query("SELECT MAX(block_number) as max_block FROM blockchain_events WHERE processed = true")
            .fetch_optional(&self.pool)
            .await?;

        if let Some(r) = fallback_row {
            if let Ok(val) = r.try_get::<i64, _>("max_block") {
                return Ok(Some(val as u64));
            }
        }

        Ok(None)
    }

    /// Update `blockchain_sync_state` checkpoint
    pub async fn set_last_processed_block(&self, block_number: u64) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO blockchain_sync_state (key, value, updated_at)
            VALUES ('last_processed_block', $1, NOW())
            ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
            "#,
        )
        .bind(block_number as i64)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Batch insert multiple events atomically
    pub async fn insert_events(&self, events: &[EnrichedBlockchainEvent]) -> Result<usize, sqlx::Error> {
        if events.is_empty() {
            return Ok(0);
        }

        let mut tx = self.pool.begin().await?;
        let mut inserted_count = 0;

        for event in events {
            let result = sqlx::query(
                r#"
                INSERT INTO blockchain_events 
                    (id, event_type, tx_hash, block_number, log_index, contract_address, data, processed, created_at)
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, false, NOW())
                ON CONFLICT (id) DO NOTHING
                "#,
            )
            .bind(&event.id)
            .bind(&event.event_type)
            .bind(&event.tx_hash)
            .bind(event.block_number as i64)
            .bind(event.log_index as i32)
            .bind(&event.contract_address)
            .bind(&event.payload)
            .execute(&mut *tx)
            .await;

            match result {
                Ok(res) => {
                    if res.rows_affected() > 0 {
                        inserted_count += 1;
                    }
                }
                Err(e) => {
                    error!(event_id = %event.id, error = %e, "Failed to insert blockchain event into database");
                }
            }
        }

        tx.commit().await?;
        Ok(inserted_count)
    }

    /// Handle chain reorg: mark orphaned events as reorged and reset sync point
    pub async fn handle_reorg(&self, reorg_block: u64) -> Result<u64, sqlx::Error> {
        warn!(reorg_block, "Executing database reorg rollback");

        let result = sqlx::query(
            r#"
            UPDATE blockchain_events
            SET processed = false, reorged = true
            WHERE block_number >= $1
            "#,
        )
        .bind(reorg_block as i64)
        .execute(&self.pool)
        .await?;

        let affected = result.rows_affected();
        info!(reorg_block, affected_events = affected, "Orphaned events marked as reorged");

        // Set checkpoint back to block prior to reorg
        let safe_block = reorg_block.saturating_sub(1);
        self.set_last_processed_block(safe_block).await?;

        Ok(affected)
    }
}
