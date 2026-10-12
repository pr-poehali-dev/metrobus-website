CREATE TABLE IF NOT EXISTS icqr_attempts_cache (
    icqr_id INTEGER PRIMARY KEY,
    data JSONB NOT NULL,
    fetched_at TIMESTAMP NOT NULL DEFAULT now()
);