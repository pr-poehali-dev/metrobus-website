CREATE TABLE IF NOT EXISTS city_votes (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    ip VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_city_votes_city ON city_votes (city);
CREATE UNIQUE INDEX IF NOT EXISTS idx_city_votes_city_ip ON city_votes (city, ip);
