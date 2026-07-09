CREATE TABLE IF NOT EXISTS icqr_sync_log (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL,
    synced_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icqr_sync_log_created_at ON icqr_sync_log (created_at DESC);
