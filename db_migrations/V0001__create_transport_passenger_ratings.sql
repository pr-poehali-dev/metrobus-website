CREATE TABLE IF NOT EXISTS transport_passenger_ratings (
    id SERIAL PRIMARY KEY,
    icqr_id INTEGER UNIQUE NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    route_number TEXT,
    transport_type TEXT,
    direction_name TEXT,
    nearest_stop_name TEXT,
    stop_to_name TEXT,
    rated_at TIMESTAMP NOT NULL,
    synced_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tpr_rated_at ON transport_passenger_ratings (rated_at);
CREATE INDEX IF NOT EXISTS idx_tpr_transport_type ON transport_passenger_ratings (transport_type);
