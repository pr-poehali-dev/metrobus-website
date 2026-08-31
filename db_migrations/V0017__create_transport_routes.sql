CREATE TABLE IF NOT EXISTS transport_routes (
    id SERIAL PRIMARY KEY,
    icqr_route_id integer NULL,
    route_number text NOT NULL,
    title text NULL,
    transport_type text NOT NULL DEFAULT '',
    synced_at timestamp NOT NULL DEFAULT now(),
    UNIQUE (route_number, transport_type)
);

CREATE INDEX IF NOT EXISTS idx_transport_routes_route_number ON transport_routes (route_number);
