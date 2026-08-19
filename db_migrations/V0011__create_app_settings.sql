CREATE TABLE IF NOT EXISTS app_settings (
    key varchar(64) PRIMARY KEY,
    value text NULL,
    updated_at timestamp NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value)
VALUES ('stats_collection_started_at', NULL)
ON CONFLICT (key) DO NOTHING;