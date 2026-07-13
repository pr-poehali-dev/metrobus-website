CREATE TABLE IF NOT EXISTS icqr_carriers (
    id integer PRIMARY KEY,
    name text NOT NULL,
    name_short text,
    synced_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS icqr_discounts (
    id serial PRIMARY KEY,
    icqr_discount_id integer UNIQUE NOT NULL,
    title text,
    promokod text,
    enabled boolean NOT NULL DEFAULT false,
    discount_value smallint,
    route_id integer,
    date_from date,
    date_to date,
    count_times integer,
    count_used integer,
    count_last_use timestamp,
    synced_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS icqr_tickets (
    id serial PRIMARY KEY,
    icqr_ticket_id bigint UNIQUE NOT NULL,
    created_at timestamp NOT NULL,
    carrier_id integer,
    carrier_name text,
    route_id integer,
    route_number text,
    vehicle_type text,
    vehicle_id integer,
    quantity smallint DEFAULT 1,
    route_price integer,
    discount_price integer,
    precom_price integer,
    bank_price integer,
    icqr_price integer,
    amount_price integer,
    payment_status text,
    payment_source text,
    payment_at timestamp,
    refunded_at timestamp,
    close_type text,
    closed_at timestamp,
    promokod text,
    discount_id integer,
    hidden boolean NOT NULL DEFAULT false,
    synced_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icqr_tickets_created_at ON icqr_tickets (created_at);
CREATE INDEX IF NOT EXISTS idx_icqr_tickets_payment_at ON icqr_tickets (payment_at);
CREATE INDEX IF NOT EXISTS idx_icqr_tickets_route_number ON icqr_tickets (route_number);
CREATE INDEX IF NOT EXISTS idx_icqr_tickets_carrier_id ON icqr_tickets (carrier_id);
CREATE INDEX IF NOT EXISTS idx_icqr_tickets_payment_status ON icqr_tickets (payment_status);

CREATE TABLE IF NOT EXISTS icqr_ticket_refunds (
    id serial PRIMARY KEY,
    icqr_id bigint UNIQUE NOT NULL,
    ticket_id bigint NOT NULL,
    type text,
    sum numeric(10,2),
    source text,
    created_at timestamp NOT NULL,
    synced_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icqr_ticket_refunds_created_at ON icqr_ticket_refunds (created_at);
CREATE INDEX IF NOT EXISTS idx_icqr_ticket_refunds_ticket_id ON icqr_ticket_refunds (ticket_id);

CREATE TABLE IF NOT EXISTS icqr_sales_sync_log (
    id serial PRIMARY KEY,
    status text NOT NULL,
    synced_count integer NOT NULL DEFAULT 0,
    error_message text,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icqr_sales_sync_log_created_at ON icqr_sales_sync_log (created_at);
